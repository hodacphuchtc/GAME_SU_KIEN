# ADR-003 — Một bảng `nhan_vien` vừa là danh sách sale, vừa là tài khoản đăng nhập

- **Ngày:** 01/09/2026
- **Trạng thái:** Đã chốt

## Bối cảnh

Hệ thống cần hai thứ nghe có vẻ khác nhau:

1. **Danh sách sale** để gán khách tiềm năng — gồm cả người chưa bao giờ đăng nhập.
2. **Tài khoản đăng nhập** để vào trang quản trị.

Cách làm quen thuộc là hai bảng: `users` cho đăng nhập, `sales` cho danh sách chăm sóc.

## Quyết định

- **MỘT bảng `nhan_vien`** mang cả hai vai.
- `mat_khau_bam` **NULL** = có tên trong danh sách nhưng **chưa được cấp quyền** vào hệ thống.
- Cấp quyền = đặt mật khẩu. Thu hồi quyền = xoá `mat_khau_bam`, **tên vẫn còn** để gán khách.
- **Cho nghỉ, không xoá.** `trang_thai = 'da_nghi'` chặn đăng nhập nhưng giữ nguyên
  `khach_tiem_nang.nhan_vien_id`.

## Lý do

Hai bảng sẽ đẻ ra **hai danh sách sale lệch nhau** — đúng thứ rule 3 của
`.claude/rules/module-boundaries.md` cấm ("danh mục dùng chung chỉ tồn tại MỘT nơi"). Kịch
bản lệch không phải giả định mà chắc chắn xảy ra: một người nghỉ việc, quản lý xoá tài
khoản đăng nhập nhưng quên xoá khỏi danh sách sale, và khách vẫn tiếp tục được gán cho
người đã đi khỏi.

**Vì sao cho nghỉ chứ không xoá:** khoá ngoại `khach_tiem_nang.nhan_vien_id` là
`ON DELETE SET NULL`. Xoá một nhân viên là làm hàng trăm khách bỗng dưng vô chủ, và không
ai dựng lại được lịch sử "ai đã chăm sóc chị Hoa". Khi có tranh chấp, đó chính là thứ cần.

## Đường nâng cấp

Khi cần đăng nhập bằng tài khoản của tổ chức (SSO/Google Workspace), thêm cột
`nha_cung_cap` + `khoa_ngoai` vào chính bảng này, không tách bảng. Chỉ tách khi thật sự có
người dùng **không phải nhân viên** cần đăng nhập (ví dụ phụ huynh có tài khoản) — lúc đó
họ là một thực thể khác, và bảng riêng mới đúng.
