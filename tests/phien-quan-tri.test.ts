import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { bamMatKhau, kiemMatKhau } from "@/lib/bao-ve/mat-khau";
import {
  daCoKhoaPhien,
  docPhien,
  HAN_PHIEN_GIAY,
  kyPhien,
} from "@/lib/bao-ve/phien-quan-tri";
import {
  coTaiKhoanNao,
  datMatKhau,
  datTrangThaiNhanVien,
  kiemDangNhap,
  themNhanVien,
  thuHoiDangNhap,
} from "@/lib/nhan-vien/kho";
import { coSoThu } from "./ho-tro/co-so-thu";
import { dungCsdlTam } from "./ho-tro/csdl-tam";

/**
 * KHOÁ CỬA TRANG QUẢN TRỊ (GĐ 15.1).
 *
 * Vì sao đáng canh kỹ: mã QR dán tại quầy in thẳng địa chỉ máy chủ vào tay từng
 * phụ huynh. Xoá đuôi URL, gõ `/quan-tri` là vào — họ không phải dò gì cả, ta
 * vừa đưa địa chỉ cho họ.
 */

const KHOA_THU = "khoa-thu-cho-bai-test-dai-hon-32-ky-tu-nhe";

function phienThu(han = Date.now() + 60_000) {
  return { id: 1, ten: "Sếp", vaiTro: "quan_tri", coSoId: null, han };
}

describe("cookie phiên ký bằng Web Crypto", () => {
  beforeEach(() => {
    process.env.GAME_SU_KIEN_KHOA_PHIEN = KHOA_THU;
  });
  afterEach(() => {
    delete process.env.GAME_SU_KIEN_KHOA_PHIEN;
  });

  it("cookie ký đúng thì hợp lệ", async () => {
    const cookie = (await kyPhien(phienThu()))!;
    const doc = await docPhien(cookie);
    expect(doc?.ten).toBe("Sếp");
    expect(doc?.vaiTro).toBe("quan_tri");
  });

  it("🔴 sửa một ký tự thì không hợp lệ", async () => {
    const cookie = (await kyPhien(phienThu()))!;
    // Đổi đúng một ký tự trong THÂN — nơi chứa vai trò và cơ sở.
    const hong = cookie.replace(/^./, (c) => (c === "a" ? "b" : "a"));
    expect(await docPhien(hong)).toBeNull();
  });

  it("🔴 đổi chữ ký sang chữ ký của khoá khác thì không hợp lệ", async () => {
    const cookie = (await kyPhien(phienThu()))!;
    process.env.GAME_SU_KIEN_KHOA_PHIEN = "mot-khoa-hoan-toan-khac-cung-dai-32-ky-tu";
    expect(await docPhien(cookie)).toBeNull();
  });

  it("quá hạn thì không hợp lệ", async () => {
    const cookie = (await kyPhien(phienThu(Date.now() - 1)))!;
    expect(await docPhien(cookie)).toBeNull();
  });

  it("hạn phiên đúng một ca làm (12 giờ)", () => {
    expect(HAN_PHIEN_GIAY).toBe(12 * 60 * 60);
  });

  it("cookie rỗng hoặc rác thì không hợp lệ, không ném", async () => {
    for (const rac of [undefined, "", "khong-co-dau-cham", "a.b", "...."]) {
      expect(await docPhien(rac)).toBeNull();
    }
  });

  it("🔴 CHƯA đặt khoá thì TỪ CHỐI mọi phiên, không rơi về khoá mặc định", async () => {
    const cookie = (await kyPhien(phienThu()))!;
    delete process.env.GAME_SU_KIEN_KHOA_PHIEN;
    expect(daCoKhoaPhien()).toBe(false);
    expect(await kyPhien(phienThu())).toBeNull();
    expect(await docPhien(cookie)).toBeNull();
  });

  it("khoá ngắn hơn 32 ký tự bị coi như chưa đặt", () => {
    process.env.GAME_SU_KIEN_KHOA_PHIEN = "ngan-qua";
    expect(daCoKhoaPhien()).toBe(false);
  });
});

