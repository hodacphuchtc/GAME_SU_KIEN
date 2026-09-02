"use client";

import QRCode from "qrcode";
import { useCallback, useEffect, useRef, useState } from "react";

import { T } from "@/config/locale";
import { doLechDongHo } from "@/lib/dong-bo/dong-ho";
import { moKenh, type TinTrongPhong } from "@/lib/dong-bo/kenh";
import { useClientString } from "@/lib/tren-may-khach";
import type { Cung } from "@/lib/vong-quay/chia-o";
import { taoMayAmThanh, type MayAmThanh } from "@/lib/vong-quay/am-thanh";
import { GIAY_QUAY } from "@/config/vong-quay";
import { CauDinhVi, LogoSata } from "./nhan-dien-sata";
import { VongQuay } from "./vong-quay";

/**
 * MÀN HÌNH LCD trước sảnh — nơi DUY NHẤT cả sảnh cùng nhìn.
 *
 * 🔴 Màn này KHÔNG nhận từng khung hình qua mạng. Nó nhận đúng bốn thứ
 * `(gocDung, thoiLuong, batDauLuc, cung)` rồi tự chạy `goc(t)` bằng đồng hồ của
 * chính nó, sau khi đã canh lệch với máy chủ. Nhờ vậy độ trễ mạng chỉ làm lệch
 * phần ĐANG QUAY vài chục mili-giây, còn ô dừng thì khớp với điện thoại 100%.
 *
 * 🔴 Vào GIỮA CHỪNG vẫn đúng: mốc bắt đầu quy về đồng hồ máy này có thể nằm
 * trong QUÁ KHỨ, khi đó `goc(t)` nhảy thẳng tới chỗ đang quay. Tải lại trang
 * giữa ván không làm vòng quay lại từ đầu.
 */
