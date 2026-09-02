# ADR-011 — Gộp Vòng Quay May Mắn vào app GAME_SU_KIEN (đảo ADR-010)

- **Ngày:** 02/09/2026
- **Trạng thái:** Đã chốt
- **Quan hệ:** **ĐẢO `ADR-010`** (viết sáng cùng ngày). Kéo theo: `ADR-005` ("một app chứa
  nhiều game") **hết bị đảo một phần** và trở lại là luật chung cho **cả ba** game.
- **Bối cảnh:** lộ trình `modules/GAME_SU_KIEN/VONG_QUAY_MAY_MAN/PLAN_VONG_QUAY_V2.md`

## Bối cảnh

`ADR-010` chốt sáng 02/09/2026: Vòng Quay đứng riêng — app riêng, CSDL riêng, cổng 3200/3210,
repo Git riêng. Lý do khi đó có sức nặng thật và vẫn đúng về mặt lập luận: **ai quyết kết
quả** khác nhau (máy, không phải người bấm), nên nghĩa vụ chứng minh "không bị chỉnh" khác
hẳn; và Trúng Số đang phục vụ phụ huynh thật tại quầy thì không được ngã vì một game mới.

Chiều cùng ngày, anh Phúc chạy buổi test thật trên máy và nêu bốn yêu cầu — không phải bốn
tính năng rời, mà là **một câu duy nhất nói bốn lần**:

| Anh nói | Đọc ra yêu cầu kỹ thuật |
| --- | --- |
| "Sao đăng nhập quản trị lại không thấy game Vòng Quay?" | Một phiên đăng nhập |
| "Cho tôi cái menu Game sự kiện có ba game" | Một thanh điều hướng |
| "Thông số chung thì phải dùng chung chứ" | Một kho cơ sở · nhân viên · khách |
| "Nó phải nằm chung một chỗ" | Một địa chỉ, một cổng |

Bốn thứ đó **về mặt kỹ thuật chỉ đạt được khi hai app là MỘT tiến trình, MỘT tệp CSDL**.
Phiên đăng nhập nằm trong cookie gắn theo origin; thanh bên quản trị là component của một
app; và "dùng chung khách" mà hai tệp SQLite thì không có nghĩa gì. Không có phương án nào
giữ được `ADR-010` mà vẫn trả lời được cả bốn.

## Quyết định

**Vòng Quay May Mắn chuyển hẳn vào `modules/GAME_SU_KIEN/app/`**, rẽ nhánh bằng cột
`chuong_trinh.tro_choi = 'vong_quay'` — đúng con đường game Chọn Số đã đi.

- **Một app** — cổng 3111. Thư mục `VONG_QUAY_MAY_MAN/app/` bị tháo sau khi đã đẩy lên
  GitHub (hạng mục `0.1`, repo `hodacphuchtc/VONG_QUAY_MAY_MAN`, riêng tư).
- **Một CSDL** — `du-lieu/game-su-kien.db`. Bảng `o_qua` và `luot_quay` thêm qua
  `lib/db/nang-cap.ts`, **không đụng `lib/db/luoc-do.ts`** (CSDL đang chạy thật ở quầy phải
  nâng cấp được tại chỗ).
- **Một phiên đăng nhập, một kho khách, một sổ ngân sách quà, một lần sao lưu.**
- **Repo Vòng Quay không bị xoá** — nó giữ nguyên lịch sử dựng app, và là bản lùi nếu việc
  gộp vỡ.

Ba luật của `ADR-010` bị bãi bỏ theo: không còn "cấm import xuyên" (chỉ còn một app), không
còn ràng buộc cổng, và — điểm nặng nhất — **không còn mệnh đề "Vòng Quay hỏng thì Trúng Số
vẫn chạy"**.

## Lý do

### 1. Lập luận của ADR-010 đúng, nhưng nó trả lời một câu hỏi không phải câu người dùng hỏi

`ADR-010` cân *nghĩa vụ chứng minh* chọi *tiết kiệm công*, và cho tiết kiệm công thua. Cân
đúng. Nhưng bên phải cán cân hôm nay không còn là "tiết kiệm công" — mà là **bốn yêu cầu vận
hành anh Phúc nêu đích danh sau khi chạm tay vào sản phẩm**. Chi phí mà `ADR-010` ghi thẳng
ở mục "Giá phải trả" — hai kho khách, hai sổ quà, hai lần đăng nhập, hai lần sao lưu — không
còn là hoá đơn trả dần trong tương lai; nó **đã tới hạn ngay trong buổi test đầu tiên**.

### 2. Nghĩa vụ chứng minh KHÔNG mất khi gộp — nó nằm trong dữ liệu, không nằm trong tiến trình

Đây là chỗ dễ hiểu sai nhất, nên ghi rõ: thứ khiến Vòng Quay chứng minh được "máy không
chỉnh" là **bốc bằng góc ngẫu nhiên đều** (không tồn tại trọng số để mà chỉnh), cộng
`cung_json` chụp lại mặt vòng từng lượt, cộng mã xác thực gieo bằng (ô + lượt). Cả ba thứ đó
là **thuộc tính của thuật toán và của lược đồ dữ liệu**, không phải thuộc tính của việc nó
chạy trong tiến trình Node nào. Chuyển sang app chung thì chúng đi nguyên vẹn.

Cái `ADR-010` thật sự mua được bằng việc tách chỉ là **sự cách ly khi hỏng**. Và đó chính là
thứ ta đang bán đi — nói thẳng ở mục dưới.

### 3. Rẻ hơn tưởng, vì Vòng Quay vốn là bản CHÉP TAY từ chính app đích

`ADR-010` bắt mỗi file tái dùng phải mang dòng ghi nguồn `@ 3d96358`. Chính cái luật đó khiến
việc gộp **không phải hoà giải hai kiến trúc**, mà là **tháo một bản sao**: 13 file xoá thẳng
vì bản gốc đã nằm sẵn ở app đích. Bốn cặp file cố ý khác nhau (`am-thanh`, `ma-xac-thuc`,
`canh-bao-o`, `config/vong-quay`) chuyển vào `lib/vong-quay/` và **giữ nguyên hai bản** — xem
mục "KHÔNG LÀM" của sổ v2.

### 4. CSDL Vòng Quay còn RỖNG — không có bước di trú dữ liệu

Đo được: `vong-quay.db` **4 KB** so với `game-su-kien.db` 127 KB. Chưa một phụ huynh nào
quay. Gộp bây giờ là gộp một lược đồ trống; gộp sau ba tháng là gộp kèm hàng nghìn lượt quay
và một cuộc đối soát quà. **Cửa sổ này sẽ đóng lại.**

## Giá phải trả (ghi thẳng, không tô hồng)

1. 🔴 **Mất hẳn mệnh đề "Vòng Quay hỏng thì Trúng Số vẫn chạy."** Từ nay một lỗi chưa lường
   của Vòng Quay, một đợt tải nặng, một lần khởi động lại để phát hành — đều dừng cái đang
   phục vụ phụ huynh thật. Đây không phải rủi ro nhỏ đi; nó chỉ **được đổi lấy** bốn yêu cầu
   vận hành ở trên.
2. **SQLite là một-người-ghi.** Ba game chung một tệp là chung một hàng đợi ghi.
3. **`lib/db/nang-cap.ts` thành điểm chết chung.** Một câu `CREATE TABLE` sai cú pháp ở đó
   làm `csdl()` ném ⇒ **cả ba game chết cùng lúc**. Đây là rủi ro `R1` của sổ v2, và là lý do
   nó bị xếp làm hạng mục có code **đầu tiên**.
4. **Mọi câu SQL quản trị phải mang đủ `locPhamVi` + `locTroChoi`.** Thiếu một trong hai:
   màn Vòng Quay hiện chương trình Trúng Số, hoặc danh sách đang chạy thật biến mất khỏi màn
   quản trị — không một dòng lỗi (`R2`).
5. **Lịch sử Git của Vòng Quay không được ghép vào.** `git log` của repo đang phục vụ quầy
   giữ sạch; đổi lại, muốn tra quá trình dựng Vòng Quay phải sang repo kia.

## Cái gì giữ nguyên để bù lại rủi ro số 1

Không có gì thay được sự cách ly tiến trình. Nhưng ba thứ dưới đây là hàng rào thật, không
phải lời hứa:

- **Mốc lùi vật lý:** tag `truoc-gop-vong-quay` ở app đích + repo Vòng Quay còn nguyên trên
  GitHub + bản sao CSDL ngoài thư mục dự án. Lùi được trong một lệnh.
- **`R1`–`R3` nằm trọn Giai đoạn 1**, tức hết ngày thứ ba đã biết việc gộp có sống được
  không — vỡ thì mất 3 ngày và chưa đụng gì tới giao diện.
- **`2.1` là ĐIỂM KHÔNG QUAY LẠI có canh gác:** bật Vòng Quay vào `/choi/[ma]` và
  `/man-hinh/[ma]` chỉ được làm khi **toàn bộ e2e cũ (20 kịch bản) còn xanh**.

## Tiêu chí phân xử cho game thứ tư trở đi (thay bộ tiêu chí của ADR-010)

- **Mặc định: gộp vào `app/`.** `ADR-005` trở lại là luật chung.
- Chỉ tách app riêng khi có **đồng thời** hai điều: (a) không dùng chung danh mục nào, và
  (b) người vận hành **không** yêu cầu thấy nó trong cùng một màn quản trị. Buổi test 02/09
  cho thấy điều (b) rất khó đúng ở dự án này — người dùng luôn muốn một chỗ.
- Tiêu chí "ai quyết kết quả" của `ADR-010` **bị loại khỏi cán cân tách/gộp**: nó quyết định
  *thuật toán và lược đồ*, không quyết định *ranh giới tiến trình*.

## Hệ quả

- `ADR-010` xuống trạng thái **"Đã chốt — BỊ ĐẢO bởi ADR-011"**; thân bài giữ nguyên làm dấu
  vết (ADR đã chốt thì không viết lại, cái mới đè lên cái cũ).
- `ADR-005` **hết bị đảo một phần**, trở lại luật chung cho cả ba game.
- `.claude/scaffold.json`: `adrCount` 10 → 11.
- Sổ sách kéo về khớp đĩa: `PLAN.md` gốc · `modules/GAME_SU_KIEN/OVERVIEW.md` ·
  `VONG_QUAY_MAY_MAN/OVERVIEW.md` · `module.config.json`.

## Đường quay đầu

Điều kiện xét lại: **một sự cố thật tại quầy trong đó lỗi của Vòng Quay làm Trúng Số ngừng
phục vụ**. Khi đó cách đúng KHÔNG phải tách lại thành hai app (ta vừa trả giá để biết người
vận hành không chấp nhận hai chỗ), mà là kéo danh mục dùng chung lên một tầng nền tảng rồi
tách tiến trình phía trên nó — đúng rule 3 của `.claude/rules/module-boundaries.md`. Mốc lùi
`truoc-gop-vong-quay` và repo `VONG_QUAY_MAY_MAN` giữ lại chính là để đường đó còn đi được.
