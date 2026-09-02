import { describe, expect, it } from "vitest";

import { GIAY_QUAY, VONG_TOI_THIEU } from "@/config/vong-quay";
import {
  GIAY_TICK_TOI_THIEU,
  giayTaiGoc,
  mocTick,
  type CungTick,
  type MocTick,
} from "@/lib/vong-quay/am-thanh";
import { chiaCung, type OQua } from "@/lib/vong-quay/chia-o";
import { chuanHoaGoc, goc, tongGocQuay } from "@/lib/vong-quay/goc";

/** Góc đích cố ý KHÔNG rơi trúng mép cung nào — ca thường gặp nhất. */
const GOC_DICH = 137.3;

/** Mặt vòng chia đều — dùng cho phép đo nhịp thô, xem chú thích ở chỗ gọi. */
function cungDeu(soO: number): CungTick[] {
  const rong = 360 / soO;
  return Array.from({ length: soO }, (_, i) => ({ tu: i * rong, doRong: rong }));
}

function o(id: number, thuTu: number, soLuong: number | null): OQua {
  return {
    id,
    ten: `O${id}`,
    thuTu,
    soLuong,
    daTrao: 0,
    tranMoiNgay: 0,
    daTraoHomNay: 0,
    mau: "#123456",
  };
}

/** Mặt vòng THẬT: một ô đáy chiếm nửa vòng, bốn ô quà chia phần còn lại. */
function cungThat(): CungTick[] {
  return chiaCung([o(1, 0, null), o(2, 1, 10), o(3, 2, 40), o(4, 3, 25), o(5, 4, 5)]);
}

function khoang(moc: readonly MocTick[]): number[] {
  return moc.slice(1).map((m, i) => m.giay - moc[i].giay);
}

/** Lệch giữa hai góc trên vòng tròn — 359,9999° và 0° chỉ cách nhau một chút. */
function lechVong(a: number, b: number): number {
  const d = Math.abs(chuanHoaGoc(a) - chuanHoaGoc(b));
  return Math.min(d, 360 - d);
}

describe("giayTaiGoc() — nghịch đảo của goc()", () => {
  it("đi rồi về đúng chỗ cũ: goc(giayTaiGoc(A)) === A", () => {
    const tong = tongGocQuay(GOC_DICH);
    for (const A of [0.5, 45, 180, 720, 1200, tong - 1, tong]) {
      const t = giayTaiGoc(A, GOC_DICH, GIAY_QUAY);
      expect(goc(t, GOC_DICH, GIAY_QUAY)).toBeCloseTo(A, 6);
    }
  });

  it("và chiều ngược lại: giayTaiGoc(goc(t)) === t", () => {
    for (let i = 1; i < 50; i++) {
      const t = (i / 50) * GIAY_QUAY;
      expect(giayTaiGoc(goc(t, GOC_DICH, GIAY_QUAY), GOC_DICH, GIAY_QUAY)).toBeCloseTo(
        t,
        9,
      );
    }
  });

  it("kẹp hai đầu, không chia cho 0 và không trả NaN", () => {
    expect(giayTaiGoc(-10, GOC_DICH, GIAY_QUAY)).toBe(0);
    expect(giayTaiGoc(0, GOC_DICH, GIAY_QUAY)).toBe(0);
    expect(giayTaiGoc(999_999, GOC_DICH, GIAY_QUAY)).toBe(GIAY_QUAY);
    expect(giayTaiGoc(100, GOC_DICH, 0)).toBe(0);
    expect(giayTaiGoc(100, GOC_DICH, -3)).toBe(0);
    expect(Number.isNaN(giayTaiGoc(NaN, GOC_DICH, GIAY_QUAY))).toBe(false);
  });
});

