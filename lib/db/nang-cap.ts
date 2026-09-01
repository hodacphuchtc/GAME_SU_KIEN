import type { DatabaseSync } from "node:sqlite";

import { TEN_CO_SO_MAC_DINH, TIEN_TO_CO_SO } from "@/config/to-chuc";

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
];

/**
 * Chỉ mục trên cột VỪA THÊM. 🔴 Không được để trong `luoc-do.ts`: trên một CSDL
 * cũ, cột chưa tồn tại vào lúc chuỗi lược đồ chạy, và câu CREATE INDEX sẽ ném.
 */
const CHI_MUC_SAU_KHI_THEM_COT: readonly string[] = [
  "CREATE INDEX IF NOT EXISTS ct_theo_co_so ON chuong_trinh (co_so_id)",
  "CREATE INDEX IF NOT EXISTS luot_theo_van ON luot_choi (van_id)",
];

/** Phiên bản DỮ LIỆU mới nhất. Tăng khi thêm một bước backfill mới. */
const PHIEN_BAN_DU_LIEU = 2;

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
    db.exec(`pragma user_version = ${PHIEN_BAN_DU_LIEU}`);
    db.exec("commit");
  } catch (loi) {
    db.exec("rollback");
    throw loi;
  }
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
  for (const [bang, cot, dinhNghia] of COT_BO_SUNG) themCot(db, bang, cot, dinhNghia);
  for (const sql of CHI_MUC_SAU_KHI_THEM_COT) db.exec(sql);
  backfill(db);
}
