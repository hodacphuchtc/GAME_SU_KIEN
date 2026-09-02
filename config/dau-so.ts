/**
 * BẢNG CHUYỂN ĐẦU SỐ 11 CHỮ SỐ → 10 CHỮ SỐ (đợt chuyển toàn quốc 2018).
 *
 * 🔴 VÌ SAO CẦN. Một thuê bao có hai cách viết: số cũ 11 chữ số (`01629123456`) và
 * số mới 10 chữ số (`0329123456`). Đây là CÙNG MỘT NGƯỜI — nhà mạng chỉ đổi đầu số,
 * bốn số cuối và phần giữa giữ nguyên. Nhưng `chuanHoaSdt` nhận cả hai dạng là hợp
 * lệ (`/^0\d{9,10}$/`), nên khách khai dạng nào thì máy đẻ ra hồ sơ theo dạng đó ⇒
 * MỘT người thành HAI khách. Ràng buộc `UNIQUE(so_dien_thoai)` không đỡ được, vì
 * hai chuỗi đó thật sự khác nhau.
 *
 * Đây là nguồn "khách ảo" THẬT DUY NHẤT còn lại sau khi ba game đã dùng chung một
 * hồ sơ — đo trên dữ liệu quầy ngày 02/09/2026: 14 khách, 14 số phân biệt, 0 trùng
 * do game.
 *
 * 🔴 ĐÂY LÀ DỮ KIỆN NGOÀI ĐỜI, KHÔNG PHẢI QUY ƯỚC TA TỰ ĐẶT. Bảng do năm nhà mạng
 * công bố khi Bộ TT&TT chuyển mã mạng di động năm 2018. Sai một dòng ở đây là gộp
 * nhầm hai người xa lạ thành một — và việc gộp KHÔNG HOÀN TÁC ĐƯỢC. Phải có người
 * đối chiếu với công bố của nhà mạng trước khi chạy (hạng mục `N.1` của sổ).
 *
 * 🔴 Đầu số 11 chữ số KHÔNG nằm trong bảng này thì GIỮ NGUYÊN. Nó có thể là số cố
 * định, số dịch vụ, hoặc một dãy người dùng gõ thừa một chữ số. Đoán bừa còn tệ hơn
 * không đoán: gộp nhầm là mất dữ liệu, để nguyên chỉ là thừa một hồ sơ mà người ta
 * nhìn thấy và tự xử lý được.
 */

/** Đầu số cũ (4 chữ số, kể cả số 0) → đầu số mới (3 chữ số, kể cả số 0). */
export const DOI_DAU_SO: Readonly<Record<string, string>> = {
  // Viettel
  "0162": "032",
  "0163": "033",
  "0164": "034",
  "0165": "035",
  "0166": "036",
  "0167": "037",
  "0168": "038",
  "0169": "039",
  // VinaPhone
  "0123": "083",
  "0124": "084",
  "0125": "085",
  "0127": "081",
  "0129": "082",
  // MobiFone
  "0120": "070",
  "0121": "079",
  "0122": "077",
  "0126": "076",
  "0128": "078",
  // Vietnamobile
  "0186": "056",
  "0188": "058",
  // Gmobile
  "0199": "059",
};

/**
 * Quy một dãy 11 chữ số về dạng 10 chữ số, nếu đầu số nằm trong bảng chuyển.
 *
 * Trả về chính chuỗi vào khi: không phải 11 chữ số · đầu số không có trong bảng.
 * Hàm THUẦN, không đụng cơ sở dữ liệu — để bài kiểm chạy được cả 23 dòng bằng bảng
 * tra mà không cần dựng CSDL.
 */
export function doiDauSoCu(sdt: string): string {
  if (sdt.length !== 11) return sdt;
  const moi = DOI_DAU_SO[sdt.slice(0, 4)];
  return moi === undefined ? sdt : moi + sdt.slice(4);
}
