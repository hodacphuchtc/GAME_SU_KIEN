import { DatabaseSync } from "node:sqlite";
import { existsSync, renameSync, statSync } from "node:fs";

/**
 * Đổi tên tệp cơ sở dữ liệu khi module đổi tên DEM_SO → GAME_SU_KIEN.
 *
 * 🔴 VÌ SAO ĐÂY LÀ VIỆC NGUY HIỂM NHẤT CỦA CẢ ĐỢT ĐỔI TÊN:
 * SQLite chạy chế độ WAL thì một cơ sở dữ liệu là BA tệp — `.db`, `.db-wal` và
 * `.db-shm`. Dữ liệu mới nhất nằm ở `-wal` cho tới lúc SQLite gộp lại. Trên máy
 * thật hiện `.db` là 40 KB còn `.db-wal` là 399 KB. Đổi tên mỗi tệp `.db` là bỏ
 * lại gần hết dữ liệu mới — và app vẫn khởi động, vẫn mở được trang, chỉ là
 * trống trơn. Không có một dòng báo lỗi nào.
 *
 * Phải chạy TRƯỚC khi mở kết nối: đổi tên tệp đang có tiến trình giữ là cách
 * chắc chắn để hỏng.
 */
/**
 * Nguồn có đúng là cơ sở dữ liệu của ứng dụng này không?
 *
 * 🔴 Bài học trả giá 01/09/2026: một tệp `dem-so.db` RỖNG 0 byte lạc vào thư mục
 * (lệnh chẩn đoán mở nhầm đường dẫn đã tạo ra nó) và bị đổi tên đè lên chỗ của
 * cơ sở dữ liệu thật. App vẫn khởi động, trang vẫn mở, chỉ là trắng trơn — đúng
 * kiểu hỏng tệ nhất vì không có một dòng báo lỗi nào.
 *
 * Nên: chỉ đổi tên khi nguồn thật sự CÓ bảng của mình. Nghi ngờ thì không đụng.
 */
function laCsdlThat(duongDan: string): boolean {
  try {
    if (statSync(duongDan).size === 0) return false;
    const db = new DatabaseSync(duongDan, { readOnly: true });
    try {
      const co = db
        .prepare("select count(*) as n from sqlite_master where type = 'table' and name = ?")
        .get("chuong_trinh") as { n: number } | undefined;
      return (co?.n ?? 0) > 0;
    } finally {
      db.close();
    }
  } catch {
    return false;
  }
}

export function doiTenTep(cu: string, moi: string): void {
  if (cu === ":memory:" || moi === ":memory:" || cu === moi) return;
  // Đã đổi ở lần chạy trước — đừng đụng vào, và tuyệt đối đừng để tệp cũ đè lên
  // tệp mới đang được dùng.
  if (existsSync(moi)) return;
  if (!existsSync(cu)) return;
  // Nguồn không phải CSDL thật (rỗng, hỏng, hay tệp lạ trùng tên) → KHÔNG đụng
  // vào gì cả. Thà để nguyên hai tệp cho người nhìn còn hơn đổi tên một tệp
  // rỗng vào đúng chỗ dữ liệu thật.
  if (!laCsdlThat(cu)) return;

  // Bản chụp nhất quán trước khi đụng vào bất cứ thứ gì. `VACUUM INTO` gộp sẵn
  // WAL nên bản này đầy đủ kể cả khi ba tệp kia có chuyện.
  const sao = `${cu}.truoc-doi-ten`;
  if (!existsSync(sao)) {
    const db = new DatabaseSync(cu);
    try {
      db.exec(`VACUUM INTO '${sao.replace(/'/g, "''")}'`);
    } finally {
      db.close();
    }
  }

  // Ba tệp phải đi CÙNG NHAU. Tệp phụ có thể không tồn tại (SQLite dọn khi đóng
  // sạch) — thiếu thì bỏ qua, nhưng có mà bỏ lại là mất dữ liệu.
  for (const hau of ["", "-wal", "-shm"]) {
    if (existsSync(cu + hau)) renameSync(cu + hau, moi + hau);
  }
}
