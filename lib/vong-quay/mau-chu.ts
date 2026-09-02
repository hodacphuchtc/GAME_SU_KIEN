/**
 * MÀU CHỮ TRÊN CUNG — suy từ ĐỘ CHÓI của nền, không chọn sẵn một màu.
 *
 * 🔴 Vì sao phải có file này. Bản cũ dùng chữ TRẮNG cho mọi ô. Trắng trên vàng
 * `#FACC15` cho tương phản **1,5:1**, trên mint `#5EEAD4` cũng **1,5:1** — không
 * đọc được ngay ở 1 mét, chứ đừng nói 3–5 mét như màn LCD trước sảnh. Một nửa
 * bảng màu ô sẵn đang bị. Phụ huynh không đọc được tên quà trên chính cái vòng
 * họ đang quay.
 *
 * 🔴 Ngưỡng 0,18 là QUYẾT ĐỊNH CỦA TA, không phải quy định của bộ nhận diện —
 * bộ nhận diện Sata Robo viết cho IN ẤN và không nói gì về tương phản. Chọn 0,18
 * vì nó là điểm duy nhất tách {tím, chì} khỏi {neon, cam, vàng, mint} trong
 * `MAU_O_SAN`, và cả hai bên đều đạt ≥ 4,2:1 sau khi tách.
 */

/** Mực đậm của bộ nhận diện. Dùng làm chữ trên nền SÁNG. */
export const MUC = "#1E1B2E";
const TRANG = "#FFFFFF";

/** Ngưỡng độ chói tương đối để đổi từ chữ trắng sang chữ mực. */
export const NGUONG_CHOI = 0.18;

function tuHex(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const day = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  return [
    parseInt(day.slice(0, 2), 16),
    parseInt(day.slice(2, 4), 16),
    parseInt(day.slice(4, 6), 16),
  ];
}

/** Độ chói tương đối theo WCAG 2.x. */
export function doChoi(hex: string): number {
  const [r, g, b] = tuHex(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Tỉ số tương phản WCAG giữa hai màu. 1 = giống hệt, 21 = đen trên trắng. */
export function tiSoTuongPhan(a: string, b: string): number {
  const x = doChoi(a);
  const y = doChoi(b);
  const [sang, toi] = x > y ? [x, y] : [y, x];
  return (sang + 0.05) / (toi + 0.05);
}

/**
 * Màu chữ đọc được trên nền `hex`.
 *
 * Nền TỐI (độ chói ≤ ngưỡng) → chữ trắng. Nền SÁNG → chữ mực.
 */
export function mauChuTrenNen(hex: string): string {
  return doChoi(hex) <= NGUONG_CHOI ? TRANG : MUC;
}
