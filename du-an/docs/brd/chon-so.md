# BRD — CHỌN SỐ: phát số may mắn cho quà đánh số sẵn

## 1. Bài toán & người dùng

Trung tâm có những sự kiện mà **quà đã chuẩn bị sẵn từ trước, đánh số thứ tự
1…N** và bày trên kệ ở quầy. Ai đến cũng phải có phần. Trò cần một cách **phát số
công bằng, có khán giả, và có sổ đối soát** khi phụ huynh quay lại hỏi.

Trúng Số hiện có không hợp: nó là trò **may rủi** (có số trúng định trước, đa số
ra về tay không) và mỗi phần quà phải nằm trong kho quà của app.

| Người dùng | Họ cần gì |
| ---------- | --------- |
| Phụ huynh tại quầy | Một khoảnh khắc hồi hộp ngắn, rồi cầm một con số đi nhận quà |
| Nhân viên lễ tân | Biết số nào đã phát, đối chiếu được mã trước khi đưa quà |
| Quản lý trung tâm | Sổ đối soát + danh sách khách tiềm năng như mọi game khác |

## 2. Phạm vi

**Trong:** dải số X→Y chạy xoay vòng · một lần bấm mỗi ván · loại trừ số đã ra
(bật/tắt) · mã xác thực · sổ số đã phát + xuất Excel · LCD và điện thoại đồng bộ.

**Ngoài (v1):** kho quà trong máy · chế độ online · nhiều lần bấm · tra cứu số
sau khi mất màn hình. Lý do từng mục ở mục "KHÔNG LÀM ở v3" của sổ lộ trình.

## 3. Luật chơi (bản chốt)

1. Nhân viên tạo chương trình, khai **dải số từ X đến Y** và bật/tắt **loại trừ**.
2. Phụ huynh quét QR, nhập **họ tên + số điện thoại** (sinh lead ngay).
3. Dãy chạy X, X+1, …, Y rồi quay lại X, hiện trên bảng LED 4 chữ số, **đệm số 0**.
4. Bấm DỪNG **đúng một lần**. Số dừng lại là số của họ.
5. Cả hai màn hình: **"Chúc mừng bạn đã chọn được dãy số may mắn 0042"**.
6. Ra quầy, đọc mã xác thực, nhân viên đối chiếu rồi đưa phần quà mang số đó.

## 4. Thiết kế — chốt bằng con số, không cảm tính

### 4.1 Vì sao dải giới hạn 0…9999

Bảng LED có **bốn** chữ số. `Led4Digits` làm `value.padStart(4,"0").slice(-4)` và
`formatNumber` lấy dư theo `WHEEL_SIZE = 10⁴`. Khai dải tới 10042 thì số đó hiện
ra thành `0042` — **trùng với số 42 của người khác, và không một dòng lỗi nào**.
Chặn ở tầng `kiemThietLapChonSo`, cửa chung cho cả tạo lẫn sửa.

### 4.2 Vì sao một vòng mất ~1,5 giây

Bốn mức khó của Trúng Số chạy 8 / 400 / 800 / 1500 số mỗi giây. Với dải điển hình
**100 số**, mức "vừa" là **8 vòng MỖI GIÂY** — bảng LED thành một vệt mờ và người
chơi biết mình đang bốc mù chứ không phải đang chọn. Ngược lại mức "thử" (8
số/giây) cho một vòng dài 12,5 giây — quá chậm, người xếp hàng đợi lâu.

Nên tốc độ **co giãn theo độ dài dải**: `maxSpeed = clamp(coDai / 1,5 ; 4 ; 900)`.
Dải 10 số hay 5.000 số đều cho một vòng đọc được. Hai đầu kẹp lại để dải rất lớn
không thành vệt mờ và dải rất nhỏ không ì ạch.

### 4.3 Vì sao khoá nút DỪNG 2 giây đầu

Bằng đúng thời gian tăng tốc (`GIAY_TANG_TOC`). Ai bấm được cũng đều gặp dãy số ở
tốc độ tối đa — không ai chộp được lúc nó còn bò.

### 4.4 Vì sao hết giờ thì KHÔNG cấp số

`dungLuot` kẹp `Math.min(toiDaMs, Math.max(toiThieuMs, ms))`. Phép kẹp quy **mọi
lần "để hết giờ" về đúng một mốc thời gian**, nên mọi người đều nhận cùng một con
số. Ở Trúng Số đó chỉ là một số trượt nên không ai thấy; ở đây đó là mười phụ
huynh cùng cầm `0037` đi nhận một phần quà. Nên hết giờ ⇒ huỷ lượt, mời bấm lại,
**không tiêu lượt trong ngày**.

