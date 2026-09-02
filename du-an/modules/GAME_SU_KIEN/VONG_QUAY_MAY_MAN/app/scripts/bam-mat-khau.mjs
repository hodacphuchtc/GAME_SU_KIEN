/**
 * Sinh chuỗi băm mật khẩu quản trị và khoá ký phiên cho Vòng Quay May Mắn.
 *
 * Vì sao cần script này: mật khẩu KHÔNG bao giờ được nằm dạng thô trong tệp cấu
 * hình. Ta lưu chuỗi băm scrypt — ai đọc được tệp đó cũng không suy ngược ra
 * mật khẩu, và bản thân người viết script này cũng không.
 *
 *   node scripts/bam-mat-khau.mjs 'mật khẩu bạn chọn'   → chuỗi cho VONG_QUAY_MAT_KHAU_BAM
 *   node scripts/bam-mat-khau.mjs --khoa                → chuỗi cho VONG_QUAY_KHOA_PHIEN
 *
 * 🔴 Script CHỈ in ra màn hình. Nó cố ý KHÔNG tự ghi vào tệp môi trường nào —
 * việc đặt khoá vào đúng chỗ là việc của người, và người phải nhìn thấy mình
 * đang đặt cái gì vào đâu.
 */
import { randomBytes, scryptSync } from "node:crypto";

const N = 16384;
const r = 8;
const p = 1;

function bamMatKhau(matKhau) {
  const muoi = randomBytes(16);
  const bam = scryptSync(matKhau.normalize("NFC"), muoi, 32, { N, r, p });
  return ["scrypt", N, r, p, muoi.toString("hex"), bam.toString("hex")].join("$");
}

const thamSo = process.argv.slice(2);

if (thamSo[0] === "--khoa") {
  // 48 byte → 64 ký tự base64url, vượt xa sàn 32 ký tự mà `khoaBiMat()` đòi.
  console.log("\nVONG_QUAY_KHOA_PHIEN=" + randomBytes(48).toString("base64url") + "\n");
  console.log("Dán dòng trên vào tệp môi trường của app (.env.local), rồi khởi động lại máy chủ.\n");
  process.exit(0);
}

const matKhau = thamSo.join(" ").trim();

if (!matKhau) {
  console.error("\nThiếu mật khẩu.\n");
  console.error("  node scripts/bam-mat-khau.mjs 'mật khẩu bạn chọn'   — sinh chuỗi băm");
  console.error("  node scripts/bam-mat-khau.mjs --khoa                — sinh khoá ký phiên\n");
  process.exit(1);
}

if (matKhau.length < 8) {
  console.error("\nMật khẩu ngắn hơn 8 ký tự. Máy này đặt ở quầy, ai đi ngang cũng thử được.\n");
  process.exit(1);
}

console.log("\nVONG_QUAY_MAT_KHAU_BAM=" + bamMatKhau(matKhau) + "\n");
console.log("Dán dòng trên vào tệp môi trường của app (.env.local), rồi khởi động lại máy chủ.");
console.log("Mật khẩu thô KHÔNG được lưu ở đâu cả — quên là phải sinh lại chuỗi mới.\n");
