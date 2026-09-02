# PLAN — TRÚNG SỐ v2.1 · Dọn dẹp & làm chủ chương trình

> **Sổ này là lộ trình ĐANG CHẠY.** Lịch sử v1 → v2 (51 hạng mục, 41 đã tick) nằm ở
> `PLAN_TRUNG_SO_V1.md` cùng thư mục — đọc file đó khi cần tra vì sao một thứ được làm thế
> này chứ không thế kia. File đó **96 KB, đừng nạp trọn để tra một câu** — grep trước.

**Mục tiêu:** biến bản đang chạy được thành bản **quản trị viên tự làm chủ** — tự xoá, tự
sửa, tự hiểu từng ô mình đang điền, và nghe được tiếng trên đúng chiếc máy ở quầy.

**Nguồn:** 8 điểm vướng bạn ghi lại sau buổi chạy thử thật ngày 01/09/2026, cộng một lỗ
hổng phân quyền lộ ra khi khảo sát mã để lên kế hoạch.

**Kiến trúc:** không đổi. Next.js 16 App Router tự chứa · `node:sqlite` · SSE trong route
handler · lõi bộ đếm là hàm thuần của thời gian. **Không thêm một gói phụ thuộc nào** —
kể cả dấu `?` và bản vá âm thanh iOS.

---

## BÀN GIAO — ĐÃ CHUYỂN SANG SỔ V3

🔴 Bàn giao phiên gần nhất nằm ở **`PLAN_TRUNG_SO_V3.md`** (game CHỌN SỐ, lộ trình đang
chạy). Sổ này giữ lịch sử v2.1: 9/9 hạng mục, còn duy nhất `22.1` chờ nghiệm thu âm thanh
trên iPhone thật.

---

## RÀNG BUỘC TOÀN CỤC (áp cho MỌI hạng mục dưới đây)

- **Chữ tiếng Việt 100%, đúng dấu.** Chuỗi mới vào `config/locale.ts` **trước**, không viết
  thẳng vào component. `tests/locale.test.ts` sẽ bắt khoá thừa.
- **Không hardcode màu/font** — đọc `config/thuong-hieu.ts`. `tests/thuong-hieu.test.ts`
  canh nó khớp `app/globals.css`.
- **Không hardcode hằng số nghiệp vụ** — đọc `config/game.ts` và `config/to-chuc.ts`.
- 🔴 **Lọc theo quyền ở TẦNG SQL, không ở tầng giao diện.** Ẩn cái nút mà câu truy vấn vẫn
  trả đủ dòng thì danh bạ khách đã nằm trong HTML gửi ra khỏi máy chủ.
- 🔴 **MỌI câu SQL của một bảng nằm trong đúng MỘT file `lib/**/kho.ts`** (ADR-008).
- **Chạy `npm run sao-luu` TRƯỚC mọi việc đụng CSDL.**
- Ô nhập của form người lạ phải **có kiểm soát** — React dọn form sau mỗi server action.
- Mỗi hạng mục xong: `npm run lint` · `npx tsc --noEmit` · `npm test` · `npm run build`
  **đều xanh** mới được tick. Mốc đối chiếu: **366 test / 33 file · e2e 14/14 · 18 route**.

---

## BẢN ĐỒ GIAI ĐOẠN — và vì sao theo thứ tự này

| GĐ | Tên | Rủi ro | Ngày | Bạn nhìn thấy gì khi xong |
| -- | --- | ------ | ---- | -------------------------- |
| **21** | 🔴 Khoá cửa lịch sử + hiện đủ thông tin khách | **CAO** | 1,0 | Mở trang chương trình thấy **họ tên đầy đủ + số điện thoại**; đăng nhập bằng tài khoản sale thì **không mở được** chương trình của cơ sở khác |
| **22** | 🔴 Âm thanh kêu trên iPhone và trên LCD | **CAO** | 0,75 | Cầm iPhone bấm chơi, **nghe tiếng tick** — kể cả khi máy đang gạt im lặng |
| **23** | Xoá / ẩn chương trình và cơ sở | vừa | 1,0 | Bấm **Xoá** một chương trình test → biến mất. Thử xoá cơ sở còn khách → bị chặn, kèm lý do bằng con số |
| **24** | Sửa số trúng thưởng + phần thưởng tại chỗ | vừa | 0,75 | Mở chương trình đang chạy, đổi `0114` → `0250`, bấm Lưu, mã QR cũ vẫn dùng được |
| **25** | Không gán cơ sở — phụ huynh tự chọn | thấp | 0,5 | Tạo chương trình chọn "Không gán cơ sở" → quét mã bằng điện thoại → thấy danh sách cơ sở xổ ra để chọn |
| **26** | Dấu `?` giải thích từng thông số | thấp | 0,5 | Bấm dấu `?` cạnh "Trần giải mỗi ngày" → hiện giải thích đặt số đó thì điều gì xảy ra |
| | **Tổng** | | **4,5** | |

### 🔴 Vì sao GĐ 21 và 22 phải đi TRƯỚC

**GĐ 21 là điều kiện của chính việc bạn yêu cầu.** Trang chi tiết chương trình hiện
**không lọc quyền** — `app/quan-tri/chuong-trinh/[ma]/page.tsx` không gọi
`nguoiDangDangNhap()` lần nào. Một sale của CS1 gõ đúng đường dẫn là đọc được lịch sử CS2.
Hôm nay chỉ lộ tên rút gọn nên thiệt hại nhỏ; **bạn vừa yêu cầu hiện họ tên đầy đủ và số
điện thoại lên đúng trang đó.** Làm ngược thứ tự là biến một chỗ hở nhẹ thành rò rỉ danh bạ.

**GĐ 22 có thể phải làm lại từ đầu.** Trên iPhone, công tắc gạt im lặng ở cạnh máy tắt sạch
Web Audio. Cách vòng qua nó là hành vi Apple **không cam kết** và đã đổi vài lần qua các bản
iOS. Nếu bản iOS của bạn không ăn, phương án còn lại là **bỏ Web Audio, đổi sang phát tệp
âm thanh thật** — đó là một ngày công khác hẳn. Thứ có thể lật ngược cả cách làm thì phải
biết sớm, không để đến cuối.

---

## KHÔNG LÀM ở v2.1 (cố ý) — và vì sao

- **Không đụng gì trong `VONG_QUAY_MAY_MAN/**`** — session khác đang giữ. Hai file
  `PLAN_VONG_QUAY.md` và `VONG_QUAY_MAY_MAN/OVERVIEW.md` đang có sửa đổi chưa commit của
  phiên đó; chạm vào là chắc chắn xung đột.
- **Không sửa `ADR-005`** — mâu thuẫn "một app nhiều game" ↔ "Vòng Quay đứng riêng" vẫn
  chờ bạn chốt. Ghi ở `CLAUDE.md` mục CẦN QUYẾT.
- **Không thêm thư viện nào.** Dấu `?` là component tự viết; bản vá âm thanh iOS dùng WAV
  im lặng nhúng thẳng dạng `data:` URI, không thêm tệp vào `public/`.
- **Không sửa được ván đã chơi.** Sửa chương trình chỉ đổi cấu hình từ lúc lưu trở đi; các
  ván cũ giữ nguyên kết quả đã chấm. Sửa lịch sử là phá sổ đối soát giải thưởng.
- **Không xoá khách tiềm năng theo chương trình hay theo cơ sở.** Muốn xoá dữ liệu một
  người thì dùng đúng công cụ đã có: `/quan-tri/khach` → "Xoá sạch dữ liệu của một số điện
  thoại" (`components/o-xoa-sdt.tsx`), nó có nhật ký và có luật NĐ 13/2023 đứng sau.
