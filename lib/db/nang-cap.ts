import type { DatabaseSync } from "node:sqlite";

import { TEN_CO_SO_MAC_DINH, TIEN_TO_CO_SO } from "@/config/to-chuc";
import { MAU_O_MAC_DINH } from "@/config/thuong-hieu";
import { doiDauSoCu } from "@/config/dau-so";

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

/**
 * BẢNG chưa từng tồn tại ở CSDL đang chạy — thêm nguyên vẹn, KHÔNG qua ALTER.
 *
 * 🔴 Vì sao ở đây chứ không ở `luoc-do.ts`: `luoc-do.ts` là HÌNH DẠNG NGUYÊN
 * THUỶ và chỉ chạy trọn vẹn cho một CSDL trắng. CSDL đang phục vụ quầy thì đã
 * có sẵn 10 bảng; hai bảng của Vòng Quay phải đi qua đúng cửa nâng cấp này để
 * bản đang chạy nhận được chúng mà không phải xoá đi tạo lại (ADR-011).
 *
 * 🔴 Chạy TRƯỚC vòng thêm cột: `COT_BO_SUNG` có thể đụng tới bảng khai ở đây,
 * và `themCot` trên một bảng CHƯA TỒN TẠI thì im lặng bỏ qua — sai mà không báo.
 *
 * 🔴 CHỈ `CREATE TABLE IF NOT EXISTS`. Một câu sai cú pháp trong mảng này làm
 * `csdl()` ném, và **cả ba game chết cùng lúc** — đây đúng là rủi ro R1 mà
 * ADR-011 ghi là cái giá phải trả cho việc gộp.
 */
