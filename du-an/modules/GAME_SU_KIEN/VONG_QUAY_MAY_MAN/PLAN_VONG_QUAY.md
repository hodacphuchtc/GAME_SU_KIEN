# VÒNG QUAY MAY MẮN — Lộ trình MVP

**Mục tiêu:** một trò quay số tại quầy trung tâm — phụ huynh quét QR, bấm QUAY trên điện
thoại, vòng quay chạy trên màn hình LCD trước cả sảnh và dừng ở một ô; ô đó chính là phần
quà. Mọi ván quay lại được về sau để chứng minh không bị chỉnh.

**Kiến trúc:** ứng dụng **ĐỨNG RIÊNG** — Next.js 16 + `node:sqlite`, cổng 3200/3210, repo
Git riêng, cơ sở dữ liệu riêng. Không chung một dòng code với app Trúng Số ở `../../app/`.
Máy chủ **quyết kết quả trước**, hai màn hình cùng chạy một hàm THUẦN của thời gian tới
đúng góc đó — không truyền từng khung hình qua mạng.

**Công nghệ:** Next.js 16.3.3 · React 19.2.8 · Tailwind 4 · `node:sqlite` (có sẵn Node 24,
không thêm thư viện CSDL) · vitest 4 · Playwright qua skill `webapp-testing` (browser đã có
ở `~/Library/Caches/ms-playwright/`, **đừng thêm dependency**).

---

## BÀN GIAO PHIÊN GẦN NHẤT (02/09/2026 — GHI ĐÈ mỗi phiên, không nối thêm)

🔴 **SỔ NÀY (v1) ĐÃ ĐÓNG PHẦN MÁY. Lộ trình đang chờ duyệt nằm ở `PLAN_VONG_QUAY_V2.md`.**

1. **Vừa xong:** GĐ 3→6 + gói dọn A hết phần máy — **21/26 tick**. Đã commit **cả hai repo**,
   cây sạch: app `37f54b6` · IDEA `d73a3b1`. **CHƯA push** (không repo nào có remote).

2. **Làm tiếp từ:** `PLAN_VONG_QUAY_V2.md` hạng mục **`0.1`** — đẩy repo Vòng Quay lên GitHub.
   Anh Phúc **chưa nói DUYỆT**; đừng code trước khi có chữ đó. Sổ v2 tự nó đủ chi tiết để đi.

3. **Chặn ở NGƯỜI:** duyệt lộ trình v2 · `N.2` danh mục quà thật · `N.4` xác nhận panel LCD
   ≥ 43" · `N.9` font chính thức. **Chặn ở NGOÀI:** `N.5` repo GitHub · `N.8` tư thế linh vật
   "chỉ tay vào QR".

4. **Đã đo, ĐỪNG đo lại:**
   · v1 phần máy: 200 test/18 file · e2e 5/5 · 13 route · bảng tra lệch tối đa 0,261 điểm %.
   · **Vòng Quay vốn là bản CHÉP TAY từ app đích** — mỗi file trùng mang dòng `@ 3d96358`.
     Gộp = tháo bản sao, 13 file xoá thẳng. Không phải hoà giải hai kiến trúc.
   · **CSDL Vòng Quay RỖNG** (4 KB vs 127 KB của app đích) ⇒ **không có bước di trú dữ liệu**.
   · Bộ nhận diện ở `rule/UI/` là guideline cho **IN ẤN**, không phải design system phần mềm:
     không có cỡ chữ px, không có spacing, không có quy chuẩn LCD, **cấm nền tối nặng**.
     Font chính thức thì file tự khai là **chưa có**.
   · App đích đã có sẵn thứ Vòng Quay đang thiếu: `khung-quan-tri.tsx` (mục "Vòng Quay" đang
     mờ, nhãn "sắp có"), `form-sua-chuong-trinh.tsx`, cụm lead, `scripts/chay-trung-tam.mjs`
     (tự dò IP LAN — vá luôn lỗi QR `localhost`).

5. **Cạm bẫy vừa trả giá:** năm nguyên nhân gốc từ buổi test đã truy ra tận dòng code, ghi ở
   đầu `PLAN_VONG_QUAY_V2.md` mục "VÌ SAO CÓ SỔ V2". Bài học theo miền ghi ở `app/CLAUDE.md`;
   bài học toàn hệ ghi ở `CLAUDE.md` gốc. **Đừng chép lại vào đây.**

6. **Lệnh phiên sau:** `sed -n '1,60p' PLAN_VONG_QUAY_V2.md` (đọc bối cảnh + bảng rủi ro) ·
   trong `app/`: `npm test` · `npm run dev:dienthoai`.

## BẢN ĐỒ BA GAME — cấu trúc thật trên đĩa

```
modules/GAME_SU_KIEN/                    ← MỘT module của IDEA, chứa NHIỀU app
├── app/                  🔴 APP SỐ 1 — repo github.com/hodacphuchtc/GAME_SU_KIEN
│   │                        Chứa CẢ HAI game, rẽ nhánh bằng cột chuong_trinh.tro_choi
│   ├── lib/tro-choi/          ← chỗ DUY NHẤT hai game khác nhau ở phía máy chủ
│   ├── lib/bo-dem.ts          ← lõi Trúng Số
│   ├── lib/chon-so/vong-so.ts ← lõi Chọn Số
│   └── du-lieu/game-su-kien.db
├── TRUNG_SO/ · CHON_SO/                 ← tư liệu hai game đầu
└── VONG_QUAY_MAY_MAN/    🔴 APP SỐ 2 — đứng riêng hoàn toàn
    ├── PLAN_VONG_QUAY.md                ← sổ này, nguồn lộ trình DUY NHẤT
    └── app/                             ← Next.js riêng · SQLite riêng · cổng 3200/3210
```

**Câu chốt một dòng:** GAME_SU_KIEN là **module chứa nhiều APP**, không phải một app.
Trúng Số + Chọn Số chung một app; Vòng Quay là app thứ hai.

| Thứ | Trúng Số | Chọn Số | Vòng Quay |
| --- | --- | --- | --- |
| Ứng dụng | `../app/` | `../app/` (chung) | `app/` |
| Cổng | 3111 | 3111 (chung) | **3200 / 3210** |
| Cơ sở dữ liệu | `game-su-kien.db` | chung | **riêng** |
| Cơ sở · nhân viên · khách | dùng chung | dùng chung | **cắt khỏi v1** |
| Kho quà / ngân sách | dùng chung | không dùng | **sổ riêng** |
| Ai quyết kết quả | **người bấm** | **người bấm** | 🔴 **máy** |

