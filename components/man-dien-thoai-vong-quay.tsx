"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { T } from "@/config/locale";
import { GIAY_QUAY } from "@/config/vong-quay";
import { doLechDongHo } from "@/lib/dong-bo/dong-ho";
import { taoMayAmThanh, type MayAmThanh } from "@/lib/vong-quay/am-thanh";
import { ketThucLuot, quayMot, roiDiQuay, type KetQuaQuay } from "@/app/actions/vong-quay";
/** Chỉ hai thứ màn này cần: id để gọi `quayMot`, tên để chào. KHÔNG nhận trọn
 * hồ sơ `NguoiChoi` — số điện thoại và cờ đồng ý tư vấn không có việc gì phải
 * đi xuống máy khách. */
interface NguoiDangQuay {
  id: number;
  hoTen: string;
}
import type { Cung } from "@/lib/vong-quay/chia-o";

import { FormNhanDienVongQuay } from "./form-nhan-dien-vong-quay";
import { LogoSata } from "./nhan-dien-sata";
import { VongQuay } from "./vong-quay";

/**
 * MÀN CHƠI trên điện thoại phụ huynh: nhận diện → quay → nhận quà.
 *
 * 🔴 Máy chủ quyết kết quả TRƯỚC khi vòng bắt đầu chạy. Thành phần này chỉ nhận
 * `gocDung` rồi quay tới đó. Không có một dòng nào ở đây ảnh hưởng được kết quả
 * — kể cả người dùng mở công cụ nhà phát triển và sửa mã trên máy họ.
 */
