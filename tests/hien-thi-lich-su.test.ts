import { describe, expect, it } from "vitest";

import { nhanDongY, nhanNguoiChoi, nhanSdt } from "@/lib/luot/hien-thi";

/**
 * Cách vẽ một dòng lịch sử ván chơi (GĐ 21.2).
 *
 * 🔴 Điều bài test này giữ: nhân viên phải đọc được **tên đầy đủ** của khách
 * chính mình. Bản trước rút gọn thành "Dương t." bằng một hàm cục bộ nằm trong
 * `page.tsx` mà không ai test — thứ chặn người ngoài phải là phân quyền ở tầng
 * SQL (GĐ 21.1), không phải cắt bớt chữ trước mặt người có quyền.
 */

describe("tên người chơi", () => {
  it("hiện ĐẦY ĐỦ, không rút gọn", () => {
    expect(nhanNguoiChoi("Dương Thị Hoa")).toBe("Dương Thị Hoa");
    expect(nhanNguoiChoi("Nguyễn Văn A")).toBe("Nguyễn Văn A");
  });

  it("ván ẩn danh hiện gạch ngang, không vỡ", () => {
    // Nhân viên bấm thử thẳng trên màn hình lớn thì không có hồ sơ nào cả.
    expect(nhanNguoiChoi(null)).toBe("—");
    expect(nhanNguoiChoi("")).toBe("—");
    expect(nhanNguoiChoi("   ")).toBe("—");
  });

  it("cắt khoảng trắng thừa hai đầu", () => {
    expect(nhanNguoiChoi("  Trần Bình  ")).toBe("Trần Bình");
  });
});

describe("số điện thoại", () => {
  it("mặc định CHE — giữ 2 số đầu và 3 số cuối", () => {
    expect(nhanSdt("0912345678", false)).toBe("09*****678");
  });

  it("bấm hiện đầy đủ thì ra trọn số", () => {
    expect(nhanSdt("0912345678", true)).toBe("0912345678");
  });

  it("không có số thì gạch ngang ở cả hai chế độ", () => {
    expect(nhanSdt(null, false)).toBe("—");
    expect(nhanSdt(null, true)).toBe("—");
    expect(nhanSdt("", true)).toBe("—");
  });

  it("số đã che KHÔNG còn đọc được đầu số nhà mạng", () => {
    // Đầu số di động Việt Nam dài 3 chữ số. Giữ 2 thì người liếc qua vai chỉ
    // biết "đây là số di động", chưa đủ để đoán ra nhà mạng.
    const che = nhanSdt("0987654321", false);
    expect(che.startsWith("09")).toBe(true);
    expect(che).not.toContain("098");
  });
});

describe("cột đồng ý tư vấn", () => {
  it("ba trạng thái, không phải hai", () => {
    expect(nhanDongY("Dương Thị Hoa", true)).toBe("co");
    expect(nhanDongY("Dương Thị Hoa", false)).toBe("khong");
    // Ván ẩn danh chưa từng để lại số — khác hẳn với "đã hỏi và họ từ chối".
    expect(nhanDongY(null, false)).toBe("trong");
  });
});