**Ba luật bất di bất dịch:** ① CẤM `import` xuyên giữa hai app — chép logic bằng tay, ghi
rõ nguồn. ② Cổng không được đụng nhau, hai app phải chạy song song tại quầy. ③ **Vòng Quay
hỏng thì Trúng Số vẫn phải chạy** — đây là lý do tồn tại của việc tách.

### Tiêu chí phân xử cho game thứ tư trở đi

Để lần sau khỏi cãi lại từ đầu:

- Chung danh mục (cơ sở · nhân viên · khách · kho quà) **và** chung nghĩa vụ chứng minh
  ⇒ **gộp vào `../app/`** (như Chọn Số).
- Khác bản chất *ai quyết kết quả*, **hoặc** cần nhịp phát hành riêng ⇒ **app riêng**
  (như Vòng Quay).

---

## RÀNG BUỘC TOÀN CỤC (áp cho MỌI hạng mục)

- Chữ hiển thị **Tiếng Việt 100%, đúng dấu**. Chuỗi mới thêm vào `config/locale.ts` **trước**
  khi dùng, và thêm trong CÙNG một commit với chỗ dùng (thêm trước là `locale.test.ts` đỏ).
- **Cấm hardcode màu/font** — đọc `config/thuong-hieu.ts`: tím `#6B21A8` · cam `#F97316` ·
  trắng `#FFFFFF` · font **Be Vietnam Pro**. `app/globals.css` phải khớp (Tailwind cần giá
  trị tĩnh nên hai nơi; đổi thì sửa cả hai).
- 🔴 Màu **bên trong** ảnh logo/linh vật là `#FF6F00` / `#800080` và **không bao giờ được
  sửa**: cấm `filter`, `mix-blend-mode`, `opacity < 1`, grayscale, tint.
- **Cấm hardcode hằng số nghiệp vụ** — đọc `config/vong-quay.ts`. Mọi con số phải kèm chú
  thích *vì sao chọn số đó*.
- 🔴 **Cấm `import` xuyên sang `../../app/`.** Chép logic bằng tay, ghi rõ nguồn (xem § Bảng
  chép). Import xuyên qua là dựng lại đúng thứ mà việc tách hai app sinh ra để tránh.
- **Cổng 3200/3210** — hai app phải chạy song song được tại quầy.
- Mỗi hạng mục xong: `npm test` · `npx tsc --noEmit` · `npm run lint` · `npm run build`
  XANH **rồi mới** tick. Cấm tick theo cảm giác.
- Dữ liệu phụ huynh là **dữ liệu cá nhân**: bảng công khai chỉ hiện tên rút gọn, không
  export hàng loạt ngoài mục đích đối soát.

**Khuôn hạng mục — 6 dòng.** Bốn dòng bạn yêu cầu: (a) làm gì · (b) bạn kiểm chứng bằng
thao tác nào · (c) test tự động nào chạy · (d) ước lượng. Hai dòng nữa do
`.claude/rules/workflow.md` bắt buộc với mọi mục chưa tick: **(e) chặn: `MÁY`|`NGƯỜI`|
`NGOÀI`** · **(f) phụ-thuộc**. Tick xong thì xoá dòng (e).

---

## 🔴 BẢNG RỦI RO — xếp SỚM NHẤT, không để cuối

| # | Rủi ro | Nếu xảy ra | Hạng mục dập nó |
| - | ------ | ---------- | --------------- |
| 1 | **Code chưa nằm trong repo Git nào** — `.gitignore:50` của IDEA chặn thư mục này, mà nó chưa `git init` bao giờ | Hỏng ổ cứng là mất trắng; `git checkout` nhầm cũng không cứu | **0.1** — làm đầu tiên tuyệt đối |
| 2 | **Vòng quay bị nghi chỉnh kết quả** — trò do MÁY quyết, khác hẳn Trúng Số do người bấm | Mất uy tín trước phụ huynh, không cãi được | **1.1 + 1.3** — bốc bằng góc ngẫu nhiên đều, có bài kiểm phân bố |
| 3 | **LCD và điện thoại dừng ở hai ô khác nhau** trước mặt cả sảnh | Không còn đường chối | **1.1 + 4.2** — hàm thuần của thời gian, máy chủ quyết trước |
| 4 | **Ô hết quà mà vòng vẫn vẽ** ⇒ hứa rồi không trao được | Mất mặt ngay tại quầy | **2.2** — ô hết hàng bị gỡ, phiên bản tăng |
| 5 | **Sửa ô giữa chừng làm lịch sử cũ không đọc được** | Không dựng lại được ván tranh chấp | **2.2 + 5.2** — `phien_ban_o` ghim theo từng lượt |

Ba hạng mục 🔴 nặng nhất (**1.1 · 1.2 · 1.3**) nằm trọn trong GIAI ĐOẠN 1, và GĐ 1 **không
đụng cơ sở dữ liệu** — cố ý, để rủi ro lớn nhất được chứng minh xong trước khi có bất cứ
thứ gì phức tạp bám vào.

---

## BẢY QUYẾT ĐỊNH THIẾT KẾ (nguồn của mọi hạng mục dưới đây)

| # | Quyết định | Vì sao |
| - | ---------- | ------ |
| **Đ1** | 🔴 **Bốc ô bằng GÓC NGẪU NHIÊN ĐỀU trên [0°,360°)**, ô nào chứa góc đó thì thắng | Khi ấy "cung rộng bao nhiêu thì cơ hội bấy nhiêu" không còn là luật phải giữ — nó là **đồng nhất thức toán học**. Không tồn tại con số trọng số nào để chỉnh lén, vì không có trọng số |
| **Đ2** | 🔴 **Không có ca "hết giờ".** Hàm chấm bỏ qua tham số `giay`; nếu bị truyền `hetGio = true` thì **NÉM lỗi** | Trúng Số/Chọn Số có hai lần chạm (mở rồi bấm DỪNG) nên mới có hết giờ. Vòng Quay chỉ có MỘT lần chạm. Đây là cách nó thoát cạm bẫy `Math.min/max` mà Chọn Số đã trả giá — nhưng phải chặn fail-closed để nó không quay lại |
| **Đ3** | 🔴 **Cung chốt theo PHIÊN BẢN**, không co giãn theo tồn kho từng lượt | Cung co giãn liên tục thì vòng đổi hình mỗi lượt, dựng lại ván cũ thành mơ hồ. Chốt theo phiên bản ⇒ trong một phiên bản **cung = cơ hội, đúng tuyệt đối** |
| **Đ4** | **Ô đáy (`so_luong = NULL`) nhận phần cung CÒN LẠI**, có sàn tối thiểu | Ô đáy không có số lượng hữu hạn để chia tỉ lệ. Sàn để nhãn không bao giờ mỏng tới mức không đọc được |
| **Đ5** | **Mã xác thực gieo bằng id ô + id lượt** | Chép thẳng bài học Chọn Số: hạt là chính KẾT QUẢ, nên hai người cầm hai kết quả khác nhau thì mã khác nhau, không mượn mã của nhau được |
| **Đ6** | **Một lúc MỘT lượt quay** cho mỗi chương trình | Hai lượt song song có thể cùng thấy ô cuối còn hàng rồi cùng thắng nó — mà không một test đơn lẻ nào bắt được |
| **Đ7** | **Chặn ở form TẠO nếu thiếu ô đáy** | "Cho người ta bấm rồi mới nói là tệ hơn nói trước." Rẻ hơn xử lý ca kho rỗng khi đang có phụ huynh đứng trước màn hình |