const BANG_BO_SUNG: readonly string[] = [
  // MỘT Ô = MỘT LOẠI QUÀ. Vừa là kho, vừa là mặt vòng quay — tách làm hai danh
  // sách là dựng bản sao thứ hai, và chúng chỉ lệch nhau vào đúng ngày ai đó
  // sửa một bên.
  //
  // Cố ý KHÔNG dùng chung bảng `qua_tang` của Trúng Số: `qua_tang.thu_tu` nghĩa
  // là *thứ tự bốc*, còn `o_qua.thu_tu` là *vị trí trên mặt vòng* — một cột hai
  // nghĩa. Và `qua_tang` đếm "đã trao" từ `van_choi`, dùng chung là buộc phải
  // sửa đúng câu SQL mà Trúng Số chạy ở MỖI lượt chơi.
  `CREATE TABLE IF NOT EXISTS o_qua (
     id              INTEGER PRIMARY KEY AUTOINCREMENT,
     chuong_trinh_id INTEGER NOT NULL REFERENCES chuong_trinh(id) ON DELETE CASCADE,
     ten             TEXT    NOT NULL,
     thu_tu          INTEGER NOT NULL DEFAULT 0,
     so_luong        INTEGER,
     tran_moi_ngay   INTEGER NOT NULL DEFAULT 0,
     gia_tri         INTEGER,
     mau             TEXT    NOT NULL DEFAULT '${MAU_O_MAC_DINH}',
     phien_ban       INTEGER NOT NULL DEFAULT 1,
     tao_luc         INTEGER NOT NULL,
     sua_luc         INTEGER NOT NULL
   )`,
  // MỘT LƯỢT QUAY = MỘT KẾT QUẢ = MỘT PHẦN QUÀ. Cố ý KHÔNG tách ván và lượt như
  // Trúng Số: ở đó một ván có nhiều lần bấm nên phải tách, ở đây một lượt là một
  // lần chạm. Vừa là đơn vị nhận giải, vừa là sổ đối soát khi phụ huynh khiếu nại.
  //
  // 🔴 Ba cột ẢNH CHỤP (`cung_json`, `o_ten`, `o_mau`) khai thẳng từ đầu vì bảng
  // này chưa từng tồn tại. Thiếu chúng thì bảng lịch sử phải join sang `o_qua`
  // HIỆN TẠI, và ngày ai đó đổi tên "Balo" thành "Balo mini" là mọi người trúng
  // từ tháng trước bỗng được ghi là đã nhận "Balo mini" — kể cả trong file Excel
  // đối soát với phụ huynh. Sổ đối soát phải lưu ẢNH CHỤP, không phải khoá ngoại
  // trỏ tới thứ còn sửa được.
  `CREATE TABLE IF NOT EXISTS luot_quay (
     id              INTEGER PRIMARY KEY AUTOINCREMENT,
     chuong_trinh_id INTEGER NOT NULL REFERENCES chuong_trinh(id) ON DELETE CASCADE,
     nguoi_choi_id   INTEGER REFERENCES nguoi_choi(id),
     o_qua_id        INTEGER REFERENCES o_qua(id),
     ngay            TEXT    NOT NULL,
     hat_giong       TEXT    NOT NULL,
     goc_dung        REAL    NOT NULL,
     phien_ban_o     INTEGER NOT NULL,
     cung_json       TEXT,
     o_ten           TEXT,
     o_mau           TEXT,
     ma_xac_thuc     TEXT,
     thiet_bi        TEXT,
     da_trao_thuong  INTEGER NOT NULL DEFAULT 0,
     trao_luc        INTEGER,
     bat_dau_luc     INTEGER NOT NULL,
     ket_thuc_luc    INTEGER
   )`,
  // SỔ THAY ĐỔI HỒ SƠ KHÁCH (ADR-011). Append-only, không bao giờ sửa dòng cũ.
  //
  // 🔴 Vì sao là BẢNG chứ không phải một ô ghi chú. `khach_tiem_nang.ghi_chu` là
  // ô của SALE — họ gõ tay việc chăm khách, bị cắt cứng 500 ký tự, và code đã có
  // sẵn một luật bảo vệ nó khỏi bị ghi đè khi khách quay lại. Máy nối thêm vào đó
  // sẽ vừa ăn mất ghi chú của họ vừa tràn giới hạn, và cái đống nối mãi ấy thì
  // không lọc được, không đếm được, không xuất Excel được.
  //
  // 🔴 Vì sao cần sổ. `nhanDien` ĐÈ THẲNG `ho_ten` mỗi lần khách khai lại; tên cũ
  // biến mất không dấu vết. Anh Phúc chốt "bản mới thắng" — thắng thì thắng, nhưng
  // bản bị thay vẫn phải còn chỗ mà tra khi đối soát.
  `CREATE TABLE IF NOT EXISTS nguoi_choi_thay_doi (
     id              INTEGER PRIMARY KEY AUTOINCREMENT,
     nguoi_choi_id   INTEGER NOT NULL REFERENCES nguoi_choi(id) ON DELETE CASCADE,
     truong          TEXT    NOT NULL,
     gia_tri_cu      TEXT,
     gia_tri_moi     TEXT,
     chuong_trinh_id INTEGER REFERENCES chuong_trinh(id) ON DELETE SET NULL,
     nhan_vien_id    INTEGER REFERENCES nhan_vien(id) ON DELETE SET NULL,
     luc             INTEGER NOT NULL
   )`,
];

