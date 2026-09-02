# ADR-001 — Màn thua KHÔNG còn là cửa bán hàng

- **Ngày:** 01/09/2026
- **Trạng thái:** Đã chốt (đảo ngược GĐ 5.1 của v1)

## Bối cảnh

v1 biến màn thua thành một cửa bán hàng: người không trúng vẫn được mời "NHẬN BUỔI HỌC
THỬ", có nút bấm riêng. Ý đồ là không lãng phí một người đã đứng ngay trước quầy.

Chạy thử cho thấy hai vấn đề, và cả hai đều thuộc loại không sửa được bằng cách đổi chữ:

1. **Người chơi không phân biệt được mình trúng hay trượt.** Màn thua có ưu đãi, có nút,
   có khối màu — nhìn không khác màn thắng là mấy. Nhân viên ở quầy phải giải thích lại.
2. **Trung tâm hứa một thứ mà quầy không định trao.** "Buổi học thử" ở màn thua là một
   cam kết miệng chưa ai duyệt ngân sách, và nó xuất hiện với **mọi** người trượt.

Câu hỏi thật sự: bỏ lời mời đi thì có mất khách tiềm năng không?

## Quyết định

- Màn thua chỉ còn **"KHÔNG TRÚNG THƯỞNG"** + **"Cảm ơn Quý Phụ huynh đã tham gia"**.
- **Không** ưu đãi, **không** nút nhận quà, **không** khối màu trông bấm được.
- Gỡ luôn server action `quanTamHocThu` — mọi hàm export trong file `"use server"` là một
  endpoint HTTP công khai có id ổn định; để lại một hàm không còn giao diện nghĩa là ai
  cũng POST được id bất kỳ để bật cờ "quan tâm" cho bất kỳ phụ huynh nào.
- Hàm thư viện `danhDauQuanTamHocThu` thì **giữ** — nó không phải endpoint, và màn "nhân
  viên đánh dấu tại quầy" sau này cần tới.

## Lý do

**Khách tiềm năng KHÔNG mất đi.** Form họ tên + số điện thoại chạy **trước** ván chơi, nên
mọi người chơi đều đã để lại số trước khi biết mình trúng hay trượt. Lời mời ở màn thua
không đóng góp gì vào việc thu khách — nó chỉ đóng góp vào việc làm mờ ranh giới thắng/thua.

Từ GĐ 16, lead còn được sinh **ngay tại bước bấm TIẾP TỤC**, trước cả khi biết người đó có
được chơi hay không. Người bị luật "1 ván/ngày" chặn cũng đã nằm trong danh sách.

Nói thật thì rẻ hơn: một người trượt và biết rõ mình trượt sẽ quay lại ngày mai. Một người
trượt nhưng tưởng mình được tặng gì đó sẽ hỏi nhân viên, và nhân viên phải từ chối.

## Đường nâng cấp

Muốn mời học thử thì mời ở chỗ **không dính vào kết quả trò chơi**: một dòng ở cuối màn
kết quả cho **cả** người thắng lẫn người thua, hoặc để sale gọi lại từ danh sách khách
tiềm năng. Xem lại quyết định này khi có số liệu thật về tỉ lệ khách quay lại — hiện tại
chưa có gì để so.
