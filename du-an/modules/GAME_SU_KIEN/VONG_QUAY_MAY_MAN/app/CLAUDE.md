# VÒNG QUAY MAY MẮN — hướng dẫn cho Claude Code

Ứng dụng **TỰ CHỨA MỌI THỨ**: giao diện, máy chủ Node, cơ sở dữ liệu SQLite và kênh đồng bộ
thời gian thực nằm chung một repo. `git clone` + `npm install` + `npm start` là chạy,
**không phụ thuộc dịch vụ ngoài nào**.

## 🔴 ĐỨNG RIÊNG — không dính gì tới Trúng Số

App Trúng Số nằm ở `modules/GAME_SU_KIEN/app/`. App này **KHÔNG import một dòng nào** từ đó:
cơ sở dữ liệu riêng, cổng riêng, repo Git riêng, sổ ngân sách giải thưởng riêng.

Khuôn nào của Trúng Số đáng dùng lại thì **CHÉP LOGIC BẰNG TAY** rồi ghi rõ chép từ đâu.
Import xuyên qua là dựng lại đúng thứ mà việc tách hai app sinh ra để tránh.

Từ bộ nhận diện SataRobo chỉ **chép giá trị màu và font** vào `config/thuong-hieu.ts`.

## Trò chơi hoạt động thế nào

Màn hình LCD là nơi vòng quay chạy; điện thoại phụ huynh là **nút QUAY**. Khác Trúng Số ở
chỗ căn bản: **máy chủ quyết kết quả TRƯỚC**, rồi cả hai màn hình cùng chạy một hàm thuần
của thời gian tới đúng góc đó. Không truyền từng khung hình qua mạng.

## Luật bắt buộc

1. **Không hardcode hằng số nghiệp vụ** — đọc từ `config/vong-quay.ts`.
2. **Không hardcode màu/font** — đọc từ `config/thuong-hieu.ts`, và `app/globals.css` phải
   khớp với nó (Tailwind cần giá trị tĩnh nên hai nơi, đổi thì sửa cả hai).
3. **Không viết thẳng chuỗi tiếng Việt vào component** — thêm vào `config/locale.ts` trước.
4. 🔴 **Góc quay là hàm THUẦN của thời gian** `goc(t, gocDich, thoiLuong)`. Đây là điều kiện
   để LCD và điện thoại khớp nhau. Đừng bao giờ lấy góc "đang vẽ" làm kết quả.
5. 🔴 **Ô hết quà BIẾN MẤT khỏi vòng quay ngay** — không thay thầm bằng quà khác. Vòng lúc
   8h khác lúc 20h là TRUNG THỰC, không phải lỗi.
6. 🔴 **Độ rộng cung tỉ lệ ĐÚNG với cơ hội trúng.** Cấm trọng số ẩn. Giữ ngân sách bằng số
   lượng quà và trần mỗi ngày, không bằng cung rộng mà tỉ lệ thấp.
7. **Mỗi lượt quay lưu `hat_giong` + `phien_ban_o` + `goc_dung`** để dựng lại được. Sửa ô
   của chương trình đang chạy thì **tăng `phien_ban`**, không sửa đè.
8. **SQLite làm trọng tài "ai bấm trước"**: `UPDATE ... WHERE ket_thuc_luc IS NULL` chỉ đổi
   được một lần; máy bấm sau nhận 0 dòng và **im lặng bỏ qua**.
9. **Dữ liệu phụ huynh là dữ liệu cá nhân.** Bảng công khai chỉ hiện tên rút gọn, SĐT che
   mặc định, không export hàng loạt ngoài mục đích đối soát.
10. **MỌI câu SQL của một bảng nằm trong đúng MỘT file `lib/**/kho*.ts`.**

## Cạm bẫy đã trả giá (chép từ app Trúng Số — đừng trả giá lần hai)

- 🔴 **Mã QR sinh từ `window.location.origin` mang theo cả `localhost`.** Người vận hành mở
  màn LCD bằng `localhost:3200` thì QR mã hoá `http://localhost:3200/choi/…`; điện thoại quét
  vào thì `localhost` trỏ về **chính chiếc điện thoại đó**. Trang vẫn hiện QR đẹp đẽ, không
  một dòng cảnh báo. Phát hiện 02/09 khi anh Phúc test thật. Cách chữa: chạy qua script tự dò
  IP LAN, **và** hiện dải cảnh báo ngay trên màn LCD khi `origin` chứa `localhost`.
