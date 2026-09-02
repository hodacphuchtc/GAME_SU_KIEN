# OVERVIEW — Module GAME_SU_KIEN (game sự kiện tại quầy)

## 1. Mục đích

🔴 **GAME_SU_KIEN là MỘT module chứa HAI ứng dụng, không phải một app.** Đọc kỹ mục 3
trước khi sửa bất cứ thứ gì:

| Ứng dụng | Chứa game | Cổng | CSDL | Repo |
| -------- | --------- | ---- | ---- | ---- |
| `app/` | **Trúng Số** + **Chọn Số** (chung CSDL, rẽ bằng cột `chuong_trinh.tro_choi`) | 3111 | `du-lieu/game-su-kien.db` | `hodacphuchtc/GAME_SU_KIEN` |
| `VONG_QUAY_MAY_MAN/app/` | **Vòng Quay May Mắn** — **đứng riêng hoàn toàn** | **3200 / 3210** | `du-lieu/vong-quay.db` | **riêng** (chưa có — `N.5`) |

Lý do tách + giá phải trả: `docs/decisions/ADR-010-vong-quay-dung-rieng.md`.
CẤM `import` xuyên giữa hai app — tái dùng bằng **chép tay có ghi nguồn**.

**Game đầu tiên (Trúng Số)** — trò chơi quay số cho trung tâm: dãy **4 chữ số đếm tăng dần
và tăng tốc**, phụ huynh/học sinh quét QR trên điện thoại rồi bấm **DỪNG**; dừng trúng con số nhân viên đã cài (vd
`0211`) thì được thưởng. Mục tiêu là **công cụ marketing tại quầy** — giữ chân người đến
trung tâm, khiến họ tự quay clip và quay lại lần sau.

Ý tưởng gốc phân tích từ `DATA/VIDEO PHAN TICH.mp4`; toàn bộ lập luận + con số chốt nằm ở
**`docs/brd/dem-so-bo-dem-may-man.md`** (đọc file đó trước khi sửa luật chơi).

## 2. Phạm vi (In / Out)

- **In:** **màn hình LCD** tại lễ tân (nơi duy nhất hiện dãy số, có QR khổ lớn) · màn
  điện thoại phụ huynh (nhập Họ tên + SĐT rồi chỉ còn một nút DỪNG) · trang quản trị
  `/quan-tri` (tạo chương trình · QR in được · lịch sử quay số · xuất CSV · nút tắt khẩn) ·
  **lưu lịch sử tra soát** · ba van giữ ngân sách (1 lượt/SĐT/ngày · trần giải mỗi ngày ·
  một màn hình một người chơi) · mời học thử ở màn thua.
- **Out (v1):** chiếu song song hai màn hình · xác thực OTP · đẩy lead sang CRM SataRobo ·
  đăng nhập trang quản trị · âm thanh trên LCD · ảnh khoe và biểu đồ báo cáo.
  Lý do từng mục: `TRUNG_SO/PLAN_TRUNG_SO_V1.md` mục "KHÔNG LÀM ở v1".

> ⚠️ Mục 2 và 3 của BRD (`docs/brd/dem-so-bo-dem-may-man.md`) viết theo kiến trúc CŨ
> (web tĩnh, không lưu gì). Phần **luật chơi § 4** và **thiết kế bộ đếm § 5** vẫn đúng
> nguyên; phần phạm vi thì đọc ở đây.

## 3. Cấu trúc bên trong

| Đường dẫn | Vai trò |
| --------- | ------- |
| `DATA/` | Tư liệu nguồn (video phân tích). **Đã gitignore** |
| `app/` | 🔴 **APP SỐ 1 — REPO GIT ĐỘC LẬP**, không thuộc repo IDEA. Chứa CẢ HAI game Trúng Số + Chọn Số. Đẩy lên `github.com/hodacphuchtc/GAME_SU_KIEN` |
| `VONG_QUAY_MAY_MAN/app/` | 🔴 **APP SỐ 2 — ĐỨNG RIÊNG HOÀN TOÀN**: Next.js riêng · SQLite riêng (`du-lieu/vong-quay.db`) · cổng **3200/3210** · repo Git riêng. Xem `ADR-010` |
| `VONG_QUAY_MAY_MAN/PLAN_VONG_QUAY.md` | Lộ trình **ĐANG CHẠY** của Vòng Quay + **BÀN GIAO PHIÊN GẦN NHẤT** của cả module (đọc TRƯỚC TIÊN) |
| `TRUNG_SO/PLAN_TRUNG_SO_V3.md` | Lộ trình game **Chọn Số** v3 (chạy chung `app/`) — ✅ 13/13, hết việc máy |
| `TRUNG_SO/PLAN_TRUNG_SO_V2.md` | Lịch sử v2.1 (GĐ 21→26) |
| `CHON_SO/OVERVIEW.md` | Tư liệu game CHỌN SỐ. **Không có code riêng** — chạy chung `app/` |
| `TRUNG_SO/PLAN_TRUNG_SO_V1.md` | Lịch sử v1→v2 (96 KB — grep, đừng nạp trọn) |

