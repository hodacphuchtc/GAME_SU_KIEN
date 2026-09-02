import { MAU_O_MAC_DINH } from "@/config/thuong-hieu";

/**
 * Lược đồ cơ sở dữ liệu — nguồn DUY NHẤT. Chạy được nhiều lần (idempotent) nên
 * cứ gọi mỗi lần khởi động, không cần công cụ migration riêng.
 *
 * Vì sao SQLite: ứng dụng phải TỰ CHỨA — `git clone` + `npm start` là chạy,
 * không mở tài khoản dịch vụ nào. Dùng `node:sqlite` có sẵn trong Node 24 nên
 * cũng không thêm một thư viện nào.
 *
 * 🔴 File này là HÌNH DẠNG NGUYÊN THUỶ, không phải hình dạng hiện tại. Mọi cột
 * thêm về sau chỉ sống trong `COT_BO_SUNG` của `nang-cap.ts`. Thêm cột vào cả
 * hai chỗ là dựng hai nguồn sự thật, và chúng sẽ lệch nhau.
 *
 * 🔴 CẤM ký tự backtick trong chú thích SQL dưới đây — nó kết thúc sớm chuỗi
 * mẫu này và lược đồ đứt làm đôi. Đã trả giá ở app Trúng Số.
 */
export const LUOC_DO = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- Một chương trình quay của một cơ sở. Nhiều chương trình chạy song song được.
CREATE TABLE IF NOT EXISTS chuong_trinh (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  ma                 TEXT    NOT NULL UNIQUE,
  ten_co_so          TEXT    NOT NULL,
  -- Phần vòng dành cho ô đáy. Đây là VAN NGÂN SÁCH: nó quyết định kho quà thật
  -- cầm cự được bao nhiêu lượt. Xem config/vong-quay.ts.
  ti_le_o_day        REAL    NOT NULL DEFAULT 0.5,
  tran_giai_moi_ngay INTEGER NOT NULL DEFAULT 0,   -- 0 = không giới hạn
  -- Tăng mỗi lần danh sách ô đổi. Mỗi lượt quay ghim phiên bản của nó, nhờ vậy
  -- dựng lại ván cũ ra đúng mặt vòng của lúc đó chứ không phải mặt vòng hôm nay.
  phien_ban_o        INTEGER NOT NULL DEFAULT 1,
  trang_thai         TEXT    NOT NULL DEFAULT 'dang_chay',
  -- Giữ chỗ: mỗi chương trình MỘT màn hình và MỘT người chơi tại một thời điểm.
  token_man_hinh     TEXT,
  han_man_hinh       INTEGER,
  token_nguoi_choi   TEXT,
  han_nguoi_choi     INTEGER,
  tao_luc            INTEGER NOT NULL,
  sua_luc            INTEGER NOT NULL
);

-- MỘT Ô = MỘT LOẠI QUÀ. Bảng này vừa là kho, vừa là mặt vòng quay — tách làm
-- hai danh sách là dựng bản sao thứ hai, và chúng chỉ lệch nhau vào đúng ngày
-- ai đó sửa một bên.
CREATE TABLE IF NOT EXISTS o_qua (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  chuong_trinh_id INTEGER NOT NULL REFERENCES chuong_trinh(id) ON DELETE CASCADE,
  ten             TEXT    NOT NULL,
  thu_tu          INTEGER NOT NULL DEFAULT 0,
  -- NULL = Ô ĐÁY, không giới hạn. Vòng luôn phải có ít nhất một ô đáy, nếu
  -- không thì hết quà là hết trò. Form tạo chặn ca thiếu ô đáy.
  so_luong        INTEGER,
  tran_moi_ngay   INTEGER NOT NULL DEFAULT 0,
  gia_tri         INTEGER,
  mau             TEXT    NOT NULL DEFAULT '${MAU_O_MAC_DINH}',
  phien_ban       INTEGER NOT NULL DEFAULT 1,
  tao_luc         INTEGER NOT NULL,
  sua_luc         INTEGER NOT NULL
);

-- Hồ sơ phụ huynh, khớp theo SĐT đã chuẩn hoá — một số một hồ sơ.
CREATE TABLE IF NOT EXISTS nguoi_choi (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  so_dien_thoai TEXT    NOT NULL UNIQUE,
  ho_ten        TEXT    NOT NULL,
  dong_y_tu_van INTEGER NOT NULL DEFAULT 0,
  tao_luc       INTEGER NOT NULL,
  sua_luc       INTEGER NOT NULL
);

-- MỘT LƯỢT QUAY = MỘT KẾT QUẢ = MỘT PHẦN QUÀ. Cố ý KHÔNG tách ván và lượt như
-- Trúng Số: ở đó một ván có nhiều lần bấm nên phải tách, ở đây thì không.
-- Đây vừa là đơn vị nhận giải, vừa là sổ đối soát khi phụ huynh khiếu nại.
CREATE TABLE IF NOT EXISTS luot_quay (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  chuong_trinh_id INTEGER NOT NULL REFERENCES chuong_trinh(id) ON DELETE CASCADE,
  nguoi_choi_id   INTEGER REFERENCES nguoi_choi(id),
  o_qua_id        INTEGER REFERENCES o_qua(id),
  ngay            TEXT    NOT NULL,              -- YYYY-MM-DD giờ Việt Nam
  -- Ba cột dưới đây là thứ khiến mọi ván DỰNG LẠI được. Trò do MÁY quyết kết
  -- quả thì sớm muộn cũng bị hỏi "có chỉnh không", và câu trả lời phải là bấm
  -- một nút chứ không phải một lời hứa.
  hat_giong       TEXT    NOT NULL,
  goc_dung        REAL    NOT NULL,
  phien_ban_o     INTEGER NOT NULL,
  ma_xac_thuc     TEXT,
  thiet_bi        TEXT,
  da_trao_thuong  INTEGER NOT NULL DEFAULT 0,
  trao_luc        INTEGER,
  bat_dau_luc     INTEGER NOT NULL,
  ket_thuc_luc    INTEGER
);

CREATE TABLE IF NOT EXISTS nhat_ky (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  hanh_dong  TEXT    NOT NULL,
  doi_tuong  TEXT,
  so_dong    INTEGER,
  dia_chi_ip TEXT,
  luc        INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS o_theo_chuong_trinh   ON o_qua    (chuong_trinh_id, thu_tu);
CREATE INDEX IF NOT EXISTS luot_theo_chuong_trinh ON luot_quay (chuong_trinh_id, id DESC);
CREATE INDEX IF NOT EXISTS luot_theo_ngay         ON luot_quay (chuong_trinh_id, ngay);
CREATE INDEX IF NOT EXISTS luot_theo_nguoi_choi   ON luot_quay (nguoi_choi_id, ngay);
CREATE INDEX IF NOT EXISTS luot_theo_o            ON luot_quay (o_qua_id);
CREATE INDEX IF NOT EXISTS nhat_ky_theo_luc       ON nhat_ky   (luc DESC);
`;