/** Danh sách cột phải có, theo thứ tự đã thêm. Thêm mới thì nối vào CUỐI. */
const COT_BO_SUNG: ReadonlyArray<[bang: string, cot: string, dinhNghia: string]> = [
  // GĐ 7.2 — thước đo: khách để lại số đã thành học viên chưa.
  ["luot_choi", "da_ghi_danh", "integer not null default 0"],
  ["luot_choi", "ghi_danh_luc", "integer"],
  // GĐ 10.1 — tổ chức + hai chế độ chơi + ván nhiều lần bấm.
  // 🔴 `co_so_id` KHÔNG THỂ `not null` ở tầng CSDL: khi `foreign_keys = ON`,
  // SQLite chỉ cho `ADD COLUMN` có `REFERENCES` nếu mặc định là NULL. Ràng
  // buộc nằm ở tầng ứng dụng (`taoChuongTrinh` đòi `coSoId`). Đừng dựng lại
  // bảng chỉ để có `not null` — cái giá không đáng.
  ["chuong_trinh", "co_so_id", "integer references co_so(id)"],
  ["chuong_trinh", "che_do", "text not null default 'tai_quay'"],
  ["chuong_trinh", "nguon_co_so", "text not null default 'gan_san'"],
  ["chuong_trinh", "so_lan_choi", "integer not null default 1"],
  ["chuong_trinh", "tro_choi", "text not null default 'trung_so'"],
  ["luot_choi", "van_id", "integer references van_choi(id)"],
  ["luot_choi", "lan_thu", "integer not null default 1"],
  // GĐ 12.1 — thước đo ghi danh chuyển từ LƯỢT sang VÁN. Một ván ba lần bấm
  // vẫn là MỘT khách; để cờ ở lượt thì đếm ra ba.
  ["van_choi", "da_ghi_danh", "integer not null default 0"],
  ["van_choi", "ghi_danh_luc", "integer"],
  // GĐ 13.2 — NGÀY (giờ Việt Nam) của dòng nhật ký, để chặn ghi trùng một
  // ngưỡng trong cùng một ngày. Suy ngày từ `luc` ngay trong câu SQL thì phải
  // đổi múi giờ, mà SQLite không biết múi giờ Việt Nam — rẻ hơn là ghi sẵn.
  ["nhat_ky_truy_cap", "ngay_ghi", "text"],
  // GĐ 17.2 — lead đến từ chế độ ONLINE: phụ huynh tự gõ số, hệ thống KHÔNG
  // gửi mã xác minh (xem N.9). Sale phải biết trước khi tính vào chỉ tiêu.
  ["khach_tiem_nang", "chua_xac_thuc", "integer not null default 0"],
  // GĐ C.0 (v3) — game CHỌN SỐ: thay "số trúng + kho quà" bằng một DẢI SỐ chạy
  // xoay vòng. Chương trình trúng số không bao giờ đọc ba cột này; mặc định chỉ
  // là chỗ trống hợp lệ để `not null` không phải dựng lại bảng.
  //
  // 🔴 Trần của dải là WHEEL_SIZE − 1 = 9999, ràng buộc ở tầng ứng dụng
  // (`kiemThietLapChonSo`): bảng LED chỉ có 4 chữ số và `formatNumber` lấy dư
  // theo WHEEL_SIZE, nên số 10042 sẽ hiện thành 0042 — trùng số 42, KHÔNG có gì
  // báo lỗi. SQLite không có CHECK thêm được qua ALTER TABLE.
  ["chuong_trinh", "dai_tu", "integer not null default 1"],
  ["chuong_trinh", "dai_den", "integer not null default 100"],
  ["chuong_trinh", "loai_tru_da_ra", "integer not null default 0"],
  // ADR-011 — game VÒNG QUAY. Chương trình của hai game kia không bao giờ đọc
  // hai cột này; mặc định chỉ là chỗ trống hợp lệ để khỏi phải dựng lại bảng.
  //
  // `ti_le_o_day` là VAN NGÂN SÁCH: phần vòng dành cho ô đáy (ô không giới hạn
  // số lượng) quyết định kho quà thật cầm cự được bao nhiêu lượt. 0,5 = nửa vòng.
  ["chuong_trinh", "ti_le_o_day", "real not null default 0.5"],
  // Tăng mỗi lần danh sách ô đổi. Mỗi lượt quay ghim phiên bản của nó, nhờ vậy
  // "dựng lại ván" vẽ ra đúng mặt vòng CỦA LÚC ĐÓ, không phải mặt vòng hôm nay.
  ["chuong_trinh", "phien_ban_o", "integer not null default 1"],
];

/**
 * Chỉ mục trên cột VỪA THÊM. 🔴 Không được để trong `luoc-do.ts`: trên một CSDL
 * cũ, cột chưa tồn tại vào lúc chuỗi lược đồ chạy, và câu CREATE INDEX sẽ ném.
 */
