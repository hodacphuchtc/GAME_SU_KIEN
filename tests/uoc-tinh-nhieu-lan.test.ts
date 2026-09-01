import { describe, expect, it } from "vitest";

import { DIFFICULTIES, VAN_UOC_TINH_MOI_NGAY } from "@/config/game";
import { duBaoGiaiMoiNgay, estimateWinChance } from "@/lib/bo-dem";

/**
 * TỈ LỆ THEO VÁN (GĐ 12.2).
 *
 * 🔴 Bài test canh đúng một điều: công thức phải là `1 − (1 − p)^N`, không phải
 * `N × p`. Nhân thẳng thì mức Dễ với 5 lần bấm cho ra tỉ lệ vượt 100%, và một
 * bảng nói "trúng 130%" thì nhân viên bỏ luôn cả bảng — mất đúng cái van duy
 * nhất ngăn họ treo giải quá tay.
 */

const VUA = DIFFICULTIES.vua.settings;
const DE = DIFFICULTIES.de.settings;

describe("estimateWinChance với nhiều lần bấm", () => {
  it("N=1 trả đúng giá trị cũ", () => {
    const cu = estimateWinChance(VUA, 211);
    const moi = estimateWinChance(VUA, 211, 1);
    expect(moi.perRound).toBe(cu.perRound);
    expect(moi.perVan).toBe(cu.perRound);
    expect(moi.soLan).toBe(1);
  });

  it("không truyền soLan thì mặc định là 1 — hành vi cũ không đổi", () => {
    const kq = estimateWinChance(VUA, 211);
    expect(kq.perVan).toBe(kq.perRound);
    expect(kq.soLan).toBe(1);
  });

  it("N=3 khớp công thức 1-(1-p)^3 trong sai số 1e-9", () => {
    const kq = estimateWinChance(VUA, 211, 3);
    expect(kq.perVan).toBeCloseTo(1 - (1 - kq.perRound) ** 3, 9);
  });

  it("🔴 KHÔNG phải N × p — chênh lệch giữa hai cách tính phải nhìn thấy được", () => {
    const kq = estimateWinChance(VUA, 211, 3);
    const nhanThang = 3 * kq.perRound;
    expect(kq.perVan).toBeLessThan(nhanThang);
  });

  it("N lớn không vượt quá 1", () => {
    for (const n of [5, 20, 500]) {
      const kq = estimateWinChance(DE, 211, n);
      expect(kq.perVan).toBeLessThanOrEqual(1);
      expect(kq.perVan).toBeGreaterThanOrEqual(kq.perRound);
    }
  });

  it("tỉ lệ ván tăng đơn điệu theo số lần bấm", () => {
    const day = [1, 2, 3, 4, 5].map((n) => estimateWinChance(VUA, 211, n).perVan);
    for (let i = 1; i < day.length; i += 1) expect(day[i]).toBeGreaterThan(day[i - 1]);
  });

  it("soLan phi lý bị kẹp về 1, không đẻ ra con số trông hợp lý mà sai", () => {
    for (const bay of [0, -3, 0.5]) {
      const kq = estimateWinChance(VUA, 211, bay);
      expect(kq.soLan).toBe(1);
      expect(kq.perVan).toBe(kq.perRound);
    }
  });

  it("số cài không bao giờ lướt qua thì bấm bao nhiêu lần cũng vẫn là 0", () => {
    // Mức "thu" chỉ chạy tới ~1440, nên 9999 không bao giờ xuất hiện.
    const kq = estimateWinChance(DIFFICULTIES.thu.settings, 9999, 5);
    expect(kq.passes).toBe(0);
    expect(kq.perRound).toBe(0);
    expect(kq.perVan).toBe(0);
  });
});

describe("dự báo tiền quà", () => {
  it("số giải/ngày = tỉ lệ ván × số ván ước tính", () => {
    const kq = estimateWinChance(VUA, 211, 3);
    expect(duBaoGiaiMoiNgay(kq.perVan, VAN_UOC_TINH_MOI_NGAY)).toBeCloseTo(
      kq.perVan * VAN_UOC_TINH_MOI_NGAY,
      9,
    );
  });

  it("🔴 ba lần bấm dự báo gần gấp ba một lần bấm — đây là tiền thật", () => {
    const mot = estimateWinChance(VUA, 211, 1);
    const ba = estimateWinChance(VUA, 211, 3);
    const tiLe =
      duBaoGiaiMoiNgay(ba.perVan, VAN_UOC_TINH_MOI_NGAY) /
      duBaoGiaiMoiNgay(mot.perVan, VAN_UOC_TINH_MOI_NGAY);
    expect(tiLe).toBeGreaterThan(2.5);
    expect(tiLe).toBeLessThan(3);
  });
});
