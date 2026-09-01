import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { kiemThietLap } from "@/lib/chuong-trinh/kiem-hop-le";
import {
  suaChuongTrinh,
  taoChuongTrinh,
  timTheoMaCongKhai,
} from "@/lib/chuong-trinh/kho";
import { taoCoSo } from "@/lib/co-so/kho";
import { SO_LAN_CHOI } from "@/config/to-chuc";
import { dungCsdlTam } from "./ho-tro/csdl-tam";

/**
 * SỬA THIẾT LẬP CHƯƠNG TRÌNH (GĐ 24.1).
 *
 * 🔴 Ranh giới của tính năng này: sửa đổi **cấu hình từ lúc lưu trở đi**, và
 * KHÔNG chạm vào ván đã chơi. Các ván cũ được chấm theo số cũ — sửa lại chúng
 * là phá sổ đối soát giải thưởng, thứ bảo vệ trung tâm khi có khiếu nại.
 *
 * Ba thứ tuyệt đối không đổi: `ma` (mã QR đã in ra giấy), `co_so_id` và
 * `che_do` — đổi chúng là một chương trình khác, không phải bản sửa.
 */

let don: () => void;
let coSo: number;

function ctThu() {
  return taoChuongTrinh({
    tenTrungTam: "Cơ sở Hải Châu",
    soTrung: 114,
    mucDo: "vua",
    tenGiaiThuong: "Voucher 200.000đ",
    tranGiaiMoiNgay: 5,
    coSoId: coSo,
    soLanChoi: 1,
  });
}

beforeEach(() => {
  don = dungCsdlTam();
  coSo = taoCoSo({ ten: "Cơ sở Hải Châu" }).id;
});

afterEach(() => don());

describe("sửa được những gì", () => {
  it("đổi số trúng, phần thưởng, trần giải, độ khó, số lần bấm", () => {
    const ct = ctThu();
    expect(
      suaChuongTrinh(ct.id, {
        soTrung: 250,
        mucDo: "kho",
        tenGiaiThuong: "Balo STEM",
        tranGiaiMoiNgay: 3,
        soLanChoi: 3,
      }),
    ).toBe(true);

    const sau = timTheoMaCongKhai(ct.ma)!;
    expect(sau.soTrung).toBe(250);
    expect(sau.mucDo).toBe("kho");
    expect(sau.tenGiaiThuong).toBe("Balo STEM");
    expect(sau.tranGiaiMoiNgay).toBe(3);
    expect(sau.soLanChoi).toBe(3);
  });

  it("🔴 mã QR đã in KHÔNG đổi — tờ giấy dán ở quầy phải còn dùng được", () => {
    const ct = ctThu();
    suaChuongTrinh(ct.id, {
      soTrung: 250,
      mucDo: "vua",
      tenGiaiThuong: "Balo STEM",
      tranGiaiMoiNgay: 0,
      soLanChoi: 1,
    });
    expect(timTheoMaCongKhai(ct.ma)?.ma).toBe(ct.ma);
  });

  it("🔴 cơ sở và chế độ chơi KHÔNG đổi — đổi chúng là một chương trình khác", () => {
    const ct = ctThu();
    suaChuongTrinh(ct.id, {
      soTrung: 250,
      mucDo: "vua",
      tenGiaiThuong: "Balo STEM",
      tranGiaiMoiNgay: 0,
      soLanChoi: 1,
    });
    const sau = timTheoMaCongKhai(ct.ma)!;
    expect(sau.coSoId).toBe(coSo);
    expect(sau.cheDo).toBe(ct.cheDo);
  });

  it("đổi độ khó thì tham số vòng chạy đổi theo — không giữ lại bộ cũ", () => {
    const ct = ctThu();
    const thamSoCu = JSON.stringify(ct.thamSo);
    suaChuongTrinh(ct.id, {
      soTrung: 114,
      mucDo: "kho",
      tenGiaiThuong: "Voucher 200.000đ",
      tranGiaiMoiNgay: 5,
      soLanChoi: 1,
    });
    expect(JSON.stringify(timTheoMaCongKhai(ct.ma)!.thamSo)).not.toBe(thamSoCu);
  });

  it("sửa id không tồn tại trả false, không ném", () => {
    expect(
      suaChuongTrinh(99999, {
        soTrung: 1,
        mucDo: "vua",
        tenGiaiThuong: "X",
        tranGiaiMoiNgay: 0,
        soLanChoi: 1,
      }),
    ).toBe(false);
  });
});

describe("bộ kiểm hợp lệ — MỘT luật cho cả tạo lẫn sửa", () => {
  const hopLe = {
    soTrung: 250,
    mucDo: "vua" as const,
    tenGiaiThuong: "Balo STEM",
    tranGiaiMoiNgay: 3,
    soLanChoi: 2,
  };

  it("bộ hợp lệ thì không có lỗi", () => {
    expect(kiemThietLap(hopLe)).toBeNull();
  });

  it("số 5 chữ số bị chặn", () => {
    expect(kiemThietLap({ ...hopLe, soTrung: 12345 })).not.toBeNull();
  });

  it("số âm bị chặn", () => {
    expect(kiemThietLap({ ...hopLe, soTrung: -1 })).not.toBeNull();
  });

  it("tên phần thưởng để trống bị chặn", () => {
    expect(kiemThietLap({ ...hopLe, tenGiaiThuong: "   " })).not.toBeNull();
  });

  it("trần giải âm bị chặn, nhưng 0 thì hợp lệ (= không giới hạn)", () => {
    expect(kiemThietLap({ ...hopLe, tranGiaiMoiNgay: -1 })).not.toBeNull();
    expect(kiemThietLap({ ...hopLe, tranGiaiMoiNgay: 0 })).toBeNull();
  });

  it("số lần bấm ngoài khoảng cho phép bị chặn", () => {
    expect(kiemThietLap({ ...hopLe, soLanChoi: SO_LAN_CHOI.toiThieu - 1 })).not.toBeNull();
    expect(kiemThietLap({ ...hopLe, soLanChoi: SO_LAN_CHOI.toiDa + 1 })).not.toBeNull();
    expect(kiemThietLap({ ...hopLe, soLanChoi: SO_LAN_CHOI.toiDa })).toBeNull();
  });

  it("độ khó không tồn tại bị chặn", () => {
    // @ts-expect-error cố tình truyền mức không có trong DIFFICULTIES
    expect(kiemThietLap({ ...hopLe, mucDo: "sieu-kho" })).not.toBeNull();
  });
});