- **Không làm thùng rác khôi phục.** Mục "đã ẩn" hiện lại được bằng ô lọc là đủ; một thùng
  rác có hạn 30 ngày là thêm một trạng thái nữa để sai.
- **Không đụng `18.1b` (lên VPS) và `N.1`–`N.9`** — chặn ở NGƯỜI/NGOÀI, xem
  `PLAN_TRUNG_SO_V1.md`.

---

## ✅ GIAI ĐOẠN 21 — 🔴 Khoá cửa lịch sử + hiện đủ thông tin khách (XONG 01/09 · 0,6 ngày)

**🏁 BẠN NHÌN THẤY GÌ:** mở một chương trình bất kỳ → bảng "Lịch sử quay số" hiện **họ tên
đầy đủ** và **số điện thoại** (che sẵn `09****678`, bấm "Hiện đầy đủ" là ra). Rồi đăng nhập
bằng một tài khoản sale của cơ sở khác → **không thấy chương trình đó trong danh sách, và
gõ thẳng đường dẫn cũng ra trang "không tìm thấy"**.

### - [x] 21.1 — 🔴 Lọc quyền ở tầng SQL cho hai trang chương trình ✅ 01/09

- **(a) Làm gì:**
  `lib/chuong-trinh/kho.ts` — đổi chữ ký hai hàm, thêm mệnh đề WHERE theo phạm vi:
  ```ts
  export function danhSachChuongTrinh(pv: PhamVi): ChuongTrinhKemSoLieu[]
  export function timTheoMa(ma: string, pv: PhamVi): ChuongTrinh | null
  ```
  Mệnh đề dùng chung, viết MỘT lần trong file kho:
  ```ts
  /** `null` = mọi cơ sở. Chương trình chưa gán cơ sở (`co_so_id is null`) chỉ
   *  quản trị toàn hệ thống mới thấy — không có cơ sở nào để mà thuộc về. */
  function locPhamVi(pv: PhamVi): { menh: string; thamSo: number[] } {
    if (pv.coSoId === null) return { menh: "", thamSo: [] };
    return { menh: " and c.co_so_id = ?", thamSo: [pv.coSoId] };
  }
  ```
  `app/quan-tri/page.tsx` và `app/quan-tri/chuong-trinh/[ma]/page.tsx` — gọi
  `batBuocDangNhap()` (đã có ở `lib/bao-ve/phien-hien-tai.ts`) rồi truyền
  `phamViCua(nguoi)` xuống kho. `timTheoMa` trả `null` → `notFound()`.
  Sửa nốt mọi chỗ gọi khác: `app/actions/chuong-trinh.ts`, `app/actions/luot.ts`,
  `app/api/xuat/chuong-trinh/[ma]/route.ts`, `app/choi/[ma]/page.tsx`,
  `app/man-hinh/[ma]/page.tsx`.
  🔴 **Hai trang công khai `/choi/[ma]` và `/man-hinh/[ma]` KHÔNG có người đăng nhập** —
  chúng phải gọi bản không lọc. Tách rõ tên để không ai nhầm:
  `timTheoMaCongKhai(ma)` cho hai trang đó, `timTheoMa(ma, pv)` cho khu quản trị.
- **(b) Bạn kiểm chứng bằng cách nào:** vào `/quan-tri/nhan-vien` tạo một nhân viên vai trò
  **"Chăm sóc khách"** gán cơ sở **CS2**, cấp tên đăng nhập + mật khẩu. Đăng xuất, đăng nhập
  bằng tài khoản đó. → Danh sách chương trình **chỉ còn** chương trình của CS2. Gõ tay
  đường dẫn `/quan-tri/chuong-trinh/L7WH` (chương trình của CS1) → ra trang **không tìm
  thấy**, không phải trang dữ liệu.
- **(c) Test tự động:** `tests/quyen-chuong-trinh.test.ts` — dựng 2 cơ sở, 2 chương trình,
  3 người dùng (`quan_tri`, `quan_ly_co_so` CS1, `sale` CS2):
  quản trị thấy cả 2 · quản lý CS1 thấy 1 · sale CS2 thấy 1 và **`timTheoMa` của chương
  trình CS1 trả `null`** · chương trình `co_so_id = null` chỉ quản trị thấy.
- **(d) Ước lượng:** 0,5 ngày. **Thực tế: 0,3 ngày.**
- **(f) phụ-thuộc:** không.

**✅ Bằng chứng (01/09):** 9 ca test mới, đỏ 7 trước khi sửa · **375 test / 34 file** ·
tsc + lint xanh · build 18 route · **e2e 14/14** không hỏng kịch bản nào.

**Lộ thêm một lỗ hổng thứ hai khi làm:** `app/api/xuat/chuong-trinh/[ma]/route.ts` và
`kho-qua/[ma]/route.ts` **có** gọi `nguoiDangDangNhap()` nhưng chỉ để ghi tên vào nhật ký —
không lọc quyền. Sale của CS1 tải được **file Excel lịch sử của CS2**. Đã vá cùng lúc.

**Quyết định khi làm:** tách tên thành hai hàm `timTheoMa(ma, pv)` và `timTheoMaCongKhai(ma)`
thay vì một hàm với tham số tuỳ chọn. Một tên chung thì sớm muộn có người gọi thiếu tham số
ở khu quản trị, và **không gì báo lỗi cả** — đúng kiểu bẫy đã trả giá với `proxy.ts`.

**Các bước:**

- [x] `npm run sao-luu`
- [x] Viết `tests/quyen-chuong-trinh.test.ts` — chạy, **ĐỎ 7/9**
- [x] Sửa `lib/chuong-trinh/kho.ts`: `locPhamVi`, `timTheoMa(ma, pv)`, `timTheoMaCongKhai`
- [x] Sửa 2 trang quản trị + 2 route xuất + 4 đường công khai + 2 file test
- [x] Test **XANH** · e2e **14/14**
- [x] Commit

### - [x] 21.2 — Hiện họ tên đầy đủ + số điện thoại trong lịch sử ✅ 01/09

- **(a) Làm gì:** `lib/luot/kho-luot.ts` **đã trả sẵn** `soDienThoai`, `dongYTuVan`,
  `quanTamHocThu` — không phải đụng SQL, chỉ là trang không vẽ ra.
  Trong `app/quan-tri/chuong-trinh/[ma]/page.tsx`: **xoá hàm `tenRutGon` cục bộ** (dòng
  42–47), hiện `l.hoTen` đầy đủ. Thêm **cột SĐT** và **cột "Đồng ý tư vấn"**.
  Tách phần bảng ra `components/bang-lich-su.tsx` (`"use client"`) để có công tắc che/hiện —
  chép nguyên mẫu đã chạy ở `components/bang-lead.tsx:142` và `:292`:
  ```tsx
  const [hienDu, setHienDu] = useState(false);
  // ...
  <td className="px-5 py-3 font-mono text-muc">
    {l.soDienThoai === null ? "—" : hienDu ? l.soDienThoai : cheSdt(l.soDienThoai)}
  </td>
  ```
  Ghi nhật ký khi trang mở: `ghiNhatKy({ nhanVienId: nguoi.id, hanhDong: HANH_DONG.xemLead,
  doiTuong: \`chuong-trinh:${ct.ma}\`, soDong: cacLuot.length })`.
  Chuỗi mới vào `config/locale.ts`: `colPhone` · `colConsent` (dùng lại `T.leadShowFull` /
  `T.leadHideFull` / `T.leadMaskNote` đã có).
