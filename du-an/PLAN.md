# PLAN.md — Lộ trình IDEA (khởi tạo 29/08/2026)

> 🔴 **ĐỌC TRƯỚC (02/09/2026, chiều):** **GAME_SU_KIEN là MỘT app chứa BA game**
> (ADR-011 đã gộp Vòng Quay vào; ADR-010 "đứng riêng" hết hiệu lực). Lộ trình
> **ĐANG CHẠY** nằm ở
> `modules/GAME_SU_KIEN/VONG_QUAY_MAY_MAN/PLAN_VONG_QUAY_V2.md` — sổ này giữ mục
> **BÀN GIAO PHIÊN GẦN NHẤT** của cả module, đọc khối đó TRƯỚC KHI làm tiếp.
> Sổ `PLAN_VONG_QUAY.md` (v1) đã ĐÓNG, chỉ để grep.
> Sổ hai game cũ (Trúng Số + Chọn Số, chạy chung `modules/GAME_SU_KIEN/app/`) ở
> `modules/GAME_SU_KIEN/TRUNG_SO/`: `PLAN_TRUNG_SO_V3.md` (hết việc máy), `V2` là lịch sử
> v2.1, `V1` là lịch sử v1→v2 (96 KB — grep, đừng nạp trọn).
> File này chỉ còn giữ lộ trình phần NGHIỆP VỤ CHÍNH của IDEA
> (kho ươm ý tưởng, mục 0.2/0.3 chưa bắt đầu) và phần GĐ 0–2 lịch sử của module đó.
> ⚠️ Phần "GĐ 1–2" bên dưới mô tả kiến trúc CŨ (relay LAN + xuất tĩnh) đã bị thay bằng
> Next server + SQLite + SSE — giữ lại làm dấu vết, đừng dựng lại theo nó.
>
> **Nguyên tắc đọc file này:** đây là NGUỒN LỘ TRÌNH DUY NHẤT của dự án — không đẻ file kế
> hoạch riêng; cần mở rộng thì đánh số con ngay tại đây (vd 2.1b, 3B.1). Mỗi Giai đoạn (GĐ)
> kết thúc bằng một DEMO mà người dùng tự bấm thử được — không nghiệm thu bằng lời "đã viết
> xong". Mỗi hạng mục có 6 dòng: (a) làm gì, (b) người dùng kiểm chứng bằng thao tác nào,
> (c) test tự động nào chạy, (d) ước lượng thời gian, **(e) chặn: `MÁY`|`NGƯỜI`|`NGOÀI`**
> (cái gì đang chặn — KHÔNG phải "có phải code không"), **(f) phụ-thuộc:** mã các hạng mục
> phải xong trước (hoặc `không`). Dòng (e) và (f) BẮT BUỘC với mọi mục chưa tick; tick xong
> thì xóa dòng (e). Hạng mục 🔴 = rủi ro cao, cố tình xếp SỚM. **Luật tick:** chỉ tick ✅ khi (b) đã bấm thật và (c) đã xanh — cấm tick theo cảm
> giác; hạng mục dở ghi `(dở — dừng ở: ...)`. Xong MỘT hạng mục → tick → báo cáo 3 dòng →
> đi tiếp theo GÓI (luật: `.claude/rules/workflow.md`); chỉ dừng ở điểm DỪNG BẮT BUỘC.
>
> **Nguồn thiết kế chi tiết:** `docs/brd/` + `docs/decisions/ADR-*`. Quy tắc bắt buộc:
> `.claude/rules/`.

---

## GIAI ĐOẠN 0 — Khung dự án + nền tảng (ước lượng: __)

**DEMO kết thúc GĐ:** (mô tả thao tác người dùng tự bấm thử được — vd: mở URL thấy trang
đầu tiên chạy thật.)

- [x] **0.1 — Khởi tạo bộ khung chuẩn** ✅ (29/08/2026 — sinh bởi skill `khoi-tao-du-an`)
  - (a) CLAUDE.md + PLAN.md + `.claude/{rules,agents,skills,commands,settings}` + docs/ +
    config/ + `scripts/check-structure.mjs` + scaffold.json.
  - (b) Người dùng mở cây thư mục thấy đủ cấu trúc; đọc được CLAUDE.md bằng Tiếng Việt.
  - (c) `node scripts/check-structure.mjs` in ✅ toàn bộ, exit 0.
  - (d) 0,1 ngày.

