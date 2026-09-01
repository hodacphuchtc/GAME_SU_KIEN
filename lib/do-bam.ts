/**
 * PHÉP ĐO THỜI ĐIỂM BẤM — hàm thuần, tách khỏi component để đo được bằng số.
 *
 * 🔴 Vì sao tách: đây là chỗ quyết định ai trúng ai trượt. Nằm trong component
 * thì cách duy nhất để kiểm là mở trình duyệt bấm thử, mà bấm thử thì không bao
 * giờ chạy nổi 200 lượt để so phân bố.
 *
 * Luật gốc (đã trả giá một lần): **lấy mốc của CHÍNH sự kiện chạm**, không lấy
 * lúc React chạy tới đây. Máy yếu và máy 120Hz cho ra kết quả khác nhau nếu đọc
 * đồng hồ trong handler — và người chơi trên máy yếu bị thiệt mà không ai biết.
 */

/**
 * Bao xa thì coi mốc sự kiện là không đáng tin.
 *
 * `event.timeStamp` trên vài trình duyệt cũ là mốc UNIX chứ không phải mốc
 * tương đối `performance.now()`. Chênh nhiều năm ⇒ vượt ngưỡng này ⇒ rơi về
 * đồng hồ hiện tại thay vì tính ra một con số vô nghĩa.
 */
export const NGUONG_TIN_MOC_MS = 5000;

/**
 * Đổi `event.timeStamp` (mốc tương đối trong trang) sang mốc tuyệt đối.
 *
 * `hienTaiTuongDoi` là `performance.now()` đọc ngay trong handler — chỉ dùng để
 * KIỂM TRA mốc sự kiện có hợp lý không, KHÔNG dùng làm kết quả khi mốc hợp lệ.
 */
export function mocBamTuyetDoi(
  mocSuKien: number,
  timeOrigin: number,
  hienTaiTuongDoi: number,
): number {
  const tinDuoc =
    Number.isFinite(mocSuKien) && Math.abs(mocSuKien - hienTaiTuongDoi) < NGUONG_TIN_MOC_MS;
  return timeOrigin + (tinDuoc ? mocSuKien : hienTaiTuongDoi);
}

/**
 * Số mili-giây đã trôi kể từ lúc bảng số bắt đầu chạy.
 *
 * `lechDongHo` là độ lệch giữa đồng hồ máy này và đồng hồ máy chủ (đo bằng
 * `/api/gio`): `batDauLuc` do máy chủ phát ra, nên phải quy về cùng một hệ.
 */
export function soMiliGiayDaTroi(
  mocTuyetDoi: number,
  lechDongHo: number,
  batDauLuc: number,
): number {
  return mocTuyetDoi + lechDongHo - batDauLuc;
}

/** Gộp cả hai bước — đúng thứ component gọi. */
export function doThoiDiemBam(opt: {
  mocSuKien: number;
  timeOrigin: number;
  hienTaiTuongDoi: number;
  lechDongHo: number;
  batDauLuc: number;
}): number {
  return soMiliGiayDaTroi(
    mocBamTuyetDoi(opt.mocSuKien, opt.timeOrigin, opt.hienTaiTuongDoi),
    opt.lechDongHo,
    opt.batDauLuc,
  );
}
