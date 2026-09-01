/**
 * Lược đồ cơ sở dữ liệu — nguồn DUY NHẤT. Chạy được nhiều lần (idempotent) nên
 * cứ gọi mỗi lần khởi động, không cần công cụ migration riêng.
 *
 * Vì sao SQLite: ứng dụng phải TỰ CHỨA — `git clone` + `npm start` là chạy, không
 * mở tài khoản dịch vụ nào. Dùng `node:sqlite` có sẵn trong Node 24 nên cũng
 * không thêm một thư viện nào.
 */
export const LUOC_DO = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- Mỗi trung tâm một chương trình; nhiều chương trình chạy song song được.
CREATE TABLE IF NOT EXISTS chuong_trinh (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  ma                 TEXT    NOT NULL UNIQUE,
  ten_trung_tam      TEXT    NOT NULL,
  so_trung           INTEGER NOT NULL,
  muc_do             TEXT    NOT NULL,
  tham_so            TEXT,
  ten_giai_thuong    TEXT    NOT NULL,
  tran_giai_moi_ngay INTEGER NOT NULL DEFAULT 0,   -- 0 = không giới hạn
  trang_thai         TEXT    NOT NULL DEFAULT 'dang_chay',
  -- Giữ chỗ: mỗi chương trình MỘT màn hình và MỘT người chơi tại một thời điểm.
  token_man_hinh     TEXT,
  han_man_hinh       INTEGER,
  token_nguoi_choi   TEXT,
  han_nguoi_choi     INTEGER,
  tao_luc            INTEGER NOT NULL,
  sua_luc            INTEGER NOT NULL
);

-- Hồ sơ phụ huynh. Khớp theo SĐT đã chuẩn hoá — một số một hồ sơ, không đẻ bản sao.
CREATE TABLE IF NOT EXISTS nguoi_choi (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  so_dien_thoai    TEXT    NOT NULL UNIQUE,
  ho_ten           TEXT    NOT NULL,
  dong_y_tu_van    INTEGER NOT NULL DEFAULT 0,
  quan_tam_hoc_thu INTEGER NOT NULL DEFAULT 0,
  tao_luc          INTEGER NOT NULL,
  sua_luc          INTEGER NOT NULL
);

-- LỊCH SỬ QUAY SỐ — cơ sở tra soát khi có tranh chấp giải thưởng.
CREATE TABLE IF NOT EXISTS luot_choi (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  chuong_trinh_id INTEGER NOT NULL REFERENCES chuong_trinh(id) ON DELETE CASCADE,
  nguoi_choi_id   INTEGER REFERENCES nguoi_choi(id),
  ngay            TEXT    NOT NULL,               -- 'YYYY-MM-DD' giờ Việt Nam
  bat_dau_luc     INTEGER NOT NULL,
  ket_thuc_luc    INTEGER,
  so_da_dung      INTEGER,
  trung           INTEGER NOT NULL DEFAULT 0,
  khoang_lech     INTEGER,
  het_gio         INTEGER NOT NULL DEFAULT 0,
  thiet_bi_bam    TEXT,
  ma_xac_thuc     TEXT,
  da_trao_thuong  INTEGER NOT NULL DEFAULT 0,
  trao_luc        INTEGER,
  -- Thước đo DUY NHẤT đáng nhìn: khách để lại số đã thành học viên chưa.
  da_ghi_danh     INTEGER NOT NULL DEFAULT 0,
  ghi_danh_luc    INTEGER
);

CREATE INDEX IF NOT EXISTS luot_theo_chuong_trinh ON luot_choi (chuong_trinh_id, id DESC);
CREATE INDEX IF NOT EXISTS luot_theo_nguoi_choi   ON luot_choi (nguoi_choi_id);
CREATE INDEX IF NOT EXISTS luot_theo_ngay         ON luot_choi (chuong_trinh_id, ngay);
`;
