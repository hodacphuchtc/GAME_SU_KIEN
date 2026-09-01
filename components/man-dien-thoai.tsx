"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent } from "react";

import { NEAR_MISS_THRESHOLD, WIN_VALID_SECONDS, type RoundSettings } from "@/config/game";
import type { CheDoChoi } from "@/config/to-chuc";
import { T } from "@/config/locale";
import {
  chotLuot,
  moLuot,
  nhanDienNguoiChoi,
  roiDi,
  xinCho,
} from "@/app/actions/choi";
import { canStop, formatNumber, speedAt, valueAt } from "@/lib/bo-dem";
import { Led4Digits } from "@/components/led-4-so";
import { CauDinhVi, LinhVatSata, LogoSata } from "@/components/nhan-dien-sata";
import { createSoundEngine } from "@/lib/am-thanh";
import { doThoiDiemBam } from "@/lib/do-bam";
import { doLechDongHo } from "@/lib/dong-bo/dong-ho";
import { moKenh, type TinTrongPhong } from "@/lib/dong-bo/kenh";
import { VIBRATE_LOSE, VIBRATE_PRESS, VIBRATE_WIN, vibrate } from "@/lib/rung";
import { useClientString } from "@/lib/tren-may-khach";

/**
 * Màn hình trên điện thoại phụ huynh — CHỈ LÀ NÚT BẤM, không hiện dãy số.
 *
 * Người chơi nhìn màn hình lớn ở lễ tân rồi bấm nút trên máy mình. Nhờ vậy
 * không có hai màn hình để mà lệch nhau, và độ trễ mạng không ảnh hưởng tới
 * kết quả: chính máy này đóng dấu thời gian lúc ngón tay chạm.
 */

type Buoc =
  | "dang-noi"
  | "ban"
  | "nhap-thong-tin"
  | "san-sang"
  | "cho-chay"
  | "dang-chay"
  | "giua-van"
  | "ket-qua";

export interface ManDienThoaiProps {
  ma: string;
  soTrung: number;
  tenTrungTam: string;
  tenGiaiThuong: string;
  thamSo: RoundSettings;
  /**
   * Chế độ chơi quyết định NGHE ĐƯỢC GÌ.
   *
   * 🔴 `tai_quay` chỉ nghe đếm ngược + kết quả, KHÔNG nghe tick. Ở chế độ đó
   * dãy số chạy trên màn hình LCD và tiếng tick cũng phát từ đó; chiếc điện
   * thoại này là NÚT BẤM, và mọi việc chạy thêm trong lúc chờ chạm đều nằm trên
   * đúng đường đo thời gian quyết định ai trúng ai trượt.
   */
  cheDo: CheDoChoi;
  /**
   * Danh sách cơ sở để phụ huynh tự chọn. `null` = chương trình đã gán sẵn cơ
   * sở, KHÔNG hỏi gì cả.
   */
  coSoChon: { id: number; nhan: string }[] | null;
}

interface KetQuaHienThi {
  soDaDung: number;
  trung: boolean;
  khoangLech: number;
  hetGio: boolean;
  maXacThuc: string;
  /** Tên phần quà ĐÃ BỐC cho ván này — khác tên giải khai lúc tạo chương trình. */
  tenQuaTang: string;
}

interface TrangThaiVan {
  lanDaDung: number;
  soLanChoPhep: number;
  conLan: number;
  lechTotNhat: number | null;
  soTotNhat: number | null;
}

