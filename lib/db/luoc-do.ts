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

-- ── TỔ CHỨC (dùng CHUNG cho mọi game, không thuộc riêng Trúng Số) ──────────

-- Cơ sở / trung tâm. Có MÃ để gọi tên ngắn và để gom nhóm báo cáo.
-- ten KHÔNG đặt UNIQUE: ràng buộc UNIQUE của SQLite phân biệt hoa thường và
-- khoảng trắng, nên nó chặn được "Cơ sở A" trùng khít mà bỏ lọt "Cơ sở A " —
-- một ràng buộc chỉ đúng một nửa còn tệ hơn không có, vì nó biến lỗi nghiệp vụ
-- thành exception SQLite thô ném vào mặt người dùng. Chặn ở tầng ứng dụng.
CREATE TABLE IF NOT EXISTS co_so (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  ma         TEXT    NOT NULL UNIQUE,
  ten        TEXT    NOT NULL,
  dia_chi    TEXT,
  dien_thoai TEXT,
  trang_thai TEXT    NOT NULL DEFAULT 'bat',
  tao_luc    INTEGER NOT NULL,
  sua_luc    INTEGER NOT NULL
);

-- MỘT bảng vừa là danh sách sale (để gán khách) vừa là tài khoản đăng nhập.
-- mat_khau_bam NULL = có tên trong danh sách nhưng chưa được cấp quyền vào hệ
-- thống. Hai bảng riêng sẽ đẻ ra hai danh sách sale lệch nhau — đúng thứ rule 3
-- của module-boundaries cấm.
CREATE TABLE IF NOT EXISTS nhan_vien (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  co_so_id      INTEGER REFERENCES co_so(id) ON DELETE CASCADE,  -- NULL = toàn hệ thống
  ho_ten        TEXT    NOT NULL,
  so_dien_thoai TEXT,
  email         TEXT,
  ten_dang_nhap TEXT    UNIQUE,
  mat_khau_bam  TEXT,
  vai_tro       TEXT    NOT NULL DEFAULT 'sale',
  trang_thai    TEXT    NOT NULL DEFAULT 'dang_lam',
  tao_luc       INTEGER NOT NULL,
  sua_luc       INTEGER NOT NULL
);

-- KHO QUÀ. so_luong NULL = KHÔNG GIỚI HẠN (loại đáy kho). Bốc theo thu_tu
-- tăng dần: hết loại 1 mới sang loại 2. Số đã trao ĐẾM TỪ van_choi, không lưu
-- bộ đếm — một bộ đếm lưu sẵn là con số chỉ chờ ngày lệch khỏi sự thật.
CREATE TABLE IF NOT EXISTS qua_tang (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  chuong_trinh_id INTEGER NOT NULL REFERENCES chuong_trinh(id) ON DELETE CASCADE,
  ten             TEXT    NOT NULL,
  thu_tu          INTEGER NOT NULL DEFAULT 0,
  so_luong        INTEGER,
  tran_moi_ngay   INTEGER NOT NULL DEFAULT 0,
  gia_tri         INTEGER,
  tao_luc         INTEGER NOT NULL,
  sua_luc         INTEGER NOT NULL
);

-- MỘT VÁN = tối đa N lần bấm, MỘT phần quà. Đây là ĐƠN VỊ NHẬN GIẢI.
-- Tách khỏi luot_choi vì bấm 3 lần trúng 2 lần vẫn chỉ một phần quà:
-- luot_choi là nhật ký từng lần bấm, van_choi là đơn vị nghiệp vụ.
CREATE TABLE IF NOT EXISTS van_choi (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  chuong_trinh_id  INTEGER NOT NULL REFERENCES chuong_trinh(id) ON DELETE CASCADE,
  nguoi_choi_id    INTEGER REFERENCES nguoi_choi(id),
  co_so_id         INTEGER REFERENCES co_so(id),
  ngay             TEXT    NOT NULL,
  so_lan_cho_phep  INTEGER NOT NULL DEFAULT 1,
  so_lan_da_dung   INTEGER NOT NULL DEFAULT 0,
  luot_tot_nhat_id INTEGER REFERENCES luot_choi(id),
  trung            INTEGER NOT NULL DEFAULT 0,
  qua_tang_id      INTEGER REFERENCES qua_tang(id),
  ma_xac_thuc      TEXT,
  da_trao_thuong   INTEGER NOT NULL DEFAULT 0,
  trao_luc         INTEGER,
  bat_dau_luc      INTEGER NOT NULL,
  ket_thuc_luc     INTEGER,
  tao_luc          INTEGER NOT NULL,
  sua_luc          INTEGER NOT NULL
);

-- Một phụ huynh × một CƠ SỞ = MỘT khách tiềm năng.
-- Không nhét vào nguoi_choi vì so_dien_thoai UNIQUE TOÀN HỆ THỐNG, còn
-- quyền chăm sóc khách thuộc TỪNG cơ sở — nhét chung là hai cơ sở tranh một ô.
CREATE TABLE IF NOT EXISTS khach_tiem_nang (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  co_so_id            INTEGER NOT NULL REFERENCES co_so(id)          ON DELETE CASCADE,
  nguoi_choi_id       INTEGER NOT NULL REFERENCES nguoi_choi(id)     ON DELETE CASCADE,
  nhan_vien_id        INTEGER REFERENCES nhan_vien(id)               ON DELETE SET NULL,
  chuong_trinh_id_dau INTEGER REFERENCES chuong_trinh(id)            ON DELETE SET NULL,
  trang_thai          TEXT    NOT NULL DEFAULT 'moi',
  ghi_chu             TEXT,
  giao_luc            INTEGER,
  tao_luc             INTEGER NOT NULL,
  sua_luc             INTEGER NOT NULL,
  UNIQUE (co_so_id, nguoi_choi_id)
);

CREATE TABLE IF NOT EXISTS nhat_ky_truy_cap (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  nhan_vien_id INTEGER REFERENCES nhan_vien(id),
  hanh_dong    TEXT    NOT NULL,
  doi_tuong    TEXT,
  so_dong      INTEGER,
  dia_chi_ip   TEXT,
  luc          INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS sale_theo_co_so      ON nhan_vien       (co_so_id, trang_thai);
CREATE INDEX IF NOT EXISTS qua_theo_chuong_trinh ON qua_tang       (chuong_trinh_id, thu_tu);
CREATE INDEX IF NOT EXISTS van_theo_chuong_trinh ON van_choi       (chuong_trinh_id, ngay);
CREATE INDEX IF NOT EXISTS van_theo_nguoi_choi   ON van_choi       (nguoi_choi_id, ngay);
CREATE INDEX IF NOT EXISTS van_theo_qua          ON van_choi       (qua_tang_id);
CREATE INDEX IF NOT EXISTS lead_theo_co_so       ON khach_tiem_nang (co_so_id, trang_thai);
CREATE INDEX IF NOT EXISTS lead_theo_nhan_vien   ON khach_tiem_nang (nhan_vien_id);
CREATE INDEX IF NOT EXISTS nhat_ky_theo_luc      ON nhat_ky_truy_cap (luc DESC);

CREATE INDEX IF NOT EXISTS luot_theo_chuong_trinh ON luot_choi (chuong_trinh_id, id DESC);
CREATE INDEX IF NOT EXISTS luot_theo_nguoi_choi   ON luot_choi (nguoi_choi_id);
CREATE INDEX IF NOT EXISTS luot_theo_ngay         ON luot_choi (chuong_trinh_id, ngay);
`;
