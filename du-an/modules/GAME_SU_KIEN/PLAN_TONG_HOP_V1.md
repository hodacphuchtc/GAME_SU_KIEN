# GAME SỰ KIỆN — Lộ trình TỔNG HỢP v1: ba game ngang hàng + sổ hồ sơ khách

> ✅ **ĐÃ DUYỆT 02/09/2026.** Giai đoạn 0 → 4 **XONG PHẦN MÁY** (13/19 hạng mục).
>
> **Đo được sau khi làm xong** (chạy trong `modules/GAME_SU_KIEN/app/`):
>
> | Cổng | Trước gói | Sau gói |
> | --- | --- | --- |
> | `npm test` | 597 / 51 file | **665 / 54 file** |
> | `npm run build` | 28 route | **29 route** |
> | `npm run e2e` | 20/20 | **20/20** (exit 0) |
> | `npx tsc --noEmit` · `npm run lint` | xanh | xanh |
> | Backfill v3 trên bản sao CSDL quầy | — | **0 cặp gộp · 0 số đổi · 0 dòng suy suyển** |
>
> **Còn lại:** Giai đoạn 5 (ba kịch bản e2e) · `N.1`–`N.4` (việc của người).

**Mục tiêu:** đưa Chọn Số và Vòng Quay lên **ngang hàng với Trúng Số** ở màn quản trị (mã QR ·
màn hình LCD · tắt chương trình · danh sách khách), và dựng **một hồ sơ khách duy nhất xuyên ba
game** — không đẻ khách ảo, và mọi thay đổi thông tin đều để lại dấu vết.

**Kiến trúc:** không thêm app, không thêm CSDL. Mọi thứ nằm trong
`modules/GAME_SU_KIEN/app/`, rẽ nhánh bằng cột `chuong_trinh.tro_choi` như ADR-011 đã chốt.
Bảng mới đi qua `lib/db/nang-cap.ts`, **không đụng `lib/db/luoc-do.ts`** — CSDL đang phục vụ
quầy phải nâng cấp được tại chỗ.

**Công nghệ:** Next.js 16.3.3 · React 19.2.8 · Tailwind 4 · `node:sqlite` · vitest 4 ·
Playwright qua `tests/e2e/playwright.mjs`. **Không thêm một dependency nào.**

---

## 🔴 ĐO TRƯỚC, KẾT LUẬN SAU — đọc mục này trước khi duyệt

Ba phép đo trên **CSDL thật đang chạy** và trên **chính hàm khoá gộp**:

| Phép đo | Kết quả |
| --- | --- |
| `nguoi_choi` | 14 bản ghi · **14 số điện thoại phân biệt · 0 trùng** |
| Người có ≥ 2 dòng khách tiềm năng | **0 / 10** |
| `nguoi_choi.so_dien_thoai` | **`NOT NULL UNIQUE`** (`lib/db/luoc-do.ts:36`) |
| Đường nhận diện khách | **DUY NHẤT một** — cả ba game gọi `nhanDienNguoiChoi` (`app/actions/choi.ts:207`) |

**Việc gộp khách theo số điện thoại ĐÃ XONG từ trước khi câu hỏi được đặt ra.** Một số = một
hồ sơ. Không tồn tại "khách ảo do ba game".

Một nửa câu hỏi *"lấy thông tin mới hay cũ"* cũng đã được quyết sẵn trong code
(`lib/nguoi-choi/nhan-dien.ts:60-68`):

```sql
update nguoi_choi
   set ho_ten = ?,                              -- đè thẳng, tên cũ BIẾN MẤT
       dong_y_tu_van = max(dong_y_tu_van, ?),   -- chỉ bật thêm, KHÔNG tự tắt
       sua_luc = ?
 where id = ?
```

Cờ *đồng ý nhận tư vấn* đã đi một chiều — **đúng**, vì nó là căn cứ pháp lý để gọi điện, và
"lần sau không tích lại" không phải hành động rút lại.

⇒ **Chỗ hở thật chỉ có hai:** ① `ho_ten` bị đè không dấu vết · ② khoá gộp nhận cả số 11 chữ số
kiểu cũ lẫn số 10 chữ số kiểu mới của **cùng một thuê bao**.

---

## 🔴 BẢNG RỦI RO — xếp SỚM NHẤT, không để cuối

| Mã | Rủi ro | Hậu quả nếu vỡ | Làm ở |
| --- | --- | --- | --- |
| **R1** | `xoaTheoSdt` (`lib/nhat-ky/kho.ts:121-140`) dọn `van_choi` + `luot_choi` nhưng **quên `luot_quay`**; `foreign_keys = ON` có hiệu lực thật | **Xoá dữ liệu khách theo NĐ 13/2023 NÉM LỖI** với bất kỳ ai từng quay vòng quay. Đây là **hồi quy do chính việc gộp Vòng Quay hôm nay tạo ra** | **0.1** — hạng mục đầu tiên |
| **R2** | `datTrangThaiChuongTrinh` (`app/actions/chuong-trinh.ts:116-125`) không `batBuocDangNhap()`, không `phamViCua()` | **Sale cơ sở A tắt được chương trình đang chạy của cơ sở B.** Đúng vết sẹo đã ghi ở `CLAUDE.md` | **0.2** |
| **R3** | Cùng hàm đó `redirect` cứng về `/quan-tri/chuong-trinh/{ma}` — route CHỈ của Trúng Số | **Chọn Số đang hỏng SẴN**: tắt chương trình xong rơi vào 404. Thêm nút cho Vòng Quay là nhân bản lỗi | **0.2** |
| **R4** | `chuanHoaSdt` nhận cả `01629123456` lẫn `0329123456` — **cùng một thuê bao sau đợt chuyển đầu số 2018** | Hai hồ sơ cho một người. `UNIQUE` không đỡ được. Việc gộp là **KHÔNG HOÀN TÁC ĐƯỢC** | **1.1–1.3** — làm khi còn **0 cặp trùng**, tức bây giờ |
| **R5** | Thả `<NutIn>` vào trang chưa rắc class `khong-in` | Bấm In ra **cả danh sách khách hàng trên giấy** — rò rỉ dữ liệu cá nhân ra vật lý, không thu hồi được | **2.2** |
| **R6** | Đổi `lichSuLuot` từ che-ở-SQL sang che-ở-trình-duyệt | Số điện thoại đầy đủ đi xuống máy khách; ai mở công cụ nhà phát triển là đọc được dù chưa bấm nút | **2.3** |