- 🔴 **Chữ trắng trên ô màu sáng là chữ vô hình.** Trắng trên vàng `#FACC15` = **1,5:1**, trên
  mint `#5EEAD4` = **1,5:1** — không đọc được ngay ở 1 mét, chứ đừng nói 3–5 m. Một bảng màu
  ô "đẹp" hoàn toàn có thể chứa nửa số ô không đọc được. Màu chữ phải suy từ **độ chói của
  nền**, không phải chọn một màu rồi dùng cho mọi ô.
- 🔴 **`next dev` CHẶN tài nguyên dev từ mọi địa chỉ khác `localhost`.** Điện thoại vẫn mở
  được trang, vẫn thấy giao diện, nhưng JS không tải nên **KHÔNG BẤM ĐƯỢC GÌ** — trông y hệt
  app bị treo, không một dòng báo lỗi. Phải khai `allowedDevOrigins` trong `next.config.ts`.
  `curl` trả 200 vẫn qua như thường, chỉ lộ ra khi mở thật bằng IP LAN.
- 🔴 **Next 16 đã đổi tên `middleware.ts` thành `proxy.ts`.** Đặt sai tên thì tệp **không bao
  giờ chạy**, trang quản trị mở toang, và **không một dòng lỗi nào**. Tài liệu nằm sẵn ở
  `node_modules/next/dist/docs/` — đọc ở đó, đừng dựa vào trí nhớ.
- 🔴 **Mở `DatabaseSync` vào đường dẫn không tồn tại là TẠO tệp rỗng.** App vẫn chạy mà
  trắng trơn. Phải kiểm tệp tồn tại trước khi mở.
- **Cookie phiên: chỉ bật `secure` khi THẬT SỰ chạy HTTPS.** Bật ở LAN (`http://192.168.x.x`)
  thì trình duyệt lặng lẽ vứt cookie — đăng nhập đúng mật khẩu mà cứ bị đá về màn đăng nhập.
- **Trạm phát SSE và kết nối CSDL phải giữ ở `globalThis`** — `next dev` nạp lại module mỗi
  lần sửa code, để ở biến module thì mất sạch người đang nghe.
- **`instrumentation.ts` không tự chạy trong dev của Next 16** — mở CSDL lười ở lần dùng đầu.
- **Đừng bật `trailingSlash`** — nó khiến route API đo thời gian bị chuyển hướng 308, thêm
  một lượt đi–về vào đúng phép đo độ lệch đồng hồ.
- **Ngưỡng cảnh báo thuần TỈ LỆ chết lặng với kho nhỏ.** 20% của 4 là 0,8 mà tồn luôn là số
  nguyên ≥ 1 ⇒ loại còn 1 cái nhảy thẳng xanh → đỏ. Ngưỡng phải là `max(1, tỉ_lệ × tổng)`.
- **Nút nhấp nháy bằng `transform: scale` làm xê dịch vùng chạm** — người chơi bấm hụt mà
  không hiểu vì sao. Nhấp nháy bằng quầng sáng.
- **React dọn form sau mỗi server action** — ô không kiểm soát bị xoá trắng khi form báo
  lỗi. Dùng ô **có kiểm soát** cho mọi form người lạ phải điền tại quầy.
- **Máy chủ cũ còn sống sẽ giữ cổng và TRẢ LỜI.** `pkill -f "next start"` không khớp — tiến
  trình thật tên `next-server`. Kill theo PID.
- **Backtick trong chú thích SQL kết thúc sớm template literal** của chuỗi lược đồ.
- 🔴 **Heredoc ghi vào thư mục CHƯA TỒN TẠI hỏng lặng lẽ — và `tsc` vẫn báo XANH.** Vấp hai
  lần trong một phiên: `cat > components/x.tsx` khi chưa có `components/` thì file không
  bao giờ ra đời, mà lệnh kiểm ngay sau đó vẫn xanh vì nó **chẳng có gì mới để kiểm**. Dấu
  xanh đó hoàn toàn giả. `mkdir -p` mọi thư mục TRƯỚC, và `test -f` từng file SAU khi ghi.
