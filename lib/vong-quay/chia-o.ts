/**
 * CHIA CUNG — biến danh sách ô quà thành mặt vòng quay. Hàm THUẦN, không đụng
 * cơ sở dữ liệu: chia được bằng bảng tra thì kiểm được hàng nghìn ca trong một
 * phần nghìn giây, và trả lời được câu "hết Balo thì vòng trông thế nào" mà
 * không cần dựng CSDL.
 *
 * 🔴 Hai luật xương sống:
 *
 * 1. **Ô hết hàng KHÔNG có mặt trên vòng.** Không thay thầm bằng quà khác — kim
 *    chỉ vào Balo mà đưa cây bút là thứ phụ huynh nhớ rất lâu. Vòng lúc 8h khác
 *    lúc 20h là TRUNG THỰC, không phải lỗi.
 * 2. **Mọi ô còn phát được nhận cung BẰNG NHAU** (ADR-012, 02/09/2026). Mặt
 *    vòng chỉ nói "hôm nay có bấy nhiêu loại quà"; còn "trúng dễ đến đâu" là
 *    `o_qua.ti_le_trung`, người vận hành khai ở màn thiết lập.
 *
 * 🔴 Luật 2 ĐÃ TỪNG NGƯỢC LẠI: cung chia theo TỒN KHO, và "cung rộng = dễ trúng"
 * là điều mắt nhìn thấy được. Đảo vì nó đánh đồng "tôi có bao nhiêu cái" với
 * "khách trúng dễ đến đâu" — khai 10 và 30 với nghĩa tồn kho thì bị đọc thành
 * "quà sau dễ trúng gấp ba". Cái mất khi đảo được ghi thẳng trong ADR-012.
 */

import { chuanHoaGoc } from "@/lib/vong-quay/goc";

export interface OQua {
  id: number;
  ten: string;
  thuTu: number;
  /** `null` = Ô ĐÁY, không giới hạn số lượng. Vòng luôn phải có ít nhất một ô đáy. */
  soLuong: number | null;
  /** Đã trao bao nhiêu cái. Đếm từ bảng lượt quay, không lưu sẵn. */
  daTrao: number;
  /** 0 = không có trần theo ngày. */
  tranMoiNgay: number;
  /** Đã trao bao nhiêu cái riêng HÔM NAY. */
  daTraoHomNay: number;
  /**
   * TỈ LỆ TRÚNG — phân số [0,1] (ADR-012). KHÔNG phải độ rộng cung: mọi cung
   * bằng nhau. Đây là con số người vận hành khai, và là thứ duy nhất quyết định
   * khách trúng ô nào.
   *
   * 0 nghĩa là ô VẪN HIỆN trên vòng nhưng không bao giờ được bốc — yêu cầu đích
   * danh của người vận hành, để trưng món quà lớn mà chưa muốn phát.
   */
  tiLeTrung: number;
  mau: string;
}

export interface Cung {
  oId: number;
  ten: string;
  mau: string;
  /** Mép đầu, độ, [0,360). */
  tu: number;
  /** Mép cuối, độ. Cung cuối cùng có `den = 360`. */
  den: number;
  doRong: number;
  /**
   * ẢNH CHỤP tỉ lệ trúng của ô tại đúng lúc chia (ADR-012).
   *
   * 🔴 Vì sao phải nằm trong `Cung` chứ không tra lại từ `o_qua`: cả mảng này
   * được ghi thẳng vào `luot_quay.cung_json`. Thiếu nó thì nút "Dựng lại ván"
   * phải đọc tỉ lệ HIỆN TẠI, và một lần người vận hành sửa tỉ lệ là mọi ván cũ
   * dựng lại ra một xác suất chưa từng được dùng — đúng thứ ảnh chụp sinh ra để
   * bác bỏ. Ván quay TRƯỚC ADR-012 không có trường này (đọc lên là `undefined`);
   * chúng chỉ được VẼ LẠI chứ không bao giờ chấm lại, nên vô hại.
   */
  tiLeTrung: number;
}

