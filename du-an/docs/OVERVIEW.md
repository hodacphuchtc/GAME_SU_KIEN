# OVERVIEW — docs/

## 1. Mục đích

Toàn bộ tài liệu của IDEA — thứ người sau đọc để hiểu dự án mà không phải hỏi lại:

- `brd/` — yêu cầu nghiệp vụ: bài toán, người dùng, phạm vi in/out, yêu cầu chính.
- `architecture/` — kiến trúc & môi trường (`env-vars.md`: TÊN biến, không bao giờ giá trị).
- `decisions/` — ADR: mỗi quyết định kiến trúc một file, có bối cảnh + lý do + đường nâng cấp.
- `sop/` — quy trình xử lý sự cố (`SU-CO-LO-KEY.md`: playbook khi lộ key).

## 2. Quy ước

- Tên file `kebab-case.md`; ADR theo khuôn `ADR-00N-<slug>.md`, N tăng liên tục không nhảy số.
- Viết bằng Tiếng Việt.
- **KHÔNG để dữ liệu cá nhân người dùng cuối trong `docs/`** — dữ liệu thật tách thư mục riêng đã gitignore (`.claude/rules/security.md`).
- Không ghi GIÁ TRỊ secret vào bất kỳ file nào ở đây — chỉ tên biến và nơi lấy.
- Thêm ADR thật thì tăng `adrCount` trong `.claude/scaffold.json` để `check-structure` canh đủ bộ.

## 3. Trạng thái & bước tiếp theo

- **Trạng thái (29/08/2026):** vừa khởi tạo.
- **Tiếp theo:** (điền khi có nội dung đầu tiên.)

## 4. Quyết định quan trọng

| Ngày | Quyết định | Lý do |
| ---- | ---------- | ----- |
