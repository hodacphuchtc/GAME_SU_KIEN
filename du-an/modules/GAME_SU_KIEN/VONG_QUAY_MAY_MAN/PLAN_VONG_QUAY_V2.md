# VÒNG QUAY MAY MẮN — Lộ trình v2

**Mục tiêu:** đưa Vòng Quay về CHUNG một ứng dụng với Trúng Số và Chọn Số — một lần đăng
nhập, một kho khách, menu "Game sự kiện" ba game — rồi dựng lại giao diện theo bộ nhận diện
Sata Robo và bổ sung bốn nhóm tính năng anh Phúc yêu cầu sau buổi test 02/09/2026.

**Kiến trúc:** Vòng Quay **chuyển hẳn vào `modules/GAME_SU_KIEN/app/`**, rẽ nhánh bằng cột
`chuong_trinh.tro_choi = 'vong_quay'` — đúng cách game Chọn Số đã làm. Điều này **ĐẢO ADR-010**
(viết sáng 02/09, chốt Vòng Quay đứng riêng). Cái mất được ghi thẳng: từ nay lỗi của Vòng Quay
có thể làm ngã Trúng Số đang chạy thật tại quầy.

**Công nghệ:** Next.js 16.3.3 · React 19.2.8 · Tailwind 4 · `node:sqlite` · vitest 4 ·
Playwright qua bộ nhớ đệm `npx` (KHÔNG thêm dependency).

---

## BÀN GIAO PHIÊN GẦN NHẤT (02/09/2026 chiều — GHI ĐÈ mỗi phiên, không nối thêm)

🔴 **SỔ NÀY LÀ SỔ ĐANG CHẠY.** Sổ v1 (`PLAN_VONG_QUAY.md`) đã đóng, chỉ để grep.

1. **Vừa xong:** Giai đoạn 0 → 2 + hạng mục 5.1 — **13/28 tick**. Vòng Quay đã GỘP xong
   phần máy vào `modules/GAME_SU_KIEN/app/`. Ba game chung một app, một CSDL, một lần
   đăng nhập.

2. **Làm tiếp từ:** `2.5` (chuyển 5 kịch bản e2e Vòng Quay sang bộ chung — **đường chơi
   Vòng Quay hiện CHƯA có bài kiểm trình duyệt nào**), rồi `5.2` (sửa chương trình đã tạo —
   lỗi thứ 5 anh Phúc gặp, chưa vá), rồi GĐ 3 · GĐ 4 · 5.3 · GĐ 6.

3. **Đã đo, ĐỪNG đo lại** (chạy trong `modules/GAME_SU_KIEN/app/`):
   · `npm test` **597 test / 51 file** xanh · `npx tsc --noEmit` · `npm run lint` xanh
   · `npm run build` xanh, **28 route** · `npm run e2e` **20/20** kịch bản cũ xanh
   · Chạy `nangCap()` HAI LẦN lên bản sao CSDL quầy thật: 9/9 chỉ số không suy suyển,
     11 bảng, `user_version` giữ nguyên 2, `van_choi` vẫn 18 dòng.
   · Chưa đăng nhập: `/quan-tri/vong-quay` → **307**, `/api/xuat/vong-quay/ABCD` → **401**
     (trả chữ, không phải HTML).

4. **Chặn ở NGƯỜI:** anh Phúc chạy thử bản gộp rồi xác nhận, TRƯỚC KHI xoá thư mục
   `VONG_QUAY_MAY_MAN/app/` (nó đang là mốc lùi) · `N.2` danh mục quà thật · `N.4` panel
   LCD ≥ 43" · `N.9` font chính thức. **Chặn ở NGOÀI:** `N.8` tư thế linh vật.

5. **Cạm bẫy vừa trả giá trong phiên này** (chi tiết ở `CLAUDE.md` gốc):
   · Bộ test XANH ≠ mã biên dịch được — `vitest` không chạy `tsc`; 559 test xanh trong khi
     `tsc` đỏ vì thiếu một dòng import.
   · `lệnh | head` trả mã thoát của `head` ⇒ dòng "tsc XANH" in ra dù có lỗi.
   · Dấu nháy đơn trong SQL cắt đứt chuỗi `node -e '...'`; script vặt có SQL thì ghi ra
     file rồi chạy.
   · Bê nguyên code cũ suýt đẻ lỗi mới: máy chủ phát `ket-qua-quay` ngay lúc mở lượt sẽ làm
     màn LCD hiện kết quả TRƯỚC khi vòng dừng. Nay `ketThucLuot` mới là chỗ phát.

6. **Lệnh phiên sau** (trong `modules/GAME_SU_KIEN/app/`): `npm run trung-tam` (tự dò IP LAN,
   in sẵn địa chỉ từng màn) · `npm test` · `npm run e2e`.

7. **Mốc lùi nếu việc gộp vỡ:** tag `truoc-gop-vong-quay` ở repo app đích · repo
   `github.com/hodacphuchtc/VONG_QUAY_MAY_MAN` (riêng tư) · bản sao CSDL ở
   `~/SAO_LUU_GAME_SU_KIEN/`.

---

## VÌ SAO CÓ SỔ V2 — năm nguyên nhân gốc từ buổi test

| Anh gặp | Nguyên nhân thật (đã truy ra dòng code) |
| --- | --- |
| Quét QR không vào được | `man-hinh.tsx:78-80` sinh QR từ `window.location.origin`. Mở LCD bằng `localhost` ⇒ QR mã hoá `localhost` ⇒ điện thoại quét thì trỏ về **chính nó** |
| Quay không có nhạc | `man-hinh.tsx:119` dùng `mayRef.current?.` — chưa bấm "Bật tiếng" thì lặng lẽ bỏ qua, không lỗi. Và điện thoại **không import `lib/am-thanh` một dòng nào** |
| Hai màn hình không đồng nhất | LCD bù trừ độ trễ mạng, điện thoại thì không (`man-choi.tsx:67`). LCD luôn chạy trước 0,1–0,5 s |
| Không thấy game khác trong quản trị | Vòng Quay là app RIÊNG ở cổng 3200, tách khỏi app chứa hai game kia ở cổng 3111 |
| Không sửa được chương trình đã tạo | Chưa viết. App anh em đã có mẫu `form-sua-chuong-trinh.tsx` |

**Ba lỗi anh CHƯA gặp nhưng nghiêm trọng hơn** — tìm được khi khảo sát, đã xếp lên sớm:

1. 🔴 **Chữ tên quà trên ô vàng và ô mint có tương phản 1,5:1** — gần như vô hình ngay ở 1 m,
   chứ đừng nói 3–5 m. Một nửa số ô sẵn đang bị.
2. 🔴 **Bảng lịch sử lấy tên ô từ bảng ô HIỆN TẠI.** Ngày anh đổi tên "Balo" → "Balo mini",
   mọi người trúng từ tháng trước bỗng được ghi là đã nhận "Balo mini" — kể cả trong file
   Excel đối soát. Chính tính năng "sửa chương trình" anh yêu cầu là thứ mở cửa cho lỗi này.
3. 🔴 **Cột "Trần giải mỗi ngày" được lưu và hiện lên màn hình nhưng KHÔNG hề áp dụng.**
   Nhân viên khai 20 giải/ngày, tin là nó chạy, và phát hết kho.

---

## RÀNG BUỘC TOÀN CỤC (áp cho MỌI hạng mục)

- 🔴 **KHÔNG sửa `lib/db/luoc-do.ts`** của app đích. Mọi cột/bảng mới đi qua
  `lib/db/nang-cap.ts` — CSDL đang chạy thật ở quầy phải nâng cấp được tại chỗ.
- 🔴 **Mọi câu SQL quản trị phải mang đủ `locPhamVi` + `locTroChoi`.** Thiếu một trong hai:
  màn Vòng Quay hiện chương trình Trúng Số, hoặc danh sách đang chạy thật **biến mất** khỏi
  màn quản trị — không một dòng lỗi.