- **(b) Bạn kiểm chứng bằng cách nào:** mở `/quan-tri/chuong-trinh/L7WH` → cột NGƯỜI CHƠI
  hiện **"Dương Thị Hoa"** thay vì "Dương t.", cạnh đó là cột SĐT hiện `09****678`. Bấm
  **"Hiện đầy đủ"** → ra số trọn vẹn. Sang `/quan-tri/nhat-ky` → thấy một dòng mới **"Xem
  danh sách khách"** ghi đúng mã chương trình và số dòng vừa xem.
- **(c) Test tự động:** `tests/bang-lich-su.test.ts` — `cheSdt("0912345678")` ra
  `"09*****678"` · dòng không có người chơi (ván ẩn danh) hiện `—` chứ không vỡ ·
  `tests/nhat-ky.test.ts` thêm ca: mở trang chi tiết ghi đúng một dòng `xem_lead`.
  Kịch bản e2e mới `tests/e2e/gd21-lich-su-day-du.mjs`: đăng nhập → mở chương trình → thấy
  chuỗi che `**` → bấm "Hiện đầy đủ" → thấy số đủ 10 chữ số.
- **(d) Ước lượng:** 0,5 ngày. **Thực tế: 0,3 ngày.**
- **(f) phụ-thuộc:** 21.1.

**✅ Bằng chứng (01/09):** **383 test / 35 file** · **e2e 15/15**, kịch bản mới
`gd21-lich-su-day-du` chạy 13 bước đều đạt · build 18 route · tsc + lint xanh.

**KHÔNG thêm khoá locale nào** như kế hoạch dự tính: `T.leadPhone` ("Số điện thoại") và
`T.leadConsent` ("Đồng ý tư vấn") đã có sẵn từ GĐ 16. Đẻ thêm `colPhone`/`colConsent` là
tạo hai cách gọi cho cùng một khái niệm — đúng thứ `ngon-ngu-ui.md` cấm.

**Tách hàm thuần `lib/luot/hien-thi.ts`** thay vì để logic hiển thị nằm trong component:
`nhanNguoiChoi` · `nhanSdt` · `nhanDongY`. Hàm `tenRutGon` cũ nằm ngay trong `page.tsx`,
không ai test và không ai nhớ nó tồn tại — nên suốt nhiều tháng nhân viên nhìn "Dương t."
mà không hiểu vì sao mình không đọc được tên khách của chính mình.

**Các bước:**

- [x] Viết `tests/hien-thi-lich-su.test.ts` (8 ca)
- [x] Dùng lại khoá locale sẵn có, không thêm khoá mới
- [x] Tạo `components/bang-lich-su.tsx`, chuyển bảng sang đó, **bỏ `tenRutGon`**
- [x] Thêm `ghiNhatKy(xemLead)` vào `page.tsx`
- [x] Test **XANH** · nền e2e mới `nen/lich-su-day-du.mjs` · **15/15 kịch bản**
- [x] Commit

---

## 🟡 GIAI ĐOẠN 22 — 🔴 Âm thanh kêu trên iPhone và trên LCD (code XONG 01/09 · 🛑 chờ iPhone thật)

**🏁 BẠN NHÌN THẤY GÌ:** cầm iPhone quét mã, bấm BẮT ĐẦU → **nghe tiếng tick tăng dần**,
bấm DỪNG → nghe tiếng thắng hoặc thua. Làm lại với **công tắc gạt im lặng ở cạnh máy bật
lên** → vẫn nghe. Trên LCD, nút "Bật tiếng" ở màn chờ **nổi bật** chứ không chìm nghỉm.

> **Ba lỗi khác nhau, đừng gộp làm một.** LCD câm vì **thiết kế** (mặc định tắt, nút chỉ ở
> màn chờ). Điện thoại câm vì **thiếu hẳn cái nút**. iPhone câm vì **hệ điều hành**.

### - [~] 22.1 — 🔴 Đánh thức âm thanh trên iOS · CODE XONG 01/09 · 🛑 CHỜ IPHONE THẬT

- **(a) Làm gì:** `lib/am-thanh.ts` — hai sửa đổi trong `ensureStarted()`:
  1. **Luôn `resume()` ngay sau khi tạo context**, không chỉ khi đã có sẵn. Context mới đôi
     khi sinh ra ở trạng thái `suspended` và code hiện tại bỏ qua ca đó.
  2. **Phát một tệp WAV im lặng qua thẻ `<audio>`** ngay trong cùng cú chạm. Đây là thứ đẩy
     phiên âm thanh của iOS từ "ambient" (bị công tắc gạt tắt) sang "playback" (không bị):
  ```ts
  /** 44 byte: một tệp WAV hợp lệ, 0 khung âm thanh. Nhúng thẳng, không thêm tệp vào public/. */
  const WAV_IM_LANG =
    "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAgD4AAAB9AAACABAAZGF0YQAAAAA=";

  private moKhoaIos(): void {
    if (this.daMoKhoa) return;
    this.daMoKhoa = true;
    try {
      const the = new Audio(WAV_IM_LANG);
      the.setAttribute("playsinline", "");   // iOS không được mở trình phát toàn màn hình
      the.volume = 0.01;
      void the.play().catch(() => {});       // Bị chặn thì thôi — không được ném ra ngoài
    } catch {
      // Máy không cho tạo Audio thì bỏ qua; Web Audio vẫn chạy ở chế độ thường.
    }
  }
  ```
  Gọi `moKhoaIos()` ở đầu `ensureStarted()`, **trước** `new AudioContext()`.
  ⚠️ Chép nguyên chuỗi base64 trên — đừng tự sinh lại, một byte sai là tệp hỏng và iOS bỏ qua.
- **(b) Bạn kiểm chứng bằng cách nào:** đây là hạng mục **máy không tự nghiệm thu được**.
  Cầm **đúng chiếc iPhone sẽ dùng ở quầy**: mở `/choi/<mã>`, nhập tên + SĐT, bấm BẮT ĐẦU.
  Lần 1 — công tắc gạt ở nấc **có chuông**: phải nghe tiếng tick. Lần 2 — gạt sang nấc **im
  lặng**, tải lại trang, chơi lại: **vẫn phải nghe**. Nếu lần 2 câm, dừng lại và báo tôi —
  phải chuyển sang phương án tệp âm thanh thật, đó là một ngày công khác.
- **(c) Test tự động:** `tests/am-thanh.test.ts` — `ensureStarted()` gọi `resume()` khi
  context ở trạng thái `suspended` (giả lập `AudioContext` và `Audio` bằng `vi.stubGlobal`)
  · gọi `Audio` **đúng một lần** dù `ensureStarted()` chạy nhiều lần · `Audio.play()` ném
  lỗi thì `ensureStarted()` **không** ném ra ngoài.
  🔴 **Test không chứng minh được tiếng có kêu trên iPhone thật** — nó chỉ canh phần logic.
  Bước (b) mới là bài kiểm thật.
- **(d) Ước lượng:** 0,25 ngày. **Thực tế: 0,2 ngày.**
- **(e) chặn:** 🛑 **NGƯỜI** — code xong, chờ bạn cầm iPhone bấm thử.
- **(f) phụ-thuộc:** không.

**✅ Đã làm (01/09):** 7 ca test mới, **đỏ 3/7** trước khi sửa. Hai lỗi được vá:
· `AudioContext` VỪA TẠO cũng có thể ở trạng thái `suspended` — bản cũ chỉ `resume()` cho
context đã có sẵn, nên bỏ qua đúng lần đầu tiên, mà lần đầu tiên chính là cú bấm BẮT ĐẦU.
· Thêm `moKhoaIos()`: phát một thẻ `<audio>` WAV im lặng trong cùng cú chạm, đẩy phiên âm
thanh iOS từ "ambient" sang "playback".

