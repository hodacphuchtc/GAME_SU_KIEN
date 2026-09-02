# PLAN — v3 · Game thứ hai: **CHỌN SỐ**

> 🔴 **Sổ này nói về game CHỌN SỐ, không phải về Trúng Số.** Nó mang tên `TRUNG_SO_V3` vì
> Chọn Số **gộp thẳng vào app Trúng Số** (một app, hai game) — nên nó đúng là phiên bản 3
> của cùng một app, không phải một sản phẩm khác. Thư mục `../CHON_SO/` chỉ giữ tư liệu
> nghiệp vụ; **lộ trình thi công nằm ở đây**.
>
> Sổ trước: `PLAN_TRUNG_SO_V2.md` (v2.1, 9/9 hạng mục — còn `22.1` chờ iPhone thật).
> Lịch sử v1→v2: `PLAN_TRUNG_SO_V1.md` (96 KB — **grep, đừng nạp trọn**).

**Mục tiêu:** thêm một trò thứ hai cho quầy sự kiện — dãy 4 chữ số chạy trên bảng LED, người
chơi bấm DỪNG **một lần**, ra một con số, và đó là **số phần quà** của họ. Không trúng,
không thua, không kho quà trong máy. Quà chuẩn bị sẵn bên ngoài, đánh số thứ tự.

**Kiến trúc:** không đổi. Next.js 16 App Router tự chứa · `node:sqlite` · SSE trong route
handler · lõi bộ đếm là hàm thuần của thời gian. Rẽ nhánh bằng cột `chuong_trinh.tro_choi`
**đã nằm sẵn trong lược đồ** từ GĐ 9 mà chưa một dòng code nào đọc (đã grep toàn repo xác
minh). Máy chủ rẽ bằng **một lớp luật chơi**; giao diện rẽ bằng **hai bộ component riêng**.

**Không thêm một gói phụ thuộc nào.** Node ≥ 24, `next@16.3.3`, `react@19.2.8`, `qrcode`.

---

## BÀN GIAO PHIÊN GẦN NHẤT (01/09/2026 — GHI ĐÈ mỗi phiên, không nối thêm)

1. **Vừa xong:** trọn game **CHỌN SỐ** — 13/13 hạng mục máy (C.0→C.12). **Đã push**
   app `3d96358` lên `github.com/hodacphuchtc/GAME_SU_KIEN` (19 commit, gồm cả 8 commit
   v2.1 của phiên trước vốn còn treo). IDEA chỉ commit local — repo không có remote.

2. **ĐANG DỞ: không có gì dở giữa chừng.** Cả hai game hết sạch việc máy. Đừng mở sổ tìm
   việc code — không có.

3. **Chặn ở NGƯỜI / NGOÀI** — ba mục cuối sổ này: `C.N2` mở file Excel bằng Excel/Numbers
   thật (kiểm ô hiện `0042` không phải `42`) · `C.N3` chạy thử tại quầy một buổi, 10 phụ
   huynh thật · `C.N4` dán nhãn số `0001…N` lên bộ quà. Bên Trúng Số còn `22.1` iPhone
   thật (sổ V2) và `N.1`/`N.4`–`N.9` (sổ V1).

4. **Đã đo, đừng đo lại:**
   · `chuong_trinh.tro_choi` có sẵn từ GĐ 9, chưa ai đọc — nay `lib/tro-choi/luat.ts` đọc.
   · `lib/db/luoc-do.ts` là hình dạng NGUYÊN THUỶ; mọi cột thêm sau chỉ sống trong
     `COT_BO_SUNG` của `nang-cap.ts`. Đừng thêm cột vào cả hai file.
   · `layMot` trả **`undefined`** chứ không `null` khi không có dòng.
   · Tầng quản trị + hạ tầng CSDL = **5.122 / 12.978 dòng (39,5%)** mã nguồn — đó là khoản
     lãi của việc gộp chung app thay vì dựng app riêng.
   · `bo-dem.ts` KHÔNG phải sửa để làm game mới: `countAt` cố ý không lấy dư.

5. **Cạm bẫy vừa trả giá** — sáu mục mới ở cuối `app/CLAUDE.md`. Hai cái tốn thời gian
   nhất: phép kẹp `Math.min/max` trong `dungLuot` quy mọi lần hết giờ về **một mốc** nên
   ai để hết giờ cũng nhận cùng một số; và cạm bẫy "hai lượt e2e" áp cả với **hai lệnh
   liên tiếp**, làm 2/20 kịch bản báo hỏng hoàn toàn oan.

6. **Lệnh phiên sau** (trong `modules/GAME_SU_KIEN/app/`): `npm run sao-luu` trước mọi
   việc đụng CSDL · `npm test` (mốc **501/44**) · `npm run e2e` một lượt (mốc **20/20**,
   chờ cổng 3111 trống hẳn) · `npm run trung-tam` để mở máy tại quầy.

**Mốc đối chiếu:** 501 test / 44 file · e2e 20/20 · build 22 route · 56 mục, 9 ADR.

---

## RÀNG BUỘC TOÀN CỤC (áp cho MỌI hạng mục dưới đây)

- **Chữ tiếng Việt 100%, đúng dấu.** Chuỗi mới vào `config/locale.ts` **trước**, không viết
  thẳng vào component. 🔴 Thêm khoá **cùng commit** với chỗ dùng — `tests/locale.test.ts`
  bắt khoá mồ côi. 🔴 Luôn viết `T.a` / `T.b` tường minh, **cấm** `T[bien]`: truy cập động
  làm cả hai khoá bị coi là mồ côi, test đỏ mà nhìn như test hỏng.
- **Không hardcode màu/font** — đọc `config/thuong-hieu.ts` (`tests/thuong-hieu.test.ts` canh
  nó khớp `app/globals.css`).
- **Không hardcode hằng số nghiệp vụ** — đọc `config/game.ts`, `config/to-chuc.ts`, và
  `config/chon-so.ts` (mới).
- 🔴 **Lọc theo quyền ở TẦNG SQL, không ở tầng giao diện.** Ẩn cái nút mà câu truy vấn vẫn
  trả đủ dòng thì danh bạ khách đã nằm trong HTML gửi ra khỏi máy chủ.
- 🔴 **MỌI câu SQL của một bảng nằm trong đúng MỘT file `lib/**/kho.ts`** (ADR-008).
- **Chạy `npm run sao-luu` TRƯỚC mọi việc đụng CSDL.**
- Ô nhập của form người lạ phải **có kiểm soát** — React dọn form sau mỗi server action.
- Mỗi hạng mục xong: `npm run lint` · `npx tsc --noEmit` · `npm test` · `npm run build`
  **đều xanh** mới được tick.
  **Mốc đối chiếu bất di bất dịch: 436 test / 41 file · e2e 18/18 · 18 route.**
- 🔴 **`npm run e2e` chạy MỘT lượt mỗi lệnh.** Hai lượt trong cùng một lệnh làm lượt sau
  đụng cổng 3111 của lượt trước và báo hỏng những kịch bản hoàn toàn đúng.

---

## LUẬT CHƠI (bản chốt)

1. Nhân viên tạo một **chương trình CHỌN SỐ**, khai **dải số từ X đến Y** (ví dụ 1 → 100
   nghĩa là 100 số) và bật/tắt **loại trừ số đã ra**.
2. Mã QR dán tại quầy. Phụ huynh quét, nhập **họ tên + số điện thoại** (sinh lead ngay như
   Trúng Số), bấm BẮT ĐẦU.
3. Dãy chạy vòng X, X+1, …, Y rồi quay lại X. Hiện trên bảng LED 4 chữ số, **đệm số 0**:
   `7 → 0007`, `42 → 0042`.
4. Người chơi bấm DỪNG **đúng một lần**. Số dừng lại là số của họ.
5. Cả LCD lẫn điện thoại hiện **"Chúc mừng bạn đã chọn được dãy số may mắn 0042"**. Không
   nhãn trúng/thua, không "bấm tiếp".
6. Phụ huynh ra quầy, đọc **mã xác thực 4 ký tự** (hiệu lực 60 giây), nhân viên đối chiếu
   rồi đưa **phần quà mang số đó**.

---

## TÁM QUYẾT ĐỊNH ĐÃ CHỐT (01/09/2026)

| # | Quyết định | Vì sao / hệ quả |
| - | ---------- | --------------- |
| Q1 | **Gộp vào app Trúng Số**, rẽ nhánh bằng `tro_choi = 'chon_so'` | Dùng chung cơ sở · nhân viên · khách tiềm năng · phân quyền · nhật ký · xuất Excel · sao lưu. Tiết kiệm ~5.100 dòng mã và ~3.000 dòng test không phải chép. Khẳng định lại ADR-005 |
| Q2 | **Loại trừ số đã ra: bật/tắt được** trong thiết lập | Phải làm và test **cả hai nhánh** |
| Q3 | Phạm vi loại trừ: **suốt chương trình**, không reset theo ngày | Dải 100 số phục vụ đúng 100 người cho cả sự kiện. Hết là hết ⇒ **bắt buộc** có "còn lại N số" |
| Q4 | **Đúng 1 lần bấm mỗi ván** | Cắt trọn luật Đ11 "lần tốt nhất" — vô nghĩa khi không có trúng/thua |
| Q5 | LED **đệm số 0** (`0007`) | `Led4Digits` và `formatNumber` dùng lại **không sửa một dòng** |
| Q6 | Nhận quà **ngay tại quầy** | Dùng lại `lib/ma-xac-thuc.ts` nguyên xi, hiệu lực 60 giây |
| Q7 | v1 **chỉ chế độ `tai_quay`** | Cơ chế giữ chỗ sẵn có ⇒ mỗi lúc một người chơi ⇒ **không thể có hai người va cùng một số**. Cắt phạm vi có chủ ý |
| Q8 | **Nhịp chạy riêng theo độ dài dải** — một vòng ~1,5 giây | Dải 10 hay 5.000 số đều đọc được số đang chạy. Không dùng 4 mức khó của Trúng Số |
| L1 | 🔴 **Loại trừ đổi VÒNG CHẠY, không ánh xạ kết quả** | Số 42 đã có người lấy thì LED nhảy `0041 → 0043`. Phương án ngược lại (chạy đủ dải rồi nhích kết quả) vi phạm cùng lúc hai luật đã có sẹo: *"thấy 0211, bấm, máy trả 0219 — nhìn y như ăn gian"* và L1 của Vòng Quay *"ô hết quà biến mất ngay, không thay thầm"*. **Vòng lúc 8h dài 100 số, lúc 20h dài 60 số — đó là sự thật của buổi chiều hôm đó** |

---

## 🛑 SÁU GIẢ ĐỊNH CHỜ ANH CHỐT — chặn C.0

Rẻ để đổi **trước** khi code, đắt sau đó. Xem `C.N1`.