export function ManDienThoaiVongQuay({
  ma,
  cungBanDau,
  coSoChon,
}: {
  ma: string;
  cungBanDau: Cung[];
  /** Danh sách cơ sở để phụ huynh tự chọn. `null` = chương trình đã gán sẵn. */
  coSoChon: { id: number; nhan: string }[] | null;
}) {
  const [nguoiChoi, setNguoiChoi] = useState<NguoiDangQuay | null>(null);
  const [luot, setLuot] = useState<KetQuaQuay["luot"] | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const [dangQuay, setDangQuay] = useState(false);
  const [daDung, setDaDung] = useState(false);
  const [batDauLuc, setBatDauLuc] = useState<number | null>(null);

  /**
   * 🔴 ĐIỆN THOẠI CŨNG PHẢI ĐO LỆCH ĐỒNG HỒ.
   *
   * Bản trước lấy `performance.now()` làm gốc còn màn LCD quy đổi từ mốc máy
   * chủ — hai gốc khác nhau, nên LCD luôn chạy trước 0,1–0,5 giây. Phụ huynh
   * nhìn điện thoại, cả sảnh nhìn LCD, và hai vòng quay lệch pha nhau suốt ván.
   * Dùng CHUNG mốc máy chủ là cách duy nhất để hai màn khớp.
   */
  const lechRef = useRef(0);
  const daDoRef = useRef(false);

  useEffect(() => {
    doLechDongHo().then((kq) => {
      lechRef.current = kq.lech;
      daDoRef.current = true;
    });
  }, []);

  /**
   * Máy âm thanh của điện thoại.
   *
   * 🔴 Bản trước KHÔNG import `lib/am-thanh` một dòng nào — nên "quay không có
   * nhạc" trên điện thoại không phải lỗi cấu hình, mà là tính năng chưa từng
   * được nối. Ở đây không cần nút "Bật tiếng": cú chạm vào nút QUAY CHÍNH LÀ
   * tương tác người dùng mà trình duyệt đòi để mở khoá `AudioContext`.
   */
  const mayRef = useRef<MayAmThanh | null>(null);

  useEffect(() => {
    return () => {
      mayRef.current?.dong();
      mayRef.current = null;
    };
  }, []);

  /**
   * Rời trang thì trả màn LCD về mã QR, để người kế tiếp quét được ngay.
   *
   * 🔴 Màn LCD đã xử lý tin roi-di từ lâu mà KHÔNG nơi nào phát cho Vòng Quay —
   * nhánh ấy chưa từng chạy lần nào. Đây là nối lại dây bị hụt.
   *
   * Bắt cả pagehide: trên iOS, đóng tab hay chuyển ứng dụng thì component không
   * bao giờ được gỡ, nên chỉ dựa vào hàm dọn của effect là mất trắng ca đó.
   */
  useEffect(() => {
    const roi = () => void roiDiQuay(ma);
    window.addEventListener("pagehide", roi);
    return () => {
      window.removeEventListener("pagehide", roi);
      roi();
    };
  }, [ma]);

  // 🔴 KHÔNG phát tin từ máy khách nữa. Sau khi gộp (ADR-011), MỌI tin đi ra
  // màn LCD đều do MÁY CHỦ phát trong chính hành động ghi dữ liệu — một đường
  // duy nhất, và không tồn tại ca "ghi được nhưng phát hụt".
  const nhanNguoiChoi = useCallback((n: NguoiDangQuay) => setNguoiChoi(n), []);

  async function bamQuay() {
    if (!nguoiChoi || dangQuay) return;
    setDangQuay(true);
    setLoi(null);

    // Mở khoá âm thanh NGAY TRONG sự kiện chạm, trước cả lượt gọi máy chủ —
    // hoãn sang sau `await` là trình duyệt không còn coi đó là cử chỉ người dùng.
    if (!mayRef.current) mayRef.current = taoMayAmThanh();
    mayRef.current.moKhoa();
    mayRef.current.datTatTieng(false);

    const kq = await quayMot(ma, nguoiChoi.id);
    if (kq.loi || !kq.luot) {
      setLoi(kq.loi ?? T.quayHetQua);
      setDangQuay(false);
      return;
    }
    setLuot(kq.luot);
    // Tin `bat-dau-quay` do MÁY CHỦ phát ngay trong `quayMot` — nó mang mốc
    // theo đồng hồ máy chủ, và LCD quy đổi bằng độ lệch nó tự đo ở `/api/gio`.
    // Quy mốc MÁY CHỦ về đồng hồ máy này — ĐÚNG phép quy đổi màn LCD đang dùng.
    // Hai màn cùng một gốc thì chúng quay khớp nhau và dừng cùng một lúc.
    const daTroi = daDoRef.current ? Date.now() + lechRef.current - kq.luot.batDauLuc : 0;
    setBatDauLuc(performance.now() - daTroi);

    // Xếp trọn nhịp tick + tiếng ăn mừng trên đồng hồ của AudioContext, không
    // phát theo vòng lặp khung hình: rớt khung nghe ra ngay thành tiếng vấp.
    mayRef.current.datLichQuay(
      kq.luot.gocDung,
      kq.luot.thoiLuong || GIAY_QUAY,
      kq.luot.cung,
      Math.max(0, daTroi / 1000),
    );
  }

  const khiDung = useCallback(async () => {
    setDaDung(true);
    setDangQuay(false);
    if (!luot) return;
    // `ketThucLuot` vừa đóng lượt vừa phát `ket-qua-quay` cho màn LCD — gọi ở
    // ĐÂY, lúc vòng đã dừng, chứ không phải lúc mở lượt. Phát sớm là cả sảnh
    // biết kết quả trước người đang chơi.
    await ketThucLuot(luot.id);
  }, [luot]);

  if (!nguoiChoi) {
    return (
      <>
        <div className="mb-4 flex justify-center">
          <LogoSata chieuCao={40} sizes="140px" preload />
        </div>
        <p className="mb-4 text-center text-sm text-chi">{T.choiMoiNhap}</p>
        <FormNhanDienVongQuay ma={ma} coSoChon={coSoChon} onXong={nhanNguoiChoi} />
      </>
    );
  }

  return (
    <div className="flex flex-col items-center">
      {!daDung && (
        <p className="mb-3 text-center text-base font-black text-muc">
          {T.choiChaoLai(nguoiChoi.hoTen)}
        </p>
      )}

      <VongQuay
        cung={luot?.cung ?? cungBanDau}
        gocDich={luot?.gocDung ?? null}
        batDauLuc={batDauLuc}
        onDung={khiDung}
      />

      {daDung && luot ? (
        <div className="mt-5 w-full rounded-2xl border border-ke bg-white p-6 text-center">
          <p className="text-xl font-black text-tim">{T.quayTrungTieuDe}</p>
          <p className="mt-2 text-lg font-black text-muc">{T.quayTrungO(luot.oTen)}</p>
          <p className="mt-4 text-xs uppercase tracking-wide text-chi">{T.quayMaXacThuc}</p>
          <p className="font-mono text-3xl font-black tracking-[0.3em] text-cam">
            {luot.maXacThuc}
          </p>
          <p className="mt-4 text-sm text-chi">{T.quayHuongDanNhan}</p>
        </div>
      ) : (
        <>
          {loi && (
            <p
              role="alert"
              className="mt-4 rounded-xl bg-do/10 p-3 text-center text-sm font-semibold text-do"
            >
              {loi}
            </p>
          )}
          <button
            type="button"
            onClick={bamQuay}
            disabled={dangQuay}
            className="mt-5 w-full rounded-2xl bg-cam px-8 py-5 text-2xl font-black tracking-wide text-white disabled:opacity-60"
          >
            {dangQuay ? T.quayDangQuay : T.quayNut}
          </button>
          <p className="mt-3 text-center text-sm text-chi">{T.choiSanSang}</p>
        </>
      )}
    </div>
  );
}
