"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";

import { WIN_VALID_SECONDS, type RoundSettings } from "@/config/game";
import type { CheDoChoi } from "@/config/to-chuc";
import { T } from "@/config/locale";
import { chotLuot, moLuot, nhanDienNguoiChoi, roiDi, xinCho } from "@/app/actions/choi";
import { createSoundEngine } from "@/lib/am-thanh";
import { canStop, formatNumber } from "@/lib/bo-dem";
import { nhipCua, soTaiGiay, vongChay } from "@/lib/chon-so/vong-so";
import { doThoiDiemBam } from "@/lib/do-bam";
import { doLechDongHo } from "@/lib/dong-bo/dong-ho";
import { moKenh, type TinTrongPhong } from "@/lib/dong-bo/kenh";
import { vibrate, VIBRATE_PRESS, VIBRATE_WIN } from "@/lib/rung";
import { useClientString } from "@/lib/tren-may-khach";
import { Led4Digits } from "@/components/led-4-so";
import { LinhVatSata, LogoSata } from "@/components/nhan-dien-sata";

/**
 * Điện thoại phụ huynh trong game CHỌN SỐ — một NÚT BẤM có đóng dấu thời gian.
 *
 * Dãy số chạy trên màn hình LCD ở quầy; máy này chỉ đo đúng thời điểm ngón tay
 * chạm xuống. Mỗi ván ĐÚNG MỘT lần bấm, nên không có nút "bấm tiếp", không có
 * màn giữa ván, và không có thắng thua.
 */

type Buoc =
  | "dang-noi"
  | "ban"
  | "nhap-thong-tin"
  | "san-sang"
  | "cho-chay"
  | "dang-chay"
  | "ket-qua";

export interface ManDienThoaiChonSoProps {
  ma: string;
  tenTrungTam: string;
  tenDot: string;
  daiTu: number;
  daiDen: number;
  /**
   * Chế độ chơi. Máy này chỉ VẼ dãy số khi chế độ KHÁC `tai_quay` thuần —
   * ở quầy một màn thì hai bảng số trong một phòng là hai thứ để lệch nhau.
   */
  cheDo: CheDoChoi;
  coSoChon: { id: number; nhan: string }[] | null;
}

interface KetQuaHienThi {
  so: number;
  maXacThuc: string;
}