**Đã kiểm tệp WAV nhúng là hợp lệ thật**, không phải chuỗi bịa: giải base64 ra **44 byte**,
`RIFF`/`WAVE`/`fmt `/`data` đúng chỗ, 1 kênh · 16000 Hz · 16 bit, khối `data` **0 byte**.

**🛑 CÒN CHỜ BẠN — bài kiểm quyết định:** cầm **đúng chiếc iPhone sẽ dùng ở quầy**, mở
`/choi/<mã>`, bấm BẮT ĐẦU. Lần 1 ở nấc **có chuông** phải nghe tiếng tick. Lần 2 gạt sang
nấc **im lặng**, tải lại trang, chơi lại — **vẫn phải nghe**. Lần 2 câm thì báo tôi: phải
bỏ Web Audio, đổi sang phát tệp âm thanh thật (một ngày công khác hẳn).

**Các bước:**

- [x] Viết `tests/am-thanh.test.ts` với `vi.stubGlobal` — **ĐỎ 3/7**
- [x] Sửa `lib/am-thanh.ts`: `WAV_IM_LANG`, `daMoKhoa`, `moKhoaIos()`, `resume()` sau khi tạo
- [x] Test **XANH 7/7** · giải mã kiểm tệp WAV hợp lệ
- [x] Commit
- [ ] 🛑 **Bạn thử trên iPhone thật, cả hai nấc công tắc gạt**

### - [x] 22.2 — Công tắc tiếng cho điện thoại + làm nút trên LCD nổi bật ✅ 01/09

- **(a) Làm gì:** `components/man-dien-thoai.tsx` hiện **không hề đọc** `lib/tieng-nho.ts`.
  Thêm `useTatTieng()` + `luuTatTieng()` đúng cơ chế đã chạy ở `man-hinh.tsx:80`, và một nút
  loa nhỏ ở góc trên màn chơi (dùng lại `T.tiengBat` / `T.tiengTat`).
  🔴 **Mặc định trên điện thoại phải là BẬT**, ngược với LCD. Lý do khác nhau: LCD treo giữa
  sảnh nên hướng lệch an toàn là im lặng; điện thoại nằm trong tay đúng người đang chơi, và
  họ cầm nó lên là để chơi. Thêm tham số cho `useTatTieng(macDinhTat: boolean)`.
  `components/man-hinh.tsx:372` — nút "Bật tiếng" đổi sang viền cam + chữ to; khi đang tắt
  thì dải nhắc `T.tiengNhac` hiện ở **mọi màn**, không chỉ màn chờ.
- **(b) Bạn kiểm chứng bằng cách nào:** trên điện thoại, vào màn chơi → thấy **nút loa ở góc
  trên**. Bấm tắt → chơi một ván, im. Bấm bật → chơi lại, có tiếng. Tải lại trang → nút
  **nhớ đúng** trạng thái vừa chọn. Trên LCD: mở màn hình, nút "Bật tiếng" **đập vào mắt
  ngay**; chưa bấm thì dòng nhắc "Bấm một lần đầu ca làm" nhìn thấy được cả khi đang chơi.
- **(c) Test tự động:** `tests/tieng-nho.test.ts` — `useTatTieng(false)` trả `false` khi
  `localStorage` rỗng, `useTatTieng(true)` trả `true` · `luuTatTieng` ghi rồi đọc lại ra
  đúng giá trị · `localStorage` ném lỗi (chế độ riêng tư Safari) thì trả giá trị mặc định
  chứ không vỡ. Kịch bản e2e `gd22-am-thanh.mjs`: nút `[data-nut-tieng]` có mặt trên **cả
  hai** màn hình và đổi thuộc tính sau khi bấm.
- **(d) Ước lượng:** 0,5 ngày. **Thực tế: 0,3 ngày.**
- **(f) phụ-thuộc:** 22.1.

**✅ Bằng chứng (01/09):** 7 ca test `tieng-nho` · **397 test / 37 file** · e2e **15/15**,
kịch bản `gd14-am-thanh` nay 17 bước (thêm 6 bước mới) · build 18 route · tsc + lint xanh.

**Khác kế hoạch một điểm, có chủ ý:** kế hoạch định thêm kịch bản e2e `gd22-am-thanh.mjs`
riêng. Nhưng `gd14-am-thanh` đã kiểm LCD rất kỹ (10 bước), nên **mở rộng nó** thay vì đẻ
kịch bản thứ hai trùng nửa nội dung — hai bài kiểm cùng một thứ là hai bài chỉ lệch nhau
vào đúng ngày ai đó sửa một bài.

**Các bước:**

- [x] Viết `tests/tieng-nho.test.ts` (7 ca)
- [x] `lib/tieng-nho.ts`: tham số `macDinhTat` — LCD `true`, điện thoại `false`
- [x] `components/man-dien-thoai.tsx`: nút loa 🔊/🔇 ở header, vùng chạm 40px, xa nút DỪNG
- [x] `components/man-hinh.tsx`: nút viền cam khi đang tắt · dải nhắc hiện ở **mọi màn**
- [x] Test **XANH** · e2e **15/15**
- [x] Commit

---

## ✅ GIAI ĐOẠN 23 — Xoá / ẩn chương trình và cơ sở (XONG 01/09 · 0,6 ngày)

**✅ Bằng chứng:** 9 ca test `xoa-chuong-trinh` + 8 ca `xoa-co-so` (đỏ hết trước khi sửa) ·
**414 test / 39 file** · e2e **15/15** · build 18 route · tsc + lint xanh.

**Ca test đắt nhất, và nó xanh:** tạo lead gắn chương trình → xoá chương trình → **lead còn
nguyên**, chỉ mất đường trỏ về. Và: tạo lead + nhân viên ở một cơ sở → ẩn cơ sở → **không
mất một dòng nào**.

**`tests/locale.test.ts` đã bắt được rác ngay trong lượt này:** hai khoá `donXongXoaCt` và
`donXongAnCt` viết ra cho một màn báo "đã xong" mà server action không dùng tới (nó
`redirect` thẳng về danh sách — danh sách vắng một dòng đã là câu trả lời). Cổng viết ở
`N.10` vừa trả công lần đầu.

**🏁 BẠN NHÌN THẤY GÌ:** trong danh sách chương trình, mỗi dòng có nút **Xoá** màu đỏ. Bấm
vào một chương trình chưa ai chơi → hỏi xác nhận → **biến mất**. Bấm vào chương trình đã có
người trúng → hộp thoại đổi giọng: *"Chương trình này đã có 14 ván và 2 giải đã trao. Không
xoá được, sẽ ẩn khỏi danh sách."* Bên mục Cơ sở cũng vậy, chặt hơn.

> 🔴 **Điều quan trọng nhất của cả giai đoạn này**, đo trên lược đồ thật:
> `khach_tiem_nang.co_so_id` và `nhan_vien.co_so_id` đều là `ON DELETE CASCADE`. **Xoá một
> cơ sở bằng `DELETE` là cuốn theo toàn bộ khách tiềm năng và nhân viên của nó — im lặng,
> không hỏi.** Đúng thứ bạn dặn phải giữ.
> Chương trình thì ngược lại: `khach_tiem_nang.chuong_trinh_id_dau` là `ON DELETE SET NULL`
> ⇒ xoá chương trình **không** đụng tới lead. Lược đồ đã bảo vệ sẵn phía đó.