- [ ] **0.2 — Viết BRD đầu tiên**
  - (a) `docs/brd/<ten-tai-lieu>.md`: bài toán, người dùng, phạm vi in/out, yêu cầu chính.
  - (b) Người dùng đọc và duyệt BRD.
  - (c) (tài liệu — không có test tự động.)
  - (d) __.
  - (e) chặn: NGƯỜI — chỉ bạn quyết được IDEA giải bài toán gì, cho ai, phạm vi tới đâu.
  - (f) phụ-thuộc: không

- [ ] **0.3 — Chốt stack + lập lộ trình chi tiết**
  - (a) Điền `.claude/rules/tech-defaults.md`; viết ADR-001 nếu là lựa chọn lớn; bổ sung
    các GĐ 1..N vào chính file này theo khuôn 4 dòng.
  - (b) Người dùng duyệt danh sách giai đoạn + thứ tự ưu tiên (🔴 xếp sớm).
  - (c) `node scripts/check-structure.mjs` vẫn xanh sau khi thêm cấu trúc mới.
  - (d) __.
  - (e) chặn: NGƯỜI — chờ duyệt BRD ở 0.2 rồi mới chốt được giai đoạn và thứ tự ưu tiên.
  - (f) phụ-thuộc: 0.2

---

## GIAI ĐOẠN 1 — DEM_SO: bộ đếm may mắn (ước lượng: 2,5 ngày)

**DEMO kết thúc GĐ:** bạn mở `/cai-dat` trên máy, nhập số `0211`, quét QR sinh ra bằng
điện thoại → chơi thật một lượt trên điện thoại → thấy màn TRƯỢT nói đúng "lệch N số"; hạ
`tocDoToiDa` xuống 30 rồi chơi lại → thấy màn TRÚNG có pháo giấy + mã xác thực 60 giây.

> Sản phẩm đứng riêng: code ở `modules/GAME_SU_KIEN/app/` là **repo Git độc lập** (IDEA đã
> gitignore), đẩy lên `https://github.com/hodacphuchtc/DEM_SO`. Thiết kế chi tiết + lập
> luận con số: `docs/brd/dem-so-bo-dem-may-man.md`. Mọi lệnh `npm` dưới đây chạy **bên
> trong `modules/GAME_SU_KIEN/app/`**.

- [x] **1.0 — Dựng khung app + tài liệu module** ✅ (30/08/2026 — check-structure + build xanh)
  - (a) BRD `docs/brd/dem-so-bo-dem-may-man.md`; `modules/GAME_SU_KIEN/OVERVIEW.md` +
    `module.config.json`; khai `DEM_SO` vào `.claude/scaffold.json`; gitignore
    `modules/GAME_SU_KIEN/{app,DATA}/`; dựng Next.js App Router + TypeScript + Tailwind với
    `output: 'export'`; cài Vitest.
  - (b) Bạn mở `docs/brd/dem-so-bo-dem-may-man.md` đọc và duyệt phần luật chơi § 4.
  - (c) `node scripts/check-structure.mjs` exit 0; trong app: `npm run build` xanh.
  - (d) 0,3 ngày.
  - (f) phụ-thuộc: không

- [x] **1.1 — 🔴 Lõi bộ đếm + test** ✅ (30/08/2026 — 20 ca test xanh)
  - (a) `lib/bo-dem.ts`: `v(t)`, `n(t)`, tính kết quả từ mốc thời gian bấm, khoảng lệch
    vòng tròn; `config/game.ts` chứa toàn bộ hằng số + 3 mức khó.
  - (b) (chưa có UI — kiểm chứng bằng test ở (c).)
  - (c) `npm test` xanh, tối thiểu 6 ca: đơn điệu tăng · quay vòng 9999→0000 · tốc độ
    đúng tại mốc 0/T/2T · kết quả không đổi khi lấy mẫu ở nhịp khác nhau · khoảng lệch
    vòng tròn (dừng 9998 vs số cài 0002 = lệch 4) · mọi số cài đều gặp lần đầu ở tốc tối
    đa sau khi hết khoá nút.
  - (d) 0,5 ngày.
  - (f) phụ-thuộc: 1.0

