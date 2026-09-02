/**
 * Ngày theo giờ VIỆT NAM, dạng YYYY-MM-DD.
 *
 * 🔴 Không dùng `toISOString().slice(0,10)`: nó cho ngày theo giờ UTC, nên từ
 * 0h đến 7h sáng giờ Việt Nam nó vẫn trả về NGÀY HÔM QUA. Luật "1 lượt/ngày" và
 * trần giải mỗi ngày sẽ mở sai giờ, và không ai hiểu vì sao.
 */
export function ngayVN(luc: number = Date.now()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(luc));
}
