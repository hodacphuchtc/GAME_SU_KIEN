# PLAN — TRÚNG SỐ v2 · module GAME_SU_KIEN

> **Đổi tên 01/09/2026:** module `DEM_SO` → **`GAME_SU_KIEN`**, chứa hai game con
> **`TRUNG_SO`** (game này) và **`VONG_QUAY_MAY_MAN`** (khung rỗng, làm sau). Nhãn hiển thị
> "Đếm số" → **"Trúng Số"**. Một app Next.js duy nhất chứa nhiều game; cơ sở · nhân viên ·
> khách tiềm năng · kho quà là **danh mục dùng chung**, chỉ tồn tại MỘT nơi.

**Mục tiêu v2:** biến trò chơi ở quầy thành một cỗ máy thu khách tiềm năng có thương hiệu,
kiểm soát được ngân sách quà, chạy được cả tại quầy lẫn online qua quảng cáo.

**Kiến trúc:** giữ nguyên nền v1 — Next.js 16 App Router tự chứa, `node:sqlite`, SSE trong
route handler, lõi bộ đếm là hàm thuần của thời gian. v2 thêm 6 bảng, một lớp nâng cấp lược
đồ, một lớp đăng nhập, và một chế độ chơi thứ hai. **Không thêm dịch vụ ngoài nào** ngoài
VPS để chạy chế độ online.

**Công nghệ:** Next.js 16.3.3 · React 19.2.8 · TypeScript · `node:sqlite` (Node 24) ·
Tailwind v4 · Vitest · `qrcode`. Phụ thuộc ngoài: **không thêm gói nào**.

---

## BÀN GIAO — ĐÃ CHUYỂN SANG SỔ V2

> 🔴 **Bàn giao hiện hành nằm ở `PLAN_TRUNG_SO_V2.md`** (sổ đang chạy). Khối dưới đây là
> ảnh chụp lúc đóng v2, giữ lại làm lịch sử — **đừng đọc nó để làm tiếp**.

## Ảnh chụp bàn giao lúc đóng v2 (01/09/2026)

1. **Vừa xong:** `N.10` dọn nợ kỹ thuật — **41/51 mục đã tick**. Test **360 → 366**
   (33 file), thêm hai cổng tự động: `tests/locale.test.ts` và `tests/thuong-hieu.test.ts`.
   Cả hai đều đã được thử làm-cho-đỏ để chứng minh chúng canh thật.

2. **🔴 TRÚNG SỐ ĐÃ HẾT VIỆC MÁY.** Không còn một hạng mục nào máy tự làm được. 10 mục còn
   lại: `18.1b` (chặn NGOÀI — cần `N.6` VPS + tên miền) và `N.1`–`N.9` (chặn NGƯỜI/NGOÀI,
   **0 dòng code**). Đừng mở sổ này tìm việc code nữa — không có.

3. **Chặn ở NGƯỜI / NGOÀI** (chi tiết ở `CLAUDE.md` mục CHỜ NGOÀI):
   · 🔴 **CẦN CHỐT** — `ADR-005` "một app nhiều game" **mâu thuẫn** với việc phiên song song
     đã dựng Vòng Quay đứng riêng. Chưa hoà giải; hai phía ghi ở `CLAUDE.md` mục CẦN QUYẾT.
   · `N.6` VPS + tên miền → `18.1b`, chỉ chặn chế độ ONLINE (chạy tại quầy đã đủ).
   · `N.7` ổ cứng ngoài để sao lưu — rẻ nhất, bảo vệ thứ đắt nhất.
   · `N.4`/`N.5` dữ liệu thật · `N.8` thêm tư thế linh vật · `N.1` NĐ 81/2018.
   · **19.1(b)** — xuất một bảng rồi mở bằng Excel/Sheets/Numbers, làm một lần rồi đóng băng.
   · Một dòng chạy tay: `git remote set-url origin`
     `https://github.com/hodacphuchtc/GAME_SU_KIEN.git` (remote còn tên cũ, đi qua chuyển hướng).

4. **Đã đo, đừng đo lại:**
   · `T.appName` từng là **"Bộ đếm may mắn"** suốt từ v1 — GĐ 9 đổi nhãn sang "Trúng Số"
     nhưng bỏ sót đúng khoá làm `title` tab trình duyệt. Đã vá. Bài học: **đổi tên sản phẩm
     thì grep cả tên CŨ**, đừng chỉ sửa những chỗ nhớ ra.
   · `config/thuong-hieu.ts` trước hôm nay **không một file mã nào import** — nó tự xưng
     "nguồn giá trị duy nhất" mà thực tế mọi màu đi qua `@theme`. Nay có test canh hai chiều.
   · ID Drive của logo + linh vật nằm trong `rule/UI/SATA ROBO — BRAND DNA…` § 5.1 và § 15.
   · Linh vật master **không có alpha**; tư thế **ĂN MỪNG** ⇒ cấm ở màn thua.
   · Playwright nạp từ bộ nhớ đệm npx qua `tests/e2e/playwright.mjs` — **không** có trong
     `package.json`, đừng cài thêm.
   · Chạy tại quầy: `npm run trung-tam`. 🔴 LAN **không có HTTPS** — đừng mở ra Internet.

5. **Cạm bẫy vừa trả giá** — đầy đủ ở `app/CLAUDE.md`. Hai cái bất ngờ nhất: **`npx` là
   lớp bọc**, giết nó không giết `next-server`; và **ảnh "gần trắng" trên nền trắng VẪN hiện
   ra một cái hộp** — chỉ nhìn ảnh chụp mới thấy, suy luận thì không.

6. **Lệnh phiên sau** (trong `modules/GAME_SU_KIEN/app/`):
   `npm run sao-luu` (**trước khi đụng CSDL**) · `npm test` · `npm run e2e` ·
   `npm run trung-tam` (mở máy tại quầy) · `npm run kiem-may-chu <địa chỉ>`.

---

## 16 QUYẾT ĐỊNH ĐÃ CHỐT (nguồn của mọi hạng mục dưới đây)

| # | Quyết định |
| - | ---------- |
| Đ1 | Màn thua: **"KHÔNG TRÚNG THƯỞNG" + "Cảm ơn Quý Phụ huynh đã tham gia"**. Không ưu đãi, không nút nhận quà. **Lead vẫn thu** |
| Đ2 | Khách tiềm năng làm **ngay trong app**, không nối CRM ngoài |
| Đ3 | Câu định vị: **"SATA ROBO — Đào tạo tài năng công nghệ tương lai"** |
| Đ4 | **Không tự động gán** lead. Quản lý gán tay; nút "Chia luân phiên" do NGƯỜI bấm |
| Đ5 | Bảo vệ admin: **tài khoản riêng + phân quyền theo cơ sở + ghi vết** |
| Đ6 | Xuất Excel: **tự viết bộ ghi XLSX**, không thêm thư viện |
| Đ7 | **Hai chế độ chơi** chọn lúc tạo: `tai_quay` (LCD hiện số) · `online` (điện thoại tự hiện số) |
| Đ8 | **Đổi tên repo GitHub** `DEM_SO` → `GAME_SU_KIEN` |
| Đ9 | Phụ huynh khai cơ sở bằng **danh sách xổ xuống theo địa chỉ** |
| Đ10 | Âm thanh **đầy đủ ở màn đang hiện số**; điện thoại tại quầy **rút gọn**, KHÔNG tick |
| Đ11 | **N lần bấm mỗi ván, lấy lần lệch ít nhất. TRÚNG là dừng ngay** |
| Đ12 | **Kho quà nhiều loại, bốc theo THỨ TỰ ƯU TIÊN** |
| Đ13 | Hết quà có hạn → **tự tụt xuống loại "không giới hạn"** ở đáy kho. Người chơi vẫn trúng thật |
| Đ14 | Cảnh báo quản trị **3 kênh**: dải đỏ trang quản trị · chấm kín góc LCD · nhật ký |
| Đ15 | **Giữ nguyên gói đầy đủ** sau thẩm định; bổ sung sao lưu + thước đo ghi danh vào đầu |
| Đ16 | Chế độ online chạy **VPS có ổ đĩa bền, giữ SQLite** — không chuyển Supabase |

---

## RÀNG BUỘC TOÀN CỤC (áp cho MỌI hạng mục)

- Chữ hiển thị: **Tiếng Việt 100%, đúng dấu**. Chuỗi mới thêm vào `config/locale.ts` **trước**.
- **Cấm hardcode màu/font** — đọc `config/thuong-hieu.ts`: tím `#6B21A8` (30%) · cam
  `#F97316` (10%) · trắng `#FFFFFF` (60%) · font **Be Vietnam Pro**.
- 🔴 **Màu bên trong ảnh logo/linh vật là `#FF6F00` / `#800080` và KHÔNG BAO GIỜ được sửa.**
  Cấm `filter`, `mix-blend-mode`, `opacity < 1`, grayscale, tint lên ảnh nhận diện. Cấm
  `.vien-mach` / `.led-sang` chạy xuyên logo. **Không thêm hai mã màu đó vào `mauThuongHieu`
  hay `@theme`** — thêm là người sau vô tình dùng cho nút bấm.
- **Cấm hardcode hằng số nghiệp vụ** — đọc `config/game.ts` và `config/to-chuc.ts`.
- Kết quả một lượt **luôn tính từ mốc thời gian của chính sự kiện chạm** (`event.timeStamp`).
- **Máy nào bấm thì máy đó ĐO.** Máy chủ kẹp lại, không tự tính từ lúc nhận lệnh.
- **SQLite là trọng tài "ai bấm trước"**: `UPDATE ... WHERE ket_thuc_luc IS NULL`.
- Mỗi hạng mục xong: `npm test` · `npx tsc --noEmit` · `npm run lint` · `npm run build` xanh
  **rồi mới commit**. Cấm tick theo cảm giác.
- Dữ liệu phụ huynh là **dữ liệu cá nhân**: bảng công khai chỉ hiện tên rút gọn, SĐT che mặc
  định, không export hàng loạt ngoài mục đích đối soát.
- Không đụng gì tới `MASTER SATA ROBO`.

---

## KHÔNG LÀM ở v2 (cố ý)

| Không làm | Vì sao |
| --------- | ------ |
| **Game VÒNG QUAY MAY MẮN** | v2 chỉ dựng thư mục + mục điều hướng mờ "sắp có". Làm game thứ hai khi game thứ nhất chứng minh có người chơi |
| **Xác thực OTP số điện thoại** | Cần nhà cung cấp + tiền mỗi tin + làm rớt khách. Chế độ online chấp nhận số giả và **lọc sau** (sale đánh dấu "không liên lạc được"), viết sẵn chỗ móc cho OTP |
| **Đẩy lead sang CRM SataRobo** | Chưa có phân hệ đó. v2 quản lý lead nội bộ + xuất Excel |
| **Nhiều máy chủ / scale ngang** | `tram-phat` là Map trong bộ nhớ, SQLite single-writer. Một instance duy nhất, tắt autoscale |
| **Bốc quà ngẫu nhiên theo tỉ trọng** | Đã chốt bốc **theo thứ tự ưu tiên** (Đ12) — dễ giải thích với khách hơn |
| **Gửi email/Zalo cảnh báo hết quà** | Chưa có hạ tầng gửi tin. v2 cảnh báo bằng 3 kênh trong app |
| **Tự động gán lead cho sale** | Đã chốt Đ4 — người bấm mới chia |
| **Biểu đồ báo cáo, dashboard số liệu** | v2 chỉ cần MỘT con số: *tháng này N lead → M ghi danh* |
| **Dọn 35 khoá locale mồ côi + 2 component chết** | Gộp vào diff của v2 sẽ làm không ai soi nổi. Mục riêng ở `N.8` |
| **Đổi màu logo cho hợp giao diện** | Brand doc §6 khoá cứng. Ảnh render nguyên bản |

---

## BẢN ĐỒ FILE v2 (mỗi file một trách nhiệm)

**Tạo mới**

| File | Trách nhiệm |
| ---- | ----------- |
| `scripts/sao-luu.mjs` | `VACUUM INTO` theo lịch, xoay vòng giữ 14 bản, đẩy ra thư mục ngoài |
| `lib/db/nang-cap.ts` | Thêm cột có điều kiện + backfill một lần canh bằng `PRAGMA user_version` |
| `lib/db/doi-ten-tep.ts` | Đổi tên **cả 3 tệp** `.db`/`-wal`/`-shm`, chạy trước khi mở kết nối |
| `config/to-chuc.ts` | Hằng số tổ chức: tiền tố mã cơ sở, trạng thái cơ sở/nhân viên/lead, ngưỡng cảnh báo kho |
| `config/tai-san.ts` | `import` tĩnh 2 ảnh + provenance (Drive id, ngày, sha256) |
| `lib/co-so/kho.ts` | MỌI SQL của bảng `co_so` + hàm `nhanCoSo()` |
| `lib/nhan-vien/kho.ts` | MỌI SQL của bảng `nhan_vien` (vừa là sale vừa là tài khoản) |
| `lib/van/kho-van.ts` | MỌI SQL của bảng `van_choi` — đơn vị nhận giải |
| `lib/qua/kho-qua.ts` · `lib/qua/chon-qua.ts` | Kho quà + thuật toán bốc theo thứ tự (hàm thuần + lớp bọc giao dịch) |
| `lib/lead/kho.ts` · `lib/lead/chia-luan-phien.ts` | Khách tiềm năng + `chiaVong()` hàm thuần |
| `lib/bao-ve/phien-quan-tri.ts` · `lib/bao-ve/mat-khau.ts` | Ký/kiểm cookie HMAC (Web Crypto) · băm scrypt |
| `middleware.ts` | Chắn `/quan-tri/*` và `/api/xuat/*` |
| `lib/xuat/zip.ts` · `lib/xuat/xlsx.ts` | Dựng ZIP thủ công · dựng workbook XLSX |
| `components/nhan-dien-sata.tsx` | `<LogoSata>` · `<LinhVatSata>` · `<CauDinhVi>` — luật khoảng thở sống ở ĐÚNG MỘT chỗ |
| `Dockerfile` · `deploy/` | Đóng gói cho VPS |

**Sửa nhiều nhất**

| File | Sửa gì |
| ---- | ------ |
| `lib/db/luoc-do.ts` | Thêm 6 bảng. **Không đụng một ký tự nào vào SQL cũ** |
| `lib/db/ket-noi.ts` | Gọi `doiTenTep()` rồi `nangCap()` quanh `db.exec(LUOC_DO)` |
| `components/man-hinh.tsx` | Masthead thương hiệu · linh vật · chấm chỉ báo kho · âm thanh |
| `components/man-dien-thoai.tsx` | Màn thua mới · thương hiệu · giữa ván "Lần 2/3" · chế độ online tự hiện số |
| `app/actions/choi.ts` | (đổi tên từ `van-choi.ts`) sinh lead · trả `lyDo` · chốt ván |
| `config/locale.ts` | ~110 khoá mới, xoá 6 khoá mồ côi do v2 gây ra |

