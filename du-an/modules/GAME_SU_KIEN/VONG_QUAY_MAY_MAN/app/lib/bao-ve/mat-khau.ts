/*
 * NGUỒN: chép từ `modules/GAME_SU_KIEN/app/lib/bao-ve/mat-khau.ts` @ 3d96358.
 * Chép tay có chủ đích — Vòng Quay là app đứng riêng (ADR-010), cấm import xuyên.
 * Nội dung giữ NGUYÊN: thuật toán băm không có gì khác nhau giữa hai app.
 */
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/**
 * BĂM MẬT KHẨU bằng `scrypt` có sẵn trong Node — không thêm thư viện nào.
 *
 * Vì sao scrypt chứ không phải SHA-256: SHA nhanh, mà nhanh chính là điều tệ
 * nhất cho mật khẩu — kẻ lấy được chuỗi băm sẽ thử hàng tỉ mật khẩu mỗi giây.
 * scrypt cố ý chậm và tốn bộ nhớ, nên mỗi lần thử là một lần trả giá.
 *
 * Định dạng lưu: `scrypt$N$r$p$muối$băm`, tất cả ở hệ 16. Ghi kèm tham số vào
 * chuỗi để sau này tăng N lên thì mật khẩu cũ vẫn kiểm được — không có nó thì
 * đổi tham số nghĩa là toàn bộ tài khoản mất khả năng đăng nhập cùng lúc.
 */

const N = 16384; // ~100ms trên máy văn phòng — đủ chậm cho kẻ tấn công, không phiền người dùng
const r = 8;
const p = 1;
const DAI_KHOA = 32;
const DAI_MUOI = 16;

export function bamMatKhau(matKhau: string): string {
  const muoi = randomBytes(DAI_MUOI);
  const bam = scryptSync(matKhau.normalize("NFC"), muoi, DAI_KHOA, { N, r, p });
  return ["scrypt", N, r, p, muoi.toString("hex"), bam.toString("hex")].join("$");
}

/**
 * So mật khẩu với chuỗi đã lưu.
 *
 * 🔴 Dùng `timingSafeEqual`: so bằng `===` thì thời gian trả lời phụ thuộc vào
 * số ký tự khớp đầu tiên, và đó là một kênh rò rỉ thật — đo đủ nhiều lần là dò
 * ra được từng byte.
 *
 * Trả `false` cho mọi chuỗi hỏng thay vì ném: một biến môi trường gõ sai định
 * dạng không được phép làm sập cả màn đăng nhập.
 */
export function kiemMatKhau(matKhau: string, daLuu: string): boolean {
  const phan = daLuu.split("$");
  if (phan.length !== 6 || phan[0] !== "scrypt") return false;

  const [, nText, rText, pText, muoiHex, bamHex] = phan;
  const nCu = Number.parseInt(nText, 10);
  const rCu = Number.parseInt(rText, 10);
  const pCu = Number.parseInt(pText, 10);
  if (!Number.isFinite(nCu) || !Number.isFinite(rCu) || !Number.isFinite(pCu)) return false;

  try {
    const muoi = Buffer.from(muoiHex, "hex");
    const bamCu = Buffer.from(bamHex, "hex");
    const bamMoi = scryptSync(matKhau.normalize("NFC"), muoi, bamCu.length, {
      N: nCu,
      r: rCu,
      p: pCu,
      // scrypt với N lớn cần nhiều bộ nhớ hơn mức Node cho mặc định.
      maxmem: 256 * 1024 * 1024,
    });
    return bamCu.length > 0 && timingSafeEqual(bamCu, bamMoi);
  } catch {
    return false;
  }
}