### 4.5 Vì sao mã xác thực lấy hạt là chính con số

Ở Trúng Số chỉ người TRÚNG mới thấy mã, nên gian lận bằng ảnh chụp là ca hiếm. Ở
đây **ai cũng cầm một con số đi nhận quà**, nên chụp màn hình của người khác là
con đường gian lận hiển nhiên nhất. Lấy hạt là con số ⇒ hai người cầm hai số khác
nhau thì mã khác nhau, không mượn mã của nhau được. Mã đổi mỗi phút, hiệu lực 60
giây (`WIN_VALID_SECONDS`).

### 4.6 Hằng số nghiệp vụ (đặt ở `config/chon-so.ts`, KHÔNG hardcode)

| Hằng | Giá trị | Ý nghĩa |
| ---- | ------- | ------- |
| `DAI_MAC_DINH` | `{tu: 1, den: 100}` | Dải gợi ý khi tạo mới |
| `DAI_TOI_THIEU` / `DAI_TOI_DA` | `0` / `9999` | Biên cứng, xem 4.1 |
| `SO_LUONG_TOI_THIEU` | `2` | Dải một số thì nút DỪNG là đồ trang trí |
| `GIAY_MOI_VONG` | `1,5` | Xem 4.2 |
| `TOC_DO_TOI_DA` / `TOC_DO_TOI_THIEU` | `900` / `4` | Kẹp hai đầu |
| `GIAY_TANG_TOC` | `2` | Ramp, cũng là thời gian khoá nút |
| `GIAY_TOI_DA_MOT_LUOT` | `20` | Quá thì huỷ lượt, xem 4.4 |
| `NGUONG_CANH_BAO_DAI` | `0,2` | Còn dưới 20% thì cảnh báo, `max(1, tỉ lệ × tổng)` |

## 5. Loại trừ số đã ra — điểm dễ làm sai nhất

Đầy đủ ở **ADR-009**. Tóm: loại trừ đổi chính **VÒNG CHẠY**, không ánh xạ kết quả
sang số trống gần nhất. Thấy `0042` thì nhận `0042`; số đã có người lấy thì biến
mất khỏi dãy, LED nhảy `0041 → 0043`.

Kéo theo hai ràng buộc bắt buộc:

- **Vòng chốt tại lúc mở lượt**, gửi `{dai, daRa}` cho hai màn hình.
- **Mỗi lúc một lượt** (`coLuotDangMo`) — nếu không, hai người bấm cùng lúc đọc
  cùng một tập số đã ra và có thể cùng ra một số.

## 6. Rủi ro đã biết & cách xử

| Rủi ro | Cách xử |
| ------ | ------- |
| Hai người cùng một số | Loại trừ + một-lượt-một-lúc + chỉ chạy tại quầy (có giữ chỗ) |
| Chụp màn hình số người khác | Mã xác thực theo con số, hiệu lực 60 giây |
| Hết số giữa lúc còn hàng người | Chặn cứng + chương trình tự dừng + cột "còn lại N số" ở quản trị |
| Dải vượt 4 chữ số | Chặn ở `kiemThietLapChonSo`, cửa chung tạo + sửa |
| Thu hẹp dải sau khi đã phát | `between dai_tu and dai_den` trong phép đếm; hộp cảnh báo nói bằng con số |
| Báo cáo ghi "Trượt" cho mọi dòng | Bảng xuất RIÊNG, không dùng chung `bangLichSu` |

## 7. Tiêu chí nghiệm thu

1. Tạo chương trình dải `1→100`, quét QR, bấm DỪNG — **hai màn hình cùng hiện một
   con số bốn chữ số** nằm trong dải.
2. Dải `1→3` bật loại trừ: ba ván ra **ba số khác nhau**, người thứ tư bị chặn
   kèm câu lỗi, chương trình tự đóng.
3. Tắt loại trừ: hai ván ra trùng số là **hợp lệ**.
4. Xuất Excel: cột "Số may mắn" hiện `0042` **giữ nguyên số 0 đầu** khi mở bằng
   Excel/Numbers thật.
5. Sửa dải trên chương trình đang chạy — **mã QR cũ vẫn dùng được**.
6. 10 phụ huynh thật tại quầy nhận đúng phần quà mang số họ thấy trên LED.