---

## MÔ HÌNH DỮ LIỆU (5 bảng, CSDL riêng `du-lieu/vong-quay.db`)

| Bảng | Vai trò | Cột đáng chú ý |
| ---- | ------- | -------------- |
| `chuong_trinh` | Một chương trình quay của một cơ sở | `ma` · `ten_co_so` · `phien_ban_o` · `tran_giai_moi_ngay` · `trang_thai` · token giữ chỗ hai màn hình |
| `o_qua` | **Một ô = một loại quà.** Vừa là kho, vừa là mặt vòng | `so_luong` (NULL = ô đáy) · `tran_moi_ngay` · `thu_tu` · `mau` · `phien_ban` |
| `luot_quay` | Đơn vị nhận giải **và** nhật ký, gộp một | `hat_giong` · `goc_dung` · `phien_ban_o` · `ma_xac_thuc` · `da_trao_thuong` · `ngay` |
| `nguoi_choi` | Hồ sơ theo SĐT chuẩn hoá | `so_dien_thoai` UNIQUE · `ho_ten` · `dong_y_tu_van` |
| `nhat_ky` | Vết thao tác quản trị | sửa ô · bật/tắt · dựng lại ván |

**Không tách `van_choi`/`luot_choi`** như Trúng Số: một lượt quay = một kết quả = một phần
quà. Tách là đẻ bảng thừa.

---

## BẢNG CHÉP CÓ CHỦ ĐÍCH — 19 file, ~1.705 dòng, nguồn `3d96358`

Luật cấm `import` xuyên app, nên tối ưu **không phải** chia sẻ mã mà là **chép đúng thứ
đáng chép, có dấu vết**. Các file này không thuộc game nào, đã qua 501 test + 20 kịch bản
e2e, và mỗi cái mang sẵn một vết sẹo đã vá.

| Chép từ `../../app/` | Dòng | Vết sẹo nó mang sẵn |
| --- | --- | --- |
| `lib/db/ket-noi.ts` · `nang-cap.ts` | 66 · 225 | Mở `DatabaseSync` vào đường dẫn không tồn tại là **TẠO tệp rỗng** — app vẫn chạy mà trắng trơn |
| `lib/dong-bo/tram-phat.ts` · `kenh.ts` · `dong-ho.ts` | 68 · 113 · 72 | SSE phải giữ ở `globalThis`, `next dev` nạp lại module là mất sạch người đang nghe |
| `lib/bao-ve/mat-khau.ts` · `phien-quan-tri.ts` · `proxy.ts` | 61 · 114 · 41 | Cookie chỉ bật `secure` khi THẬT SỰ HTTPS; và tệp chắn tên `proxy.ts`, **không phải** `middleware.ts` |
| `lib/ma-xac-thuc.ts` | 40 | Mã 60 giây đã dùng thật tại quầy |
| `lib/qua/chon-qua.ts` · `canh-bao.ts` | 65 · 56 | Ngưỡng cảnh báo phải là `max(1, tỉ_lệ × tổng)`, thuần tỉ lệ thì kho nhỏ nhảy thẳng xanh → đỏ |
| `lib/nguoi-choi/so-dien-thoai.ts` · `nhan-dien.ts` | 37 · 102 | Chuẩn hoá SĐT + luật 1 lượt/ngày |
| `lib/xuat/zip.ts` · `xlsx.ts` | 125 · 202 | Bộ ghi XLSX tự viết, **không thêm một thư viện nào** |
| `tests/locale.test.ts` · `thuong-hieu.test.ts` · `ho-tro/csdl-tam.ts` | 58 · 77 · 20 | Bắt khoá locale mồ côi và màu hardcode — thứ mắt người không bắt |
| `scripts/sao-luu.mjs` | 163 | `VACUUM INTO` xoay vòng 14 bản |

**Luật chép** (thứ giữ hai bản khỏi âm thầm lệch nhau):

1. Mỗi file chép mang **dòng đầu bắt buộc**:
   `// Chép từ GAME_SU_KIEN/app/<đường dẫn> @ 3d96358. Sửa gì so với bản gốc: <...>`
2. Một **bảng trong `app/CLAUDE.md`** liệt kê 19 file + commit nguồn. Khi Trúng Số vá lỗi ở
   file có tên trong bảng, người vá biết còn một bản nữa phải soi.
3. **Chỉ chép file đã ổn định.** File nào bên kia còn đang sửa thì đợi.

---

# LỘ TRÌNH

## GIAI ĐOẠN 0 — Cứu code vào Git + khung chạy được (0,5 ngày)

**🏁 DEMO cuối GĐ:** bạn mở `http://<IP LAN>:3200` **trên điện thoại của mình**, bấm nút cam
"Bấm thử", thấy dòng chữ dưới đổi thành *"Đã bấm 1 lần — JavaScript chạy tốt."*

- [x] **0.1 — 🔴 Đưa code vào Git (LÀM ĐẦU TIÊN TUYỆT ĐỐI)** ✅ (ce4d012)
  - (a) `git init` trong `VONG_QUAY_MAY_MAN/app/`; `.gitignore` của repo con che
    `node_modules/` `.next/` `du-lieu/` `sao-luu/` `.env*` `logs/` `*.tsbuildinfo`; quét
    `gitleaks detect --no-git`; **một commit local**. Giữ nguyên `.gitignore:50` của IDEA —
    đúng tiền lệ app Trúng Số là repo độc lập lồng trong IDEA.
  - (b) Bạn gõ `cd modules/GAME_SU_KIEN/VONG_QUAY_MAY_MAN/app && git log --oneline` thấy
    đúng 1 commit, và `git status --short` **rỗng**. Gõ `git ls-files | grep node_modules`
    phải **không ra dòng nào**.
  - (c) Chưa có test — đây là thao tác hạ tầng. Cổng kiểm là `gitleaks` sạch.
  - (d) 0,25 ngày.
  - (f) phụ-thuộc: không