/**
 * Ô này còn phát được nữa không.
 *
 * 🔴 Trần theo ngày CỐ Ý không áp cho ô đáy. Ô đáy tồn tại để đảm bảo người
 * chơi luôn nhận được thứ gì đó; một cái trần thì phá đúng lời hứa ấy, và khi
 * nó chặn thì vòng quay thành rỗng giữa lúc có phụ huynh đứng trước màn hình.
 */
export function conPhatDuoc(o: OQua): boolean {
  if (o.soLuong === null) return true;
  if (o.daTrao >= o.soLuong) return false;
  if (o.tranMoiNgay > 0 && o.daTraoHomNay >= o.tranMoiNgay) return false;
  return true;
}

/** Còn lại bao nhiêu cái. `null` = không giới hạn. Không bao giờ trả số âm. */
export function conLai(o: OQua): number | null {
  return o.soLuong === null ? null : Math.max(0, o.soLuong - o.daTrao);
}

/**
 * Chia mặt vòng — MỌI ô còn phát được nhận cung BẰNG NHAU (ADR-012).
 *
 * 🔴 Không còn tham số `tiLeDay`, và đó là chủ ý: mặt vòng nay chỉ phụ thuộc
 * DANH SÁCH ô còn phát được. Ô hết hàng biến khỏi vòng như cũ, và các ô còn lại
 * tự chia đều lại — nên vòng lúc 8h khác lúc 20h vẫn là sự thật, không phải lỗi.
 *
 * 🔴 Ô khai tỉ lệ 0 % VẪN nằm trên vòng (yêu cầu đích danh của người vận hành),
 * nó chỉ không bao giờ được bốc. Việc bốc nằm ở `cham.ts`, không ở đây.
 *
 * 🔴 Sắp theo `thuTu` rồi mới tới `id` — hai ô cùng thứ tự mà xếp lung tung thì
 * cùng một cấu hình cho ra hai mặt vòng khác nhau giữa hai lần chạy, và không
 * ai dựng lại được ván đã quay khi có tranh chấp.
 */
export function chiaCung(dsO: readonly OQua[]): Cung[] {
  const conHang = [...dsO]
    .filter(conPhatDuoc)
    .sort((a, b) => a.thuTu - b.thuTu || a.id - b.id);
  if (conHang.length === 0) return [];

  // Cộng dồn theo độ, và ép cung cuối chạm đúng 360: cộng dồn số thực rồi làm
  // tròn có thể để lại một khe hở vài phần nghìn độ, và một góc rơi đúng vào
  // khe đó thì không tra ra ô nào cả.
  const doRongDeu = 360 / conHang.length;
  const cung: Cung[] = [];
  let moc = 0;
  conHang.forEach((o, i) => {
    const den = i === conHang.length - 1 ? 360 : moc + doRongDeu;
    cung.push({
      oId: o.id,
      ten: o.ten,
      mau: o.mau,
      tu: moc,
      den,
      doRong: den - moc,
      tiLeTrung: o.tiLeTrung,
    });
    moc = den;
  });
  return cung;
}

/**
 * Kim dừng ở góc này thì rơi vào ô nào.
 *
 * Trả `null` khi vòng rỗng — nơi gọi phải xử lý được ca đó, đừng giả định luôn
 * có ô. Góc âm hoặc quá 360 được chuẩn hoá trước, nên gọi bằng tổng góc đã quay
 * (mấy nghìn độ) cũng đúng.
 */
export function oTaiGoc(cung: readonly Cung[], gocDung: number): Cung | null {
  if (cung.length === 0) return null;
  const g = chuanHoaGoc(gocDung);
  for (const c of cung) if (g >= c.tu && g < c.den) return c;
  // Chỉ tới đây khi g rơi đúng mép cuối do sai số dấu phẩy động.
  return cung[cung.length - 1];
}
