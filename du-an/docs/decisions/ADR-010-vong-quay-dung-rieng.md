# ADR-010 — Vòng Quay May Mắn đứng riêng: app riêng, CSDL riêng, cổng riêng, repo riêng

- **Ngày:** 02/09/2026
- **Trạng thái:** Đã chốt — 🔴 **BỊ ĐẢO** bởi `ADR-011` (02/09/2026, chiều cùng ngày)
- **Đọc kèm:** [`ADR-011`](ADR-011-gop-vong-quay.md) — Vòng Quay gộp vào app GAME_SU_KIEN. Lập luận của ADR này (nghĩa vụ chứng minh khác bản chất) vẫn đúng, nhưng nó thua bốn yêu cầu vận hành anh Phúc nêu sau buổi test thật. **Mệnh đề "Vòng Quay hỏng thì Trúng Số vẫn chạy" KHÔNG còn hiệu lực.**
- **Quan hệ:** **ĐẢO MỘT PHẦN `ADR-005`** ("một app chứa nhiều game"). ADR-005 vẫn đúng cho
  Trúng Số + Chọn Số; nó KHÔNG còn là luật chung cho mọi game.
- **Bối cảnh:** game thứ ba **VÒNG QUAY MAY MẮN**, lộ trình
  `modules/GAME_SU_KIEN/VONG_QUAY_MAY_MAN/PLAN_VONG_QUAY.md`

## Bối cảnh

`ADR-005` chốt ngày 01/09/2026: **một ứng dụng Next.js chứa nhiều game**, phân biệt bằng cột
`chuong_trinh.tro_choi`. Game thứ hai — **Chọn Số** — đi đúng theo đó và chứng minh nó rẻ
(xem § "Phương án bị loại"). Câu hỏi lặp lại khi tới game thứ ba: Vòng Quay May Mắn có gộp
tiếp vào `modules/GAME_SU_KIEN/app/` không?

Điểm khác biệt lộ ra ngay khi so ba game bằng đúng MỘT câu hỏi — *ai quyết kết quả?*

| Thứ | Trúng Số | Chọn Số | Vòng Quay |
| --- | -------- | ------- | --------- |
| Ứng dụng | `app/` | `app/` (chung) | `VONG_QUAY_MAY_MAN/app/` |
| Cổng | 3111 | 3111 (chung) | **3200 / 3210** |
| Cơ sở dữ liệu | `game-su-kien.db` | chung | **`vong-quay.db` riêng** |
| Cơ sở · nhân viên · khách | dùng chung | dùng chung | **cắt khỏi v1** |
| Kho quà / ngân sách | dùng chung | không dùng | **sổ riêng** |
| Ai quyết kết quả | **người bấm** | **người bấm** | 🔴 **máy** |

## Quyết định

**Vòng Quay May Mắn là ỨNG DỤNG THỨ HAI, đứng riêng hoàn toàn:**

- **App riêng** — dự án Next.js riêng tại `modules/GAME_SU_KIEN/VONG_QUAY_MAY_MAN/app/`.
- **CSDL riêng** — `du-lieu/vong-quay.db`, 5 bảng riêng, không dùng chung bảng nào với
  `game-su-kien.db`.
- **Cổng riêng** — **3200** (dev) / **3210**, để hai app **chạy song song tại quầy**.
- **Repo Git riêng** — không nằm trong repo `hodacphuchtc/GAME_SU_KIEN`.

Kèm theo là **ba luật bất di bất dịch**:

1. 🔴 **CẤM `import` xuyên giữa hai app.** Tái dùng = **chép tay có ghi nguồn**: mỗi file
   chép mang dòng đầu `// Chép từ GAME_SU_KIEN/app/<đường dẫn> @ <commit>. Sửa gì so với bản
   gốc: <...>`, và một bảng trong `app/CLAUDE.md` liệt kê đủ 19 file (~1.705 dòng, nguồn
   `3d96358`). Import xuyên qua là dựng lại đúng thứ mà việc tách sinh ra để tránh.
2. **Cổng không được đụng nhau.**
3. **Vòng Quay hỏng thì Trúng Số vẫn phải chạy.** Đây là lý do tồn tại của việc tách.

Câu chốt một dòng: **`GAME_SU_KIEN` là MỘT MODULE CHỨA NHIỀU APP, không phải một app.**

## Lý do

### 1. Nghĩa vụ chứng minh "không bị chỉnh" khác hẳn nhau

Trúng Số và Chọn Số: **người bấm** quyết kết quả. Kết quả tính từ `event.timeStamp` của cú
chạm — máy chỉ là cái đồng hồ. Ai nghi ngờ thì lập luận là "bạn bấm lúc đó".

Vòng Quay: **máy** quyết kết quả. Người chơi chạm một lần rồi đứng nhìn, không còn tác động
gì tới con số. Toàn bộ sức nặng dồn vào một câu hỏi: *lấy gì chứng minh máy không chỉnh?*
Câu trả lời của Vòng Quay (`ADR` nội bộ Đ1 của sổ lộ trình) là **bốc bằng góc ngẫu nhiên đều
trên [0°,360°)** — không tồn tại con số trọng số nào để chỉnh lén, vì không có trọng số. Kéo
theo đó là một bộ ràng buộc riêng: bảng tra phân bố 100.000 lượt, `phien_ban_o` ghim theo
từng lượt, "dựng lại ván", mã xác thực gieo bằng id ô + id lượt.

Đó là **một chế độ kiểm chứng khác**, không phải một màn hình khác. Nhét nó chung một tiến
trình với hai game mà nghĩa vụ chứng minh nhẹ hơn hẳn là làm loãng chính thứ phải chứng minh:
mỗi lần Trúng Số vá một lỗi bất kỳ, người ta lại phải trả lời "bản vá đó có đụng vào chỗ bốc
số của Vòng Quay không?".