Bên trong `app/` — Next.js 16 chạy **máy chủ Node** (KHÔNG còn xuất tĩnh), tự chứa cả cơ
sở dữ liệu lẫn kênh đồng bộ:

| Đường dẫn | Vai trò |
| --------- | ------- |
| `config/game.ts` | Hằng số nghiệp vụ + ba mức khó Dễ/Trung bình/Khó |
| `config/thuong-hieu.ts` | Bộ nhận diện Sata Robo (tím 30 / cam 10 / trắng 60, Be Vietnam Pro) |
| `config/locale.ts` | Từ điển tiếng Việt duy nhất |
| `lib/bo-dem.ts` | ★ Lõi bộ đếm — hàm THUẦN của thời gian, nền của cả tính năng đồng bộ |
| `lib/chon-so/vong-so.ts` | ★ Lõi game CHỌN SỐ — vòng chạy + nhịp quay theo độ dài dải |
| `lib/tro-choi/` | Lớp luật chơi: chỗ DUY NHẤT hai game khác nhau ở phía máy chủ |
| `lib/db/` | SQLite qua `node:sqlite` (có sẵn Node 24) — lược đồ, kết nối, truy vấn |
| `lib/dong-bo/` | Trạm phát trong bộ nhớ + kênh SSE + canh đồng hồ (Cristian) |
| `lib/phien/giu-cho.ts` | Giữ chỗ: một màn hình + một người chơi cho mỗi chương trình |
| `lib/luot/` | Vòng đời ván chơi · lịch sử · giới hạn lượt và trần giải |
| `lib/nguoi-choi/` | Nhận diện phụ huynh, chuẩn hoá số điện thoại |
| `app/quan-tri/` | Trang nhân viên: danh sách · tạo · chi tiết (QR in được, lịch sử, xuất CSV) |
| `app/man-hinh/[ma]/` | **Màn hình LCD** — nơi DUY NHẤT hiện dãy số |
| `app/choi/[ma]/` | Màn hình điện thoại phụ huynh — chỉ là nút bấm |
| `app/api/su-kien`, `app/api/gio` | Kênh SSE · giờ máy chủ |
| `scripts/chay-trung-tam.mjs` | `npm run trung-tam` — dựng bản thật, chạy, in địa chỉ |
| `du-lieu/game-su-kien.db` | Dữ liệu thật của trung tâm. **Đã gitignore** |

## 4. Phụ thuộc

**Không phụ thuộc module nào** — GAME_SU_KIEN là sản phẩm đứng riêng, có repo riêng, không
import code từ `core` hay module khác (`dependencies: []` trong `module.config.json`). Ranh giới
module của IDEA vì thế không bị đụng tới. Hằng số nghiệp vụ đọc từ `app/config/`, không
hardcode.

## 5. Trạng thái & bước tiếp theo

**Tên module đổi 01/09/2026** thành `GAME_SU_KIEN` (tên cũ theo game đầu tiên); repo GitHub
đã đổi theo (`hodacphuchtc/GAME_SU_KIEN`). Tư liệu từng game ở `TRUNG_SO/`, `CHON_SO/` và
`VONG_QUAY_MAY_MAN/`.

✅ **Tranh chấp "một app chứa nhiều game" đã HOÀ GIẢI (02/09/2026) bằng `ADR-010`:** Trúng Số
+ Chọn Số giữ nguyên một app (ADR-005 vẫn đúng cho hai game đó); **Vòng Quay đứng riêng** vì
nó do MÁY quyết kết quả và không được phép làm ngã Trúng Số đang chạy thật tại quầy.