### - [x] 23.1 — Xoá / ẩn chương trình ✅ 01/09

- **(a) Làm gì:** thêm `'da_an'` vào `TrangThaiChuongTrinh` ở `lib/chuong-trinh/kho.ts`
  (`"dang_chay" | "ket_thuc" | "da_an"`). Cột `trang_thai` đã có sẵn — **không cần
  `ALTER TABLE`**. Ba hàm mới trong cùng file kho:
  ```ts
  export interface RangBuocChuongTrinh { soVan: number; soGiaiDaTrao: number; }

  /** Đếm thứ sẽ mất nếu xoá — để hộp xác nhận nói bằng con số, không bằng lời doạ. */
  export function demRangBuoc(id: number): RangBuocChuongTrinh

  /** Xoá hẳn. CHỈ gọi khi soVan === 0. Cascade dọn qua_tang; lead giữ nguyên (SET NULL). */
  export function xoaChuongTrinh(id: number): boolean

  /** Ẩn khỏi mọi danh sách, giữ trọn dữ liệu. Dọn cả 4 ô giữ chỗ như doiTrangThai. */
  export function anChuongTrinh(id: number): boolean
  ```
  `danhSachChuongTrinh(pv, hienCaDaAn = false)` — mặc định loại `da_an`.
  Server action `xoaHoacAnChuongTrinh(ma)` trong `app/actions/chuong-trinh.ts`: tự chọn xoá
  hay ẩn theo `demRangBuoc`, **không tin tham số client gửi lên**. Ghi nhật ký hành động mới
  `HANH_DONG.xoaChuongTrinh` / `anChuongTrinh` (thêm vào `lib/nhat-ky/kho.ts`).
  Component `components/nut-xoa-chuong-trinh.tsx` — chép mẫu nút đỏ + `window.confirm` từ
  `components/o-xoa-sdt.tsx`. Ô lọc "Hiện cả mục đã ẩn" trên `/quan-tri`.
- **(b) Bạn kiểm chứng bằng cách nào:** tạo một chương trình mới, **không chơi ván nào** →
  bấm **Xoá** → xác nhận → nó biến mất khỏi danh sách. Mở `/quan-tri/nhat-ky` → có dòng
  "Xoá chương trình". Rồi bấm Xoá trên chương trình `L7WH` (đã có lịch sử) → hộp thoại nói
  đúng **số ván và số giải đã trao**, và sau khi xác nhận nó **chỉ ẩn**. Tích ô "Hiện cả
  mục đã ẩn" → nó hiện lại. Cuối cùng vào `/quan-tri/khach` → **danh sách khách còn nguyên**.
- **(c) Test tự động:** `tests/xoa-chuong-trinh.test.ts` —
  chương trình 0 ván: `xoaChuongTrinh` trả `true`, `timTheoMa` trả `null`, `qua_tang` của nó
  bị dọn · chương trình có ván: `demRangBuoc` đếm đúng, sau `anChuongTrinh` thì
  `danhSachChuongTrinh` không có nó nhưng `danhSachChuongTrinh(pv, true)` thì có ·
  🔴 **ca quan trọng nhất:** tạo lead gắn `chuong_trinh_id_dau`, xoá chương trình,
  **lead vẫn còn và `chuong_trinh_id_dau` thành `null`**.
- **(d) Ước lượng:** 0,5 ngày.
- **(e) chặn:** MÁY.
- **(f) phụ-thuộc:** 21.1.

**Các bước:**

- [ ] `npm run sao-luu`
- [ ] Viết `tests/xoa-chuong-trinh.test.ts` (đủ 3 nhóm ca trên) — **ĐỎ**
- [ ] `lib/chuong-trinh/kho.ts`: `'da_an'`, `demRangBuoc`, `xoaChuongTrinh`, `anChuongTrinh`
- [ ] `lib/nhat-ky/kho.ts`: thêm 2 hành động; `app/actions/chuong-trinh.ts`: server action
- [ ] `components/nut-xoa-chuong-trinh.tsx` + ô lọc "Hiện cả mục đã ẩn" + chuỗi locale
- [ ] Test **XANH** · e2e còn nguyên
- [ ] Commit `feat(chuong-trinh): xoa khi sach, an khi da co van`

### - [x] 23.2 — Xoá / ẩn cơ sở (ngưỡng chặt hơn) ✅ 01/09

- **(a) Làm gì:** thêm `"da_an"` vào `TRANG_THAI_CO_SO` ở `config/to-chuc.ts`
  (`["bat", "tat", "da_an"]`). Trong `lib/co-so/kho.ts`:
  ```ts
  export interface RangBuocCoSo {
    soLead: number; soNhanVien: number; soChuongTrinh: number; soVan: number;
  }
  export function demRangBuocCoSo(id: number): RangBuocCoSo
  /** CHỈ gọi khi cả bốn con số bằng 0. */
  export function xoaCoSo(id: number): boolean
  export function anCoSo(id: number): boolean
  ```
  `danhSachCoSo(hienCaDaAn = false)` loại `da_an`; `coSoDangBat()` giữ nguyên (nó vốn chỉ
  lấy `'bat'`).
  Server action `xoaHoacAnCoSo(id)` trong `app/actions/co-so.ts` — chỉ `quan_tri` được gọi
  (`suaDuocCoSo(nguoi)` đã có ở `lib/bao-ve/quyen.ts`).
  Hộp xác nhận nói đúng thứ đang vướng, ví dụ: *"Cơ sở này có 12 khách tiềm năng và 2 nhân
  viên — không xoá được, sẽ ẩn khỏi danh sách. Khách và nhân viên giữ nguyên."*
  Bảng cơ sở phân biệt **ba** trạng thái: Đang hoạt động · Đã tắt · **Đã ẩn**.
- **(b) Bạn kiểm chứng bằng cách nào:** thêm một cơ sở mới **chưa dùng vào đâu** → bấm Xoá →
  biến mất hẳn. Bấm Xoá trên **CS1** (đang có khách) → hộp thoại nói đúng số khách và số
  nhân viên, chọn OK → nó **chỉ ẩn**. Vào `/quan-tri/khach` → **khách của CS1 còn nguyên**.
  Vào `/quan-tri/nhan-vien` → **nhân viên còn nguyên**. Tích "Hiện cả mục đã ẩn" ở mục Cơ sở
  → CS1 hiện lại.
- **(c) Test tự động:** `tests/xoa-co-so.test.ts` — cơ sở trắng thì xoá được · cơ sở có lead
  thì `demRangBuocCoSo().soLead > 0` và `anCoSo` được gọi thay vì xoá ·
  🔴 **ca sống còn:** sau `anCoSo`, đếm `khach_tiem_nang` và `nhan_vien` của cơ sở đó
  **không đổi một dòng nào** · `coSoDangBat()` không trả cơ sở `da_an` (nên nó không hiện ra
  ở form tạo chương trình lẫn ô chọn của phụ huynh).
- **(d) Ước lượng:** 0,5 ngày.
- **(e) chặn:** MÁY.
- **(f) phụ-thuộc:** 23.1 (dùng lại đúng khuôn nút và hộp xác nhận).

**Các bước:**

- [ ] Viết `tests/xoa-co-so.test.ts` — **ĐỎ**
- [ ] `config/to-chuc.ts` + `lib/co-so/kho.ts`: ba hàm mới
- [ ] `app/actions/co-so.ts`: server action có kiểm `suaDuocCoSo`
- [ ] `components/bang-co-so.tsx`: nút Xoá, nhãn ba trạng thái, ô lọc
- [ ] Test **XANH**
- [ ] Commit `feat(co-so): xoa khi trang, an khi con lead hoac nhan vien`