**Nguyên tắc xếp thứ tự:** R1–R3 nằm trọn Giai đoạn 0 (nửa ngày đầu). R4 làm ngay Giai đoạn 1
**vì hôm nay nó là no-op** — 0 cặp trùng, chạy thử không mất gì; để sáu tháng nữa mới làm là gộp
kèm hàng nghìn lượt chơi và một cuộc đối soát quà.

---

## KHÔNG LÀM Ở PHIÊN BẢN NÀY (cố ý)

| Không làm | Vì sao |
| --- | --- |
| **Gộp lead xuyên cơ sở** | `UNIQUE (co_so_id, nguoi_choi_id)` + chú thích ở `lib/lead/kho.ts:222-223`: *"Cùng SĐT chơi ở HAI cơ sở thì thành HAI lead: hai đội sale khác nhau, và gộp lại là hai bên tranh một ô."* Gộp là **đảo một quyết định thiết kế đã ghi bằng văn bản**, không phải sửa lỗi. Trang chi tiết khách sẽ **hiện cả hai dòng** cho người xem tự thấy |
| **Nút "Xoá chương trình" cho Chọn Số / Vòng Quay** | `xoaHoacAnChuongTrinh` dùng `timTheoMa` (chỉ Trúng Số) và `demRangBuoc` đếm `van_choi`; Vòng Quay ghi `luot_quay` ⇒ phải viết nhánh đếm riêng. Việc độc lập, không chặn gì |
| **Ghim tên do sale sửa tay** | Anh Phúc đã chốt "bản mới thắng". Ghim là tầng thứ hai — thêm khi thật sự thấy khách gõ nghịch làm hỏng dữ liệu |
| **Hoàn tác việc gộp khách** | Cần một bảng lưu trạng thái trước khi gộp. Hôm nay 0 cặp trùng nên chưa đáng dựng |
| **Dùng chung `<DaiCanhBaoKho>` cho Vòng Quay** | Hai kiểu `CanhBaoKho` khác hẳn nhau (`lib/qua/canh-bao.ts` có `loaiDangTrao`/`conLai`/`tong`; `lib/vong-quay/canh-bao-o.ts` có `muc`/`sapHet`/`soOThat`). Ngữ nghĩa xanh–vàng–đỏ **cố ý khác** |
| **Hợp nhất `lichSuLuot` với `lichSu` của hai game kia** | Vòng quay không có khái niệm "trúng/trượt", "lệch N số", "số lần bấm". Dùng chung là để lại năm cột nói dối trên mỗi dòng |
| **HTTPS / tên miền công khai** | Vẫn chạy mạng nội bộ. Hạng mục `N.6` của sổ app đích, chưa tới |

---

## RÀNG BUỘC TOÀN CỤC (áp cho MỌI hạng mục)

- 🔴 **KHÔNG sửa `lib/db/luoc-do.ts`.** Mọi bảng/cột mới đi qua `BANG_BO_SUNG` / `COT_BO_SUNG`
  của `lib/db/nang-cap.ts`. Thứ tự trong `nangCap()` là bắt buộc: bảng → cột → chỉ mục → backfill.
- 🔴 **Mọi câu SQL quản trị mang đủ `locPhamVi` + `locTroChoi`.** Thiếu một trong hai: màn game
  này hiện chương trình game kia, hoặc danh sách đang chạy thật **biến mất** — không một dòng lỗi.
- 🔴 **Server action tự đọc phiên**, không nhận `PhamVi` từ máy khách. Luật ghi ở
  `app/actions/lead.ts:16-18`.
- Chữ hiển thị **Tiếng Việt 100%, đúng dấu**. Khoá mới thêm vào `config/locale.ts` **cùng commit**
  với nơi dùng — `tests/locale.test.ts` canh khoá mồ côi.
- Hằng số nghiệp vụ đọc từ `config/`, mỗi con số kèm câu trả lời "vì sao là số đó".
- Sau MỖI hạng mục: `npx tsc --noEmit` · `npm run lint` · `npm test` · `npm run build` xanh mới
  đi tiếp. **Mốc hiện tại: 597 test · 28 route · e2e 20/20 — không được tụt.**
- ⚠️ `vitest` **không chạy `tsc`**. Bộ test xanh KHÔNG có nghĩa là mã biên dịch được. Chạy cả hai.
- ⚠️ `lệnh | head` trả mã thoát của `head`. Muốn vừa xem vừa lấy mã thoát thì chạy lệnh trần.

**Khuôn hạng mục:** (a) làm gì · (b) anh kiểm chứng bằng cách nào · (c) test tự động ·
(d) thời gian · (e) chặn ở đâu · (f) phụ thuộc.
Hai dòng (e)(f) là luật của `.claude/rules/workflow.md`, giữ để trả lời được câu *"còn việc nào
giao máy làm ngay được không"*.

---

## GIAI ĐOẠN 0 — Vá ba lỗi ĐANG SỐNG (0,5 ngày)

**🏁 DEMO cuối GĐ:** anh mở `/quan-tri/chon-so`, vào một chương trình, bấm **TẮT CHƯƠNG TRÌNH** →
trang **quay về đúng chi tiết Chọn Số**, không phải màn 404 như bây giờ. Rồi anh vào
`/quan-tri/nhat-ky`, dùng ô xoá dữ liệu theo số điện thoại với một số **đã từng quay vòng quay** →
**xoá được, không văng lỗi**.

