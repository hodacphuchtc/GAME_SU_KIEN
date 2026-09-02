# ADR-004 — Thêm chế độ `online`, và vì sao VẪN GIỮ chế độ `tai_quay`

- **Ngày:** 01/09/2026
- **Trạng thái:** Đã chốt (đảo một phần GĐ 1 của v1)

## Bối cảnh

v1 chốt một kiến trúc rất gọn: **màn hình LCD là nơi duy nhất hiện dãy số, điện thoại chỉ
là nút bấm**. Nhờ vậy không có hai màn hình để mà lệch nhau, và cả sảnh cùng nhìn về một chỗ.

v2 muốn chạy quảng cáo: người lạ bấm vào link trên Facebook, chơi ngay trên điện thoại của
họ, ở nhà. Ở đó **không có màn hình LCD nào cả** — và kiến trúc v1 làm trò chơi không chạy
được.

Cám dỗ: bỏ chế độ tại quầy đi cho gọn, chỉ giữ online.

## Quyết định

- Thêm chế độ **`online`**: điện thoại tự vẽ dãy số bằng chính `lib/bo-dem.ts`, **bỏ giữ chỗ**.
- **GIỮ NGUYÊN** chế độ `tai_quay`: điện thoại là nút bấm, LCD là nơi duy nhất hiện số, một
  ghế một người.
- Chế độ chọn **lúc tạo chương trình**, không đổi được sau đó.
- Trọng tài **giống hệt nhau** ở cả hai chế độ: máy nào bấm thì máy đó đo, máy chủ kẹp lại
  (`dungLuot`). Bài test `tests/che-do-choi.test.ts` canh đúng điều này.

## Lý do

**Vì sao không bỏ `tai_quay`:** đòn bẩy của trò chơi ở quầy không nằm ở dãy số, mà ở
**một cú bấm có khán giả** (BRD § 1.1). Cả sảnh cùng nhìn một màn hình, cùng nín thở, cùng
reo lên — đó là thứ khiến phụ huynh kể lại cho người khác. Chơi một mình trên điện thoại ở
nhà là một trò chơi khác hẳn, dù luật giống nhau.

**Vì sao online phải bỏ giữ chỗ:** giữ chỗ sinh ra từ một ràng buộc vật lý — một cái LCD
chỉ chiếu được một ván. Chơi online thì mỗi người một màn hình của chính họ. Để nguyên
hàng đợi nghĩa là quảng cáo kéo về 50 người thì 49 người thấy câu *"đang có người chơi"*
rồi bỏ đi, và tiền quảng cáo đi theo.

## Đường nâng cấp

Chế độ online hiện **không xác thực số điện thoại** — giới hạn 1 ván/ngày chỉ cần gõ số
khác là qua (xem `N.9` trong sổ lộ trình). v2 chấp nhận và lọc sau: sale đánh dấu "không
liên lạc được", lead online mang nhãn *"Số chưa xác thực"*. Nâng lên OTP khi chiến dịch đủ
nghiêm túc để trả tiền tin nhắn.