---

## ✅ GIAI ĐOẠN 24 — Sửa số trúng thưởng + phần thưởng tại chỗ (XONG 01/09 · 0,4 ngày)

**✅ Bằng chứng:** 12 ca test `sua-chuong-trinh` · **426 test / 40 file** · e2e **16/16**
(kịch bản mới `gd24` 10 bước) · build 18 route · tsc + lint xanh.

**Hai cạm bẫy vấp phải khi viết kịch bản e2e, ghi lại kẻo lặp:**

1. 🔴 **Chạy `npm run e2e` hai lần trong CÙNG một lệnh shell** làm lượt sau đụng cổng của
   lượt trước — báo hỏng `gd13`, `gd14`, `gd16` trong khi mã hoàn toàn đúng. Đây đúng là
   cạm bẫy "máy chủ cũ giữ cổng và TRẢ LỜI" đã ghi ở `app/CLAUDE.md`, chỉ khác hình dạng.
   Chạy một lượt, đọc kết quả, rồi mới chạy lượt sau.

2. **Đổi CON SỐ trúng thưởng KHÔNG làm đổi tỉ lệ** — bài kiểm đầu tiên tôi viết sai vì tưởng
   có. Tỉ lệ = (giới hạn lượt − thời gian khoá nút) ÷ (10000 × 0,08), con số triệt tiêu khỏi
   phép tính; đúng như cạm bẫy đã ghi từ v1. Muốn thấy bảng tỉ lệ đổi thì phải đổi ĐỘ KHÓ.

**🏁 BẠN NHÌN THẤY GÌ:** mở chương trình đang chạy, bấm **"Sửa thiết lập"** → form mở ra
ngay tại chỗ với bảng tỉ lệ và dự báo tiền quà **đổi theo từng con số bạn gõ**. Đổi
`0114` → `0250`, bấm Lưu. Mã QR đã in **vẫn dùng được** (mã phòng không đổi), và người chơi
tiếp theo phải bắt số mới.

### - [x] 24.1 — Sửa thiết lập chương trình ✅ 01/09

- **(a) Làm gì:** `lib/chuong-trinh/kho.ts`:
  ```ts
  export interface SuaChuongTrinh {
    soTrung: number; mucDo: DifficultyId; tenGiaiThuong: string;
    tranGiaiMoiNgay: number; soLanChoi: number;
  }
  /** KHÔNG đổi `ma`, `co_so_id`, `che_do` — đổi chúng là một chương trình khác. */
  export function suaChuongTrinh(id: number, d: SuaChuongTrinh): boolean
  ```
  🔴 **Tách bộ kiểm hợp lệ ra dùng chung**, đừng viết luật thứ hai: rút phần validate hiện
  nằm trong `taoChuongTrinhForm` (`app/actions/chuong-trinh.ts:49–72`) thành
  `lib/chuong-trinh/kiem-hop-le.ts` → `kiemThietLap(d): string | null`, rồi **cả hai** action
  tạo và sửa cùng gọi nó. Hai bộ luật lệch nhau là chuyện chỉ chờ ngày xảy ra.
  Component `components/form-sua-chuong-trinh.tsx` — tái dùng khối bảng tỉ lệ + dự báo của
  `components/form-tao.tsx:154–214` (rút thành `components/bang-ti-le.tsx` cho cả hai dùng).
  Server action `suaChuongTrinhForm` ghi nhật ký `HANH_DONG.suaChuongTrinh` kèm số ván
  đang có — để sau này còn tra được "ai đổi số, lúc nào, khi đã có bao nhiêu ván".
- **(b) Bạn kiểm chứng bằng cách nào:** mở `/quan-tri/chuong-trinh/L7WH` → bấm **"Sửa thiết
  lập"** → gõ `0250` vào ô số trúng → **bảng tỉ lệ và dòng "khoảng N giải mỗi ngày" đổi
  ngay khi đang gõ**. Bấm Lưu → hộp xác nhận nói: *"Chương trình này đã có 14 ván. Các ván
  đó được chấm theo số cũ 0114."* → OK. Trang tải lại, khối in mã QR hiện **SỐ TRÚNG THƯỞNG:
  0250**, mã phòng vẫn là `L7WH`. Quét lại mã QR **đã in từ trước** → vẫn vào được, và giờ
  phải bắt `0250`.
- **(c) Test tự động:** `tests/sua-chuong-trinh.test.ts` — sửa xong `timTheoMa` trả giá trị
  mới · `ma` và `co_so_id` **không đổi** · các ván cũ giữ nguyên `so_da_dung`, `trung`,
  `khoang_lech` · `kiemThietLap` từ chối số 5 chữ số, trần âm, số lần bấm ngoài
  `SO_LAN_CHOI.toiThieu..toiDa` · gọi `suaChuongTrinh` với id không tồn tại trả `false`.
  Kịch bản e2e `gd24-sua-chuong-trinh.mjs`: sửa số → tải lại → khối QR hiện số mới.
- **(d) Ước lượng:** 0,75 ngày.
- **(e) chặn:** MÁY.
- **(f) phụ-thuộc:** 21.1.

**Các bước:**

- [ ] `npm run sao-luu`
- [ ] Rút `kiemThietLap` ra `lib/chuong-trinh/kiem-hop-le.ts`, sửa `taoChuongTrinhForm` gọi
      nó — chạy `npm test`, **phải còn xanh** (đây là refactor thuần, chưa thêm gì)
- [ ] Commit `refactor(chuong-trinh): tach bo kiem hop le dung chung`
- [ ] Viết `tests/sua-chuong-trinh.test.ts` — **ĐỎ**
- [ ] `suaChuongTrinh` trong kho + server action + nhật ký
- [ ] Rút `components/bang-ti-le.tsx`, dựng `components/form-sua-chuong-trinh.tsx`
- [ ] Test **XANH** · e2e 16 → 17 kịch bản
- [ ] Commit `feat(chuong-trinh): sua so trung va phan thuong tai cho`

---

## ✅ GIAI ĐOẠN 25 — Không gán cơ sở, phụ huynh tự chọn (XONG 01/09 · 0,3 ngày)

**✅ Bằng chứng:** 5 ca test mới · **431 test / 40 file** · e2e **17/17** (kịch bản `gd25`
chạy TRỌN vòng đời: nhân viên tạo → phụ huynh quét mã → chọn cơ sở → lead về đúng cơ sở đó)
· build 18 route.

**Nhẹ hơn dự tính, và lý do đáng ghi:** `app/choi/[ma]/page.tsx` đã dựa vào `nguonCoSo`
chứ **chưa bao giờ** dựa vào chế độ chơi. Toàn bộ phía điện thoại không phải sửa một dòng —
thứ khoá nó lại chỉ là hai chỗ ở phía nhân viên: ô `nguonCoSo` bị `cheDo === "online"` che,
và một dòng trong action ép `"gan_san"`.

**Bốn bài test cũ phải cập nhật vì chúng canh đúng hành vi ta cố ý đảo** (2 ca đơn vị + 2
bước trong `gd11-co-so`). Không xoá bài nào — sửa kèm ghi rõ luật cũ là gì, vì sao đảo.
Riêng ca "từ chối khi không khai cơ sở" đổi thành "từ chối id KHÔNG TỒN TẠI": bỏ trống có
chủ ý và gõ nhầm một id là hai chuyện khác hẳn, và cái sau vẫn phải bị chặn.

