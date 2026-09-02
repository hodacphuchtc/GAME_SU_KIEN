import "server-only";

import { csdl } from "@/lib/db/ket-noi";
import { maHopLe, sinhMa } from "@/lib/chuong-trinh/ma";
import { themO } from "@/lib/o-qua/kho";
import type { ChuongTrinhKhai } from "@/lib/chuong-trinh/kiem-tra";
import { mucCanhBaoKho, type MucCanhBao } from "@/lib/o-qua/canh-bao";
import { danhSachO } from "@/lib/o-qua/kho";

/** MỌI câu SQL của bảng `chuong_trinh` nằm trong đúng file này. */

export interface ChuongTrinh {
  id: number;
  ma: string;
  tenCoSo: string;
  tiLeODay: number;
  tranGiaiMoiNgay: number;
  phienBanO: number;
  trangThai: "dang_chay" | "ket_thuc";
}

interface Dong {
  id: number;
  ma: string;
  ten_co_so: string;
  ti_le_o_day: number;
  tran_giai_moi_ngay: number;
  phien_ban_o: number;
  trang_thai: string;
}

function tuDong(d: Dong): ChuongTrinh {
  return {
    id: d.id,
    ma: d.ma,
    tenCoSo: d.ten_co_so,
    tiLeODay: d.ti_le_o_day,
    tranGiaiMoiNgay: d.tran_giai_moi_ngay,
    phienBanO: d.phien_ban_o,
    trangThai: d.trang_thai === "ket_thuc" ? "ket_thuc" : "dang_chay",
  };
}

const CHON = `SELECT id, ma, ten_co_so, ti_le_o_day, tran_giai_moi_ngay, phien_ban_o,
                     trang_thai FROM chuong_trinh`;

export function danhSach(): (ChuongTrinh & {
  soLuot: number;
  soO: number;
  /** Mức cảnh báo kho — tính từ ĐÚNG một nguồn `mucCanhBaoKho`, không tính lại ở trang. */
  canhBao: MucCanhBao;
})[] {
  const dong = csdl()
    .prepare(
      `${CHON.replace("SELECT", "SELECT (SELECT COUNT(*) FROM luot_quay l WHERE l.chuong_trinh_id = chuong_trinh.id) AS so_luot, (SELECT COUNT(*) FROM o_qua o WHERE o.chuong_trinh_id = chuong_trinh.id) AS so_o,")}
        ORDER BY id DESC`,
    )
    .all() as unknown as (Dong & { so_luot: number; so_o: number })[];
  return dong.map((d) => ({
    ...tuDong(d),
    soLuot: d.so_luot,
    soO: d.so_o,
    canhBao: mucCanhBaoKho(danhSachO(d.id)).muc,
  }));
}

export function timTheoMa(ma: string): ChuongTrinh | null {
  if (!maHopLe(ma)) return null;
  const d = csdl().prepare(`${CHON} WHERE ma = ?`).get(ma) as Dong | undefined;
  // `get` trả `undefined` khi không có dòng, KHÔNG phải `null`.
  return d == null ? null : tuDong(d);
}

/** Sinh một mã chưa ai dùng. Thử vài lần rồi bỏ cuộc thay vì lặp vô hạn. */
function maChuaDung(): string {
  const db = csdl();
  for (let i = 0; i < 50; i++) {
    const ma = sinhMa();
    const co = db.prepare("SELECT 1 AS x FROM chuong_trinh WHERE ma = ?").get(ma);
    if (co == null) return ma;
  }
  throw new Error("Không sinh được mã chương trình mới sau 50 lần thử.");
}

/**
 * Tạo chương trình cùng toàn bộ ô quà trong MỘT giao dịch.
 *
 * 🔴 Phải là một giao dịch: chương trình có mặt mà chưa có ô nào nghĩa là một
 * vòng quay RỖNG đã nằm trong hệ thống và ai đó quét mã là gặp nó.
 */
export function taoChuongTrinh(k: ChuongTrinhKhai): ChuongTrinh {
  const db = csdl();
  const gio = Date.now();
  db.exec("BEGIN");
  try {
    const ma = maChuaDung();
    const kq = db
      .prepare(
        `INSERT INTO chuong_trinh (ma, ten_co_so, ti_le_o_day, tran_giai_moi_ngay,
                                   tao_luc, sua_luc)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(ma, k.tenCoSo.trim(), k.tiLeODay, k.tranGiaiMoiNgay, gio, gio);
    const id = Number(kq.lastInsertRowid);
    for (const o of k.dsO) {
      themO(id, {
        ten: o.ten.trim(),
        thuTu: o.thuTu,
        soLuong: o.soLuong,
        tranMoiNgay: o.tranMoiNgay,
        mau: o.mau,
      });
    }
    // Mọi ô vừa thêm đã đẩy phiên bản lên; kéo về 1 vì đây là cấu hình ĐẦU TIÊN,
    // chưa có lượt quay nào ghim phiên bản cũ để mà phải giữ.
    db.prepare("UPDATE chuong_trinh SET phien_ban_o = 1 WHERE id = ?").run(id);
    db.exec("COMMIT");
    return timTheoMa(ma)!;
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}

export function doiTrangThai(ma: string, dangChay: boolean): void {
  csdl()
    .prepare("UPDATE chuong_trinh SET trang_thai = ?, sua_luc = ? WHERE ma = ?")
    .run(dangChay ? "dang_chay" : "ket_thuc", Date.now(), ma);
}