1. `ten_giai_thuong` (cột `NOT NULL`, không bỏ được nếu không dựng lại bảng) dùng lại làm
   **"tên đợt phát quà"** — in trên tờ QR dán quầy, ví dụ *"Quà Tết 2026 — số 1→100"*.
2. Mọi chương trình Chọn Số ghi `so_trung = 0`, `tran_giai_moi_ngay = 0`, `so_lan_choi = 1`;
   ba ô này **không hiện trên form**.
3. `luot_choi.trung` và `van_choi.trung` **luôn = 0**. Đặt 1 là làm cột "Đã trúng" của Trúng
   Số nói dối và gọi `bocQuaChoVan` trên kho rỗng.
4. **Giữ luật 1 ván / SĐT / ngày** — không thì một người bấm liên tục hốt sạch dải số.
5. 🔴 **Hết giờ ⇒ KHÔNG cấp số, không tiêu lượt trong ngày, mời bấm lại.** Vì phép kẹp
   `Math.min/max` ở `luot-service.ts:169` khiến **mọi người để hết giờ đều ra cùng một con
   số**. Ở Trúng Số đó chỉ là một số trượt nên không ai thấy; ở Chọn Số đó là mười phụ huynh
   cùng cầm số 0037.
6. Tên cột: `dai_tu` · `dai_den` · `loai_tru_da_ra`.

---

## KHÔNG LÀM ở v3 (cố ý) — và vì sao

| Không làm | Vì sao | Mở lại khi nào |
| --------- | ------ | -------------- |
| **Chế độ `online`** | Online cố ý **bỏ giữ chỗ** ("quảng cáo kéo về 50 người thì 49 người thấy đang có người chơi") ⇒ nhiều người chơi cùng lúc ⇒ phải thêm màn "số vừa có người lấy mất, bấm lại". Thêm ~0,75 ngày. Và quà đánh số **không gửi được cho người ở nhà** | Khi có nhu cầu thật |
| **Kho quà trong máy** | Quà đánh số nằm ngoài hệ thống — đó là toàn bộ lý do game này tồn tại | Không bao giờ |
| **Nhiều lần bấm / "lần tốt nhất"** | Không có trúng/thua thì không có "tốt hơn" | Không bao giờ |
| **Tra cứu "số của tôi" sau khi mất màn hình** | Q6 chốt nhận quà **ngay tại quầy**, mã 60 giây là đủ | Nếu đổi sang "nhận lúc nào cũng được" |
| **Màn tra cứu theo SỐ cho nhân viên** | Cùng lý do trên. Lịch sử sắp theo thời gian là đủ khi trao ngay | Cùng lúc với mục trên (~0,5 ngày) |
| **Bảng tỉ lệ trúng** | Không có gì để mà tính tỉ lệ | Không bao giờ |
| **Dọn mã chết `dem-nguoc`** | Đã phát hiện `countdownSeconds` khai ở 6 chỗ và tin `dem-nguoc` **không ai phát** — nhưng dọn nó là việc của Trúng Số, không phải của gói này | Ghi vào sổ nợ kỹ thuật |
| **Tách `VONG_QUAY_MAY_MAN` / hoà giải ADR-005** | Việc riêng, cần anh quyết | Xem mục cuối sổ |

---

## BẢN ĐỒ FILE

### Tạo mới

| File | Trách nhiệm |
| ---- | ----------- |
| `config/chon-so.ts` | Hằng số: dải mặc định, biên dải, nhịp quay, ngưỡng cảnh báo |
| `lib/chon-so/vong-so.ts` | ★ **Lõi thuần**: `coDai`, `vongChay`, `nhipCua`, `soTaiGiay` |
| `lib/tro-choi/luat.ts` | `LuatChoi` + `luatCua(troChoi)` — bảng tra |
| `lib/tro-choi/luat-trung-so.ts` | Bọc `resolveRound`/`verifyCode`/`ghiLanBam` **y nguyên** |
| `lib/tro-choi/luat-chon-so.ts` | Loại trừ · một-lượt-một-lúc · tự dừng · ghi ván |
| `lib/xuat/bang-so-da-chon.ts` | Trang tính riêng, **không cột Trúng/Trượt/Lệch** |
| `components/man-hinh-chon-so.tsx` | LCD: chờ → chạy → "dãy số may mắn" · dải "còn N số" |
| `components/man-dien-thoai-chon-so.tsx` | Điện thoại: nhập thông tin → BẮT ĐẦU → DỪNG → kết quả |
| `components/form-tao-chon-so.tsx` · `form-sua-chon-so.tsx` | Cơ sở · dải X→Y · công tắc loại trừ · tên đợt |
| `components/bang-lich-su-chon-so.tsx` | Bảng đối soát |
| `app/quan-tri/chon-so/{page,tao/page,[ma]/page}.tsx` | Ba trang quản trị |
| `app/actions/chon-so.ts` | `taoChonSoForm`, `suaChonSoForm` |
| `app/api/xuat/chon-so/[ma]/route.ts` | Xuất Excel (đã được `proxy.ts` chắn qua matcher `/api/xuat/:path*`) |
| `tests/vong-so.test.ts` · `tests/chon-so.test.ts` · `tests/tao-chon-so.test.ts` | Test |
| `tests/e2e/nen/chon-so.mjs` · `gd19-chon-so.mjs` · `gd20-chon-so-loai-tru.mjs` | e2e |

### Sửa

| File | Sửa gì | Rủi ro |
| ---- | ------ | ------ |
| `lib/db/nang-cap.ts` | +3 dòng cuối `COT_BO_SUNG`. **Không** đụng `PHIEN_BAN_DU_LIEU` | thấp |
| `config/to-chuc.ts` | `TRO_CHOI`, `TroChoi`, `TRO_CHOI_MAC_DINH` (nhà sẵn có của `CHE_DO_CHOI`) | thấp |
| `config/locale.ts` | ~35 khoá mới | thấp |
| `lib/chuong-trinh/kho.ts` | Lọc `tro_choi` + 4 trường mới + 4 hàm mới | 🔴 **CAO** |
| `lib/chuong-trinh/kiem-hop-le.ts` | `ThietLapChonSo` + `kiemThietLapChonSo` **cùng file** | thấp |
| `lib/luot/luot-service.ts` | `batDauLuot` gọi `luat.truocKhiMo`; `dungLuot` đổi 3 dòng giữa | 🔴 **CAO** |
| `lib/van/kho-van.ts` | **Thêm** `ghiLanChonSo()`. 🔴 **KHÔNG chạm `ghiLanBam`** | vừa |
| `lib/luot/kho-luot.ts` | Thêm `soDaRa()`, `coLuotDangMo()` | thấp |
| `lib/dong-bo/kenh.ts` | +2 biến thể `TinTrongPhong` | thấp |
| `app/actions/choi.ts` | `moLuot` đính `keo`; `chotLuot` phát tin do luật sinh | vừa |
| `app/actions/chuong-trinh.ts` | `datTrangThai`/`xoaHoacAn` dùng `timTheoMaBatKeTroChoi` | vừa |
| `app/choi/[ma]/page.tsx` · `app/man-hinh/[ma]/page.tsx` | +1 nhánh mỗi file | thấp |
| `components/khung-quan-tri.tsx` | Mục "Chọn Số" trong nhóm GAME SỰ KIỆN | thấp |
| `lib/nhat-ky/kho.ts` | +2 hằng `HANH_DONG` | thấp |
| `tests/e2e/chay.mjs` · `tests/nang-cap.test.ts` | +2 kịch bản · +1 `it` (không sửa `it` cũ nào) | thấp |

### 🔴 KHÔNG ĐỤNG — đây là cam kết, không phải ghi chú

`lib/bo-dem.ts` · `components/led-4-so.tsx` · `lib/db/luoc-do.ts` · `lib/do-bam.ts` ·
`lib/ma-xac-thuc.ts` · `lib/dong-bo/tram-phat.ts` · `lib/dong-bo/dong-ho.ts` ·
`app/api/su-kien/route.ts` · `app/api/gio/route.ts` · `lib/luot/gioi-han.ts` ·
`lib/qua/**` (toàn bộ ~870 dòng) · `lib/lead/**` · `lib/co-so/**` · `lib/nhan-vien/**` ·
`lib/bao-ve/**` · `proxy.ts` · `components/man-hinh.tsx` · `components/man-dien-thoai.tsx` ·
`components/form-tao.tsx` · `components/bang-lich-su.tsx` · `scripts/**` · `package.json`.

> **Vì sao `lib/db/luoc-do.ts` nằm trong danh sách không đụng:** đã xác minh trên mã —
> `luoc-do.ts` là hình dạng **nguyên thuỷ**, mọi cột thêm sau (`co_so_id`, `che_do`,
> `nguon_co_so`, `so_lan_choi`, `tro_choi`) đều **chỉ** sống trong `COT_BO_SUNG` của
> `nang-cap.ts`. Đi ngược quy ước đó là dựng hai nguồn sự thật.

---

## 🔴 BẢNG RỦI RO — làm SỚM, không để cuối

| # | Rủi ro | Hậu quả nếu nổ | Hạng mục dập nó |
| - | ------ | -------------- | --------------- |
| R1 | Mệnh đề `and c.tro_choi = 'trung_so'` gõ sai / thiếu tiền tố `c.` | **Danh sách chương trình trắng trơn** sáng hôm sau tại quầy | **C.1** — bước (b) là *đếm số dòng*, không phải "thấy có dòng" |
| R2 | `dungLuot` gọi `resolveRound` **vô điều kiện** | Chọn Số ghi `trung = 1` khi số ra đúng 0, bốc quà kho rỗng, Excel báo "Trúng" gửi đội sale. **Không một dòng lỗi** | **C.2** + test *"chọn số không bao giờ ghi trung=1"* |
| R3 | Tách `ghiLanBam` làm lệch "lần tốt nhất" hoặc bốc quà | Người trúng Trúng Số nhận sai quà | **C.2** làm khi **chưa có tính năng mới nào** ⇒ e2e đỏ thì nguyên nhân chỉ có thể là bản tách |
| R4 | Số đã ra vẫn quay lại | Hai người cùng cầm số 42 ra quầy | **C.7** + e2e dải `1→3` |
| R5 | Hai lượt chạy song song ⇒ hai người cùng số | Như R4, **không test đơn lẻ nào bắt được** | **C.7** (`coLuotDangMo`) + bấm Space trên LCD giữa lượt điện thoại |
| R6 | "Còn lại N số" nói dối sau khi thu hẹp dải | Nhân viên tưởng còn quà, hết số giữa buổi | **C.8** (`between`) + **C.10** |
| R7 | Vòng ở LCD ≠ vòng ở máy chủ | Vết sẹo *"thấy 0211, máy trả 0219"* | **C.3** (`vongChay` thuần, dùng chung) + **C.7** (chốt vòng lúc mở) |
| R8 | Dải > 9999 | `formatNumber` lấy dư `WHEEL_SIZE` và `Led4Digits` `slice(-4)` ⇒ `10042` hiện thành `0042`. **Hỏng trong im lặng** | **C.4** chặn ở `kiemHopLe` (cửa chung tạo+sửa) + test biên ở **C.3** |
| R9 | Khoá locale thêm trước khi UI dùng | `tests/locale.test.ts` đỏ, nhìn như test hỏng | Thêm khoá **cùng commit** với chỗ dùng |
| R10 | Migration hỏng CSDL thật | Mất sổ đối soát | **C.0** — `npm run sao-luu` trước; không tăng `user_version` nên rollback sạch |

