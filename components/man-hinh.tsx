"use client";

import QRCode from "qrcode";
import { useCallback, useEffect, useRef, useState } from "react";

import { LCD_IDLE_TIMEOUT_SECONDS, type RoundSettings } from "@/config/game";
import type { MucCanhBao } from "@/lib/qua/canh-bao";
import { createSoundEngine } from "@/lib/am-thanh";
import { luuTatTieng, useTatTieng } from "@/lib/tieng-nho";
import { T } from "@/config/locale";
import { chotLuot, moLuot, xinCho } from "@/app/actions/choi";
import { canStop, formatNumber, speedAt, valueAt } from "@/lib/bo-dem";
import { doLechDongHo } from "@/lib/dong-bo/dong-ho";
import { moKenh, type TinTrongPhong } from "@/lib/dong-bo/kenh";
import { useClientString } from "@/lib/tren-may-khach";
import { Led4Digits } from "@/components/led-4-so";
import { CauDinhVi, LinhVatSata, LogoSata } from "@/components/nhan-dien-sata";

/**
 * Màn hình lớn đặt tại lễ tân — NƠI DUY NHẤT hiện dãy số.
 *
 * Điện thoại phụ huynh chỉ là nút bấm. Một màn hình thì không có hai màn hình
 * để mà lệch nhau, và cả sảnh cùng nhìn về một chỗ — đúng thứ tạo ra kịch tính.
 */

type Man = "cho" | "dem-nguoc" | "chay" | "ket-qua";

/**
 * KÊNH 2 của cảnh báo kho (Đ14): một CHẤM TRÒN nhỏ cạnh mã phòng.
 *
 * 🔴 KHÔNG CHỮ, và cố ý nhỏ + nhạt. Màn hình này treo giữa sảnh, phụ huynh đang
 * nhìn vào nó — một dòng "sắp hết quà" ở đây là tự tay phá không khí trò chơi.
 * Nhân viên biết chấm nghĩa là gì; khách đứng lùi ba mét thì không nhận ra nó
 * có ý nghĩa gì cả, và đó chính là yêu cầu.
 */
function ChamKho({ muc }: { muc: MucCanhBao }) {
  const mau =
    muc === "do" ? "bg-do/70" : muc === "vang" ? "bg-vang/80" : "bg-chi/25";
  return (
    <span
      data-cham-kho={muc}
      aria-hidden="true"
      className={`ml-2 inline-block h-1.5 w-1.5 rounded-full align-middle ${mau}`}
    />
  );
}

export interface ManHinhProps {
  ma: string;
  soTrung: number;
  tenTrungTam: string;
  tenGiaiThuong: string;
  thamSo: RoundSettings;
  /** Mức cảnh báo kho lúc mở trang — chỉ để vẽ chấm chỉ báo. */
  mucKho: MucCanhBao;
}

interface KetQuaHienThi {
  soDaDung: number;
  trung: boolean;
  khoangLech: number;
  hetGio: boolean;
  vanXong: boolean;
  lanDaDung: number;
  soLanChoPhep: number;
  lechTotNhat: number | null;
  maXacThuc: string;
  giayXemKetQua: number;
}

