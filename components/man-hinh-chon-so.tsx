"use client";

import QRCode from "qrcode";
import { useCallback, useEffect, useRef, useState } from "react";

import { LCD_IDLE_TIMEOUT_SECONDS, type RoundSettings } from "@/config/game";
import { T } from "@/config/locale";
import { chotLuot, moLuot, xinCho } from "@/app/actions/choi";
import { createSoundEngine } from "@/lib/am-thanh";
import { formatNumber, speedAt } from "@/lib/bo-dem";
import { nhipCua, soTaiGiay, vongChay } from "@/lib/chon-so/vong-so";
import { doLechDongHo } from "@/lib/dong-bo/dong-ho";
import { moKenh, type TinTrongPhong } from "@/lib/dong-bo/kenh";
import { luuTatTieng, useTatTieng } from "@/lib/tieng-nho";
import { useClientString } from "@/lib/tren-may-khach";
import { Led4Digits } from "@/components/led-4-so";
import { CauDinhVi, LinhVatSata, LogoSata } from "@/components/nhan-dien-sata";

/**
 * Màn hình lớn tại lễ tân cho game CHỌN SỐ.
 *
 * Khác bản Trúng Số ở đúng một điều nhưng là điều gốc: **không có thắng thua**.
 * Không ô "SỐ TRÚNG THƯỞNG" trên đầu, không màn thua, không "lệch N số". Ai bấm
 * cũng ra một con số, và màn hình chỉ có một việc: đọc to con số đó lên.
 *
 * 🔴 Vẫn giữ nguyên cơ chế đã trả giá để có: mỗi máy TỰ CHẠY dãy số bằng một
 * hàm thuần của thời gian, chỉ MỐC BẮT ĐẦU đi qua mạng, và SNAP về kết quả cuối
 * khi có tin. Truyền từng khung hình là vừa nghẽn vừa lệch nhịp.
 */

type Man = "cho" | "da-vao" | "chay" | "ket-qua";

export interface ManHinhChonSoProps {
  ma: string;
  tenTrungTam: string;
  tenDot: string;
  daiTu: number;
  daiDen: number;
}

interface KetQuaHienThi {
  so: number;
  maXacThuc: string;
  conLai: number | null;
  giayXemKetQua: number;
}

