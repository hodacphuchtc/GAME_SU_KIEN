# DEM_SO — hướng dẫn cho Claude Code

Web tĩnh thuần (Next.js App Router, `output: "export"`) — **không backend, không CSDL,
không lưu bất cứ thứ gì**. Cấu hình ván chơi nằm trong query string của đường dẫn (mã QR).

## Luật bắt buộc

1. **Không hardcode hằng số nghiệp vụ** — tất cả nằm ở `config/game.ts`.
2. **Không viết thẳng chuỗi tiếng Việt vào component** — thêm vào `config/locale.ts` trước.
3. **Kết quả một lượt luôn tính bằng `resolveRound()` từ mốc `event.timeStamp`**, tuyệt đối
   không lấy con số đang vẽ trên màn hình. Đây là điều kiện để trò chơi trung thực.
4. **Không thêm nơi lưu trữ** (localStorage, cookie, API) khi chưa hỏi — "không lưu gì" là
   quyết định sản phẩm, không phải thiếu sót.
5. Đổi tham số trò chơi thì phải chạy lại `npm test` — bộ test canh đúng phần công bằng
   (mọi số cài đều chỉ gặp ở tốc độ tối đa, số nào cũng có ít nhất một cơ hội).

## Lệnh

`npm run dev` · `npm test` · `npm run lint` · `npm run build`

## Bối cảnh đầy đủ

Phân tích ý tưởng, lập luận vì sao chọn từng con số: xem BRD trong dự án IDEA —
`docs/brd/dem-so-bo-dem-may-man.md`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