- Chữ hiển thị **Tiếng Việt 100%, đúng dấu**. Chuỗi mới thêm vào `config/locale.ts` **trước**.
- Hằng số nghiệp vụ đọc từ `config/`, mỗi con số kèm câu trả lời "vì sao là số đó".
- Màu đọc từ `config/thuong-hieu.ts`; `app/globals.css` phải khớp — có test canh hai bên.
- Sau mỗi hạng mục: `npx tsc --noEmit` · `npm run lint` · `npm test` · `npm run build` xanh
  mới đi tiếp.
- Mã chương trình app đích dài **4 ký tự** (Vòng Quay cũ dùng 5) — xem R3.

**Khuôn hạng mục:** (a) làm gì · (b) anh kiểm chứng bằng cách nào · (c) test tự động ·
(d) thời gian · (e) chặn ở đâu. Dòng (e) là luật của `CLAUDE.md` dự án, giữ để trả lời được
"còn việc nào giao máy làm ngay được không".

---

## 🔴 BẢNG RỦI RO — xếp SỚM NHẤT, không để cuối

| Mã | Rủi ro | Hậu quả nếu vỡ | Làm ở |
| --- | --- | --- | --- |
| **R1** | `nangCap()` chạy mỗi lần khởi động; một câu `CREATE TABLE` sai cú pháp ⇒ `csdl()` ném | **Cả BA game chết cùng lúc.** Đường ngắn nhất từ "thêm một game" tới "quầy đứng hình" | **1.1** — hạng mục đầu tiên có code |
| **R2** | Câu SQL Vòng Quay quên `locTroChoi`/`locPhamVi` | Rò rỉ dữ liệu giữa các game, hoặc chương trình đang chạy biến mất khỏi màn quản trị | **1.3** |
| **R3** | Mã 5 ký tự (VQ) vs 4 ký tự (app đích). `maHopLe()` sót lại ở đâu đó | **Mọi trang Vòng Quay 404, không lỗi nào.** Hoặc mã trên tờ QR dán quầy không mở được | **1.2** |
| **R4** | Bật nhánh Vòng Quay vào `/choi/[ma]` và `/man-hinh/[ma]` — hai trang phụ huynh quét QR vào và LCD chiếu suốt buổi | Lỗi ở đây là quầy đứng hình trước mặt khách. **ĐIỂM KHÔNG QUAY LẠI** | **2.1** |
| **R5** | Chữ vô hình trên ô vàng/mint (1,5:1) | Phụ huynh không đọc được tên quà trên chính vòng họ đang quay | **2.4** |
| **R6** | Tên ô trong lịch sử là con số sống | Sổ đối soát nói dối sau lần sửa ô đầu tiên | **5.1** — trước khi mở tính năng sửa |

**Nguyên tắc xếp thứ tự:** R1–R3 nằm trọn trong Giai đoạn 1, tức là **hết ngày thứ ba đã biết
việc gộp có sống được không**. Nếu vỡ thì lùi lại chỉ mất 3 ngày, chưa đụng gì tới giao diện.

---

## KHÔNG LÀM Ở PHIÊN BẢN NÀY (cố ý)

| Không làm | Vì sao |
| --- | --- |
| **Hợp nhất `lib/am-thanh.ts` của hai app** | Hai API khác hẳn: bản Vòng Quay **xếp lịch trước cả cú quay** trên đồng hồ AudioContext, bản Trúng Số phát theo sự kiện. Gộp = viết lại đường âm thanh của trò **đang chạy thật ở quầy** để đổi lấy con số không. Giữ hai lớp, dùng chung `config/am-nhac.ts` |
| **Hợp nhất `ma-xac-thuc.ts`** | Ngữ nghĩa cố ý ngược nhau: Trúng Số gieo theo PHÚT (mã tự đổi, chống chuyền ảnh chụp); Vòng Quay gieo theo (ô + lượt) — **bất biến**, để một tuần sau phụ huynh mang phiếu tới còn đối soát được |
| **Dùng chung bảng `qua_tang` cho ô quay** | Nó đếm "đã trao" từ `van_choi`; dùng chung buộc phải sửa câu SQL **Trúng Số chạy ở mỗi lượt chơi**. Và `thu_tu` ở Trúng Số là *thứ tự bốc*, ở vòng quay là *vị trí trên mặt vòng* — một cột hai nghĩa |
| **Chuyển hướng `/quan-tri` sang trang chỉ mục game** | Nó bị bookmark, nằm trong 20 kịch bản e2e, và là trang mặc định sau đăng nhập. Đổi tên đường dẫn Trúng Số là nợ kỹ thuật riêng |
| **Trang khách toàn cục `/quan-tri/khach/[id]`** | Cần khung `PhamVi` đầy đủ; v2 làm khách **trong phạm vi một chương trình** trước. Đơn vị công việc ở quầy là CHƯƠNG TRÌNH, không phải khách |
| **Hàng chờ thật (biết mình đứng thứ mấy)** | `luot_quay` đã là hàng chờ, chỉ cần đếm — nhưng kéo theo cả một giao diện chờ mà v2 chưa cần |
| **Nền tối / neon phát sáng toàn màn** | Brand cấm nền tối nặng (dòng 1215, 1308). Anh đã chốt: nền sáng, neon ở viền |
| **Ghép lịch sử Git của hai repo** | Lịch sử Vòng Quay ghi quá trình dựng một app đã bị tháo, không ghi hành vi hệ thống đang chạy. Ép nối là làm bẩn `git log` của repo đang phục vụ quầy |
| **HTTPS / tên miền công khai** | Vẫn chạy mạng nội bộ. Là hạng mục `N.6` của app đích, chưa tới |

---

## GIAI ĐOẠN 0 — Cứu code, chốt tiền đề (0,5 ngày)

**🏁 DEMO cuối GĐ:** anh mở trình duyệt vào link GitHub của repo Vòng Quay và **thấy code
nằm ở đó**, không còn sống trong một commit local duy nhất trên đúng cái ổ đang giữ bản gốc.

- [x] **0.1 — 🔴 Đẩy repo Vòng Quay lên GitHub (LÀM ĐẦU TIÊN TUYỆT ĐỐI)**
  - (a) Tạo repo riêng tư `hodacphuchtc/VONG_QUAY_MAY_MAN`, thêm remote, push commit `37f54b6`.
    Đây là bản duy nhất của 5.100 dòng viết trong một ngày, và Giai đoạn 1 sẽ **tháo thư mục
    app đó ra**. **Không xoá `.git` cho tới khi lệnh push xanh.**
  - (b) Anh mở `github.com/hodacphuchtc/VONG_QUAY_MAY_MAN` trong trình duyệt, thấy thư mục
    `components/`, `lib/`, `tests/` và commit "GĐ 3→6 + gói dọn". Bấm vào một file bất kỳ,
    thấy nội dung tiếng Việt.
  - (c) Không có (thao tác Git, không phải code).
  - (d) 0,25 ngày.

- [x] **0.2 — Mốc lùi + ADR-011**
  - (a) `git tag truoc-gop-vong-quay` ở app đích; sao lưu `du-lieu/game-su-kien.db` ra ngoài
    thư mục dự án; tạo nhánh `gop-vong-quay`. Viết `docs/decisions/ADR-011-gop-vong-quay.md`
    đảo ADR-010, ghi thẳng cái mất ("Vòng Quay hỏng thì Trúng Số vẫn chạy" — mệnh đề này
    **không còn đúng**). Sửa dòng trạng thái của ADR-010 và ADR-005. `adrCount` 10 → 11.
  - (b) Anh mở `docs/decisions/` thấy ADR-011; mở ADR-010 thấy dòng "BỊ ĐẢO bởi ADR-011".
  - (c) `node scripts/check-structure.mjs` → exit 0, đếm đúng **11 ADR**.
  - (d) 0,25 ngày.

---

## GIAI ĐOẠN 1 — Gộp phần máy + menu ba game (2,75 ngày)