- [x] **0.2 — Nghiệm thu khung trên điện thoại thật** ✅ (nghiệm thu tay 02/09/2026)
  - (a) Chạy `npm run dev:dienthoai`, đọc IP LAN, đưa bạn địa chỉ. Không sửa code trừ khi
    hỏng.
  - (b) Bạn mở `http://<IP LAN>:3200` **trên điện thoại**, bấm "Bấm thử", chữ phải đổi.
    🔴 Bấm mà không đổi = `allowedDevOrigins` khai sai — trang vẫn mở, giao diện vẫn đẹp,
    không một dòng lỗi, mà app coi như chết. `curl` trả 200 **không** thay được bước này.
  - (c) `npm test` (2 ca locale) · `npx tsc --noEmit` · `npm run lint` · `npm run build`.
  - (d) 0,25 ngày.
  - (f) phụ-thuộc: 0.1

---

## GIAI ĐOẠN 1 — 🔴 Vòng quay công bằng, nhìn thấy được (1,5 ngày)

> Giai đoạn rủi ro cao nhất, cố ý xếp SỚM NHẤT và **không đụng cơ sở dữ liệu**. Hết GĐ này
> bạn đã có một vòng quay bấm được và một bằng chứng số học rằng nó công bằng — trước khi
> bất cứ thứ gì phức tạp bám vào.

**🏁 DEMO cuối GĐ:** bạn mở `http://localhost:3200/thu`, bấm QUAY, vòng quay chạy chậm dần
rồi dừng ở một ô; bấm thêm 20 lần thấy ô to trúng nhiều hơn ô nhỏ đúng như mắt nhìn.

- [x] **1.1 — 🔴 Lõi quay: hàm thuần của thời gian + bốc ô bằng góc đều** ✅ (2367ff5)
  - (a) `lib/vong-quay/goc.ts` — `goc(t, gocDich, thoiLuong)` easing giảm dần, quay ít nhất
    N vòng trọn rồi dừng; `bocGoc(hatGiong)` rút góc **ngẫu nhiên đều** [0,360) (Đ1);
    `oTaiGoc(cungList, goc)` tra ô chứa góc. `lib/vong-quay/chia-o.ts` — chia cung theo cơ
    cấu phiên bản (Đ3), ô đáy nhận phần còn lại có sàn (Đ4). `config/vong-quay.ts` giữ mọi
    hằng số, mỗi số kèm chú thích *vì sao*.
  - (b) Chưa bấm được gì — kiểm chứng ở 1.2. Bạn có thể đọc `config/vong-quay.ts` và thấy
    mỗi con số đều có một câu giải thích vì sao là số đó.
  - (c) `tests/goc.test.ts`: `goc(0) = 0` và `goc(thoiLuong) = gocDich` · đơn điệu, không
    giật lùi · cùng `hatGiong` cho cùng góc (dựng lại được) · `oTaiGoc` luôn trả đúng ô
    chứa góc, quét 10.000 hạt. `tests/chia-o.test.ts`: tổng cung luôn = 360° · ô đáy không
    bao giờ mỏng dưới sàn · kho chỉ còn ô đáy thì có đúng 1 cung 360°.
  - (d) 0,75 ngày.
  - (f) phụ-thuộc: 0.2

- [x] **1.2 — 🔴 Vẽ vòng SVG + trang thử bấm được** ✅ (9914119 · nghiệm thu tay 02/09/2026)
  - (a) `components/vong-quay.tsx` vẽ cung SVG + kim + nhãn, quay bằng
    `requestAnimationFrame` gọi `goc(t)`. Trang `app/thu/page.tsx` với 6 ô cắm cứng và nút
    QUAY. **Chưa có CSDL, chưa có máy chủ** — thuần trình duyệt.
  - (b) Bạn mở `http://localhost:3200/thu`, bấm **QUAY**: vòng phải chạy nhanh rồi **chậm
    dần** và dừng hẳn ở một ô, kim chỉ rõ ràng vào ô đó. Bấm liên tiếp 5 lần, mỗi lần dừng
    một chỗ khác nhau. Nhìn kỹ: **ô nào cung rộng hơn thì rõ ràng hay trúng hơn**.
  - (c) `npm run lint` + `npm run build` xanh; test của 1.1 vẫn xanh.
  - (d) 0,5 ngày.
  - (f) phụ-thuộc: 1.1

- [x] **1.3 — 🔴 Bài kiểm CÔNG BẰNG (bằng chứng chống nghi ngờ chỉnh kết quả)** ✅ (cd6e0b6)
  - (a) `tests/cong-bang.test.ts` quay 100.000 lượt bằng hạt ngẫu nhiên thật, đếm phân bố
    theo ô, so với tỉ lệ cung. Thêm `scripts/in-bang-tra.mjs` in bảng đối chiếu
    *cung (%) ↔ trúng thực tế (%)* ra màn hình.
  - (b) Bạn gõ `node scripts/in-bang-tra.mjs`, đọc bảng: cột "cung %" và cột "trúng %" phải
    khớp nhau tới **dưới 1%** ở mọi ô. Đây là thứ bạn đưa ra khi có người hỏi *"vòng quay có
    bị chỉnh không"*.
  - (c) `tests/cong-bang.test.ts`: sai lệch mọi ô < 1% với 100.000 lượt; và một ca **cố ý
    hỏng** — nếu ai đó nhét trọng số vào thì test phải ĐỎ.
  - (d) 0,25 ngày.
  - (f) phụ-thuộc: 1.2

---

## GIAI ĐOẠN 2 — Kho ô quà thật, khai được qua giao diện (1,25 ngày)

**🏁 DEMO cuối GĐ:** bạn đăng nhập trang quản trị, tạo một chương trình với 6 ô quà thật,
thấy vòng quay vẽ đúng 6 ô đó; sửa số lượng một ô về 0 rồi tải lại — **ô đó biến mất**, các
ô còn lại chia lại vòng tròn.

