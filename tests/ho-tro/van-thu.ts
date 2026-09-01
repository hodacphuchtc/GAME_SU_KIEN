import { csdl } from "@/lib/db/ket-noi";

/**
 * Dựng MỘT VÁN ĐÃ CHỐT kèm một lần bấm, trả về id của VÁN.
 *
 * Từ GĐ 12.1, lịch sử · trần giải · thước đo ghi danh đều đọc từ `van_choi`.
 * Bài test chỉ chèn `luot_choi` sẽ thấy bảng rỗng và tưởng hàm sai, trong khi
 * chính dữ liệu nền mới thiếu.
 */
export function ghiVanDaChot(opt: {
  chuongTrinhId: number;
  nguoiChoiId: number | null;
  ngay: string;
  trung?: boolean;
  khoangLech?: number;
  /** Con số người chơi dừng lại. Mặc định 0 — ca đáng canh nhất (`0000`). */
  soDaDung?: number;
}): number {
  const db = csdl();
  const luc = Date.now();
  const trung = opt.trung === true;

  db.prepare(
    `insert into luot_choi
       (chuong_trinh_id, nguoi_choi_id, ngay, bat_dau_luc, ket_thuc_luc, trung, khoang_lech,
        so_da_dung, lan_thu)
     values (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
  ).run(
    opt.chuongTrinhId,
    opt.nguoiChoiId,
    opt.ngay,
    luc,
    luc,
    trung ? 1 : 0,
    opt.khoangLech ?? 0,
    opt.soDaDung ?? 0,
  );
  const luotId = Number(db.prepare("select last_insert_rowid() as id").get()!.id);

  db.prepare(
    `insert into van_choi
       (chuong_trinh_id, nguoi_choi_id, ngay, so_lan_cho_phep, so_lan_da_dung,
        luot_tot_nhat_id, trung, ma_xac_thuc, bat_dau_luc, ket_thuc_luc, tao_luc, sua_luc)
     values (?, ?, ?, 1, 1, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    opt.chuongTrinhId,
    opt.nguoiChoiId,
    opt.ngay,
    luotId,
    trung ? 1 : 0,
    trung ? "K7M2" : null,
    luc,
    luc,
    luc,
    luc,
  );
  const vanId = Number(db.prepare("select last_insert_rowid() as id").get()!.id);
  db.prepare("update luot_choi set van_id = ? where id = ?").run(vanId, luotId);
  return vanId;
}