**🏁 DEMO cuối GĐ:** anh đăng nhập **MỘT lần** vào `localhost:3111/quan-tri`, thấy thanh bên
có mục **Game sự kiện** với **ba** game bấm được. Bấm "Vòng Quay" → mở danh sách → bấm "Tạo
chương trình" → khai 4 ô quà → lưu → thấy chương trình mới trong danh sách với mã 4 ký tự.
Bấm sang "Trúng Số", mọi thứ vẫn y như cũ.

- [x] **1.1 — 🔴 R1: Lược đồ đi qua cửa nâng cấp**
  - (a) `config/to-chuc.ts`: thêm `'vong_quay'` vào `TRO_CHOI`. `lib/db/nang-cap.ts`: thêm
    `BANG_BO_SUNG` (mảng mới, chạy TRƯỚC vòng thêm cột) chứa `o_qua` và `luot_quay` — khai
    thẳng cả `cung_json`, `o_ten`, `o_mau` vì bảng chưa từng tồn tại ở CSDL đích — cộng 5 chỉ
    mục. `COT_BO_SUNG` += `chuong_trinh.ti_le_o_day` (real, mặc định 0.5) và
    `chuong_trinh.phien_ban_o` (int, mặc định 1). **Chỉ `CREATE TABLE IF NOT EXISTS`, không
    `ALTER`.** Giữ `PHIEN_BAN_DU_LIEU` = 2, không thêm bước vá dữ liệu.
  - (b) Anh chưa cần bấm gì — nhưng nếu muốn tự yên tâm: mở `du-lieu/game-su-kien.db` bằng
    một công cụ xem SQLite bất kỳ, thấy hai bảng mới `o_qua`, `luot_quay` và dữ liệu Trúng Số
    còn nguyên số dòng.
  - (c) `tests/nang-cap.test.ts` (thêm ca): nâng cấp một **bản sao** CSDL quầy, chạy **HAI
    lần**, khẳng định số dòng `van_choi`/`luot_choi` y hệt và `user_version` không đổi. Cộng
    toàn bộ 501 test cũ phải xanh.
  - (d) 0,5 ngày.
  - (e) chặn: MÁY.

- [x] **1.2 — 🔴 R3: Tháo bản sao, hái bốn mảnh, đổi tên bốn cặp**
  - (a) Xoá 13 file bản sao ở app Vòng Quay, dùng bản app đích (chúng vốn được chép ra từ
    đúng bản đích @ `3d96358`, mỗi file mang dòng ghi nguồn). **Hái sang app đích 4 mảnh
    thuần cộng:** `thuocTinhCookie()` (chỉ bật `secure` khi thật sự HTTPS — máy quầy chạy
    `http://192.168.x.x`), `moDeDoc()` (mở CSDL chỉ đọc), `readOnly: true` cho
    `scripts/sao-luu.mjs`, `donTramPhat()`. **Chuyển 4 cặp cố ý khác nhau vào
    `lib/vong-quay/`:** `am-thanh.ts`, `ma-xac-thuc.ts`, `canh-bao-o.ts`, `config/vong-quay.ts`.
    🔴 Bỏ `maHopLe`/`DAI_MA`/`BANG_CHU` của Vòng Quay, dùng `chuanHoaMa` 4 ký tự của app đích.
  - (b) Anh chưa bấm được gì ở bước này. Bằng chứng thay thế: tôi chạy
    `grep -rn "maHopLe\|DAI_MA\|BANG_CHU"` trong app đích và dán kết quả **rỗng** cho anh xem.
  - (c) Toàn bộ test cũ xanh + 4 test thuần chuyển thẳng (`goc`, `chia-o`, `cong-bang` 100.000
    lượt, `am-thanh` đổi tên thành `am-thanh-vong-quay`).
  - (d) 0,75 ngày.
  - (e) chặn: MÁY.

- [x] **1.3 — 🔴 R2: Kho dữ liệu mang đủ phạm vi + game**
  - (a) `lib/vong-quay/{kho-o,kho-luot-quay,gioi-han}.ts` viết theo lối app đích (qua
    `lib/db/truy-van.ts`). `lib/chuong-trinh/kho.ts` += `timTheoMaVongQuay` / `danhSachVongQuay`
    theo đúng khuôn `timTheoMaChonSo` — **mỗi hàm mang đủ `locPhamVi` + `locTroChoi`**.
    Chương trình Vòng Quay **có gán cơ sở** (bắt buộc: `khach_tiem_nang.co_so_id` là
    `NOT NULL`, không có cơ sở thì mọi SĐT phụ huynh để lại rơi vào hư vô). Bỏ cột
    `ten_co_so` riêng, dùng `co_so_id`.
  - (b) Chưa bấm được — chứng minh ở 1.5.
  - (c) `tests/vong-quay-o.test.ts`, `tests/tao-vong-quay.test.ts` + chạy lại
    `tests/quyen-chuong-trinh.test.ts` và `tests/phan-quyen.test.ts`; thêm hai ca mới:
    "chương trình Vòng Quay KHÔNG xuất hiện ở `danhSachChuongTrinh`" và chiều ngược lại.
  - (d) 0,75 ngày.
  - (e) chặn: MÁY.

- [x] **1.4 — Kênh đồng bộ + hành động máy chủ**
  - (a) `lib/dong-bo/kenh.ts` += hai biến thể tin `bat-dau-quay` / `ket-qua-quay` + hàm
    `phatTin()`. Đây là **file dùng chung đầu tiên bị sửa** — union kiểu chỉ ảnh hưởng lúc
    biên dịch, nhưng phải chạy `tsc` ngay. `app/actions/vong-quay.ts` chuyển từ
    `app/actions/quay.ts`, giữ nguyên `BEGIN IMMEDIATE` + `coLuotDangChay`. Nối `nhanDien()`
    và `sinhLead()` của app đích.
  - (b) Chưa bấm được — chứng minh ở 1.5.
  - (c) `tests/vong-quay-quay.test.ts` (chuyển từ `quay.test.ts`) + `npm run e2e -- gd19`
    (Chọn Số vẫn nhịp qua kênh SSE vừa đổi kiểu).
  - (d) 0,5 ngày.
  - (e) chặn: MÁY.

- [x] **1.5 — Bốn trang quản trị + mở menu ba game**
  - (a) Bốn trang dưới `app/quan-tri/vong-quay/` (danh sách · tạo · chi tiết · dựng lại ván)
    theo khuôn `/quan-tri/chon-so`, bọc `batBuocDangNhap()` + `phamViCua()`. Route xuất
    `app/api/xuat/vong-quay/[ma]`. `khung-quan-tri.tsx`: đổi `<span aria-disabled>` "sắp có"
    thành `<Link>`. 🔴 **Đồng thời thêm `!laVongQuay` vào phép trừ của `dangMo`** — quên thì
    mở trang Vòng Quay mà thanh bên tô sáng **Trúng Số**; chú thích ở đó ghi lỗi này từng xảy
    ra với trang Cơ sở. 🔴 Xoá khoá `T.adminSapCo` **trong cùng commit**. Thêm trang
    `/quan-tri/game` (3 thẻ) và biến nhãn nhóm "GAME SỰ KIỆN" thành link tới đó.
  - (b) **Đây là DEMO của cả giai đoạn.** Anh đăng nhập `localhost:3111/quan-tri` → thấy thanh
    bên có ba game → bấm nhãn "GAME SỰ KIỆN" ra trang ba thẻ → bấm thẻ "Vòng Quay" → bấm
    "Tạo chương trình" → chọn cơ sở, khai 4 ô (3 ô có số lượng + 1 ô để trống số lượng) →
    Lưu → thấy chương trình mới với **mã 4 ký tự**. Bấm sang "Trúng Số" thấy danh sách cũ
    nguyên vẹn, thanh bên tô sáng đúng mục.
  - (c) `tests/locale.test.ts` (khoá mồ côi) · `tests/phan-quyen.test.ts` · `tests/nhat-ky.test.ts`
    · `curl` `/quan-tri/vong-quay` chưa đăng nhập → **307**, `/api/xuat/vong-quay/ABCD` → **401**
    (không phải HTML).
  - (d) 0,75 ngày.
  - (e) chặn: MÁY.

