"use server";

import { GIAY_DEM_LUOT, GIAY_QUAY } from "@/config/vong-quay";
import { T } from "@/config/locale";
import { csdl } from "@/lib/db/ket-noi";
import { timTheoMa } from "@/lib/chuong-trinh/kho";
import { danhSachO, phienBanO } from "@/lib/o-qua/kho";
import { chiaCung, type Cung } from "@/lib/vong-quay/chia-o";
import { chamKetQua, hatGiongMoi } from "@/lib/vong-quay/cham";
import { maXacThuc } from "@/lib/ma-xac-thuc";
import { conLuotHomNay } from "@/lib/nguoi-choi/nhan-dien";
import { ngayVN } from "@/lib/thoi-gian";

/**
 * MỞ MỘT LƯỢT QUAY — nơi quyết định ai nhận gì.
 *
 * Máy chủ quyết kết quả TRƯỚC, rồi phát `(gocDung, thoiLuong, cung)` cho cả hai
 * màn hình; mỗi máy tự chạy `goc(t)` theo đồng hồ của mình. Không truyền từng
 * khung hình qua mạng — đó là thứ khiến LCD và điện thoại dừng cùng một ô.
 */

export interface KetQuaQuay {
  loi?: string;
  luot?: {
    id: number;
    gocDung: number;
    thoiLuong: number;
    batDauLuc: number;
    phienBanO: number;
    cung: Cung[];
    oTen: string;
    oMau: string;
    maXacThuc: string;
  };
}

/**
 * Đ6 — MỘT LÚC MỘT LƯỢT cho mỗi chương trình.
 *
 * 🔴 Khoá bằng chính bảng `luot_quay` trong MỘT giao dịch `BEGIN IMMEDIATE`,
 * KHÔNG bằng một biến trong bộ nhớ: biến bộ nhớ chết theo mỗi lần `next dev`
 * nạp lại module, và nó không sống sót qua một lần khởi động lại máy chủ giữa
 * giờ cao điểm. Bảng thì sống.
 *
 * Vì sao phải khoá: hai lượt song song có thể CÙNG thấy ô cuối còn hàng rồi
 * cùng thắng nó — và không một bài kiểm đơn lẻ nào bắt được chuyện đó.
 */
function coLuotDangChay(chuongTrinhId: number, bayGio: number): boolean {
  const han = bayGio - (GIAY_QUAY + GIAY_DEM_LUOT) * 1000;
  const d = csdl()
    .prepare(
      `SELECT id FROM luot_quay
        WHERE chuong_trinh_id = ? AND ket_thuc_luc IS NULL AND bat_dau_luc > ?
        LIMIT 1`,
    )
    .get(chuongTrinhId, han);
  // 🔴 `.get()` trả `undefined` khi không có dòng, KHÔNG phải `null`. So `!== null`
  // ở đây làm hàm này trả TRUE ngay từ lượt đầu và khoá chặt cả chương trình mà
  // không một dòng lỗi nào. Đã trả giá ở app Trúng Số.
  return d != null;
}

export async function quayMot(ma: string, nguoiChoiId: number): Promise<KetQuaQuay> {
  const ct = timTheoMa(ma);
  if (!ct) return { loi: T.choiKhongThayChuongTrinh };
  if (ct.trangThai !== "dang_chay") return { loi: T.choiDaKetThuc };
  if (!conLuotHomNay(ct.id, nguoiChoiId)) return { loi: T.choiHetLuot };

  const db = csdl();
  const bayGio = Date.now();

  // MỘT giao dịch: kiểm khoá · chia cung · chấm · ghi lượt · gắn mã xác thực.
  // Tách ra nhiều giao dịch là mở lại đúng cái khe mà Đ6 sinh ra để bịt.
  db.exec("BEGIN IMMEDIATE");
  try {
    if (coLuotDangChay(ct.id, bayGio)) {
      db.exec("ROLLBACK");
      return { loi: T.quayDangCoNguoi };
    }

    const dsO = danhSachO(ct.id);
    const cung = chiaCung(dsO, ct.tiLeODay);
    if (cung.length === 0) {
      db.exec("ROLLBACK");
      return { loi: T.quayHetQua };
    }

    const hatGiong = hatGiongMoi();
    const cham = chamKetQua({ hatGiong, cung });
    if (cham === null) {
      db.exec("ROLLBACK");
      return { loi: T.quayHetQua };
    }

    const phienBan = phienBanO(ct.id);
    const kq = db
      .prepare(
        `INSERT INTO luot_quay (chuong_trinh_id, nguoi_choi_id, o_qua_id, ngay,
                                hat_giong, goc_dung, phien_ban_o, cung_json, bat_dau_luc)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      // 🔴 Lưu ẢNH CHỤP mặt vòng, không chỉ số phiên bản. Số phiên bản nói được
      // "mặt vòng đã đổi" nhưng KHÔNG nói nó cũ trông thế nào — mà đó mới đúng
      // là thứ nút "Dựng lại ván" cần để chứng minh không ai chỉnh kết quả.
      .run(ct.id, nguoiChoiId, cham.o.oId, ngayVN(bayGio), hatGiong, cham.gocDung,
           phienBan, JSON.stringify(cung), bayGio);

    // Mã gieo bằng id ô + id lượt (Đ5) nên chỉ sinh được SAU khi có id — vẫn
    // nằm trong cùng giao dịch, nên không tồn tại khoảnh khắc nào dòng lượt có
    // mặt mà thiếu mã.
    const luotId = Number(kq.lastInsertRowid);
    const ma4 = maXacThuc(cham.o.oId, luotId);
    db.prepare("UPDATE luot_quay SET ma_xac_thuc = ? WHERE id = ?").run(ma4, luotId);

    db.exec("COMMIT");

    return {
      luot: {
        id: luotId,
        gocDung: cham.gocDung,
        thoiLuong: GIAY_QUAY,
        batDauLuc: bayGio,
        phienBanO: phienBan,
        cung,
        oTen: cham.o.ten,
        oMau: cham.o.mau,
        maXacThuc: ma4,
      },
    };
  } catch (loi) {
    db.exec("ROLLBACK");
    throw loi;
  }
}

/**
 * Đóng lượt khi vòng đã dừng trên màn hình.
 *
 * Không đóng thì lượt tiếp theo phải chờ hết đệm `GIAY_DEM_LUOT`. Gọi lại lần
 * hai vô hại: câu lệnh chỉ chạm dòng còn `ket_thuc_luc` rỗng.
 */
export async function ketThucLuot(luotId: number): Promise<void> {
  csdl()
    .prepare("UPDATE luot_quay SET ket_thuc_luc = ? WHERE id = ? AND ket_thuc_luc IS NULL")
    .run(Date.now(), luotId);
}