**Xoá:** `components/nut-tat.tsx` (thay bằng `nut-bat-tat.tsx`) · `app/api/xuat-csv/[ma]/route.ts` (thay bằng route Excel).

---

## LỊCH SỬ — v1 ĐÃ XONG (giữ lại để không mất dấu, không làm lại)

GĐ 0→6 chạy thật trên máy ngày 31/08–01/09/2026. 80 test xanh · build 9 route · Playwright
chạy trọn luồng qua IP LAN, hai màn hình cùng ra `lệch 3533 số`.

- [x] **GĐ 0** — Bỏ xuất tĩnh, dựng SQLite (`0.1`) · Bộ nhận diện + khung admin (`0.2`)
- [x] **GĐ 1** 🔴 — Kênh SSE trong máy chủ Next (`1.1`) · Ghép đôi + trọng tài SQLite (`1.2`) · Bài kiểm sống điện thoại↔laptop (`1.3`)
- [x] **GĐ 2** — Danh sách + màn thiết lập (`2.1`) · Chi tiết + QR in được + nút tắt (`2.2`)
- [x] **GĐ 3** — Bảng LED màu thương hiệu (`3.1`) · Màn chờ/chạy/kết quả (`3.2`)
- [x] **GĐ 4** — Nhận diện phụ huynh (`4.1`) · Nút bấm tối ưu ngón cái (`4.2`) · Lịch sử + giới hạn lượt + trần giải (`4.3`)
- [x] **GĐ 5** — Màn thua thành cửa bán hàng (`5.1`) — ⚠️ **v2 ĐẢO quyết định này, xem 8.1**
- [x] **GĐ 6** — Môi trường chạy thật + tài liệu (`6.2`)
- [x] **6.1 — Kiểm thử đầu-cuối tự động** ✅ (01/09 — 14 kịch bản đã vào
  `app/tests/e2e/`, chạy bằng MỘT lệnh `npm run e2e`: bộ chạy tự dựng build, mở máy chủ
  trên CSDL TẠM, dựng nền, chạy, tắt theo PID. **14/14 đạt.** Bộ chạy tự dừng nếu cổng đang
  có máy chủ khác — đúng vết sẹo "máy chủ cũ trả lời thay bản mới")
- [x] **6.3 — Commit và đẩy lên GitHub** ✅ (01/09 — bạn duyệt; xong cùng `9.3`)

---

# 🔴 BẢNG RỦI RO — làm sớm, không để cuối

| Hạng mục | Rủi ro nếu hỏng | Xếp ở |
| -------- | --------------- | ----- |
| **7.1 Sao lưu + thử phục hồi** | Mất toàn bộ danh sách khách hàng. Hôm nay **không có bản sao nào** và 19 ngày tới đều ghi vào cùng file đó | **GĐ 7 — đầu tiên tuyệt đối** |
| **9.1 Đổi tên tệp CSDL** | Quên `-wal`/`-shm` là mất 90% dữ liệu mới nhất, âm thầm | GĐ 9 |
| **10.1 Nâng cấp lược đồ + backfill** | Mổ DB đang chạy thật, không có công cụ migration. Sai là hỏng dữ liệu đã thu | GĐ 10 |
| **15.x Khoá cửa trang quản trị** | Chưa khoá mà lên Internet = phát danh bạ phụ huynh cho cả thế giới | GĐ 15, **trước** GĐ 16–19 |
| **12.2 Bảng tỉ lệ theo ván** | Không sửa là nhân viên đặt 3 lần bấm và âm thầm gấp ba tiền quà | GĐ 12 |
| **14.3 Đo lại độ chính xác bấm sau khi bật tiếng** | Âm thanh chạy cùng luồng với phép đo mili-giây; lệch là trò chơi mất công bằng | GĐ 14 |
| **18.1 Volume trên VPS** | Quên gắn là mất sạch dữ liệu mỗi lần deploy, **im lặng, app vẫn chạy** | GĐ 18 |

---

## GIAI ĐOẠN 7 — 🔴 AN TOÀN DỮ LIỆU & THƯỚC ĐO (0,75 ngày) · LÀM ĐẦU TIÊN

> **Vì sao xếp trước tất cả:** `du-lieu/` bị gitignore, không có một dòng sao lưu nào trong
> mã nguồn. Bản duy nhất của mọi khách hàng từng thu được nằm trên đĩa một laptop ở quầy lễ
> tân. Mười bốn giai đoạn sau đều ghi vào đúng file đó, và GĐ 10 sẽ mổ nó.

**🏁 BẠN NHÌN THẤY GÌ:** bạn **tự tay đổi tên file CSDL đi cho nó biến mất**, chạy một lệnh
khôi phục, mở lại trang quản trị — **ba chương trình cũ và toàn bộ lịch sử quay số quay lại
y nguyên**. Và trên trang quản trị có một dòng mới: *"Tháng này: 42 khách → 3 ghi danh"*.

- [x] **7.1 — 🔴 Sao lưu tự động + thử phục hồi thật** ✅ (01/09 — 13 test xanh; sao lưu thật giữ đủ 3 chương trình + 7 lượt, trong khi `cp` chỉ tệp .db chỉ còn 1 chương trình + 0 lượt; phục hồi và xoay vòng chạy qua CLI thật)
  - (a) `scripts/sao-luu.mjs`: mở CSDL, chạy `VACUUM INTO 'sao-luu/<YYYY-MM-DD-HHmm>.db'`,
    xoá bản cũ hơn 14 bản gần nhất, in đường dẫn bản vừa tạo. Thư mục đích đọc từ biến môi
    trường `GAME_SU_KIEN_SAO_LUU` (mặc định `../sao-luu-game-su-kien/`, tức **NGOÀI thư mục
    dự án** để `git clean` không quét mất). Thêm `npm run sao-luu`. `scripts/chay-trung-tam.mjs`
    gọi nó **một lần lúc khởi động** và cảnh báo to nếu thư mục đích không ghi được.
    **Dùng `VACUUM INTO`, KHÔNG dùng `cp`** — WAL đang 399 KB chưa checkpoint nên `cp` cho
    ra bản sao thiếu 90% dữ liệu mới.
  - (b) Bạn chạy `npm run sao-luu` → thấy file `.db` mới trong thư mục sao lưu. Rồi
    **đổi tên `du-lieu/game-su-kien.db` thành `.db.hong`** để giả vờ hỏng, chép bản sao lưu vào
    thế chỗ, chạy `npm run trung-tam`, mở `/quan-tri` → **3 chương trình cũ và lịch sử quay
    số vẫn còn đủ**. Chạy `npm run sao-luu` 15 lần liên tiếp → thư mục chỉ giữ 14 file.
  - (c) `tests/sao-luu.test.ts`: `"bản sao đọc được bằng DatabaseSync"` ·
    `"bản sao chứa cả dòng vừa ghi khi WAL chưa checkpoint"` · `"giữ đúng 14 bản, bản thứ 15 đẩy bản cũ nhất ra"` ·
    `"đích đã tồn tại thì không ghi đè im lặng"`.
  - (d) 3 giờ.
  - **🛑 DỪNG BẮT BUỘC:** không giai đoạn nào khác được bắt đầu trước khi bạn tự tay làm
    xong bài phục hồi ở (b). Một bản sao chưa từng phục hồi chỉ là một file, không phải một
    bản sao.

- [x] **7.2 — Thước đo: khách tiềm năng đã thành học viên chưa** ✅ (01/09 — 20 test xanh; trên CSDL thật dòng ROI chạy 0% → 20% → 0% khi tích rồi hoàn tác; cột `da_ghi_danh`/`ghi_danh_luc` thêm được vào CSDL đang chạy mà 7 lượt + 5 khách còn nguyên)
  - (a) Thêm cột `da_ghi_danh INTEGER NOT NULL DEFAULT 0` và `ghi_danh_luc INTEGER` vào bảng
    lượt (tạm ở `luot_choi`, GĐ 12 chuyển sang `van_choi`). Trong bảng lịch sử ở
    `app/quan-tri/[ma]/page.tsx` thêm một ô tích **"đã ghi danh"** cho nhân viên bấm. Trên
    đầu trang `/quan-tri` hiện MỘT dòng: `Tháng này: N khách để lại số → M đã ghi danh (M/N%)`.
  - (b) Mở `/quan-tri`, thấy dòng số liệu. Vào một chương trình, tích "đã ghi danh" cho một
    lượt → quay ra `/quan-tri`, con số M tăng lên 1.
  - (c) `tests/thuoc-do.test.ts`: `"đếm đúng số lượt có SĐT trong tháng"` ·
    `"tích ghi danh hai lần không cộng hai"` · `"lượt ẩn danh không tính vào mẫu số"`.
  - (d) 3 giờ.

---

## GIAI ĐOẠN 8 — Sửa những gì đang sai trước mặt khách (0,75 ngày)

**🏁 BẠN NHÌN THẤY GÌ:** chơi trượt trên điện thoại → màn hình nói **"KHÔNG TRÚNG THƯỞNG"**
và **"Cảm ơn Quý Phụ huynh đã tham gia"**, **không còn nút tặng quà nào**. Bấm nút tắt chương
trình rồi bấm lại lần nữa → nó sống lại, quét QR chơi được ngay.

- [x] **8.1 — Màn thua + ba lỗi đi kèm** (đảo GĐ 5.1 của v1) ✅ (01/09 — gói JS thật có "KHÔNG TRÚNG THƯỞNG" + "Cảm ơn Quý Phụ huynh đã tham gia"; hai chuỗi tặng quà cũ biến mất khỏi bundle; endpoint công khai `quanTamHocThu` đã gỡ)
  - (a) `config/locale.ts`: sửa `lost` thành `"KHÔNG TRÚNG THƯỞNG"`, thêm
    `loseThanks: "Cảm ơn Quý Phụ huynh đã tham gia"`; **xoá** `trialOfferNear`,
    `trialOfferFar`, `trialButton`, `trialDone`. `components/man-dien-thoai.tsx`: xoá khối ưu
    đãi + state `daNhanHocThu` + import `quanTamHocThu`; khối cảm ơn nền `bg-suong` (KHÔNG
    `bg-tim-nhat + border` — nền tím có viền đọc như một thẻ bấm được).
    `components/man-hinh.tsx`: màn thua LCD nói **cùng một câu**.
    🔴 **Xoá luôn export `quanTamHocThu` trong `app/actions/van-choi.ts`** — mọi hàm export
    trong file `"use server"` là một endpoint HTTP công khai có action-id ổn định; để lại là
    ai cũng POST được id bất kỳ để bật cờ cho bất kỳ phụ huynh nào. Giữ hàm thư viện
    `danhDauQuanTamHocThu` (không phải endpoint, đang có test xanh).
  - (b) Quét QR bằng điện thoại, nhập tên + SĐT, chơi **trượt** → thấy "KHÔNG TRÚNG THƯỞNG",
    số bạn dừng, lệch N số, câu cảm ơn, và **nút THỬ LẠI**. Không còn ô "NHẬN BUỔI HỌC THỬ".
    Mở `/quan-tri/<mã>` → **tên và SĐT vừa nhập vẫn nằm trong lịch sử** (lead không mất, vì
    form chạy trước ván chơi).
  - (c) `npm test` toàn bộ xanh; `tests/nhan-dien.test.ts` **không được sửa** (nó chứng minh
    lead vẫn thu). `npm run lint` không còn cảnh báo biến/khoá không dùng.
  - (d) 2 giờ.

- [x] **8.2 — Ba lỗi phát sinh: mã trúng thưởng, cột đồng ý, lý do bị chặn** ✅ (01/09 — 11 test mới; bảng admin hiện mã xác thực thật (DRKM/X9HW/EJNH) + ô "đã trao quà"; nút đáy tự ẩn khi mã còn hiệu lực)
  - (a) **(1)** `lib/luot/kho-luot.ts` thêm `n.dong_y_tu_van` vào `select` + interface + map;
    route xuất thêm cột `"Đồng ý nhận tư vấn"` — hôm nay trung tâm xuất danh sách mà **không
    biết ai cho phép gọi**. **(2)** `components/man-dien-thoai.tsx`: khi `trung && conHieuLuc > 0`
    thì **ẩn** nút đáy (hiện "THỬ LẠI" là khối cam `py-6` to nhất màn, nằm ngay dưới mã xác
    thực còn 60 giây, chạm nhầm là `setKetQua(null)` **mất mã vĩnh viễn**); hết hiệu lực thì
    nút trở lại, nhãn `T.playAgain` ("CHƠI LẠI") khi thắng. Thêm cột `ma_xac_thuc` + nút
    **"đã trao quà"** vào bảng lịch sử admin (cột `da_trao_thuong` lâu nay không ai ghi).
    **(3)** `xinCho` trả thêm `lyDo?: "da-ket-thuc" | "dang-ban"`; màn `ban` nói đúng câu.
  - (b) Chơi **thắng** trên điện thoại → thấy mã xác thực, **không thấy nút to màu cam nào ở
    đáy**; đợi hết 60 giây → nút "CHƠI LẠI" hiện ra. Mở `/quan-tri/<mã>` → thấy đúng mã xác
    thực đó trong bảng, bấm "đã trao quà" → ô đổi trạng thái. Tắt chương trình rồi quét QR →
    điện thoại nói **"Chương trình đã kết thúc"** chứ không phải "màn hình đang có người chơi".
  - (c) `tests/kho-luot.test.ts` thêm ca `"dòng lịch sử có cờ đồng ý tư vấn"`;
    `tests/giu-cho.test.ts` thêm ca `"tắt chương trình trả lyDo da-ket-thuc"` và
    `"ghế bận trả lyDo dang-ban"`.
  - (d) 2 giờ.