- [x] **2.1 — Lược đồ 5 bảng + chép hạ tầng CSDL** ✅ (fe62daa)
  - (a) Chép `lib/db/ket-noi.ts` + `nang-cap.ts` (kèm dòng ghi nguồn `@ 3d96358`), viết
    `lib/db/luoc-do.ts` 5 bảng theo § Mô hình dữ liệu. Chép `tests/ho-tro/csdl-tam.ts`.
    🔴 `luoc-do.ts` là **hình dạng NGUYÊN THUỶ**; mọi cột thêm sau chỉ sống trong
    `COT_BO_SUNG` của `nang-cap.ts` — thêm vào cả hai file là dựng hai nguồn sự thật.
  - (b) Bạn chạy `npm start`, thấy tệp `du-lieu/vong-quay.db` sinh ra; tắt rồi mở lại,
    tệp còn nguyên, không bị ghi đè.
  - (c) `tests/db.test.ts`: nâng cấp chạy **hai lần** không hỏng gì · mở CSDL vào đường dẫn
    không tồn tại **không** tạo tệp rỗng (4 ca canh vết sẹo đã chép).
  - (d) 0,5 ngày.
  - (f) phụ-thuộc: 1.3

- [x] **2.2 — Kho ô quà + phiên bản + gỡ ô hết hàng** ✅ (b4f1e55 · nghiệm thu tay 02/09/2026)
  - (a) `lib/o-qua/kho.ts` (MỌI câu SQL của bảng `o_qua` nằm đúng ở đây). Chép
    `lib/qua/chon-qua.ts` + `canh-bao.ts`. Nối `chia-o.ts` với ô còn hàng: ô hết hàng bị
    gỡ và **`phien_ban` tăng** (Đ3). Cảnh báo sắp hết dùng ngưỡng `max(1, tỉ_lệ × tổng)`.
  - (b) Bạn sửa số lượng một ô về 0, tải lại trang thử — ô đó **biến mất**, vòng chia lại.
    Xem cột `phien_ban` trong trang quản trị thấy nó **tăng thêm 1**.
  - (c) `tests/o-qua.test.ts`: bảng tra bốc ô (hết loại 1 sang loại 2 · chỉ còn ô đáy ·
    trần theo ngày chặn đúng) · sửa ô của chương trình đang chạy làm `phien_ban` tăng ·
    ngưỡng cảnh báo bật dải vàng với kho 4 cái (ca mà thuần tỉ lệ chết lặng).
  - (d) 0,5 ngày.
  - (f) phụ-thuộc: 2.1

- [x] **2.3 — Form tạo chương trình + chặn thiếu ô đáy** ✅ (2caa5a2 · nghiệm thu tay 02/09/2026)
  - (a) `app/quan-tri/tao/page.tsx` + `app/actions/chuong-trinh.ts`: khai tên cơ sở, trần
    giải/ngày, danh sách ô (tên · số lượng · trần/ngày · màu · thứ tự). 🔴 Chặn lưu khi
    **không có ô nào `so_luong` để trống** (Đ7), kèm câu giải thích tiếng Việt. Dùng ô **có
    kiểm soát** cho mọi input — React dọn form sau mỗi server action.
  - (b) Bạn tạo một chương trình 6 ô, thấy nó hiện trong danh sách kèm mã và QR. Rồi thử
    tạo một cái **không khai ô nào không giới hạn** — phải bị chặn kèm câu giải thích, chứ
    không phải lỗi kỹ thuật khó hiểu.
  - (c) `tests/tao-chuong-trinh.test.ts`: tạo thiếu ô đáy bị chặn · tên ô trùng bị chặn ·
    tạo hợp lệ sinh đúng số ô với `phien_ban = 1`.
  - (d) 0,25 ngày.
  - (f) phụ-thuộc: 2.2

---

## GIAI ĐOẠN 3 — Chơi thật một mình trên điện thoại (1,25 ngày)

**🏁 DEMO cuối GĐ:** bạn quét QR bằng điện thoại, nhập họ tên + số điện thoại, bấm QUAY,
nhận kết quả kèm mã xác thực; quay lần hai cùng số điện thoại trong ngày thì **bị từ chối
kèm lý do rõ ràng**.

- [x] **3.1 — Khoá cửa trang quản trị** ✅
  - (a) Chép `lib/bao-ve/mat-khau.ts` + `phien-quan-tri.ts` + `proxy.ts`. 🔴 Tệp chắn tên
    **`proxy.ts`**, KHÔNG phải `middleware.ts` — Next 16 đã đổi tên, đặt sai thì tệp không
    bao giờ chạy, trang quản trị mở toang, **không một dòng lỗi nào**. Một mật khẩu duy
    nhất qua `VONG_QUAY_KHOA_PHIEN` (≥ 32 ký tự, thiếu thì từ chối mọi phiên).
  - (b) Bạn đăng xuất rồi gõ thẳng `http://localhost:3200/quan-tri` — phải bị đá về trang
    đăng nhập. Đăng nhập lại trên **IP LAN (http, không https)** phải vào được và **không
    bị đá ra** (cookie `secure` bật nhầm ở LAN là trình duyệt lặng lẽ vứt cookie).
  - (c) `tests/bao-ve.test.ts`: cookie giả/hết hạn bị từ chối · thiếu khoá phiên thì mọi
    phiên bị từ chối · cookie **không** bật `secure` khi chạy HTTP.
  - (d) 0,5 ngày.
  - (f) phụ-thuộc: 2.3

- [x] **3.2 — Nhận diện người chơi + 1 lượt/ngày** ✅
  - (a) Chép `lib/nguoi-choi/so-dien-thoai.ts` + `nhan-dien.ts`. Trang `app/choi/[ma]/`:
    form họ tên + SĐT + ô đồng ý tư vấn (tách riêng), ô **có kiểm soát**.
  - (b) Bạn mở link chơi, nhập tên + SĐT, thấy màn hình chuyển sang nút QUAY. Thoát ra vào
    lại bằng cùng SĐT trong ngày — phải bị từ chối kèm câu nói rõ *vì sao*.
  - (c) `tests/nhan-dien.test.ts`: `0912345678` và `+84912345678` là **một người** · nhập
    lần hai trong ngày bị chặn · sang ngày mới thì mở lại.
  - (d) 0,25 ngày.
  - (f) phụ-thuộc: 3.1