describe("mocTick() — mỗi tiếng tách là một lần kim đi qua mép cung", () => {
  it("gọi goc(t) tại từng mốc thì ra ĐÚNG mép cung đã ghi trong mốc đó", () => {
    const cung = cungThat();
    const moc = mocTick(GOC_DICH, GIAY_QUAY, cung);
    expect(moc.length).toBeGreaterThan(10);

    const mepThat = cung.map((c) => c.tu);
    for (const m of moc) {
      // Đây là phép kiểm xương sống của cả hạng mục: nhịp không phải một dãy tự
      // chế chạy song song, nó là nghiệm của chính `goc(t)`.
      const gocThuc = goc(m.giay, GOC_DICH, GIAY_QUAY);
      expect(lechVong(gocThuc, m.mep)).toBeLessThan(1e-6);
      // Và mép đó phải là mép có thật trên mặt vòng, không phải số bịa.
      expect(mepThat.some((b) => lechVong(b, m.mep) < 1e-9)).toBe(true);
    }
  });

  it("mốc nằm trong (0, thoiLuong], tăng dần, tienDo trong [0,1]", () => {
    const moc = mocTick(GOC_DICH, GIAY_QUAY, cungThat());
    let truoc = 0;
    for (const m of moc) {
      expect(m.giay).toBeGreaterThan(0);
      expect(m.giay).toBeLessThanOrEqual(GIAY_QUAY + 1e-12);
      expect(m.giay).toBeGreaterThan(truoc);
      expect(m.tienDo).toBeGreaterThan(0);
      expect(m.tienDo).toBeLessThanOrEqual(1 + 1e-12);
      truoc = m.giay;
    }
  });

  it("đi trọn ngần ấy vòng thì tiếng tách cũng đủ ngần ấy lượt qua mỗi mép", () => {
    const soO = 8;
    const moc = mocTick(GOC_DICH, GIAY_QUAY, cungDeu(soO));
    // Quay VONG_TOI_THIEU vòng trọn + phần lẻ tới góc đích.
    const duKien = Math.floor((tongGocQuay(GOC_DICH) / 360) * soO);
    expect(moc.length).toBe(duKien);
    expect(moc.length).toBeGreaterThanOrEqual(VONG_TOI_THIEU * soO);
  });

  it("cùng tham số thì cho cùng kết quả — dựng lại được y hệt", () => {
    const a = mocTick(GOC_DICH, GIAY_QUAY, cungThat());
    const b = mocTick(GOC_DICH, GIAY_QUAY, cungThat());
    expect(a).toEqual(b);
  });
});

