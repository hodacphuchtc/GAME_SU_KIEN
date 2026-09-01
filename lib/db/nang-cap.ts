import type { DatabaseSync } from "node:sqlite";

/**
 * NÂNG CẤP CẤU TRÚC cho một cơ sở dữ liệu ĐÃ TỒN TẠI.
 *
 * `luoc-do.ts` chỉ có `CREATE TABLE IF NOT EXISTS`, nên nó mô tả HÌNH DẠNG LÝ
 * TƯỞNG cho một CSDL trắng — và không bao giờ đụng được tới CSDL đang chạy.
 * File này là chiều ngược lại: kéo một CSDL cũ về đúng hình dạng đó.
 *
 * Ranh giới giữa hai file, đừng làm lẫn:
 *   luoc-do.ts  = hình dạng lý tưởng (chạy cho CSDL trắng)
 *   nang-cap.ts = cách vá CSDL cũ cho khớp hình dạng đó
 *
 * 🔴 Hàm này chạy MỖI LẦN khởi động máy chủ, nên mọi thứ trong đây phải chạy lại
 * được nhiều lần mà không đổi kết quả.
 *
 * KHÔNG import `lib/db/truy-van.ts` ở đây: nó gọi `csdl()`, mà lúc `nangCap`
 * chạy thì kết nối chưa được gán vào `globalThis`. Nhận `db` qua tham số.
 * Cũng KHÔNG `import "server-only"` — khớp với `ket-noi.ts`, nếu không test gãy.
 */

/**
 * `pragma table_info(?)` KHÔNG nhận tham số ràng buộc nên buộc phải nối chuỗi.
 * An toàn vì `bang` và `cot` chỉ đến từ hằng số viết thẳng trong file này, không
 * bao giờ từ người dùng. Đừng mở hai hàm này ra ngoài module theo kiểu nhận đầu
 * vào động.
 */
export function coCot(db: DatabaseSync, bang: string, cot: string): boolean {
  try {
    const cacCot = db.prepare(`pragma table_info(${bang})`).all() as { name: string }[];
    return cacCot.some((c) => c.name === cot);
  } catch {
    // Bảng chưa tồn tại — coi như chưa có cột, để nơi gọi tự bỏ qua.
    return false;
  }
}

/**
 * Thêm cột nếu chưa có. Im lặng bỏ qua nếu đã có — đó chính là điều ta muốn khi
 * hàm chạy lại ở lần khởi động sau.
 *
 * 🔴 Lưu ý SQLite: khi `foreign_keys = ON`, `ALTER TABLE ADD COLUMN` có mệnh đề
 * `REFERENCES` **bắt buộc mặc định NULL**. Nghĩa là mọi cột khoá ngoại thêm bằng
 * đường này không thể `NOT NULL` ở tầng CSDL — phải ràng buộc ở tầng ứng dụng.
 * Đừng dựng lại bảng chỉ để có `NOT NULL`; cái giá không đáng.
 */
export function themCot(db: DatabaseSync, bang: string, cot: string, dinhNghia: string): void {
  if (coCot(db, bang, cot)) return;
  db.exec(`alter table ${bang} add column ${cot} ${dinhNghia}`);
}

/** Danh sách cột phải có, theo thứ tự đã thêm. Thêm mới thì nối vào CUỐI. */
const COT_BO_SUNG: ReadonlyArray<[bang: string, cot: string, dinhNghia: string]> = [
  // GĐ 7.2 — thước đo: khách để lại số đã thành học viên chưa.
  ["luot_choi", "da_ghi_danh", "integer not null default 0"],
  ["luot_choi", "ghi_danh_luc", "integer"],
];

export function nangCap(db: DatabaseSync): void {
  for (const [bang, cot, dinhNghia] of COT_BO_SUNG) themCot(db, bang, cot, dinhNghia);
}