- [x] **3.3 — 🔴 Server action QUAY: bốc ô, ghi lượt, một-lúc-một-lượt** ✅
  - (a) `app/actions/quay.ts`: kiểm một-lúc-một-lượt (Đ6) → bốc góc bằng
    `crypto.getRandomValues` → tra ô → sinh mã xác thực gieo bằng id ô + id lượt (Đ5) → ghi
    `luot_quay` kèm `hat_giong`, `goc_dung`, `phien_ban_o` trong **MỘT giao dịch**. 🔴 Hàm
    chấm **bỏ qua `giay`**; nhận `hetGio = true` thì **NÉM lỗi** (Đ2). Chép
    `lib/ma-xac-thuc.ts`.
  - (b) Bạn bấm QUAY trên điện thoại, thấy tên phần quà + mã xác thực. Mở trang quản trị
    thấy đúng lượt đó trong lịch sử với đúng ô. Mở **hai điện thoại cùng lúc** bấm QUAY —
    máy thứ hai phải bị từ chối, không phải cùng thắng một ô.
  - (c) `tests/quay.test.ts`: hai lượt song song chỉ ghi **một** dòng · `hetGio = true` ném
    lỗi chứ không chấm · cùng `hat_giong` + cùng `phien_ban_o` cho cùng ô · mã xác thực của
    hai kết quả khác nhau thì khác nhau.
  - (d) 0,5 ngày.
  - (f) phụ-thuộc: 3.2

---

## GIAI ĐOẠN 4 — Hai màn hình khớp nhau (1,0 ngày)

**🏁 DEMO cuối GĐ:** bạn mở màn LCD trên máy tính, quét QR bằng điện thoại, bấm QUAY —
**cả hai màn hình cùng quay và cùng dừng ở một ô**, không lệch.

- [x] **4.1 — Kênh đồng bộ + đo lệch đồng hồ** ✅
  - (a) Chép `lib/dong-bo/tram-phat.ts` + `kenh.ts` + `dong-ho.ts` và route `/api/gio`.
    🔴 Trạm phát giữ ở `globalThis`. 🔴 **Đừng bật `trailingSlash`** — nó khiến `/api/gio`
    bị chuyển 308, thêm một lượt đi–về vào đúng phép đo độ lệch đồng hồ.
  - (b) Bạn mở `http://localhost:3200/api/gio` thấy JSON có mốc thời gian máy chủ, và
    **không** bị chuyển hướng (thanh địa chỉ giữ nguyên, không thêm dấu `/`).
  - (c) `tests/dong-ho.test.ts`: tính lệch đúng với độ trễ giả lập · `tests/tram-phat.test.ts`:
    người nghe mới nhận được tin, người ngắt kết nối được dọn.
  - (d) 0,25 ngày.
  - (f) phụ-thuộc: 3.3

- [x] **4.2 — 🔴 Màn LCD + điện thoại là nút QUAY** ✅
  - (a) `app/man-hinh/[ma]/page.tsx` (LCD: QR chờ + vòng quay to) và nối
    `components/vong-quay.tsx` vào cả hai màn. Máy chủ phát `(gocDich, thoiLuong,
    phienBanO, danhSachCung)`; **mỗi máy tự chạy `goc(t)`**, không truyền từng khung hình.
    Màn hình vào giữa chừng thì nhảy thẳng tới `goc(bây giờ − bắt đầu)`.
  - (b) Bạn mở LCD trên máy tính, quét QR bằng điện thoại, bấm QUAY. **Nhìn cả hai màn cùng
    lúc**: vòng phải quay song song và dừng ở **cùng một ô**. Thử tải lại trang LCD giữa
    lúc đang quay — nó phải bắt kịp đúng chỗ, không quay lại từ đầu.
  - (c) Playwright qua skill `webapp-testing` (đừng thêm dep): hai trình duyệt, ô trúng
    khớp từng chữ · tải lại LCD giữa ván vẫn ra đúng ô.
  - (d) 0,75 ngày.
  - (f) phụ-thuộc: 4.1

---

## GIAI ĐOẠN 5 — Sổ sách, tra soát, dựng lại ván (1,0 ngày)

**🏁 DEMO cuối GĐ:** bạn mở lịch sử, bấm **"Dựng lại"** một ván quay từ hôm trước và thấy
đúng vòng quay của lúc đó — kể cả ô nay đã hết hàng — với kim dừng đúng chỗ cũ.

- [x] **5.1 — Lịch sử + đánh dấu đã trao thưởng** ✅
  - (a) `app/quan-tri/chuong-trinh/[ma]/page.tsx`: bảng giờ · tên rút gọn · **ô trúng** ·
    mã xác thực · ô tích *đã trao thưởng*. Dải cảnh báo sắp hết ô hiện ở **cả** danh sách
    lẫn trang chi tiết.
  - (b) Bạn chơi 3 ván rồi mở lịch sử, thấy đủ 3 dòng đúng thứ tự; tích ô "đã trao thưởng"
    một dòng, tải lại trang thấy dấu tích **còn nguyên**.
  - (c) `tests/lich-su.test.ts`: đếm đúng số dòng · tên rút gọn không lộ họ tên đầy đủ ·
    tích rồi tải lại vẫn giữ.
  - (d) 0,25 ngày.
  - (f) phụ-thuộc: 4.2

- [x] **5.2 — 🔴 Dựng lại ván đã quay** ✅
  - (a) `app/quan-tri/chuong-trinh/[ma]/dung-lai/[luot]/page.tsx`: đọc `hat_giong` +
    `phien_ban_o` + `goc_dung`, vẽ lại **đúng cơ cấu ô của phiên bản đó** và quay tới đúng
    góc cũ.
  - (b) Bạn sửa danh sách ô (thêm/bớt một ô), rồi bấm "Dựng lại" một ván quay **trước** khi
    sửa — vòng hiện ra phải là vòng **CŨ**, không phải vòng mới, và kim dừng đúng ô cũ.
  - (c) `tests/dung-lai.test.ts`: dựng lại 100 lượt cho ra đúng `goc_dung` đã lưu · sửa ô
    rồi dựng lại lượt cũ vẫn ra cơ cấu cũ.
  - (d) 0,5 ngày.
  - (f) phụ-thuộc: 5.1

- [x] **5.3 — Xuất Excel + sao lưu tự động** ✅
  - (a) Chép `lib/xuat/zip.ts` + `xlsx.ts` + `scripts/sao-luu.mjs`. Route
    `app/api/xuat/[ma]/route.ts`. `npm run sao-luu` chạy `VACUUM INTO` xoay vòng 14 bản.
  - (b) Bạn bấm "Xuất Excel" trên trang chi tiết, **mở tệp tải về bằng Excel hoặc Numbers**
    — phải mở được, đúng cột, tiếng Việt đủ dấu. Chạy `npm run sao-luu` thấy tệp sao lưu
    sinh ra trong `sao-luu/`.
  - (c) `tests/xuat.test.ts`: tệp sinh ra là ZIP hợp lệ, có đủ số dòng ·
    `tests/sao-luu.test.ts`: bản sao mở được và đếm đủ dòng như bản gốc.
  - (d) 0,25 ngày.
  - (f) phụ-thuộc: 5.2

