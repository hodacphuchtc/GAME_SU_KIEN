# OVERVIEW — config/

## 1. Mục đích

Nơi duy nhất giữ **hằng số và ngưỡng NGHIỆP VỤ** của IDEA (ví dụ: thang điểm chấm ý tưởng, số ngày ý tưởng nằm im trước khi báo nguội, trạng thái hợp lệ của một ý tưởng, hạn mức tệp đính kèm).

Rule 4 của `.claude/rules/module-boundaries.md`: **CẤM hardcode ngưỡng nghiệp vụ trong code** — đọc từ đây. Lý do: ngưỡng là thứ người dùng đổi ý nhiều nhất; rải rác trong code thì mỗi lần đổi là một lần đi săn.

## 2. Quy ước

- Một chủ đề một file, tên `kebab-case`.
- Chỉ chứa hằng số/ngưỡng và từ điển thuật ngữ UI — **KHÔNG chứa secret** (secret ở `.env.local`, tên biến khai ở `docs/architecture/env-vars.md`).
- Giá trị dùng chung nhiều module đặt ở đây, không nhân bản sang từng module.
- Đổi một ngưỡng = sửa đúng một chỗ ở đây; nếu phải sửa thêm chỗ khác thì chỗ đó đang hardcode sai.

## 3. Trạng thái & bước tiếp theo

- **Trạng thái (29/08/2026):** vừa khởi tạo.
- **Tiếp theo:** (điền khi có nội dung đầu tiên.)

## 4. Quyết định quan trọng

| Ngày | Quyết định | Lý do |
| ---- | ---------- | ----- |