const CHI_MUC_SAU_KHI_THEM_COT: readonly string[] = [
  "CREATE INDEX IF NOT EXISTS ct_theo_co_so ON chuong_trinh (co_so_id)",
  "CREATE INDEX IF NOT EXISTS luot_theo_van ON luot_choi (van_id)",
  // ADR-011 — Vòng Quay. Tên chỉ mục mang tiền tố `quay_` để không đụng
  // `luot_theo_van` của Trúng Số: chỉ mục dùng CHUNG một không gian tên.
  "CREATE INDEX IF NOT EXISTS o_theo_chuong_trinh ON o_qua (chuong_trinh_id, thu_tu)",
  "CREATE INDEX IF NOT EXISTS quay_theo_chuong_trinh ON luot_quay (chuong_trinh_id, id DESC)",
  "CREATE INDEX IF NOT EXISTS quay_theo_ngay ON luot_quay (chuong_trinh_id, ngay)",
  "CREATE INDEX IF NOT EXISTS quay_theo_nguoi_choi ON luot_quay (nguoi_choi_id, ngay)",
  "CREATE INDEX IF NOT EXISTS quay_theo_o ON luot_quay (o_qua_id)",
  // Sổ thay đổi luôn đọc theo MỘT khách, mới nhất trước.
  "CREATE INDEX IF NOT EXISTS thay_doi_theo_nguoi ON nguoi_choi_thay_doi (nguoi_choi_id, luc DESC)",
];

/** Phiên bản DỮ LIỆU mới nhất. Tăng khi thêm một bước backfill mới. */
const PHIEN_BAN_DU_LIEU = 3;

/** Gom tên trung tâm về một khoá so sánh được: bỏ khoảng trắng thừa, không phân biệt hoa thường. */
function khoaChuanHoa(ten: string): string {
  return ten.trim().replace(/\s+/g, " ").toLowerCase();
}

/**
 * BACKFILL — chạy ĐÚNG MỘT LẦN, canh bằng `PRAGMA user_version`.
 *
 * 🔴 Vì sao KHÔNG idempotent như lớp cấu trúc: câu "sinh cơ sở từ các tên trung
 * tâm đang có" không an toàn khi chạy lại. Quản lý đổi tên một cơ sở, lần khởi
 * động sau kiểu "dò rồi bù" sẽ thấy tên trong `chuong_trinh.ten_trung_tam` (bản
 * chụp cũ) không khớp cơ sở nào và ĐẺ THÊM một cơ sở trùng. `user_version` chặn
 * đúng chuyện đó.
 */
function backfill(db: DatabaseSync): void {
  const pb = (db.prepare("pragma user_version").get() as { user_version: number }).user_version;
  if (pb >= PHIEN_BAN_DU_LIEU) return;

  db.exec("begin");
  try {
    if (pb < 1) backfillV1(db);
    if (pb < 2) backfillV2(db);
    if (pb < 3) backfillV3(db);
    db.exec(`pragma user_version = ${PHIEN_BAN_DU_LIEU}`);
    db.exec("commit");
  } catch (loi) {
    db.exec("rollback");
    throw loi;
  }
}

/**
 * v3 — QUY CHUẨN SỐ ĐIỆN THOẠI ĐÃ LƯU, và GỘP hồ sơ trùng (ADR-011, 02/09/2026).
 *
 * 🔴 Vì sao cần. Một thuê bao có hai cách viết sau đợt chuyển đầu số 2018:
 * `01629123456` (11 số, kiểu cũ) và `0329123456` (10 số, kiểu mới). Trước bản vá,
 * `chuanHoaSdt` nhận cả hai nên khách khai dạng nào thì máy đẻ hồ sơ theo dạng đó
 * ⇒ MỘT người thành HAI khách. `UNIQUE(so_dien_thoai)` không đỡ được vì hai chuỗi
 * thật sự khác nhau.
 *
 * 🔴 GỘP LÀ KHÔNG HOÀN TÁC ĐƯỢC — không có bảng nào lưu trạng thái trước. Đo trên
 * dữ liệu quầy ngày 02/09/2026: **0 cặp trùng**, nên bước này hôm nay là no-op.
 * Đó chính là lý do làm nó BÂY GIỜ: sáu tháng nữa là gộp kèm hàng nghìn lượt chơi
 * và một cuộc đối soát quà.
 *
 * 🔴 PHẢI TRỎ LẠI ĐỦ **BỐN** BẢNG có `nguoi_choi_id`: `luot_choi` · `van_choi` ·
 * `khach_tiem_nang` · `luot_quay`. Bảng cuối khai ở chính file này chứ không ở
 * `luoc-do.ts` nên rất dễ sót — `xoaTheoSdt` đã sót nó một lần và làm quyền xoá dữ
 * liệu theo NĐ 13/2023 ném lỗi khoá ngoại.
 */
