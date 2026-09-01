# GAME_SU_KIEN — hướng dẫn cho Claude Code

Ứng dụng **TỰ CHỨA MỌI THỨ**: giao diện, máy chủ Node, cơ sở dữ liệu SQLite và kênh đồng bộ
thời gian thực nằm chung một repo. `git clone` + `npm install` + `npm start` là chạy được,
**không phụ thuộc dịch vụ ngoài nào** (không Supabase, không Vercel, không Redis).

Đứng RIÊNG, không dính gì tới hệ quản trị MASTER SATA ROBO. Từ bộ nhận diện SataRobo chỉ
**chép giá trị màu và font** vào `config/thuong-hieu.ts`, không import dòng code nào.

## Một ứng dụng, nhiều game

Ứng dụng chứa **nhiều game sự kiện**: `TRUNG_SO` (đang chạy) và `VONG_QUAY_MAY_MAN` (khung
rỗng). **Cơ sở · nhân viên · khách tiềm năng · kho quà là DANH MỤC DÙNG CHUNG**, chỉ tồn
tại MỘT nơi — mọi game tham chiếu bằng id, không ai giữ bản sao (ADR-005).

## Trò chơi hoạt động thế nào — HAI chế độ

- **`tai_quay`**: màn hình LCD ở lễ tân là **nơi DUY NHẤT hiện dãy số**, điện thoại phụ
  huynh chỉ là **nút bấm có đóng dấu thời gian**, và **một ghế một người**. Đòn bẩy nằm ở
  *một cú bấm có khán giả*.
- **`online`**: điện thoại **tự vẽ dãy số**, **bỏ giữ chỗ** — ai vào cũng chơi ngay,
  không hàng đợi. Dùng cho quảng cáo (ADR-004).

Trọng tài **giống hệt nhau** ở cả hai: máy nào bấm thì máy đó đo, máy chủ kẹp lại.

## Ván nhiều lần bấm

**Một VÁN = tối đa N lần bấm = MỘT phần quà** (ADR-006). `van_choi` là đơn vị nhận giải,
`luot_choi` là nhật ký từng lần bấm. Trúng là **dừng ngay**; kết quả ván lấy lần **lệch ít
nhất**, không phải lần cuối. Giới hạn là **1 VÁN/SĐT/ngày**, không phải 1 lượt.

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
8. 🔴 **Lọc theo quyền ở TẦNG KHO (SQL), không ở tầng giao diện.** Ẩn một cái nút mà câu
   truy vấn vẫn trả đủ dòng thì danh bạ khách đã nằm trong HTML gửi ra khỏi máy chủ. Mọi
   trang và mọi server action trong `/quan-tri` phải gọi `nguoiDangDangNhap()` rồi truyền
   `phamViCua(nguoi)` xuống kho.
9. **MỌI câu SQL của một bảng nằm trong đúng MỘT file `lib/**/kho.ts`.** Đây là thứ khiến
   đổi cơ sở dữ liệu về sau chỉ phải sửa một tầng (ADR-008).

## Cạm bẫy đã trả giá

- **Đừng bật `trailingSlash`** — nó khiến `/api/gio` bị chuyển hướng 308, thêm một lượt
  đi–về vào đúng phép đo độ lệch đồng hồ, làm hỏng chính thứ nó đang đo.
- **Trạm phát và kết nối CSDL phải giữ ở `globalThis`** — `next dev` nạp lại module mỗi lần
  sửa code, để ở biến module thì mất sạch người đang nghe / mở thêm kết nối bỏ rơi.
- **`instrumentation.ts` không tự chạy trong dev của Next 16** — CSDL mở lười ở lần dùng đầu.
- 🔴 **Next 16 đã đổi tên `middleware.ts` thành `proxy.ts`.** Đặt sai tên thì tệp không bao
  giờ chạy, trang quản trị mở toang, và **không một dòng lỗi nào**. Tài liệu nằm sẵn trong
  `node_modules/next/dist/docs/` — đọc ở đó, đừng dựa vào trí nhớ.
