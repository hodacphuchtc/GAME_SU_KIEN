"use client";

import QRCode from "qrcode";
import { useCallback, useEffect, useRef, useState } from "react";

import { LCD_IDLE_TIMEOUT_SECONDS, type RoundSettings } from "@/config/game";
import { T } from "@/config/locale";
import { chotLuot, moLuot, xinCho } from "@/app/actions/choi";
import { canStop, formatNumber, valueAt } from "@/lib/bo-dem";
import { doLechDongHo } from "@/lib/dong-bo/dong-ho";
import { moKenh, type TinTrongPhong } from "@/lib/dong-bo/kenh";
import { useClientString } from "@/lib/tren-may-khach";
import { Led4Digits } from "@/components/led-4-so";

/**
 * Màn hình lớn đặt tại lễ tân — NƠI DUY NHẤT hiện dãy số.
 *
 * Điện thoại phụ huynh chỉ là nút bấm. Một màn hình thì không có hai màn hình
 * để mà lệch nhau, và cả sảnh cùng nhìn về một chỗ — đúng thứ tạo ra kịch tính.
 */

type Man = "cho" | "dem-nguoc" | "chay" | "ket-qua";

export interface ManHinhProps {
  ma: string;
  soTrung: number;
  tenTrungTam: string;
  tenGiaiThuong: string;
  thamSo: RoundSettings;
}

interface KetQuaHienThi {
  soDaDung: number;
  trung: boolean;
  khoangLech: number;
  hetGio: boolean;
  maXacThuc: string;
  giayXemKetQua: number;
}