---

## GIAI ĐOẠN 6 — Thương hiệu, âm thanh, nghiệm thu (1,25 ngày)

**🏁 DEMO cuối GĐ:** bạn đứng cách màn hình LCD 3 mét, chơi trọn một ván, nghe tiếng tick
chậm dần theo vòng quay và tiếng ăn mừng khi dừng, thấy logo Sata Robo đúng màu gốc.

- [x] **6.1 — Âm thanh tự tổng hợp** ✅
  - (a) `lib/am-thanh.ts` bằng Web Audio: tick chậm dần đúng nhịp vòng quay, tiếng ăn mừng
    khi dừng. **Không dùng tệp nhạc** — kho nhạc sẵn có ngoài kia đều là tác phẩm có bản
    quyền. Có nút tắt tiếng.
  - (b) Bạn chơi một ván trên LCD có loa: tiếng tick phải **chậm dần khớp với vòng quay**,
    không phải chạy đều rồi cắt đột ngột. Bấm nút tắt tiếng thì im hẳn.
  - (c) `tests/am-thanh.test.ts`: nhịp tick là hàm giảm dần theo thời gian, khớp `goc(t)`.
  - (d) 0,5 ngày.
  - (f) phụ-thuộc: 4.2

- [x] **6.2 — Nhận diện Sata Robo lên hai màn hình** ✅
  - (a) `components/nhan-dien-sata.tsx`: logo + linh vật + câu định vị, luật khoảng thở
    sống ở đúng một chỗ. Chép `tests/thuong-hieu.test.ts`.
  - (b) Bạn nhìn màn LCD từ 3 mét: logo rõ, **không bị bóp méo, không đổi màu**, không có
    hiệu ứng nào chạy xuyên qua nó.
  - (c) `tests/thuong-hieu.test.ts`: không file nào áp `filter`/`opacity`/`mix-blend-mode`
    lên ảnh nhận diện · không màu nào hardcode ngoài `config/thuong-hieu.ts`.
  - (d) 0,25 ngày.
  - (f) phụ-thuộc: 6.1

- [ ] **6.3 — Nghiệm thu bằng mắt + bộ e2e** *(phần MÁY xong — bộ e2e 5/5 xanh; còn chờ nghiệm thu tay với danh mục quà thật `N.2`)*
  - (a) Chép bộ chạy e2e (kèm bản vá **chờ cổng trống hẳn** trước khi mở máy chủ mới). Viết
    6 kịch bản: chơi trọn ván · một-lúc-một-lượt · ô hết hàng biến mất · dựng lại ván · 1
    lượt/SĐT/ngày · chắn trang quản trị. Chạy trọn kịch bản với **danh mục quà thật**, chụp
    ảnh từng bước.
    ✅ **ĐÃ LÀM (02/09):** bộ chạy `tests/e2e/chay.mjs` + **5 tệp kịch bản** bao trọn 6 nội
    dung trên — `gd42-hai-man-hinh` gộp *chơi trọn ván* và *1 lượt/SĐT/ngày* vì hai thứ đó
    nằm trên cùng một mạch bấm; tách ra chỉ để cho đủ con số 6 là chạy hai lần cùng một
    đường. `gd63-chan-quan-tri` · `gd64-o-het-hang` · `gd65-mot-luot-mot-luc` ·
    `gd66-dung-lai-van`. **Còn thiếu:** chạy với danh mục quà THẬT và bộ ảnh chụp — cả hai
    chờ `N.2`.
  - (b) Bạn xem bộ ảnh và **tự bấm lại được kịch bản đó từ đầu**. Quay tới khi một loại quà
    hết hàng, đối chiếu số quà đã trao trong bảng với số đếm tay — phải khớp.
  - (c) `npm run e2e` **6/6 xanh**; toàn bộ `npm test` · `npx tsc --noEmit` · `npm run lint`
    · `npm run build` xanh. 🔴 Đừng chạy `npm run e2e` hai lượt liên tiếp — lượt sau khởi
    động khi lượt trước chưa dọn xong, đụng cổng và báo hỏng những kịch bản hoàn toàn đúng.
  - (d) 0,5 ngày.
  - (e) chặn: NGƯỜI — cần `N.2` (danh mục quà thật) mới nghiệm thu được.
  - (f) phụ-thuộc: 6.2, 5.3

---

## KHÔNG LÀM Ở PHIÊN BẢN NÀY (cố ý)

| Không làm | Vì sao |
| --------- | ------ |
| **Cơ sở · nhân viên đa vai trò · khách tiềm năng · chia luân phiên · nhật ký truy cập** | ~4 ngày cho thứ v1 chưa dùng tới. Một mật khẩu quản trị là đủ cho một máy đặt ở quầy. Mở ở v2 khi đã biết có ai dùng |
| **Trọng số ẩn cho từng ô** | Đ1 — bốc bằng góc ngẫu nhiên đều thì không tồn tại trọng số để mà chỉnh. Thêm trọng số là phá chính bằng chứng công bằng |
| **Ván nhiều lần quay** | Quay 2 lần không có lần nào "tốt hơn". Một lượt = một kết quả = một phần quà |
| **Chế độ online** (điện thoại tự vẽ vòng, không cần LCD) | v1 làm chế độ tại quầy cho xong đã. Online còn kéo theo bài toán xác thực SĐT |
| **Link chia sẻ · mã nhúng iframe · ảnh og:image** | Đòi máy chủ công khai ra Internet — đảo quyết định "tự chứa". Bàn sau khi có VPS |
| **Kho nhạc có sẵn kiểu các trang vòng quay ngoài kia** | Toàn tác phẩm có bản quyền. Tự tổng hợp bằng Web Audio (6.1) |
| **Hiệu ứng nền động (tuyết, bong bóng), CSS tuỳ biến tự do** | Trang trí, không giải nỗi đau nào. CSS tự do còn là cửa chèn mã tuỳ ý |
| **Bốc thăm gọi tên trước đám đông từ danh sách lớn** | Là một nghề khác, cần thiết kế riêng. Ghi vào v2 |
| **Tài khoản người chơi, gói trả phí, coupon, quảng cáo** | Công cụ nội bộ, không bán |
| **Nhiều máy chủ / scale ngang** | SQLite một-người-ghi, trạm phát là Map trong bộ nhớ. Một tiến trình duy nhất |

