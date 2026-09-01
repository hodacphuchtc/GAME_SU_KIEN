import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { csdl } from "@/lib/db/ket-noi";
import {
  coSoDangBat,
  danhSachCoSo,
  datTrangThaiCoSo,
  maCoSoKeTiep,
  suaCoSo,
  taoCoSo,
  trungTen,
} from "@/lib/co-so/kho";
import { nhanCoSo } from "@/lib/co-so/nhan";
import { dungCsdlTam } from "./ho-tro/csdl-tam";

/**
 * Cơ sở là danh mục DÙNG CHUNG cho mọi game — sai ở đây thì sai lan sang thống
 * kê lead, kho quà và file Excel, nên nó được canh kỹ hơn một bảng thường.
 */

let don: () => void;

beforeEach(() => {
  don = dungCsdlTam();
  csdl(); // mở kết nối để lược đồ chạy
});

afterEach(() => don());

describe("sinh mã cơ sở", () => {
  it("sinh CS1 rồi CS2 rồi CS3", () => {
    expect(taoCoSo({ ten: "Cơ sở Hải Châu" }).ma).toBe("CS1");
    expect(taoCoSo({ ten: "Cơ sở Thanh Khê" }).ma).toBe("CS2");
    expect(taoCoSo({ ten: "Cơ sở Sơn Trà" }).ma).toBe("CS3");
  });

  // 🔴 Bẫy kinh điển: max() trên CHUỖI cho "CS9" > "CS10", nên cơ sở thứ mười
  // một lại nhận mã CS10 lần thứ hai và UNIQUE(ma) ném exception vào mặt người
  // đang nhập liệu.
  it("CS10 sinh sau CS9, không sắp chuỗi thành CS1/CS10/CS2", () => {
    for (let i = 1; i <= 9; i += 1) taoCoSo({ ten: `Cơ sở số ${i}` });
    expect(taoCoSo({ ten: "Cơ sở số 10" }).ma).toBe("CS10");
    expect(taoCoSo({ ten: "Cơ sở số 11" }).ma).toBe("CS11");
    expect(danhSachCoSo().map((c) => c.ma).slice(0, 3)).toEqual(["CS1", "CS2", "CS3"]);
    expect(danhSachCoSo().at(-1)!.ma).toBe("CS11");
  });

  it("xoá cơ sở giữa chừng vẫn không sinh mã trùng", () => {
    taoCoSo({ ten: "Một" });
    const hai = taoCoSo({ ten: "Hai" });
    taoCoSo({ ten: "Ba" });
    csdl().prepare("delete from co_so where id = ?").run(hai.id);
    // Đếm dòng thì ra CS3 (đã có người dùng); phải là CS4.
    expect(maCoSoKeTiep()).toBe("CS4");
    expect(taoCoSo({ ten: "Bốn" }).ma).toBe("CS4");
  });
});

describe("chặn trùng tên", () => {
  it("chặn trùng tên bất kể hoa thường và khoảng trắng thừa", () => {
    taoCoSo({ ten: "Trung tâm Sata Robo Hải Châu" });
    expect(trungTen("Trung tâm Sata Robo Hải Châu")).toBe(true);
    expect(trungTen("  TRUNG TÂM   SATA ROBO   HẢI CHÂU  ")).toBe(true);
    expect(trungTen("trung tâm sata robo hải châu")).toBe(true);
    expect(trungTen("Trung tâm Sata Robo Thanh Khê")).toBe(false);
  });

  it("bỏ qua chính nó khi sửa — đổi địa chỉ mà giữ nguyên tên không bị chặn", () => {
    const cs = taoCoSo({ ten: "Cơ sở A" });
    expect(trungTen("Cơ sở A", cs.id)).toBe(false);
    expect(suaCoSo(cs.id, { ten: "Cơ sở A", diaChi: "114 Hoàng Diệu, Đà Nẵng" })).toBe(true);
    expect(danhSachCoSo()[0].diaChi).toBe("114 Hoàng Diệu, Đà Nẵng");
  });

  it("hai cách gõ Unicode của cùng một chữ vẫn tính là trùng", () => {
    taoCoSo({ ten: "Cơ sở Đà Nẵng".normalize("NFC") });
    expect(trungTen("Cơ sở Đà Nẵng".normalize("NFD"))).toBe(true);
  });
});

describe("bật tắt", () => {
  it("bật tắt đổi trạng thái và cơ sở tắt rơi khỏi danh sách được chọn", () => {
    const cs = taoCoSo({ ten: "Cơ sở A" });
    taoCoSo({ ten: "Cơ sở B" });
    expect(coSoDangBat()).toHaveLength(2);

    expect(datTrangThaiCoSo(cs.id, "tat")).toBe(true);
    expect(coSoDangBat().map((c) => c.ma)).toEqual(["CS2"]);
    // Vẫn còn trong danh sách quản trị — tắt không phải xoá.
    expect(danhSachCoSo()).toHaveLength(2);

    expect(datTrangThaiCoSo(cs.id, "bat")).toBe(true);
    expect(coSoDangBat()).toHaveLength(2);
  });

  it("đặt trạng thái lạ thì từ chối, không ghi bừa vào cột", () => {
    const cs = taoCoSo({ ten: "Cơ sở A" });
    // @ts-expect-error — cố tình truyền sai để canh đúng cái van này
    expect(datTrangThaiCoSo(cs.id, "nghi_le")).toBe(false);
    expect(danhSachCoSo()[0].trangThai).toBe("bat");
  });
});

describe("nhãn hiển thị", () => {
  it("nhanCoSo rơi về tên khi chưa có địa chỉ", () => {
    const cs = taoCoSo({ ten: "Trung tâm Sata Robo Hải Châu" });
    expect(nhanCoSo(cs)).toBe("CS1 — Trung tâm Sata Robo Hải Châu");

    suaCoSo(cs.id, { ten: cs.ten, diaChi: "114 Hoàng Diệu, Đà Nẵng" });
    expect(nhanCoSo(danhSachCoSo()[0])).toBe("CS1 — 114 Hoàng Diệu, Đà Nẵng");
  });

  it("địa chỉ toàn khoảng trắng cũng tính là chưa có", () => {
    const cs = taoCoSo({ ten: "Cơ sở A", diaChi: "   " });
    expect(cs.diaChi).toBeNull();
    expect(nhanCoSo(cs)).toBe("CS1 — Cơ sở A");
  });
});
