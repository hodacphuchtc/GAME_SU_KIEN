/*
 * NGUỒN: chép từ `modules/GAME_SU_KIEN/app/lib/ma-xac-thuc.ts` @ 3d96358.
 * ĐÃ SỬA THEO Đ5: hạt gieo là **id ô + id lượt**, KHÔNG phải (số trúng + mốc phút).
 *
 * Vì sao đảo: bản Trúng Số gieo theo PHÚT nên mã tự đổi mỗi phút — hợp với một
 * app không có máy chủ và không lưu gì. Vòng Quay CÓ sổ: mỗi lượt là một dòng
 * tồn tại mãi, và mã in trên màn hình phải khớp với mã trong sổ kể cả một tuần
 * sau, lúc phụ huynh mang phiếu tới nhận quà. Mã đổi theo phút thì đối soát
 * bằng gì?
 */

const BANG_CHU = "ACDEFGHJKLMNPQRTUVWXY3479"; // bỏ ký tự dễ đọc nhầm: B/8, I/1, O/0, S/5, Z/2, 6
const MUOI = 0x9e3779b9;

function bam(chuoi: string): number {
  let gia = 0x811c9dc5;
  for (let i = 0; i < chuoi.length; i += 1) {
    gia ^= chuoi.charCodeAt(i);
    gia = Math.imul(gia, 0x01000193) >>> 0;
  }
  return (gia ^ MUOI) >>> 0;
}

/**
 * Mã 4 ký tự cho MỘT lượt quay.
 *
 * 🔴 Hạt là chính KẾT QUẢ (ô nào + lượt nào). Nhờ vậy hai người cầm hai kết quả
 * khác nhau thì mã khác nhau, không ai mượn được mã của người bên cạnh — đúng
 * bài học đã trả giá ở game Chọn Số.
 *
 * ⚠️ Phạm vi: đây là lớp chống chuyền ảnh chụp cho nhau ở quầy, KHÔNG phải chữ
 * ký chống giả mạo. Ai đọc được mã nguồn thì sinh lại được mã. Bằng chứng thật
 * khi có tranh chấp là dòng trong bảng `luot_quay`, không phải bốn ký tự này.
 */
export function maXacThuc(oQuaId: number, luotId: number): string {
  let gia = bam(`${oQuaId}:${luotId}`);
  let ma = "";
  for (let i = 0; i < 4; i += 1) {
    ma += BANG_CHU[gia % BANG_CHU.length];
    gia = Math.floor(gia / BANG_CHU.length) + bam(ma);
  }
  return ma;
}