export function ManDienThoaiChonSo({
  ma,
  tenTrungTam,
  tenDot,
  daiTu,
  daiDen,
  cheDo,
  coSoChon,
}: ManDienThoaiChonSoProps) {
  const [buoc, setBuoc] = useState<Buoc>("dang-noi");
  const [lyDoBan, setLyDoBan] = useState<"da-ket-thuc" | "dang-ban" | null>(null);
  const [ketQua, setKetQua] = useState<KetQuaHienThi | null>(null);
  const [coTheDung, setCoTheDung] = useState(false);
  const [conHieuLuc, setConHieuLuc] = useState(WIN_VALID_SECONDS);
  /** Số đang hiện trên bảng LED của CHÍNH máy này (chỉ chế độ hai màn / online). */
  const [hienThi, setHienThi] = useState(daiTu);

  // Ô CÓ KIỂM SOÁT — React dọn form sau mỗi server action, ô không kiểm soát bị
  // xoá trắng khi form báo lỗi và phụ huynh phải gõ lại từ đầu.
  const [hoTen, setHoTen] = useState("");
  const [soDienThoai, setSoDienThoai] = useState("");
  const [dongY, setDongY] = useState(false);
  const [coSoId, setCoSoId] = useState<string>("");
  const [loiForm, setLoiForm] = useState("");
  const [dangGui, setDangGui] = useState(false);
  const [nguoiChoiId, setNguoiChoiId] = useState<number | null>(null);

  const token = useClientString(tokenPhien);
  const lechRef = useRef(0);
  /** 🔴 R6 — xem chú thích cùng tên ở `man-hinh-chon-so.tsx`. */
  const daDoRef = useRef(false);
  const batDauLucRef = useRef(0);
  const luotIdRef = useRef<number | null>(null);
  const nhipRef = useRef<RoundSettings>(nhipCua({ tu: daiTu, den: daiDen }));
  const vongRef = useRef<number[]>([]);
  const rafRef = useRef(0);
  /** Máy này có tự vẽ dãy số không — xem chú thích của prop `cheDo`. */
  const veDaySoRef = useRef(cheDo !== "tai_quay");
  const dongHoRef = useRef(0);
  const coSoRef = useRef<number | null>(null);
  const tiengRef = useRef<ReturnType<typeof createSoundEngine> | null>(null);

  useEffect(() => () => tiengRef.current?.dispose(), []);

  // --- Canh đồng hồ + xin chỗ ---
  useEffect(() => {
    if (token === "") return;
    let huy = false;
    void doLechDongHo().then((kq) => {
      if (huy) return;
      lechRef.current = kq.lech;
      daDoRef.current = true;
    });
    void xinCho(ma, "nguoi_choi", token).then((cho) => {
      if (huy) return;
      if (!cho.duoc) {
        setLyDoBan(cho.lyDo ?? "dang-ban");
        setBuoc("ban");
        return;
      }
      setBuoc("nhap-thong-tin");
    });
    return () => {
      huy = true;
    };
  }, [ma, token]);

  const xinLaiCho = useCallback(async () => {
    const cho = await xinCho(ma, "nguoi_choi", token);
    setLyDoBan(cho.duoc ? null : (cho.lyDo ?? "dang-ban"));
    if (cho.duoc) {
      setLoiForm("");
      setBuoc(nguoiChoiId === null ? "nhap-thong-tin" : "san-sang");
    }
  }, [ma, token, nguoiChoiId]);

  const guiThongTin = useCallback(async () => {
    setDangGui(true);
    setLoiForm("");
    const kq = await nhanDienNguoiChoi(
      ma,
      hoTen,
      soDienThoai,
      dongY,
      coSoId === "" ? null : Number(coSoId),
    );
    setDangGui(false);
    if (!kq.ok || kq.nguoiChoiId === undefined) {
      setLoiForm(kq.loi ?? T.phoneRetry);
      return;
    }
    setNguoiChoiId(kq.nguoiChoiId);
    coSoRef.current = kq.coSoId ?? null;
    setBuoc("san-sang");
  }, [ma, hoTen, soDienThoai, dongY, coSoId]);

  /**
   * 🔴 NHẢ CHỖ khi rời trang. Bản trước XIN chỗ mà không bao giờ NHẢ: phụ huynh
   * đóng tab xong, người kế tiếp quét mã và nhận đúng một dòng "đang có người
   * chơi" cho tới khi chỗ tự hết hạn — ở quầy đông thì đó là người bỏ đi.
   *
   * Trúng Số đã nối dây này từ lâu; Chọn Số bị bỏ quên. Lộ ra nhờ bài kiểm cuộn
   * dọc của GĐ 5.1, khi cùng một chương trình được mở lần thứ hai.
   *
   * Bắt cả pagehide: trên iOS, đóng tab hay chuyển ứng dụng thì component không
   * bao giờ được gỡ, nên chỉ dựa vào hàm dọn của effect là mất trắng ca đó.
   */
  useEffect(() => {
    if (token === "") return;
    const roi = () => void roiDi(ma, "nguoi_choi", token);
    window.addEventListener("pagehide", roi);
    return () => {
      window.removeEventListener("pagehide", roi);
      roi();
    };
  }, [ma, token]);

  /** Đếm nhịp để mở khoá nút DỪNG. Máy này KHÔNG vẽ dãy số — LCD lo việc đó. */
  const theoDoiMoKhoa = useCallback(() => {
    window.clearInterval(dongHoRef.current);
    dongHoRef.current = window.setInterval(() => {
      const n = nhipRef.current;
      const troi = daDoRef.current
        ? (Date.now() + lechRef.current - batDauLucRef.current) / 1000
        : 0;
      const moKhoa = canStop(n, troi);
      setCoTheDung((truoc) => {
        if (moKhoa && !truoc) tiengRef.current?.unlocked();
        return moKhoa;
      });
      if (troi >= n.roundLimitSeconds) window.clearInterval(dongHoRef.current);
    }, 100);
  }, []);

  /**
   * Vẽ dãy số ngay trên máy này — chỉ ở chế độ KHÁC tai_quay thuần.
   *
   * 🔴 Dùng CHUNG hàm thuần với màn LCD (soTaiGiay + vongChay của
   * lib/chon-so/vong-so): chỉ MỐC BẮT ĐẦU đi qua mạng, mỗi máy tự tính phần còn
   * lại. Chép một phép tính thứ hai vào đây là dựng ra hai dãy số chỉ lệch nhau
   * vào đúng ngày ai đó sửa một bên.
   */
  const veDaySo = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    if (vongRef.current.length === 0) return;

    function quay() {
      const n = nhipRef.current;
      const v = vongRef.current;
      const troi = daDoRef.current
        ? (Date.now() + lechRef.current - batDauLucRef.current) / 1000
        : 0;
      if (troi >= n.roundLimitSeconds) return;
      setHienThi(soTaiGiay(n, v, troi));
      rafRef.current = requestAnimationFrame(quay);
    }
    rafRef.current = requestAnimationFrame(quay);
  }, []);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  const batDau = useCallback(async () => {
    vibrate(VIBRATE_PRESS);
    // Trình duyệt điện thoại chỉ cho phát tiếng sau một cú chạm — và đây là cú
    // chạm đó. Gọi TRƯỚC await, sau await là mất quyền.
    tiengRef.current ??= createSoundEngine();
    tiengRef.current.ensureStarted();
    setBuoc("cho-chay");
    const kq = await moLuot(ma, nguoiChoiId, null, coSoRef.current);
    if (!kq.ok) {
      setLoiForm(kq.loi ?? "");
      setBuoc(kq.loi ? "ban" : "san-sang");
      return;
    }
    if (kq.gioMayChu !== undefined) {
      lechRef.current = kq.gioMayChu - Date.now();
      daDoRef.current = true;
    }
  }, [ma, nguoiChoiId]);

  const dung = useCallback(
    (moc: number) => {
      const id = luotIdRef.current;
      if (id === null) return;
      // Phép đo nằm ở `lib/do-bam.ts` — hàm thuần. Lấy mốc của CHÍNH sự kiện
      // chạm, không lấy lúc React chạy tới đây: máy yếu và máy 120Hz phải cho
      // cùng một kết quả.
      const troi = doThoiDiemBam({
        mocSuKien: moc,
        timeOrigin: performance.timeOrigin,
        hienTaiTuongDoi: performance.now(),
        lechDongHo: lechRef.current,
        batDauLuc: batDauLucRef.current,
      });
      if (!canStop(nhipRef.current, troi / 1000)) return;
      luotIdRef.current = null;
      vibrate(VIBRATE_PRESS);
      // Kết quả về qua KÊNH, không đọc ở đây: một đường duy nhất thì màn hình
      // lớn và điện thoại không bao giờ kể hai câu chuyện khác nhau.
      void chotLuot(ma, id, troi, "dien_thoai");
    },
    [ma],
  );

  const bamNut = useCallback(
    (e: PointerEvent<HTMLButtonElement>) => {
      if (buoc === "san-sang") void batDau();
      else if (buoc === "dang-chay") dung(e.nativeEvent.timeStamp);
    },
    [buoc, batDau, dung],
  );

  const nhanTin = useCallback(
    (tin: TinTrongPhong) => {
      switch (tin.loai) {
        case "bat-dau-chon-so":
          luotIdRef.current = tin.luotId;
          batDauLucRef.current = tin.batDauLuc;
          nhipRef.current = tin.nhip;
          setCoTheDung(false);
          setKetQua(null);
          setBuoc("dang-chay");
          theoDoiMoKhoa();
          // 🔴 Tin ĐÃ MANG SẴN dải và danh sách số đã ra từ lâu (kenh.ts), máy
          // này chỉ đang bỏ qua chúng. Dựng lại vòng chạy y hệt màn LCD.
          if (veDaySoRef.current) {
            vongRef.current = vongChay(tin.dai, new Set(tin.daRa));
            veDaySo();
          }
          return;
        case "ket-qua-chon-so":
          window.clearInterval(dongHoRef.current);
          cancelAnimationFrame(rafRef.current);
          luotIdRef.current = null;
          // SNAP về đúng con số máy chủ đã chốt — độ trễ mạng chỉ làm lệch phần
          // nhoè ở giữa, con số cuối thì khớp tuyệt đối.
          setHienThi(tin.so);
          setKetQua({ so: tin.so, maXacThuc: tin.maXacThuc });
          setBuoc("ket-qua");
          setConHieuLuc(WIN_VALID_SECONDS);
          vibrate(VIBRATE_WIN);
          tiengRef.current?.win();
          return;
        case "trang-thai":
          if (!tin.dangChay) {
            setLyDoBan("da-ket-thuc");
            setBuoc("ban");
          }
          return;
        default:
          return;
      }
    },
    [theoDoiMoKhoa, veDaySo],
  );

  useEffect(() => moKenh(ma, nhanTin), [ma, nhanTin]);

  useEffect(() => () => window.clearInterval(dongHoRef.current), []);

  // Đồng hồ hiệu lực của mã xác thực: nhân viên soi mã trước khi đưa quà.
  useEffect(() => {
    if (buoc !== "ket-qua" || !ketQua) return;
    const batDau = Date.now();
    const nhip = window.setInterval(() => {
      const daTroi = Math.floor((Date.now() - batDau) / 1000);
      setConHieuLuc(Math.max(0, WIN_VALID_SECONDS - daTroi));
    }, 500);
    return () => window.clearInterval(nhip);
  }, [buoc, ketQua]);

  return (
    /* Xem chú thích cùng nội dung ở man-dien-thoai.tsx. */
    <main className="flex h-dvh flex-col overflow-hidden bg-white text-muc">
      <header className="flex items-center justify-between px-5 pt-5">
        <LogoSata chieuCao={24} sizes="96px" preload />
        <span className="text-xs text-chi">{tenTrungTam}</span>
      </header>

      <section className="flex min-h-0 flex-1 flex-col items-center justify-center gap-5 overflow-y-auto px-5 py-4">
        {buoc === "dang-noi" && <p className="text-sm text-chi">{T.phoneConnecting}</p>}

        {buoc === "ban" && (
          <div className="w-full text-center">
            <p className="text-lg font-black text-muc">
              {lyDoBan === "da-ket-thuc" ? T.phoneEnded : T.phoneBusy}
            </p>
            {loiForm !== "" && <p className="mt-2 text-sm text-do">{loiForm}</p>}
            <button
              type="button"
              onClick={() => void xinLaiCho()}
              className="mt-5 w-full rounded-2xl bg-cam px-6 py-4 text-base font-black text-white"
            >
              {T.phoneRetry}
            </button>
          </div>
        )}

        {buoc === "nhap-thong-tin" && (
          <div className="w-full max-w-sm">
            <h1 className="text-center text-xl font-black text-muc">{tenDot}</h1>
            <p className="mt-1 text-center text-sm text-chi">
              {T.chonSoDai} {daiTu}–{daiDen}
            </p>

            <label className="mt-5 flex flex-col gap-1.5 text-sm">
              <span className="font-semibold">{T.formName}</span>
              <input
                value={hoTen}
                onChange={(e) => setHoTen(e.target.value)}
                className="rounded-xl border border-ke px-4 py-3 text-base focus:border-tim focus:outline-none"
              />
            </label>

            <label className="mt-3 flex flex-col gap-1.5 text-sm">
              <span className="font-semibold">{T.formPhone}</span>
              <input
                inputMode="numeric"
                value={soDienThoai}
                onChange={(e) => setSoDienThoai(e.target.value)}
                className="rounded-xl border border-ke px-4 py-3 text-base focus:border-tim focus:outline-none"
              />
            </label>

            {coSoChon !== null && (
              <label className="mt-3 flex flex-col gap-1.5 text-sm">
                <span className="font-semibold">{T.onlineChonCoSo}</span>
                <select
                  value={coSoId}
                  onChange={(e) => setCoSoId(e.target.value)}
                  className="rounded-xl border border-ke px-4 py-3 text-base focus:border-tim focus:outline-none"
                >
                  <option value="">{T.onlineChonCoSoTrong}</option>
                  {coSoChon.map((cs) => (
                    <option key={cs.id} value={cs.id}>
                      {cs.nhan}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label className="mt-4 flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={dongY}
                onChange={(e) => setDongY(e.target.checked)}
                className="mt-0.5 h-5 w-5 accent-tim"
              />
              <span className="text-chi">{T.formConsent}</span>
            </label>

            {loiForm !== "" && <p className="mt-3 text-sm text-do">{loiForm}</p>}

            <button
              type="button"
              disabled={dangGui}
              onClick={() => void guiThongTin()}
              className="mt-5 w-full rounded-2xl bg-cam px-6 py-4 text-base font-black text-white disabled:opacity-60"
            >
              {T.formSubmit}
            </button>
          </div>
        )}

        {(buoc === "san-sang" || buoc === "cho-chay" || buoc === "dang-chay") && (
          <div className="flex w-full flex-col items-center gap-6">
            {/* 🔴 Bảng số CHỈ hiện ở chế độ khác tai_quay thuần. Ở quầy một màn,
                hai bảng số trong một phòng là hai thứ để lệch nhau. */}
            {cheDo !== "tai_quay" && (
              <div className="w-full rounded-2xl bg-[var(--color-led-nen)] p-4">
                <Led4Digits value={formatNumber(buoc === "dang-chay" ? hienThi : daiTu)} />
              </div>
            )}
            <p className="text-center text-base text-chi">
              {buoc === "dang-chay" && cheDo === "tai_quay"
                ? T.chonSoNhinLenLcd
                : buoc === "dang-chay"
                  ? T.chonSoBamKhiThich
                  : T.chonSoSanSang}
            </p>
            <button
              type="button"
              onPointerDown={bamNut}
              disabled={buoc === "cho-chay" || (buoc === "dang-chay" && !coTheDung)}
              className={[
                "flex h-56 w-56 items-center justify-center rounded-full text-2xl font-black text-white transition",
                buoc === "dang-chay" && coTheDung
                  ? "bg-do shadow-[0_0_0_10px_rgba(220,38,38,0.18)]"
                  : buoc === "dang-chay"
                    ? "bg-chi/50"
                    : "bg-cam",
              ].join(" ")}
            >
              {buoc === "dang-chay" ? T.stop : T.start}
            </button>
          </div>
        )}

        {buoc === "ket-qua" && ketQua && (
          <div className="w-full text-center">
            <p className="text-2xl font-black text-tim">{T.chonSoChucMung}</p>
            <div className="mt-4 flex justify-center">
              <Led4Digits value={formatNumber(ketQua.so)} size="large" />
            </div>
            <p className="mt-4 text-base text-muc">{T.chonSoDayLaSoCuaBan}</p>
            <p className="mt-1 text-sm text-chi">{T.chonSoDuaSoChoNhanVien}</p>
            <div className="mt-5 inline-flex flex-col items-center rounded-2xl bg-suong px-6 py-4">
              <span className="text-xs text-chi">{T.verifyCode}</span>
              <span className="font-mono text-2xl font-black text-muc">
                {ketQua.maXacThuc}
              </span>
              <span className="mt-1 text-xs text-chi">{T.validFor} {conHieuLuc} {T.seconds}</span>
            </div>
            <div className="mt-6 flex justify-center">
              <LinhVatSata canh={120} sizes="120px" className="min-h-0 shrink" />
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

let tokenDaSinh: string | null = null;

function tokenPhien(): string {
  if (tokenDaSinh === null) tokenDaSinh = Math.random().toString(36).slice(2, 12);
  return tokenDaSinh;
}