- [x] **0.1 — 🔴 R1: Xoá dữ liệu khách theo NĐ 13/2023 đang NÉM LỖI**
  - (a) `lib/nhat-ky/kho.ts:121-140` — `xoaTheoSdt` dọn `van_choi` và `luot_choi` nhưng **quên
    `luot_quay`** (bảng khai ở `nang-cap.ts:102-120`, không ở `luoc-do.ts`, nên dễ sót). Thêm
    `update luot_quay set nguoi_choi_id = null where nguoi_choi_id = ?` **trước** câu
    `delete from nguoi_choi`. Đồng thời bọc cả bốn câu trong `BEGIN IMMEDIATE` / `COMMIT` /
    `ROLLBACK` — docstring dòng 112 **đã khẳng định là có transaction** trong khi thực tế là bốn
    lệnh autocommit rời rạc.
  - (b) Đăng nhập bằng tài khoản quản trị → `/quan-tri/nhat-ky` → khu "Xoá dữ liệu theo số điện
    thoại" → nhập số của một khách **đã từng quay vòng quay** → bấm Xoá. **Trước khi vá: văng lỗi
    ràng buộc khoá ngoại. Sau khi vá: báo đã xoá N dòng.** Mở lại `/quan-tri/khach` thấy khách đó
    biến mất, còn `/quan-tri/vong-quay/<mã>` vẫn hiện lượt quay cũ nhưng cột Khách thành "—".
  - (c) `tests/rieng-tu.test.ts` thêm hai ca: **"khách đã quay vòng quay thì xoá được, KHÔNG ném"**
    và **"xoá hỏng giữa chừng thì không để lại nửa vời"** (giả lỗi rồi khẳng định số dòng cả bốn
    bảng y hệt lúc đầu).
  - (d) 0,25 ngày.
  - (f) phụ-thuộc: không

- [x] **0.2 — 🔴 R2 + R3: Tắt/bật chương trình — vá lỗ hổng quyền và lỗi 404**
  - (a) `app/actions/chuong-trinh.ts:116-125`. Hai lỗi, một sửa đổi:
    **① Quyền** — thêm `const nguoi = await batBuocDangNhap();` rồi tra chương trình bằng
    `timTheoMaBatKeTroChoi(ma, phamViCua(nguoi))`. Hàm này **đã có sẵn ở
    `lib/chuong-trinh/kho.ts:298` và đang MỒ CÔI** (chỉ test gọi) — nó được viết đúng cho cửa dùng
    chung này, chú thích ở dòng 290-297 nói rõ vậy. Không tìm thấy → `notFound()`.
    **② Đường về** — bỏ `redirect` cứng, map từ `ct.troChoi`:
    `trung_so → /quan-tri/chuong-trinh/{ma}` · `chon_so → /quan-tri/chon-so/{ma}` ·
    `vong_quay → /quan-tri/vong-quay/{ma}`.
  - (b) **Lỗi 404:** `/quan-tri/chon-so` → vào một chương trình → bấm **TẮT CHƯƠNG TRÌNH** → phải
    quay về đúng trang đó với nhãn đổi thành **BẬT LẠI CHƯƠNG TRÌNH**. (Trước khi vá: màn 404.)
    **Lỗ hổng quyền:** đăng nhập bằng một tài khoản **sale của Cơ sở 1**, mở tab mới gõ tay
    `/quan-tri/chuong-trinh/<mã của Cơ sở 2>` → phải ra **404**, và nếu có cách bấm được nút Tắt
    thì nó phải **không đổi được gì**.
  - (c) `tests/phan-quyen.test.ts` thêm: **"sale cơ sở A KHÔNG tắt được chương trình cơ sở B"**
    (khẳng định `trang_thai` trong CSDL không đổi) và **"quản trị toàn hệ thống thì tắt được"**.
    `tests/bat-tat.test.ts` thêm ba ca đường về cho ba game.
  - (d) 0,25 ngày.
  - (f) phụ-thuộc: không

---

## GIAI ĐOẠN 1 — Khoá gộp không đẻ khách ảo (0,75 ngày)

**🏁 DEMO cuối GĐ:** anh chơi một ván bằng số **`0329123456`**, rồi chơi ván nữa bằng số
**`01629123456`** (chính số đó ở dạng 11 chữ số kiểu cũ). Mở `/quan-tri/khach` → **chỉ có MỘT
dòng khách**, không phải hai. Trước khi vá thì ra hai dòng.

> **Vì sao làm ngay bây giờ:** đo được **0 cặp trùng** trên dữ liệu thật. Bước gộp hôm nay là
> **no-op** — chạy thử không mất gì. Để sáu tháng nữa là gộp kèm hàng nghìn lượt chơi và một
> cuộc đối soát quà, mà việc gộp thì **KHÔNG HOÀN TÁC ĐƯỢC**.

- [x] **1.1 — Bảng chuyển đầu số 11 → 10 chữ số**
  - (a) Tạo `config/dau-so.ts` chứa bảng chuyển của đợt chuyển đầu số toàn quốc **2018** — đây là
    dữ kiện có thật do nhà mạng công bố, không phải quy ước tự đặt:
    Viettel `0162→032 0163→033 0164→034 0165→035 0166→036 0167→037 0168→038 0169→039` ·
    VinaPhone `0123→083 0124→084 0125→085 0127→081 0129→082` ·
    MobiFone `0120→070 0121→079 0122→077 0126→076 0128→078` ·
    Vietnamobile `0186→056 0188→058` · Gmobile `0199→059`. Tổng **23 đầu số**.
    Kèm chú thích: *một dãy 11 số bắt đầu bằng đầu số KHÔNG nằm trong bảng này thì giữ nguyên —
    nó là số cố định hoặc số lạ, đoán bừa còn tệ hơn không đoán.*
  - (b) Chưa bấm được gì. Bằng chứng thay thế: tôi chạy `node` in ra bảng chuyển và dán cho anh
    đối chiếu với công bố của nhà mạng.
  - (c) `tests/so-dien-thoai.test.ts` — bảng tra 23 đầu số, mỗi dòng một ca; cộng ca **"đầu số
    không có trong bảng thì giữ nguyên"**.
  - (d) 0,25 ngày.
  - (f) phụ-thuộc: không

- [x] **1.2 — `chuanHoaSdt` áp bảng chuyển**
  - (a) `lib/nguoi-choi/so-dien-thoai.ts:9-19` — sau bước quy `+84`/`84` về `0`, nếu chuỗi dài 11
    và bốn ký tự đầu nằm trong bảng thì đổi sang đầu số mới. Regex cuối `/^0\d{9,10}$/` **giữ
    nguyên** (số 11 chữ số ngoài bảng vẫn hợp lệ). **Từ nay không đẻ thêm cặp trùng nào.**
  - (b) Ở màn chơi của bất kỳ game nào, điền số `01629123456` → nhận diện xong, mở
    `/quan-tri/khach` thấy số hiển thị là **`0329123456`**.
  - (c) `tests/nhan-dien.test.ts` thêm: **`chuanHoaSdt("01629123456") === chuanHoaSdt("0329123456")`**;
    và **"hai lần `nhanDien` bằng hai dạng của cùng một số chỉ tạo MỘT `nguoi_choi`"** (đếm
    `select count(*) from nguoi_choi`).
  - (d) 0,25 ngày.
  - (f) phụ-thuộc: 1.1