function backfillV3(db: DatabaseSync): void {
  const nguoi = db
    .prepare("select id, so_dien_thoai from nguoi_choi order by id")
    .all() as { id: number; so_dien_thoai: string }[];

  // Bản đồ số ĐÃ QUY CHUẨN → id hồ sơ GIỮ LẠI. Giữ bản có id NHỎ NHẤT: nó là hồ sơ
  // đăng ký trước, và `tao_luc` của nó mới là mốc "khách đến với trung tâm từ bao
  // giờ" — thứ đội sale dùng để xếp thứ tự chăm sóc.
  const giuLai = new Map<string, number>();
  const canGop: { tu: number; ve: number; soMoi: string }[] = [];

  for (const n of nguoi) {
    const soMoi = doiDauSoCu(n.so_dien_thoai);
    const daCo = giuLai.get(soMoi);
    if (daCo === undefined) {
      giuLai.set(soMoi, n.id);
    } else {
      canGop.push({ tu: n.id, ve: daCo, soMoi });
    }
  }

  for (const { tu, ve } of canGop) gopMotHoSo(db, tu, ve);

  // Quy chuẩn số của những hồ sơ GIỮ LẠI. Làm SAU khi gộp, nếu không câu update
  // đầu tiên đã đụng `UNIQUE(so_dien_thoai)` với bản chưa gộp.
  const doiSo = db.prepare("update nguoi_choi set so_dien_thoai = ?, sua_luc = ? where id = ?");
  const luc = Date.now();
  for (const [soMoi, id] of giuLai) {
    const cu = nguoi.find((n) => n.id === id)!;
    if (cu.so_dien_thoai !== soMoi) doiSo.run(soMoi, luc, id);
  }

  if (canGop.length > 0) {
    // Ghi nhật ký để người vận hành biết máy đã đụng vào hồ sơ khách. `hanh_dong`
    // là TEXT tự do nên không cần migration. KHÔNG ghi số điện thoại vào đây —
    // nhật ký không phải chỗ để dữ liệu cá nhân rò ra lần thứ hai.
    db.prepare(
      `insert into nhat_ky_truy_cap (hanh_dong, doi_tuong, so_dong, luc)
       values ('gop_khach', 'nang-cap-v3: quy chuan dau so 11 so', ?, ?)`,
    ).run(canGop.length, luc);
  }
}

/**
 * Gộp hồ sơ `tu` vào hồ sơ `ve`. Chỉ dùng trong backfill — đã nằm trong giao dịch.
 *
 * 🔴 Phải xử `UNIQUE (co_so_id, nguoi_choi_id)` của `khach_tiem_nang` TRƯỚC khi
 * `UPDATE`, nếu không câu lệnh NỔ ngay khi cả hai hồ sơ cùng có lead ở một cơ sở.
 */