export function ManHinh({ ma, soTrung, tenTrungTam, tenGiaiThuong, thamSo, mucKho }: ManHinhProps) {
  // 🔴 Màn hình LCD KHÔNG có cú chạm nào: nhân viên mở trang rồi để đó cả ngày.
  // Trình duyệt chặn phát tiếng khi chưa có cử chỉ người dùng, và nó chặn TRONG
  // IM LẶNG — không một dòng lỗi nào. Nút "Bật tiếng" dưới đây là cú chạm đó,
  // kiêm luôn công tắc. Không có nó thì màn hình câm mà chẳng ai hiểu vì sao
  // (đúng họ hàng với bẫy `allowedDevOrigins` đã trả giá).
  // Mặc định TẮT ở đây, ngược với điện thoại: màn hình này treo giữa sảnh và
  // chạy suốt ngày. Hướng lệch an toàn là im lặng, không phải là bất ngờ phát
  // tiếng giữa giờ học của lớp bên cạnh.
  const tatTieng = useTatTieng(true);
  const tiengRef = useRef<ReturnType<typeof createSoundEngine> | null>(null);

  const doiTieng = useCallback(() => {
    tiengRef.current ??= createSoundEngine();
    const may = tiengRef.current;
    // ensureStarted PHẢI chạy ngay trong sự kiện bấm — để sau một await là
    // trình duyệt coi như không còn cử chỉ người dùng và chặn tiếng trở lại.
    may.ensureStarted();
    const moi = !tatTieng;
    may.setMuted(moi);
    luuTatTieng(moi);
  }, [tatTieng]);

  // Giữ máy phát khớp với công tắc, kể cả khi trang vừa tải xong đã là "tắt".
  useEffect(() => {
    tiengRef.current ??= createSoundEngine();
    tiengRef.current.setMuted(tatTieng);
  }, [tatTieng]);

  useEffect(() => () => tiengRef.current?.dispose(), []);

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
      const moKhoa = canStop(s, troi);
      setCoTheDung((truoc) => {
        if (moKhoa && !truoc) tiengRef.current?.unlocked();
        return moKhoa;
      });
      // Tick cao dần theo tốc độ ĐANG chạy — chính lib đã tự chặn tần suất.
      tiengRef.current?.tick(
        (speedAt(s, troi) - s.startSpeed) / Math.max(1, s.maxSpeed - s.startSpeed),
      );
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
          tiengRef.current?.countdown(tin.con <= 1);
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
            vanXong: tin.vanXong,
            lanDaDung: tin.lanDaDung,
            soLanChoPhep: tin.soLanChoPhep,
            lechTotNhat: tin.lechTotNhat,
            giayXemKetQua:
              (tin as unknown as { giayXemKetQua?: number }).giayXemKetQua ?? 8,
          });
          setMan("ket-qua");
          if (tin.vanXong) {
            if (tin.trung) tiengRef.current?.win();
            else tiengRef.current?.lose();
          }
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
  //
  // 🔴 Trừ khi VÁN CÒN DỞ: người chơi vẫn đang đứng đó với hai lần bấm chưa
  // dùng. Về màn chờ lúc này là xoá trắng thành tích đang giữ ngay trước mắt
  // cả sảnh, rồi lần bấm tiếp theo lại dựng màn hình lên từ đầu.
  useEffect(() => {
    if (man !== "ket-qua" || !ketQua || !ketQua.vanXong) return;
    const hen = window.setTimeout(veManCho, ketQua.giayXemKetQua * 1000);
    return () => window.clearTimeout(hen);
  }, [man, ketQua, veManCho]);

  // Điện thoại bỏ đi giữa chừng thì màn hình không được treo mãi ở đó.
  //
  // Đồng hồ này cũng chính là cái dọn màn khi người chơi bỏ ngang giữa ván:
  // `LCD_IDLE_TIMEOUT_SECONDS` (75 giây) đủ rộng để họ ngẫm xem có bấm tiếp
  // không, và đủ ngắn để người xếp hàng sau không phải chờ một màn hình ma.
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
    <main className="relative flex min-h-dvh flex-col bg-white p-6 lg:p-10">
      {/* 🔴 Dải nhắc ở MỌI màn, không chỉ màn chờ. Nút bật tiếng nằm trong màn
          chờ, nên khi ván đã chạy mà sảnh im thì không còn chỗ nào nói cho nhân
          viên biết vì sao — họ tưởng máy hỏng. Dải này nhỏ, góc dưới, không
          tranh chỗ với bảng số. */}
      {tatTieng && (
        <p
          data-nhac-tieng
          className="pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-cam/10 px-4 py-1.5 text-center text-xs font-bold text-cam"
        >
          {T.tiengBat} — {T.tiengNhac}
        </p>
      )}
      {/* MASTHEAD — hiện ở CẢ BỐN trạng thái, không nhấp nháy theo màn. Đứng cách
          3 mét thì đây là thứ nói cho người lạ biết họ đang nhìn cái gì của ai. */}
      <header className="flex items-start justify-between gap-6">
        <div className="flex items-start gap-5">
          <LogoSata chieuCao={44} sizes="220px" preload className="shrink-0" />
          <div>
            <p className="text-2xl font-black text-muc lg:text-4xl">{tenTrungTam}</p>
            <p className="text-sm text-chi lg:text-base">
              {T.lcdRoomCode}: <span className="font-mono font-bold">{ma}</span>
              <ChamKho muc={mucKho} />
            </p>
          </div>
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

      {/* Kẻ mảnh rồi câu định vị — nằm dưới masthead, KHÔNG đứng cạnh Brand Essence
          (ADR-002). Ở mọi trạng thái, vì nó là một dòng chữ nhỏ, không cạnh tranh
          với bảng số như một tấm hình. */}
      <div className="mt-3 border-t border-ke pt-2">
        <CauDinhVi className="text-sm lg:text-base" />
      </div>

      {!daNoi && (
        <p className="mt-4 rounded-xl bg-do/10 p-3 text-sm font-semibold text-do">
          {T.lcdOffline}
        </p>
      )}

      {man === "cho" ? (
        <div className="grid min-h-0 flex-1 items-center gap-10 lg:grid-cols-2">
          <div className="flex min-h-0 flex-col items-center gap-3 text-center lg:items-start lg:text-left">
            <p className="text-4xl font-black leading-tight text-tim lg:text-6xl">
              {T.lcdScanToPlay}
            </p>
            <p className="text-lg text-chi lg:text-2xl">{T.hint}</p>
            <p className="text-xl font-bold text-muc lg:text-3xl">
              {T.prizeLabel}: <span className="text-cam">{tenGiaiThuong}</span>
            </p>
            <p className="text-sm text-chi lg:text-lg">{T.lcdWaiting}</p>

            {/* 🔴 Linh vật CHỈ ở màn chờ, đáy cột trái, hướng về phía mã QR bên phải.
                Trạng thái `dem-nguoc` và `chay` KHÔNG có nó — cả sảnh đang nhìn 4 chữ
                số, và bất cứ hình nào trong khung nhìn cũng là đối thủ của con số.
                Đặt trên nền TRẮNG vì ảnh master không có kênh alpha. */}
            <LinhVatSata
              canh={260}
              sizes="(min-width: 1024px) 320px, 200px"
              // `min-h-0` + `shrink`: màn hình LCD thấp (1366×768 là phổ biến ở
              // trung tâm) thì linh vật co lại, không đẩy nút "Bật tiếng" ra khỏi khung.
              className="mt-2 min-h-0 w-32 shrink lg:w-56"
            />

            {/* Nút này chỉ hiện ở MÀN CHỜ. Lúc đang chơi, cả sảnh nhìn vào bảng
                số — thêm một nút bấm được vào khung là mời người ta chạm nhầm. */}
            {/* 🔴 Đang TẮT thì nút phải đập vào mắt. Bản trước để nó cùng một
                kiểu viền xám với mọi thứ khác, nên nhân viên mở màn hình rồi
                để đó cả buổi mà không biết vì sao sảnh im — máy không hỏng,
                chỉ là chưa ai bấm cái nút không ai nhìn thấy. */}
            <button
              type="button"
              onClick={doiTieng}
              data-nut-tieng={tatTieng ? "tat" : "bat"}
              className={[
                "mt-2 rounded-xl px-6 py-3 font-black transition",
                tatTieng
                  ? "border-2 border-cam bg-cam/10 text-base text-cam hover:bg-cam hover:text-white lg:text-lg"
                  : "border border-ke text-sm text-muc hover:border-tim hover:text-tim lg:text-base",
              ].join(" ")}
            >
              {tatTieng ? T.tiengBat : T.tiengTat}
            </button>
            {tatTieng && (
              <p className="max-w-md text-xs leading-relaxed text-chi">{T.tiengNhac}</p>
            )}
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
                  {/* Bảng LED giữ nguyên con số VỪA BẤM — nó phải khớp với
                      chỗ dãy số đang chạy tới, nếu không cả sảnh thấy máy tự
                      đổi số. Còn lời KẾT LUẬN thì lấy lần tốt nhất của ván,
                      đúng như trên điện thoại: hai màn hình nói cùng một câu. */}
                  <p
                    className={
                      satNut
                        ? "text-3xl font-black text-cam lg:text-5xl"
                        : "text-3xl font-bold text-muc lg:text-5xl"
                    }
                  >
                    {ketQua.hetGio && ketQua.soLanChoPhep === 1
                      ? T.timedOut
                      : T.offByN(ketQua.lechTotNhat ?? ketQua.khoangLech)}
                  </p>
                  {ketQua.vanXong && ketQua.soLanChoPhep > 1 && (
                    <p className="text-base uppercase tracking-widest text-chi lg:text-xl">
                      {T.vanKetQuaTotNhat}
                    </p>
                  )}
                  <p className="text-lg text-chi lg:text-2xl">
                    {satNut ? T.soClose : T.stillFar}
                  </p>
                  {/* Hai màn hình phải nói cùng một câu, cùng một giây, trong
                      cùng một phòng — nếu không chúng cãi nhau trước mặt khách.
                      Giữa ván thì câu đúng là "còn lần bấm", không phải lời
                      cảm ơn tiễn khách. */}
                  {ketQua.vanXong ? (
                    <p className="mt-4 text-xl text-chi lg:text-3xl">{T.loseThanks}</p>
                  ) : (
                    <p className="mt-4 text-2xl font-black text-tim lg:text-4xl">
                      {T.vanLanThu(ketQua.lanDaDung, ketQua.soLanChoPhep)} ·{" "}
                      {T.vanConLan(ketQua.soLanChoPhep - ketQua.lanDaDung)}
                    </p>
                  )}
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