**Một bẫy khi viết e2e:** màn Khách tiềm năng mặc định **chỉ hiện người đã đồng ý nhận tư
vấn** (`chiDongY` bật sẵn). Kịch bản quên tick ô đó thì lead có sinh cũng không nhìn thấy,
và báo hỏng như thể tính năng gãy. Mất một lượt chạy mới tìm ra.

**🏁 BẠN NHÌN THẤY GÌ:** ở màn tạo chương trình, ô "Cơ sở tổ chức" có thêm mục **"— Không
gán cơ sở —"**, kèm dòng giải thích ngay dưới. Chọn nó, tạo chương trình, quét mã bằng điện
thoại → sau ô Họ tên và Số điện thoại có thêm ô **"Bạn đang ở gần cơ sở nào?"** với danh
sách xổ ra đúng những cơ sở bạn đã khai.

> ✅ **Phần khó đã làm xong từ GĐ 17.** Ô chọn cơ sở trên điện thoại, danh sách xổ ra, ràng
> buộc bắt buộc chọn — tất cả nằm sẵn ở `components/man-dien-thoai.tsx:481`. Giai đoạn này
> chỉ **mở khoá** nó khỏi chế độ online, không xây mới.

### - [x] 25.1 — Mở khoá "phụ huynh tự chọn cơ sở" cho cả hai chế độ ✅ 01/09

- **(a) Làm gì:**
  `components/form-tao.tsx` — ô `coSoId` thêm `<option value="">— Không gán cơ sở —</option>`
  (bỏ `required`), kèm dòng giải thích khi nó được chọn:
  *"Phụ huynh sẽ tự chọn cơ sở ở bước nhập họ tên và số điện thoại. Danh sách lấy từ mục Cơ
  sở."* Ô "Cơ sở của người chơi" bỏ điều kiện `cheDo === "online"` ở dòng 99 — hiện cho cả
  hai chế độ.
  `app/actions/chuong-trinh.ts` — bỏ dòng ép `nguonCoSo: cheDo === "tai_quay" ? "gan_san"`;
  cho `coSoId` rỗng ⇒ `coSoId: null`, `tenTrungTam: T.chuaGanCoSo` ("Chưa gán cơ sở"), và
  khi đó **buộc** `nguonCoSo = "phu_huynh_chon"` — không gán cơ sở mà lại bảo "gán sẵn" thì
  chẳng có cơ sở nào để gán.
  `components/man-dien-thoai.tsx:481` — đổi điều kiện hiện ô chọn từ *chế độ online* sang
  `nguonCoSo === "phu_huynh_chon"`. Truyền `nguonCoSo` xuống component (hiện chỉ truyền
  `cheDo`).
- **(b) Bạn kiểm chứng bằng cách nào:** `/quan-tri/tao` → ô Cơ sở tổ chức chọn **"— Không
  gán cơ sở —"** → thấy dòng giải thích hiện ra → chọn chế độ **Tại quầy** → Tạo. Trang chi
  tiết hiện tiêu đề **"Chưa gán cơ sở"**. Quét mã bằng điện thoại → nhập họ tên, SĐT → **có
  ô "Bạn đang ở gần cơ sở nào?"**, xổ ra đúng danh sách cơ sở đang bật. Chọn CS2, chơi một
  ván. Vào `/quan-tri/khach` → khách đó nằm dưới **CS2**.
- **(c) Test tự động:** `tests/che-do-choi.test.ts` (đã có) thêm ca: tạo chương trình không
  cơ sở ⇒ `coSoId === null` và `nguonCoSo === "phu_huynh_chon"` · tạo có cơ sở + chọn "để
  phụ huynh chọn" ở chế độ `tai_quay` ⇒ giữ nguyên `phu_huynh_chon` (không còn bị ép về
  `gan_san`) · `tests/lead.test.ts` thêm ca: ván của chương trình không cơ sở, phụ huynh
  chọn CS2 ⇒ lead sinh ra ở CS2. Kịch bản e2e `gd25-khong-gan-co-so.mjs` chạy trọn luồng.
- **(d) Ước lượng:** 0,5 ngày.
- **(e) chặn:** MÁY.
- **(f) phụ-thuộc:** 21.1 (chương trình `co_so_id = null` chỉ quản trị thấy — luật đã định
  ở `locPhamVi`).

**Các bước:**

- [ ] Thêm `chuaGanCoSo`, `createBranchNone2`, `createBranchNoneNote` vào `config/locale.ts`
- [ ] Viết các ca test mới — **ĐỎ**
- [ ] Sửa `form-tao.tsx`, `app/actions/chuong-trinh.ts`, `man-dien-thoai.tsx`
- [ ] Test **XANH** · e2e 17 → 18 kịch bản
- [ ] Commit `feat(co-so): cho phep khong gan co so, phu huynh tu chon`

---

## ✅ GIAI ĐOẠN 26 — Dấu `?` giải thích từng thông số (XONG 01/09 · 0,3 ngày)

**✅ Bằng chứng:** 5 ca test `goi-y` (canh gợi ý có ĐÁNG ĐỌC không, không chỉ có tồn tại)
· **436 test / 41 file** · e2e **18/18** · build 18 route.

**🔴 Kịch bản e2e bắt được một lỗi giao diện thật, và chỉ ở khung 390px:** bản đầu neo khối
giải thích `absolute left-0` vào chính dấu `?`; với dấu `?` nằm gần mép phải thì khối
**tràn ra ngoài khung 70px** — chữ bị cắt mà không cuộn ngang tới được. Trên màn rộng nó
hoàn toàn bình thường, nhìn bằng mắt ở máy tính không bao giờ thấy. Đã đổi sang `fixed`
cách đều hai mép trên điện thoại, `sm:` trở lên mới quay về popover neo cạnh dấu `?`.

**Dùng `<details>`/`<summary>` gốc** thay vì tự viết popover: `Esc` đóng, bàn phím đi tới
được, trình đọc màn hình hiểu ngay, chạy cả khi JavaScript chưa tải. Một popover tự viết
phải làm lại đúng bốn thứ đó và thường quên mất ba.

**🏁 BẠN NHÌN THẤY GÌ:** cạnh mỗi nhãn ở màn tạo chương trình và kho quà có một dấu **`?`**
tròn nhỏ. Bấm vào → hiện khối giải thích **đặt số đó thì điều gì xảy ra**. Bấm ra ngoài hoặc
`Esc` → đóng.

### - [x] 26.1 — Component gợi ý + nội dung cho 8 thông số ✅ 01/09

- **(a) Làm gì:** `components/goi-y.tsx` — dùng `<details>`/`<summary>` gốc của trình duyệt
  (không thư viện, không bẫy tiêu điểm phải tự viết):
  ```tsx
  export function GoiY({ chu }: { chu: string }) {
    return (
      <details className="relative inline-block align-middle">
        <summary
          aria-label={T.goiYNhan}
          className="ml-1.5 inline-flex h-5 w-5 cursor-pointer list-none items-center
                     justify-center rounded-full border border-ke text-xs font-bold
                     text-chi transition hover:border-tim hover:text-tim"
        >
          ?
        </summary>
        <span className="absolute left-0 top-7 z-10 block w-72 rounded-xl border border-ke
                         bg-white p-3 text-xs font-normal leading-relaxed text-muc shadow-lg">
          {chu}
        </span>
      </details>
    );
  }
  ```
  Nội dung vào `config/locale.ts` với tiền tố `gy`, viết theo lối **"đặt số này thì điều gì
  xảy ra"**, không định nghĩa lại tên ô. Ví dụ thật:
  ```ts
  gyTranGiai:
    "Số giải TỐI ĐA phát ra trong một ngày. Chạm trần thì người chơi vẫn chơi và vẫn " +
    "thấy mình dừng đúng số, nhưng màn kết quả báo hết quà hôm nay. Để 0 là không giới " +
    "hạn — khi đó thứ duy nhất chặn ngân sách là số lượng trong kho quà.",
  gySoLanBam:
    "Một VÁN được bấm mấy lần. Ván vẫn chỉ nhận MỘT phần quà: trúng là dừng ngay, không " +
    "trúng thì lấy lần lệch ít nhất. Tăng số này là tăng tỉ lệ trúng theo công thức " +
    "1−(1−p)^N — xem dòng dự báo ngay bên dưới trước khi chốt.",
  ```
  Gắn cho 8 chỗ: Số trúng thưởng · Độ khó · Trần giải mỗi ngày · Số lần bấm mỗi ván · Chế độ
  chơi · Cơ sở tổ chức · Kho quà "Số lượng" · Kho quà "Trần mỗi ngày".