---

## GIAI ĐOẠN 2 — Bật công tắc + bốn lỗi đang chặn (1,25 ngày)

**🏁 DEMO cuối GĐ:** anh mở màn LCD **bằng địa chỉ IP LAN**, quét mã QR bằng điện thoại thật
và **vào được**. Bấm QUAY: nghe tiếng tick chậm dần trên loa LCD, hai màn hình quay khớp nhịp
và dừng cùng một ô. Nhìn vòng quay: **đọc được tên quà trên MỌI ô**, kể cả ô vàng và ô mint.

- [x] **2.1 — 🔴 R4: Bật nhánh Vòng Quay ở hai trang công khai (ĐIỂM KHÔNG QUAY LẠI)**
  - (a) Thêm nhánh `tro_choi === "vong_quay"` vào `app/choi/[ma]/page.tsx` và
    `app/man-hinh/[ma]/page.tsx`. Chuyển 6 component sang app đích với tiền tố tránh đụng tên
    (`man-hinh-vong-quay.tsx`, `man-dien-thoai-vong-quay.tsx`, `vong-quay.tsx`,
    `o-tich-trao.tsx`, `dung-lai-van.tsx`), nối ~149 khoá locale **cùng lúc** với component
    (nối locale trước là `locale.test.ts` đỏ hàng loạt vì khoá mồ côi).
  - (b) Anh mở `localhost:3111/man-hinh/<mã>` trên máy tính, thấy vòng quay và mã QR. Mở
    `/choi/<mã>` trên điện thoại (gõ tay địa chỉ IP), điền tên + SĐT, bấm QUAY, thấy kết quả.
  - (c) `npm test` + `npm run build` + **`npm run e2e` TOÀN BỘ** (20 kịch bản cũ + 5 kịch bản
    Vòng Quay chuyển sang, cổng thống nhất 3111).
  - (d) 0,5 ngày.
  - (e) chặn: MÁY.

- [x] **2.2 — Vá lỗi QR `localhost`**
  - (a) App đích đã có `scripts/chay-trung-tam.mjs` tự dò IP LAN, chạy `-H 0.0.0.0` và in sẵn
    địa chỉ từng màn LCD — gộp là thừa hưởng luôn. Thêm phần còn thiếu: **dải cảnh báo hiện
    trên chính màn LCD khi `window.location.origin` chứa `localhost` hoặc `127.0.0.1`**, nội
    dung nói thẳng "Mã QR này điện thoại quét sẽ không vào được — hãy mở màn hình bằng địa
    chỉ <IP LAN>". Kèm nút chép địa chỉ đúng.
  - (b) Anh mở LCD bằng `localhost:3111/man-hinh/<mã>` → **thấy dải cảnh báo màu vàng**. Đóng
    lại, chạy `npm run trung-tam`, mở bằng địa chỉ IP nó in ra → dải biến mất → quét QR bằng
    điện thoại → **vào được trang chơi**.
  - (c) Kịch bản e2e `vq-qr-canh-bao.mjs`: mở LCD ở `localhost` khẳng định dải hiện; mở ở
    `127.0.0.1` cũng hiện; đọc nội dung ảnh QR bằng bộ giải mã và khẳng định URL **không**
    chứa `localhost` khi origin là IP.
  - (d) 0,25 ngày.
  - (e) chặn: MÁY.

- [x] **2.3 — Vá LCD im lặng + đồng bộ hai màn**
  - (a) Ba việc. **① Âm thanh:** đổi nút "Bật tiếng" nhỏ thành lớp phủ **"▶ BẮT ĐẦU CHIẾU"**
    toàn màn hình — nhân viên *dù sao cũng phải chạm* một lần khi mở quầy, và cú chạm đó mở
    khoá AudioContext + toàn màn hình + `wakeLock` (màn LCD không được tự tắt giữa buổi). Cộng
    bắt cử chỉ dự phòng (`pointerdown` once, capture) và **làm sự im lặng nhìn thấy được**:
    nếu đã có lượt chạy qua mà máy phát chưa sẵn sàng, hiện dải "Chưa có tiếng — chạm màn hình
    một lần". **② `lechRef = 0`:** chưa đo xong lệch đồng hồ thì KHÔNG quy đổi mốc máy chủ,
    dùng `performance.now()` làm gốc — chặn ca vòng đứng im 30 giây hoặc nhảy thẳng tới đích.
    **③ Điện thoại đo lệch đồng hồ** như LCD, và dùng mốc máy chủ làm gốc — hết lệch pha.
  - (b) Anh mở LCD → thấy lớp phủ "▶ BẮT ĐẦU CHIẾU" → bấm → màn vào toàn màn hình. Quét QR,
    bấm QUAY. **Đứng nhìn cả hai màn cùng lúc**: hai vòng quay và dừng khớp nhau; loa LCD phát
    tiếng tick chậm dần theo vòng, rồi tiếng ăn mừng. Thử tải lại trang LCD giữa lúc đang quay
    — nó bắt kịp đúng chỗ, không quay lại từ đầu.
  - (c) `tests/dong-ho.test.ts` (thêm ca "chưa đo xong thì không quy đổi"). Kịch bản e2e
    `gd42-hai-man-hinh` đã có, thêm phép đo: chênh lệch thời điểm dừng giữa hai màn ≤ 150 ms.
  - (d) 0,25 ngày.
  - (e) chặn: MÁY (nghe tiếng thật thì chặn NGƯỜI — cần tai anh trên loa LCD).

- [x] **2.4 — 🔴 R5: Chữ trên cung phải đọc được**
  - (a) `lib/vong-quay/mau-chu.ts` — hàm thuần `mauChuTrenNen(hex)`: trả **trắng** khi độ chói
    ≤ 0,18, ngược lại trả **mực** `#1E1B2E`. Ngưỡng 0,18 là **quyết định của ta** (brand không
    quy định tương phản): nó là điểm duy nhất tách {tím 8,7:1, chì 5,4:1} khỏi {neon, cam,
    vàng, mint} và cả hai bên đều ≥ 4,2:1. Cộng **luật `text-cam`**: `#F97316` trên trắng chỉ
    2,80:1, không đạt WCAG ở bất kỳ cỡ nào ⇒ chỉ dùng cho chữ ≥ 32px `font-black` trên nền
    trắng thuần; dưới cỡ đó dùng `text-tim` (8,7:1); **không bao giờ** `text-cam` trên
    `bg-cam/10`. Thêm vành ngoài `--color-ke` cho vòng — hiện cung mint/vàng tan vào nền trắng.
  - (b) Anh tạo một chương trình có đủ 6 màu ô, mở màn LCD, **đứng lùi 3 mét**: đọc được tên
    quà trên **mọi** ô, kể cả ô vàng và ô mint. Trước khi sửa, hai ô đó gần như trắng xoá.
  - (c) `tests/mau-chu.test.ts`: bảng tra 6 màu trong `MAU_O_SAN`, mỗi màu khẳng định tỉ số
    tương phản của màu chữ được chọn ≥ 4,2:1. Cộng một ca đột biến: đổi ngưỡng thành 0,9 thì
    test phải đỏ.
  - (d) 0,25 ngày.
  - (e) chặn: MÁY.

- [ ] **2.5 — Chuyển 5 kịch bản e2e của Vòng Quay sang bộ chung**
  - (a) Năm kịch bản ở `VONG_QUAY_MAY_MAN/app/tests/e2e/` (`gd42-hai-man-hinh`,
    `gd63-chan-quan-tri`, `gd64-o-het-hang`, `gd65-mot-luot-mot-luc`, `gd66-dung-lai-van`)
    còn nằm ở app CŨ, chạy trên cổng 3200 và CSDL riêng. Chuyển sang `app/tests/e2e/`,
    đổi sang cổng 3111, dựng nền qua đường tạo chương trình `tro_choi = 'vong_quay'`.
  - (b) `npm run e2e` in ra **25/25** thay vì 20/20.
  - (c) Chính nó.
  - (d) 0,5 ngày.
  - (e) chặn: MÁY.
  - (f) phụ-thuộc: 2.1