**Vòng Quay May Mắn (`VONG_QUAY_MAY_MAN/app/`) — ĐANG THI CÔNG.** GĐ 0–2 xong phần máy,
GĐ 3–6 chưa bắt đầu. Kiểm chứng: `npm test` **72 test / 7 file** xanh · `npx tsc --noEmit` ·
`npm run lint` · `npm run build` (5 route) · `npm run bang-tra` (100.000 lượt, lệch tối đa
**0,261 điểm %**). 🔴 Trang `/quan-tri` của nó **chưa có lớp chặn nào** — đúng việc của hạng
mục `3.1`. Code còn nằm trong commit local, **chưa push** (chặn NGOÀI: `N.5` cần repo GitHub).
Lộ trình + bàn giao: `VONG_QUAY_MAY_MAN/PLAN_VONG_QUAY.md`.

**v1** chạy thật tại quầy. **v2** (01/09/2026): xong **GĐ 7 → 20** hết phần máy làm được,
cùng `6.1` · `6.3` · `9.3` từ v1 — **39/40 hạng mục**. Test **93 → 360**, thêm **14 kịch
bản e2e** chạy trình duyệt thật. Đã commit và push (`80d9915`).

- Kiểm chứng: `npm test` (360) · `npx tsc --noEmit` · `npm run lint` · `npm run build` ·
  `npm run e2e` (**14/14 đạt**) · `npm run anh-chup` (15 ảnh, ba phép soi đều đạt) ·
  `node scripts/check-structure.mjs` (55 mục, 8 ADR).
- Chạy tại quầy: `npm run trung-tam` (một lệnh) + `npm run kiem-may-chu` (5 mục).
- Sao lưu: `npm run sao-luu` (giữ 14 bản, đích mặc định NGOÀI thư mục dự án).
- CSDL: `du-lieu/game-su-kien.db`, lược đồ **9 bảng + 5 cột bổ sung**, `user_version = 2`.

**CÒN LẠI — chỉ MỘT hạng mục, và nó chờ NGOÀI:**

| Hạng mục | Chặn ở |
| -------- | ------ |
| **18.1b** lên VPS + HTTPS | **NGOÀI** — `N.6`: VPS có ổ đĩa bền + tên miền. Chỉ chặn **chế độ ONLINE**; chạy tại quầy thì máy local đã đủ (**18.1a** xong) |

🔴 **`N.7` — bản sao lưu vẫn nằm CÙNG máy với bản gốc.** Ổ cứng hỏng là mất cả hai. Trỏ
`GAME_SU_KIEN_SAO_LUU` sang ổ ngoài là xong. Quy trình khôi phục: `docs/sop/KHOI-PHUC-CSDL.md`.

Lộ trình + bàn giao chi tiết ở `TRUNG_SO/` (V2 đang chạy, V1 là lịch sử) — **đọc file đó, đừng chép danh sách hạng
mục sang đây.**

## 6. Quyết định quan trọng

| Ngày | Quyết định | Lý do |
| ---- | ---------- | ----- |
| 30/08/2026 | `app/` là repo Git riêng lồng trong IDEA | Repo sản phẩm chỉ nên chứa code sản phẩm, không kéo theo bộ khung IDEA; vẫn giữ tư liệu + BRD trong cùng một workspace |
| 02/09/2026 | 🔴 **Vòng Quay ĐỨNG RIÊNG** — app · CSDL · cổng 3200/3210 · repo riêng (`ADR-010`, đảo một phần `ADR-005`) | Nó do **MÁY** quyết kết quả (hai game kia do người bấm) nên nghĩa vụ chứng minh "không bị chỉnh" khác hẳn; và lỗi/tải của game mới không được phép làm ngã Trúng Số đang chạy thật. Đã cân nhắc phương án gộp — gộp RẺ (Chọn Số chỉ tốn 16 file trên tổng 171) — mà vẫn chọn tách. Giá phải trả: hai kho khách · hai sổ ngân sách quà · hai lần đăng nhập · hai lần sao lưu |
| 30/08/2026 | Không backend, cấu hình nằm trong URL của QR | Không lưu gì ⇒ không cần server; đổi số trúng = in QR mới, nhân viên tự làm trong 30 giây |
| 30/08/2026 | `tocDoToiDa = 800 số/giây` | Hàng nghìn + hàng trăm còn đọc được, hàng chục + đơn vị nhoè ⇒ người chơi *tin là kỹ năng* — đòn bẩy tâm lý số 2 của video (BRD § 5.2) |
| 30/08/2026 | Khoá nút DỪNG 6 giây đầu | Để mọi số cài đều chỉ gặp ở tốc tối đa; không khoá thì số cài nhỏ dễ hơn hẳn số cài lớn (BRD § 5.3) |
| 30/08/2026 | Kết quả tính từ `event.timeStamp`, không lấy số đang vẽ | Máy yếu/lag vẫn cho cùng kết quả ⇒ trò chơi trung thực |