export function ManHinhVongQuay({
  ma,
  cungBanDau,
  tenCoSo,
  ipLan,
}: {
  ma: string;
  cungBanDau: Cung[];
  tenCoSo: string;
  /** IP LAN của MÁY CHỦ, do trang truyền xuống. `null` = máy không ra mạng nào. */
  ipLan: string | null;
}) {
  const [anhQr, setAnhQr] = useState("");
  const [daNoi, setDaNoi] = useState(true);
  const [cung, setCung] = useState<Cung[]>(cungBanDau);
  const [gocDich, setGocDich] = useState<number | null>(null);
  const [batDauCucBo, setBatDauCucBo] = useState<number | null>(null);
  const [nguoiQuay, setNguoiQuay] = useState<string | null>(null);
  const [ketQua, setKetQua] = useState<{ oTen: string; ma: string; ten: string } | null>(null);

  /**
   * Độ lệch đồng hồ với máy chủ. Giữ trong ref: đọc trong hàm xử lý tin, đổi nó
   * không cần vẽ lại gì cả.
   *
   * 🔴 `daDoRef` KHÔNG thừa. `doLechDongHo()` là bất đồng bộ; một tin quay tới
   * TRƯỚC khi nó xong thì `lech = 0` bị dùng như một phép đo thật. Máy quầy lệch
   * đồng hồ với máy chủ 30 giây là vòng đứng im nửa phút rồi nhảy thẳng tới
   * đích — hoặc nhảy tới đích ngay lập tức. Chưa đo xong thì phải nói thẳng ra
   * là chưa đo, và lấy "bây giờ" làm gốc.
   */
  const lechRef = useRef(0);
  const daDoRef = useRef(false);

  /**
   * Máy âm thanh. Giữ trong ref vì nó là tài nguyên trình duyệt, không phải dữ
   * liệu để vẽ.
   *
   * 🔴 `AudioContext` bị trình duyệt khoá tới khi có tương tác NGƯỜI DÙNG. Màn
   * LCD mở suốt buổi và không ai bấm gì trên nó — nên phải có nút "Bật tiếng"
   * để nhân viên bấm MỘT lần lúc mở màn hình. Không có nút đó thì tiếng im
   * lặng không kêu, và không một dòng lỗi nào giải thích vì sao.
   */
  const mayRef = useRef<MayAmThanh | null>(null);
  const [coTieng, setCoTieng] = useState(false);
  const [daChieu, setDaChieu] = useState(false);
  /** Đã có ít nhất một lượt chạy qua trong lúc máy phát chưa sẵn sàng. */
  const [imLang, setImLang] = useState(false);

  useEffect(() => {
    return () => {
      mayRef.current?.dong();
      mayRef.current = null;
    };
  }, []);

  /**
   * MỘT cú chạm mở khoá cả ba thứ màn LCD cần cho trọn buổi.
   *
   * 🔴 Nút "Bật tiếng" nhỏ ở góc là sai chỗ: nhân viên mở màn hình rồi bỏ đi,
   * không ai nhìn thấy nó. Lớp phủ toàn màn hình thì KHÔNG THỂ bỏ qua — và cú
   * chạm bắt buộc ấy chính là thứ trình duyệt đòi để mở khoá `AudioContext`.
   */
  const batDauChieu = useCallback(() => {
    if (!mayRef.current) mayRef.current = taoMayAmThanh();
    const may = mayRef.current;
    // Mở khoá NGAY TRONG sự kiện chạm — hoãn sang tick sau là trình duyệt từ chối.
    may.moKhoa();
    may.datTatTieng(false);
    setCoTieng(true);
    setDaChieu(true);
    // Toàn màn hình + giữ màn không tắt. Cả hai đều có thể bị từ chối (trình
    // duyệt cũ, thiết bị không hỗ trợ) và cả hai đều KHÔNG chặn buổi chiếu.
    void document.documentElement.requestFullscreen?.().catch(() => {});
    void (
      navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<unknown> } }
    ).wakeLock
      ?.request("screen")
      .catch(() => {});
  }, []);

  const duongDanChoi = useClientString(() =>
    typeof window === "undefined" ? "" : `${window.location.origin}/choi/${ma}`,
  );

  /**
   * 🔴 MÃ QR SINH TỪ `window.location.origin`, nên mở màn hình bằng `localhost`
   * là in ra một mã QR mã hoá chính chữ "localhost" — điện thoại quét vào thì
   * nó trỏ về CHÍNH CHIẾC ĐIỆN THOẠI ĐÓ. Trang vẫn hiện QR đẹp đẽ và không một
   * dòng lỗi nào. Đây là lỗi đầu tiên gặp trong buổi test thật 02/09/2026.
   *
   * Dải cảnh báo phải hiện NGAY TRÊN MÀN LCD, không phải trong log máy chủ:
   * người mở màn hình ở quầy không bao giờ nhìn vào cửa sổ terminal.
   */
  const qrHong = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:|$|\/)/.test(duongDanChoi);
  const diaChiDung = ipLan === null ? null : `http://${ipLan}:${typeof window === "undefined" ? "" : window.location.port}/man-hinh/${ma}`;
  const [daChep, setDaChep] = useState(false);

  useEffect(() => {
    doLechDongHo().then((kq) => {
      lechRef.current = kq.lech;
      daDoRef.current = true;
    });
  }, []);

  useEffect(() => {
    if (duongDanChoi === "") return;
    let huy = false;
    QRCode.toDataURL(duongDanChoi, { width: 900, margin: 1 })
      .then((url) => {
        if (!huy) setAnhQr(url);
      })
      .catch(() => {
        // Không vẽ được QR thì màn vẫn phải sống: bên dưới còn in đường dẫn chữ.
        if (!huy) setAnhQr("");
      });
    return () => {
      huy = true;
    };
  }, [duongDanChoi]);

  const nhanTin = useCallback((tin: TinTrongPhong) => {
    switch (tin.loai) {
      case "bat-dau-quay": {
        setKetQua(null);
        setCung(tin.cung);
        setGocDich(tin.gocDung);
        setNguoiQuay(tin.tenRutGon);
        // Quy mốc của MÁY CHỦ về đồng hồ máy này. `daTroi` dương nghĩa là ván
        // đã chạy được bấy nhiêu — trừ đi để `goc(t)` nhảy đúng chỗ đang quay.
        //
        // 🔴 CHƯA đo xong độ lệch thì coi như ván bắt đầu NGAY BÂY GIỜ (daTroi = 0)
        // thay vì tin vào `lech = 0`. Sai lệch tối đa khi đó là một lượt đi–về
        // mạng nội bộ (vài chục ms); còn tin vào số 0 giả thì sai bằng đúng độ
        // lệch đồng hồ giữa hai máy — có thể là hàng chục giây.
        const daTroi = daDoRef.current
          ? Date.now() + lechRef.current - tin.batDauLuc
          : 0;
        setBatDauCucBo(performance.now() - daTroi);
        // Xếp trọn nhịp tick + tiếng ăn mừng ngay lúc này, trên đồng hồ của
        // AudioContext. Phát theo vòng lặp khung hình thì rớt khung nghe ra
        // ngay thành tiếng vấp. `daTroi` cho màn vào giữa chừng bắt đúng nhịp.
        // 🔴 KHÔNG dùng `mayRef.current?.` ở đây. Optional chaining nuốt trọn ca
        // hỏng: chưa bấm "BẮT ĐẦU CHIẾU" thì nó lặng lẽ không làm gì, KHÔNG lỗi,
        // KHÔNG log, và người vận hành chỉ thấy "nó không kêu" mà không biết vì
        // sao. Ở nhánh mà sự vắng mặt là BẤT THƯỜNG, phải làm nó nhìn thấy được.
        if (mayRef.current) {
          mayRef.current.datLichQuay(
            tin.gocDung,
            tin.thoiLuong || GIAY_QUAY,
            tin.cung,
            Math.max(0, daTroi / 1000),
          );
        } else {
          setImLang(true);
        }
        break;
      }
      case "ket-qua-quay":
        setKetQua({ oTen: tin.oTen, ma: tin.maXacThuc, ten: tin.tenRutGon });
        break;
      case "nguoi-choi-vao":
        setNguoiQuay(tin.tenRutGon);
        break;
      case "roi-di":
        setNguoiQuay(null);
        setKetQua(null);
        setGocDich(null);
        setBatDauCucBo(null);
        break;
      default:
        // Tin lạ (phiên bản sau) thì bỏ qua, không được làm sập màn đang chiếu.
        break;
    }
  }, []);

  useEffect(() => moKenh(ma, nhanTin, setDaNoi), [ma, nhanTin]);

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center gap-6 bg-suong px-6 py-8">
      {!daChieu && (
        <button
          type="button"
          onClick={batDauChieu}
          className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-white/95 px-8 text-center"
        >
          <span className="text-4xl font-black text-tim md:text-6xl">{T.lcdBatDauChieu}</span>
          <span className="max-w-xl text-base text-chi md:text-lg">{T.lcdBatDauChieuVi}</span>
        </button>
      )}

      <header className="flex flex-col items-center text-center">
        {/* 🔴 Logo đặt trên nền TRẮNG/sương, không có hiệu ứng nào chạy xuyên
            qua. Khoảng thở do chính component nhận diện lo. */}
        <LogoSata chieuCao={64} sizes="(max-width: 768px) 160px, 220px" preload />
        <h1 className="text-3xl font-black text-tim md:text-5xl">{T.tenUngDung}</h1>
        <p className="mt-1 text-base text-chi md:text-xl">{tenCoSo}</p>
        <CauDinhVi className="mt-1 text-sm md:text-base" />
      </header>

      {imLang && !coTieng && (
        <p role="alert" className="rounded-xl bg-vang/20 px-4 py-2 text-sm font-semibold text-muc">
          {T.lcdChuaCoTieng}
        </p>
      )}

      {qrHong && (
        <div
          role="alert"
          className="w-full max-w-3xl rounded-2xl border-2 border-vang bg-vang/20 px-5 py-4 text-center"
        >
          <p className="text-lg font-black text-muc">{T.lcdQrSaiTieuDe}</p>
          <p className="mt-1 text-sm text-muc">
            {diaChiDung === null ? T.lcdQrSaiKhongBietIp : T.lcdQrSaiVi(diaChiDung)}
          </p>
          {diaChiDung !== null && (
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard
                  ?.writeText(diaChiDung)
                  .then(() => setDaChep(true))
                  // Trình duyệt chặn clipboard thì địa chỉ vẫn nằm ngay trên màn
                  // hình để gõ tay — im lặng ở đây không giấu mất thông tin nào.
                  .catch(() => {});
              }}
              className="mt-3 rounded-xl bg-muc px-4 py-2 text-sm font-bold text-white"
            >
              {daChep ? T.lcdQrSaiDaChep : T.lcdQrSaiChep}
            </button>
          )}
        </div>
      )}

      {!daNoi && (
        <p role="status" className="rounded-xl bg-vang/20 px-4 py-2 text-sm text-muc">
          {T.lcdMatKetNoi}
        </p>
      )}

      <div className="grid w-full max-w-5xl items-center gap-8 md:grid-cols-[1fr_auto]">
        <div className="mx-auto w-full max-w-2xl">
          <VongQuay cung={cung} gocDich={gocDich} batDauLuc={batDauCucBo} />
        </div>

        <aside className="mx-auto w-full max-w-xs text-center">
          {ketQua ? (
            <div className="rounded-3xl border-4 border-cam bg-white p-6">
              <p className="text-2xl font-black text-cam md:text-3xl">{T.lcdTrungTieuDe}</p>
              <p className="mt-3 text-base text-chi">{T.lcdTrungCua(ketQua.ten)}</p>
              <p className="mt-1 text-2xl font-black text-muc">{ketQua.oTen}</p>
              <p className="mt-5 text-xs uppercase tracking-wide text-chi">{T.lcdMaXacThuc}</p>
              <p className="font-mono text-4xl font-black tracking-[0.25em] text-tim">
                {ketQua.ma}
              </p>
            </div>
          ) : (
            <div className="rounded-3xl border border-ke bg-white p-6">
              <p className="text-xl font-black text-muc">{T.lcdQuetMa}</p>
              {anhQr ? (
                /* eslint-disable-next-line @next/next/no-img-element -- ảnh là
                   data: URI sinh tại chỗ, không có tệp nào để `next/image` tối ưu. */
                <img
                  src={anhQr}
                  alt={T.lcdQuetMa}
                  className="mx-auto mt-4 aspect-square w-full max-w-[15rem]"
                />
              ) : (
                <p className="mt-4 break-all font-mono text-xs text-chi">{duongDanChoi}</p>
              )}
              <p className="mt-4 text-sm text-chi">{T.lcdHuongDan}</p>
              <p className="mt-3 text-sm font-semibold text-tim">
                {nguoiQuay ? T.lcdNguoiChoi(nguoiQuay) : T.lcdDangCho}
              </p>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