function gopMotHoSo(db: DatabaseSync, tu: number, ve: number): void {
  // (1) Lead đụng nhau ở CÙNG một cơ sở → hợp nhất thành một dòng rồi xoá bản thừa.
  const dung = db
    .prepare(
      `select a.id as id_tu, b.id as id_ve, a.co_so_id
         from khach_tiem_nang a
         join khach_tiem_nang b on b.co_so_id = a.co_so_id and b.nguoi_choi_id = ?
        where a.nguoi_choi_id = ?`,
    )
    .all(ve, tu) as { id_tu: number; id_ve: number; co_so_id: number }[];

  for (const d of dung) {
    const a = db.prepare("select * from khach_tiem_nang where id = ?").get(d.id_tu) as Record<string, unknown>;
    const b = db.prepare("select * from khach_tiem_nang where id = ?").get(d.id_ve) as Record<string, unknown>;

    // Trạng thái TIẾN XA NHẤT thắng. `bo` xếp thấp nhất: cùng một người xuất hiện
    // lại dưới số kia nghĩa là họ đang hoạt động trở lại, giữ `bo` là chôn một đầu
    // mối còn sống.
    const BAC: Record<string, number> = {
      bo: 0, moi: 1, khong_nghe_may: 2, da_lien_he: 3, hen_hoc_thu: 4, chot: 5,
    };
    const ttA = String(a.trang_thai ?? "moi");
    const ttB = String(b.trang_thai ?? "moi");
    const trangThai = (BAC[ttA] ?? 1) > (BAC[ttB] ?? 1) ? ttA : ttB;

    // Ghi chú của SALE — nối cả hai, không vứt bên nào. Cắt 500 ký tự cho khớp
    // giới hạn của `ghiChuLead`.
    const chuA = a.ghi_chu === null || a.ghi_chu === undefined ? "" : String(a.ghi_chu);
    const chuB = b.ghi_chu === null || b.ghi_chu === undefined ? "" : String(b.ghi_chu);
    const ghiChu = [chuB, chuA].filter((c) => c.trim() !== "").join(" | ").slice(0, 500) || null;

    // Người chăm sóc: giữ bên được GIAO TRƯỚC. Ai nhận đầu mối trước thì đó là
    // người đã bỏ công gọi, giao lại cho người sau là cướp việc của họ.
    const giaoA = a.giao_luc === null || a.giao_luc === undefined ? Infinity : Number(a.giao_luc);
    const giaoB = b.giao_luc === null || b.giao_luc === undefined ? Infinity : Number(b.giao_luc);
    const ben = giaoA < giaoB ? a : b;

    db.prepare(
      `update khach_tiem_nang
          set trang_thai = ?, ghi_chu = ?, nhan_vien_id = ?, giao_luc = ?,
              tao_luc = ?, sua_luc = ?, chua_xac_thuc = ?
        where id = ?`,
    ).run(
      trangThai,
      ghiChu,
      (ben.nhan_vien_id ?? null) as number | null,
      (ben.giao_luc ?? null) as number | null,
      Math.min(Number(a.tao_luc), Number(b.tao_luc)),
      Math.max(Number(a.sua_luc), Number(b.sua_luc)),
      // Cờ "số chưa xác thực": chỉ cần MỘT bên đã xác thực là coi như đã xác thực.
      Number(a.chua_xac_thuc ?? 0) === 1 && Number(b.chua_xac_thuc ?? 0) === 1 ? 1 : 0,
      d.id_ve,
    );
    db.prepare("delete from khach_tiem_nang where id = ?").run(d.id_tu);
  }

  // (2) Trỏ lại ĐỦ BỐN bảng.
  for (const bang of ["luot_choi", "van_choi", "luot_quay", "khach_tiem_nang"]) {
    db.prepare(`update ${bang} set nguoi_choi_id = ? where nguoi_choi_id = ?`).run(ve, tu);
  }

  // (3) Hợp nhất cờ một chiều rồi xoá hồ sơ thừa. Hai cờ này chỉ đi LÊN — đã đồng
  // ý tư vấn thì không vì gộp mà mất, đó là căn cứ pháp lý để gọi điện.
  db.prepare(
    `update nguoi_choi
        set dong_y_tu_van = max(dong_y_tu_van, (select dong_y_tu_van from nguoi_choi where id = ?)),
            quan_tam_hoc_thu = max(quan_tam_hoc_thu, (select quan_tam_hoc_thu from nguoi_choi where id = ?)),
            tao_luc = min(tao_luc, (select tao_luc from nguoi_choi where id = ?))
      where id = ?`,
  ).run(tu, tu, tu, ve);
  db.prepare("delete from nguoi_choi where id = ?").run(tu);
}

/**
 * v2 — kéo cờ "đã ghi danh" từ LƯỢT lên VÁN.
 *
 * Ván nào có bất kỳ lượt nào đã tích thì ván đó coi như đã ghi danh, và mốc
 * thời gian lấy cái SỚM NHẤT: nhân viên tích lúc nào thì đó là lúc ghi nhận,
 * tích lại lần hai không phải một lần ghi nhận mới.
 */
function backfillV2(db: DatabaseSync): void {
  db.exec(
    `update van_choi
        set da_ghi_danh = 1,
            ghi_danh_luc = (select min(l.ghi_danh_luc) from luot_choi l
                             where l.van_id = van_choi.id and l.da_ghi_danh = 1)
      where exists (select 1 from luot_choi l
                     where l.van_id = van_choi.id and l.da_ghi_danh = 1)`,
  );
}