- **Tailwind không tự nối `font-sans` với font đã nạp.** `layout.tsx` gắn class `font-sans`
  và `next/font` sinh ra biến `--font-chinh`, nhưng thiếu dòng `--font-sans: var(--font-chinh)`
  trong `@theme` thì trang lặng lẽ rơi về font hệ thống — không một dòng lỗi, chỉ là dấu
  tiếng Việt xấu hơn mà không ai hiểu vì sao.
- **Gán `ref.current` trong thân render là lỗi `react-hooks/refs`.** Cập nhật trong
  `useEffect`: component có thể render lại mà không vẽ ra màn hình, khi đó ref đã đổi trong
  khi giao diện thì chưa.
- **vitest 4 bỏ `--reporter=basic`** (nó đi tìm một reporter tuỳ biến rồi ném lỗi), và
  **chặn `console.log` của test đã pass** — muốn in bảng ra đọc thì thêm
  `--disable-console-intercept`.
- **`npm install | tail` trả mã thoát của `tail`.** Ổ đĩa đầy, npm in `ENOSPC` và cài dở
  dang, nhưng đường ống vẫn báo `exit 0`. Kiểm bằng bằng chứng vật lý (`node_modules/.bin`
  có tồn tại không), đừng tin mã thoát qua ống.
- 🔴 **`npm install | tail` trả về mã thoát của `tail`, KHÔNG phải của npm.** Đã gặp thật
  01/09/2026: ổ đĩa đầy, npm in `ENOSPC: no space left on device` và cài dở dang, nhưng
  đường ống vẫn báo `exit 0` — suýt tick xong một hạng mục chưa hề chạy. Kiểm bằng
  `${PIPESTATUS[0]}`, hoặc đừng nối ống vào lệnh cài.
- **`node_modules` cài dở phải XOÁ rồi cài lại**, đừng chạy `npm install` đè lên: npm coi
  gói đã có thư mục là đã cài, nên phần hỏng nằm im ở đó.

## Lệnh

`npm run dev` (chỉ máy này, cổng **3200**) · `npm run dev:dienthoai` (mở cho cả mạng LAN) ·
`npm test` · `npm run lint` · `npm run build` · `npm start` (cổng **3210**) ·
`npm run bang-tra` (in bảng công bằng) · `npm run bam-mat-khau` (sinh khoá/mật khẩu quản trị).

> Cổng 3200/3210 chọn để **không đụng** app Trúng Số. Hai app chạy song song được.

## Biến môi trường

- `VONG_QUAY_CSDL` — đường dẫn tệp CSDL. **Bộ test LUÔN đặt biến này** sang tệp tạm; không
  kịch bản nào được đụng dữ liệu thật.
- `VONG_QUAY_KHOA_PHIEN` — khoá ký cookie phiên, **≥ 32 ký tự**. Thiếu thì mọi phiên bị từ
  chối (cố ý: không bao giờ rơi về một khoá mặc định nằm trong mã nguồn).
- `VONG_QUAY_MAT_KHAU_BAM` — chuỗi băm scrypt của mật khẩu quản trị (dạng `scrypt$…`).
  Thiếu thì mọi lần đăng nhập bị từ chối. Mật khẩu THÔ không được lưu ở đâu cả.
- `VONG_QUAY_HTTPS=1` — chỉ đặt khi thật sự chạy sau HTTPS.
  🔴 Đừng đặt khi máy ở quầy chạy `http://192.168.x.x`: trình duyệt sẽ **lặng lẽ vứt**
  cookie phiên, người vận hành gõ đúng mật khẩu vẫn bị đá về màn đăng nhập mãi mãi.

Sinh hai chuỗi trên: `npm run bam-mat-khau -- --khoa` và `npm run bam-mat-khau -- 'mật khẩu'`.

## Bối cảnh đầy đủ

Lộ trình: `modules/GAME_SU_KIEN/VONG_QUAY_MAY_MAN/PLAN_VONG_QUAY.md` (nguồn DUY NHẤT).
Tổng quan module: `modules/GAME_SU_KIEN/VONG_QUAY_MAY_MAN/OVERVIEW.md`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