export function ManHinhChonSo({
  ma,
  tenTrungTam,
  tenDot,
  daiTu,
  daiDen,
}: ManHinhChonSoProps) {
  // Mặc định TẮT tiếng, ngược với điện thoại: màn hình này treo giữa sảnh và
  // chạy suốt ngày. Hướng lệch an toàn là im lặng.
  const tatTieng = useTatTieng(true);
  const tiengRef = useRef<ReturnType<typeof createSoundEngine> | null>(null);

  const doiTieng = useCallback(() => {
    tiengRef.current ??= createSoundEngine();
    const may = tiengRef.current;
    // ensureStarted PHẢI chạy ngay trong sự kiện bấm — sau một await là trình
    // duyệt coi như không còn cử chỉ người dùng và chặn tiếng trở lại.
    may.ensureStarted();
    const moi = !tatTieng;
    may.setMuted(moi);
    luuTatTieng(moi);
  }, [tatTieng]);

  useEffect(() => {
    tiengRef.current ??= createSoundEngine();
    tiengRef.current.setMuted(tatTieng);
  }, [tatTieng]);

  useEffect(() => () => tiengRef.current?.dispose(), []);

  const [man, setMan] = useState<Man>("cho");
  const [daNoi, setDaNoi] = useState(false);
  const [hienThi, setHienThi] = useState(daiTu);
  const [ketQua, setKetQua] = useState<KetQuaHienThi | null>(null);
  const [tenNguoiChoi, setTenNguoiChoi] = useState("");
  const [anhQr, setAnhQr] = useState("");

  const token = useClientString(tokenPhien);
  const goc = useClientString(() => window.location.origin);

  const lechDongHoRef = useRef(0);
  /**
   * 🔴 R6 — ĐÃ ĐO XONG LỆCH ĐỒNG HỒ CHƯA.
   *
   * Không có cờ này thì `lech = 0` lúc chưa đo bị dùng y như một phép đo thật:
   * tin mở lượt tới trước khi `/api/gio` trả lời là màn hình quy nhầm mốc máy
   * chủ về đồng hồ của mình, và hai màn lệch pha suốt ván mà không ai biết vì
   * sao. Vòng Quay đã có cờ này từ đầu; Chọn Số bị bỏ quên.
   */
  const daDoRef = useRef(false);
  const rafRef = useRef(0);
  const batDauLucRef = useRef(0);
  const luotIdRef = useRef<number | null>(null);
  const nhipRef = useRef<RoundSettings>(nhipCua({ tu: daiTu, den: daiDen }));
  const vongRef = useRef<number[]>([]);
  const tinCuoiRef = useRef(0);

  const duongDanChoi = goc ? `${goc}/choi/${ma}` : "";

  useEffect(() => {
    if (token === "") return;
    let huy = false;
    void doLechDongHo().then((kq) => {
      if (huy) return;
      lechDongHoRef.current = kq.lech;
      daDoRef.current = true;
    });
    void xinCho(ma, "man_hinh", token);
    return () => {
      huy = true;
    };
  }, [ma, token]);

  useEffect(() => {
    if (!duongDanChoi) return;
    let huy = false;
    QRCode.toDataURL(duongDanChoi, { width: 900, margin: 1 })
      .then((url) => {
        if (!huy) setAnhQr(url);
      })
      .catch(() => {
        if (!huy) setAnhQr("");
      });
    return () => {
      huy = true;
    };
  }, [duongDanChoi]);

  const veManCho = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    luotIdRef.current = null;
    setKetQua(null);
    setTenNguoiChoi("");
    setHienThi(daiTu);
    setMan("cho");
  }, [daiTu]);

  const chayBangSo = useCallback(
    (batDauLuc: number, nhip: RoundSettings, vong: number[]) => {
      cancelAnimationFrame(rafRef.current);
      if (vong.length === 0) return;
      nhipRef.current = nhip;
      vongRef.current = vong;
      batDauLucRef.current = batDauLuc;
      setMan("chay");

      function quay() {
        const n = nhipRef.current;
        const v = vongRef.current;
        // Chưa đo xong thì coi như ván VỪA BẮT ĐẦU, đừng lấy 0 làm phép đo:
        // hai đồng hồ lệch vài giây là dãy số nhảy tới một chỗ chưa từng đúng.
        const troi = daDoRef.current
          ? (Date.now() + lechDongHoRef.current - batDauLucRef.current) / 1000
          : 0;
        if (troi >= n.roundLimitSeconds) {
          // Hết giờ — chính màn hình đứng ra chốt để ván không treo mãi. Luật
          // Chọn Số sẽ TỪ CHỐI cấp số, và người chơi được mời bấm lại.
          const id = luotIdRef.current;
          if (id !== null) {
            luotIdRef.current = null;
            void chotLuot(ma, id, n.roundLimitSeconds * 1000, "het_gio");
          }
          return;
        }
        setHienThi(soTaiGiay(n, v, troi));
        tiengRef.current?.tick(
          (speedAt(n, troi) - n.startSpeed) / Math.max(1, n.maxSpeed - n.startSpeed),
        );
        rafRef.current = requestAnimationFrame(quay);
      }
      rafRef.current = requestAnimationFrame(quay);
    },
    [ma],
  );

  const nhanTin = useCallback(
    (tin: TinTrongPhong) => {
      tinCuoiRef.current = Date.now();
      switch (tin.loai) {
        case "vao-choi":
          // 🔴 `setMan` ở đây là dòng THIẾU của bản trước: màn LCD Chọn Số NHẬN
          // được tin mà không đổi màn, nên nó treo mã QR suốt trong lúc người ta
          // đã đứng chơi. Kiểu `Man` cũng không có trạng thái trung gian nào để
          // chuyển sang — nay có `da-vao`.
          setKetQua(null);
          setHienThi(daiTu);
          setTenNguoiChoi(tin.tenRutGon);
          setMan("da-vao");
          return;
        case "bat-dau-chon-so":
          luotIdRef.current = tin.luotId;
          chayBangSo(tin.batDauLuc, tin.nhip, vongChay(tin.dai, new Set(tin.daRa)));
          return;
        case "ket-qua-chon-so":
          // SNAP về đúng con số máy kia đã dừng — độ trễ mạng chỉ làm lệch phần
          // nhoè ở giữa, còn con số cuối thì khớp tuyệt đối.
          cancelAnimationFrame(rafRef.current);
          luotIdRef.current = null;
          setHienThi(tin.so);
          setKetQua({
            so: tin.so,
            maXacThuc: tin.maXacThuc,
            conLai: tin.conLai,
            giayXemKetQua: tin.giayXemKetQua,
          });
          setMan("ket-qua");
          tiengRef.current?.win();
          return;
        case "roi-di":
          veManCho();
          return;
        default:
          return;
      }
    },
    [chayBangSo, daiTu, veManCho],
  );

  useEffect(() => {
    tinCuoiRef.current = Date.now();
    return moKenh(ma, nhanTin, setDaNoi);
  }, [ma, nhanTin]);

  // Xem kết quả xong thì tự về màn chờ. Mỗi ván đúng một lần bấm nên không có
  // ca "ván còn dở" như bên Trúng Số.
  useEffect(() => {
    if (man !== "ket-qua" || !ketQua) return;
    const hen = window.setTimeout(veManCho, ketQua.giayXemKetQua * 1000);
    return () => window.clearTimeout(hen);
  }, [man, ketQua, veManCho]);

  // Điện thoại bỏ đi giữa chừng thì màn hình không được treo mãi ở đó.
  useEffect(() => {
    if (man === "cho") return;
    const nhip = window.setInterval(() => {
      if (Date.now() - tinCuoiRef.current > LCD_IDLE_TIMEOUT_SECONDS * 1000) veManCho();
    }, 2000);
    return () => window.clearInterval(nhip);
  }, [man, veManCho]);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  // --- Nhân viên bấm ngay trên máy tính (phím cách / Enter) ---
  //
  // 🔴 Đường này KHÔNG xin chỗ, giống bên Trúng Số. Ở đây điều đó nguy hiểm hơn
  // hẳn: hai lượt song song là hai người cùng bốc một số. Luật `truocKhiMo` của
  // Chọn Số chặn ngay từ máy chủ — xem `coLuotDangMo`.
  const batDauTaiCho = useCallback(async () => {
    const kq = await moLuot(ma, null);
    if (kq.ok && kq.gioMayChu !== undefined) {
      lechDongHoRef.current = kq.gioMayChu - Date.now();
      daDoRef.current = true;
    }
  }, [ma]);

  const dungTaiCho = useCallback(() => {
    const id = luotIdRef.current;
    if (id === null) return;
    const troi = daDoRef.current
      ? Date.now() + lechDongHoRef.current - batDauLucRef.current
      : 0;
    if (troi / 1000 < nhipRef.current.lockSeconds) return;
    luotIdRef.current = null;
    void chotLuot(ma, id, troi, "man_hinh");
  }, [ma]);

  useEffect(() => {
    const phim = (e: KeyboardEvent) => {
      if (e.key !== " " && e.key !== "Enter") return;
      if (e.repeat) return;
      e.preventDefault();
      if (luotIdRef.current === null) void batDauTaiCho();
      else dungTaiCho();
    };
    window.addEventListener("keydown", phim);
    return () => window.removeEventListener("keydown", phim);
  }, [batDauTaiCho, dungTaiCho]);

  return (
    <main className="flex min-h-dvh flex-col bg-white px-6 py-6 text-muc sm:px-10">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <LogoSata chieuCao={34} sizes="136px" preload />
          <span className="text-lg font-black text-muc sm:text-2xl">{tenTrungTam}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-chi">
            {T.lcdRoomCode}: <b className="font-mono text-muc">{ma}</b>
          </span>
          <button
            type="button"
            onClick={doiTieng}
            aria-pressed={!tatTieng}
            className={[
              "rounded-xl px-3 py-2 text-sm font-bold transition",
              tatTieng ? "border border-cam text-cam" : "bg-tim-nhat text-tim",
            ].join(" ")}
          >
            {tatTieng ? T.tiengTat : T.tiengBat}
          </button>
        </div>
      </header>

      <p className="mt-1 text-sm text-chi">
        {tenDot} · {T.chonSoDai} {daiTu}–{daiDen}
      </p>

      <section className="flex flex-1 flex-col items-center justify-center gap-6">
        {man === "cho" && (
          <>
            <h1 className="text-center text-3xl font-black text-muc sm:text-5xl">
              {T.chonSoManChoTieuDe}
            </h1>
            <p className="text-center text-base text-chi sm:text-xl">
              {T.chonSoManChoNhac}
            </p>
            {anhQr !== "" && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={anhQr}
                alt={T.lcdScanToPlay}
                className="h-56 w-56 rounded-2xl bg-white sm:h-72 sm:w-72"
              />
            )}
            <LinhVatSata canh={150} sizes="150px" />
          </>
        )}

        {man !== "cho" && (
          <>
            {man === "da-vao" && (
              <p className="text-center text-2xl font-black text-tim sm:text-4xl">
                {tenNguoiChoi === "" ? T.lcdJoined : T.lcdDangChoi(tenNguoiChoi)}
              </p>
            )}
            <Led4Digits value={formatNumber(hienThi)} size="tv" />
            {man === "ket-qua" && ketQua && (
              <div className="text-center">
                <p className="text-3xl font-black text-tim sm:text-5xl">
                  {T.chonSoChucMung}
                </p>
                <p className="mt-3 text-lg text-muc sm:text-2xl">{T.chonSoDayLaSoCuaBan}</p>
                <p className="mt-4 text-sm text-chi">
                  {T.verifyCode}: <b className="font-mono text-muc">{ketQua.maXacThuc}</b>
                </p>
                {ketQua.conLai !== null && (
                  <p className="mt-1 text-sm text-chi">
                    {T.chonSoConLai}: {ketQua.conLai}
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </section>

      <footer className="flex items-end justify-between gap-4">
        <CauDinhVi />
        {!daNoi && <span className="text-xs text-chi">{T.lcdOffline}</span>}
      </footer>
    </main>
  );
}

let tokenDaSinh: string | null = null;

function tokenPhien(): string {
  if (tokenDaSinh === null) tokenDaSinh = Math.random().toString(36).slice(2, 12);
  return tokenDaSinh;
}