**Thứ tự thi công đã xếp theo bảng này:** R1 dập ở hạng mục thứ hai, R2/R3 ở hạng mục thứ
ba, R7 ở thứ tư. Ba rủi ro nguy hiểm nhất đều bị dập **trước khi có một tính năng nào của
người dùng** — đó là chủ ý, không phải tình cờ.

---

# GIAI ĐOẠN C-A — Nền, không đổi một hành vi nào (0,5 ngày)

> **DEMO kết thúc GĐ:** anh mở `/quan-tri`, chơi trọn một ván Trúng Số trên LCD + điện
> thoại như mọi ngày. **Không có gì khác trước.** Đó chính là điều cần chứng minh.

- [x] **C.0 — Ba cột + hằng số + từ điển** ✅ 01/09 — 438 test, build xanh, commit 30f55ce
  - (a) Thêm `dai_tu`/`dai_den`/`loai_tru_da_ra` vào cuối `COT_BO_SUNG`; thêm `TRO_CHOI` vào
    `config/to-chuc.ts`; tạo `config/chon-so.ts`. Chưa màn hình nào đọc chúng.
  - (b) Chạy `npm run sao-luu` trước. Khởi động lại app, mở `/quan-tri` — **danh sách
    chương trình cũ còn nguyên**, chơi thử một ván vẫn đúng.
  - (c) `npm test` (436 cũ + 1 mới trong `nang-cap.test.ts`) · `tsc` · `lint` · `build`.
  - (d) 0,25 ngày.
  - (f) phụ-thuộc: C.N1

  **Files:** Sửa `lib/db/nang-cap.ts` · `config/to-chuc.ts` — Tạo `config/chon-so.ts` —
  Test `tests/nang-cap.test.ts`

  - [x] **Bước 1 — sao lưu trước khi đụng CSDL**

    ```bash
    cd "modules/GAME_SU_KIEN/app" && npm run sao-luu
    ```

  - [x] **Bước 2 — viết test ĐỎ trong `tests/nang-cap.test.ts`** (thêm `it` mới, không sửa
        `it` cũ nào)

    ```ts
    it("thêm ba cột dải số cho chọn số, chạy hai lần vẫn sạch", () => {
      const db = moCsdlTam();
      nangCap(db);
      nangCap(db); // idempotent: chạy lại không được ném
      const cot = db.prepare("pragma table_info(chuong_trinh)").all() as { name: string }[];
      const ten = cot.map((c) => c.name);
      for (const c of ["dai_tu", "dai_den", "loai_tru_da_ra"]) {
        expect(ten).toContain(c);
      }
      // Chương trình cũ không được đổi thân phận.
      db.exec(
        `insert into chuong_trinh (ma, ten_trung_tam, so_trung, muc_do, ten_giai_thuong, tao_luc, sua_luc)
         values ('AAAA', 'CS thử', 211, 'vua', 'Giải thử', 1, 1)`,
      );
      expect(
        db.prepare("select tro_choi, dai_tu, dai_den, loai_tru_da_ra from chuong_trinh").get(),
      ).toEqual({ tro_choi: "trung_so", dai_tu: 1, dai_den: 100, loai_tru_da_ra: 0 });
    });
    ```

  - [x] **Bước 3 — chạy để thấy nó ĐỎ**

    Chạy: `npx vitest run tests/nang-cap.test.ts`
    Mong đợi: **FAIL** — `expected [ ... ] to contain 'dai_tu'`

  - [x] **Bước 4 — nối ba dòng vào CUỐI `COT_BO_SUNG`** (`lib/db/nang-cap.ts`, sau dòng 68)

    ```ts
    ["chuong_trinh", "dai_tu", "integer not null default 1"],
    ["chuong_trinh", "dai_den", "integer not null default 100"],
    ["chuong_trinh", "loai_tru_da_ra", "integer not null default 0"],
    ```

    🔴 **KHÔNG tăng `PHIEN_BAN_DU_LIEU`** (đang là 2). Không có dòng dữ liệu nào cần biến
    đổi; tăng số chỉ làm đỏ `it("user_version được nâng lên 2")` vốn viết thẳng số 2.
    🔴 **KHÔNG đụng `lib/db/luoc-do.ts`** — xem ghi chú ở BẢN ĐỒ FILE.

  - [x] **Bước 5 — thêm `TRO_CHOI` vào `config/to-chuc.ts`**

    ```ts
    /** Các game chạy trên cùng một app (ADR-005). Cột `chuong_trinh.tro_choi`. */
    export const TRO_CHOI = ["trung_so", "chon_so"] as const;
    export type TroChoi = (typeof TRO_CHOI)[number];
    export const TRO_CHOI_MAC_DINH: TroChoi = "trung_so";
    ```

  - [x] **Bước 6 — tạo `config/chon-so.ts`**

    ```ts
    /**
     * Hằng số nghiệp vụ của game CHỌN SỐ — nguồn DUY NHẤT.
     * Lập luận từng con số: `docs/brd/chon-so.md` (repo IDEA).
     */
    import { WHEEL_SIZE } from "@/config/game";

    /** Dải gợi ý khi tạo mới: 100 phần quà đánh số 1…100. */
    export const DAI_MAC_DINH = { tu: 1, den: 100 } as const;

    /**
     * Biên cứng của dải. Trần là WHEEL_SIZE − 1 vì bảng LED chỉ có 4 chữ số và
     * `formatNumber` lấy dư theo WHEEL_SIZE — số 10042 sẽ hiện thành 0042, trùng
     * với số 42, và KHÔNG có gì báo lỗi. Xem R8 trong sổ.
     */
    export const DAI_TOI_THIEU = 0;
    export const DAI_TOI_DA = WHEEL_SIZE - 1;

    /** Dải một số thì nút DỪNG là đồ trang trí — bắt buộc ít nhất hai số. */
    export const SO_LUONG_TOI_THIEU = 2;

    /**
     * Nhịp quay: một vòng trọn dải mất chừng này giây (Q8).
     * 1,5 giây là khoảng người đứng xem còn ĐỌC được số đang chạy mà vẫn thấy
     * nó "quay", chứ không phải một vệt mờ.
     */
    export const GIAY_MOI_VONG = 1.5;

    /** Kẹp hai đầu để dải rất lớn không thành vệt mờ, dải rất nhỏ không ì ạch. */
    export const TOC_DO_TOI_DA = 900;
    export const TOC_DO_TOI_THIEU = 4;

    /** Thời gian tăng tốc, cũng là thời gian khoá nút DỪNG. */
    export const GIAY_TANG_TOC = 2;

    /** Quá bấy nhiêu giây chưa bấm thì huỷ lượt và mời bấm lại (giả định 5). */
    export const GIAY_TOI_DA_MOT_LUOT = 20;

    /** Còn dưới ngưỡng này thì cảnh báo sắp hết số. `max(1, tỉ lệ × tổng)`. */
    export const NGUONG_CANH_BAO_DAI = 0.2;
    ```

  - [x] **Bước 7 — chạy lại, phải XANH**

    Chạy: `npm run lint && npx tsc --noEmit && npm test && npm run build`
    Mong đợi: **437 test xanh**, build xanh 18 route.

  - [x] **Bước 8 — commit**

    ```bash
    git add lib/db/nang-cap.ts config/to-chuc.ts config/chon-so.ts tests/nang-cap.test.ts
    git commit -m "feat(chon-so): ba cot dai so + hang so, chua doi hanh vi nao"
    ```

---