describe("băm mật khẩu bằng scrypt", () => {
  it("scrypt băm rồi kiểm lại đúng", () => {
    const bam = bamMatKhau("mat-khau-that-dai");
    expect(bam.startsWith("scrypt$")).toBe(true);
    expect(kiemMatKhau("mat-khau-that-dai", bam)).toBe(true);
    expect(kiemMatKhau("mat-khau-khac", bam)).toBe(false);
  });

  it("hai lần băm cùng một mật khẩu cho hai chuỗi khác nhau (có muối)", () => {
    expect(bamMatKhau("abc12345")).not.toBe(bamMatKhau("abc12345"));
  });

  it("chuỗi lưu hỏng thì trả false, không ném", () => {
    for (const rac of ["", "khong-phai-scrypt", "scrypt$a$b$c$d$e", "scrypt$1$2$3"]) {
      expect(kiemMatKhau("abc12345", rac)).toBe(false);
    }
  });

  it("dấu tiếng Việt gõ hai kiểu Unicode vẫn vào được", () => {
    const bam = bamMatKhau("mậtkhẩu123".normalize("NFC"));
    expect(kiemMatKhau("mậtkhẩu123".normalize("NFD"), bam)).toBe(true);
  });
});

describe("đăng nhập trên tài khoản thật", () => {
  let don: () => void;

  beforeEach(() => {
    don = dungCsdlTam();
  });
  afterEach(() => don());

  function taoSep() {
    const id = themNhanVien({
      hoTen: "Nguyễn Văn Sếp",
      coSoId: null,
      vaiTro: "quan_tri",
      tenDangNhap: "sep",
    });
    datMatKhau(id, "matkhau12345");
    return id;
  }

  it("chưa có tài khoản nào thì coTaiKhoanNao() = false", () => {
    expect(coTaiKhoanNao()).toBe(false);
    themNhanVien({ hoTen: "Chỉ là sale", coSoId: coSoThu(), vaiTro: "sale" });
    // Có tên trong danh sách nhưng CHƯA được cấp quyền vào hệ thống.
    expect(coTaiKhoanNao()).toBe(false);
  });

  it("mật khẩu đúng thì vào được, sai thì không cấp gì", () => {
    taoSep();
    expect(coTaiKhoanNao()).toBe(true);
    expect(kiemDangNhap("sep", "matkhau12345")?.hoTen).toBe("Nguyễn Văn Sếp");
    expect(kiemDangNhap("sep", "sai-mat-khau")).toBeNull();
    expect(kiemDangNhap("khong-co-nguoi-nay", "matkhau12345")).toBeNull();
  });

  it("🔴 người ĐÃ NGHỈ không đăng nhập được nữa", () => {
    const id = taoSep();
    datTrangThaiNhanVien(id, "da_nghi");
    expect(kiemDangNhap("sep", "matkhau12345")).toBeNull();
  });

  it("🔴 thu hồi đăng nhập thì KHÔNG vào được nhưng VẪN còn tên trong danh sách", () => {
    const id = taoSep();
    thuHoiDangNhap(id);
    expect(kiemDangNhap("sep", "matkhau12345")).toBeNull();
    expect(coTaiKhoanNao()).toBe(false);
    // Tên vẫn còn để gán khách — đó là cả lý do dùng chung MỘT bảng.
    expect(themNhanVien).toBeTruthy();
  });

  it("mật khẩu ngắn hơn 8 ký tự bị từ chối ngay khi đặt", () => {
    const id = themNhanVien({ hoTen: "Ai đó", coSoId: null, vaiTro: "sale", tenDangNhap: "aido" });
    expect(datMatKhau(id, "ngan")).toBe(false);
    expect(kiemDangNhap("aido", "ngan")).toBeNull();
  });
});