---

## GÓI DỌN — kéo sổ sách toàn dự án về khớp đĩa (0,5 ngày)

Làm SAU khi GĐ 1 xong, TRƯỚC khi GĐ 2 đẻ thêm file. Không đụng `../app/` của Trúng Số.

- [x] **A.1 — ADR-010: chốt kiến trúc đứng riêng thành văn bản** ✅
  - (a) Tạo `docs/decisions/ADR-010-vong-quay-dung-rieng.md` theo khuôn ADR, nội dung là
    mục "Bản đồ ba game" + "Tiêu chí phân xử" ở trên, kèm bằng chứng đã cân nhắc phương án
    gộp (Chọn Số thêm game thứ hai chỉ tốn 16 file trên tổng 171) mà vẫn chọn tách.
    **`ADR-005` chỉ sửa dòng trạng thái + một dòng trỏ sang ADR-010**, không viết lại thân
    bài — ADR đã chốt thì để nguyên làm dấu vết, cái mới đè lên cái cũ.
    `.claude/scaffold.json`: `adrCount` 9 → 10.
  - (b) Bạn mở `docs/decisions/` thấy ADR-010, và ADR-005 có một dòng trỏ sang nó.
  - (c) `node scripts/check-structure.mjs` → exit 0, đếm đúng **10 ADR**.
  - (d) 0,25 ngày.
  - (f) phụ-thuộc: 1.3

- [x] **A.2 — Kéo 4 file não về khớp đĩa** ✅
  - (a) `GAME_SU_KIEN/OVERVIEW.md` (còn tiêu đề *"Module DEM_SO"*, thiếu Vòng Quay trong
    bảng cấu trúc) · `module.config.json` (`vong-quay-may-man` còn `"sap-co"`, và `_ghiChu`
    đang khẳng định *"MỘT app chứa NHIỀU game"*) · `PLAN.md` gốc (trỏ sang sổ này) ·
    `CLAUDE.md` gốc (bảng QUYẾT ĐỊNH thêm dòng đứng riêng; gỡ mục "🔴 CẦN QUYẾT" đã quyết
    xong). **Xoá bản `PLAN_VONG_QUAY.md` trùng ở thư mục cha.**
  - (b) Bạn chạy lệnh soi ở mục Kiểm chứng số 5, kết quả phải **rỗng**.
  - (c) `node scripts/check-structure.mjs` → exit 0.
  - (d) 0,25 ngày.
  - (f) phụ-thuộc: A.1

---

## VIỆC CỦA NGƯỜI — mở ngay từ ngày 1, đừng để chặn cuối lộ trình

- [ ] **N.1 — 🔴 Hỏi luật về khuyến mại may rủi (NĐ 81/2018).** Nặng hơn Trúng Số: người
      chơi bấm nút còn cãi được là trò kỹ năng, **vòng quay thì không** — nó là may rủi
      thuần. Chặn việc CHẠY QUẢNG CÁO, không chặn code.
  - (e) chặn: NGƯỜI — cần một câu trả lời pháp lý, không phải một dòng code.
- [ ] **N.2 — Danh mục quà thật:** tên · số lượng · trần mỗi ngày · **ít nhất một loại
      không giới hạn** làm ô đáy. Chặn nghiệm thu `6.3`.
  - (e) chặn: NGƯỜI — chỉ trung tâm biết mình có quà gì và bao nhiêu cái.
- [x] **N.3 — Hai tệp ảnh nhận diện** (logo + linh vật) ✅ *(02/09 — KHÔNG còn chặn `6.2`)*
  - Hoá ra **không phải đi xin**: cả hai tệp đã có sẵn trong app Trúng Số, gồm cả bản linh
    vật **đã tách nền** (`linh-vat-sata-robo-nen-trong.png`) — đúng bản đã trả giá để làm ra.
    Đã chép sang `app/public/thuong-hieu/` kèm `config/tai-san.ts` ghi rõ nguồn.
  - 🔴 Việc CÒN LẠI cho người: xác nhận đây đúng là **bản chính thức mới nhất** của bộ nhận
    diện. Nếu chủ thương hiệu đã đổi logo sau 01/09/2026 thì phải thay hai tệp này.
- [ ] **N.4 — Chốt số ô đọc được ở 3–5 mét** trên đúng cái màn hình LCD sẽ dùng. Đoán bừa
      là làm lại phần vẽ.
  - (e) chặn: NGƯỜI — phải đứng trước màn hình thật mà đo, máy không đo hộ được.
- [ ] **N.5 — Repo GitHub cho app Vòng Quay.** Trước khi có nó, code chỉ sống trong một
      commit local trên đúng cái ổ cứng đang giữ bản gốc — cùng một điểm hỏng.
  - (e) chặn: NGOÀI — cần một repo trống dưới tài khoản `hodacphuchtc`.

---

## TỔNG KẾT

| Giai đoạn | Kết thúc bằng | Ngày công |
| --------- | ------------- | --------- |
| **0** — Cứu code + khung | Bấm được nút trên điện thoại thật | 0,5 |
| **1** — 🔴 Vòng quay công bằng | Bấm QUAY thấy vòng chạy; bảng tra chứng minh công bằng | 1,5 |
| **2** — Kho ô quà | Tạo chương trình 6 ô; ô hết hàng biến mất | 1,25 |
| **3** — Chơi thật | Quét QR, nhập SĐT, quay, nhận mã xác thực | 1,25 |
| **4** — Hai màn hình | LCD và điện thoại dừng cùng một ô | 1,0 |
| **5** — Sổ sách | Bấm "Dựng lại" ra đúng vòng quay cũ | 1,0 |
| **6** — Thương hiệu + nghiệm thu | Đứng cách LCD 3m chơi trọn ván | 1,25 |
| | **Tổng** | **7,75 ngày** |

**Điểm DỪNG BẮT BUỘC chờ duyệt:** đẩy code lên GitHub (`N.5`) · đưa máy ra quầy phục vụ
phụ huynh thật · bất cứ việc nào phát sinh ngoài lộ trình này.

**Ba hạng mục 🔴 nặng nhất — 1.1, 1.2, 1.3 — nằm trọn trong GIAI ĐOẠN 1** và không đụng cơ
sở dữ liệu. Hết ngày thứ hai bạn đã có một vòng quay bấm được cùng bằng chứng số học rằng
nó công bằng. Nếu thiết kế sai, ta biết ngay lúc đó, khi chưa có gì bám vào.