describe("mocTick() — nhịp CHẬM DẦN khớp vòng quay", () => {
  it("vòng chia ĐỀU: khoảng giữa hai tiếng tách tăng đơn điệu, không sót một lần nào", () => {
    // Cung đều nhau thì bề rộng không còn là biến số, nên nhịp thô chính là
    // nghịch đảo vận tốc — nó PHẢI tăng đều tay từ đầu tới cuối.
    const k = khoang(mocTick(GOC_DICH, GIAY_QUAY, cungDeu(8)));
    expect(k.length).toBeGreaterThan(20);
    for (let i = 1; i < k.length; i++) {
      expect(k[i], `khoảng thứ ${i}`).toBeGreaterThan(k[i - 1]);
    }
    // Và chậm dần RÕ RỆT, không phải nhích vài phần nghìn giây: khoảng cuối
    // phải dài gấp nhiều lần khoảng đầu, nếu không thì nghe vẫn như chạy đều.
    expect(k[k.length - 1] / k[0]).toBeGreaterThan(5);
  });

  it("vòng KHÔNG đều: nhịp trên mỗi ĐỘ tăng đơn điệu", () => {
    // 🔴 Mặt vòng thật có cung rộng cung hẹp, nên nhịp THÔ nhấp nhô theo bề
    // rộng cung — đó là sự thật vật lý của một vòng quay có ô to ô nhỏ, không
    // phải lỗi. Phép đo đúng cho ca này là nhịp chia cho bề rộng cung vừa đi
    // qua, tức nghịch đảo vận tốc; đại lượng đó phải tăng đơn điệu.
    const moc = mocTick(GOC_DICH, GIAY_QUAY, cungThat());
    const k = khoang(moc);
    let truoc = 0;
    for (let i = 0; i < k.length; i++) {
      const nhipMoiDo = k[i] / moc[i + 1].doRongVuaQua;
      expect(nhipMoiDo, `mốc thứ ${i + 1}`).toBeGreaterThan(truoc);
      truoc = nhipMoiDo;
    }
    // Chứng minh luôn rằng nhịp thô ở đây KHÔNG đơn điệu — để ai đó sau này
    // đừng siết phép kiểm ở trên thành "khoảng thô phải tăng" rồi đỏ oan.
    expect(k.some((x, i) => i > 0 && x < k[i - 1])).toBe(true);
  });

  it("mỗi vòng quay sau tốn nhiều thời gian hơn vòng trước", () => {
    const moc = mocTick(GOC_DICH, GIAY_QUAY, cungThat());
    // Thời điểm kim đi qua đúng mốc 360°, 720°, ... của cú quay.
    const tronVong: number[] = [];
    for (let v = 1; v * 360 <= tongGocQuay(GOC_DICH); v++) {
      tronVong.push(giayTaiGoc(v * 360, GOC_DICH, GIAY_QUAY));
    }
    expect(tronVong.length).toBeGreaterThanOrEqual(VONG_TOI_THIEU);
    // Mép 0 có thật trên mặt vòng, nên mỗi lần tròn vòng PHẢI là một tiếng tách.
    for (const t of tronVong) {
      if (t < moc[0].giay) continue;
      expect(moc.some((m) => Math.abs(m.giay - t) < 1e-9)).toBe(true);
    }
    let truoc = 0;
    let daiTruoc = 0;
    for (const t of tronVong) {
      const dai = t - truoc;
      expect(dai).toBeGreaterThan(daiTruoc);
      daiTruoc = dai;
      truoc = t;
    }
  });

  it("không khoảng nào ngắn hơn ngưỡng tai nghe được — kể cả khoảng im đầu tiên", () => {
    for (const cung of [cungDeu(2), cungDeu(8), cungDeu(12), cungThat()]) {
      const moc = mocTick(GOC_DICH, GIAY_QUAY, cung);
      if (moc.length === 0) continue;
      expect(moc[0].giay).toBeGreaterThanOrEqual(GIAY_TICK_TOI_THIEU - 1e-12);
      for (const x of khoang(moc)) {
        expect(x).toBeGreaterThanOrEqual(GIAY_TICK_TOI_THIEU - 1e-12);
      }
      // Hệ quả: số tiếng luôn bị chặn trên, không có ca xếp lịch hàng nghìn nút.
      expect(moc.length).toBeLessThanOrEqual(GIAY_QUAY / GIAY_TICK_TOI_THIEU);
    }
  });
});

