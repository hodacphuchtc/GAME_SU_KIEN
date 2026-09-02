import { bocGoc } from "./goc";
import { type Cung } from "./chia-o";

/**
 * CHẤM KẾT QUẢ một lượt quay: hạt giống → QUÀ → góc trong cung của quà đó.
 *
 * 🔴 THỨ TỰ NÀY LÀ ĐẢO NGƯỢC của bản trước ADR-012, và đó là cả điểm mấu chốt:
 *
 *   Trước: rút góc đều → xem kim rơi cung nào ⇒ cung rộng bao nhiêu, cơ hội bấy nhiêu.
 *   Nay:   rút quà theo TỈ LỆ KHAI → rút góc đều BÊN TRONG cung của quà đó.
 *
 * Nhờ đảo, kim **luôn dừng đúng trên ô được công bố** — không tồn tại phép ánh
 * xạ nào giữa chỗ kim chỉ và tên quà trên thẻ kết quả. Đó là điều người vận
 * hành dặn đích danh: *"tránh quay hiển thị một đường, kết quả một nẻo."*
 *
 * Hàm THUẦN, không đụng cơ sở dữ liệu — nhờ vậy bài kiểm công bằng chạy được
 * 100.000 lượt qua đúng con đường mà lượt thật đi qua.
 */

export interface ThamSoCham {
  /** Hạt sinh từ `crypto.getRandomValues` lúc mở lượt, lưu vào sổ để dựng lại. */
  hatGiong: string;
  /** Cung đã chốt theo PHIÊN BẢN ô (Đ3), không co giãn theo tồn kho từng lượt. */
  cung: readonly Cung[];
  /**
   * 🔴 CỐ Ý KHÔNG DÙNG. Có mặt ở đây chỉ để nơi gọi nào quen tay truyền vào thì
   * bị TypeScript nhắc rằng nó vô nghĩa, thay vì âm thầm ảnh hưởng kết quả.
   */
  giay?: number;
  /**
   * 🔴 Truyền `true` là NÉM LỖI. Xem `chamKetQua` bên dưới.
   */
  hetGio?: boolean;
}

export interface KetQuaCham {
  gocDung: number;
  o: Cung;
}

/**
 * 🔴 Đ2 — VÒNG QUAY KHÔNG CÓ CA "HẾT GIỜ", và hàm này NÉM LỖI nếu ai đó bảo có.
 *
 * Trúng Số và Chọn Số có HAI lần chạm (mở ván rồi bấm DỪNG), nên giữa hai lần
 * đó tồn tại một cửa sổ thời gian có thể trôi hết. Vòng Quay chỉ có MỘT lần
 * chạm: bấm QUAY xong là kết quả đã được quyết. Không có cửa sổ nào để mà hết.
 *
 * Vì sao phải NÉM chứ không lặng lẽ bỏ qua: cạm bẫy `Math.min/max` ở Chọn Số
 * quy mọi lần hết giờ về ĐÚNG MỘT mốc, khiến mọi người để hết giờ nhận cùng một
 * con số. Ở trò mà con số chính là phần quà thì đó là tai hoạ. Chốt fail-closed
 * này là để cạm bẫy đó không lẻn về qua một lần sao chép code vô ý.
 *
 * `giay` cũng bị bỏ qua hoàn toàn: kết quả là hàm của HẠT GIỐNG, không phải của
 * việc người chơi bấm nhanh hay chậm.
 */
export function chamKetQua({ hatGiong, cung, hetGio }: ThamSoCham): KetQuaCham | null {
  if (hetGio === true) {
    throw new Error(
      "Vòng Quay không có ca hết giờ (Đ2). Nơi gọi đang chép nhầm luật của Trúng Số.",
    );
  }
  if (cung.length === 0) return null;

  // ① Bốc QUÀ theo tỉ lệ đã khai.
  const o = bocO(hatGiong, cung);
  if (o === null) return null;

  // ② Rút góc NGẪU NHIÊN ĐỀU bên trong cung của quà vừa bốc.
  //
  // 🔴 Kẹp dưới mép `den`: `tu + 1 * doRong` bằng đúng `den`, và một góc rơi
  // trúng mép là góc thuộc về cung SAU — tức thẻ kết quả ghi một ô mà kim chỉ
  // sang ô bên cạnh. Sai số dấu phẩy động cũng đẩy tới đúng chỗ đó.
  const trongCung = bocGoc(`${hatGiong}:goc`) / 360;
  const gocDung = Math.min(o.tu + trongCung * o.doRong, o.den - 1e-9);
  return { gocDung, o };
}

/**
 * ① Bốc một ô theo TỈ LỆ TRÚNG đã khai (ADR-012).
 *
 * Ô khai 0 % và ô đã biến khỏi vòng đều không nằm trong danh sách bốc; phần còn
 * lại được chuẩn hoá lại, nên khi một ô hết hàng thì tỉ lệ của nó chia đều theo
 * TRỌNG SỐ cho các ô còn lại chứ không rơi vào hư vô.
 *
 * Trả `null` khi KHÔNG ô nào có tỉ lệ dương — nơi gọi phải nói rõ chuyện đó với
 * người vận hành. Im lặng trả một ô bất kỳ ở đây là phát quà theo một luật
 * không ai khai.
 */
function bocO(hatGiong: string, cung: readonly Cung[]): Cung | null {
  const bocDuoc = cung.filter((c) => c.tiLeTrung > 0);
  if (bocDuoc.length === 0) return null;

  const tong = bocDuoc.reduce((s, c) => s + c.tiLeTrung, 0);
  if (!(tong > 0)) return null;

  const moc = (bocGoc(`${hatGiong}:o`) / 360) * tong;
  let don = 0;
  for (const c of bocDuoc) {
    don += c.tiLeTrung;
    if (moc < don) return c;
  }
  // Chỉ tới đây khi `moc` chạm đúng `tong` do sai số dấu phẩy động.
  return bocDuoc[bocDuoc.length - 1];
}

/**
 * Sinh hạt giống ngẫu nhiên THẬT cho một lượt mới.
 *
 * `crypto.getRandomValues` chứ không phải `Math.random()`: cái sau là bộ sinh
 * giả ngẫu nhiên có thể đoán được nếu biết đủ đầu ra trước đó, và đây là chỗ
 * quyết định ai nhận quà gì.
 */
export function hatGiongMoi(): string {
  const byte = new Uint8Array(16);
  crypto.getRandomValues(byte);
  return Array.from(byte, (b) => b.toString(16).padStart(2, "0")).join("");
}