- [x] **C.1 🔴 RỦI RO CAO — Lọc `tro_choi` ở TẦNG SQL** ✅ 01/09 — 445 test, e2e 18/18
  - (a) `danhSachChuongTrinh` và `timTheoMa` thêm `and c.tro_choi = 'trung_so'`; thêm
    `danhSachChonSo` / `timTheoMaChonSo` / `timTheoMaBatKeTroChoi`; `doiDong` trả thêm 4
    trường; `taoChuongTrinh` nhận `troChoi` + dải. `timTheoMaCongKhai` **giữ nguyên không
    lọc** (đường chơi phục vụ cả hai game).
  - (b) 🔴 **Việc quan trọng nhất của cả giai đoạn:** mở `/quan-tri`, **đếm số dòng** —
    phải bằng đúng số dòng trước khi sửa. Rồi mở một chương trình đang chạy, bấm **Tắt**
    rồi **Bật lại**, và **xuất Excel** một lần.
  - (c) `npm test`: `quyen-chuong-trinh` · `tao-chuong-trinh` · `sua-chuong-trinh` ·
    `xoa-chuong-trinh` · `bat-tat`. Rồi `npm run e2e` **một lượt, 18/18**.
  - (d) 0,25 ngày.
  - (f) phụ-thuộc: C.0

  > **Vì sao hạng mục này lên đầu dù nó chỉ là một mệnh đề `WHERE`:** nó là chỗ duy nhất
  > trong cả kế hoạch có thể **làm biến mất chương trình Trúng Số đang chạy thật khỏi màn
  > hình quản trị của quầy**. Gõ nhầm `'chon_so'`, hoặc quên tiền tố `c.` khi câu có `join`,
  > là sáng mai quầy mở máy thấy danh sách trắng. Rủi ro cao + chi phí thấp ⇒ làm sớm, và
  > kiểm bằng cách **đếm dòng thật** chứ không phải liếc thấy "vẫn có dòng".

  **Files:** Sửa `lib/chuong-trinh/kho.ts` — Test `tests/quyen-chuong-trinh.test.ts`

  **Chữ ký hàm mới** (các hạng mục sau sẽ gọi đúng những tên này):

  ```ts
  export function danhSachChonSo(pv: PhamVi, hienCaDaAn?: boolean): ChonSoKemSoLieu[];
  export function timTheoMaChonSo(ma: string, pv: PhamVi): ChuongTrinh | null;
  /** Dùng cho hai action tắt/ẩn — chúng phải làm việc với CẢ HAI game. */
  export function timTheoMaBatKeTroChoi(ma: string, pv: PhamVi): ChuongTrinh | null;
  export function suaChonSo(id: number, d: ThietLapChonSo): void;
  ```

  - [x] **Bước 1 — viết test ĐỎ**: chương trình Chọn Số **không được** lọt vào danh sách
        Trúng Số, và ngược lại.

    ```ts
    it("hai game không thấy nhau trong danh sách quản trị", () => {
      const ts = taoChuongTrinh({ ...MAU, troChoi: "trung_so" });
      const cs = taoChuongTrinh({ ...MAU, troChoi: "chon_so", daiTu: 1, daiDen: 100 });
      const pv = { coSoId: null, nhanVienId: null };

      const dsTrungSo = danhSachChuongTrinh(pv).map((c) => c.ma);
      expect(dsTrungSo).toContain(ts.ma);
      expect(dsTrungSo).not.toContain(cs.ma);

      const dsChonSo = danhSachChonSo(pv).map((c) => c.ma);
      expect(dsChonSo).toContain(cs.ma);
      expect(dsChonSo).not.toContain(ts.ma);

      // Cửa quản trị của game này KHÔNG mở được chương trình của game kia.
      expect(timTheoMa(cs.ma, pv)).toBeNull();
      expect(timTheoMaChonSo(ts.ma, pv)).toBeNull();
      // Nhưng đường CHƠI thì mở được cả hai — phụ huynh không đăng nhập.
      expect(timTheoMaCongKhai(cs.ma)).not.toBeNull();
    });
    ```

  - [x] **Bước 2 — chạy để thấy ĐỎ**

    Chạy: `npx vitest run tests/quyen-chuong-trinh.test.ts`
    Mong đợi: **FAIL** — `danhSachChonSo is not a function`

  - [x] **Bước 3 — sửa `lib/chuong-trinh/kho.ts`**

    Thêm vào `interface ChuongTrinh` và `DongChuongTrinh` / `doiDong`:

    ```ts
    // ChuongTrinh
    troChoi: TroChoi;
    daiTu: number;
    daiDen: number;
    loaiTruDaRa: boolean;

    // DongChuongTrinh
    tro_choi: string;
    dai_tu: number;
    dai_den: number;
    loai_tru_da_ra: number;

    // doiDong — thêm vào object trả về
    troChoi: dong.tro_choi as TroChoi,
    daiTu: dong.dai_tu,
    daiDen: dong.dai_den,
    loaiTruDaRa: dong.loai_tru_da_ra === 1,
    ```

    Mệnh đề lọc, viết MỘT lần cho cả file — cùng lối với `locPhamVi` sẵn có:

    ```ts
    /**
     * 🔴 Hai game dùng chung bảng `chuong_trinh`, phân biệt bằng cột `tro_choi`.
     * Mọi câu đọc trong khu quản trị PHẢI mang mệnh đề này, nếu không màn quản
     * trị của game này hiện chương trình của game kia — và nút Sửa sẽ ghi những
     * cột mà game kia không bao giờ đọc.
     */
    function locTroChoi(t: TroChoi): string {
      return ` and c.tro_choi = '${t}'`; // t đến từ union kiểu, không từ người dùng
    }
    ```

    `timTheoMa` và `danhSachChuongTrinh` nối `${locTroChoi("trung_so")}` vào sau `${menh}`.
    `danhSachChonSo` / `timTheoMaChonSo` là bản sao dùng `locTroChoi("chon_so")`.
    `timTheoMaBatKeTroChoi` **không** nối mệnh đề nào.
    🔴 `timTheoMaCongKhai` **giữ nguyên** — đường chơi phục vụ cả hai game.

  - [x] **Bước 4 — chạy test, phải XANH**

    Chạy: `npm test && npm run build`

  - [x] **Bước 5 — kiểm tay: ĐẾM DÒNG** (đây là bước quan trọng nhất, đừng bỏ)

    ```bash
    npm run trung-tam
    ```

    Mở `/quan-tri`, đếm số dòng trong bảng chương trình. Phải **bằng đúng** số đếm được
    trước khi sửa. Bấm Tắt → Bật lại một chương trình. Bấm Xuất Excel.

  - [x] **Bước 6 — e2e một lượt**

    Chạy: `npm run e2e`
    Mong đợi: **18/18**

  - [x] **Bước 7 — commit**

    ```bash
    git add lib/chuong-trinh/kho.ts tests/quyen-chuong-trinh.test.ts
    git commit -m "feat(chon-so): loc tro_choi o tang SQL, hai game khong thay nhau"
    ```

---

# GIAI ĐOẠN C-B — Xương sống máy chủ (1,0 ngày)

> **DEMO kết thúc GĐ:** anh chơi một ván **Trúng Số** ba lần bấm đầu-cuối trên hai màn
> hình. Kết quả, "lần tốt nhất", mã xác thực, quà bốc — **giống hệt trước**. Đây là bài
> kiểm rằng ta đã thay động cơ mà xe chạy y nguyên.

