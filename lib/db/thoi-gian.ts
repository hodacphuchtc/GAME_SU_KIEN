/**
 * Ngày theo giờ Việt Nam, dạng 'YYYY-MM-DD'.
 *
 * Dùng để đếm "mỗi số điện thoại một lượt mỗi NGÀY" và trần giải mỗi ngày. Phải
 * chốt múi giờ Việt Nam chứ không lấy giờ máy chủ: máy chủ đặt ở múi khác thì
 * "ngày mới" nhảy vào lúc 7 giờ tối, và phụ huynh chơi lại được ngay trong buổi.
 */
const MUI_GIO = "Asia/Ho_Chi_Minh";

export function ngayVietNam(luc: number | Date = Date.now()): string {
  const d = typeof luc === "number" ? new Date(luc) : luc;
  // en-CA cho ra đúng dạng YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: MUI_GIO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}