- [x] **1.3 — 🔴 R4: Backfill v3 — quy chuẩn số đã lưu và gộp cặp trùng**
  - (a) `lib/db/nang-cap.ts`: viết `backfillV3(db)`, thêm `if (pb < 3) backfillV3(db);` **sau**
    dòng `pb < 2`, nâng `PHIEN_BAN_DU_LIEU` 2 → 3. Nội dung: duyệt `nguoi_choi`, quy chuẩn số;
    nếu số mới **đụng một hồ sơ đã tồn tại** thì gộp — trỏ lại **ĐỦ BỐN bảng**: `luot_choi` ·
    `van_choi` · `khach_tiem_nang` · 🔴 **`luot_quay`** (chính bảng mà `xoaTheoSdt` đã quên, xem 0.1).
    🔴 **Xử `UNIQUE (co_so_id, nguoi_choi_id)` TRƯỚC khi `UPDATE`, nếu không nó NỔ**: giữ
    `trang_thai` tiến xa nhất theo thứ tự `moi < da_lien_he < hen_hoc_thu < khong_nghe_may < chot`,
    nối `ghi_chu` hai bên (cắt 500 ký tự), giữ `nhan_vien_id` của bản có `giao_luc` sớm hơn,
    `tao_luc` nhỏ nhất, `sua_luc` lớn nhất. Ghi `HANH_DONG.gopKhach` (khoá mới —
    `nhat_ky_truy_cap.hanh_dong` là TEXT tự do, **không cần migration**).
  - (b) 🔴 **DỪNG BẮT BUỘC — anh duyệt trước khi chạy trên CSDL thật.** Tôi chạy trên **bản sao**
    trước, in ra bảng "sẽ gộp N cặp, đụng M dòng ở 4 bảng" và dán cho anh xem. Với dữ liệu hôm nay
    con số đó phải là **0**. Sau khi anh duyệt: khởi động lại máy chủ, mở `/quan-tri/khach`, đếm
    số dòng — phải **y hệt trước đó**.
  - (c) `tests/nang-cap.test.ts` thêm bốn ca: **gộp đúng** (dựng hai hồ sơ hai dạng số rồi khẳng
    định còn một, và `luot_quay.nguoi_choi_id` đã trỏ lại) · **chạy HAI LẦN không đổi gì** ·
    **`user_version` lên 3** (số viết thẳng, cố ý không import hằng) · **hai lead cùng cơ sở thì
    gộp chứ không ném `UNIQUE`**.
  - (d) 0,25 ngày.
  - (f) phụ-thuộc: 1.2, 0.1

---

## GIAI ĐOẠN 2 — Ba game ngang hàng ở màn quản trị (1,0 ngày)

**🏁 DEMO cuối GĐ:** anh mở chi tiết chương trình của **cả ba game**, mỗi trang đều có
**In mã QR · Mở màn hình LCD · TẮT CHƯƠNG TRÌNH** ở cùng một chỗ và cùng một hình dáng. Bấm In ở
trang Vòng Quay → **giấy chỉ ra tấm QR**, không ra bảng khách. Quét tấm QR đó bằng điện thoại →
vào đúng màn chơi Vòng Quay. Ở bảng lượt quay, anh **tích được ô "Đã trao"** và bấm được nút
**"Hiện đầy đủ"** để xem số điện thoại.

- [x] **2.1 — Tách nút "Mở màn hình LCD" thành component dùng chung**
  - (a) Nút LCD hiện là thẻ `<a>` viết thẳng trong `app/quan-tri/chuong-trinh/[ma]/page.tsx:99-106`,
    **chưa phải component**. Tạo `components/nut-man-hinh.tsx` nhận `{ ma }`, render
    `<a href={/man-hinh/${ma}} target="_blank" rel="noreferrer">` với đúng class hiện có. Sửa
    trang Trúng Số dùng nó. Route `/man-hinh/[ma]` **đã rẽ nhánh đủ ba game — không sửa gì**.
  - (b) Trang Trúng Số: bấm "Mở màn hình LCD" vẫn mở tab mới đúng như cũ, không đổi gì về mắt.
  - (c) Toàn bộ test cũ xanh + `npm run e2e` (các kịch bản Trúng Số đang bấm nút này).
  - (d) 0,25 ngày.
  - (f) phụ-thuộc: không

- [x] **2.2 — 🔴 R5: Ba nút + mã QR cho Chọn Số và Vòng Quay**
  - (a) **Chọn Số** (`app/quan-tri/chon-so/[ma]/page.tsx`) đã có `NutIn` + `NutBatTat`, chỉ thêm
    `<NutManHinh ma={ct.ma} />` vào cụm nút.
    **Vòng Quay** (`app/quan-tri/vong-quay/[ma]/page.tsx`) thiếu cả ba: thêm cụm
    `<NutIn /> <NutManHinh /> <NutBatTat />`; thêm khối QR bằng 4 dòng server-side chép từ
    `chuong-trinh/[ma]/page.tsx:43-46` (`QRCode.toDataURL` + `headers()`, thư viện `qrcode` đã có
    trong `package.json`); thêm `ghiNhatKy(HANH_DONG.xemLead, …)` như hai trang kia.
    Sửa kèm: **dòng 34 thiếu `.toUpperCase()`** — mở bằng URL viết thường là 404, hai trang kia
    đều có.
    🔴 **BẪY R5:** `NutIn` chỉ gọi `window.print()`, **nó không tự biết cái gì được in**. Cơ chế
    "chỉ in tấm QR" nằm ở class `khong-in` / `chi-in` (`app/globals.css:120-135`). Trang Vòng Quay
    hiện **không có một class nào** ⇒ thả `NutIn` vào là **in cả bảng khách hàng ra giấy**. Phải
    rắc `khong-in` cho: header, cụm nút, dải cảnh báo kho, danh sách ô, bảng lượt quay; và `chi-in`
    cho tên cơ sở (chỉ hiện trên giấy).
  - (b) Vào chi tiết một chương trình **Chọn Số** → thấy đủ ba nút → bấm "Mở màn hình LCD" ra đúng
    màn Chọn Số. Vào chi tiết một chương trình **Vòng Quay** → thấy tấm QR → **quét bằng điện
    thoại thật, phải vào được màn chơi Vòng Quay**. Bấm **In mã QR** → xem bản xem trước khi in:
    **chỉ có tên cơ sở + tấm QR**, tuyệt đối không có dòng khách nào.
  - (c) Kịch bản e2e mới `gd27-ba-game-ngang-hang.mjs` (thêm một dòng vào mảng `KICH_BAN` ở
    `tests/e2e/chay.mjs`): với mỗi game, khẳng định trang chi tiết có đủ ba nút bấm được và có thẻ
    `<img>` mã QR. Cộng một ca **đếm số phần tử KHÔNG mang class `khong-in`** trong trang Vòng Quay
    để chặn ca in nhầm.
  - (d) 0,5 ngày.
  - (f) phụ-thuộc: 2.1, 0.2