export function ManDienThoai({
  ma,
  soTrung,
  tenTrungTam,
  tenGiaiThuong,
  thamSo,
  cheDo,
  coSoChon,
}: ManDienThoaiProps) {
  const [buoc, setBuoc] = useState<Buoc>("dang-noi");
  const [coTheDung, setCoTheDung] = useState(false);
  const [ketQua, setKetQua] = useState<KetQuaHienThi | null>(null);
  const [conHieuLuc, setConHieuLuc] = useState(WIN_VALID_SECONDS);
  const [nguoiChoiId, setNguoiChoiId] = useState<number | null>(null);
  const [loiForm, setLoiForm] = useState("");
  const [dangGui, setDangGui] = useState(false);
  const [chiVui, setChiVui] = useState(false);
  // Trạng thái VÁN: bấm tới lần mấy, còn mấy lần, đang tốt nhất là lệch bao nhiêu.
  const [van, setVan] = useState<TrangThaiVan | null>(null);
  // Con số đang chạy TRÊN CHÍNH MÁY NÀY. Chỉ chế độ online mới vẽ — tại quầy
  // thì dãy số sống ở màn hình LCD, và vẽ thêm ở đây là hai màn hình để lệch nhau.
  const [soHienThi, setSoHienThi] = useState(0);
  // Vì sao giữ lý do: "chương trình đã tắt" và "ghế đang bận" là hai chuyện
  // khác hẳn nhau với phụ huynh đang đứng ở quầy — một cái thì chờ được, một
  // cái thì chờ mãi cũng vô ích.
  const [lyDoBan, setLyDoBan] = useState<"da-ket-thuc" | "dang-ban" | null>(null);
  // Giữ giá trị người dùng đã gõ trong state: React tự dọn form sau mỗi lần
  // chạy action, nên nếu để ô tự do thì gõ nhầm số điện thoại một lần là mất
  // luôn cả họ tên vừa nhập — phụ huynh đứng ở quầy sẽ bỏ cuộc ngay.
  const [hoTen, setHoTen] = useState("");
  const [soDienThoai, setSoDienThoai] = useState("");
  const [dongY, setDongY] = useState(false);
  const [coSoId, setCoSoId] = useState("");

  const token = useClientString(tokenPhien);

  const lechRef = useRef(0);
  const batDauLucRef = useRef(0);
  const luotIdRef = useRef<number | null>(null);
  // Ván mà máy này đang chơi. Máy chủ vẫn kiểm lại; đây chỉ là chỗ nhớ để bấm
  // tiếp đúng ván thay vì mở ván mới ở mỗi lần bấm.
  const vanIdRef = useRef<number | null>(null);
  const thamSoRef = useRef<RoundSettings>(thamSo);
  const nhipRef = useRef(0);
  const khungRef = useRef(0);
  // Cơ sở do MÁY CHỦ phân giải — máy này chỉ chuyển tiếp, không tự khai.
  const coSoRef = useRef<number | null>(null);
  const tiengRef = useRef<ReturnType<typeof createSoundEngine> | null>(null);
  const dayDuRef = useRef(cheDo === "online");

  // --- Canh đồng hồ + xin chỗ chơi ---
  useEffect(() => {
    if (token === "") return;
    let huy = false;
    void (async () => {
      const [lech, cho] = await Promise.all([
        doLechDongHo(),
        xinCho(ma, "nguoi_choi", token),
      ]);
      if (huy) return;
      lechRef.current = lech.lech;
      setLyDoBan(cho.duoc ? null : (cho.lyDo ?? "dang-ban"));
      setBuoc(cho.duoc ? "nhap-thong-tin" : "ban");
    })();
    return () => {
      huy = true;
    };
  }, [ma, token]);

  // Nhả chỗ khi đóng tab, để người sau quét được ngay.
  useEffect(() => {
    if (token === "") return;
    const roi = () => void roiDi(ma, "nguoi_choi", token);
    window.addEventListener("pagehide", roi);
    return () => {
      window.removeEventListener("pagehide", roi);
      roi();
    };
  }, [ma, token]);

  /**
   * Nhịp theo dõi trong lúc ván chạy.
   *
   * 🔴 Hai nhịp khác nhau cho hai chế độ, và khác nhau là có lý do:
   *
   * - **online**: `requestAnimationFrame` — máy này VẼ dãy số. Bảng số chạy tới
   *   800 số/giây; một nhịp 100ms là 10 khung/giây, người chơi sẽ thấy số giật
   *   cục và không canh nổi, tức là trò chơi hỏng.
   * - **tại quầy**: `setInterval(100ms)` — máy này chỉ là NÚT BẤM, chỉ cần biết
   *   nút đã mở khoá chưa. Chạy theo khung hình ở đây là đốt pin và thêm việc
   *   ngay trên đường đo thời điểm chạm.
   */
  const theoDoiMoKhoa = useCallback(() => {
    window.clearInterval(nhipRef.current);
    cancelAnimationFrame(khungRef.current);

    const dayDu = dayDuRef.current;

    const dapNhip = () => {
      const s = thamSoRef.current;
      const troi = (Date.now() + lechRef.current - batDauLucRef.current) / 1000;
      const moKhoa = canStop(s, troi);
      setCoTheDung((truoc) => {
        if (moKhoa && !truoc) tiengRef.current?.unlocked();
        return moKhoa;
      });
      if (dayDu) {
        setSoHienThi(valueAt(s, troi));
        tiengRef.current?.tick(
          (speedAt(s, troi) - s.startSpeed) / Math.max(1, s.maxSpeed - s.startSpeed),
        );
      }
      return troi < s.roundLimitSeconds;
    };

    if (dayDu) {
      const vong = () => {
        if (dapNhip()) khungRef.current = requestAnimationFrame(vong);
      };
      khungRef.current = requestAnimationFrame(vong);
    } else {
      nhipRef.current = window.setInterval(() => {
        if (!dapNhip()) window.clearInterval(nhipRef.current);
      }, 100);
    }
  }, []);

  /**
   * Xin lại chỗ. Trước GĐ 8.3, màn "Chưa chơi được" là NGÕ CỤT TUYỆT ĐỐI: không
   * có nút nào, phải tự tải lại trang mới thoát ra. Nút này chạy được cả khi
   * kênh SSE đã đứt, nên nó là đường thoát chắc chắn hơn tin đẩy ở (5).
   */
  const xinLaiCho = useCallback(async () => {
    const cho = await xinCho(ma, "nguoi_choi", token);
    setLyDoBan(cho.duoc ? null : (cho.lyDo ?? "dang-ban"));
    if (cho.duoc) {
      setLoiForm("");
      setBuoc(nguoiChoiId === null ? "nhap-thong-tin" : "san-sang");
    }
  }, [ma, token, nguoiChoiId]);

  const nhanTin = useCallback(
    (tin: TinTrongPhong) => {
      switch (tin.loai) {
        case "bat-dau":
          luotIdRef.current = tin.luotId;
          batDauLucRef.current = tin.batDauLuc;
          thamSoRef.current = tin.thamSo;
          setCoTheDung(false);
          setKetQua(null);
          setBuoc("dang-chay");
          theoDoiMoKhoa();
          return;
        case "ket-qua":
          window.clearInterval(nhipRef.current);
          cancelAnimationFrame(khungRef.current);
          luotIdRef.current = null;
          setKetQua({
            soDaDung: tin.soDaDung,
            trung: tin.trung,
            khoangLech: tin.khoangLech,
            hetGio: tin.hetGio,
            maXacThuc: tin.maXacThuc,
            tenQuaTang: tin.tenGiaiThuong,
          });
          setVan({
            lanDaDung: tin.lanDaDung,
            soLanChoPhep: tin.soLanChoPhep,
            conLan: tin.soLanChoPhep - tin.lanDaDung,
            lechTotNhat: tin.lechTotNhat,
            soTotNhat: tin.soTotNhat,
          });
          if (tin.vanXong) {
            // Ván khép lại: quên vanId đi, lần bấm sau là một ván hoàn toàn mới.
            vanIdRef.current = null;
            setConHieuLuc(WIN_VALID_SECONDS);
            setBuoc("ket-qua");
          } else {
            setBuoc("giua-van");
          }
          vibrate(tin.trung ? VIBRATE_WIN : VIBRATE_LOSE);
          if (tin.vanXong) {
            if (tin.trung) tiengRef.current?.win();
            else tiengRef.current?.lose();
          }
          return;
        case "trang-thai":
          // Chương trình vừa bật lại: máy đang kẹt ở màn "Chưa chơi được" tự
          // thoát ra, không bắt phụ huynh tải lại trang. Bị tắt giữa chừng thì
          // để yên — ván đang chạy vẫn phải kết thúc tử tế.
          if (tin.dangChay) void xinLaiCho();
          return;
        default:
          return;
      }
    },
    [theoDoiMoKhoa, xinLaiCho],
  );

  useEffect(() => moKenh(ma, nhanTin), [ma, nhanTin]);

  useEffect(
    () => () => {
      window.clearInterval(nhipRef.current);
      cancelAnimationFrame(khungRef.current);
    },
    [],
  );

  useEffect(() => () => tiengRef.current?.dispose(), []);

  // Đồng hồ hiệu lực của màn trúng.
  useEffect(() => {
    if (buoc !== "ket-qua" || !ketQua?.trung) return;
    const batDau = Date.now();
    const nhip = window.setInterval(() => {
      const daTroi = Math.floor((Date.now() - batDau) / 1000);
      setConHieuLuc(Math.max(0, WIN_VALID_SECONDS - daTroi));
    }, 500);
    return () => window.clearInterval(nhip);
  }, [buoc, ketQua]);

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
      setLoiForm(kq.loi ?? "Chưa gửi được, thử lại nhé.");
      return;
    }
    setNguoiChoiId(kq.nguoiChoiId);
    setBuoc("san-sang");
    coSoRef.current = kq.coSoId ?? null;
  }, [ma, dongY, hoTen, soDienThoai, coSoId]);

  const batDau = useCallback(async () => {
    vibrate(VIBRATE_PRESS);
    // Trình duyệt điện thoại chỉ cho phát tiếng sau một cú chạm — và đây là cú
    // chạm đó. Gọi TRƯỚC await, sau await là mất quyền.
    tiengRef.current ??= createSoundEngine();
    tiengRef.current.ensureStarted();
    setBuoc("cho-chay");
    const kq = await moLuot(ma, nguoiChoiId, vanIdRef.current, coSoRef.current);
    if (!kq.ok) {
      setLoiForm(kq.loi ?? "");
      setChiVui(kq.chiVui === true);
      setBuoc(kq.loi ? "ban" : "san-sang");
      return;
    }
    setChiVui(kq.chiVui === true);
    if (kq.vanId !== undefined) vanIdRef.current = kq.vanId;
    if (kq.gioMayChu !== undefined) lechRef.current = kq.gioMayChu - Date.now();
  }, [ma, nguoiChoiId]);

  const dung = useCallback(
    (moc: number) => {
      const id = luotIdRef.current;
      if (id === null) return;
      // Phép đo nằm ở `lib/do-bam.ts` — hàm thuần, kiểm được bằng 200 lượt mô
      // phỏng thay vì bấm tay (xem `tests/do-chinh-xac-bam.test.ts`).
      const troi = doThoiDiemBam({
        mocSuKien: moc,
        timeOrigin: performance.timeOrigin,
        hienTaiTuongDoi: performance.now(),
        lechDongHo: lechRef.current,
        batDauLuc: batDauLucRef.current,
      });
      if (!canStop(thamSoRef.current, troi / 1000)) return;
      luotIdRef.current = null;
      vibrate(VIBRATE_PRESS);
      // Kết quả về qua KÊNH (`ket-qua`), không đọc ở đây: một đường duy nhất
      // thì màn hình lớn và điện thoại không bao giờ kể hai câu chuyện khác nhau.
      void chotLuot(ma, id, troi, "dien_thoai");
    },
    [ma],
  );

  const bamNut = useCallback(
    (e: PointerEvent<HTMLButtonElement>) => {
      if (buoc === "san-sang") void batDau();
      // 🔴 Lấy mốc của CHÍNH sự kiện chạm, không lấy lúc React chạy tới đây.
      else if (buoc === "dang-chay") dung(e.nativeEvent.timeStamp);
    },
    [buoc, batDau, dung],
  );

  const choiLai = useCallback(async () => {
    setKetQua(null);
    setVan(null);
    vanIdRef.current = null;
    // Chỗ đã được nhả lúc chốt ván — phải xin lại, và có thể người khác đã vào.
    const cho = await xinCho(ma, "nguoi_choi", token);
    setBuoc(cho.duoc ? "san-sang" : "ban");
    if (!cho.duoc) setLoiForm("");
  }, [ma, token]);

  const nhapLai = useCallback(() => {
    setLoiForm("");
    setBuoc("nhap-thong-tin");
  }, []);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-white">
      <header className="px-5 pt-5">
        {/* Logo + câu định vị ở MỌI bước: phụ huynh mở link từ quảng cáo thì đây là
            thứ duy nhất nói cho họ biết mình đang ở trang của ai. */}
        <div className="flex items-center justify-between gap-3">
          <LogoSata chieuCao={26} sizes="112px" preload />
          <CauDinhVi className="text-right text-[11px] leading-tight" />
        </div>
        <p className="mt-3 text-sm font-semibold text-chi">{tenTrungTam}</p>
        <p className="mt-3 text-xs font-bold uppercase tracking-[0.28em] text-tim">
          {T.targetLabel}
        </p>
        <p className="font-mono text-5xl font-black tracking-[0.15em] text-cam">
          {formatNumber(soTrung)}
        </p>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-5 py-6 text-center">
        {buoc === "dang-noi" && <p className="text-chi">{T.phoneConnecting}</p>}

        {buoc === "ban" && (
          <div className="w-full rounded-2xl bg-vang/15 p-5 text-center">
            <p className="text-base font-black text-muc">{T.blocked}</p>
            <p className="mt-1 text-sm text-muc">
              {loiForm || (lyDoBan === "da-ket-thuc" ? T.phoneEnded : T.phoneBusy)}
            </p>
            {loiForm !== "" ? (
              <button
                type="button"
                onClick={nhapLai}
                className="mt-4 rounded-xl bg-tim px-5 py-3 text-sm font-black text-white"
              >
                {T.formSubmit}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void xinLaiCho()}
                className="mt-4 rounded-xl bg-tim px-5 py-3 text-sm font-black text-white"
              >
                {T.phoneRetry}
              </button>
            )}
          </div>
        )}

        {buoc === "nhap-thong-tin" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void guiThongTin();
            }}
            className="w-full text-left"
          >
            {/* 🔴 Linh vật ở ĐÂY vì đây là bước dừng lâu nhất — đúng lúc phụ huynh
                đang quyết định có giao số điện thoại hay không. Một khuôn mặt thân
                thiện ở khoảnh khắc đó đáng giá hơn ở bất kỳ màn nào khác.
                Tuyệt đối KHÔNG ở bước `dang-chay`: ảnh mount lúc đó có nguy cơ
                decode gây hụt khung ngay trên đường đo `pointerdown`. */}
            <div className="flex justify-center">
              <LinhVatSata canh={150} sizes="160px" className="w-32" />
            </div>
            <p className="text-center text-xl font-black text-muc">{T.formTitle}</p>
            <label className="mt-4 flex flex-col gap-1.5 text-sm">
              <span className="font-semibold text-muc">{T.formName}</span>
              <input
                name="hoTen"
                required
                autoComplete="name"
                value={hoTen}
                onChange={(e) => setHoTen(e.target.value)}
                placeholder={T.formNamePlaceholder}
                className="rounded-xl border border-ke px-4 py-3.5 text-base text-muc focus:border-tim focus:outline-none"
              />
            </label>
            <label className="mt-3 flex flex-col gap-1.5 text-sm">
              <span className="font-semibold text-muc">{T.formPhone}</span>
              <input
                name="soDienThoai"
                required
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={soDienThoai}
                onChange={(e) => setSoDienThoai(e.target.value)}
                placeholder={T.formPhonePlaceholder}
                className="rounded-xl border border-ke px-4 py-3.5 text-base text-muc focus:border-tim focus:outline-none"
              />
            </label>
            {coSoChon !== null && (
              <label className="mt-3 flex flex-col gap-1.5 text-sm">
                <span className="font-semibold text-muc">{T.onlineChonCoSo}</span>
                <select
                  name="coSoId"
                  required
                  value={coSoId}
                  onChange={(e) => setCoSoId(e.target.value)}
                  className="rounded-xl border border-ke bg-white px-4 py-3.5 text-base text-muc focus:border-tim focus:outline-none"
                >
                  {/* KHÔNG có lựa chọn "để trống": báo cáo theo cơ sở mà thiếu cơ
                      sở thì cả dòng đó rơi ra ngoài mọi bảng. */}
                  <option value="" disabled>
                    {T.onlineChonCoSoTrong}
                  </option>
                  {coSoChon.map((cs) => (
                    <option key={cs.id} value={cs.id}>
                      {cs.nhan}
                    </option>
                  ))}
                </select>
                <span className="text-xs leading-relaxed text-chi">
                  {T.onlineChonCoSoNhac}
                </span>
              </label>
            )}

            <label className="mt-4 flex items-start gap-3 text-sm">
              <input
                name="dongY"
                type="checkbox"
                checked={dongY}
                onChange={(e) => setDongY(e.target.checked)}
                className="mt-1 h-5 w-5 shrink-0 rounded border-ke accent-[var(--color-tim)]"
              />
              <span className="text-muc">{T.formConsent}</span>
            </label>
            <p className="mt-3 text-xs leading-relaxed text-chi">{T.formPrivacy}</p>
            <p className="mt-1 text-xs font-semibold text-chi">{T.formOneADay}</p>
            {loiForm !== "" && (
              <p className="mt-3 rounded-xl bg-do/10 p-3 text-sm font-semibold text-do">
                {loiForm}
              </p>
            )}
            <button
              type="submit"
              disabled={dangGui}
              className="mt-5 w-full rounded-2xl bg-tim py-4 text-lg font-black text-white disabled:opacity-60"
            >
              {T.formSubmit}
            </button>
          </form>
        )}

        {(buoc === "san-sang" || buoc === "cho-chay" || buoc === "dang-chay") && (
          <>
            {/* 🔴 Chế độ ONLINE: dãy số sống NGAY TRÊN MÁY NÀY. Chế độ tại quầy
                thì tuyệt đối không vẽ — có hai bảng số trong một phòng là có hai
                thứ để lệch nhau, và cả sảnh sẽ tin cái nào? */}
            {cheDo === "online" ? (
              <>
                <div className="w-full rounded-2xl bg-[var(--color-led-nen)] p-4">
                  <Led4Digits value={formatNumber(buoc === "dang-chay" ? soHienThi : 0)} />
                </div>
                <p className="text-sm leading-relaxed text-chi">
                  {T.onlineHint(formatNumber(soTrung))}
                </p>
              </>
            ) : (
              <>
                <p className="text-xl font-black text-muc">{T.phoneLookAtScreen}</p>
                <p className="text-sm leading-relaxed text-chi">
                  {T.phoneHint(formatNumber(soTrung))}
                </p>
              </>
            )}
            <p className="mt-2 text-lg font-bold text-tim">
              {T.prizeLabel}: <span className="text-cam">{tenGiaiThuong}</span>
            </p>
            {chiVui && (
              <p className="mt-2 rounded-xl bg-vang/15 px-4 py-2 text-sm font-semibold text-muc">
                {T.onlyFun}
              </p>
            )}
          </>
        )}

        {buoc === "giua-van" && ketQua && van && (
          <div className="flex w-full flex-col items-center gap-2">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-tim">
              {T.vanLanThu(van.lanDaDung, van.soLanChoPhep)}
            </p>
            <p className="text-chi">{ketQua.hetGio ? T.timedOut : T.youStoppedAt}</p>
            <p className="font-mono text-5xl font-black text-muc">
              {formatNumber(ketQua.soDaDung)}
            </p>
            <p
              className={
                ketQua.khoangLech <= NEAR_MISS_THRESHOLD
                  ? "text-2xl font-black text-cam"
                  : "text-2xl font-bold text-muc"
              }
            >
              {T.offByN(ketQua.khoangLech)}
            </p>
            {/* Dòng này là lý do người ta chịu bấm tiếp: nó nói thành tích ĐANG
                GIỮ, chứ không phải lần vừa rồi. Bấm lệch 900 sau khi đã lệch 5
                mà màn hình chỉ khoe 900 thì người chơi tưởng mình vừa làm hỏng. */}
            {/* Chỉ hiện khi con số này KHÁC lần vừa bấm. Ở lần bấm đầu chúng
                bằng nhau, và một dòng lặp lại y nguyên số ngay trên nó chỉ làm
                loãng cái thật sự cần đọc. */}
            {van.lechTotNhat !== null && van.lechTotNhat !== ketQua.khoangLech && (
              <p className="mt-1 rounded-xl bg-tim-nhat px-4 py-2 text-sm font-bold text-tim">
                {T.vanTotNhat(van.lechTotNhat)}
              </p>
            )}
            <p className="mt-1 text-sm font-semibold text-chi">{T.vanConLan(van.conLan)}</p>
          </div>
        )}

        {buoc === "ket-qua" && ketQua && (
          <div className="flex w-full flex-col items-center gap-3">
            {ketQua.trung ? (
              <>
                {/* 🔴 Linh vật CHỈ ở màn THẮNG. Tư thế đang có là "ăn mừng" — robot
                    giơ cúp vàng. Đặt nó cạnh dòng "KHÔNG TRÚNG THƯỞNG" là trêu người
                    vừa hụt, nên màn thua bên dưới KHÔNG có nó (xem `config/tai-san.ts`). */}
                <LinhVatSata canh={150} sizes="160px" className="w-32" />
                <p className="text-4xl font-black text-cam">{T.congrats}</p>
                <p className="text-chi">{T.wonExact}</p>
                <p className="font-mono text-5xl font-black text-muc">
                  {formatNumber(ketQua.soDaDung)}
                </p>
                {/* Tên quà ĐÃ BỐC. Người trúng bằng loại đáy kho vẫn thấy màn
                    thắng y hệt người trúng Balo — họ trúng thật, và không có lý
                    do gì để họ biết mình đang ở đáy kho (Đ13). */}
                <p className="text-lg font-bold text-tim">
                  {T.prizeLabel}:{" "}
                  <span className="text-cam">{ketQua.tenQuaTang || tenGiaiThuong}</span>
                </p>
                <div
                  className={[
                    "w-full rounded-2xl border p-4",
                    conHieuLuc > 0 ? "border-luc/40 bg-luc/10" : "border-ke bg-suong",
                  ].join(" ")}
                >
                  {conHieuLuc > 0 ? (
                    <>
                      <p className="text-sm font-semibold text-muc">{T.showToStaff}</p>
                      <p className="mt-1 text-sm text-chi">
                        {T.validFor}{" "}
                        <span className="font-mono text-lg font-bold text-muc">
                          {conHieuLuc}
                        </span>{" "}
                        {T.seconds}
                      </p>
                      <p className="mt-3 text-xs uppercase tracking-widest text-chi">
                        {T.verifyCode}
                      </p>
                      <p className="font-mono text-3xl font-black tracking-[0.35em] text-luc">
                        {ketQua.maXacThuc}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-chi">{T.expired}</p>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* 🔴 Ván nhiều lần bấm chấm bằng lần TỐT NHẤT, nên màn tổng kết
                    phải hiện đúng con số đó. Hiện lần CUỐI là chấm sai ngay
                    trước mắt người chơi: bấm lệch 5 rồi lệch 900 mà màn hình
                    kết luận 900 thì họ có quyền giận, và họ đúng. */}
                <p className="text-3xl font-black text-chi">{T.lost}</p>
                <p className="text-chi">{ketQua.hetGio ? T.timedOut : T.youStoppedAt}</p>
                <p className="font-mono text-5xl font-black text-muc">
                  {formatNumber(van?.soTotNhat ?? ketQua.soDaDung)}
                </p>
                <p
                  className={
                    (van?.lechTotNhat ?? ketQua.khoangLech) <= NEAR_MISS_THRESHOLD
                      ? "text-2xl font-black text-cam"
                      : "text-2xl font-bold text-muc"
                  }
                >
                  {T.offByN(van?.lechTotNhat ?? ketQua.khoangLech)}
                </p>
                <p className="text-chi">
                  {(van?.lechTotNhat ?? ketQua.khoangLech) <= NEAR_MISS_THRESHOLD
                    ? T.soClose
                    : T.stillFar}
                </p>
                {/* Ván nhiều lần bấm: nói rõ con số đang hiện là lần TỐT NHẤT,
                    không phải lần cuối — nếu không người chơi tưởng máy chấm nhầm. */}
                {van !== null && van.soLanChoPhep > 1 && (
                  <p className="text-xs font-semibold uppercase tracking-widest text-chi">
                    {T.vanKetQuaTotNhat}
                  </p>
                )}

                {/* Nền `bg-suong` chứ KHÔNG phải `bg-tim-nhat` có viền như khối ưu
                    đãi cũ: nền tím có viền đọc như một thẻ bấm được, mà ở đây
                    không còn hành động nào để mời. */}
                <p className="mt-3 w-full rounded-2xl bg-suong px-4 py-3 text-center text-sm font-semibold text-chi">
                  {T.loseThanks}
                </p>
              </>
            )}
          </div>
        )}
      </div>

      <div className={buoc === "nhap-thong-tin" || buoc === "ban" ? "hidden" : "px-5 pb-8"}>
        {buoc === "giua-van" ? (
          <button
            type="button"
            onPointerDown={() => void batDau()}
            className="w-full rounded-3xl bg-tim py-6 text-2xl font-black text-white active:scale-[0.99]"
          >
            {T.vanBamTiep}
          </button>
        ) : buoc === "ket-qua" ? (
          /*
           * 🔴 Khi đang THẮNG và mã còn hiệu lực thì KHÔNG vẽ nút đáy.
           *
           * `choiLai()` chạy `setKetQua(null)` ngay lập tức, mà nút này là khối
           * cam to nhất màn hình nằm ngay dưới thẻ mã xác thực. Phụ huynh đưa
           * máy cho nhân viên, ai chạm nhầm là MẤT MÃ, không hoàn tác được.
           * Hết 60 giây thì mã vô giá trị rồi, lúc đó mới cho nút quay lại.
           */
          ketQua?.trung && conHieuLuc > 0 ? null : (
            <button
              type="button"
              onPointerDown={() => void choiLai()}
              className="w-full rounded-3xl bg-cam py-6 text-2xl font-black text-white active:scale-[0.99]"
            >
              {ketQua?.trung ? T.playAgain : T.tryAgain}
            </button>
          )
        ) : (
          <button
            type="button"
            // pointerdown chứ không phải click: click chỉ nổ khi NHẤC ngón tay,
            // tức cộng cả thời gian giữ nút vào độ trễ.
            onPointerDown={bamNut}
            disabled={buoc !== "san-sang" && !(buoc === "dang-chay" && coTheDung)}
            className={[
              "w-full rounded-3xl py-10 text-3xl font-black tracking-widest transition",
              "active:scale-[0.99] disabled:cursor-not-allowed",
              buoc === "dang-chay" && coTheDung
                ? "nhip-tim bg-cam text-white"
                : buoc === "san-sang"
                  ? "bg-tim text-white"
                  : "bg-suong text-chi",
            ].join(" ")}
          >
            {buoc === "san-sang"
              ? T.start
              : buoc === "dang-chay"
                ? coTheDung
                  ? T.stop
                  : T.speedingUp
                : T.phoneWait}
          </button>
        )}
      </div>
    </main>
  );
}

let tokenDaSinh: string | null = null;
function tokenPhien(): string {
  if (tokenDaSinh === null) tokenDaSinh = Math.random().toString(36).slice(2, 12);
  return tokenDaSinh;
}