### 2. Trúng Số đang chạy THẬT tại quầy — không được phép ngã vì game mới

`app/` đang phục vụ phụ huynh thật. Chung một tiến trình Node nghĩa là chung một vòng đời:
một lỗi chưa lường của game mới, một đợt tải nặng, một lần khởi động lại để phát hành —
tất cả đều dừng cái đang chạy. SQLite lại là **một-người-ghi**, nên hai game chung một tệp
còn chung cả hàng đợi ghi.

Tách ra thì mệnh đề "Vòng Quay hỏng thì Trúng Số vẫn phải chạy" là **cấu trúc**, không phải
lời hứa ai đó phải nhớ giữ.

### 3. Nhịp phát hành khác nhau

Trúng Số đã ổn định (501 test, 20 kịch bản e2e, đã push `3d96358`); Vòng Quay đang thi công
từng ngày. Hai nhịp đó cùng một repo là buộc bản ổn định phải chờ bản đang xây.

## Phương án bị loại — **GỘP vào `app/`** (theo đúng ADR-005)

🔴 **Phải ghi rõ, không giấu: đo thật thì gộp RẺ.**

Bằng chứng đo được từ game thứ hai: **thêm Chọn Số vào app cũ chỉ tốn 16 file trên tổng
171** — hạ tầng (CSDL, SSE, giữ chỗ, mã xác thực, kho quà, xuất báo cáo, đăng nhập, sao lưu)
dùng lại nguyên vẹn; chỗ DUY NHẤT hai game khác nhau ở phía máy chủ là `lib/tro-choi/`.
Cột `chuong_trinh.tro_choi` cũng đã chừa sẵn từ GĐ 9. Nghĩa là con đường gộp đang mở, đã đi
một lần, và đi rất trơn.

**Vẫn chọn tách.** Lý do gộp là *tiết kiệm công*; lý do tách là *nghĩa vụ chứng minh khác
bản chất* và *không được làm ngã cái đang chạy thật*. Khi hai lý do đó chọi nhau, tiết kiệm
công thua — vì cái mất khi Trúng Số ngã giữa quầy, hoặc khi không cãi được câu "máy chỉnh
kết quả", không đo bằng số file.

## Giá phải trả (ghi thẳng, không tô hồng)

Tách là **thật sự mất** những thứ ADR-005 đã bảo vệ:

1. **Hai kho khách.** Chị Hoa chơi Trúng Số hôm nay và Vòng Quay tuần sau thành **hai dòng
   trong hai hệ thống**. Hai sale có thể gọi cùng một người, không ai biết ai gọi trước.
   Đây đúng là thứ ADR-005 dựng lên để chặn, và ta đang chấp nhận nó.
2. **Hai sổ ngân sách quà.** Không có một con số duy nhất trả lời "hôm nay trung tâm đã phát
   bao nhiêu quà". Phải cộng tay hai nơi.
3. **Hai lần đăng nhập.** Nhân viên gõ mật khẩu ở `/quan-tri` của app này rồi gõ lại ở app
   kia. Phiên không dùng chung.
4. **Hai lần sao lưu.** Hai tệp `.db`, hai lịch `sao-luu`, hai lần khôi phục khi có sự cố —
   và **quên một bên thì mất một bên**, không có gì báo.
5. **Hai bản của 19 file hạ tầng** (~1.705 dòng). Vá lỗi một bên phải soi bên kia bằng tay
   (bảng chép trong `app/CLAUDE.md` là thứ duy nhất giữ chúng khỏi âm thầm lệch nhau).

Không có mục nào ở trên là "sẽ giải quyết sau". Chúng là hoá đơn đã ký.

## Tiêu chí phân xử cho game thứ tư trở đi

Để lần sau khỏi cãi lại từ đầu — đây là luật, không phải cảm tính:

- Chung danh mục (cơ sở · nhân viên · khách · kho quà) **và** chung nghĩa vụ chứng minh
  ⇒ **gộp vào `app/`** (như Chọn Số).
- Khác bản chất *ai quyết kết quả*, **hoặc** cần nhịp phát hành riêng ⇒ **app riêng**
  (như Vòng Quay).

## Hệ quả

- `ADR-005` xuống trạng thái **"Đã chốt — bị ĐẢO MỘT PHẦN bởi ADR-010"**; thân bài giữ
  nguyên làm dấu vết (ADR đã chốt thì không viết lại, cái mới đè lên cái cũ).
- ⚠️ Mâu thuẫn mà `ADR-009` ghi là "chưa được hoà giải" — nay **được hoà giải bằng ADR này**.
- Sổ sách kéo về khớp đĩa: `modules/GAME_SU_KIEN/OVERVIEW.md` (module chứa HAI app) ·
  `module.config.json` (`vong-quay-may-man` = `dang-thi-cong`) · `PLAN.md` gốc (trỏ sang sổ
  Vòng Quay) · `.claude/scaffold.json` (`adrCount` 9 → 10).
- **Đường quay đầu:** nếu sau này hai app buộc phải dùng chung danh bạ khách, cách đúng
  KHÔNG phải gộp lại thành một tiến trình, mà là kéo danh mục dùng chung lên một tầng nền
  tảng và cho cả hai app tham chiếu bằng id — đúng rule 3 của
  `.claude/rules/module-boundaries.md`. Điều kiện để xét lại: chi phí "hai kho khách" ở trên
  bắt đầu gây gọi trùng thật sự tại quầy.
