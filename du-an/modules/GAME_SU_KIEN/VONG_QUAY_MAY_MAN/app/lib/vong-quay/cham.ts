import { bocGoc } from "./goc";
import { oTaiGoc, type Cung } from "./chia-o";

/**
 * CHẤM KẾT QUẢ một lượt quay: hạt giống → góc → ô.
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

  const gocDung = bocGoc(hatGiong);
  const o = oTaiGoc(cung, gocDung);
  return o === null ? null : { gocDung, o };
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
