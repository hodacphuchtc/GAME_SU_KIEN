/**
 * Nơi DUY NHẤT biết Playwright nằm ở đâu.
 *
 * 🔴 Tách khỏi `chay.mjs` có lý do sống còn: `chay.mjs` chạy cả bộ kịch bản
 * ngay ở tầng cao nhất của module. Kịch bản mà `import` từ nó thì mỗi lần chạy
 * một kịch bản là chạy lại toàn bộ — một vòng lặp không đáy.
 *
 * Playwright nạp từ bộ nhớ đệm `npx` sẵn có, KHÔNG thêm vào `package.json`:
 * ứng dụng có luật tự chứa, và một bộ khung trình duyệt trong phụ thuộc sản
 * phẩm là thứ phải tải về ở mỗi lần cài đặt tại quầy. Máy khác thì đặt biến
 * môi trường `E2E_PLAYWRIGHT`.
 */
export const DUONG_DAN_PLAYWRIGHT =
  process.env.E2E_PLAYWRIGHT ??
  "/Users/macbookairm1/.npm/_npx/705bc6b22212b352/node_modules/playwright/index.mjs";

export const { chromium } = await import(DUONG_DAN_PLAYWRIGHT);