- 🔴 **Mở `DatabaseSync` vào đường dẫn không tồn tại là TẠO tệp rỗng.** Tệp rỗng đó có thể
  bị đổi tên đè lên CSDL thật; app vẫn chạy mà trắng trơn. Đã vá + 4 test canh.
- **Cookie phiên: chỉ bật `secure` khi thật sự chạy HTTPS.** Bật ở LAN (`http://192.168.x.x`)
  thì trình duyệt lặng lẽ vứt cookie — đăng nhập đúng mật khẩu mà cứ bị đá về màn đăng nhập.
- **Ván nhiều lần bấm: tin `ket-qua` mang số của lần VỪA BẤM, còn màn tổng kết phải vẽ lần
  TỐT NHẤT.** Hai con số khác nhau, phải truyền RIÊNG. Lỗi này lọt qua 190 test và cả build.
- **Giữa ván vẫn PHẢI phát tin lên màn hình lớn.** Bỏ phát cho "đỡ nhấp nháy" thì LCD đứng
  hình rồi tự về màn chờ — đá người đang chơi ra khỏi ván của chính họ.
- **Ngưỡng cảnh báo thuần TỈ LỆ chết lặng với kho nhỏ.** 20% của 4 là 0,8 mà tồn luôn là số
  nguyên ≥ 1 ⇒ loại còn 1 cái nhảy thẳng xanh → đỏ. Ngưỡng phải là `max(1, tỉ_lệ × tổng)`.
- **Máy chủ cũ còn sống sẽ giữ cổng và TRẢ LỜI.** `pkill -f "next start"` không khớp —
  tiến trình thật tên `next-server`. Kill theo PID; bộ chạy e2e tự dừng nếu cổng đang bận.

## Lệnh

`npm run dev` (chỉ máy này) · `npm run dev:dienthoai` (mở cho cả mạng LAN) · `npm test` ·
`npm run lint` · `npm run build` · `npm run e2e` (13 kịch bản trình duyệt thật trên bản
build, CSDL tạm) · `npm run anh-chup` (bộ ảnh nghiệm thu GĐ 20.1) · `npm run sao-luu`
(**chạy TRƯỚC mọi việc đụng CSDL**) · `npm run tao-quan-tri -- <tên>` (tạo tài khoản, hỏi
mật khẩu qua stdin) · `npm run trung-tam` (**mở máy tại quầy**: sao lưu + dựng + chạy cho
cả mạng LAN, tự sinh và giữ khoá ký phiên) · `npm run kiem-may-chu [địa chỉ]` (5 mục kiểm
sau khởi động) · `node scripts/tao-thu.mjs 0211 vua` (tạo nhanh một chương trình).

## Biến môi trường

- `GAME_SU_KIEN_CSDL` — đường dẫn tệp CSDL. **Bộ test và e2e LUÔN đặt biến này** sang tệp
  tạm; không kịch bản nào được đụng vào dữ liệu thật.
- `GAME_SU_KIEN_KHOA_PHIEN` — khoá ký cookie phiên, **≥ 32 ký tự**. Thiếu thì mọi phiên bị
  từ chối (cố ý: không bao giờ rơi về một khoá mặc định nằm trong mã nguồn). `npm run
  trung-tam` tự sinh và giữ ở `du-lieu/khoa-phien.txt` (0600, đã gitignore) — giữ lại chứ
  không sinh mới mỗi lần, nếu không mọi phiên đang mở bị đá ra sau mỗi lần khởi động lại.
- `GAME_SU_KIEN_SAO_LUU` — thư mục để bản sao lưu. 🔴 Mặc định nằm cùng máy; trỏ sang ổ
  ngoài mới thật sự an toàn (`N.7`).
- `GAME_SU_KIEN_HTTPS=1` — chỉ đặt khi thật sự chạy sau HTTPS.

## Bối cảnh đầy đủ

Phân tích ý tưởng và lập luận cho từng con số: `docs/brd/dem-so-bo-dem-may-man.md` trong dự
án IDEA. Lộ trình: `modules/GAME_SU_KIEN/PLAN_TRUNG_SO.md`. Quyết định kiến trúc:
`docs/decisions/ADR-001` … `ADR-008`.

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
