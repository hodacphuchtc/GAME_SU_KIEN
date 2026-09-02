# Stack & convention mặc định

## Stack

Next.js (App Router) + TypeScript + Supabase (Postgres/Auth) + Vercel + Cloudflare R2

> Chốt stack xong thì thay mục này bằng bảng cụ thể (framework, DB, auth, storage,
> test runner...) và viết ADR nếu là lựa chọn lớn. Trước đó Claude KHÔNG tự chọn stack.

## Convention đặt tên (điều chỉnh theo stack đã chốt)

- Thư mục/file: `kebab-case`.
- Biến/hàm đặt tên tiếng Anh; text hiển thị UI theo `.claude/rules/ngon-ngu-ui.md`.
- Hằng số nghiệp vụ: đọc từ `config/`, không hardcode (rule 4 module-boundaries).

## Nguyên tắc code

- Validate input tại biên (API/form); escape output khi render.
- Không file > 500 dòng — tách nhỏ.
- Sau thay đổi có ý nghĩa: chạy lint/test/build thật (Verification Loop — workflow.md).