- [x] **8.3 — Bật/tắt bằng MỘT nút** ✅ (01/09 — 9 test gồm ca "ghế ma"; trên máy chủ thật nút chạy BẬT LẠI → TẮT → BẬT LẠI; màn "Chưa chơi được" hết ngõ cụt)
  - (a) `lib/chuong-trinh/kho.ts`: `doiTrangThai` **xoá cả 4 ô giữ chỗ ở CẢ HAI chiều** trong
    cùng một UPDATE (`token_man_hinh`, `han_man_hinh`, `token_nguoi_choi`, `han_nguoi_choi`)
    — `ROOM_HOLD_SECONDS = 120`, nên tắt rồi bật lại sau 20 giây thì suốt 2 phút đầu người
    mới quét mã bị báo "màn hình đang có người chơi" bởi một điện thoại đã rời đi.
    `app/actions/chuong-trinh.ts`: `datTrangThaiChuongTrinh(ma, trangThai)` nhận **trạng thái
    đích**, không phải "lật" (nhấp đúp không lật hai lần), rồi `phat(ma, {loai:"trang-thai", dangChay})`.
    `components/nut-tat.tsx` → `components/nut-bat-tat.tsx` có prop `dangChay`, xác nhận
    **chỉ khi tắt**. Đưa nút vào cả `/quan-tri` (danh sách). `lib/dong-bo/kenh.ts` thêm biến
    thể tin. Màn `ban` thêm nút "THỬ LẠI" gọi lại `xinCho` — hiện nó là **ngõ cụt tuyệt đối**,
    phải tải lại trang.
  - (b) Ở `/quan-tri` bấm **Tắt** một chương trình → nhãn đổi, có hỏi xác nhận. Bấm **Bật**
    → không hỏi lại, chương trình sống. **Ngay lúc đó**, chiếc điện thoại đang kẹt ở màn
    "Chưa chơi được" **tự thoát ra và chơi được**, không cần tải lại trang.
  - (c) `tests/bat-tat.test.ts`: `"tắt rồi bật lại thì giữ chỗ được lại"` ·
    `"tắt/bật xoá sạch token và hạn giữ chỗ"` (ca ghế ma) ·
    `"gọi hai lần cùng giá trị không gây tác dụng phụ"`.
  - (d) 2 giờ.

---

## GIAI ĐOẠN 9 — 🛑 Đổi tên: GAME SỰ KIỆN › Trúng Số (1 ngày)

> **Vì sao xếp sớm dù chẳng thêm tính năng nào:** mọi giai đoạn sau đều sửa file. Đổi tên
> muộn là phải sờ lại tất cả một lần nữa, và mọi ảnh chụp nghiệm thu làm trước đó đều mang
> tên cũ.

**🏁 BẠN NHÌN THẤY GÌ:** thanh bên trái đổi thành **"GAME SỰ KIỆN"** xổ xuống, mục đầu là
**"Trúng Số"**, mục thứ hai **"Vòng Quay May Mắn"** màu mờ với nhãn *sắp có*. Repo trên
GitHub đổi tên thành `GAME_SU_KIEN` và link cũ vẫn mở được.

- [x] **9.1 — 🔴 Đổi tên tệp CSDL (cả BA tệp)** ✅ (01/09 — 12 test; trên CSDL thật một dòng cố ý để nguyên trong WAL chưa checkpoint đã sang được tên mới, 3 CT + 7 lượt + 5 khách nguyên vẹn. **Đã trả giá một lần**: một tệp `dem-so.db` RỖNG lạc vào thư mục bị đổi tên đè lên chỗ CSDL thật — app vẫn chạy, chỉ trắng trơn, không một dòng báo lỗi. Bản `.truoc-doi-ten` cứu lại. Đã vá: `doiTenTep` nay từ chối nguồn không có bảng `chuong_trinh`)
  - (a) `lib/db/doi-ten-tep.ts`: chạy **trước khi mở kết nối**. Trình tự: tệp mới đã tồn tại
    → không làm gì · tệp cũ không tồn tại → không làm gì · còn lại: mở tệp cũ,
    `VACUUM INTO '<cũ>.truoc-doi-ten'`, đóng, rồi `renameSync` **cả ba tệp
    `.db`, `.db-wal`, `.db-shm`** (bỏ qua tệp không tồn tại). `lib/db/ket-noi.ts` gọi nó ở
    đầu `moCsdl`. Đường dẫn mặc định đổi sang `du-lieu/game-su-kien.db`, biến môi trường đổi
    thành `GAME_SU_KIEN_CSDL`.
  - (b) Trước khi chạy, mở `/quan-tri` ghi lại số chương trình và số dòng lịch sử. Chạy
    `npm run trung-tam` → thấy `du-lieu/game-su-kien.db` xuất hiện và `dem-so.db` biến mất.
    Mở lại `/quan-tri` → **số chương trình và số dòng lịch sử y hệt lúc trước**.
  - (c) `tests/doi-ten-tep.test.ts`: `"đổi tên cả 3 tệp"` ·
    🔴 `"không mất dòng nào đang nằm trong WAL"` (ghi một dòng, KHÔNG checkpoint, đổi tên, đọc lại) ·
    `"tệp mới đã có thì không làm gì"` · `"tệp cũ không có thì không ném lỗi"`.
  - (d) 2 giờ.

- [x] **9.2 — Đổi tên module, định danh, điều hướng** ✅ (01/09 — `modules/GAME_SU_KIEN/` với 2 game con; thanh bên hiện GAME SỰ KIỆN › Trúng Số + Vòng Quay May Mắn (sắp có, mờ); `/quan-tri/chuong-trinh/L7WH` trả 200, route cũ 404; `check-structure` xanh 5 module; 145 test + build xanh)
  - (a) `git mv modules/GAME_SU_KIEN modules/GAME_SU_KIEN`; tạo `TRUNG_SO/OVERVIEW.md` và
    `VONG_QUAY_MAY_MAN/OVERVIEW.md`; viết lại `module.config.json` (`id: "game-su-kien"`,
    khai 2 game con). Trong app: `package.json` name → `game-su-kien`; symbol
    `Symbol.for("game-su-kien.csdl")` và `...tram-phat`; nhãn UI "Đếm số" → **"Trúng Số"**
    (`T.adminNavDemSo` → `T.adminNavTrungSo`, `T.adminBrandTag`); tên file tải về →
    `trung-so-<ma>`. Đổi `app/actions/van-choi.ts` → `app/actions/choi.ts` (GĐ 12 sẽ có
    **bảng** `van_choi`, để hai thứ trùng tên là bẫy cho người đọc sau).
    Chuyển `/quan-tri/[ma]` → **`/quan-tri/chuong-trinh/[ma]`** — sắp thêm 6 trang tĩnh cạnh
    một route động cùng cấp. `components/khung-quan-tri.tsx`: nhóm **GAME SỰ KIỆN** xổ xuống
    (Trúng Số · Vòng Quay May Mắn mờ), nhóm **TỔ CHỨC**, nhóm **HỆ THỐNG**; **viết lại
    comment** đang ghi *"cố ý chỉ có ĐÚNG MỘT mục"* — thêm mục mà để nguyên là file tự mâu
    thuẫn. Cập nhật `.claude/scaffold.json` (`modules`) và `CLAUDE.md`.
  - (b) Mở `/quan-tri` → thanh bên có **GAME SỰ KIỆN** xổ xuống, **Trúng Số** đang sáng,
    **Vòng Quay May Mắn** mờ không bấm được. Bấm vào một chương trình → địa chỉ là
    `/quan-tri/chuong-trinh/L7WH`. Thu nhỏ cửa sổ cỡ điện thoại → thanh bên vẫn thu thành ☰.
  - (c) `node scripts/check-structure.mjs` xanh sau khi đổi tên · `npm run build` xanh ·
    `grep -r "dem-so\|DEM_SO" --include=*.ts --include=*.tsx` chỉ còn khớp trong comment lịch sử.
  - (d) 4 giờ.

- [x] **9.3 — Đổi tên repo GitHub + đẩy code** ✅ (01/09 — repo đã mang tên
  `hodacphuchtc/GAME_SU_KIEN`; push `2d64405..80d9915` lên `main` thành công, cây làm việc
  sạch. ⚠️ Còn MỘT dòng cho bạn chạy tay: `git remote set-url origin
  https://github.com/hodacphuchtc/GAME_SU_KIEN.git` — hiện remote vẫn ghi tên cũ và đi qua
  chuyển hướng của GitHub)
  - (a) Đổi tên repo `hodacphuchtc/DEM_SO` → `GAME_SU_KIEN` trên GitHub (tự chuyển hướng URL
    cũ, giữ nguyên 5 commit lịch sử). Cập nhật `git remote set-url`. Commit theo từng giai
    đoạn rồi push.
  - (b) Bạn mở `github.com/hodacphuchtc/GAME_SU_KIEN` thấy đủ code; mở link cũ `.../DEM_SO`
    thấy nó tự nhảy sang tên mới.
  - (c) `gitleaks protect --staged` sạch trước mỗi commit · `npm test` xanh trước khi push.
  - (d) 2 giờ.
  - **🛑 DỪNG BẮT BUỘC:** đổi tên repo và push là tác động ra ngoài máy — cần bạn duyệt.

---

## GIAI ĐOẠN 10 — 🔴 LƯỢC ĐỒ MỚI TRÊN CSDL ĐANG CHẠY THẬT (1,25 ngày)

> **Vì sao là rủi ro thứ hai:** mổ một CSDL đang giữ dữ liệu khách hàng thật, bằng tay,
> không có công cụ migration. Làm ngay sau khi đã có sao lưu và đã đổi tên xong, **trước**
> mọi thứ đẹp đẽ — vì nếu nó hỏng thì hỏng sớm còn cứu được.

**🏁 BẠN NHÌN THẤY GÌ:** sau khi nâng cấp, mở `/quan-tri` → **3 chương trình cũ vẫn còn đủ**,
và giờ mỗi cái có thêm nhãn cơ sở **CS1 / CS2 / CS3** sinh tự động từ tên trung tâm cũ.

- [x] **10.1 — 🔴 Nâng cấp lược đồ + backfill một lần** ✅ (01/09 — 21 test riêng; chạy thử trên BẢN SAO rồi mới chạm file thật, có bạn duyệt. Trên CSDL thật: 3 CT · 7 lượt · 5 khách **giữ nguyên**, 3→9 bảng, user_version 0→1, sinh đúng CS1–CS3 theo thứ tự id, 3 dòng kho quà không giới hạn, 7 ván, 0 dòng mồ côi)
  - (a) `config/to-chuc.ts` (mã cơ sở, trạng thái cơ sở/nhân viên/lead, ngưỡng cảnh báo kho).
    `lib/db/luoc-do.ts` **thêm 6 bảng** `co_so` · `nhan_vien` · `qua_tang` · `van_choi` ·
    `khach_tiem_nang` · `nhat_ky_truy_cap`, **không đụng một ký tự nào vào SQL cũ**.
    `lib/db/nang-cap.ts` **nhận `DatabaseSync` qua tham số** (không import `lib/db/truy-van.ts`
    — nó gọi `csdl()` mà lúc này kết nối chưa gán vào `globalThis`; cũng **không**
    `import "server-only"`, nếu không test gãy). Hai lớp tách bạch: **cấu trúc** chạy mỗi lần
    khởi động (`pragma table_info` → `ALTER TABLE ADD COLUMN` có điều kiện, thêm
    `chuong_trinh.co_so_id/che_do/nguon_co_so/so_lan_choi/tro_choi` và
    `luot_choi.van_id/lan_thu/co_so_id`); **dữ liệu** chạy **đúng một lần** canh bằng
    `PRAGMA user_version` — backfill 6 bước: gom cơ sở theo **khoá chuẩn hoá**
    (`trim` + gộp khoảng trắng + `toLowerCase`) sinh CS1..CSn theo thứ tự id → gán
    `co_so_id`/`che_do='tai_quay'`/`nguon_co_so='gan_san'`/`so_lan_choi=1` → mỗi chương trình
    một dòng `qua_tang` từ `ten_giai_thuong` với `so_luong = NULL` → mỗi `luot_choi` cũ một
    `van_choi` 1-lần chép `trung`/`ma_xac_thuc`/`da_trao_thuong` → `luot_choi.van_id` →
    `user_version = 1`. Sao lưu `VACUUM INTO` **trước `begin`** (VACUUM không chạy trong
    giao dịch). `lib/db/truy-van.ts` thêm `giaoDich<T>(fn)`.
    🔴 `CREATE INDEX ON chuong_trinh(co_so_id)` **phải nằm trong `nang-cap.ts` SAU `themCot`**,
    không được nằm trong `LUOC_DO` — trên DB cũ cột chưa tồn tại lúc đó.
    🔴 `ALTER TABLE ADD COLUMN ... REFERENCES` **bắt buộc mặc định NULL** khi
    `foreign_keys = ON`, nên `co_so_id` không thể `NOT NULL` ở tầng DB — ràng buộc ở tầng
    ứng dụng, ghi rõ lý do trong comment.
    **KHÔNG** tự gộp tên khác dấu ("Quận 7" vs "Quan 7") — máy đoán sai kiểu đó nguy hiểm hơn
    là để người nhìn thấy hai dòng rồi tự tắt một cái.
  - (b) **Trước tiên chạy trên BẢN SAO**: `cp` bản `VACUUM INTO` ra chỗ khác, trỏ
    `GAME_SU_KIEN_CSDL` vào đó, chạy `npm run trung-tam`, mở bằng trình xem SQLite → thấy đủ
    6 bảng mới, bảng `co_so` có **CS1/CS2/CS3** đúng thứ tự chương trình cũ, mọi chương trình
    có `co_so_id`, số dòng `luot_choi` **không đổi**. Chỉ khi đó mới cho chạy trên file thật.
    Sau đó mở `/quan-tri` → 3 chương trình cũ còn đủ, có nhãn cơ sở.
  - (c) `tests/nang-cap.test.ts` (**DB cũ mô phỏng**: dựng bằng chuỗi lược đồ CŨ, chèn 3
    chương trình trong đó 2 tên lệch hoa thường/khoảng trắng, rồi gọi `moCsdl`):
    `"sinh đúng 2 cơ sở từ 3 chương trình có tên lệch"` · `"mã CS1/CS2 đúng thứ tự id"` ·
    `"mọi chương trình đều có co_so_id"` · `"mỗi luot_choi cũ có đúng 1 van_choi, chép đúng trung và ma_xac_thuc"` ·
    `"mỗi chương trình có đúng 1 dòng qua_tang so_luong IS NULL"` ·
    🔴 `"không mất dòng luot_choi nào"` · `"mở lần hai không đẻ thêm cơ sở"` ·
    `"đổi tên cơ sở rồi mở lại không tái sinh cơ sở cũ"` · `"DB trắng chạy trót lọt, 0 cơ sở"` ·
    `"tên rỗng gom vào Chưa phân loại"` · `"themCot gọi hai lần không ném"`.
    `tests/db.test.ts` sửa `"tạo đủ 3 bảng"` → 9 bảng.
  - (d) 8 giờ.
  - **🛑 DỪNG BẮT BUỘC:** phải chạy xong bài (b) trên bản sao và cho bạn xem kết quả **trước
    khi** chạm file thật.

---

## GIAI ĐOẠN 11 — Cơ sở có mã CS1 / CS2 (0,75 ngày)

**🏁 BẠN NHÌN THẤY GÌ:** tạo chương trình mới, thay vì gõ tay tên trung tâm thì **chọn từ
danh sách** `CS2 — 114 Hoàng Diệu, Đà Nẵng`. Và có một trang riêng để thêm/sửa cơ sở.