**Thương hiệu (GĐ 14):** logo + linh vật kéo từ Drive theo ID ghi trong
`rule/UI/SATA ROBO — BRAND DNA…` § 5.1 và § 15. Linh vật master **không có alpha** ⇒ dùng
bản dẫn xuất nền trong (`scripts/tach-nen-linh-vat.mjs`, bản master giữ nguyên). Tư thế
đang có là **ĂN MỪNG** ⇒ chỉ dùng ở màn chờ · bước nhập thông tin · màn THẮNG, **cấm ở màn
thua**. Luật gom về `components/nhan-dien-sata.tsx`, có kịch bản e2e canh riêng.

**Mười quyết định kiến trúc đã thành ADR** — đọc `docs/decisions/ADR-001` … `ADR-010` thay
vì tóm tắt lại ở đây. Ngắn gọn: màn thua không bán hàng (001) · ranh giới câu định vị (002) ·
một bảng `nhan_vien` (003) · thêm chế độ online nhưng GIỮ tại quầy (004) · một app nhiều game
(005 — **đã bị đảo một phần bởi 010**) · ván N lần bấm + công thức `1−(1−p)^N` (006) · kho quà
tụt đáy chứ không ép thua (007) · VPS giữ SQLite (008) · loại trừ số đã ra đổi VÒNG CHẠY
(009) · **Vòng Quay đứng riêng (010)**.

**Bổ sung 01/09/2026:**

- **Trúng Số + Chọn Số chung một app** (`ADR-005`). Cơ sở · nhân viên · khách tiềm năng · kho
  quà là danh mục dùng chung (module-boundaries rule 3) — hai app riêng là hai bản sao danh bạ
  khách hàng. Thêm game vào app này = thêm vùng route + lớp luật ở `lib/tro-choi/`, không dựng
  lại hạ tầng (đo thật: Chọn Số chỉ tốn 16 file trên tổng 171).
- 🔴 **Nhưng Vòng Quay thì TÁCH** (`ADR-010`, 02/09/2026) — và ta trả đúng cái giá vừa nói ở
  trên: hai kho khách, hai sổ ngân sách quà, hai lần đăng nhập, hai lần sao lưu. Tiêu chí phân
  xử cho game thứ tư: chung danh mục **và** chung nghĩa vụ chứng minh ⇒ gộp; khác bản chất *ai
  quyết kết quả* **hoặc** cần nhịp phát hành riêng ⇒ app riêng.
- **Lược đồ nâng cấp hai lớp.** `luoc-do.ts` = hình dạng lý tưởng cho CSDL trắng;
  `nang-cap.ts` = cách kéo CSDL cũ về đó. Lớp cấu trúc chạy mỗi lần khởi động (idempotent),
  lớp dữ liệu chạy đúng một lần canh `PRAGMA user_version`.
- **Màn thua không còn tặng quà** (đảo GĐ 5.1 của v1). Lead vẫn thu vì form họ tên + SĐT
  chạy TRƯỚC ván chơi. Gỡ nút thì phải gỡ luôn server action — hàm export trong file
  `"use server"` là endpoint HTTP công khai, để lại là ai cũng POST được.
- **Cạm bẫy đã trả giá** (danh sách đầy đủ ở `app/CLAUDE.md` mục "Cạm bẫy đã trả giá" và
  `../../CLAUDE.md` mục Cảnh báo): mở `DatabaseSync` vào đường dẫn không tồn tại là TẠO tệp
  rỗng · `pkill -f "next start"` không khớp `next-server` · đổi tên thư mục làm
  `.gitignore` trỏ hụt khiến repo con bị nhúng vào repo cha · **Next 16 đổi `middleware.ts`
  thành `proxy.ts`** · tin `ket-qua` mang số lần vừa bấm còn màn tổng kết phải vẽ lần tốt
  nhất · ngưỡng cảnh báo thuần tỉ lệ chết lặng với kho nhỏ.