- [x] **1.2 — Bảng LED 4 chữ số** ✅ (30/08/2026 — SVG 7 đoạn, đã sửa lỗi đoạn tắt sáng quá làm 0000 đọc ra 8888)
  - (a) `components/led-4-so.tsx`: 7 đoạn SVG thuần, đỏ trên nền đen, có ánh sáng toả —
    dựng lại đúng bảng LED trong video. Không tải font ngoài.
  - (b) Bạn mở trang chơi thấy `0000` kiểu đồng hồ LED, chữ số to rõ trên điện thoại.
  - (c) `npm run lint` + `npm run build` xanh.
  - (d) 0,3 ngày.
  - (f) phụ-thuộc: 1.0

- [x] **1.3 — Màn chơi: nút, đếm ngược, âm thanh, rung** ✅ (30/08/2026 — Playwright: nút khoá đúng 6 giây rồi mở)
  - (a) `app/page.tsx` + `components/nut-choi.tsx`: BẮT ĐẦU → 3-2-1 → `ĐANG TĂNG TỐC…`
    (khoá 6 giây) → DỪNG; vẽ bằng `requestAnimationFrame`; `lib/am-thanh.ts` tick nhanh
    dần bằng Web Audio; `lib/rung.ts`.
  - (b) Bạn chơi một lượt trên điện thoại thật: ngón cái với tới nút, nghe tiếng tick
    nhanh dần, máy rung khi bấm.
  - (c) `npm run lint` + `npm run build` xanh.
  - (d) 0,5 ngày.
  - (f) phụ-thuộc: 1.1, 1.2

- [x] **1.4 — Màn kết quả trúng / trượt** ✅ (30/08/2026 — Playwright: chụp được cả màn TRÚNG lẫn màn TRƯỢT)
  - (a) `components/man-ket-qua.tsx`: TRÚNG = pháo giấy + số đã dừng + tên giải + đồng hồ
    ngược 60 giây + mã xác thực (`lib/ma-xac-thuc.ts`, đổi theo phút); TRƯỢT = "Bạn dừng ở
    0215 — lệch 4 số!" + THỬ LẠI.
  - (b) Bạn chơi trượt thấy đúng số lệch; hạ `tocDoToiDa` xuống 30 rồi bấm trúng để xem
    màn TRÚNG chạy thật.
  - (c) `npm test` (ca mã xác thực đổi theo phút) + `npm run build` xanh.
  - (d) 0,4 ngày.
  - (f) phụ-thuộc: 1.3

- [x] **1.5 — Trang `/cai-dat` cho nhân viên + QR** ✅ (30/08/2026 — QR sinh đúng, cảnh báo cấu hình hỏng chạy đúng)
  - (a) Nhập số trúng 4 chữ số, chọn mức Dễ/Vừa/Khó/Tuỳ chỉnh, tên trung tâm, tên giải →
    sinh link + ảnh QR in được; hiện tỉ lệ trúng ước tính; `lib/cau-hinh-url.ts`.
  - (b) Bạn nhập `0211`, quét QR bằng camera điện thoại → mở đúng ván đã cấu hình.
  - (c) `npm test` (ca đọc–ghi cấu hình URL, có giá trị mặc định khi URL thiếu/sai) xanh.
  - (d) 0,4 ngày.
  - (f) phụ-thuộc: 1.1

- [x] **1.6 — Thể lệ, README, tinh chỉnh điện thoại** ✅ (30/08/2026 — 3 trang chạy trên khung iPhone 13, không lỗi console)
  - (a) `app/the-le/page.tsx`; `README.md` tiếng Việt (cài, đổi số, in QR); soát cỡ chữ,
    vùng chạm, chế độ tối, không cuộn ngang.
  - (b) Bạn mở cả 3 trang trên điện thoại thật, không có chỗ nào tràn hay chữ quá nhỏ.
  - (c) `npm run lint` + `npm run build` xanh.
  - (d) 0,3 ngày.
  - (f) phụ-thuộc: 1.4, 1.5

- [x] **1.7 — Đẩy lên GitHub** ✅ (30/08/2026 — commit 2d64405, 30 file, gitleaks sạch)
  - (a) `git init` trong `app/` → commit → remote `github.com/hodacphuchtc/DEM_SO` → push
    nhánh `main`. Repo PUBLIC nên soát kỹ: không key, không secret.
  - (b) Bạn mở repo trên GitHub thấy đủ code.
  - (c) `gitleaks detect` sạch trước khi push.
  - (d) 0,1 ngày.
  - (f) phụ-thuộc: 1.6