> 🔴 **Vì sao hạng mục này tách ra khỏi `2.1`.** Cổng của `2.1` là *"bộ e2e cũ còn xanh"* —
> đã đạt, 20/20, và đó chính là thứ chứng minh việc gộp không làm ngã trò đang phục vụ khách.
> Nhưng phần *"+ 5 kịch bản Vòng Quay"* trong khuôn (c) của `2.1` thì CHƯA làm. Tick `2.1`
> mà im chuyện đó là để lại một dấu tick nói dối. Cho tới khi `2.5` xong, **đường chơi Vòng
> Quay chưa có một bài kiểm trình duyệt thật nào** — chỉ có 597 bài kiểm đơn vị.

---

## GIAI ĐOẠN 3 — Màn hình LCD 16:9 theo brand (1,75 ngày)

**🏁 DEMO cuối GĐ:** anh cắm màn LCD thật, mở toàn màn hình. Hình **lấp đầy đúng khung 16:9**,
không có dải đen, không phải cuộn. Đứng cách 3–5 mét đọc được tiêu đề, CTA và mã xác thực.
Viền màn có mạch neon tím–cam mảnh, **không** chạy xuyên logo hay mã QR.

- [ ] **3.1 — Sân khấu 16:9 + thang cỡ chữ**
  - (a) `.man-lcd` trong `globals.css`: `width: min(100vw, calc(100dvh*16/9))`,
    `container-type: size`, 10 token `cqw`. Dải thừa để **TRẮNG** (nền sáng nên mắt không thấy
    letterbox — nếu nền tối thì phương án này mới xấu, mà nền tối thì brand cấm rồi).
    🔴 Kèm `@supports not (container-type: size)` rơi về `vh`: thiếu nó thì trình duyệt cũ cho
    `font-size` sai và **cả màn hình thành chữ 16px**, im lặng và thảm hoạ. Thang chữ (brand
    không cho con số nào — toàn bộ là quyết định của ta, tính từ panel 55" @1920, chiều cao
    chữ hoa × 120 = khoảng cách đọc thoải mái): hero `6cqw` = 115px = đọc **6,3 m**; tiêu đề
    `4,2cqw` = 81px = **4,4 m**; mã xác thực `5cqw` mono = **5,3 m**; thân `2,2cqw` = 2,3 m.
  - (b) Anh mở LCD trên màn thật, bấm F11. Hình lấp đầy khung, tỉ lệ đúng 16:9. **Đứng lùi
    3 mét**: đọc được dòng lớn và CTA "QUÉT MÃ ĐỂ QUAY". Lùi 5 mét: vẫn đọc được dòng lớn.
  - (c) `tests/e2e/vq-lcd-16-9.mjs` chạy ở **1920×1080 và 1366×768**: tỉ lệ sân khấu
    `width/height` ∈ [1,776 ; 1,780]; `font-size` thực của hero ≥ 100px @1920 và ≥ 70px @1366.
  - (d) 0,75 ngày.
  - (e) chặn: MÁY (nhìn từ 3–5 m thì chặn NGƯỜI; và lời hứa chỉ đúng với panel **≥ 43"** —
    trên 32" chỉ hero + tiêu đề sống sót ở 3 m, đó là giới hạn vật lý, phải ghi vào SOP).

- [ ] **3.2 — Mạch neon ở viền + ba trạng thái không giật**
  - (a) `.vien-mach-lcd` — biến thể mới, **giữ nguyên `.vien-mach` cũ** (nó vẫn đúng cho tấm
    LED và cho điện thoại). Bản cũ dày 2px cố định = 0,1% chiều ngang sân khấu 1920, mắt không
    thấy gì. Bản mới: dày `0,22cqw` ≈ 4px, có **node mạch** (8 chấm ở mép), **một** quầng sáng
    alpha thấp (brand: "không dùng quá nhiều glow"). 🔴 Chỉ đặt trên **đúng một phần tử** —
    chính sân khấu; cấm đặt lên thẻ QR, khối logo, vòng quay. Ba trạng thái (chờ · đang quay ·
    kết quả) dùng **cùng kích thước hộp** cho cột phải, chỉ đổi ruột ⇒ **zero reflow**. Vòng
    quay không xê dịch một điểm ảnh nào khi chuyển trạng thái — nó đang xoay, một cú reflow
    giữa lúc xoay là một cú giật trước mặt cả sảnh. Linh vật: ẩn khi đang quay, hiện tư thế
    `an_mung` ở màn kết quả (hợp lệ vì Vòng Quay **không có người thua** — ô đáy vẫn là quà).
  - (b) Anh nhìn màn LCD: viền có đường mạch tím–cam mảnh với các chấm node, **không** có
    đường nào chạy xuyên qua logo Sata Robo hay xuyên mã QR. Quay một lượt và **nhìn kỹ vòng
    quay lúc chuyển từ "chờ" sang "đang quay"**: nó không nhích, không đổi kích thước.
  - (c) `vq-lcd-16-9.mjs` thêm: hộp bao của ảnh logo và ảnh QR nằm **hoàn toàn bên trong**
    `inset` của viền, cách mép ≥ 3cqw; không phần tử nào có `filter !== "none"` trên hai ảnh
    nhận diện; **hộp bao SVG vòng quay giống hệt nhau ở cả ba trạng thái (sai lệch ≤ 1px)**;
    đếm điểm ảnh ảnh chụp khẳng định trắng ∈ [55%, 78%], tím ≤ 30%, cam ≤ 15%.
  - (d) 1,0 ngày.
  - (e) chặn: MÁY. *(Tư thế linh vật "chỉ tay vào QR" mà brand đòi cho phong cách
    direct-response thì chặn NGOÀI — xem `N.8`. Dùng tạm tư thế hiện có đặt cạnh QR: vị trí
    đúng, chỉ thiếu cái tay. **Không giả lập bằng cách xoay ảnh** — brand cấm xoay.)*

---

## GIAI ĐOẠN 4 — Màn điện thoại vừa một khung hình (1,25 ngày)

**🏁 DEMO cuối GĐ:** anh cầm điện thoại quét QR, làm trọn một ván **mà không vuốt lên xuống
một lần nào**. Mã xác thực hiện ngay trên màn, không phải trượt tìm.

- [ ] **4.1 — Khoá khung + vòng quay co theo hai trục**
  - (a) Vỏ `height: 100svh` + `grid-rows-[auto_minmax(0,1fr)_auto]` + `overflow-hidden`.
    🔴 **`svh` chứ không `dvh`**: `dvh` co giãn khi thanh Safari ẩn/hiện ⇒ vòng quay **đổi kích
    thước giữa animation**; `svh` là hằng số cho mỗi máy. 🔴 Ngoại lệ: hàng giữa ở bước **nhập
    thông tin** cho `overflow-y-auto` — bàn phím mềm iOS cần trình duyệt cuộn ô đang focus vào
    tầm nhìn, `overflow: hidden` chặn mất việc đó và người dùng gõ số điện thoại vào ô họ
    không nhìn thấy. `app/layout.tsx` += `viewportFit: "cover"` — thiếu nó thì
    `env(safe-area-inset-bottom)` **luôn trả 0** và cả phần xử lý home indicator vô nghĩa.
    `components/vong-quay.tsx`: bỏ `h-auto w-full max-w-md` cứng, nhận `className` từ ngoài ⇒
    SVG tự letterbox trong hộp cha, cạnh vòng = `min(ngang còn lại, dọc còn lại)` **tự động**.
  - (b) Anh mở trang chơi trên điện thoại: **thử vuốt lên** — trang không nhúc nhích ở bước
    sẵn sàng quay và bước kết quả. Ở bước nhập thông tin, bấm vào ô số điện thoại: bàn phím
    hiện lên và **vẫn nhìn thấy ô đang gõ**.
  - (d) 0,5 ngày.
  - (c) `tests/e2e/vq-dien-thoai-mot-khung.mjs` ở **375×667 và 390×844**:
    `scrollingElement.scrollHeight <= clientHeight + 1` ở **cả bốn bước**; hộp bao SVG vòng
    quay `width === height` và ≥ 150px.
  - (e) chặn: MÁY.

- [ ] **4.2 — Thẻ kết quả là tấm TRƯỢT ĐÈ**
  - (a) Hiện màn kết quả cao ≈ 734px trên khung ≈ 700–750 ⇒ **mã xác thực và câu hướng dẫn
    nhận quà nằm dưới nếp gấp** — đúng thứ phụ huynh cần đọc cho nhân viên. Hai cách sai đã
    loại: đặt thẻ **bên dưới** vòng (chính là hiện trạng, tràn); đặt vào hàng cố định (hàng
    nhảy từ 92px lên 221px ⇒ **vòng quay giật nhỏ lại đúng khoảnh khắc cao trào**). Cách đúng:
    thẻ `absolute inset-x-0 bottom-0` trong hàng giữa, trượt lên 280ms; vòng quay đẩy lên bằng
    **`transform`** (không reflow). Kim ở 12 giờ nên tấm che phần **dưới** vòng — không che
    kim, không che ô trúng. Tên quà `line-clamp-2`, chặn ở đầu nguồn: tên ô ≤ 24 ký tự.
  - (b) Anh quay một lượt trên điện thoại. Khi vòng dừng, thẻ kết quả **trượt lên từ đáy**,
    và anh **thấy ngay mã xác thực 4 ký tự mà không phải vuốt**. Thử với một ô có tên dài
    (24 ký tự) — vẫn thấy đủ mã.
  - (c) Cùng kịch bản 4.1, thêm: ở bước kết quả, `getBoundingClientRect()` của phần tử mã xác
    thực có `bottom <= innerHeight` và `top >= 0`; bơm tên quà 40 ký tự **cùng lúc với** một
    thông báo lỗi rồi lặp lại phép đo.
  - (d) 0,5 ngày.
  - (e) chặn: MÁY.

- [ ] **4.3 — Bảng quản trị đọc được trên điện thoại** *(NÊN CÓ — cắt được)*
  - (a) Quy ước 3 mức ưu tiên cột (`hidden sm:table-cell` / `lg:table-cell`) và
    `min-w-0 sm:min-w-[…]` để dưới 640px bảng co vừa khung. **Cột thao tác luôn ưu tiên 1** —
    hiện nó nằm ngoài màn hình 390px và **không có gì báo là cuộn được**, nên thành lỗi im
    lặng. Áp cho 7 bảng. Thêm `<caption class="sr-only">` và `scope="col"`.
  - (b) Anh mở `/quan-tri/vong-quay` **trên điện thoại**: bảng vừa khung, thấy ngay nút thao
    tác mà không phải kéo ngang.
  - (c) Kịch bản e2e ở 390×844: `document.body.scrollWidth <= innerWidth + 1` ở 4 trang quản trị.
  - (d) 0,25 ngày.
  - (e) chặn: MÁY.

---

## GIAI ĐOẠN 5 — Sửa chương trình + nhiều lượt (2,0 ngày)

**🏁 DEMO cuối GĐ:** anh mở một chương trình **đang chạy**, sửa tên ô và thêm một ô mới, xem
trước vòng mới **cạnh** vòng hiện tại rồi lưu. Sau đó bấm "Dựng lại" một ván quay **trước**
lúc sửa — thấy đúng vòng CŨ và đúng tên ô CŨ. Rồi quay ba lượt liên tiếp bằng cùng một số
điện thoại mà không phải nhập lại thông tin.

- [x] **5.1 — 🔴 R6: Ảnh chụp tên ô (làm TRƯỚC khi mở tính năng sửa)**
  - (a) Thêm hai cột `luot_quay.o_ten` và `o_mau` qua `COT_BO_SUNG`. Ghi ở `actions/vong-quay.ts`
    — giá trị `cham.o.ten` và `cham.o.mau` **đã nằm sẵn trong tay** ở đúng dòng đó. Đọc bằng
    `COALESCE(l.o_ten, o.ten)` ở ba nơi: bảng lịch sử, bản xuất Excel, trang dựng lại. Lượt
    ghi trước khi có cột vẫn rơi về phép join cũ.
  - (b) Anh quay một lượt, đổi tên ô vừa trúng thành tên khác hẳn, rồi mở lại lịch sử: dòng
    cũ vẫn ghi **tên lúc trúng**, không phải tên mới. Tải file Excel ra kiểm — cũng tên cũ.
  - (c) `tests/sua-o.test.ts`: quay 1 lượt → đổi tên mọi ô → khẳng định `lichSuLuot()` và
    `toanBoLichSu()` (Excel) đều trả **tên CŨ**.
  - (d) 0,25 ngày.
  - (e) chặn: MÁY.

- [ ] **5.2 — Sửa chương trình + sửa danh sách ô trong MỘT giao dịch**
  - (a) Tách `kiemThietLap()` / `kiemDanhSachO()` — **một bộ luật cho cả tạo và sửa** (hai bộ
    sẽ lệch, và bên lỏng hơn là bên người ta dùng để lách). `luuDanhSachO()` lưu trọn danh
    sách trong **MỘT giao dịch**, tăng phiên bản **đúng một lần** ở cuối — hiện `themO` INSERT
    rồi mới `tangPhienBanO` bằng câu riêng, một lượt quay chen vào giữa sẽ nhìn thấy ô mới với
    số phiên bản CŨ. Nút **"Ngừng phát ô này"** (đặt `so_luong = da_trao`) — mẹo này đã ghi
    trong chú thích nhưng bắt người dùng phải biết; biến thành một nút. **Xem trước vòng mới
    cạnh vòng hiện tại** trước khi lưu (`chiaCung` là hàm thuần, chạy được ở máy khách).
    Xoá-hay-ẩn: **máy chủ tự quyết**, không nhận lệnh từ client — `soLuot === 0` ⇒ xoá hẳn,
    `> 0` ⇒ ẩn. 🔴 Vá `tuDong()` để nó trả đúng ba trạng thái — hiện nó bóp mọi giá trị lạ về
    `dang_chay`, tức là **ẩn xong chương trình chạy tiếp**, QR dán ở quầy vẫn quay được.
    **Bất biến chốt lại: mọi đường sửa chỉ ghi vào `chuong_trinh` và `o_qua`; không đường nào
    chạm `luot_quay`** (trừ hai cột trao thưởng) — đó là toàn bộ lý do ván cũ dựng lại được.
  - (b) Anh mở chi tiết một chương trình đang chạy → sửa tên hai ô, đổi số lượng, thêm một ô
    mới, bấm "Ngừng phát" một ô → **nhìn hai vòng cạnh nhau** (hiện tại vs sau khi lưu) →
    Lưu. Rồi bấm "Dựng lại" một ván quay từ **trước** lúc sửa: vòng hiện ra là vòng **CŨ**,
    kim dừng đúng ô cũ, tên ô là tên cũ. Thử xoá một chương trình đã có lượt → nó **ẩn** đi
    chứ không mất; quét QR của nó → báo "đã kết thúc".
  - (c) `tests/sua-chuong-trinh.test.ts` + `tests/xoa-chuong-trinh.test.ts`. Ca xương sống:
    tạo → quay 1 lượt → *đổi tên mọi ô + đổi số lượng + xoá một ô chưa trao + thêm ô mới* →
    khẳng định (a) `timLuot().cung` trả đúng mặt vòng CŨ, (b) lịch sử báo tên ô CŨ, (c) Excel
    báo tên ô CŨ, (d) `phien_ban_o` tăng **đúng 1**, không phải một lần mỗi ô. Cộng: không xoá
    được ô đã trao; không bỏ được ô đáy cuối cùng; **ẩn cũng là ngừng chạy** (`quayMot` từ
    chối); giao dịch nguyên khối (một ô hỏng giữa danh sách ⇒ không ô nào được ghi).
  - (d) 1,0 ngày.
  - (e) chặn: MÁY.

- [ ] **5.3 — N lượt cho trọn chương trình**
  - (a) Cột `chuong_trinh.so_luot_moi_nguoi` (int, **mặc định 1** — tái tạo *chính xác* hành vi
    hôm nay ⇒ không cần vá dữ liệu). `0 = không giới hạn`, trần **10** (quá 10 thì thứ chặn
    không còn là cấu hình mà là hàng chờ ở quầy: mỗi lượt chiếm ~5 giây độc quyền màn LCD).
    Chỉ mục mới `(chuong_trinh_id, nguoi_choi_id)` — chỉ mục cũ có cột `ngay`, phép đếm mới bỏ.
    `conLuotHomNay` → `hanMucLuot(...)`; **đổi tên chứ không giữ bí danh** — một cái tên có chữ
    "HomNay" trỏ tới phép đếm trọn đời là cái bẫy đúng nghĩa. 🔴 **Chuyển phép kiểm hạn mức
    VÀO TRONG giao dịch** — hôm nay nó nằm ngoài, và với N=1 thì `coLuotDangChay` che kín lỗ
    hổng; nới ra mà quên chuyển thì hai tab cùng một SĐT cùng qua cửa. `coLuotDangChay` giữ
    lại (nó bảo vệ việc chỉ có MỘT màn LCD, không phải chống đua ghi) nhưng trả về **số giây
    còn lại** để điện thoại tự đếm ngược và tự thử lại, cộng **đường ưu tiên cho chính người
    đang giữ khoá** (bấm đúp không tự ăn lỗi từ chính mình). Hiện "còn 2/3 lượt" ở 4 chỗ trên
    điện thoại + 2 chỗ trên LCD. 🔴 Nút **QUAY TIẾP** phải giữ nguyên người chơi trong state —
    bắt nhập lại SĐT giữa hai lượt của cùng một người là lỗi thiết kế nặng nhất mà N lượt có
    thể đẻ ra. 🔴 Câu "hết lượt" hiện nói *"mời bạn quay lại vào ngày mai"* — **sai** khi hạn
    mức là trọn chương trình, phải viết lại. Nối dây luôn cột chết `tran_giai_moi_ngay`, hoặc
    **gỡ nó khỏi form** — không được để nguyên.
  - (b) Anh tạo chương trình với "3 lượt mỗi người". Quay lần 1 → thấy "còn 2 lượt" và nút
    **QUAY TIẾP** → bấm, **không phải nhập lại tên và số điện thoại** → quay tiếp lần 2, lần 3
    → lần 4 bị từ chối với câu nói rõ là hết lượt của **chương trình** (không phải "mai quay
    lại"). Trên LCD thấy "lượt 2/3". Mở hai điện thoại bấm cùng lúc: máy thứ hai thấy đồng hồ
    đếm ngược rồi **tự quay được**, không phải bấm lại.
  - (c) `tests/vong-quay-gioi-han.test.ts`: 3 lượt rồi lần 4 bị chặn; **không reset qua nửa
    đêm** (chèn 3 lượt với `ngay` hôm qua, hôm nay lượt 4 vẫn bị chặn); `0` = không giới hạn
    thật sự; chương trình cũ chưa có cột thì mặc định về 1; hai người không ăn lượt của nhau;
    cùng người ở hai chương trình có hai hạn mức riêng; **đua ghi** (gọi `quayMot` hai lần
    không `await` xen kẽ với hạn mức 1 ⇒ đúng MỘT lượt được ghi); hạ hạn mức xuống dưới số đã
    dùng ⇒ `con === 0`, không âm; trần giải/ngày chạm ngưỡng ⇒ vòng chỉ còn ô đáy nhưng **vẫn
    quay được**.
  - (d) 0,75 ngày.
  - (e) chặn: MÁY.

---

## GIAI ĐOẠN 6 — Năm kiểu nhạc + thống kê khách (2,0 ngày)

**🏁 DEMO cuối GĐ:** lúc tạo chương trình anh **nghe thử** năm kiểu nhạc rồi chọn một. Cuối
buổi, anh gõ mã xác thực 4 ký tự vào ô "Tra mã" và ra ngay thẻ khách — ai, trúng gì, trao
chưa, còn mấy lượt.

- [ ] **6.1 — Năm kiểu nhạc chọn lúc khởi tạo**
  - (a) `config/am-nhac.ts` khai 5 preset (tên hiển thị ở `locale.ts` theo luật chuỗi):

    | Mã | Tính cách | Khác biệt cốt lõi |
    | --- | --- | --- |
    | `vui_nhon` | Hội chợ — **mặc định** | Chép **đúng** bản đang chạy ⇒ test cũ không phải sửa một dòng, không ai ở quầy nghe thấy khác đi |
    | `nguoi_may` | Bánh răng + tín hiệu máy | Chỉ quãng 5 và quãng 8, **cố ý bỏ quãng 3** — quãng 3 là thứ làm tai nghe "vui" hay "buồn"; bỏ đi thì nghe *không cảm xúc*, đúng chất máy |
    | `vu_tru` | Rộng, mềm | Thang 5 âm, không nửa cung ⇒ không nốt nào "muốn giải quyết về" nốt nào ⇒ nghe treo lơ lửng |
    | `chuong_pha_le` | Nhẹ nhất | Kiểu **duy nhất** có đỉnh < 0,05 — để nhân viên chọn khi trung tâm thương mại nhắc nhở độ ồn, thay vì tắt tiếng hẳn |
    | `ken_chien_thang` | To, dứt khoát | Kiểu **duy nhất** có mốc nốt không đều (0 / 0,09 / 0,18 / 0,34) — ba nốt ngắn rồi một nốt dài, đó chính là hình kèn hiệu |

    Bất biến chung: **cao độ tách LUÔN tụt** ở cả 5 kiểu — không phải khẩu vị, mà vì vòng chậm
    lại thì tiếng phải nặng dần, cùng chiều với thứ mắt đang thấy. Cột `chuong_trinh.kieu_nhac`
    qua `COT_BO_SUNG`, mặc định `'vui_nhon'`. `kieuNhac` phải nằm **trong tin SSE** — LCD mở từ
    8h sáng, nhân viên đổi nhạc lúc 14h, LCD không tải lại trang. Hàm `ngheThu(kieu)` là quan
    trọng nhất nhóm: **không ai chọn được nhạc mà không nghe**, và nó cũng chính là cử chỉ mở
    khoá AudioContext ở form tạo. **Điện thoại có tiếng**: mở khoá **ngay dòng đầu `onClick`
    nút QUAY, TRƯỚC dấu `await` đầu tiên** — gọi sau `await` thì cờ cử chỉ người dùng đã hết
    hạn và trình duyệt từ chối *trong im lặng*; hạ đỉnh còn một nửa để LCD vẫn là giọng chính.
  - (b) Anh vào form tạo chương trình, thấy 5 lựa chọn nhạc, mỗi cái có nút **▶ Nghe thử** —
    bấm từng cái, nghe khác nhau rõ rệt. Chọn "Kèn chiến thắng", lưu, quay một lượt trên LCD
    có loa: nghe đúng kiểu đã chọn. Vào sửa chương trình, đổi sang "Chuông pha lê", **không
    tải lại trang LCD**, quay lượt tiếp: LCD phát kiểu mới. Cầm điện thoại quay: **điện thoại
    cũng có tiếng**, nhỏ hơn LCD.
  - (c) `tests/am-thanh-vong-quay.test.ts`: trần âm lượng mọi preset (`dinhNen + dinhTheoCung
    ≤ 0,09`) — hàng rào chặn preset thêm sau này làm vỡ loa; **cao độ luôn tụt** mọi preset;
    `not.length === moc.length` và `moc` tăng nghiêm ngặt; **`vui_nhon` không đổi một con số
    nào** so với bản đang chạy (bảng giá trị viết thẳng trong test); `docKieuNhac` không bao
    giờ ném (cho ăn `null`, `""`, `"kieu_la"`, `"'; DROP"`).
  - (d) 1,0 ngày.
  - (e) chặn: MÁY (chọn kiểu nào hợp quầy thì chặn NGƯỜI — cần tai anh trên loa thật).

- [ ] **6.2 — Thống kê khách + tra mã + lịch sử theo khách**
  - (a) `lib/nguoi-choi/kho-khach.ts` — file **đầu tiên trong dự án có `GROUP BY`**. Hai người
    đọc, hai màn hình: **nhân viên tại quầy** cần *"mã này của ai, trúng gì, trao chưa, còn mấy
    lượt"* ⇒ **ô "Tra mã"** gõ 4 ký tự (hoặc SĐT) ra ngay thẻ khách + nút tích "Đã trao" —
    **không phải thêm một cái bảng nữa**; hôm nay họ phải dò mắt trong 200 dòng. **Quản lý**
    cần tổng hợp cuối buổi ⇒ một `<section>` "Khách hàng" trong trang chi tiết chương trình:
    4 ô chỉ số (số khách · lượt/khách · quà thật đã ra · **chưa trao**, tô cam nếu > 0) + bảng
    gom nhóm + xuất Excel. 🔴 `luot_quay.nguoi_choi_id` cho phép NULL ⇒ tổng lượt của bảng
    khách **khác** tổng lượt của chương trình; trang phải hiện **cả hai con số, gọi tên khác
    nhau** ("N khách · M lượt có tên · K lượt vô danh") — nếu không, ai đó *sẽ* báo lỗi. Một
    câu SQL cho cả trang, không phải một câu mỗi dòng. Quyền riêng tư: bảng **che** SĐT; trang
    chi tiết có nút **"Hiện đủ"** tắt sẵn và **bấm nó ghi nhật ký**; Excel đầy đủ (đi qua tường
    401). Bộ lọc "chỉ người đồng ý tư vấn" **cố ý KHÁC** app đích: bảng đối soát quà phải hiện
    **mọi người**, vì bật sẵn bộ lọc đó sẽ giấu đúng người đang cầm mã tới đòi quà. Tạo
    `lib/nhat-ky/kho.ts` — bảng `nhat_ky` đã có đủ cột nhưng **chưa có một dòng ghi nào**.
  - (b) Anh chơi 3 ván bằng 2 số điện thoại khác nhau. Mở chi tiết chương trình → thấy mục
    "Khách hàng" với 4 ô chỉ số → thấy **2 dòng khách** (không phải 3 dòng lượt), dòng của
    người chơi 2 lần ghi "2 lượt". Bấm vào một khách → thấy đủ các lần quay của họ, ô nào,
    mã nào, trao chưa. Gõ mã xác thực vào ô **"Tra mã"** → ra ngay thẻ khách đó → tích "Đã
    trao" → tải lại trang, dấu tích còn nguyên.
  - (c) `tests/thong-ke-khach.test.ts`: một người quay 3 lượt ⇒ **một** dòng `soLuot: 3`; ba
    người mỗi người 1 lượt ⇒ ba dòng sắp theo lượt gần nhất; **lượt vô danh không rơi vào bảng
    khách và không đếm nhầm sang ai**; `soDaTrao` chỉ đếm dòng đã tích; ô trúng gộp đúng
    (trúng "Bút" 2 lần ⇒ một phần tử `soLan: 2`, giữ đúng màu); trúng ô đáy không tính vào
    "quà thật"; `timTheoMaXacThuc` **không cho xuyên chương trình**; **số câu SQL là hằng số**
    khi dựng bảng 50 khách (chống N+1). Cộng `tests/rieng-tu.test.ts`: mở màn khách ghi đúng
    một dòng nhật ký với số dòng khớp số dòng hiện ra.
  - (d) 1,0 ngày.
  - (e) chặn: MÁY.

---

## VIỆC CỦA NGƯỜI / CHỜ NGOÀI

> Các mục dưới đây **cố ý chỉ có dòng `(e)`**. Chúng không có `(a) làm gì` vì không có dòng
> code nào, không có `(c) test` vì không máy nào kiểm được một chữ ký hay một quyết định, và
> không có `(d) thời gian` vì thời gian ở đây phụ thuộc người khác chứ không phụ thuộc ta.
> Khuôn năm dòng áp cho hạng mục thi công.

- [ ] **N.1 — 🔴 Hỏi luật về khuyến mại may rủi (NĐ 81/2018).** Vòng quay là may rủi thuần,
  không cãi được là trò kỹ năng. Chặn việc đưa ra phục vụ khách thật, **không** chặn thi công.
  - (e) chặn: NGƯỜI.
- [ ] **N.2 — Danh mục quà thật:** tên · số lượng · trần mỗi ngày · **ít nhất một loại không
  giới hạn** làm ô an ủi. Chặn nghiệm thu cuối cùng.
  - (e) chặn: NGƯỜI.
- [ ] **N.4 — Chốt số ô đọc được ở 3–5 m** trên đúng màn LCD sẽ dùng, và **xác nhận panel
  ≥ 43 inch**. Dưới 43" thì lời hứa "đọc ở 3–5 m" không giữ được — giới hạn vật lý.
  - (e) chặn: NGƯỜI.
- [x] **N.5 — Repo GitHub cho Vòng Quay.** Xem hạng mục `0.1` — phải xong **trước** khi gộp.
  - (e) chặn: NGOÀI.
- [ ] **N.8 — Tư thế linh vật "chỉ tay vào QR".** Brand (dòng 909) đòi mascot chỉ QR cho phong
  cách direct-response. Chưa có file. Không giả lập bằng cách xoay ảnh — brand cấm xoay.
  - (e) chặn: NGOÀI — cần chủ thương hiệu xuất thêm tư thế.
- [ ] **N.9 — Xác nhận font chính thức.** Bộ nhận diện **tự khai là chưa có font chính thức**
  (dòng 562) và cấm tự tuyên bố một font là font thương hiệu. App đang dùng Be Vietnam Pro.
  - (e) chặn: NGƯỜI.

---

## TỔNG KẾT

| Giai đoạn | Kết thúc bằng | Ngày công |
| --- | --- | --- |
| **0** — Cứu code, chốt tiền đề | Mở link GitHub thấy code | 0,5 |
| **1** — Gộp phần máy + menu ba game | Một lần đăng nhập, ba game, tạo được chương trình | 2,75 |
| **2** — Bật công tắc + bốn lỗi chặn | Quét QR vào được, có tiếng, hai màn khớp, chữ đọc được | 1,25 |
| **3** — Màn LCD 16:9 theo brand | Đứng cách 3–5 m đọc được mọi thứ | 1,75 |
| **4** — Điện thoại một khung hình | Chơi trọn ván không vuốt lần nào | 1,25 |
| **5** — Sửa chương trình + N lượt | Sửa chương trình đang chạy, quay 3 lượt liền | 2,0 |
| **6** — Năm kiểu nhạc + thống kê khách | Nghe thử 5 kiểu, tra mã ra khách | 2,0 |
| | **Tổng** | **11,5 ngày** |

Cộng đệm 25% cho việc phát sinh ⇒ **14–15 ngày**.

**Cắt được nếu cần giao sớm** (1,5 ngày): `4.3` bảng đáp ứng · trang `/quan-tri/game` ·
sinh lead · nối dây trần giải. Còn lại đều là nền móng hoặc thứ anh đã yêu cầu đích danh.

**Điểm DỪNG BẮT BUỘC chờ duyệt:** đẩy code lên GitHub · **hạng mục `2.1`** (điểm không quay
lại — bật Vòng Quay vào hai trang công khai của app đang chạy thật) · đưa máy ra quầy phục vụ
phụ huynh thật · bất cứ việc nào phát sinh ngoài lộ trình này.

**Ba rủi ro nặng nhất — R1, R2, R3 — nằm trọn trong Giai đoạn 1.** Hết ngày thứ ba anh đã biết
việc gộp có sống được không. Vỡ thì lùi lại chỉ mất 3 ngày và chưa đụng gì tới giao diện.