- [x] **2.3 — 🔴 R6: Bảng lượt quay ngang hàng hai game kia**
  - (a) Ba việc, việc đầu là **nối dây code đã viết xong mà chưa ai dùng**:
    **① Ô tích "Đã trao"** — `components/o-tich-trao.tsx` và action `danhDauTraoQua`
    (`app/actions/vong-quay-chuong-trinh.ts:73`, đã kiểm `phamViCua` đàng hoàng) **đã viết xong,
    grep toàn repo cho thấy KHÔNG ĐƯỢC IMPORT Ở ĐÂU**. Cột "Đã trao" hiện chỉ là chữ tĩnh.
    **② Nút "Hiện đầy đủ"** (anh Phúc đã chốt đồng bộ theo hai game kia). 🔴 Đổi này chạm kiến
    trúc: `lichSuLuot` hiện che **ngay ở tầng SQL** (`lib/vong-quay/kho-luot-quay.ts:73-74` trả
    `tenRutGon` + `sdtChe`), hai bảng kia trả thô rồi che ở trình duyệt bằng `nhanSdt`
    (`lib/luot/hien-thi.ts:27`). Đổi `lichSuLuot` sang trả thô, che ở client.
    **KHÔNG đụng `toanBoLichSuQuay`** — hàm xuất Excel cố ý tách riêng, lý do ghi ở
    `kho-luot-quay.ts:170-176`.
    **③ Cột "Đồng ý tư vấn"** — `toanBoLichSuQuay` đã lấy `dong_y_tu_van` cho Excel, `lichSuLuot`
    chưa select. Thêm vào SQL + interface.
    Tách bảng ra `components/bang-luot-quay.tsx` (hiện viết inline trong page), theo khuôn
    `components/bang-lich-su-chon-so.tsx`.
  - (b) Chơi một lượt Vòng Quay → vào chi tiết chương trình → **tích ô "Đã trao"**, tải lại trang
    thấy dấu tích còn nguyên. Bấm **"Hiện đầy đủ"** → số điện thoại hiện đủ 10 số; bấm **"Che lại"**
    → về `09*****678`. Thấy thêm cột **Đồng ý tư vấn** với badge Có/Không.
  - (c) `tests/vong-quay-kho.test.ts` thêm: `lichSuLuot` trả **số thô** (không còn dấu `*`), và
    `toanBoLichSuQuay` **vẫn** trả số thô như cũ. Kịch bản e2e `gd28-vong-quay-trao-qua.mjs`:
    tích ô rồi tải lại trang, khẳng định dấu tích còn.
  - (d) 0,25 ngày.
  - (f) phụ-thuộc: 2.2

---

## GIAI ĐOẠN 3 — Sổ hồ sơ khách + thống kê xuyên ba game (1,75 ngày)

**🏁 DEMO cuối GĐ:** anh chơi Trúng Số bằng số của mình khai tên **"Phúc"**, rồi chơi Vòng Quay
bằng đúng số đó khai tên **"Hồ Đắc Phúc"**. Mở `/quan-tri/khach`: **một dòng duy nhất**, tên hiện
là **"Hồ Đắc Phúc"**, cột **"Game đầu tiên"** ghi *Trúng Số*, và cạnh ô ghi chú có dòng
*"ⓘ Từng khai: Phúc"*. Bấm vào tên → mở trang chi tiết khách thấy **cả hai game**, từng lượt chơi,
và sổ thay đổi ghi rõ *"02/09 14:20 · Họ tên: Phúc → Hồ Đắc Phúc · Vòng Quay · Cơ sở 1"*.

- [x] **3.1 — Bảng `nguoi_choi_thay_doi` + ghi sổ khi tên đổi**
  - (a) Thêm qua `BANG_BO_SUNG` của `lib/db/nang-cap.ts` (**không đụng `luoc-do.ts`**):
    `id · nguoi_choi_id (FK) · truong · gia_tri_cu · gia_tri_moi · chuong_trinh_id (nullable) ·
    nhan_vien_id (nullable) · luc`, cộng chỉ mục `thay_doi_theo_nguoi (nguoi_choi_id, luc DESC)`.
    Ghi trong `lib/nguoi-choi/nhan-dien.ts:59-70`: trước khi `update`, so tên mới với `cu.ho_ten`;
    khác thì chèn một dòng sổ.
    🔴 **So bằng khoá chuẩn hoá theo đúng khuôn `khoaTenCoSo`** (`lib/co-so/nhan.ts:34-44` —
    `normalize("NFC") + trim + collapse + toLocaleLowerCase("vi")`). Không NFC thì trên macOS
    chuỗi gõ bàn phím và chuỗi chép từ Finder là hai dãy mã khác nhau của **cùng một chữ** ⇒ sổ đẻ
    ra một dòng vô nghĩa mỗi lần khách chơi lại. `nhanDien` hiện chỉ `trim + collapse`, **yếu hơn**.
    ⚠️ `nhanDien` chưa nhận `chuongTrinhId`/`nhanVienId` — nới chữ ký bằng **tham số tuỳ chọn** để
    mọi nơi gọi cũ không gãy.
  - (b) Chưa có giao diện — chứng minh ở 3.3. Nếu muốn tự yên tâm: mở
    `du-lieu/game-su-kien.db` bằng công cụ xem SQLite bất kỳ, thấy bảng `nguoi_choi_thay_doi` và
    một dòng sau khi anh chơi lại bằng tên khác.
  - (c) `tests/nhan-dien.test.ts` thêm: **đổi tên sinh ĐÚNG MỘT dòng sổ với `gia_tri_cu`/`gia_tri_moi`
    đúng**; **đổi cách viết hoa hoặc khoảng trắng KHÔNG sinh dòng nào**; **hai dạng NFC/NFD của
    cùng một tên KHÔNG sinh dòng nào**. `tests/nang-cap.test.ts`: bảng mới ra đời trên CSDL cũ,
    chạy hai lần không xoá dòng nào, cập nhật số bảng (11 → 12, số viết thẳng kèm chú thích ngày).
  - (d) 0,5 ngày.
  - (f) phụ-thuộc: 1.3