**🏁 MỐC DEM_SO chạy thật (hết GĐ 1):** một phụ huynh quét QR ở quầy, chơi trọn một lượt
trên điện thoại của họ và nhận được kết quả đúng — không cần cài app, không khai thông tin.

---


## GIAI ĐOẠN 2 — Chiếu song song lên màn hình LCD (ước lượng: 0,8 ngày)

**DEMO kết thúc GĐ:** chạy `npm run trung-tam`, mở `/man-hinh/` trên máy nối LCD, quét mã
QR đang hiện trên đó bằng điện thoại → ván chơi hiện song song trên cả hai màn hình, và
con số dừng cuối cùng khớp tuyệt đối.

> ⚠️ GĐ này **đảo quyết định "không backend"** ở BRD § 5.5: thêm `server/relay.mjs` — Node
> thuần, không thư viện, giữ tin trong bộ nhớ, **không lưu gì xuống đĩa**. Lập luận và luật
> vận hành: BRD § 7.

- [x] **2.1 — Máy chủ trung chuyển + lớp truyền tin** ✅ (30/08/2026 — 13 test xanh, có test tích hợp bật hẳn tiến trình)
  - (a) `server/relay.mjs` (SSE + POST, `node:http` thuần, luật một-người-một-lượt);
    `lib/ket-noi.ts` (mã phòng, địa chỉ trung chuyển, gửi/nhận, nuốt lỗi khi mất mạng).
  - (b) `curl http://<ip>:3001/suc-khoe` trả `{"ok":true}`.
  - (c) `npm test` — bật hẳn tiến trình rồi kiểm: báo trạng thái phòng · xin lượt ·
    **một người một lượt** · máy không giữ lượt thì không đẩy được gì · nhả lượt sau khi
    có kết quả · gói tin rác không làm sập máy chủ.
  - (f) phụ-thuộc: 1.1

- [x] **2.2 — Màn hình LCD `/man-hinh`** ✅ (30/08/2026 — Playwright: 2 trình duyệt, kết quả khớp)
  - (a) `components/man-hinh-lcd.tsx`: tự sinh mã phòng, vẽ QR khổ lớn, chiếu bảng LED cỡ
    TV, tự về màn chờ, cảnh báo khi mất kết nối trung chuyển.
  - (b) Bạn mở trên máy nối LCD, bật toàn màn hình, thấy mã QR to và số trúng thưởng.
  - (c) `npm test` + kịch bản Playwright hai trình duyệt (LCD + điện thoại).
  - (f) phụ-thuộc: 2.1, 1.2

- [x] **2.3 — Điện thoại đẩy diễn biến lên phòng** ✅ (30/08/2026 — băng "Đang chiếu lên màn hình lớn" chạy đúng)
  - (a) `components/man-choi.tsx` xin lượt khi bấm BẮT ĐẦU rồi đẩy `dem-nguoc` /
    `bat-dau` / `ket-qua`; băng thông báo trạng thái chiếu; mất kết nối vẫn chơi được.
  - (b) Bạn quét QR trên LCD, chơi một ván, thấy LCD chạy theo và dừng đúng con số.
  - (c) Playwright: kết quả trên hai màn hình khớp nhau từng chữ.
  - (f) phụ-thuộc: 2.2

- [x] **2.4 — Một lệnh chạy cả trung tâm + tài liệu** ✅ (30/08/2026)
  - (a) `scripts/chay-trung-tam.mjs` (`npm run trung-tam`) bật cả web lẫn trung chuyển,
    in sẵn địa chỉ, Ctrl-C tắt cả hai; cập nhật README + BRD § 7.
  - (b) Bạn gõ đúng một lệnh và thấy danh sách địa chỉ cần mở.
  - (c) `npm run lint` + `npm run build` xanh với 5 trang tĩnh.
  - (f) phụ-thuộc: 2.3

**🏁 MỐC LCD (hết GĐ 2):** một phụ huynh quét mã trên màn hình lớn của trung tâm, chơi trên
điện thoại của họ, và cả sảnh cùng nhìn thấy con số dừng lại trên màn hình lớn.

---

