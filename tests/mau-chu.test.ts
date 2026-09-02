import { describe, expect, it } from "vitest";

import { MAU_O_SAN } from "@/config/thuong-hieu";
import { doChoi, mauChuTrenNen, NGUONG_CHOI, tiSoTuongPhan } from "@/lib/vong-quay/mau-chu";

/**
 * 🔴 R5 — CHỮ TRÊN CUNG PHẢI ĐỌC ĐƯỢC.
 *
 * Bản trước dùng chữ trắng cho mọi ô: trên vàng và trên mint chỉ đạt 1,5:1.
 * Bài kiểm này là thứ duy nhất chặn một bảng màu "đẹp" mà một nửa số ô vô hình.
 */

/** Sàn tự đặt: 4,2:1. Trên ngưỡng WCAG AA cho chữ lớn (3:1), dưới AA thường (4,5:1) —
 *  chữ trên cung là chữ LỚN trên màn LCD, nhưng ta muốn dư ra một chút. */
const SAN = 4.2;

describe("màu chữ suy từ độ chói của nền", () => {
  it.each(MAU_O_SAN.map((m) => [m] as const))(
    "màu ô %s được gán màu chữ đạt ≥ 4,2:1",
    (nen) => {
      const chu = mauChuTrenNen(nen);
      expect(tiSoTuongPhan(nen, chu)).toBeGreaterThanOrEqual(SAN);
    },
  );

  it("🔴 chữ TRẮNG trên vàng và trên mint KHÔNG đạt — đây là lỗi đang vá", () => {
    // Giữ lại làm dấu vết: đây chính là con số đã đo được trên bản cũ.
    expect(tiSoTuongPhan("#FACC15", "#FFFFFF")).toBeLessThan(2);
    expect(tiSoTuongPhan("#5EEAD4", "#FFFFFF")).toBeLessThan(2);
    // …và hàm mới KHÔNG chọn màu trắng cho hai nền đó.
    expect(mauChuTrenNen("#FACC15")).not.toBe("#FFFFFF");
    expect(mauChuTrenNen("#5EEAD4")).not.toBe("#FFFFFF");
  });

  it("nền tối vẫn nhận chữ trắng", () => {
    expect(mauChuTrenNen("#6B21A8")).toBe("#FFFFFF");
    expect(mauChuTrenNen("#000000")).toBe("#FFFFFF");
  });

  it("ngưỡng nằm ĐÚNG giữa hai nhóm — không phải một số nhặt đại", () => {
    const toi = MAU_O_SAN.filter((m) => doChoi(m) <= NGUONG_CHOI);
    const sang = MAU_O_SAN.filter((m) => doChoi(m) > NGUONG_CHOI);
    expect(toi.length).toBeGreaterThan(0);
    expect(sang.length).toBeGreaterThan(0);
    // Mọi màu "tối" phải tối hơn mọi màu "sáng" — nếu không thì ngưỡng cắt bừa.
    expect(Math.max(...toi.map(doChoi))).toBeLessThan(Math.min(...sang.map(doChoi)));
  });

  it("🔴 CA ĐỘT BIẾN: đổi ngưỡng thành 0,9 thì phải có màu ĐỎ", () => {
    // Kiểm chính bài kiểm: nếu mọi ngưỡng đều đạt thì bài trên không canh gì cả.
    const gia = (hex: string) => (doChoi(hex) <= 0.9 ? "#FFFFFF" : "#1E1B2E");
    const hong = MAU_O_SAN.filter((m) => tiSoTuongPhan(m, gia(m)) < SAN);
    expect(hong.length).toBeGreaterThan(0);
  });

  it("tỉ số tương phản đối xứng và đúng ở hai đầu", () => {
    expect(tiSoTuongPhan("#000000", "#FFFFFF")).toBeCloseTo(21, 1);
    expect(tiSoTuongPhan("#FFFFFF", "#000000")).toBeCloseTo(21, 1);
    expect(tiSoTuongPhan("#123456", "#123456")).toBeCloseTo(1, 5);
  });
});