- [x] **3.2 — Cột "Game đầu tiên" + bộ lọc theo game ở tab khách**
  - (a) Suy từ `khach_tiem_nang.chuong_trinh_id_dau → chuong_trinh.tro_choi`, **không cần cột mới**.
    Sửa đúng 4 chỗ: `CAU_CHON` (`lib/lead/kho.ts:71-80`, thêm
    `left join chuong_trinh ct on ct.id = k.chuong_trinh_id_dau`), `interface Lead` + `DongLead` +
    `doiDong` (`:18-69`), `components/bang-lead.tsx:276-320`, `lib/xuat/bang-lead.ts:20-41`.
    Bộ lọc theo chương trình **đã có sẵn trong kho và đã có test** (`lib/lead/kho.ts:130, 145-148` ·
    `tests/lead.test.ts:144`) nhưng chưa nối UI — thêm select "Game" vào `bang-lead.tsx` dùng URL
    param như các bộ lọc khác.
    🔴 **Nhãn cột phải là "Game đầu tiên", KHÔNG phải "Game".** Upsert của `sinhLead`
    (`lib/lead/kho.ts:236-237`) cố ý không cập nhật cột đó, nên nó chỉ ghi game ĐẦU. Một nhãn mơ hồ
    ở đây là mời người đọc kết luận sai về khách của mình. Cột cũng có thể **rỗng** —
    `ON DELETE SET NULL` khi chương trình bị xoá, và đó là **điều kiện của tính năng xoá chương
    trình** (`lib/chuong-trinh/kho.ts:448-449`).
  - (b) `/quan-tri/khach` → thấy cột mới **"Game đầu tiên"** với ba giá trị Trúng Số / Chọn Số /
    Vòng Quay. Chọn "Vòng Quay" ở ô lọc **Game** → danh sách chỉ còn khách đến từ vòng quay, và
    URL đổi theo (chép link gửi người khác vẫn ra đúng bộ lọc). Bấm **Xuất Excel** → file có cột
    game và **chỉ chứa đúng những dòng đang lọc**.
  - (c) `tests/lead.test.ts` thêm: **lọc theo game trả đúng tập**; **khách chơi Trúng Số rồi Vòng
    Quay vẫn mang game ĐẦU là Trúng Số**; **chương trình bị xoá thì game nguồn rỗng, không làm vỡ
    trang**. `tests/bang-xuat.test.ts` cập nhật số cột của `bangLead` (9 → 10).
  - (d) 0,5 ngày.
  - (f) phụ-thuộc: không

- [x] **3.3 — Trang chi tiết một khách `/quan-tri/khach/[id]`**
  - (a) Chưa tồn tại, nhưng `timLead(id, pv)` (`lib/lead/kho.ts:197`) **đã có và đã test phân
    quyền** (`tests/phan-quyen.test.ts:90-108`), chỉ thiếu UI. Viết
    `lib/lead/lich-su-khach.ts` với `lichSuChoiCuaKhach(nguoiChoiId, pv)` — hợp nhất `van_choi`
    (Trúng Số + Chọn Số) và `luot_quay` (Vòng Quay), cả hai đều có `nguoi_choi_id` +
    `chuong_trinh_id`, trả về từng lượt kèm game · cơ sở · quà đã nhận · mã xác thực. Trang hiện:
    hồ sơ hiện tại (tên · SĐT che, có nút hiện · đồng ý tư vấn · quan tâm học thử) · **đã chơi
    những game nào** · **sổ thay đổi hồ sơ** (từ 3.1) · **lead ở từng cơ sở**.
    🔴 Một người có lead ở hai cơ sở thì **hiện CẢ HAI dòng, không gộp** — xem mục "KHÔNG LÀM".
    Đặt một dòng chữ giải thích ngay tại đó để người xem không tưởng là lỗi.
    Nối `bang-lead.tsx` cho tên khách thành link tới trang này, và thêm dòng tóm tắt
    *"ⓘ Từng khai: …"* cạnh ô ghi chú. 🔴 **Ô `ghi_chu` giữ nguyên là của sale — máy KHÔNG ghi vào.**
  - (b) `/quan-tri/khach` → bấm vào tên một khách đã chơi ≥ 2 game → trang chi tiết hiện **đủ cả
    hai game** với đúng số lượt. Nếu khách đó từng khai tên khác, mục **Sổ thay đổi** ghi rõ
    *cũ → mới*, lúc nào, từ game nào. Đăng nhập bằng **sale cơ sở khác** rồi gõ tay đúng đường dẫn
    đó → phải ra **404**.
  - (c) `tests/lich-su-khach.test.ts` (mới): hợp nhất đúng ba game; sale cơ sở khác nhận `null`.
    Kịch bản e2e `gd29-chi-tiet-khach.mjs`: chơi hai game bằng cùng một số với hai tên khác nhau,
    khẳng định tab khách chỉ có **một dòng**, trang chi tiết hiện **hai game** và **một dòng sổ**.
  - (d) 0,75 ngày.
  - (f) phụ-thuộc: 3.1, 3.2

---

## GIAI ĐOẠN 4 — Sửa chương trình Vòng Quay (1,0 ngày)

**🏁 DEMO cuối GĐ:** anh vào một chương trình Vòng Quay **đang chạy**, đổi tên đợt, đổi tỉ lệ ô
an ủi, đổi tên một ô **chưa trao cái nào** và thêm một ô mới → Lưu → mở màn LCD thấy **mặt vòng
đã đổi ngay**. Thử xoá một ô **đã trao rồi** → máy chặn kèm **câu giải thích vì sao**, không im lặng.