export function ManHinh({ ma, soTrung, tenTrungTam, tenGiaiThuong, thamSo }: ManHinhProps) {
  const [man, setMan] = useState<Man>("cho");
  const [daNoi, setDaNoi] = useState(false);
  const [hienThi, setHienThi] = useState(0);
  const [demNguoc, setDemNguoc] = useState(0);
  const [ketQua, setKetQua] = useState<KetQuaHienThi | null>(null);
  const [anhQr, setAnhQr] = useState("");
  const [coTheDung, setCoTheDung] = useState(false);

  const token = useClientString(tokenPhien);
  const goc = useClientString(() => window.location.origin);

  const lechDongHoRef = useRef(0);
  const rafRef = useRef(0);
  const batDauLucRef = useRef(0);
  const luotIdRef = useRef<number | null>(null);
  const thamSoRef = useRef<RoundSettings>(thamSo);
  const tinCuoiRef = useRef(0);

  const duongDanChoi = goc ? `${goc}/choi/${ma}` : "";

  // --- Canh đồng hồ với máy chủ, giữ chỗ màn hình ---
  useEffect(() => {
    if (token === "") return;
    let huy = false;
    void doLechDongHo().then((kq) => {
      if (!huy) lechDongHoRef.current = kq.lech;
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
    setHienThi(0);
    setCoTheDung(false);
    setMan("cho");
  }, []);

  const chayBangSo = useCallback((batDauLuc: number, ts: RoundSettings) => {
    cancelAnimationFrame(rafRef.current);
    thamSoRef.current = ts;
    batDauLucRef.current = batDauLuc;
    setMan("chay");

    function vong() {
      const s = thamSoRef.current;
      const troi = (Date.now() + lechDongHoRef.current - batDauLucRef.current) / 1000;
      if (troi >= s.roundLimitSeconds) {
        // Hết giờ — chính màn hình đứng ra chốt để ván không treo mãi.
        const id = luotIdRef.current;
        if (id !== null) {
          luotIdRef.current = null;
          void chotLuot(ma, id, s.roundLimitSeconds * 1000, "het_gio");
        }
        return;
      }
      setHienThi(valueAt(s, troi));
      setCoTheDung(canStop(s, troi));
      rafRef.current = requestAnimationFrame(vong);
    }
    rafRef.current = requestAnimationFrame(vong);
  }, [ma]);

  const nhanTin = useCallback(
    (tin: TinTrongPhong) => {
      tinCuoiRef.current = Date.now();
      switch (tin.loai) {
        case "nguoi-choi-vao":
          setKetQua(null);
          setHienThi(0);
          setMan("dem-nguoc");
          setDemNguoc(0);
          return;
        case "dem-nguoc":
          setDemNguoc(tin.con);
          setMan("dem-nguoc");
          return;
        case "bat-dau":
          luotIdRef.current = tin.luotId;
          chayBangSo(tin.batDauLuc, tin.thamSo);
          return;
        case "ket-qua": {
          // Chốt đúng con số máy kia đã dừng — độ trễ mạng chỉ làm lệch phần
          // nhoè ở giữa, còn con số cuối thì khớp tuyệt đối.
          cancelAnimationFrame(rafRef.current);
          luotIdRef.current = null;
          setHienThi(tin.soDaDung);
          setKetQua({
            soDaDung: tin.soDaDung,
            trung: tin.trung,
            khoangLech: tin.khoangLech,
            hetGio: tin.hetGio,
            maXacThuc: tin.maXacThuc,
            giayXemKetQua:
              (tin as unknown as { giayXemKetQua?: number }).giayXemKetQua ?? 8,
          });
          setMan("ket-qua");
          return;
        }
        case "roi-di":
          veManCho();
          return;
        default:
          return;
      }
    },
    [chayBangSo, veManCho],
  );

  useEffect(() => {
    tinCuoiRef.current = Date.now();
    return moKenh(ma, nhanTin, setDaNoi);
  }, [ma, nhanTin]);

  // Xem kết quả xong thì tự về màn chờ, sẵn sàng cho người tiếp theo.
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

  // --- Nhân viên bấm ngay trên máy tính ---
  const batDauTaiCho = useCallback(async () => {
    const kq = await moLuot(ma, null);
    if (kq.ok && kq.batDauLuc !== undefined && kq.gioMayChu !== undefined) {
      // Canh lại đồng hồ ngay từ chính lượt gọi này cho khỏi lệch.
      lechDongHoRef.current = kq.gioMayChu - Date.now();
    }
  }, [ma]);

  const dungTaiCho = useCallback(() => {
    const id = luotIdRef.current;
    if (id === null) return;
    const troi = Date.now() + lechDongHoRef.current - batDauLucRef.current;
    if (!canStop(thamSoRef.current, troi / 1000)) return;
    luotIdRef.current = null;
    void chotLuot(ma, id, troi, "man_hinh");
  }, [ma]);

  useEffect(() => {
    const phim = (e: KeyboardEvent) => {
      if (e.key !== " " && e.key !== "Enter") return;
      if (e.repeat) return;
      e.preventDefault();
      if (man === "cho") void batDauTaiCho();
      else if (man === "chay") dungTaiCho();
    };
    window.addEventListener("keydown", phim);
    return () => window.removeEventListener("keydown", phim);
  }, [man, batDauTaiCho, dungTaiCho]);

  const soHienThi = formatNumber(man === "cho" ? 0 : hienThi);
  const satNut = ketQua !== null && ketQua.khoangLech <= 10;

  return (
    <main className="flex min-h-dvh flex-col bg-white p-6 lg:p-10">
      <header className="flex items-start justify-between gap-6">
        <div>
          <p className="text-2xl font-black text-muc lg:text-4xl">{tenTrungTam}</p>
          <p className="text-sm text-chi lg:text-base">
            {T.lcdRoomCode}: <span className="font-mono font-bold">{ma}</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-tim lg:text-sm">
            {T.targetLabel}
          </p>
          <p className="font-mono text-5xl font-black tracking-[0.12em] text-cam lg:text-7xl">
            {formatNumber(soTrung)}
          </p>
        </div>
      </header>

      {!daNoi && (
        <p className="mt-4 rounded-xl bg-do/10 p-3 text-sm font-semibold text-do">
          {T.lcdOffline}
        </p>
      )}

      {man === "cho" ? (
        <div className="grid flex-1 items-center gap-10 lg:grid-cols-2">
          <div className="flex flex-col items-center gap-4 text-center lg:items-start lg:text-left">
            <p className="text-4xl font-black leading-tight text-tim lg:text-6xl">
              {T.lcdScanToPlay}
            </p>
            <p className="text-lg text-chi lg:text-2xl">{T.hint}</p>
            <p className="text-xl font-bold text-muc lg:text-3xl">
              {T.prizeLabel}: <span className="text-cam">{tenGiaiThuong}</span>
            </p>
            <p className="text-sm text-chi lg:text-lg">{T.lcdWaiting}</p>
          </div>
          <div className="flex justify-center">
            {anhQr && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={anhQr}
                alt={T.lcdScanToPlay}
                className="aspect-square w-full max-w-[min(78vw,58vh)] rounded-3xl border-4 border-tim bg-white p-4"
              />
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
          {man === "dem-nguoc" && (
            <p className="text-3xl font-black text-tim lg:text-5xl">
              {demNguoc > 0 ? demNguoc : T.lcdJoined}
            </p>
          )}

          <div className="vien-mach rounded-3xl bg-[var(--color-led-nen)] p-5">
            <Led4Digits value={soHienThi} size="tv" />
          </div>

          {man === "chay" && (
            <p className="text-2xl font-black tracking-[0.3em] text-cam lg:text-4xl">
              {coTheDung ? T.lcdPlaying : T.speedingUp}
            </p>
          )}

          {man === "ket-qua" && ketQua && (
            <div className="flex flex-col items-center gap-3">
              {ketQua.trung ? (
                <>
                  <p className="text-5xl font-black text-cam lg:text-8xl">{T.congrats}</p>
                  <p className="text-2xl font-bold text-tim lg:text-4xl">
                    {T.prizeLabel}: {tenGiaiThuong}
                  </p>
                  <p className="text-lg text-chi lg:text-2xl">
                    {T.verifyCode}:{" "}
                    <span className="font-mono font-black tracking-[0.35em] text-luc">
                      {ketQua.maXacThuc}
                    </span>
                  </p>
                </>
              ) : (
                <>
                  <p className="text-4xl font-black text-chi lg:text-7xl">{T.lost}</p>
                  <p
                    className={
                      satNut
                        ? "text-3xl font-black text-cam lg:text-5xl"
                        : "text-3xl font-bold text-muc lg:text-5xl"
                    }
                  >
                    {ketQua.hetGio ? T.timedOut : T.offByN(ketQua.khoangLech)}
                  </p>
                  <p className="text-lg text-chi lg:text-2xl">
                    {satNut ? T.soClose : T.stillFar}
                  </p>
                  {/* Hai màn hình phải nói cùng một câu, cùng một giây, trong
                      cùng một phòng — nếu không chúng cãi nhau trước mặt khách. */}
                  <p className="mt-4 text-xl text-chi lg:text-3xl">
                    {T.loseThanks}
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </main>
  );
}

/** Định danh của MÁY NÀY trong một phiên — không phải danh tính người dùng. */
let tokenDaSinh: string | null = null;
function tokenPhien(): string {
  if (tokenDaSinh === null) tokenDaSinh = Math.random().toString(36).slice(2, 12);
  return tokenDaSinh;
}
