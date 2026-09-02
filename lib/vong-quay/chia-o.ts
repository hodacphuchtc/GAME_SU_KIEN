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
 * 2. **Cung tỉ lệ đúng với số lượng đã khai**, nên "cung rộng = dễ trúng" là
 *    điều mắt nhìn thấy được, không phải điều phải tin.
 */

import {
  SAN_CUNG_O_DAY,
  TI_LE_O_DAY_MAC_DINH,
  TRAN_TI_LE_O_DAY,
} from "@/config/vong-quay";
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
 * Chia mặt vòng.
 *
 * `tiLeDay` là VAN NGÂN SÁCH: phần vòng dành cho ô đáy. Các ô quà thật chia
 * nhau phần còn lại theo đúng số lượng CÒN LẠI của từng loại.
 *
 * 🔴 Sắp theo `thuTu` rồi mới tới `id` — hai ô cùng thứ tự mà xếp lung tung thì
 * cùng một cấu hình cho ra hai mặt vòng khác nhau giữa hai lần chạy, và không
 * ai dựng lại được ván đã quay khi có tranh chấp.
 */
export function chiaCung(
  dsO: readonly OQua[],
  tiLeDay: number = TI_LE_O_DAY_MAC_DINH,
): Cung[] {
  const conHang = [...dsO]
    .filter(conPhatDuoc)
    .sort((a, b) => a.thuTu - b.thuTu || a.id - b.id);
  if (conHang.length === 0) return [];

  const day = conHang.filter((o) => o.soLuong === null);
  const that = conHang.filter((o) => o.soLuong !== null);
  const tonThat = that.reduce((s, o) => s + (conLai(o) ?? 0), 0);

  // Kẹp hai đầu: khai 0 thì kho quà thật cạn sau một buổi; khai 1 thì vòng quay
  // chỉ còn là một cái nút bấm.
  const tiLe = Math.min(TRAN_TI_LE_O_DAY, Math.max(SAN_CUNG_O_DAY, tiLeDay));

  /** Mỗi ô nhận bao nhiêu PHẦN của vòng (tổng = 1). */
  const phan = new Map<number, number>();

  if (day.length === 0) {
    // Không có ô đáy — lẽ ra bị chặn ngay ở form tạo. Vẫn phải chia được, chứ
    // không ném lỗi giữa lúc có phụ huynh đứng trước màn hình.
    for (const o of that) phan.set(o.id, (conLai(o) ?? 0) / (tonThat || that.length));
  } else if (that.length === 0 || tonThat === 0) {
    // Hết sạch quà thật ⇒ ô đáy chiếm trọn vòng. Người chơi vẫn nhận được thứ
    // gì đó, và nhìn vào vòng là biết ngay hôm nay chỉ còn quà an ủi.
    for (const o of day) phan.set(o.id, 1 / day.length);
  } else {
    for (const o of day) phan.set(o.id, tiLe / day.length);
    for (const o of that) phan.set(o.id, (1 - tiLe) * ((conLai(o) ?? 0) / tonThat));
  }

  // Cộng dồn theo độ, và ép cung cuối chạm đúng 360: cộng dồn số thực rồi làm
  // tròn có thể để lại một khe hở vài phần nghìn độ, và một góc rơi đúng vào
  // khe đó thì không tra ra ô nào cả.
  const cung: Cung[] = [];
  let moc = 0;
  conHang.forEach((o, i) => {
    const doRong = (phan.get(o.id) ?? 0) * 360;
    const den = i === conHang.length - 1 ? 360 : moc + doRong;
    cung.push({ oId: o.id, ten: o.ten, mau: o.mau, tu: moc, den, doRong: den - moc });
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