> Đây là lỗi thứ 5 trong năm lỗi buổi test 02/09 — bốn lỗi kia đã vá.

- [x] **4.1 — Form sửa chương trình + sửa danh sách ô trong MỘT giao dịch**
  - (a) Trúng Số có `components/form-sua-chuong-trinh.tsx`, Chọn Số có `form-sua-chon-so.tsx`,
    Vòng Quay chưa có gì. Viết `components/form-sua-vong-quay.tsx` + `suaVongQuay` trong
    `app/actions/vong-quay-chuong-trinh.ts`, dùng lại `kiemVongQuay` của
    `lib/vong-quay/kiem-tra.ts` (hàm thuần, đã có).
    🔴 **Chương trình và danh sách ô sửa trong MỘT `BEGIN IMMEDIATE`** — khuôn `themVongQuay` đã
    dùng. Tách ra thì một lỗi giữa chừng để lại chương trình có mặt vòng nửa vời trong khi mã QR
    đã dán ở quầy.
    🔴 **Mọi thay đổi danh sách ô phải đi qua `themO`/`suaO`/`xoaO`** — cả ba **đã tự gọi
    `tangPhienBanO`** (`lib/vong-quay/kho-o.ts`). Không tăng phiên bản thì lượt cũ và lượt mới mang
    cùng một số trong khi mặt vòng đã khác, và nút "Dựng lại ván" vẽ ra một vòng **chưa từng tồn
    tại** — đúng thứ nó sinh ra để bác bỏ.
    Ba thứ **KHÔNG cho sửa**, theo đúng luật đã ghi ở `lib/chuong-trinh/kho.ts`: `ma` (đã in ra
    giấy dán quầy), `coSoId`, `cheDo`. Ghi `HANH_DONG.suaChuongTrinh`.
  - (b) Vào chi tiết một chương trình Vòng Quay đang chạy → khu "Sửa chương trình" → đổi tên đợt và
    tỉ lệ ô an ủi → Lưu → **tải lại màn LCD thấy đổi ngay**. Đổi tên một ô chưa trao → lịch sử
    những lượt cũ **vẫn ghi tên cũ** (đây là 5.1 đã làm, giờ là lúc thấy nó chạy thật).
  - (c) `tests/sua-vong-quay.test.ts` (mới): sửa xong `phien_ban_o` **tăng**; ván cũ giữ nguyên
    `o_ten` ảnh chụp; sửa hỏng giữa chừng thì **không đổi một dòng nào** (giả lỗi rồi so snapshot);
    sale cơ sở khác không sửa được.
  - (d) 0,75 ngày.
  - (f) phụ-thuộc: 2.2

- [x] **4.2 — Chặn xoá ô đã trao, nói rõ lý do**
  - (a) `xoaO` (`lib/vong-quay/kho-o.ts`) **đã chặn sẵn** ô từng trao (trả `false`). Việc còn lại là
    giao diện: form phải hiện **vì sao** thay vì im lặng trả về. Thêm khoá locale nói thẳng: *"Ô này
    đã trao N phần quà — không xoá được vì nó là chứng cứ đối soát khi phụ huynh khiếu nại. Muốn
    ngừng phát thì đặt số lượng bằng đúng số đã trao, ô sẽ tự biến khỏi vòng mà lịch sử vẫn còn."*
  - (b) Thử xoá một ô đã có người trúng → thấy đúng câu trên, ô vẫn còn. Làm theo hướng dẫn (đặt số
    lượng = số đã trao) → mở màn LCD thấy ô đó **biến khỏi mặt vòng**, nhưng bảng lịch sử vẫn còn
    những lượt đã trúng nó.
  - (c) `tests/sua-vong-quay.test.ts` thêm: **xoá ô đã trao trả `false` và không xoá dòng nào**;
    **đặt số lượng = số đã trao thì `chiaCung` bỏ ô đó khỏi mặt vòng**.
  - (d) 0,25 ngày.
  - (f) phụ-thuộc: 4.1

---

## GIAI ĐOẠN 5 — Kịch bản e2e cho phần vừa dựng (0,5 ngày)

**🏁 DEMO cuối GĐ:** `npm run e2e` in ra **23/23** thay vì 20/20.

> 🔴 **Vì sao tách ra thành một giai đoạn riêng thay vì im lặng.** Khuôn (c) của các
> hạng mục `2.2` và `3.3` có ghi ba kịch bản e2e mới. Phần **code sản phẩm** của chúng
> đã xong và đã có bài kiểm đơn vị canh, nhưng **ba kịch bản trình duyệt thì chưa viết**.
> Tick hai hạng mục kia mà không nói ra chuyện này là để lại hai dấu tick nói dối.
> Cho tới khi giai đoạn này xong, **ba nút mới và trang chi tiết khách chưa từng được
> bấm thử bằng trình duyệt thật trong bộ kiểm tự động** — chỉ có 665 bài kiểm đơn vị.

- [ ] **5.1 — `gd27-ba-game-ngang-hang.mjs`**
  - (a) Với mỗi game: đăng nhập → mở trang chi tiết một chương trình → khẳng định có đủ
    ba nút bấm được và một thẻ `<img>` mã QR. Thêm một dòng vào mảng `KICH_BAN` của
    `tests/e2e/chay.mjs` (danh sách CỨNG, không quét thư mục).
  - (b) `npm run e2e -- gd27` in ra toàn dấu ✅.
  - (c) Chính nó.
  - (d) 0,25 ngày.
  - (e) chặn: MÁY.
  - (f) phụ-thuộc: 2.2

- [ ] **5.2 — `gd28-vong-quay-trao-qua.mjs` + `gd29-chi-tiet-khach.mjs`**
  - (a) `gd28`: tích ô "Đã trao" rồi tải lại trang, khẳng định dấu tích còn; bấm
    "Hiện đầy đủ" khẳng định số điện thoại hiện đủ 10 số. `gd29`: chơi hai game bằng
    CÙNG một số với HAI tên khác nhau → tab khách chỉ có **một dòng**, có dòng
    "ⓘ Từng khai…"; bấm vào tên ra trang chi tiết thấy **hai game** và **một dòng sổ**.
  - (b) `npm run e2e` in ra 23/23.
  - (c) Chính nó.
  - (d) 0,25 ngày.
  - (e) chặn: MÁY.
  - (f) phụ-thuộc: 2.3, 3.3