## GIAI ĐOẠN 3+ — GAME_SU_KIEN: sổ lộ trình đã TÁCH RA

Module đếm số cũ đã thành `modules/GAME_SU_KIEN/` — 🔴 **MỘT ứng dụng chứa BA game**:
`app/` chạy **Trúng Số + Chọn Số + Vòng Quay** chung một CSDL, chung một lần đăng nhập,
rẽ bằng cột `chuong_trinh.tro_choi`. Lý do gộp + giá phải trả (mất mệnh đề "Vòng Quay hỏng
thì Trúng Số vẫn chạy"): [`ADR-011`](docs/decisions/ADR-011-gop-vong-quay.md), đảo
[`ADR-010`](docs/decisions/ADR-010-vong-quay-dung-rieng.md) và đưa `ADR-005` trở lại làm
luật chung. Thư mục `VONG_QUAY_MAY_MAN/app/` còn trên đĩa nhưng **NGỪNG**, giữ làm mốc lùi
(bản đó đã đẩy lên `github.com/hodacphuchtc/VONG_QUAY_MAY_MAN`, riêng tư).
Từ đây lộ trình của nó KHÔNG ghi trong file này nữa (đúng luật tách sổ ở
`.claude/rules/workflow.md`: một sổ vượt ~400 dòng hoặc ≥ 2 module chạy song song thì tách).

| Sổ | Nội dung | Trạng thái |
| -- | -------- | ---------- |
| [`TRUNG_SO/PLAN_TRUNG_SO_V3.md`](modules/GAME_SU_KIEN/TRUNG_SO/PLAN_TRUNG_SO_V3.md) | Game **Chọn Số** v3 (chạy chung `app/` với Trúng Số) | ✅ **13/13 xong** — hết việc máy; 501 test · e2e 20/20 · đã push `3d96358` |
| [`TRUNG_SO/PLAN_TRUNG_SO_V2.md`](modules/GAME_SU_KIEN/TRUNG_SO/PLAN_TRUNG_SO_V2.md) | Game **Trúng Số** v2.1 — dọn dẹp & làm chủ chương trình (GĐ 21→26) | ✅ **9/9 xong** · chờ nghiệm thu iPhone |
| [`TRUNG_SO/PLAN_TRUNG_SO_V1.md`](modules/GAME_SU_KIEN/TRUNG_SO/PLAN_TRUNG_SO_V1.md) | Lịch sử v1 → v2 (GĐ 1→20) + bàn giao | 41/51 xong · phần máy đã hết |
| 🔴 [`VONG_QUAY_MAY_MAN/PLAN_VONG_QUAY_V2.md`](modules/GAME_SU_KIEN/VONG_QUAY_MAY_MAN/PLAN_VONG_QUAY_V2.md) | **Vòng Quay v2 — gộp vào app chung** (ADR-011) + dựng lại giao diện + 4 nhóm tính năng sau buổi test 02/09. **Sổ ĐANG CHẠY + BÀN GIAO PHIÊN GẦN NHẤT** | **13/27 xong** — GĐ 0→2 + 5.1 hết phần máy: 597 test · 28 route · CSDL quầy nâng cấp tại chỗ không mất dòng nào. Còn GĐ 3, 4, 5.2–5.3, 6 |
| [`VONG_QUAY_MAY_MAN/PLAN_VONG_QUAY.md`](modules/GAME_SU_KIEN/VONG_QUAY_MAY_MAN/PLAN_VONG_QUAY.md) | Vòng Quay **v1** — bản app đứng riêng (GĐ 0→6 + gói dọn A). Lịch sử, chỉ để grep | ✅ 21/26 — hết việc máy; 200 test · e2e 5/5 · 13 route. Đã đẩy lên GitHub riêng làm mốc lùi |

**GĐ 1 và GĐ 2 phía trên là LỊCH SỬ của v1** (khi module còn tên `DEM_SO`) — giữ lại để
không mất dấu, không sửa. Việc còn dở của v1 (`6.1` e2e, `6.3` push GitHub) đã chuyển sang
sổ Trúng Số, không theo dõi ở đây nữa.

<!-- Thêm GIAI ĐOẠN 1..N tại đây theo đúng khuôn trên. Mốc lớn dùng dòng:
**🏁 MỐC <tên> (hết GĐ N):** <tiêu chí đo được>. -->