describe("mocTick() — ca biên: không ném lỗi, không lặp vô hạn", () => {
  it("vòng chỉ có 2 ô vẫn kêu, và vẫn chậm dần", () => {
    const moc = mocTick(GOC_DICH, GIAY_QUAY, cungDeu(2));
    expect(moc.length).toBeGreaterThanOrEqual(VONG_TOI_THIEU * 2);
    const k = khoang(moc);
    for (let i = 1; i < k.length; i++) expect(k[i]).toBeGreaterThan(k[i - 1]);
  });

  it("vòng chỉ có 1 cung: mỗi vòng một tiếng, không chia cho 0", () => {
    const moc = mocTick(GOC_DICH, GIAY_QUAY, [{ tu: 0, doRong: 360 }]);
    expect(moc.length).toBe(VONG_TOI_THIEU);
    for (const m of moc) expect(m.doRongVuaQua).toBe(360);
  });

  it("thoiLuong = 0, âm, hoặc NaN ⇒ mảng rỗng", () => {
    expect(mocTick(GOC_DICH, 0, cungThat())).toEqual([]);
    expect(mocTick(GOC_DICH, -5, cungThat())).toEqual([]);
    expect(mocTick(GOC_DICH, NaN, cungThat())).toEqual([]);
  });

  it("danh sách cung rỗng ⇒ mảng rỗng", () => {
    expect(mocTick(GOC_DICH, GIAY_QUAY, [])).toEqual([]);
  });

  it("gocDich lạ (âm, NaN, mấy nghìn độ) không làm hỏng nhịp", () => {
    expect(mocTick(-90, GIAY_QUAY, cungDeu(8)).length).toBeGreaterThan(0);
    expect(mocTick(5000, GIAY_QUAY, cungDeu(8)).length).toBeGreaterThan(0);
    expect(mocTick(NaN, GIAY_QUAY, cungDeu(8))).toEqual([]);
  });

  it("cung bề rộng 0 và mép trùng nhau: gộp lại, không đẻ hai tiếng cùng một mốc", () => {
    const moc = mocTick(GOC_DICH, GIAY_QUAY, [
      { tu: 0, doRong: 0 },
      { tu: 0, doRong: 0 },
      { tu: 180, doRong: 180 },
    ]);
    const mocGiay = moc.map((m) => m.giay);
    expect(new Set(mocGiay).size).toBe(mocGiay.length);
  });

  it("mép sát 360 không đẻ thêm một tiếng dính vào mép 0 của vòng kế", () => {
    const moc = mocTick(GOC_DICH, GIAY_QUAY, [
      { tu: 0, doRong: 180 },
      { tu: 180, doRong: 180 },
      { tu: 360, doRong: 0 },
    ]);
    const k = khoang(moc);
    for (const x of k) expect(x).toBeGreaterThan(GIAY_TICK_TOI_THIEU);
  });

  it("thoiLuong siêu ngắn: mọi khoảng đều dưới ngưỡng ⇒ im hẳn, không treo", () => {
    const bd = Date.now();
    expect(mocTick(GOC_DICH, 0.005, cungDeu(8))).toEqual([]);
    expect(Date.now() - bd).toBeLessThan(1000);
  });

  it("danh sách cung dị dạng (2.000 phần tử) vẫn trả về trong chớp mắt", () => {
    const bd = Date.now();
    const moc = mocTick(GOC_DICH, GIAY_QUAY, cungDeu(2000));
    expect(Date.now() - bd).toBeLessThan(1000);
    expect(moc.length).toBeLessThanOrEqual(GIAY_QUAY / GIAY_TICK_TOI_THIEU);
  });
});

describe("lib/am-thanh không đụng trình duyệt ở tầng module", () => {
  it("nạp được trong môi trường node — không có window, không có AudioContext", async () => {
    expect(typeof window).toBe("undefined");
    expect(typeof AudioContext).toBe("undefined");
    const mo = await import("@/lib/vong-quay/am-thanh");
    // Tạo máy phát cũng KHÔNG được chạm AudioContext — chỉ `moKhoa()` mới chạm,
    // và nó phải được gọi trong đúng cú bấm của người dùng.
    const may = mo.taoMayAmThanh();
    expect(may.daSanSang()).toBe(false);
    expect(may.dangTatTieng()).toBe(false);
    may.datTatTieng(true);
    expect(may.dangTatTieng()).toBe(true);
    // Không có trình duyệt thì mọi thứ phải im lặng chịu đựng, không ném lỗi.
    expect(() => may.moKhoa()).not.toThrow();
    expect(() => may.anMung()).not.toThrow();
    expect(() => may.huyLich()).not.toThrow();
    expect(() => may.dong()).not.toThrow();
    // Vẫn trả nhịp cho giao diện dùng dù đang tắt tiếng.
    expect(
      may.datLichQuay(GOC_DICH, GIAY_QUAY, cungThat()).length,
    ).toBeGreaterThan(0);
  });
});