---

## VIỆC CỦA NGƯỜI / CHỜ NGOÀI (không chặn phần máy)

- [ ] **N.1 — Xác nhận bảng đầu số 2018**
  - (a) Đối chiếu 23 dòng trong `config/dau-so.ts` (hạng mục 1.1) với công bố của năm nhà mạng.
    Máy tra được, nhưng đây là dữ kiện pháp lý–viễn thông; sai một dòng là gộp nhầm hai người
    thành một, và việc gộp KHÔNG hoàn tác được.
  - (b) Tôi in bảng 23 đầu số ra màn hình; anh đối chiếu với thông báo của nhà mạng rồi nói "đúng"
    hoặc chỉ ra dòng sai.
  - (c) `tests/so-dien-thoai.test.ts` canh đúng bảng anh đã xác nhận — nhưng test chỉ canh máy làm
    đúng theo bảng, KHÔNG canh được bảng có đúng ngoài đời hay không. Đó là lý do mục này tồn tại.
  - (d) 15 phút của anh.
  - (e) chặn: NGƯỜI.
  - (f) phụ-thuộc: 1.1

- [ ] **N.2 — Duyệt chạy backfill v3 trên CSDL thật**
  - (a) Hạng mục 1.3 sẽ quy chuẩn số điện thoại đã lưu và **gộp các hồ sơ trùng**. Thao tác này
    **KHÔNG HOÀN TÁC ĐƯỢC** — không có bảng nào lưu trạng thái trước khi gộp.
  - (b) Tôi chạy trên **bản sao** CSDL trước, in bảng "sẽ gộp N cặp, đụng M dòng ở 4 bảng". Với dữ
    liệu hôm nay con số phải là **0**. Anh xem con số đó rồi nói DUYỆT thì tôi mới chạy thật.
  - (c) Không có — đây là một quyết định, không phải một phép kiểm. Bốn ca test của 1.3 chạy trên
    CSDL tạm, chúng không thay được việc anh nhìn con số trên dữ liệu thật.
  - (d) 10 phút của anh.
  - (e) chặn: NGƯỜI.
  - (f) phụ-thuộc: 1.3

- [ ] **N.3 — Chốt danh mục quà thật cho Vòng Quay**
  - (a) Tên · số lượng · trần mỗi ngày cho từng loại quà, và **ít nhất MỘT loại không giới hạn**
    (ô đáy). Thiếu ô đáy thì hết quà là hết trò: vòng quay rỗng ngay giữa lúc có phụ huynh đang
    đứng trước màn hình — `kiemVongQuay` chặn cứng ca này.
  - (b) Anh đưa danh sách; tôi khai vào một chương trình thật rồi anh mở màn LCD đứng lùi 3 mét
    đọc thử xem tên quà có đọc được không.
  - (c) Không có — máy không biết trung tâm định phát quà gì.
  - (d) Thời gian của anh + bộ phận kho.
  - (e) chặn: NGƯỜI.
  - (f) phụ-thuộc: không

- [ ] **N.4 — Nghiệm thu trên máy quầy thật**
  - (a) Chạy `npm run trung-tam` trên đúng máy sẽ đặt ở quầy, mở màn LCD **bằng địa chỉ IP LAN**
    (không phải `localhost` — mã QR sẽ mã hoá đúng chữ đó và điện thoại quét vào sẽ trỏ về chính
    nó), quét bằng điện thoại thật, chơi trọn một ván ba game.
  - (b) Chính là mục (a) — anh tự bấm.
  - (c) `npm run e2e` chạy trình duyệt thật nhưng trên **máy phát triển**, không phải máy quầy và
    không qua wifi trung tâm. Nó không thay được lần bấm này.
  - (d) 30 phút của anh, sau khi xong Giai đoạn 4.
  - (e) chặn: NGƯỜI.
  - (f) phụ-thuộc: 4.2

---

## TỔNG KẾT

| Giai đoạn | Kết thúc bằng | Ngày công |
| --- | --- | --- |
| **0** — Vá ba lỗi đang sống | Tắt Chọn Số không còn 404 · xoá khách đã quay không văng lỗi | 0,5 |
| **1** — Khoá gộp không đẻ khách ảo | Hai dạng của một số điện thoại ra **một** dòng khách | 0,75 |
| **2** — Ba game ngang hàng | Ba trang chi tiết giống hệt nhau · in ra giấy chỉ có QR | 1,0 |
| **3** — Sổ hồ sơ khách xuyên game | Một khách, hai game, một dòng sổ ghi tên đã đổi | 1,75 |
| **4** — Sửa chương trình Vòng Quay | Sửa mặt vòng đang chạy, ô đã trao bị chặn có lý do | 1,0 |
| | **Tổng** | **5,0 ngày** |

Cộng đệm 25% cho việc phát sinh ⇒ **6–7 ngày**.

**Cắt được nếu cần giao sớm** (0,75 ngày): hạng mục `3.3` trang chi tiết khách — cột "Game đầu
tiên" và sổ thay đổi ở `3.1`/`3.2` vẫn dùng được mà không có trang riêng. Còn lại đều là vá lỗi
đang sống hoặc thứ anh đã yêu cầu đích danh.

**Điểm DỪNG BẮT BUỘC chờ duyệt:** chạy backfill v3 trên CSDL thật (`1.3`) · commit/push ·
đưa máy ra quầy phục vụ phụ huynh thật · bất cứ việc nào phát sinh ngoài lộ trình này.

**Ba rủi ro nặng nhất — R1, R2, R3 — nằm trọn Giai đoạn 0, tức nửa ngày đầu.** R4 (gộp khách,
không hoàn tác được) nằm ở Giai đoạn 1 **vì hôm nay nó là no-op**: đo được 0 cặp trùng, nên đây
là lúc rẻ nhất và an toàn nhất để làm.

---

## CỔNG NGHIỆM THU (chạy trong `modules/GAME_SU_KIEN/app/`)

```bash
npx tsc --noEmit && npm run lint && npm test && npm run build && npm run e2e
```

**Mốc hiện tại phải giữ hoặc vượt:** 597 test · 51 file · 28 route · e2e 20/20.
**Dự kiến sau lộ trình:** ~650 test · ~30 route · e2e 23/23 (thêm `gd27`, `gd28`, `gd29`).