/** v1 — sinh cơ sở từ tên trung tâm cũ, dựng kho quà và ván cho dữ liệu trước GĐ 10. */
function backfillV1(db: DatabaseSync): void {
  // (1) Gom chương trình theo tên đã chuẩn hoá → sinh CS1, CS2, … theo thứ tự id.
  const ct = db
    .prepare("select id, ten_trung_tam from chuong_trinh order by id")
    .all() as { id: number; ten_trung_tam: string }[];

  const nhom = new Map<string, { ten: string; ids: number[] }>();
  for (const c of ct) {
    const ten = (c.ten_trung_tam ?? "").trim();
    const khoa = ten === "" ? "\u0000mac-dinh" : khoaChuanHoa(ten);
    const cu = nhom.get(khoa);
    if (cu) cu.ids.push(c.id);
    // Tên hiển thị lấy bản XUẤT HIỆN ĐẦU TIÊN (id nhỏ nhất) — không đoán hộ
    // xem cách viết nào "đúng hơn".
    else nhom.set(khoa, { ten: ten === "" ? TEN_CO_SO_MAC_DINH : ten, ids: [c.id] });
  }

  const luc = Date.now();
  let stt = 0;
  const themCoSo = db.prepare(
    "insert into co_so (ma, ten, trang_thai, tao_luc, sua_luc) values (?, ?, 'bat', ?, ?)",
  );
  const ganCoSo = db.prepare(
    `update chuong_trinh
        set co_so_id = ?, che_do = 'tai_quay', nguon_co_so = 'gan_san',
            so_lan_choi = 1, tro_choi = 'trung_so'
      where id = ?`,
  );
  for (const { ten, ids } of nhom.values()) {
    stt += 1;
    themCoSo.run(`${TIEN_TO_CO_SO}${stt}`, ten, luc, luc);
    const coSoId = Number(
      (db.prepare("select last_insert_rowid() as id").get() as { id: number }).id,
    );
    for (const id of ids) ganCoSo.run(coSoId, id);
  }

  // (2) Mỗi chương trình cũ một dòng kho quà, KHÔNG GIỚI HẠN — trước đây không
  //     có trần tổng, nên "không giới hạn" đúng là thứ chúng đã chạy.
  db.prepare(
    `insert into qua_tang (chuong_trinh_id, ten, thu_tu, so_luong, tran_moi_ngay, tao_luc, sua_luc)
     select id, ten_giai_thuong, 0, null, tran_giai_moi_ngay, ?, ? from chuong_trinh`,
  ).run(luc, luc);

  // (3) Mỗi lượt cũ → một VÁN một-lần. Chép nguyên các cờ nghiệp vụ sang.
  db.prepare(
    `insert into van_choi
       (chuong_trinh_id, nguoi_choi_id, co_so_id, ngay, so_lan_cho_phep, so_lan_da_dung,
        luot_tot_nhat_id, trung, ma_xac_thuc, da_trao_thuong, trao_luc,
        bat_dau_luc, ket_thuc_luc, tao_luc, sua_luc)
     select l.chuong_trinh_id, l.nguoi_choi_id, c.co_so_id, l.ngay, 1, 1,
            l.id, l.trung, l.ma_xac_thuc, l.da_trao_thuong, l.trao_luc,
            l.bat_dau_luc, l.ket_thuc_luc, ?, ?
       from luot_choi l join chuong_trinh c on c.id = l.chuong_trinh_id
      order by l.id`,
  ).run(luc, luc);

  // (4) Nối ngược lượt về ván vừa tạo.
  db.exec(
    `update luot_choi
        set van_id = (select v.id from van_choi v where v.luot_tot_nhat_id = luot_choi.id),
            lan_thu = 1`,
  );
}

export function nangCap(db: DatabaseSync): void {
  // 🔴 Bảng TRƯỚC cột: `themCot` trên một bảng chưa tồn tại thì im lặng bỏ qua.
  for (const sql of BANG_BO_SUNG) db.exec(sql);
  for (const [bang, cot, dinhNghia] of COT_BO_SUNG) themCot(db, bang, cot, dinhNghia);
  for (const sql of CHI_MUC_SAU_KHI_THEM_COT) db.exec(sql);
  backfill(db);
}