- [x] **11.1 — Màn quản lý cơ sở** ✅ (01/09 — 10 test; trên trình duyệt thật với bản build: thêm 4 cơ sở ra đúng CS1→CS4, sửa địa chỉ CS2 thấy đổi ngay, gõ trùng tên viết hoa khác báo lỗi tiếng Việt và KHÔNG xoá trắng ô đang gõ, tắt CS1 thì dòng xám đi)
  - (a) `lib/co-so/kho.ts`: MỌI SQL của `co_so` — liệt kê, tìm, tạo (sinh mã `CS<n>` theo
    **số lớn nhất đang có + 1**, không theo đếm dòng), sửa, bật/tắt, chặn trùng tên theo
    **khoá chuẩn hoá** ở tầng ứng dụng (không dùng `UNIQUE(ten)` — SQLite phân biệt hoa
    thường và khoảng trắng nên ràng buộc đó chỉ đúng một nửa, và biến lỗi nghiệp vụ thành
    exception thô ném vào mặt người dùng). Hàm `nhanCoSo(cs)` trả `"CS2 — 114 Hoàng Diệu,
    Đà Nẵng"` (rơi về `ten` nếu chưa có địa chỉ) — **dùng chung** cho form tạo, danh sách của
    phụ huynh, bảng lead và file Excel. `app/actions/co-so.ts`, `app/quan-tri/co-so/page.tsx`,
    `components/form-co-so.tsx`, `components/bang-co-so.tsx`. Khoá locale mới.
    Ghi comment: **không mở đường đổi cơ sở của chương trình sau khi tạo** — thống kê lead
    suy từ `van_choi.co_so_id`, đổi là lịch sử nhảy sang cơ sở khác.
  - (b) Vào **TỔ CHỨC › Cơ sở** → thấy CS1/CS2/CS3 sinh từ GĐ 10. Bấm **Thêm cơ sở**, nhập
    "Trung tâm Sata Robo Hải Châu" + địa chỉ → được mã **CS4** tự động. Sửa địa chỉ CS2 thành
    "114 Hoàng Diệu, Đà Nẵng" → lưu, thấy đổi ngay. Thử thêm một cơ sở trùng tên (viết hoa
    khác đi) → **báo lỗi tiếng Việt tử tế**, không phải lỗi kỹ thuật. Bấm **Tắt** CS1 → nó
    xám đi.
  - (c) `tests/co-so.test.ts`: `"sinh CS1 rồi CS2 rồi CS3"` ·
    🔴 `"CS10 sinh sau CS9, không sắp chuỗi thành CS1/CS10/CS2"` ·
    `"chặn trùng tên bất kể hoa thường và khoảng trắng thừa"` · `"bật tắt đổi trạng thái"` ·
    `"nhanCoSo rơi về tên khi chưa có địa chỉ"`.
  - (d) 3 giờ.

- [x] **11.2 — Form tạo chương trình dùng cơ sở + hai chế độ** ✅ (01/09 — 9 test; trên trình duyệt thật: hết ô gõ tay tên trung tâm, chỉ còn danh sách CS2 — 114 Hoàng Diệu…, cơ sở đã tắt rơi khỏi danh sách, ô nguồn cơ sở chỉ hiện khi chọn Online, trang chi tiết hiện đúng nhãn, tắt hết cơ sở thì trang tạo nhắc đi thêm cơ sở)
  - (a) `components/form-tao.tsx`: ô gõ tên trung tâm → **`<select>` cơ sở** (chỉ cơ sở đang
    bật, nhãn `nhanCoSo()`); thêm **chế độ chơi** (`Tại quầy có màn hình LCD` / `Online, chơi
    một mình`); thêm **nguồn cơ sở** (`Gán sẵn cơ sở này` / `Để phụ huynh tự chọn`) — mục sau
    chỉ hiện khi chế độ là online; thêm **số lần bấm mỗi ván** (1–5, mặc định 1).
    `app/quan-tri/tao/page.tsx` đọc danh sách cơ sở truyền xuống, báo rõ khi **chưa có cơ sở
    nào**. `app/actions/chuong-trinh.ts` kiểm cơ sở tồn tại + đang bật, **chép `co_so.ten`
    vào `ten_trung_tam`** làm bản chụp (đường chơi không phải join thêm ở chỗ nhạy cảm độ trễ,
    và đổi tên cơ sở năm sau không được làm sai tên trên biên lai năm ngoái).
  - (b) Bấm **Tạo chương trình** → không còn ô gõ tên trung tâm, chỉ có danh sách xổ xuống
    `CS1 — …` / `CS2 — …`. Chọn CS2, chọn *Tại quầy*, số lần bấm = 1 → tạo xong, mở trang chi
    tiết thấy đúng **"CS2 — 114 Hoàng Diệu, Đà Nẵng"**. Tắt hết cơ sở đi rồi vào lại trang tạo
    → thấy câu nhắc *"Chưa có cơ sở nào. Vào mục Cơ sở thêm một cái trước đã."*
  - (c) `tests/tao-chuong-trinh.test.ts`: `"từ chối cơ sở không tồn tại"` ·
    `"từ chối cơ sở đang tắt"` · `"ten_trung_tam được chép đúng từ co_so.ten"` ·
    `"so_lan_choi ngoài khoảng 1..5 bị từ chối"`.
  - (d) 3 giờ.

---

## GIAI ĐOẠN 12 — Ván nhiều lần bấm (1,75 ngày)

**🏁 BẠN NHÌN THẤY GÌ:** tạo chương trình đặt **3 lần bấm**, chơi thử: bấm hụt lần một →
màn hình nói **"Lần 2/3 · tốt nhất đang là lệch 412"** và cho bấm tiếp. Bấm trúng ở lần hai
→ **dừng luôn**, không bắt bấm nốt lần ba.

- [x] **12.1 — Bảng `van_choi` vào đường chơi + trúng là dừng** ✅ (01/09 — 13 test riêng cho ván + 190 test toàn bộ; trên trình duyệt thật: 3 lần bấm ra ĐÚNG 1 dòng lịch sử, màn giữa ván hiện Lần 1/3 · Còn 2 lần bấm, tổng kết lấy lần lệch ít nhất, ván thứ hai cùng SĐT bị chặn. Trúng-là-dừng-ngay canh bằng test (hẹn giờ bấm trúng trong trình duyệt là bài đo không ổn định))
  - (a) `lib/van/kho-van.ts`: MỌI SQL của `van_choi`. Chuyển ngữ nghĩa **`trung` ·
    `ma_xac_thuc` · `da_trao_thuong` · `trao_luc` lên `van_choi`**; `luot_choi` giữ vai nhật
    ký từng lần bấm. Lý do: bấm 3 lần trúng 2 lần vẫn chỉ **một** phần quà — hai vai đó phải
    tách. Kết quả ván = lượt có `khoang_lech` **nhỏ nhất** (`luot_tot_nhat_id` cập nhật sau
    mỗi lần bấm). `dungLuot` trả `trung = true` → chốt ván ngay, `so_lan_da_dung` không tăng
    nữa. `lib/luot/gioi-han.ts`: "1 lượt/SĐT/ngày" → **"1 VÁN/SĐT/ngày"** (đếm `van_choi`) —
    không đổi thì giới hạn giết luôn lần bấm thứ hai. Trần giải đếm `van_choi.trung = 1`.
    `components/man-dien-thoai.tsx` thêm màn giữa ván. Chuyển `da_ghi_danh` từ 7.2 sang `van_choi`.
  - (b) Tạo chương trình **3 lần bấm**, chơi trên điện thoại: bấm sớm lần một → thấy kết quả
    lần đó **và** dòng *"Lần 2/3 · tốt nhất đang là lệch N"*, có nút bấm tiếp. Bấm hết 3 lần
    không trúng → màn tổng kết hiện **lần lệch ít nhất**, không phải lần cuối. Chơi lại với
    số dễ trúng, trúng ở lần 1 → **nhảy thẳng màn thắng**, không hỏi bấm tiếp. Thử chơi ván
    thứ hai cùng SĐT trong ngày → bị chặn. Mở `/quan-tri/chuong-trinh/<mã>` → thấy **một
    dòng ván** chứ không phải ba dòng.
  - (c) `tests/van-choi.test.ts`: `"3 lần bấm sinh 3 luot_choi và 1 van_choi"` ·
    `"kết quả ván là lượt lệch nhỏ nhất, không phải lượt cuối"` ·
    🔴 `"trúng lần 1 thì so_lan_da_dung = 1 và không nhận thêm lần bấm"` ·
    🔴 `"lần bấm 2 và 3 KHÔNG bị giới hạn 1 ván/ngày chặn"` ·
    `"trần giải đếm van_choi chứ không đếm luot_choi"` ·
    `"ván thứ hai cùng SĐT trong ngày bị từ chối"`.
    ⚠️ `tests/luot-service.test.ts` và `tests/nhan-dien.test.ts` **sẽ phải sửa** ở đây vì ngữ
    nghĩa `trung` chuyển bảng — đây là ca sửa **có lý do biết trước**. Ngoài hạng mục này, test
    lõi phải sửa để pass là tín hiệu đã trót đổi hành vi lõi: dừng lại xem xét.
  - (d) 10 giờ.

- [x] **12.2 — 🔴 Bảng tỉ lệ theo VÁN + dự báo ngân sách** ✅ (01/09 — 10 test công thức; trên trình duyệt thật: đổi 1→3 lần bấm thấy tỉ lệ nhảy 1/16 → 1/6 và dự báo 2,5 → 6,9 giải/ngày, đặt 5 lần với trần 2 thì hiện dải đỏ vượt trần, nâng trần thì tắt, trần 0 nói rõ KHÔNG GIỚI HẠN)
  - (a) `lib/bo-dem.ts`: `estimateWinChance(settings, target, soLan)` — tỉ lệ theo ván là
    **`1 − (1 − p)^N`**, KHÔNG phải `N × p`. `components/form-tao.tsx` hiện bảng theo **ván**
    và ngay cạnh đó **dự báo số quà/ngày** = số ván ước tính × tỉ lệ ván, đối chiếu thẳng với
    trần đã khai. Cảnh báo màu khi vượt ngưỡng ở `config/game.ts`.
    **Vì sao bắt buộc:** mức Vừa p ≈ 4% → 3 lần bấm thành **11,5%**, gần gấp ba tiền quà.
    Đây là họ hàng của vết sẹo *"đổi tốc độ KHÔNG đổi tỉ lệ trúng"* đã trả giá một lần.
  - (b) Ở form tạo, để **1 lần bấm** → đọc con số tỉ lệ. Đổi thành **3 lần bấm** → thấy con
    số **nhảy lên gần gấp ba** ngay trước mắt, kèm dòng dự báo *"khoảng N giải/ngày — trần bạn
    đặt là M"*. Đặt số lần bấm = 5 → thấy cảnh báo màu.
  - (c) `tests/uoc-tinh-nhieu-lan.test.ts`: `"N=1 trả đúng giá trị cũ"` (không đổi hành vi cũ) ·
    `"N=3 khớp công thức 1-(1-p)^3 trong sai số 1e-9"` · `"N lớn không vượt quá 1"`.
  - (d) 4 giờ.

---

## GIAI ĐOẠN 13 — Kho quà & kiểm soát ngân sách (1,25 ngày)

**🏁 BẠN NHÌN THẤY GÌ:** khai kho **2 Balo STEM + 1 loại "Buổi học thử" không giới hạn**.
Chơi trúng ba lần: hai lần đầu ra **Balo**, lần thứ ba **tự ra Buổi học thử** — người chơi
không thấy gì khác thường, vẫn "CHÚC MỪNG". Chấm nhỏ ở góc màn LCD chuyển **đỏ**.

- [x] **13.1 — Kho quà nhiều loại, bốc theo thứ tự ưu tiên** ✅ (01/09 — 15 test (9 hàm thuần + 6 đường ghi thật có giao dịch); trên trình duyệt thật: chơi trúng ba ván liên tiếp, hai ván đầu ra Balo STEM, ván ba TỰ tụt xuống Buổi học thử và vẫn reo CHÚC MỪNG y hệt; kho hiện tồn thật, chặn xoá loại đã trao, nút ↑ đổi được thứ tự bốc)
  - (a) `lib/qua/kho-qua.ts` (SQL bảng `qua_tang`) + `lib/qua/chon-qua.ts` (**hàm thuần**
    duyệt theo `thu_tu` tăng dần: `so_luong IS NULL` → chọn ngay; còn hàng **và** chưa chạm
    `tran_moi_ngay` → chọn; hết mọi loại → không có quà). **Đã trao đếm từ
    `van_choi.qua_tang_id`, KHÔNG lưu bộ đếm** — bộ đếm lưu sẵn là con số chỉ chờ ngày lệch
    khỏi sự thật. 🔴 **Việc chọn quà phải nằm TRONG cùng giao dịch với việc chốt ván**, nếu
    không hai người trúng cùng lúc sẽ cùng lấy phần quà cuối cùng. Màn
    `/quan-tri/chuong-trinh/<mã>` thêm khối **Kho quà**: thêm/sửa/xoá loại, kéo thứ tự, ô
    `so_luong` để trống = không giới hạn, tồn còn lại tính trực tiếp.
    🔴 Form **cảnh báo rõ khi kho không có loại nào để trống `so_luong`** — không có loại đáy
    thì hết kho là hết quà thật, và Đ13 không chạy được.
  - (b) Vào một chương trình, khai kho: `1. Balo STEM — 2 cái` · `2. Buổi học thử — để trống`.
    Chơi trúng ba lần liên tiếp (dùng mức `thu` cho dễ) → lần 1 và 2 màn hình ghi **Balo
    STEM**, lần 3 ghi **Buổi học thử**, và **cả ba lần đều reo "CHÚC MỪNG"** như nhau. Xoá
    loại "Buổi học thử" đi rồi lưu → thấy **cảnh báo màu** rằng kho không có loại đáy.
  - (c) `tests/chon-qua.test.ts`: `"bốc đúng thứ tự thu_tu"` · `"hết loại 1 thì sang loại 2"` ·
    🔴 `"hết mọi loại có hạn thì tụt xuống loại so_luong IS NULL"` ·
    `"kho không có loại đáy thì trả không có quà"` · `"trần theo ngày reset sang hôm sau"` ·
    🔴 `"hai ván trúng đồng thời không cùng lấy phần quà cuối cùng"` (chạy trong giao dịch).
  - (d) 6 giờ.

