# ADR-002 — Câu định vị đứng cạnh Brand Essence: ranh giới dùng ở đâu

- **Ngày:** 01/09/2026
- **Trạng thái:** Đã chốt

## Bối cảnh

Bộ nhận diện Sata Robo có **Brand Essence**: *"Khơi nguồn sáng tạo – Chắp cánh tương lai"*.
Trò chơi ở quầy lại cần một câu nói **thẳng trung tâm này dạy cái gì**, cho một người lạ
đứng cách màn hình ba mét và chỉ nhìn trong vài giây.

Hai câu cùng tồn tại thì sớm muộn có người dùng nhầm chỗ, hoặc tệ hơn — sửa một câu mà
không sửa câu kia, và hai tài liệu nói hai điều khác nhau về cùng một thương hiệu.

## Quyết định

- Câu định vị dùng trong game sự kiện: **"SATA ROBO — Đào tạo tài năng công nghệ tương lai"**.
- **Ranh giới:**
  - **Brand Essence** dùng ở tài liệu thương hiệu, hồ sơ năng lực, nội dung dài — nơi người
    đọc có thời gian và đã biết Sata Robo là ai.
  - **Câu định vị** dùng ở màn hình LCD, màn điện thoại, tờ rơi quầy — nơi người xem là
    người **lạ**, nhìn trong vài giây, và cần biết ngay đây là chỗ dạy cái gì.
- Hai câu **không** được xuất hiện cùng lúc trong một khung nhìn: đặt cạnh nhau thì chúng
  cạnh tranh với chính bảng số, và không câu nào đọng lại.
- Brand doc phải được **cập nhật** ghi rõ ranh giới này, để hai nơi không lệch.

## Lý do

"Khơi nguồn sáng tạo – Chắp cánh tương lai" là câu hay cho người **đã** quan tâm; nó nói
về cảm hứng chứ không nói về sản phẩm. Phụ huynh đi ngang qua quầy cần câu trả lời cho
"chỗ này dạy gì cho con tôi", và câu đó phải chứa chữ **công nghệ**.

Không viết một câu thứ ba dung hoà: hai câu cho hai ngữ cảnh rõ ràng thì ai cũng biết dùng
cái nào; một câu cố làm cả hai việc thì làm hỏng cả hai.

## Đường nâng cấp

Khi brand doc có bản cập nhật chính thức ghi rõ ranh giới, chép giá trị vào
`config/locale.ts` (`brandTagline`) và trỏ ADR này vào đó. Nếu thương hiệu đổi câu định vị,
sửa **một chỗ** trong locale — không rải chuỗi ra ba màn hình.