- **(b) Bạn kiểm chứng bằng cách nào:** `/quan-tri/tao` → bấm dấu `?` cạnh **"Trần số giải
  mỗi ngày"** → hiện đúng đoạn giải thích trên. Bấm `Esc` → đóng. Mở một chương trình → phần
  Kho quà → bấm `?` cạnh **"Số lượng"** → giải thích để trống nghĩa là loại đáy kho. Thử
  trên **điện thoại**: khối giải thích không tràn ra ngoài mép màn hình.
- **(c) Test tự động:** `tests/locale.test.ts` (đã có) tự bắt nếu thêm khoá `gy*` mà quên
  gắn vào chỗ nào — nó chính là cổng canh khoá mồ côi. Thêm
  `tests/goi-y.test.ts`: mọi khoá bắt đầu bằng `gy` đều là chuỗi **dài hơn 40 ký tự** (một
  gợi ý dài 5 chữ là một gợi ý vô dụng) và **không kết thúc bằng dấu hai chấm**.
  Kịch bản e2e `gd26-goi-y.mjs`: bấm `summary` → khối giải thích hiện ra và đọc được.
- **(d) Ước lượng:** 0,5 ngày.
- **(e) chặn:** MÁY.
- **(f) phụ-thuộc:** không (làm được song song với mọi giai đoạn khác).

**Các bước:**

- [ ] Viết 8 chuỗi `gy*` vào `config/locale.ts`
- [ ] Viết `tests/goi-y.test.ts` — **ĐỎ**
- [ ] Tạo `components/goi-y.tsx`, gắn vào `form-tao.tsx` và `kho-qua.tsx`
- [ ] Test **XANH** · thử tay trên khung hẹp 390px xem có tràn không
- [ ] Commit `feat(giao-dien): dau hoi giai thich cho 8 thong so`

---

## NGHIỆM THU CUỐI — thứ máy không tự làm được

Chạy sau khi cả 6 giai đoạn xanh. Đây là danh sách **bạn** phải cầm máy bấm:

- [ ] 📱 **iPhone, công tắc gạt ở nấc IM LẶNG** — chơi một ván, phải nghe tiếng. *(bài kiểm
      quyết định của GĐ 22; câm ở đây thì phải đổi sang phương án tệp âm thanh thật)*
- [ ] 🖥️ **LCD** — mở màn hình, thấy ngay nút "Bật tiếng", bấm, chơi một ván có tiếng
- [ ] 🔒 Đăng nhập bằng tài khoản **sale của CS2** — không thấy và không mở được chương
      trình của CS1
- [ ] 👤 Mở một chương trình — thấy **họ tên đầy đủ**, bấm "Hiện đầy đủ" ra **số điện thoại**
- [ ] 🗑️ Xoá một chương trình test (chưa ai chơi) — biến mất; thử xoá chương trình đã có ván
      — chỉ ẩn, và **khách tiềm năng còn nguyên**
- [ ] 🗑️ Thử xoá **CS1** (đang có khách) — bị chặn kèm con số, chỉ ẩn; khách và nhân viên
      của CS1 **còn nguyên**
- [ ] ✏️ Đổi số trúng của một chương trình đang chạy — mã QR đã in **vẫn dùng được**
- [ ] 🏢 Tạo chương trình **không gán cơ sở** — điện thoại hiện ô chọn cơ sở, chọn xong lead
      về đúng cơ sở đó
- [ ] ❓ Bấm 8 dấu `?` — đọc hiểu được, không tràn mép trên màn hình điện thoại
- [ ] 📊 `/quan-tri/nhat-ky` — có dòng cho **mọi** lần xem lịch sử, xoá, ẩn và sửa

---

## TỔNG KẾT

| Nhóm | Hạng mục | Ước lượng | Thực tế |
| ---- | -------- | --------- | ------- |
| 🔴 Rủi ro cao — làm trước | 21.1 · 21.2 · 22.1 · 22.2 | 1,75 | **0,8** |
| Rủi ro vừa | 23.1 · 23.2 · 24.1 | 1,75 | **1,0** |
| Rủi ro thấp | 25.1 · 26.1 | 1,0 | **0,6** |
| **Tổng** | **9 hạng mục / 6 giai đoạn** | **4,5 ngày** | **2,4 ngày · 9/9 XONG** |

### ✅ TẤT CẢ 6 GIAI ĐOẠN ĐÃ XONG (01/09/2026)

| Cổng kiểm chứng | Trước GĐ 21 | Sau GĐ 26 |
| --------------- | ----------- | --------- |
| `npm test` | 366 test / 33 file | **436 test / 41 file** |
| `npm run e2e` | 14 kịch bản | **18 kịch bản, 18/18 đạt** |
| `npm run build` | 18 route | 18 route |
| `npx tsc --noEmit` · `npm run lint` | xanh | xanh |

**Ba lỗi THẬT mà bộ test cũ không thấy, do gói này bắt được:**

1. 🔴 **Trang chi tiết chương trình không lọc quyền** — sale của cơ sở này đọc được trọn
   lịch sử cơ sở kia bằng cách gõ đúng mã. Lộ ra khi khảo sát để lên kế hoạch.
2. 🔴 **Hai route xuất Excel cũng vậy** — có đọc phiên, nhưng chỉ để ghi tên vào nhật ký,
   không lọc. Lộ ra khi sửa lỗi thứ nhất.
3. 🔴 **Khối gợi ý tràn 70px ra ngoài mép phải điện thoại** — chỉ thấy ở khung 390px, nhìn
   bằng mắt trên máy tính không bao giờ ra. Kịch bản e2e đo toạ độ mới bắt được.

**🛑 CÒN LẠI DUY NHẤT MỘT VIỆC, và nó cần BẠN:** nghiệm thu âm thanh trên iPhone thật
(mục `22.1`, cả hai nấc công tắc gạt im lặng). Xem danh sách nghiệm thu cuối bên dưới.

**Lớp 0** (mở được ngay, không chờ gì): `21.1` · `22.1` · `26.1`.
Sau `21.1` mở được `21.2` · `23.1` · `24.1` · `25.1`. Sau `23.1` mở `23.2`. Sau `22.1` mở `22.2`.

**Luật tick:** chỉ đánh `[x]` khi **(b) đã bấm thật bằng tay** và **(c) đã xanh**. Cấm tick
theo cảm giác. Xong hạng mục nào thì ghi ngày + bằng chứng ngay sau tiêu đề hạng mục đó, và
**xoá dòng `(e)`** của nó.

**Một điểm 🛑 DỪNG BẮT BUỘC:** cuối `22.1` — phải có iPhone thật trong tay bạn xác nhận
trước khi đi tiếp, vì kết quả quyết định `22.2` làm theo hướng nào.