- [x] **C.2 🔴 RỦI RO CAO NHẤT — Tách lớp luật chơi, KHÔNG đổi hành vi** ✅ 01/09 — 449 test, e2e 18/18, commit 5827a66
  - (a) Tạo `lib/tro-choi/luat.ts` + `luat-trung-so.ts` bọc **y nguyên**
    `resolveRound`/`verifyCode`/`ghiLanBam`; `dungLuot` và `batDauLuot` gọi qua bảng tra.
    Bảng tra lúc này chỉ có **một** mục. **Không một hành vi nào được đổi.**
  - (b) Trên LCD + điện thoại: chơi một ván **3 lần bấm**, bấm lệch 5 → lệch 900 → lệch 300.
    Màn tổng kết phải hiện **lệch 5**. Chơi tới trúng một lần, kiểm quà bốc đúng loại đầu
    kho và mã xác thực khớp giữa hai màn hình.
  - (c) `npm test`: `luot-service` · `van-choi` · `chon-qua` · `uoc-tinh-nhieu-lan` ·
    `kho-luot`. Rồi `npm run e2e` **một lượt, 18/18** — `gd12-van-nhieu-lan` và
    `gd13-kho-qua` là hai bài canh chính.
  - (d) 0,5 ngày.
  - (f) phụ-thuộc: C.1

  > **Vì sao đây là hạng mục rủi ro cao nhất cả bản:** `dungLuot` + `ghiLanBam` là nơi
  > quyết định **ai nhận quà**. `ghiLanBam` quấn ba việc trong MỘT transaction ("lần tốt
  > nhất" + chốt ván + `bocQuaChoVan`), và `app/CLAUDE.md` đã ghi sẵn một vết sẹo *"lỗi này
  > lọt qua 190 test và cả build"* đúng ở vùng này. Làm nó **khi chưa có tính năng mới
  > nào** nghĩa là: nếu e2e đỏ thì nguyên nhân chỉ có thể là bản tách — không có biến thứ
  > hai để mà đoán.

  **Files:** Tạo `lib/tro-choi/luat.ts`, `lib/tro-choi/luat-trung-so.ts` — Sửa
  `lib/luot/luot-service.ts` — Test `tests/luot-service.test.ts`

  **Chữ ký** (C.3 sẽ cài đúng giao diện này cho Chọn Số):

  ```ts
  // lib/tro-choi/luat.ts
  export interface KetQuaCham {
    soDaDung: number;
    trung: boolean;
    khoangLech: number;
    maXacThuc: string | null;
    hetGio: boolean;
  }

  export interface LuatChoi {
    /** Kiểm trước khi mở lượt. Trả câu lỗi ⇒ KHÔNG mở. `keo` đính vào tin bắt đầu. */
    truocKhiMo(ct: ChuongTrinh): { loi?: string; keo?: unknown };
    /** Chấm một lần bấm tại giây thứ `giay`. Trả `null` ⇒ từ chối, không ghi gì. */
    cham(ct: ChuongTrinh, giay: number, hetGio: boolean, keo: unknown): KetQuaCham | null;
    /** Ghi vào VÁN. Cùng hình dạng trả về cho cả hai game. */
    ghiVan(vanId: number, luotId: number, k: KetQuaCham): KetQuaGhiLanBam | null;
  }

  export function luatCua(troChoi: TroChoi): LuatChoi;
  ```

  - [x] **Bước 1 — test ĐỎ: bản tách phải cho ra kết quả y hệt bản cũ**

    ```ts
    it("luật trúng số cho kết quả y hệt resolveRound trực tiếp", () => {
      const ct = { ...MAU_CT, troChoi: "trung_so" as const, soTrung: 211 };
      const luat = luatCua("trung_so");
      for (const giay of [6, 6.5, 10, 29.999]) {
        const truc = resolveRound(ct.thamSo, ct.soTrung, giay, false);
        const qua = luat.cham(ct, giay, false, undefined);
        expect(qua).not.toBeNull();
        expect(qua!.soDaDung).toBe(truc.value);
        expect(qua!.trung).toBe(truc.win);
        expect(qua!.khoangLech).toBe(truc.distance);
      }
    });
    ```

  - [x] **Bước 2 — chạy để thấy ĐỎ**

    Chạy: `npx vitest run tests/luot-service.test.ts`
    Mong đợi: **FAIL** — `luatCua is not a function`

  - [x] **Bước 3 — viết `luat-trung-so.ts` bọc y nguyên**

    ```ts
    export const luatTrungSo: LuatChoi = {
      truocKhiMo: () => ({}),
      cham: (ct, giay, hetGio) => {
        const r = resolveRound(ct.thamSo, ct.soTrung, giay, hetGio);
        return {
          soDaDung: r.value,
          trung: r.win,
          khoangLech: r.distance,
          maXacThuc: verifyCode(ct.soTrung),
          hetGio,
        };
      },
      ghiVan: (vanId, luotId, k) =>
        ghiLanBam(vanId, luotId, k.khoangLech, k.soDaDung, k.trung, k.maXacThuc),
    };
    ```

  - [x] **Bước 4 — đổi ĐÚNG BA dòng giữa của `dungLuot`**

    Giữ nguyên toàn bộ phần đầu (đọc lượt, kẹp `DUNG_SAI_MS`, câu `UPDATE … WHERE
    ket_thuc_luc IS NULL` phân xử ai bấm trước) và phần đuôi. Chỉ thay:

    ```ts
    // CŨ:
    // const ketQua = resolveRound(thamSo, chuongTrinh.soTrung, giay, hetGio);
    // const maXacThuc = verifyCode(chuongTrinh.soTrung);
    // MỚI:
    const luat = luatCua(chuongTrinh.troChoi);
    const cham = luat.cham(chuongTrinh, giay, hetGio, keo);
    if (cham === null) return null;      // luật từ chối lượt này
    const maXacThuc = cham.maXacThuc ?? "";
    ```

    và dòng gọi `ghiLanBam` đổi thành `luat.ghiVan(luot.van_id, luotId, cham)`.

  - [x] **Bước 5 — test XANH + e2e**

    Chạy: `npm test && npm run build`
    Chạy: `npm run e2e` (một lượt) — Mong đợi **18/18**

  - [x] **Bước 6 — kiểm tay ba lần bấm** (bước (b) ở trên). Đây là thứ 436 test không thấy:
        vết sẹo cũ *"tin `ket-qua` mang số lần VỪA BẤM, màn tổng kết phải vẽ lần TỐT NHẤT"*
        chỉ lộ ra khi chơi thật ba lần trên trình duyệt.

  - [x] **Bước 7 — commit**

    ```bash
    git add lib/tro-choi/ lib/luot/luot-service.ts tests/luot-service.test.ts
    git commit -m "refactor(luat): tach lop luat choi, hanh vi trung so khong doi"
    ```

---

- [x] **C.3 — Lõi vòng số + luật Chọn Số (chưa có giao diện)** ✅ 01/09 — 477 test, lõi + luật xong
  - (a) `lib/chon-so/vong-so.ts` (thuần) + `lib/tro-choi/luat-chon-so.ts` +
    `soDaRa`/`coLuotDangMo` trong `kho-luot.ts` + `ghiLanChonSo` trong `kho-van.ts`.
  - (b) **Chưa bấm được gì** — hạng mục này chỉ hiện ra qua (c). Đây là hạng mục **duy
    nhất** không có bước tay, và đó là cố ý: lõi phải xong trước khi có màn hình để mà đổ
    lỗi cho nhau.
  - (c) `tests/vong-so.test.ts` mới — xem code ở Bước 1.
  - (d) 0,5 ngày.
  - (f) phụ-thuộc: C.2

  **Files:** Tạo `lib/chon-so/vong-so.ts`, `lib/tro-choi/luat-chon-so.ts`,
  `tests/vong-so.test.ts` — Sửa `lib/luot/kho-luot.ts`, `lib/van/kho-van.ts`

  🔴 **`lib/bo-dem.ts` KHÔNG SỬA MỘT DÒNG.** 20 bài kiểm của nó đang canh Trúng Số chạy
  thật, trong đó có câu quý nhất cả kho mã: *"kết quả không đổi theo nhịp lấy mẫu —
  30/60/120 Hz như nhau"*. `countAt` **cố ý không lấy dư** — đúng thứ Chọn Số cần.

  - [x] **Bước 1 — viết `tests/vong-so.test.ts` (ĐỎ)**

    ```ts
    import { describe, expect, it } from "vitest";
    import { coDai, nhipCua, soTaiGiay, vongChay } from "@/lib/chon-so/vong-so";
    import { countAt } from "@/lib/bo-dem";

    const DAI = { tu: 1, den: 100 };

    describe("vòng chạy", () => {
      it("dải 1→100 có đúng 100 số, tăng dần, không trùng", () => {
        const v = vongChay(DAI, new Set());
        expect(v).toHaveLength(100);
        expect(v[0]).toBe(1);
        expect(v[99]).toBe(100);
        expect(new Set(v).size).toBe(100);
      });

      it("số đã ra BIẾN MẤT khỏi vòng, không bị thay thầm", () => {
        const v = vongChay(DAI, new Set([42]));
        expect(v).toHaveLength(99);
        expect(v).not.toContain(42);
        expect(v).toContain(41);
        expect(v).toContain(43);
      });

      it("số đã ra NGOÀI dải không ảnh hưởng — dải vừa bị thu hẹp", () => {
        expect(vongChay({ tu: 1, den: 50 }, new Set([77]))).toHaveLength(50);
      });

      it("dải chỉ còn một số thì luôn ra đúng số đó", () => {
        const v = vongChay(DAI, new Set([...Array(99).keys()].map((i) => i + 1)));
        expect(v).toEqual([100]);
        expect(soTaiGiay(nhipCua(DAI), v, 3.7)).toBe(100);
      });

      it("🔴 kết quả KHÔNG đổi theo nhịp lấy mẫu — 30/60/120/144 Hz như nhau", () => {
        const nhip = nhipCua(DAI);
        const v = vongChay(DAI, new Set());
        for (const t of [2, 2.5, 5, 9.999]) {
          const mau = [30, 60, 120, 144].map((hz) => {
            const khung = Math.round(t * hz);
            return soTaiGiay(nhip, v, khung / hz);
          });
          expect(new Set(mau).size).toBe(1);
        }
      });

      it("mọi số trả về đều nằm trong vòng", () => {
        const nhip = nhipCua(DAI);
        const v = vongChay(DAI, new Set([1, 2, 3]));
        for (let t = 0; t < 20; t += 0.017) {
          expect(v).toContain(soTaiGiay(nhip, v, t));
        }
      });
    });

    describe("nhịp quay", () => {
      it("một vòng mất chừng 1,5 giây với dải trung bình", () => {
        const nhip = nhipCua(DAI);
        // countAt tại maxSpeed: sau khi hết ramp, đếm được ~maxSpeed số mỗi giây.
        const motVong = coDai(DAI) / nhip.maxSpeed;
        expect(motVong).toBeCloseTo(1.5, 1);
      });

      it("dải rất lớn bị kẹp tốc độ, không thành vệt mờ", () => {
        expect(nhipCua({ tu: 0, den: 9999 }).maxSpeed).toBeLessThanOrEqual(900);
      });

      it("dải rất nhỏ vẫn quay đủ nhanh để ra dáng trò chơi", () => {
        expect(nhipCua({ tu: 1, den: 3 }).maxSpeed).toBeGreaterThanOrEqual(4);
      });

      it("khoá nút DỪNG đúng bằng thời gian tăng tốc", () => {
        const n = nhipCua(DAI);
        expect(n.lockSeconds).toBe(n.rampSeconds);
      });
    });
    ```

  - [x] **Bước 2 — chạy để thấy ĐỎ**

    Chạy: `npx vitest run tests/vong-so.test.ts`
    Mong đợi: **FAIL** — `Cannot find module '@/lib/chon-so/vong-so'`

  - [x] **Bước 3 — viết `lib/chon-so/vong-so.ts`**

    ```ts
    // 🔴 `RoundSettings` sống ở `config/game.ts`, KHÔNG được bo-dem re-export —
    // đã kiểm trên mã. Import nhầm nguồn là không biên dịch được.
    import { countAt } from "@/lib/bo-dem";
    import type { RoundSettings } from "@/config/game";
    import {
      GIAY_MOI_VONG,
      GIAY_TANG_TOC,
      GIAY_TOI_DA_MOT_LUOT,
      TOC_DO_TOI_DA,
      TOC_DO_TOI_THIEU,
    } from "@/config/chon-so";

    /** Hai đầu đều BAO GỒM: {tu:1, den:100} là 100 số. */
    export interface DaiSo {
      tu: number;
      den: number;
    }

    export function coDai(dai: DaiSo): number {
      return dai.den - dai.tu + 1;
    }

    /**
     * VÒNG CHẠY — danh sách số sẽ lần lượt hiện trên LED, tăng dần.
     *
     * 🔴 Loại trừ đổi chính VÒNG CHẠY, không ánh xạ kết quả sang số trống gần
     * nhất. Người đứng xem thấy LED nhảy 0041 → 0043 vì 42 đã có người lấy, và
     * đó là SỰ THẬT của buổi chiều hôm đó. Cách kia — vẫn hiện 42 rồi trả 43 —
     * là thay thầm, đúng thứ đã có sẹo ở cả hai sổ (xem L1).
     */
    export function vongChay(dai: DaiSo, daRa: ReadonlySet<number>): number[] {
      const v: number[] = [];
      for (let n = dai.tu; n <= dai.den; n += 1) if (!daRa.has(n)) v.push(n);
      return v;
    }

    /**
     * Nhịp quay tính theo ĐỘ DÀI DẢI, không dùng 4 mức khó của Trúng Số.
     *
     * Vì sao: mức "vừa" chạy 800 số/giây. Với dải 100 số đó là 8 vòng MỖI GIÂY —
     * bảng LED thành một vệt mờ và người chơi biết mình đang bốc mù, không phải
     * đang chọn. Ở đây tốc độ co giãn theo dải để một vòng luôn mất ~1,5 giây.
     */
    export function nhipCua(dai: DaiSo): RoundSettings {
      const n = coDai(dai);
      const maxSpeed = Math.min(TOC_DO_TOI_DA, Math.max(TOC_DO_TOI_THIEU, n / GIAY_MOI_VONG));
      return {
        startSpeed: Math.max(TOC_DO_TOI_THIEU, maxSpeed / 4),
        maxSpeed,
        rampSeconds: GIAY_TANG_TOC,
        lockSeconds: GIAY_TANG_TOC,
        roundLimitSeconds: GIAY_TOI_DA_MOT_LUOT,
        countdownSeconds: 0,
      };
    }

    /**
     * Con số đang hiện trên LED tại giây thứ `t`.
     *
     * Một dòng, và nó thừa hưởng miễn phí mọi tính chất của `countAt`: hàm THUẦN
     * của thời gian, đơn điệu tăng, kết quả không đổi theo nhịp khung hình. Đó
     * là điều kiện để LCD và điện thoại tự chạy rồi SNAP về cùng một kết quả.
     *
     * `vong` phải KHÔNG RỖNG — nơi gọi tự canh (hết số thì chương trình đã dừng).
     */
    export function soTaiGiay(
      nhip: RoundSettings,
      vong: readonly number[],
      t: number,
    ): number {
      return vong[Math.floor(countAt(nhip, t)) % vong.length];
    }
    ```

  - [x] **Bước 4 — test XANH**

    Chạy: `npx vitest run tests/vong-so.test.ts`
    Mong đợi: **PASS, 10/10**

  - [x] **Bước 5 — thêm hai câu đọc vào `lib/luot/kho-luot.ts`**

    ```ts
    /**
     * Tập số đã phát của một chương trình Chọn Số.
     *
     * 🔴 Suy ra từ `luot_choi`, KHÔNG nuôi một bảng `so_da_ra` riêng. Bảng riêng
     * là nguồn sự thật thứ hai, phải đồng bộ ở mọi đường xoá (xoá chương trình,
     * xoá SĐT theo yêu cầu riêng tư, dọn dữ liệu thử) — và nó chỉ lệch vào đúng
     * ngày ai đó quên một đường. Cùng lý do `qua_tang` cố ý không lưu bộ đếm.
     *
     * 🔴 Mệnh đề `between` KHÔNG phải trang trí: thu hẹp dải từ 1→100 xuống 1→50
     * sau khi đã phát vài số thì những số > 50 phải rơi khỏi phép đếm, không thì
     * "còn lại N số" nói dối ngay hôm sửa.
     */
    export function soDaRa(ctId: number, tu: number, den: number): Set<number> {
      const dong = layNhieu<{ so_da_dung: number }>(
        `select distinct so_da_dung from luot_choi
          where chuong_trinh_id = ? and ket_thuc_luc is not null
            and so_da_dung between ? and ?`,
        ctId,
        tu,
        den,
      );
      return new Set(dong.map((d) => d.so_da_dung));
    }

    /** Còn ai đang giữa lượt không — chặn hai người cùng bốc một số. */
    export function coLuotDangMo(ctId: number, sauLuc: number): boolean {
      return (
        layMot(
          `select 1 from luot_choi
            where chuong_trinh_id = ? and ket_thuc_luc is null and bat_dau_luc > ?`,
          ctId,
          sauLuc,
        ) !== null
      );
    }
    ```

  - [x] **Bước 6 — thêm `ghiLanChonSo` vào `lib/van/kho-van.ts`**

    🔴 **KHÔNG chạm `ghiLanBam`** — nó quấn "lần tốt nhất" + `bocQuaChoVan` trong một
    transaction, và đó là chỗ đã có sẹo. Viết hàm mới bên cạnh:

    ```ts
    /**
     * Ghi lần bấm DUY NHẤT của một ván Chọn Số, rồi chốt ván ngay.
     *
     * Khác `ghiLanBam` ở ba điểm, và cả ba đều cố ý:
     *   • KHÔNG bốc quà — quà đánh số nằm ngoài hệ thống.
     *   • KHÔNG so "lần tốt nhất" — mỗi ván đúng một lần bấm (Q4).
     *   • `trung` LUÔN = 0 — đặt 1 là làm cột "Đã trúng" của Trúng Số nói dối.
     */
    export function ghiLanChonSo(
      vanId: number,
      luotId: number,
      maXacThuc: string,
    ): KetQuaGhiLanBam | null {
      const van = timVan(vanId);
      if (!van || van.ketThucLuc !== null) return null;
      const luc = Date.now();
      chay(
        `update van_choi
            set so_lan_da_dung = 1, luot_tot_nhat_id = ?, trung = 0,
                ma_xac_thuc = ?, ket_thuc_luc = ?
          where id = ? and ket_thuc_luc is null`,
        luotId,
        maXacThuc,
        luc,
        vanId,
      );
      return {
        soLanDaDung: 1,
        lechTotNhat: 0,
        soTotNhat: null,
        conLan: 0,
        vanXong: true,
        trung: false,
        quaTangId: null,
        tenQuaTang: null,
      };
    }
    ```

  - [x] **Bước 7 — viết `lib/tro-choi/luat-chon-so.ts`** cài đúng giao diện `LuatChoi` của
        C.2: `truocKhiMo` dựng `{dai, daRa}` làm `keo`; `cham` trả `null` khi `hetGio`
        (giả định 5) hoặc khi `giay < lockSeconds`; `ghiVan` gọi `ghiLanChonSo`.

  - [x] **Bước 8 — cả bộ XANH + commit**

    ```bash
    npm run lint && npx tsc --noEmit && npm test && npm run build
    git add lib/chon-so/ lib/tro-choi/luat-chon-so.ts lib/luot/kho-luot.ts lib/van/kho-van.ts tests/vong-so.test.ts
    git commit -m "feat(chon-so): loi vong so thuan + luat choi, chua co giao dien"
    ```

---

# GIAI ĐOẠN C-C — Chơi được một ván thật, loại trừ TẮT (2,25 ngày)

> **DEMO kết thúc GĐ:** anh tạo chương trình Chọn Số dải `1→100`, mở LCD, quét QR bằng
> điện thoại, nhập tên + SĐT, bấm BẮT ĐẦU rồi DỪNG. **LED trên LCD dừng ở `0042`; cả hai
> màn hình cùng nói "Chúc mừng bạn đã chọn được dãy số may mắn 0042".**

- [x] **C.4 — Màn quản trị: tạo · danh sách · chi tiết** ✅ 01/09 — 493 test, 3 route mới
  - (a) `kiemThietLapChonSo` (cùng file `kiem-hop-le.ts` — đó là nhà của "một bộ luật duy
    nhất cho cả tạo và sửa"), `app/actions/chon-so.ts`, ba trang `/quan-tri/chon-so/**`,
    `form-tao-chon-so.tsx`, mục "Chọn Số" trong thanh bên.
    Form hiện **số lượng số** ("1 → 100 = 100 số") và **nhịp quay** ("một vòng ~1,5 giây") —
    bản đối ứng của `BangTiLe`: nói thật với nhân viên **trước** khi họ bấm Tạo.
  - (b) Vào `/quan-tri/chon-so` → **Tạo** → nhập `1` và `100` → trang chi tiết hiện **mã QR
    in được**, dải số, "còn 100 số". Rồi thử nhập `100`–`1` và `1`–`99999`: **cả hai bị
    chặn kèm câu tiếng Việt nói rõ vì sao**.
  - (c) `tests/tao-chon-so.test.ts`: biên dải · dải đảo ngược · vượt `WHEEL_SIZE` · dải một
    số · **phân quyền theo cơ sở ở tầng SQL** (tài khoản sale không mở được chương trình
    của cơ sở khác). Cùng bảng ca chạy qua **cả** đường tạo lẫn đường sửa.
  - (d) 0,75 ngày.
  - (f) phụ-thuộc: C.3

  - [x] **Bước 1 — test ĐỎ cho `kiemThietLapChonSo`** — bảng ca dùng chung, chạy qua **cả**
        đường tạo lẫn đường sửa (R8 sống ở đây):

    ```ts
    const HOP_LE = { daiTu: 1, daiDen: 100, loaiTruDaRa: false, tenGiaiThuong: "Quà Tết" };

    const CA_XAU: ReadonlyArray<[ten: string, sua: Partial<ThietLapChonSo>]> = [
      ["dải đảo ngược", { daiTu: 100, daiDen: 1 }],
      ["🔴 vượt 4 chữ số — Led4Digits sẽ cắt cụt trong im lặng", { daiTu: 1, daiDen: 99999 }],
      ["số âm", { daiTu: -1, daiDen: 10 }],
      ["dải một số — nút DỪNG thành đồ trang trí", { daiTu: 7, daiDen: 7 }],
      ["tên đợt rỗng", { tenGiaiThuong: "   " }],
      ["dải không phải số nguyên", { daiTu: 1.5, daiDen: 10 }],
    ];

    it.each(CA_XAU)("chặn: %s", (_ten, sua) => {
      expect(kiemThietLapChonSo({ ...HOP_LE, ...sua })).not.toBeNull();
    });

    it("dải hợp lệ thì cho qua", () => {
      expect(kiemThietLapChonSo(HOP_LE)).toBeNull();
      expect(kiemThietLapChonSo({ ...HOP_LE, daiTu: 0, daiDen: 9999 })).toBeNull();
    });

    it("🔴 đường SỬA dùng ĐÚNG bộ luật của đường TẠO", () => {
      const ct = taoChuongTrinh({ ...MAU, troChoi: "chon_so", ...HOP_LE });
      // Bên lỏng hơn là bên người ta dùng để lách — nên không được có bên lỏng hơn.
      for (const [, sua] of CA_XAU) {
        expect(() => suaChonSo(ct.id, { ...HOP_LE, ...sua })).toThrow();
      }
    });

    it("sale không mở được chương trình chọn số của cơ sở khác", () => {
      const ct = taoChuongTrinh({ ...MAU, troChoi: "chon_so", ...HOP_LE, coSoId: 1 });
      expect(timTheoMaChonSo(ct.ma, { coSoId: 2, nhanVienId: 9 })).toBeNull();
      expect(timTheoMaChonSo(ct.ma, { coSoId: 1, nhanVienId: 9 })).not.toBeNull();
    });
    ```

  - [x] Bước 2 — chạy, thấy ĐỎ: `npx vitest run tests/tao-chon-so.test.ts`
  - [x] Bước 3 — viết `kiemThietLapChonSo` trong `lib/chuong-trinh/kiem-hop-le.ts`
  - [x] Bước 4 — viết action + ba trang + form (ô nhập **có kiểm soát**)
  - [x] Bước 5 — thêm khoá locale **cùng commit** với chỗ dùng
  - [x] Bước 6 — `npm test && npm run build`, rồi kiểm tay theo (b)
  - [x] Bước 7 — commit `feat(chon-so): man quan tri tao/danh sach/chi tiet`

- [x] **C.5 — Hai màn chơi + hai loại tin SSE** ✅ 01/09 — e2e 18/18, tin mới không gây tác dụng phụ
  - (a) `man-hinh-chon-so.tsx` + `man-dien-thoai-chon-so.tsx` + 2 biến thể `TinTrongPhong`
    + 2 nhánh điều phối ở hai `page.tsx`. **Dùng lại nguyên xi**: `Led4Digits`,
    `formatNumber`, `doThoiDiemBam`, `doLechDongHo`, `moKenh`, `createSoundEngine`,
    `vibrate`, `LogoSata`, `LinhVatSata`, `useTatTieng`.
  - (b) Đúng kịch bản DEMO ở trên, kèm **ba phép soi**: ① số nhỏ hiện **`0007`** chứ không
    phải `7` · ② LCD **SNAP** đúng con số điện thoại đã dừng (đứng xem, không thấy nó "nhảy
    lại") · ③ đầu trang **không còn ô "SỐ TRÚNG THƯỞNG"**.
  - (c) `npm run e2e` một lượt — **18/18 cũ vẫn xanh**. Đây mới là điều đáng canh: hai loại
    tin mới phải đi qua Trúng Số mà không gây một tác dụng phụ nào.
  - (d) 1,0 ngày.
  - (f) phụ-thuộc: C.4

  **Hai loại tin MỚI** — thêm vào `TinTrongPhong`, **không** mở rộng tin `ket-qua` cũ:

  ```ts
  | { loai: "bat-dau-chon-so"; luotId: number; batDauLuc: number;
      nhip: RoundSettings; dai: { tu: number; den: number }; daRa: number[] }
  | { loai: "ket-qua-chon-so"; luotId: number; so: number; maXacThuc: string;
      tenRutGon: string; conLai: number | null; giayXemKetQua: number }
  ```

  > **Vì sao loại tin MỚI chứ không thêm trường vào `ket-qua`:** tin `ket-qua` hiện mang 15
  > trường, **7 trong đó là khái niệm trúng/quà** (`trung`, `khoangLech`, `maXacThuc`,
  > `tenGiaiThuong`, `lechTotNhat`, `soTotNhat`, `hetGio`). Nhồi Chọn Số vào đó là để lại
  > bảy trường nói dối trong mỗi gói tin. Và vì hai game dùng **hai component riêng**, tin
  > mới không bao giờ tới `ManHinh` của Trúng Số.

  - [x] Bước 1 — thêm 2 biến thể vào `lib/dong-bo/kenh.ts`
  - [x] Bước 2 — viết `man-hinh-chon-so.tsx` (tự chạy `soTaiGiay` theo `Date.now()`, SNAP khi
        nhận `ket-qua-chon-so`)
  - [x] Bước 3 — viết `man-dien-thoai-chon-so.tsx` (`onPointerDown` + `e.nativeEvent.timeStamp`
        → `doThoiDiemBam`; **không** có nút "bấm tiếp")
  - [x] Bước 4 — thêm nhánh điều phối vào hai `page.tsx`
  - [x] Bước 5 — `npm run build && npm run e2e` (một lượt) → **18/18**
  - [x] Bước 6 — kiểm tay ba phép soi ở (b)
  - [x] Bước 7 — commit `feat(chon-so): hai man choi + hai loai tin SSE`

- [x] **C.6 — Chốt số phía máy chủ + ghi ván + mã xác thực** ✅ 01/09 — chốt số máy chủ, trung=0, không đụng kho quà
  - (a) `luat-chon-so.cham/ghiVan` ghi `so_da_dung`, **`trung = 0`**, `khoang_lech = 0`,
    `so_lan_da_dung = 1`, `luot_tot_nhat_id`, `ket_thuc_luc`, `ma_xac_thuc`. **Không** gọi
    `bocQuaChoVan`. Hết giờ ⇒ từ chối, **không tiêu lượt ngày** (giả định 5).
  - (b) Chơi một ván rồi mở `/quan-tri/chon-so/<ma>`: dòng lịch sử hiện **đúng số vừa ra**,
    đúng họ tên, đúng SĐT. Mở `/quan-tri` (Trúng Số) — **ván này không được đếm vào "Đã
    trúng"**.
  - (c) `tests/chon-so.test.ts`: ghi đúng cột · `trung` luôn 0 **kể cả khi số ra bằng đúng
    `so_trung` giả** (đây là R2) · kho quà **không bị đụng một dòng nào** · một lần bấm là
    ván chốt ngay · hết giờ không tiêu lượt ngày.
  - (d) 0,5 ngày.
  - (f) phụ-thuộc: C.5

  - [x] Bước 1 — test ĐỎ cho R2:

    ```ts
    it("🔴 chọn số KHÔNG BAO GIỜ ghi trung=1, kể cả khi số ra bằng đúng so_trung", () => {
      const ct = taoChuongTrinh({ ...MAU, troChoi: "chon_so", daiTu: 0, daiDen: 9 });
      // so_trung của chương trình chọn số luôn là 0, và 0 nằm trong dải 0→9.
      const luot = batDauLuot(ct.ma, nguoiChoiId)!;
      const kq = dungLuot(luot.luotId, 2500, "dien_thoai")!;
      expect(kq.trung).toBe(false);
      const van = timVan(luot.vanId)!;
      expect(van.trung).toBe(false);
      expect(van.soLanDaDung).toBe(1);
      expect(van.ketThucLuc).not.toBeNull();
      // Kho quà không bị đụng.
      expect(layMot("select 1 from qua_tang where chuong_trinh_id = ?", ct.id)).toBeNull();
    });
    ```

  - [x] Bước 2 — chạy, thấy ĐỎ
  - [x] Bước 3 — hoàn thiện `luat-chon-so.ts`
  - [x] Bước 4 — `npm test && npm run build`, kiểm tay theo (b)
  - [x] Bước 5 — commit `feat(chon-so): chot so phia may chu, khong dung kho qua`

---

# GIAI ĐOẠN C-D — Loại trừ số đã ra, cả hai nhánh (1,0 ngày)

> **DEMO kết thúc GĐ:** anh tạo chương trình dải `1→3`, **bật** loại trừ. Chơi ba ván bằng
> ba số điện thoại — **ván 2 và 3 không bao giờ ra lại số cũ**. Sau ván 3, LCD hiện "đã
> phát hết số", người thứ tư quét QR bị chặn, màn quản trị nói "còn 0 số". Rồi tạo chương
> trình thứ hai **tắt** loại trừ, chơi hai ván ra trùng số — **và đó là đúng**.

- [x] **C.7 🔴 RỦI RO CAO — Loại trừ + một-lượt-một-lúc + tự dừng** ✅ 01/09 — 498 test, tự dừng khi cạn dải
  - (a) `truocKhiMo` của Chọn Số: dựng `daRa` bằng `soDaRa(ctId, tu, den)`; **chặn khi còn
    lượt đang mở** (`coLuotDangMo`); khi vòng rỗng thì tự `doiTrangThai(ma, "ket_thuc")` +
    phát tin `trang-thai` (cả hai đã có sẵn và đã được e2e canh). Vòng **chốt tại lúc mở
    lượt**, gửi qua `bat-dau-chon-so`.
  - (b) Đúng kịch bản DEMO. **Thêm một phép soi khó:** trong lúc điện thoại đang chạy dở
    một lượt, bấm phím **Space trên LCD** — phải **không** mở được lượt thứ hai.
  - (c) `tests/chon-so.test.ts` mở rộng: loại trừ BẬT ⇒ số đã ra biến mất · loại trừ TẮT ⇒
    trùng là hợp lệ · dải `1→3` chơi 3 ván ⇒ `trang_thai = 'ket_thuc'` · ván thứ 4 bị chặn
    kèm đúng câu lỗi · **số cuối cùng vẫn phát được** · sửa dải sau khi đã phát thì số ngoài
    dải không tính vào `daRa`.
  - (d) 0,75 ngày.
  - (f) phụ-thuộc: C.6

  > **Vì sao "một lượt một lúc" nằm chung hạng mục với loại trừ:** hai người bấm cùng lúc
  > sẽ cùng đọc một tập `daRa` và có thể ra cùng một số. Chế độ `tai_quay` đã xếp hàng bằng
  > cơ chế giữ chỗ, **nhưng `batDauTaiCho` trên LCD gọi `moLuot(ma, null)` KHÔNG xin chỗ** —
  > tức nhân viên gõ Space có thể mở một lượt song song với điện thoại đang chơi. Ở Trúng Số
  > điều đó vô hại; ở đây nó là hai phần quà cùng số.

  - [x] Bước 1 — test ĐỎ: dải `1→3`, chơi 3 ván, ba số **khác nhau**, ván 4 bị chặn
  - [x] Bước 2 — chạy, thấy ĐỎ
  - [x] Bước 3 — cài `truocKhiMo` + tự dừng
  - [x] Bước 4 — `npm test`, rồi kiểm tay **cả hai** nhánh bật/tắt theo (b)
  - [x] Bước 5 — commit `feat(chon-so): loai tru so da ra, mot luot mot luc, tu dung`

- [x] **C.8 — "Còn lại N số" ở danh sách và trang chi tiết** ✅ 01/09 — một truy vấn con, không N+1
  - (a) `danhSachChonSo` thêm truy vấn con `count(distinct so_da_dung) … between dai_tu and
    dai_den` — **một câu SQL, không đếm bằng vòng lặp** (cùng lối với `so_luot`/`so_van` sẵn
    có). Ngưỡng cảnh báo `max(1, NGUONG_CANH_BAO_DAI × tổng)`.
  - (b) Mở `/quan-tri/chon-so`: cột **Còn lại** giảm dần đúng theo số ván đã chơi. Sửa dải
    từ `1→100` xuống `1→50` rồi tải lại — **con số phải điều chỉnh, không âm**.
  - (c) `tests/chon-so.test.ts`: đếm còn lại sau khi thu hẹp dải · loại trừ TẮT trả `null`
    (hiện "—", không hiện một con số vô nghĩa).
  - (d) 0,25 ngày.
  - (f) phụ-thuộc: C.7

  > 🔴 **Ngưỡng thuần TỈ LỆ chết lặng với dải nhỏ** — 20% của 4 là 0,8 mà tồn luôn là số
  > nguyên ≥ 1, nên còn 1 số là nhảy thẳng xanh → đỏ, dải vàng chưa từng bật. Vết sẹo đã
  > trả giá ở kho quà, đừng lặp lại.

  - [x] Bước 1 — test ĐỎ cho phép đếm sau khi thu hẹp dải
  - [x] Bước 2 — chạy, thấy ĐỎ
  - [x] Bước 3 — thêm truy vấn con + `ChonSoKemSoLieu.conLai`
  - [x] Bước 4 — `npm test && npm run build`, kiểm tay theo (b)
  - [x] Bước 5 — commit `feat(chon-so): con lai N so o danh sach va chi tiet`

---

# GIAI ĐOẠN C-E — Đối soát · xuất · sửa · e2e (1,5 ngày)

> **DEMO kết thúc GĐ:** anh mở trang chi tiết một chương trình Chọn Số đã chơi, bấm **Xuất
> Excel**, mở file — thấy cột "Số may mắn" với **`0042` giữ nguyên số 0 đầu**. Rồi sửa dải
> số ngay tại chỗ, **mã QR cũ vẫn dùng được**.

- [x] **C.9 — Bảng lịch sử + xuất Excel riêng** ✅ 01/09 — 501 test, số may mắn giữ số 0 đầu
  - (a) `bang-lich-su-chon-so.tsx` + `lib/xuat/bang-so-da-chon.ts` + route xuất. Dùng lại
    `lichSu()` / `toanBoLichSu()` **không sửa một dòng**. Cột: Thời điểm · Người chơi · SĐT
    · **Số may mắn** · Mã xác thực · Đã trao · Đồng ý tư vấn. **Không** có cột
    Trúng/Trượt/Lệch.
  - (b) Tải file, mở bằng Excel/Numbers, kiểm ô số là **`0042` chứ không phải `42`**.
  - (c) `tests/bang-xuat.test.ts` mở rộng: *"chương trình chọn số không xuất cột Kết quả =
    Trượt"*. `npm run e2e` — `gd19-xuat-excel` cũ vẫn xanh.
  - (d) 0,5 ngày.
  - (f) phụ-thuộc: C.8

  > 🔴 Số đi qua `chu()` **chứ không** `so()` trong bộ ghi xlsx — nếu không Excel ăn mất số
  > 0 đầu và `0042` thành `42`. Và `lib/xuat/bang-lich-su.ts` hiện có sẽ ghi **"Trượt" trên
  > mọi dòng** Chọn Số rồi gửi file đó cho đội sale — đó là lý do phải có bộ chuyển riêng.

  - [x] Bước 1 — test ĐỎ: ô "Số may mắn" phải là chuỗi `"0042"`, không phải số 42
  - [x] Bước 2 — chạy, thấy ĐỎ
  - [x] Bước 3 — viết `bang-so-da-chon.ts` + route + bảng
  - [x] Bước 4 — `npm test && npm run e2e` (một lượt)
  - [x] Bước 5 — commit `feat(chon-so): bang lich su + xuat Excel rieng`

- [x] **C.10 — Sửa thiết lập tại chỗ** ✅ 01/09 — sửa tại chỗ, mã QR cũ vẫn dùng được
  - (a) `form-sua-chon-so.tsx` + `suaChonSo` + `suaChonSoForm` + ghi nhật ký. Cố ý **không**
    cho đổi `ma`, `co_so_id`, `che_do`, `tro_choi` — cùng lý do như Trúng Số.
  - (b) Đổi `1→100` thành `1→50` trên chương trình **đang chạy**, bấm Lưu, quét lại **mã QR
    cũ** bằng điện thoại — **vẫn chơi được**, và số ra nằm trong 1–50. Thu hẹp dải khi đã
    phát số ngoài dải mới ⇒ hộp xác nhận nói bằng **con số**: *"đã phát 7 số, 3 trong đó nằm
    ngoài dải mới"*.
  - (c) `tests/chon-so.test.ts`: sửa dải **không đụng ván cũ** · dải mới sai bị chặn · nhật
    ký ghi đúng dòng.
  - (d) 0,25 ngày.
  - (f) phụ-thuộc: C.9

  - [x] Bước 1 — test ĐỎ · [ ] Bước 2 — chạy thấy ĐỎ · [ ] Bước 3 — viết form + action
  - [x] Bước 4 — `npm test`, kiểm tay theo (b) · [ ] Bước 5 — commit

- [x] **C.11 — Hai kịch bản e2e trình duyệt thật** ✅ 01/09 — e2e 20/20, hai màn hình cùng một con số
  - (a) `tests/e2e/nen/chon-so.mjs` dựng **hai** chương trình: dải `1→100` loại trừ TẮT, và
    dải `1→3` loại trừ BẬT. Rồi `gd19-chon-so.mjs` + `gd20-chon-so-loai-tru.mjs` + 2 dòng
    vào `KICH_BAN` của `tests/e2e/chay.mjs`.
  - (b) `npm run e2e` **một lượt duy nhất trong một lệnh** → mong đợi **20/20**.
  - (c) chính nó.
  - (d) 0,75 ngày.
  - (f) phụ-thuộc: C.10

  > 🔴 **Kịch bản `gd19` phải mở CẢ LCD LẪN ĐIỆN THOẠI cùng lúc** và khẳng định **bốn chữ số
  > đọc từ hai DOM giống hệt nhau**. Hôm nay **không kịch bản nào trong 18 cái làm việc
  > đó** — `gd12` mở quản trị + điện thoại, `gd13`/`gd14` mở LCD một mình. Mà đó đúng là lớp
  > lỗi loại trừ đẻ ra (R7).
  >
  > Kịch bản `gd20` dùng dải `1→3` — **dải nhỏ làm lỗi lộ ra ngay lượt thứ hai** thay vì
  > phải chơi 50 ván mới thấy. Và đo toạ độ ở **khung 390px** cho màn kết quả: vết sẹo v2.1
  > *"khối gợi ý tràn 70px ra ngoài mép phải điện thoại, chỉ thấy ở khung 390px"*.

  - [x] Bước 1 — viết `nen/chon-so.mjs` (đặt `startSpeed = maxSpeed = 2` để bấm chủ động được)
  - [x] Bước 2 — viết `gd19-chon-so.mjs` (hai màn hình, so bốn chữ số)
  - [x] Bước 3 — viết `gd20-chon-so-loai-tru.mjs` (dải 1→3, chơi tới cạn, kiểm chặn)
  - [x] Bước 4 — nối 2 dòng vào `KICH_BAN`
  - [x] Bước 5 — `npm run e2e` **một lượt** → **20/20**
  - [x] Bước 6 — commit `test(chon-so): hai kich ban e2e trinh duyet that`

---

# GIAI ĐOẠN C-F — Hoàn thiện & bàn giao (0,5 ngày)

> **DEMO kết thúc GĐ:** anh bấm dấu `?` cạnh ô "Loại trừ số đã ra" và **đọc được giải thích
> đặt như vậy thì điều gì xảy ra**; mở `/the-le` của Chọn Số thấy đúng các bước của game này
> chứ không phải của Trúng Số.

- [x] **C.12 — Dấu `?`, thể lệ, tài liệu, ADR-009** ✅ 01/09 — ADR-009, BRD, thể lệ riêng, 56 mục / 9 ADR
  - (a) `GoiY` cho 3 ô mới (dải · loại trừ · tên đợt); `RULES_CHON_SO`; **tạo
    `modules/GAME_SU_KIEN/CHON_SO/OVERVIEW.md`** theo khuôn 6 mục của `TRUNG_SO/OVERVIEW.md`
    (mục 4 chỉ **TRỎ** sang sổ này, 🔴 **cấm chép danh sách hạng mục sang** — chép là dựng
    bản sao thứ hai, và hai bản chỉ lệch vào đúng ngày ai đó sửa một bản); **tạo
    `docs/brd/chon-so.md`** theo khuôn `dem-so-bo-dem-may-man.md` (mọi tham số có mục *"vì
    sao con số này"*); cập nhật `app/CLAUDE.md` (mục "một app, nhiều game" + bài học mới),
    `OVERVIEW.md` module, `module.config.json` (thêm phần tử vào `troChoi[]`), `CLAUDE.md` gốc;
    **ADR-009 — "Loại trừ số đã ra: đổi VÒNG CHẠY, không ánh xạ kết quả"** ghi lại lập luận
    L1 để người sau không bàn lại; bump `adrCount: 9` trong `.claude/scaffold.json`.
  - (b) Bấm dấu `?` trên khung điện thoại **390px** — khối giải thích **không tràn mép**.
  - (c) `npm test` · `tests/locale.test.ts` (bắt khoá mồ côi) ·
    `node scripts/check-structure.mjs` → phải in **9 ADR**.
  - (d) 0,5 ngày.
  - (f) phụ-thuộc: C.11

  - [x] Bước 1 — viết ADR-009 · [ ] Bước 2 — bump `adrCount` · [ ] Bước 3 — `GoiY` + thể lệ
  - [x] Bước 4 — cập nhật 4 file tài liệu · [ ] Bước 5 — `node scripts/check-structure.mjs`
  - [x] Bước 6 — commit `docs(chon-so): ADR-009, the le, dau ?, cap nhat so sach`

---

## VIỆC KHÔNG PHẢI CỦA LẬP TRÌNH — mở ngay từ ngày 1

- [x] **C.N1 — 🛑 Chốt sáu giả định** (mục "SÁU GIẢ ĐỊNH" ở trên)
  - (b) Anh đọc và trả lời bằng chữ. · (d) 0,1 ngày. · (e) chặn: **NGƯỜI** — 🔴 **chặn C.0**
  - (f) phụ-thuộc: không

- [ ] **C.N2 — Mở file Excel Chọn Số bằng Excel/Numbers thật**
  - (b) Tải file từ `/api/xuat/chon-so/<ma>`, mở bằng phần mềm thật, kiểm ô "Số may mắn"
    hiện `0042` chứ không phải `42`. · (d) 0,1 ngày. · (e) chặn: **NGƯỜI**
  - (f) phụ-thuộc: C.9

- [ ] **C.N3 — Chạy thử tại quầy một buổi, có người lạ bấm**
  - (b) Dán QR, để 10 phụ huynh thật chơi, đối chiếu số trên điện thoại với quà đánh số cầm
    tay. Mong đợi **10/10 nhận đúng phần quà mang số họ thấy trên LED**. · (d) 0,25 ngày.
  - (e) chặn: **NGƯỜI** · (f) phụ-thuộc: C.11

- [ ] **C.N4 — Chuẩn bị bộ quà đánh số ngoài hệ thống**
  - (b) Dán nhãn số `0001…N` lên phần quà, khớp đúng dải đã khai trong app; đếm tay: số nhãn
    = số trong dải. · (e) chặn: **NGOÀI** · (f) phụ-thuộc: C.4

---

## TỔNG KẾT

| Giai đoạn | Hạng mục | Ngày công |
| --------- | -------- | --------- |
| C-A — Nền, không đổi hành vi | C.0 · C.1 | 0,50 |
| C-B — Xương sống máy chủ | C.2 · C.3 | 1,00 |
| C-C — Chơi được một ván thật | C.4 · C.5 · C.6 | 2,25 |
| C-D — Loại trừ số đã ra | C.7 · C.8 | 1,00 |
| C-E — Đối soát · xuất · sửa · e2e | C.9 · C.10 · C.11 | 1,50 |
| C-F — Hoàn thiện & bàn giao | C.12 | 0,50 |
| | **Tổng MÁY** | **6,75** |
| | Việc NGƯỜI (C.N1–C.N3) | 0,45 |

**Đối chiếu để hiệu chỉnh:** v2.1 ước 4,5 ngày, làm hết **2,4 ngày** (9/9 hạng mục). Giữ
nhịp đó thì bản này rơi vào khoảng **3,5 – 4 ngày thực**. Con số 6,75 là ước lượng thận
trọng, không phải cam kết.

**Chạy song song:** `C.4 ∥ C.5` (một người làm quản trị, một người làm màn chơi — chúng chỉ
gặp nhau ở `config/locale.ts` và `config/chon-so.ts`, hai file thêm-vào-cuối) và
`C.9 ∥ C.10`. Tiết kiệm ~1 ngày đồng hồ. Chuỗi `C.0 → C.1 → C.2 → C.3` là **cứng**, không
song song được: mỗi cái đứng trên nền cái trước.

### Cổng nghiệm thu cuối

| Lệnh | Mong đợi |
| ---- | -------- |
| `npm test` | ≥ 436 test cũ **còn nguyên xanh** + ~35 test mới |
| `npm run e2e` (một lượt) | **20/20** |
| `npm run build` | xanh, 18 route cũ + 4 route mới |
| `npx tsc --noEmit` · `npm run lint` | xanh |
| `node scripts/check-structure.mjs` | 55 mục, **9 ADR** |
| `C.N3` | 10/10 phụ huynh nhận đúng phần quà mang số họ thấy trên LED |

---

## HAI VIỆC NGOÀI PHẠM VI SỔ NÀY — cần anh biết

1. 🔴 **Mâu thuẫn ADR-005 vẫn treo.** Chọn Số gộp chung **củng cố** ADR-005 ("một app chứa
   nhiều game"), nhưng Vòng Quay vẫn đứng riêng ở `VONG_QUAY_MAY_MAN/app/`. Sổ này không hoà
   giải điểm đó — chốt hướng nào thì sửa ADR-005 theo hướng đó.
2. ⚠️ **Sổ Vòng Quay đang SAI so với đĩa.** `VONG_QUAY_MAY_MAN/OVERVIEW.md` ghi *"CHƯA viết
   một dòng code nào. Thư mục `app/` chưa tồn tại"* và `PLAN_VONG_QUAY.md` ghi *"🛑 CHƯA
   ĐƯỢC PHÉP CODE"* — nhưng `VONG_QUAY_MAY_MAN/app/` **đã có thật**: 18 mục cấp 1, có
   `page.tsx`, `layout.tsx`, `globals.css`, `config/locale.ts`, `tests/locale.test.ts`,
   `node_modules`, `.next`. Nên sửa sổ trước khi ai đó đọc nó rồi dựng lại từ đầu.