- [x] **13.2 — Trần tổng + cảnh báo 3 kênh** ✅ (01/09 — 15 test; trên trình duyệt thật: kho đầy thì không dải, hạ còn 1 cái hiện dải VÀNG 'còn 1/1 Balo STEM', hết hàng chuyển ĐỎ 'đang trao Buổi học thử', dải hiện ở CẢ danh sách lẫn chi tiết, chấm trên LCD đổi xám→đỏ, đo được chấm chỉ 6×6px và không kèm chữ nào)
  - (a) Trần **mỗi ngày** (đã có) + trần **tổng cả chương trình** (mới) đọc từ `qua_tang`.
    Cảnh báo theo Đ14: **(1)** dải trong trang quản trị — vàng khi loại đang trao còn ≤ ngưỡng
    (`config/to-chuc.ts`, mặc định 20%): *"CS2 — Hoàng Diệu: còn 2/20 Balo STEM"*, đỏ khi đã
    tụt xuống loại đáy; hiện ở cả danh sách lẫn trang chi tiết. **(2)** **chấm tròn nhỏ**
    cạnh mã phòng trên màn LCD: xám = còn quà · hổ phách = sắp hết · đỏ = đã tụt đáy,
    **không chữ** — nhân viên hiểu, phụ huynh nhìn không biết là gì. **(3)** ghi một dòng vào
    `nhat_ky_truy_cap` khi **chạm ngưỡng**, mỗi ngưỡng mỗi ngày **một lần** (không ghi mỗi
    lượt, nếu không nhật ký thành rác).
  - (b) Đặt Balo còn 1 cái → mở `/quan-tri` thấy **dải vàng**. Chơi trúng một ván nữa cho hết
    Balo → dải chuyển **đỏ**, và chấm ở góc màn LCD chuyển **đỏ**. Đứng lùi 3 mét nhìn màn
    LCD → **không nhận ra chấm đó có ý nghĩa gì**; nếu nhận ra thì thu nhỏ hoặc giảm tương
    phản cho tới khi kín.
  - (c) `tests/canh-bao-kho.test.ts`: `"ngưỡng vàng bật khi còn đúng 20%"` ·
    `"đỏ khi loại đang trao là loại đáy"` · `"nhật ký ghi một lần mỗi ngưỡng mỗi ngày"` ·
    `"không ghi nhật ký khi chưa chạm ngưỡng"`.
  - (d) 4 giờ.

---

## GIAI ĐOẠN 14 — Thương hiệu Sata Robo + âm thanh (2,5 ngày)

> **Vì sao xếp sau các giai đoạn cấu trúc:** GĐ 12 và 17 đều mổ `man-hinh.tsx` và
> `man-dien-thoai.tsx`. Làm mỹ thuật trước là phải dựng lại bố cục hai lần.

**🏁 BẠN NHÌN THẤY GÌ:** đứng cách màn LCD 3 mét — thấy **logo Sata Robo** góc trên trái,
câu **"SATA ROBO — Đào tạo tài năng công nghệ tương lai"**, và **linh vật** đứng cạnh mã QR
ở màn chờ. Bấm nút trên điện thoại → **nghe tiếng**.

