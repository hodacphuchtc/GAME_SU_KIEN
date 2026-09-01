/**
 * Tách nền linh vật thành TRONG SUỐT — giữ nguyên bản master.
 *
 * Ảnh master từ chủ thương hiệu không có kênh alpha; nền là `#FCFCFC`, và trên nền trắng
 * của ứng dụng nó hiện ra một cái hộp xám nhìn thấy rõ (đã chụp ảnh xác nhận).
 *
 * 🔴 Dùng LOANG TỪ BỐN MÉP, không phải "xoá mọi điểm gần trắng": con robot có những mảng
 * sáng gần trắng ở thân và ở cúp vàng. Xoá theo màu sẽ đục thủng chính con robot. Loang từ
 * mép chỉ ăn phần nền thật sự nối liền ra ngoài.
 *
 * Bản master KHÔNG bị đụng tới — kết quả ghi ra một tệp khác.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { chromium } from "../tests/e2e/playwright.mjs";

const nguon = process.argv[2] ?? "public/thuong-hieu/linh-vat-sata-robo.png";
const dich = process.argv[3] ?? "public/thuong-hieu/linh-vat-sata-robo-nen-trong.png";
const b64 = readFileSync(nguon).toString("base64");

const browser = await chromium.launch({ headless: true });
const p = await browser.newPage();

const ketQua = await p.evaluate(async (data) => {
  const img = new Image();
  img.src = `data:image/png;base64,${data}`;
  await img.decode();

  const c = document.createElement("canvas");
  c.width = img.width;
  c.height = img.height;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);

  const anh = ctx.getImageData(0, 0, c.width, c.height);
  const px = anh.data;
  const W = c.width;
  const H = c.height;

  // Ngưỡng: coi là NỀN nếu cả ba kênh ≥ 244 và ba kênh gần nhau (xám nhạt trung tính).
  const laNen = (i) => {
    const r = px[i], g = px[i + 1], b = px[i + 2];
    if (r < 244 || g < 244 || b < 244) return false;
    return Math.max(r, g, b) - Math.min(r, g, b) <= 6;
  };

  const daXet = new Uint8Array(W * H);
  const hangDoi = [];
  const nap = (x, y) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const k = y * W + x;
    if (daXet[k]) return;
    daXet[k] = 1;
    if (laNen(k * 4)) hangDoi.push(k);
  };

  for (let x = 0; x < W; x += 1) { nap(x, 0); nap(x, H - 1); }
  for (let y = 0; y < H; y += 1) { nap(0, y); nap(W - 1, y); }

  let xoa = 0;
  while (hangDoi.length > 0) {
    const k = hangDoi.pop();
    px[k * 4 + 3] = 0;
    xoa += 1;
    const x = k % W;
    const y = (k / W) | 0;
    nap(x + 1, y); nap(x - 1, y); nap(x, y + 1); nap(x, y - 1);
  }

  ctx.putImageData(anh, 0, 0);
  return { anh: c.toDataURL("image/png"), xoa, tong: W * H };
}, b64);

await browser.close();

const byte = Buffer.from(ketQua.anh.split(",")[1], "base64");
writeFileSync(dich, byte);
console.log(
  `đã tách nền: xoá ${ketQua.xoa}/${ketQua.tong} điểm ` +
    `(${((ketQua.xoa / ketQua.tong) * 100).toFixed(1)}%) → ${dich} (${byte.length} byte)`,
);
