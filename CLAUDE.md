# DEM_SO — hướng dẫn cho Claude Code

Ứng dụng **TỰ CHỨA MỌI THỨ**: giao diện, máy chủ Node, cơ sở dữ liệu SQLite và kênh đồng bộ
thời gian thực nằm chung một repo. `git clone` + `npm install` + `npm start` là chạy được,
**không phụ thuộc dịch vụ ngoài nào** (không Supabase, không Vercel, không Redis).

Đứng RIÊNG, không dính gì tới hệ quản trị MASTER SATA ROBO. Từ bộ nhận diện SataRobo chỉ
**chép giá trị màu và font** vào `config/thuong-hieu.ts`, không import dòng code nào.

## Trò chơi hoạt động thế nào

Màn hình LCD ở lễ tân là **nơi DUY NHẤT hiện dãy số**. Điện thoại phụ huynh chỉ là **nút
bấm có đóng dấu thời gian**. Một màn hình thì không có hai màn hình để mà lệch nhau, và cả
sảnh cùng nhìn về một chỗ.

## Luật bắt buộc

1. **Không hardcode hằng số nghiệp vụ** — đọc từ `config/game.ts`.
2. **Không hardcode màu/font** — đọc từ `config/thuong-hieu.ts` (và `app/globals.css` phải
   khớp với nó).
3. **Không viết thẳng chuỗi tiếng Việt vào component** — thêm vào `config/locale.ts` trước.
4. 🔴 **Máy nào bấm thì máy đó ĐO.** Nó gửi lên số mili-giây đã trôi kể từ lúc bảng số bắt
   đầu chạy. Nếu để máy chủ tính từ lúc NHẬN được lệnh thì độ trễ mạng bị cộng vào: phụ
   huynh thấy 0211, bấm, máy trả 0219 — nhìn y như ăn gian.
5. 🔴 **SQLite làm trọng tài "ai bấm trước".** `UPDATE ... WHERE ket_thuc_luc IS NULL` chỉ
   đổi được một lần; máy bấm sau nhận 0 dòng và **im lặng bỏ qua**, không báo lỗi.
6. **Dữ liệu phụ huynh là dữ liệu cá nhân.** Có ô đồng ý tách riêng, bảng công khai chỉ
   hiện tên rút gọn, không export hàng loạt ra ngoài mục đích đối soát.
7. Đổi tham số trò chơi thì chạy lại `npm test` — bộ test canh phần công bằng (mọi số cài
   đều chỉ gặp ở tốc độ tối đa, số nào cũng có ít nhất một cơ hội).

## Cạm bẫy đã trả giá

- **Đừng bật `trailingSlash`** — nó khiến `/api/gio` bị chuyển hướng 308, thêm một lượt
  đi–về vào đúng phép đo độ lệch đồng hồ, làm hỏng chính thứ nó đang đo.
- **Trạm phát và kết nối CSDL phải giữ ở `globalThis`** — `next dev` nạp lại module mỗi lần
  sửa code, để ở biến module thì mất sạch người đang nghe / mở thêm kết nối bỏ rơi.
- **`instrumentation.ts` không tự chạy trong dev của Next 16** — CSDL mở lười ở lần dùng đầu.

## Lệnh

`npm run dev` (chỉ máy này) · `npm run dev:dienthoai` (mở cho cả mạng LAN) · `npm test` ·
`npm run lint` · `npm run build` · `node scripts/tao-thu.mjs 0211 vua` (tạo nhanh một
chương trình để thử tay).

## Bối cảnh đầy đủ

Phân tích ý tưởng và lập luận cho từng con số: `docs/brd/dem-so-bo-dem-may-man.md` trong dự
án IDEA. Lộ trình: `modules/DEM_SO/PLAN_DEM_SO.md`.

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