- [x] **14.1 — Kéo asset thật + lớp nhận diện dùng chung** ✅ (01/09 — hai file master kéo
  từ Drive theo ID ghi trong `rule/UI/SATA ROBO — BRAND DNA…`: logo 644×380 nền trong suốt,
  linh vật 1024×1024. `config/tai-san.ts` giữ provenance đủ (Drive id · ngày · sha256 · kích
  thước). 🔴 **Linh vật master KHÔNG có alpha** — suy đoán "gần trắng nên không thấy" đã bị
  ảnh chụp bác bỏ, nên có thêm bản dẫn xuất nền trong (`scripts/tach-nen-linh-vat.mjs`,
  loang từ mép, bản master giữ nguyên). Tư thế đang có là **ĂN MỪNG** ⇒ cấm ở màn thua.
  `components/nhan-dien-sata.tsx` gom luật khoảng thở + cấm filter về một chỗ.
  Đo thật: mọi ảnh trả về **image/webp**, nặng nhất **18 KB**)
  - (a) Tải 2 file master từ Drive về `public/thuong-hieu/logo-sata-robo.png` và
    `linh-vat-sata-robo.png`, **giữ nguyên bản, không tự nén đè** (brand doc §59 "Asset master
    thắng"). Chạy `sips -g hasAlpha -g pixelWidth -g pixelHeight` trên cả hai để biết có nền
    trong suốt không và **linh vật đang ở tư thế gì** — tư thế quyết định chỗ đặt: giơ tay
    chào/trung tính → dùng được mọi màn; chỉ tay → màn chờ LCD (chỉ về QR); **ăn mừng → KHÔNG
    dùng ở màn thua** (robot reo mừng cạnh chữ "KHÔNG TRÚNG THƯỞNG" đọc như trêu người ta).
    `config/tai-san.ts`: `import` tĩnh + provenance (Drive id, ngày kéo, `shasum -a 256`) +
    map `tênTưThế → import` để thêm tư thế sau chỉ là một dòng. **Không** đặt `NGUON.md` trong
    `public/` (thư mục đó phục vụ công khai). `components/nhan-dien-sata.tsx`: `<LogoSata>`,
    `<LinhVatSata>`, `<CauDinhVi>` — **luật khoảng thở và luật cấm filter sống ở ĐÚNG một
    chỗ**, không rải ra 3 màn. Khoá locale `brandTagline`, `brandLogoAlt`, `brandMascotAlt`.
    🔴 `config/tai-san.ts` **KHÔNG được import từ file nào mà `tests/**` chạm tới** —
    `vitest.config.mts` chạy `environment: "node"`, không có loader ảnh, sẽ nghẹn khi parse `.png`.
  - (b) Mở `/quan-tri` → thanh bên hiện **logo ảnh thật** thay cho chữ "SataRobo". Mở DevTools
    tab Network, lọc `_next/image` → thấy ảnh trả về `content-type: image/webp`, **logo ≤ 20 KB**.
  - (c) `npm run build` xanh · `npm test` xanh (chứng minh không file test nào chạm phải `.png`).
  - (d) 4 giờ.

- [x] **14.2 — Thương hiệu lên màn LCD và màn điện thoại** ✅ (01/09 — masthead LCD ở cả 4
  trạng thái, kẻ mảnh + câu định vị; linh vật ở đáy cột trái màn chờ, quiet zone QR nguyên
  vẹn. Điện thoại: logo + câu định vị mọi bước, linh vật ở `nhap-thong-tin` và màn THẮNG.
  Thanh bên quản trị đổi từ chữ CSS sang logo ảnh thật. Kịch bản e2e
  `gd14-thuong-hieu` canh cả 4 luật: **12/12 bước đạt** — không linh vật lúc `chay` ở CẢ
  hai màn, không linh vật ở màn thua, không ảnh nhận diện nào bị filter/mờ/blend)
  - (a) `components/man-hinh.tsx`: **masthead** hiện ở **cả 4 trạng thái** — logo | tên cơ sở
    + mã phòng + chấm chỉ báo kho | SỐ TRÚNG THƯỞNG; dưới là kẻ mảnh rồi câu định vị. Linh vật
    ở **đáy cột trái màn chờ**, hướng về QR, hở ≥ 48px, **không** bọc `.vien-mach`, quiet zone
    QR nguyên vẹn. 🔴 **Trạng thái `dem-nguoc` và `chay`: KHÔNG linh vật, không hình gì thêm**
    — cả sảnh đang nhìn 4 chữ số, bất cứ hình nào trong khung nhìn cũng là đối thủ của con số.
    `components/man-dien-thoai.tsx`: header logo + câu định vị ở **mọi bước**; linh vật chỉ ở
    `nhap-thong-tin` (bước dừng lâu nhất, đúng lúc phụ huynh quyết định có tin tưởng giao SĐT)
    và `ket-qua`; 🔴 **cấm tuyệt đối ở `dang-chay`** — ảnh mount lúc đó có nguy cơ decode gây
    hụt khung ngay trên đường đo `pointerdown`. **Bắt buộc truyền `sizes`** (logo ĐT `112px`,
    logo LCD `220px`, linh vật ĐT `160px`, linh vật LCD `(min-width:1024px) 320px, 200px`),
    nếu không điện thoại tải bản 1920px cho con linh vật cao 80px. Dùng `preload`, **không**
    `priority` (deprecated từ Next 16.0.0); **không** set `quality`; **không** thêm
    `images.localPatterns` (static import phân giải thành `/_next/static/media/**`, khai hẹp
    là mọi ảnh trả 400).
  - (b) Mở màn LCD trên laptop, **đứng lùi 3 mét**: đọc được logo, đọc được câu định vị, và
    **4 chữ số vẫn là thứ đập vào mắt đầu tiên**. Bấm chơi → lúc số đang chạy, **không có
    hình nào trong khung ngoài bảng LED**. Trên điện thoại: bước nhập tên thấy linh vật; lúc
    số đang chạy **không thấy hình nào**; màn kết quả linh vật quay lại.
  - (c) `npm run build` xanh · `npm run lint` xanh · ảnh chụp lưu vào `tests/anh-chup/` để
    GĐ 20 đối chiếu.
  - (d) 10 giờ.

- [x] **14.3 — 🔴 Âm thanh + bài kiểm độ chính xác phép đo bấm** ✅ (01/09 — 9 test, trong đó bài 200 lượt mô phỏng cho LỆCH TRUNG VỊ = 0 ms (ngưỡng 8 ms) và 0/200 ván đổi kết quả, kèm bài canh ngược chứng minh đo bằng đồng hồ trong handler thì vượt ngưỡng ngay; trên trình duyệt thật: nút Bật tiếng ở màn chờ, nhớ đúng cả hai chiều qua tải lại trang, và biến mất khi dãy số đang chạy)
  - (a) Đấu dây `lib/am-thanh.ts` (**đã viết sẵn, chưa ai import**): LCD **đầy đủ** (tick cao
    dần theo tốc độ · đếm ngược · mở khoá nút · thắng · thua); điện thoại chế độ `online`
    **đầy đủ**; điện thoại chế độ `tai_quay` **rút gọn** — đếm ngược + thắng/thua, **KHÔNG
    tick**, giữ sạch đường đo thời gian. 🔴 **LCD không có cú chạm nào** (nhân viên chỉ mở
    trang rồi để đó) mà trình duyệt chặn phát tiếng nếu chưa có cử chỉ người dùng → thêm nút
    **"🔊 Bật tiếng"** trên màn chờ LCD, bấm một lần đầu ca làm, kiêm luôn công tắc tắt/bật.
    Không có nút này thì LCD **im lặng hoàn toàn mà không báo lỗi gì** — đúng họ hàng với bẫy
    `allowedDevOrigins` đã trả giá. Trạng thái tắt tiếng lưu `localStorage`.
  - (b) Mở màn LCD → thấy nút "🔊 Bật tiếng", bấm một lần. Chơi một ván → **nghe tiếng tick
    nhanh dần và cao dần** đúng theo tốc độ số chạy, nghe đếm ngược, nghe tiếng thắng. Bấm
    nút tắt tiếng → im; tải lại trang → **vẫn im** (nhớ trạng thái). Trên điện thoại tại quầy:
    nghe đếm ngược và tiếng kết quả, **không nghe tick** lúc số chạy.
  - (c) 🔴 `tests/do-chinh-xac-bam.test.ts`: chạy **200 lượt mô phỏng** có bật tiếng và không
    bật tiếng, so phân bố `soMiliGiayDaTroi` — `"lệch trung vị ≤ 8 ms"`. Vượt ngưỡng là
    **không chấp nhận được**, phải chuyển tick sang `AudioWorklet` hoặc giảm tần suất.
  - (d) 4 giờ.

---

## GIAI ĐOẠN 15 — 🔴 KHOÁ CỬA TRANG QUẢN TRỊ (2,25 ngày) · TRƯỚC KHI RA INTERNET

> **Vì sao bắt buộc trước GĐ 16–19:** mã QR dán ở quầy in thẳng `http://192.168.x.x:3000/choi/L7WH`
> **vào tay từng phụ huynh**. Ai cũng chỉ cần xoá đuôi URL, gõ `/quan-tri` là vào — không cần
> dò IP, ta vừa đưa cho họ. Hôm nay việc đó lộ tên rút gọn. Sau GĐ 16 nó lộ **toàn bộ danh bạ**:
> họ tên + SĐT + ai chăm sóc + ghi chú sale + nút tải Excel. Và GĐ 17 đẩy app ra Internet thật.

**🏁 BẠN NHÌN THẤY GÌ:** mở `/quan-tri` trong **cửa sổ ẩn danh** → bị chặn, đòi đăng nhập.
Đăng nhập bằng tài khoản sale của CS1 → **không thấy một khách nào của CS2**, và không thấy
mục Nhật ký.

- [x] **15.1 — Đăng nhập + phiên** ✅ (01/09 — 17 test; trên trình duyệt thật với cửa sổ sạch: /quan-tri và mọi trang con bị chắn, trang chơi + màn LCD KHÔNG bị chắn, chưa có tài khoản thì in thẳng câu lệnh, gõ sai báo đúng một câu không lộ tên có thật, đăng nhập xong quay về đúng trang, cookie HttpOnly + SameSite=Lax + hết hạn đúng 12 giờ, đăng xuất thì bị chắn lại. Dùng proxy.ts (Next 16 đã bỏ middleware.ts))
  - (a) `lib/bao-ve/mat-khau.ts`: băm bằng `node:crypto` `scryptSync`, lưu
    `scrypt$N$r$p$salt$hash`. `lib/bao-ve/phien-quan-tri.ts`: cookie ký **HMAC-SHA256 bằng
    Web Crypto (`crypto.subtle`)** — chạy được ở cả Edge lẫn Node runtime, khác `node:crypto`;
    `HttpOnly; SameSite=Lax; Path=/; Max-Age=12h` (đúng một ca làm). `middleware.ts` chắn
    `/quan-tri/*` và `/api/xuat/*`, trừ `/quan-tri/vao`; middleware **chỉ kiểm chữ ký cookie**,
    việc so mật khẩu nằm trong server action chạy Node runtime.
    `scripts/tao-quan-tri.mjs <tên đăng nhập>` hỏi mật khẩu qua **stdin**, không nhận qua tham
    số (tránh lọt vào `.zsh_history`). Chưa có tài khoản nào thì `/quan-tri` khoá và **in
    thẳng câu lệnh cần chạy** ra terminal lẫn màn hình.
    ⚠️ Next 16 có thay đổi phá vỡ ở middleware — **đọc `node_modules/next/dist/docs/` phần
    middleware trước khi viết**, đừng dựa vào trí nhớ.
  - (b) Mở `/quan-tri` ở **cửa sổ ẩn danh** → nhảy sang màn đăng nhập. Gõ sai mật khẩu → báo
    sai, không vào được. Chạy `node scripts/tao-quan-tri.mjs sếp` → nó **hỏi mật khẩu, không
    hiện lên màn hình**. Đăng nhập → vào được. Đóng trình duyệt mở lại sau 12 giờ → phải đăng
    nhập lại. Xoá CSDL tài khoản đi rồi mở `/quan-tri` → thấy **câu lệnh cần chạy in ra ngay
    trên màn hình**, không bị kẹt ngoài.
  - (c) `tests/phien-quan-tri.test.ts`: `"cookie ký đúng thì hợp lệ"` ·
    `"sửa một ký tự thì không hợp lệ"` · `"quá hạn thì không hợp lệ"` ·
    `"scrypt băm rồi kiểm lại đúng"` · `"mật khẩu sai không cấp cookie"`.
  - (d) 8 giờ.

- [x] **15.2 — Phân quyền theo cơ sở + màn nhân viên** ✅ (01/09 — 11 test phân quyền (lọc ở tầng SQL, gõ thẳng id khách cơ sở khác vẫn null, sale không cướp được khách sang mình, vai trò lạ thì KHÔNG thấy gì); trên trình duyệt thật với 3 tài khoản: sale CS1 không có mục Cơ sở/Nhân viên, gõ thẳng địa chỉ trả 404, mã nguồn trang không chứa tên khách CS2, và không có nút Cho nghỉ cho chính mình)
  - (a) Ba vai ở `config/to-chuc.ts`: `quan_tri` (mọi cơ sở + tài khoản + nhật ký) ·
    `quan_ly_co_so` (chỉ cơ sở của mình) · `sale` (chỉ lead **được giao cho mình**).
    🔴 **Lọc theo quyền ở TẦNG KHO (SQL), không ở tầng giao diện** — ẩn nút mà câu truy vấn
    vẫn trả đủ dòng thì dữ liệu đã nằm trong HTML gửi đi rồi. `lib/nhan-vien/kho.ts` (một bảng
    vừa là danh sách sale để gán lead vừa là tài khoản đăng nhập; `mat_khau_bam` NULL = có tên
    trong danh sách nhưng chưa được cấp quyền vào hệ thống — hai bảng riêng sẽ đẻ ra hai danh
    sách sale lệch nhau). `/quan-tri/nhan-vien`: thêm/sửa, gán cơ sở, đặt vai, cấp/thu hồi
    đăng nhập, **cho nghỉ chứ không xoá** (lead cũ phải còn dấu vết ai phụ trách).
  - (b) Tạo 3 tài khoản: một `quan_tri`, một `sale` thuộc CS1, một `sale` thuộc CS2. Đăng nhập
    bằng sale CS1 → thanh bên **không có** mục Nhật ký; vào Khách tiềm năng → **không thấy một
    dòng nào của CS2**. Thử gõ thẳng địa chỉ chi tiết một khách của CS2 → **bị chặn**. Đăng
    nhập lại bằng `quan_tri` → thấy tất cả.
  - (c) `tests/phan-quyen.test.ts`: 🔴 `"sale CS1 truy vấn không ra dòng nào của CS2"` ·
    `"sale chỉ thấy lead được giao cho mình"` · `"quan_ly_co_so thấy toàn bộ lead của cơ sở mình"` ·
    `"quan_tri thấy tất cả"` · `"cho nhân viên nghỉ không làm mất lead của họ"`.
  - (d) 6 giờ.

- [x] **15.3 — Nhật ký truy cập + quyền riêng tư dữ liệu** ✅ (01/09 — 10 test; trên trình duyệt thật: SĐT che 09*****001 (đổi từ 4 sang 2 số đầu để không lộ trọn đầu số nhà mạng, sửa cả test v1), nút Hiện đầy đủ chạy, sale bị chặn 404 ở /nhat-ky, nhật ký ghi Đăng nhập + Xem danh sách khách kèm SỐ DÒNG, xoá theo SĐT báo rõ đã xoá mấy dòng và tìm lại không còn, nhật ký chỉ lưu số ĐÃ CHE)
  - (a) Ghi `nhat_ky_truy_cap` cho: đăng nhập · xem danh sách lead · **xuất file** (kèm số
    dòng và IP) · gán lead · chạm ngưỡng hết quà. `/quan-tri/nhat-ky` chỉ `quan_tri` xem được.
    **Che SĐT mặc định** bằng `cheSdt()` ở `lib/nguoi-choi/so-dien-thoai.ts` — hàm đã viết sẵn
    mà chưa nơi nào dùng, đây đúng là chỗ của nó; kèm công tắc "Hiện đầy đủ". Nói thẳng trong
    comment: **chống người liếc qua vai ở quầy, không chống kẻ tấn công** (dữ liệu đã ở trong
    HTML). Theo NĐ 13/2023: **hạn lưu trữ lead** (đọc từ `config/to-chuc.ts`, mặc định 24
    tháng) + **nút xoá theo SĐT** xoá sạch ở cả `nguoi_choi` lẫn `khach_tiem_nang`.
  - (b) Đăng nhập, mở màn Khách tiềm năng → SĐT hiện dạng `09** *** 678`. Bấm "Hiện đầy đủ"
    → hiện hết. Đăng nhập bằng `quan_tri`, mở **Nhật ký** → thấy đúng dòng *"bạn vừa xem danh
    sách lead lúc mấy giờ"* và dòng xuất file kèm số dòng. Nhập một SĐT vào ô xoá → xác nhận
    → tìm lại số đó **không còn ở đâu**.
  - (c) `tests/nhat-ky.test.ts`: `"ghi đúng hành động và số dòng khi xuất"` ·
    `"xoá theo SĐT xoá sạch ở cả nguoi_choi lẫn khach_tiem_nang"` ·
    `"cheSdt giữ 2 số đầu và 3 số cuối"`.
  - (d) 4 giờ.

---

## GIAI ĐOẠN 16 — Khách tiềm năng (1,5 ngày)

**🏁 BẠN NHÌN THẤY GÌ:** mở **TỔ CHỨC › Khách tiềm năng**, lọc theo CS2 + khoảng ngày, thấy
danh sách có họ tên và SĐT. Giao 5 khách cho một sale bằng ô xổ xuống, rồi bấm **"Chia luân
phiên"** cho phần còn lại.

- [x] **16.1 — Sinh lead + màn lọc** ✅ (01/09 — 17 test; trên trình duyệt thật: lead sinh NGAY khi bấm TIẾP TỤC (chưa chơi ván nào), cùng SĐT ở hai cơ sở ra HAI dòng, người cũ quay lại vẫn 4 dòng và không reset trạng thái/người phụ trách, tick 'chỉ người đồng ý' bật sẵn (3 dòng) bỏ tick thành 4, lọc theo cơ sở chạy đúng)
  - (a) `lib/lead/kho.ts`. Lead sinh tại `nhanDienNguoiChoi` — **ngay khi phụ huynh bấm TIẾP
    TỤC ở form**, trước cả khi biết có được chơi hay không: người bị chặn bởi luật 1 ván/ngày
    **đã đưa số rồi**, tạo lead chỉ khi chơi thành công là làm rơi mất nhóm quay lại lần hai —
    nhóm quan tâm nhất. Chữ ký đổi thành `nhanDienNguoiChoi(ma, hoTen, sdt, dongY, coSoId?)`
    → **phải sửa chỗ gọi ở `man-dien-thoai.tsx`**. Khoá `UNIQUE(co_so_id, nguoi_choi_id)`:
    một phụ huynh × một **cơ sở** = một lead (cùng SĐT chơi ở 2 cơ sở → **2 lead**, vì hai đội
    sale khác nhau; chơi nhiều ngày → **1 lead**, `sua_luc` đẩy lên, nếu không sale gọi chị Hoa
    5 lần). `on conflict do update set sua_luc = excluded.sua_luc` — **không được đụng**
    `nhan_vien_id`, `trang_thai`, `ghi_chu`: khách quay lại lần hai không được làm trạng thái
    "Đã chốt" tụt về "Mới". Trạng thái: `moi` · `da_lien_he` · `hen_hoc_thu` · `khong_nghe_may`
    · `chot` · `bo` (`khong_nghe_may` **cố ý không** phải trạng thái đóng — gọi lại lần hai là
    bình thường). `/quan-tri/khach-tiem-nang` với bộ lọc ghép động: cơ sở · chương trình ·
    khoảng ngày · trạng thái · sale · chưa giao · **"chỉ người đồng ý nhận tư vấn" BẬT SẴN**
    (muốn xem hết phải chủ động bỏ tick). Cột "số chưa xác thực" cho lead đến từ chế độ online.
  - (b) Chơi thử 3 lượt bằng 3 SĐT khác nhau, trong đó một SĐT chơi ở hai chương trình thuộc
    **hai cơ sở khác nhau**. Mở màn Khách tiềm năng → thấy **4 dòng** (SĐT kia thành 2 lead).
    Chơi lại bằng SĐT cũ ngày hôm sau → **vẫn 4 dòng**, chỉ đổi cột "gần nhất". Bỏ tick "chỉ
    người đồng ý" → thấy thêm những người không tick ô đồng ý.
  - (c) `tests/lead.test.ts`: `"nhận diện lần đầu sinh lead trạng thái moi"` ·
    🔴 `"chơi lại hôm sau vẫn 1 lead, trang_thai và nhan_vien_id KHÔNG bị reset"` ·
    🔴 `"cùng SĐT ở 2 cơ sở sinh 2 lead"` · `"người chơi ẩn danh không sinh lead"` ·
    `"thống kê số lượt chỉ tính lượt của đúng cơ sở đó"` · một ca cho **từng** bộ lọc.
  - (d) 6 giờ.

- [x] **16.2 — Gán sale + chia luân phiên** ✅ (01/09 — 15 test, gồm bài canh riêng chứng minh chia hai tuần liên tiếp ra 3–3 chứ không phải 4–2 như modulo; trên trình duyệt thật: gán tay một dòng rồi Chia luân phiên thì dòng đã gán KHÔNG bị cướp, bấm lần hai báo 'Không còn khách nào chưa giao', chưa chọn cơ sở thì nhắc chọn, ghi chú + đổi trạng thái tải lại vẫn còn)
  - (a) Ô xổ xuống chọn sale trên **từng dòng**. `lib/lead/chia-luan-phien.ts`:
    `chiaVong(sale, leadId)` là **hàm thuần** (test được không cần DB) — sắp sale theo
    `(soLeadDangGiu ↑, id ↑)` rồi rải lead cũ nhất trước. **Vì sao không modulo thuần:** bấm
    mỗi tuần một lần, 3 lead / 2 sale → sale #1 **luôn** nhận 2, sale #2 **luôn** nhận 1; sau
    10 tuần chênh 10 khách. Sắp theo tải hiện có thì tự cân bằng. Chỉ lấy lead
    `nhan_vien_id IS NULL` **và** `trang_thai NOT IN ('chot','bo')`. Toàn bộ trong một giao
    dịch. Ba ca phải báo bằng câu tiếng Việt chứ **không im lặng**: chưa chọn cơ sở · cơ sở
    không có sale nào đang làm · không còn lead chưa giao. Thêm ô ghi chú và ô đổi trạng thái
    trên từng dòng.
  - (b) Lọc theo CS2, chọn sale cho 2 dòng bằng tay. Bấm **"Chia luân phiên cho sale đang bật"**
    → xác nhận → các dòng **chưa giao** được chia đều, **2 dòng đã giao tay không bị cướp**.
    Bấm lần nữa → báo *"Không còn khách nào chưa giao"*. Tắt hết sale của CS2 rồi bấm → báo
    *"Cơ sở này chưa có sale nào đang làm việc"*. Đổi một dòng sang "Đã chốt", ghi chú
    "hẹn thứ 7" → tải lại trang, vẫn còn.
  - (c) `tests/chia-luan-phien.test.ts`: `"5 lead 2 sale chia 3+2"` ·
    🔴 `"sale đang giữ 4 và sale giữ 0 thì người rỗng nhận trước"` ·
    `"0 sale trả mảng rỗng, không ném"` · `"lead chot/bo không bị chia"` ·
    `"lead đã có sale không bị cướp"` · `"chạy hai lần lần hai không đổi gì"`.
  - (d) 6 giờ.

---

## GIAI ĐOẠN 17 — Chế độ chơi ONLINE (2 ngày)

**🏁 BẠN NHÌN THẤY GÌ:** mở link trên điện thoại **mà không bật màn LCD nào** → dãy số chạy
ngay trên máy bạn, chọn cơ sở gần nhà từ danh sách, chơi trọn ván. Hai người mở cùng lúc đều
chơi được, không ai phải chờ ai.

- [x] **17.1 — Điện thoại tự hiện dãy số** ✅ (01/09 — 13 test (online không giữ chỗ, hai người cùng lúc đều mở được ván, tại quầy vẫn một ghế, trọng tài cho kết quả giống nhau); trên trình duyệt thật: KHÔNG mở màn LCD nào mà dãy số vẫn chạy ngay trên điện thoại (4 → 7), hai máy cùng chơi được, tại quầy máy thứ hai vẫn bị báo bận và KHÔNG vẽ bảng số. Nhịp vẽ đổi sang requestAnimationFrame cho online; xoá 2 component tàn dư nut-choi/man-ket-qua)
  - (a) Chế độ `online`: điện thoại render `components/led-4-so.tsx` (đã tách sẵn) và tự chạy
    bảng số bằng chính `lib/bo-dem.ts`; **bỏ giữ chỗ** (`giuCho`) và **không cần SSE** — ai
    vào cũng chơi ngay, không hàng đợi. Trọng tài giữ nguyên: `moLuot` → `dungLuot` với
    `soMiliGiayDaTroi` do máy bấm đo và máy chủ kẹp lại. Âm thanh **đầy đủ** ở chế độ này.
    **Đọc trước khi viết:** `components/nut-choi.tsx` và `components/man-ket-qua.tsx` là tàn
    dư của bản một-thiết-bị cũ, không nơi nào import (đang gọi vài class không tồn tại:
    `bg-nen-nhat`, `ring-vien`, `text-chu`) — hồi sinh rẻ hơn viết mới; không dùng được thì
    **xoá hẳn**, đừng để đó.
  - (b) Tạo chương trình chế độ **Online**. **Đóng hết màn LCD.** Mở link `/choi/<mã>` trên
    điện thoại → thấy bảng số chạy **ngay trên điện thoại**. Chơi trọn ván. Mở **cùng lúc**
    trên điện thoại thứ hai → **cả hai đều chơi được**, không máy nào báo "đang có người chơi".
    Tạo một chương trình **Tại quầy** → mở hai điện thoại → máy thứ hai **vẫn bị báo bận**
    (chế độ cũ không đổi hành vi).
  - (c) `tests/che-do-choi.test.ts`: 🔴 `"online không đòi giữ chỗ"` ·
    🔴 `"hai người online cùng lúc đều mở được ván"` · `"tai_quay vẫn chỉ một ghế"` ·
    `"trọng tài dungLuot cho kết quả giống nhau ở cả hai chế độ"`.
  - (d) 10 giờ.

- [x] **17.2 — Phụ huynh tự chọn cơ sở + đánh dấu số chưa xác thực** ✅ (01/09 — cùng bộ 13 test; trên trình duyệt thật: chế độ tự chọn hiện danh sách 'CS2 — 114 Hoàng Diệu, Đà Nẵng' và không có lựa chọn để trống, chơi xong lọc CS2 thấy đúng khách kèm nhãn 'Số chưa xác thực'; chế độ gán sẵn KHÔNG hỏi cơ sở và bỏ qua cơ sở máy khách tự khai)
  - (a) Chế độ `nguon_co_so = 'phu_huynh_chon'`: form nhập thông tin thêm **danh sách xổ
    xuống** `CS1 — 211 Nguyễn Hữu Thọ, Đà Nẵng` / `CS2 — 114 Hoàng Diệu, Đà Nẵng` (chỉ cơ sở
    đang bật, nhãn `nhanCoSo()`), **bắt buộc chọn**, không có "để trống". Chế độ `gan_san`
    thì **không hỏi gì**. Lưu cơ sở đã phân giải vào `van_choi.co_so_id` — báo cáo "lead theo
    cơ sở" chạy giống nhau ở cả hai chế độ, và lịch sử không sai khi ai đó đổi cấu hình về sau.
    Lead đến từ chế độ online gắn cờ **"số chưa xác thực"**.
    ⚠️ Ghi rõ vào README: online **không xác thực SĐT**, giới hạn 1 ván/ngày chỉ cần gõ số
    khác là qua. v2 chấp nhận và **lọc sau** (sale đánh dấu "không liên lạc được", báo cáo
    hiện tỉ lệ số hỏng); OTP nằm ở `N.9`.
  - (b) Tạo chương trình Online + *Để phụ huynh tự chọn* → mở link, thấy **danh sách địa chỉ**
    ngay trong form nhập tên. Chọn CS2, chơi xong → mở màn Khách tiềm năng, lọc CS2 → **thấy
    đúng khách vừa chơi**, có nhãn *số chưa xác thực*. Tạo chương trình Online + *Gán sẵn* →
    mở link → **không hỏi cơ sở**, và lead vẫn về đúng cơ sở đã gán.
  - (c) `tests/nguon-co-so.test.ts`: `"gan_san không đòi coSoId từ máy khách"` ·
    `"phu_huynh_chon từ chối khi thiếu coSoId"` · `"từ chối cơ sở đang tắt"` ·
    `"van_choi.co_so_id lưu đúng cơ sở đã phân giải ở cả hai chế độ"`.
  - (d) 6 giờ.

---

## GIAI ĐOẠN 18 — 🛑 Lên máy chủ thật (1 ngày)

**🏁 BẠN NHÌN THẤY GÌ:** **tắt wifi trên điện thoại, dùng 4G**, gõ địa chỉ web thật → chơi
được. Rồi bạn deploy lại một lần nữa và **chương trình vừa tạo vẫn còn nguyên**.

- [x] **18.1a — Chạy trên MÁY LOCAL tại quầy** ✅ (01/09 — bạn chốt dùng tạm máy local làm
  máy chủ, nên phần VPS tách ra thành `18.1b` bên dưới). `npm run trung-tam` giờ lo trọn:
  sao lưu → dựng → chạy `0.0.0.0` → in địa chỉ LAN. Ba lỗ đã vá:
  · 🔴 **tự sinh và GIỮ khoá ký phiên** ở `du-lieu/khoa-phien.txt` (0600, đã gitignore) —
  trước đó thiếu khoá là **không ai đăng nhập được** mà màn hình không nói cách sửa; sinh
  mới mỗi lần khởi động thì đá văng mọi phiên đang mở. Đã kiểm: đăng nhập được thật.
  · gọi thẳng `node_modules/.bin/next` thay `npx` (Ctrl-C giết vỏ, `next-server` sống tiếp
  và giữ cổng) · đọc CSDL ở chế độ **chỉ đọc** và theo `duongDanCsdl()` thay đường dẫn cứng.
  Thêm `npm run kiem-may-chu` (18.1c): `/api/gio` 200 · `/quan-tri` **307 →** `/quan-tri/vao` ·
  `/api/xuat/*` **401** · trang công khai không bị chắn — **5/5 đạt trên máy chủ thật**.
  Màn hình cảnh báo rõ **đang chạy LAN, KHÔNG có HTTPS, đừng mở ra Internet**.
  `docs/sop/KHOI-PHUC-CSDL.md` — quy trình khôi phục, kèm ca đã trả giá thật.
- [ ] **18.1b — 🛑 Lên VPS: đóng gói + ổ đĩa bền + HTTPS + sao lưu ra ngoài**
  - (a) `Dockerfile` base **`node:24`** (`node:sqlite` chưa ổn định ở bản thấp hơn — dùng
    `node:22` là gãy ngay lúc khởi động, may là gãy to chứ không âm thầm). 🔴 **Gắn volume
    vào đúng thư mục `du-lieu/`** — quên là mất sạch dữ liệu mỗi lần deploy, **im lặng, app
    vẫn chạy, chỉ là trắng trơn**. 🔴 **Khoá đúng MỘT instance, tắt autoscale** — `tram-phat`
    là Map trong bộ nhớ và SQLite là single-writer; nền tảng tự nhân bản là hỏng cả SSE lẫn
    dữ liệu. HTTPS do nền tảng cấp hoặc Caddy tự xin chứng chỉ (**bắt buộc** — đang truyền
    SĐT phụ huynh). Rate limit `/api/*` + server action ở biên; đặt Cloudflare trước VPS để
    giấu IP gốc. Biến môi trường: `GAME_SU_KIEN_CSDL` trỏ vào volume · khoá HMAC phiên ·
    `GAME_SU_KIEN_SAO_LUU`. 🔴 **"Ổ đĩa bền" ≠ "có bản sao"** — volume vẫn mất cùng máy chủ,
    nên `npm run sao-luu` phải chạy theo lịch và đẩy **ra khỏi máy đó** (rclone/rsync lên
    object storage). `docs/sop/` thêm quy trình khôi phục.
  - (b) Deploy xong: **tắt wifi điện thoại, dùng 4G**, mở địa chỉ web thật → chơi trọn ván.
    Kiểm ổ khoá HTTPS trên thanh địa chỉ. Sau đó: **tạo một chương trình mới → deploy lại →
    mở lại trang → chương trình đó CÒN SỐNG** (đây là bài kiểm volume, không được bỏ). Vào
    nơi để sao lưu → thấy file `.db` mới sinh hôm nay. Mở `/quan-tri` từ máy lạ → **bị đòi
    đăng nhập** (GĐ 15 đã khoá).
  - (c) `npm run build` trong container xanh · script kiểm sau deploy: gọi `/api/gio` trả 200,
    `/quan-tri` trả 302 về `/quan-tri/vao` khi không có cookie.
  - (d) 6 giờ.
  - **🛑 DỪNG BẮT BUỘC:** thuê VPS, mở tên miền, deploy — tác động ra ngoài máy **và** phát
    sinh chi phí hằng tháng. Cần bạn duyệt (`N.6`).
  - **Vì sao vẫn cần dù đã chạy được ở quầy:** chế độ LAN **không có HTTPS**, nên chỉ dùng
    trong wifi trung tâm. Chế độ chơi **ONLINE** (GĐ 17 — link quảng cáo, người lạ mở từ 4G)
    bắt buộc phải có tên miền + HTTPS: đường truyền đang đi qua họ tên và số điện thoại
    phụ huynh. Và `N.7` — bản sao lưu vẫn nằm trên cùng cái máy, máy hỏng là mất cả hai.

---

## GIAI ĐOẠN 19 — Xuất Excel thật (1,25 ngày)

**🏁 BẠN NHÌN THẤY GÌ:** bấm **"Xuất Excel"**, mở file bằng Excel hoặc Numbers → **không có
hộp thoại báo lỗi nào**, chữ tiếng Việt đúng dấu, và số `0912345678` **vẫn còn số 0 ở đầu**
(lỗi mà CSV đang gây ra).

- [x] **19.1 — Bộ ghi XLSX tự viết** ✅ (01/09 — 28 test (9 ZIP mức byte + 19 XLSX); dựng ZIP thủ công bằng zlib.crc32 + deflateRawSync, giải nén ngược khớp nội dung, hai lần chạy ra byte y hệt; canh riêng cả bốn cạm bẫy làm Excel từ chối cả file. ⚠️ Bước (b) mở bằng Excel/Sheets/Numbers là NGHIỆM THU TAY — file mẫu đủ 4 ca khó đã sinh sẵn, xem BÀN GIAO)
  - (a) `lib/xuat/zip.ts` (~90 dòng): dựng ZIP thủ công bằng `zlib.deflateRawSync` +
    `zlib.crc32` (**đã xác minh có trong Node 24**). Tham số `luc` mặc định một mốc **cố định**
    để hai lần chạy cho ra byte y hệt — nhờ vậy test so được cả mã băm.
    `lib/xuat/xlsx.ts` (~160 dòng): 5 file XML, **bỏ hẳn `sharedStrings.xml`** dùng inline
    string (`<c t="inlineStr">`) — Excel/Sheets/Numbers đều đọc được, bớt một file XML và cả
    lượt gom chuỗi trùng. 4 kiểu ô `chu | so | gio | trong`, 4 style. **SĐT dùng kiểu `chu` +
    định dạng `@`** → giữ số 0 đầu. Serial ngày `(ms + 7*3_600_000)/86_400_000 + 25569`
    (Excel không có múi giờ). Thêm `<autoFilter>` + đông cứng hàng tiêu đề — gần như miễn phí,
    đội sale hưởng ngay.
    🔴 Bốn cạm bẫy, sai là Excel báo *"unreadable content"* và từ chối **cả file**: escape
    `& < > "` · **loại ký tự điều khiển < 0x20** (trừ tab/LF/CR — họ tên gõ trên điện thoại
    hoàn toàn có thể dính) · tên trang tính ≤ 31 ký tự không chứa `: \ / ? * [ ]` ·
    `[Content_Types].xml` đứng đầu ZIP.
  - (b) *(nghiệm thu tay, làm MỘT LẦN rồi đóng băng)* Xuất một file có ít nhất một dòng chứa
    **dấu tiếng Việt**, một **dấu `&`**, một **SĐT** và một **ô rỗng** → mở bằng **Excel
    (Windows)**, **Google Sheets** và **Numbers (macOS)** → không hộp thoại sửa lỗi, chữ có
    dấu đúng, SĐT còn số 0 đầu, cột giờ **sắp xếp được như ngày tháng** chứ không như chữ.
  - (c) `tests/zip.test.ts`: `"PK\x03\x04 ở 4 byte đầu"` · `"tìm thấy EOCD ở cuối"` ·
    `"số bản ghi central directory bằng số file"` · `"giải nén ngược bằng inflateRawSync trả đúng nội dung"` ·
    `"CRC khớp zlib.crc32"` · `"chạy hai lần cho ra hai Uint8Array bằng nhau"`.
    `tests/xlsx.test.ts`: `"đủ 6 file đúng đường dẫn"` · 🔴 `"ô SĐT có s=2 và giữ nguyên 0912345678"` ·
    `"ô giờ có s=3 và serial khớp mốc đã biết"` · `"escape & < >"` ·
    🔴 `"ký tự điều khiển \x07 bị loại bỏ"` · `"0 dòng dữ liệu vẫn ra file hợp lệ"` ·
    `"tên trang tính dài hơn 31 ký tự bị cắt"`.
  - (d) 6 giờ.

- [x] **19.2 — Ba điểm xuất + xoá CSV** ✅ (01/09 — 10 test ba bảng xuất; trên trình duyệt thật: chưa đăng nhập thì route trả 401 (không trả HTML), file tải về khớp ĐÚNG số dòng đang hiện trên màn (3=3 khi không lọc, 1=1 khi lọc CS2), SĐT giữ số 0 đầu ở kiểu chữ s=2, cột giờ kiểu ngày s=3, nhật ký ghi đủ mọi lần xuất kèm số dòng. Đã xoá route xuat-csv cũ)
  - (a) `lib/xuat/bang-lich-su.ts` · `bang-lead.ts` · `bang-kho-qua.ts` (đổi dữ liệu →
    `TrangTinh`). Ba route: `/api/xuat/chuong-trinh/[ma]` (thay `xuat-csv`, **xoá file cũ**) ·
    `/api/xuat/khach-tiem-nang` **nhận đúng bộ lọc đang hiện trên màn qua query string** —
    "xuất cái tôi đang nhìn", không phải "xuất tất cả" · `/api/xuat/kho-qua/[ma]` (tồn kho +
    đã trao, để đối soát ngân sách). Header
    `content-type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`. Mỗi lần
    xuất **ghi một dòng nhật ký** kèm số dòng và IP (GĐ 15.3). Cột "Đồng ý nhận tư vấn" luôn
    có mặt để người nhận file biết ai được phép gọi.
  - (b) Mở màn Khách tiềm năng, **lọc theo CS2 + trạng thái "Mới"**, bấm Xuất Excel → file tải
    về chỉ chứa **đúng những dòng đang hiện trên màn**, không phải toàn bộ. Vào một chương
    trình bấm Xuất Excel → được lịch sử ván. Mở Nhật ký → thấy **hai dòng xuất file** vừa rồi.
  - (c) `tests/bang-lead.test.ts` + `tests/bang-lich-su.test.ts`: `"đúng số cột và thứ tự"` ·
    `"ô rỗng ra kiểu trong"` · `"SĐT ra kiểu chu chứ không phải so"` ·
    `"bộ lọc truyền vào ảnh hưởng đúng số dòng xuất"`.
  - (d) 4 giờ.

---

## GIAI ĐOẠN 20 — Nghiệm thu bằng mắt + sổ sách (1,5 ngày)

**🏁 BẠN NHÌN THẤY GÌ:** 13 tấm ảnh chụp xếp cạnh nhau; thu nhỏ xuống 25% (giả lập đứng 3–4
mét) **4 chữ số vẫn là thứ đập vào mắt đầu tiên**, logo và linh vật không giành mất chỗ.

- [x] **20.1 — Chụp 13 ảnh + ba phép soi** ✅ (01/09 — `npm run anh-chup` sinh **15 ảnh**
  vào `app/tests/anh-chup/`. **Ba phép soi ĐỀU ĐẠT, đã có thương hiệu trong khung:**
  (1) ảnh `0000` đọc ra đúng `0000` ở CẢ màn LCD lẫn màn điện thoại, không thành `8888`;
  (2) thu nhỏ 25% — bảng LED vẫn đập vào mắt đầu tiên, logo và linh vật không giành chỗ;
  (3) chuyển xám — bảng LED là vật tương phản cao nhất, linh vật chìm hẳn.
  Chấm chỉ báo kho ở 25% **biến mất hoàn toàn**. Đo mạng: mọi ảnh **image/webp**, nặng nhất
  **18 KB** (ngưỡng 60/20 KB), và **không một request ảnh nào** trong lúc `dang-chay`.
  `6.1` đã tách ra và **tick riêng** (14 kịch bản e2e, `npm run e2e`).)
  - (a) Dựng cảnh: `node scripts/tao-thu.mjs 0114 thu` (mức `thu` = 8 số/giây, đọc được từng
    con; `0114 < 1440` nên số cài chắc chắn lướt qua) + `npm run dev`. Chưa có Playwright trong
    repo **nhưng** `~/Library/Caches/ms-playwright/` đã có sẵn chromium/webkit → dùng skill
    `webapp-testing`, **không thêm dependency**. Chụp: LCD `cho` · `dem-nguoc` ·
    **`chay` với giá trị `0000`** · `ket-qua` thắng · `ket-qua` thua · `cho` với chấm chỉ báo
    đỏ · ĐT tại quầy `nhap-thong-tin` · `dang-chay` · **giữa ván "Lần 2/3"** · `ket-qua` thắng
    · `ket-qua` thua · **ĐT online `dang-chay`** · **ĐT online chọn cơ sở**.
  - (b) **Ba phép soi bắt buộc** — dự án đã trả giá đúng bài này (*"bảng LED vẽ đoạn tắt quá
    sáng thì `0000` đọc thành `8888`, chỉ lộ ra khi nhìn ảnh chụp thật, build và test đều
    xanh"*), và v2 **làm sáng cả màn hình lên**:
    **(1)** nhìn ảnh `0000` ở cả LCD lẫn ĐT online (màn nhỏ còn dễ nhoè hơn) — phải đọc ra
    `0000`, không phải `8888`.
    **(2)** thu nhỏ ảnh xuống **25%** — 4 chữ số phải đập vào mắt **đầu tiên**; nếu logo hoặc
    linh vật sống sót tốt hơn chữ số thì **sai tỉ lệ, thu nhỏ hình lại**.
    **(3)** chuyển ảnh sang **xám** — bảng LED phải là vật thể tương phản cao nhất; nếu linh
    vật kéo mắt trước thì sửa **vị trí và kích thước**, tuyệt đối **không sửa ảnh**.
    Thêm: chấm chỉ báo kho ở 25% phải **không nhận ra được** — nếu vẫn thấy rõ chấm đỏ thì nó
    hết "kín", phải thu nhỏ hoặc giảm tương phản. Và: DevTools **Slow 4G** đi hết
    `/choi/<mã>` → linh vật ≤ **60 KB**, logo ≤ **20 KB**, `image/webp`; trong khoảng
    `dang-chay` **không một request ảnh nào**.
  - (c) `npm run lint && npm test && npm run build` xanh · `node scripts/check-structure.mjs`
    xanh · gộp nốt `6.1` còn dở của v1: chuyển kịch bản e2e từ thư mục nháp thành
    `tests/e2e/trung-so.spec.ts` và chạy `npx playwright test` xanh.
  - (d) 8 giờ.

- [x] **20.2 — 8 ADR + tài liệu** ✅ (01/09 — 8 ADR thật ở docs/decisions/ (ADR-001…008), adrCount = 8, check-structure xanh 55 mục; cập nhật app/CLAUDE.md (2 luật mới + 6 cạm bẫy mới + biến môi trường), OVERVIEW module (mục 5-6, kèm bảng CÒN LẠI và lý do chặn), README hướng dẫn nhân viên 120 dòng)
  - (a) `docs/decisions/` hiện **chưa có ADR thật nào** (chỉ có file mẫu) — viết 8 cái và tăng
    `adrCount` trong `.claude/scaffold.json`:
    **ADR-001** đảo GĐ 5.1, màn thua không còn là cửa bán hàng (lead vẫn thu ở form trước ván) ·
    **ADR-002** câu định vị "Đào tạo tài năng công nghệ tương lai" đứng cạnh Brand Essence
    "Khơi nguồn sáng tạo – Chắp cánh tương lai": ranh giới dùng ở đâu, **cập nhật brand doc để
    hai nơi không lệch** · **ADR-003** bảng `nhan_vien` gộp danh sách sale và tài khoản đăng
    nhập · **ADR-004** đảo GĐ 1, thêm chế độ `online`, vì sao **vẫn giữ** chế độ `tai_quay`
    (đòn bẩy "một cú bấm có khán giả" ở BRD §1.1) · **ADR-005** một app chứa nhiều game ·
    **ADR-006** ván N lần bấm + bảng tỉ lệ `1−(1−p)^N` và hệ quả ngân sách · **ADR-007** kho
    quà xếp thứ tự + loại đáy không giới hạn: **vì sao KHÔNG ép kết quả thành thua khi hết
    quà** (người chơi nhìn thấy hai con số khớp nhau trên cùng một màn hình, và câu hỏi NĐ
    81/2018 vẫn treo) · **ADR-008** chạy VPS giữ SQLite thay vì chuyển Supabase, kèm ba ràng
    buộc đánh đổi (**một instance · không scale ngang · sao lưu là việc của mình**) và điều
    kiện để đảo lại quyết định.
    Cập nhật: `OVERVIEW.md` module cha + 2 module con (mục 5–6 đang lỗi thời, dừng ở 30/08) ·
    BRD thêm § chế độ chơi + § luật N lần bấm + § kho quà · `app/CLAUDE.md` mục cạm bẫy ·
    `CLAUDE.md` gốc (TRẠNG THÁI / QUYẾT ĐỊNH / CẢNH BÁO) · README hướng dẫn nhân viên.
  - (b) Mở `docs/decisions/` thấy 8 file ADR thật. Đọc ADR-007 → hiểu ngay **vì sao hết quà
    thì tụt xuống loại đáy chứ không báo thua**. Mở `PLAN.md` gốc → nó **trỏ sang file này**,
    không chép lại danh sách (chép là dựng bản sao thứ hai, và hai bản chỉ lệch vào đúng ngày
    ai đó sửa một bản).
  - (c) `node scripts/check-structure.mjs` xanh với `adrCount` mới.
  - (d) 4 giờ.

---

## Việc KHÔNG PHẢI của lập trình — làm SONG SONG, mở ngay từ ngày 1

- [ ] **N.1 — 🔴 Hỏi luật về khuyến mại may rủi** (NĐ 81/2018). Treo từ v1, chưa ai trả lời.
  **v2 gấp hơn hẳn** vì chế độ online chạy quảng cáo công khai — chơi trong sảnh thì ít ai để
  ý, chạy ads là tự bật đèn. **Chưa có câu trả lời thì không được tiêu đồng quảng cáo nào.**
  Đây là điểm dừng của *bạn*, code chạy được không có nghĩa là được phép chạy quảng cáo.
- [ ] **N.2 — Chốt ngân sách giải thưởng bằng con số:** giá trị mỗi giải × trần tổng × số cơ
  sở. GĐ 13 xây xong công cụ đếm và dự báo, nhưng **chưa ai quyết con số để đếm**.
- [ ] **N.3 — Quyết xử lý khi trẻ em chơi.** Học sinh cấp 1–2 chắc chắn sẽ cầm điện thoại.
  Liên quan NĐ 13/2023 về dữ liệu cá nhân trẻ em.
- [ ] **N.4 — Danh sách cơ sở thật** (mã · tên · địa chỉ đầy đủ) để nhập ở GĐ 11. Mới biết 2:
  `CS1 — 211 Nguyễn Hữu Thọ, Đà Nẵng` · `CS2 — 114 Hoàng Diệu, Đà Nẵng`.
- [ ] **N.5 — Danh mục quà thật + số lượng + loại đáy không giới hạn** cho mỗi chương trình.
  Cần trước khi nghiệm thu GĐ 13. **Không có loại đáy thì Đ13 không chạy được.**
- [ ] **N.6 — Tài khoản VPS có ổ đĩa bền + tên miền** (~$5–20/tháng + ~300k/năm). Cần trước
  GĐ 18; không chặn GĐ 17 vì chế độ online thử trọn vẹn được trên LAN.
- [ ] **N.7 — Nơi để bản sao lưu ngoài máy** (object storage / Drive / ổ cứng ngoài). Cần cho
  GĐ 7.1. **Rẻ nhất trong danh sách và bảo vệ thứ đắt nhất.**
- [x] **N.11 — HAI FILE ẢNH NHẬN DIỆN** ✅ (01/09 — bạn chỉ đúng chỗ: **ID Drive nằm ngay
  trong file branding của dự án**, `rule/UI/SATA ROBO — BRAND DNA…` § 5.1 (logo) và § 15
  (mascot) — không phải tìm mò trên Drive. Đã kéo về `app/public/thuong-hieu/`, provenance
  (Drive id · ngày · sha256) ở `config/tai-san.ts`. Tư thế linh vật: **ĂN MỪNG**, nên nó
  chỉ dùng ở màn chờ · bước nhập thông tin · màn THẮNG — cấm ở màn thua.)
- [ ] **N.8 — Xin chủ thương hiệu xuất thêm 2 tư thế linh vật** (chào + chỉ tay — tư thế
  **ăn mừng** đã có ở `N.11`). `config/tai-san.ts` map `tênTưThế → import` nên thêm sau chỉ
  là một dòng. Có tư thế trung tính rồi thì linh vật mới đặt được ở màn thua.
- [ ] **N.9 — Quyết có mua OTP SMS/Zalo không.** Chế độ online **không xác thực SĐT**, giới
  hạn 1 ván/ngày chỉ cần gõ số khác là qua → ngân sách quà mất van chặn thật và lead có số
  rác. v2 chấp nhận + lọc sau; nâng lên OTP khi chiến dịch đủ nghiêm túc để trả tiền tin nhắn.
- [x] **N.10 — Dọn nợ kỹ thuật cũ** ✅ (01/09 — đếm lại thì **46 khoá** mồ côi chứ không
  phải 35; xoá hết, 384 → 338 khoá. Thêm `tests/locale.test.ts` canh không tái diễn — đã thử
  cắm một khoá rác vào để chứng minh nó đỏ thật, không phải test cho có. Xoá `out/` (1,0 MB
  build tĩnh cũ, bên trong còn `cai-dat/` của route đã bị xoá; `next.config.ts` ghi rõ không
  dùng `output: "export"` nữa nên nó không bao giờ sinh lại). Bổ sung 6 màu chỉ-có-trong-CSS
  vào `config/thuong-hieu.ts` (`timNhat` · `luc` · `do` · `led` · `ledMo` · `ledNen`) và thêm
  `--color-trang` vào `@theme`; `tests/thuong-hieu.test.ts` canh **hai chiều** + giá trị hex,
  cũng đã thử làm lệch để xem nó bắt.
  **Vá thêm ngoài phạm vi mục này:** `T.appName` vẫn là **"Bộ đếm may mắn"** — tên v1, mà nó
  chính là `title` tab trình duyệt; GĐ 9 đổi nhãn sang "Trúng Số" nhưng bỏ sót đúng khoá này.
  Đổi luôn, kèm log `instrumentation.ts` và chú thích `thuong-hieu.ts` còn xưng "ĐẾM SỐ".)

---

## TỔNG KẾT

> **TIẾN ĐỘ 01/09/2026 — cập nhật TAY (dự án không có script sinh tiến độ).**
> Toàn sổ: **41 / 51 mục đã tick**. Hạng mục thi công (GĐ 1–20): **30/31 xong**, chỉ còn
> `18.1b` chờ VPS. Test **93 → 366** (33 file) · **14/14 e2e** · build 18 route.
> 🔴 **PHẦN MÁY ĐÃ HẾT.** 10 mục chưa tick đều chặn ở NGƯỜI hoặc NGOÀI — xem BÀN GIAO ý 2.
> Đừng đọc con số này thành "còn việc code": ngày công của sổ tính cả việc người và việc
> mua ngoài, nên một sổ hết sạch việc máy vẫn đọc lên như đang dở.

| Giai đoạn | Nội dung | Ước lượng | Trạng thái |
| --------- | -------- | --------- | ---------- |
| **7** | **🔴 Sao lưu + thước đo ghi danh** | **0,75 ngày** | ✅ xong |
| 8 | Màn thua + 3 lỗi + bật/tắt | 0,75 ngày | ✅ xong |
| **9** | **🛑🔴 Đổi tên module + CSDL + repo** | **1 ngày** | ✅ xong (9.3 hoãn) |
| **10** | **🔴 Nâng cấp lược đồ trên DB thật** | **1,25 ngày** | ✅ xong |
| 11 | Cơ sở có mã CS1/CS2 | 0,75 ngày | ✅ xong |
| 12 | Ván nhiều lần bấm + bảng tỉ lệ | 1,75 ngày | ✅ xong |
| 13 | Kho quà + trần + cảnh báo | 1,25 ngày | ✅ xong |
| 14 | Thương hiệu + âm thanh | 2,5 ngày | ✅ xong |
| **15** | **🔴 Khoá cửa trang quản trị** | **2,25 ngày** | ✅ xong |
| 16 | Khách tiềm năng | 1,5 ngày | ✅ xong |
| 17 | Chế độ chơi online | 2 ngày | ✅ xong |
| **18** | **🛑🔴 Lên máy chủ thật** | **1 ngày** | ⏳ 18.1a xong (máy local tại quầy) · **18.1b chờ VPS** |
| 19 | Xuất Excel | 1,25 ngày | ✅ xong (19.1b nghiệm thu tay) |
| 20 | Nghiệm thu bằng mắt + 8 ADR | 1,5 ngày | ✅ xong |
| | **Tổng** | **~19,5 ngày** | **41/51 mục toàn sổ** |

**Luật tick:** chỉ đánh `[x]` khi **(b) đã bấm thật bằng tay** và **(c) đã xanh**. Cấm tick
theo cảm giác. Xong hạng mục nào thì ghi ngày + bằng chứng vào ngay sau tiêu đề hạng mục đó.

**Sáu điểm 🛑 DỪNG BẮT BUỘC chờ người duyệt:** cuối `7.1` (xác nhận phục hồi được thật) ·
`9.3` (đổi tên repo + push) · cuối `10.1` (chạy backfill trên bản sao trước khi chạm file
thật) · `18.1` (thuê VPS + deploy + chi phí tháng) · **`16` không được lên máy chạy thật
trước khi `15` xong** · **`N.1` phải có câu trả lời trước đồng quảng cáo đầu tiên**.
