# Vòng Quay May Mắn — BẢN CŨ, ĐÃ NGỪNG

`app/` trong thư mục này là **ứng dụng Vòng Quay đứng riêng** (Next.js riêng, SQLite riêng,
cổng 3200/3210) — bản chạy trong đúng một ngày 02/09/2026 trước khi được gộp vào app chung.

🔴 **ĐỪNG SỬA GÌ TRONG ĐÂY.** Code đang chạy thật nằm ở gốc repo này
(`lib/vong-quay/`, `components/*vong-quay*`, `app/quan-tri/vong-quay/`).
Bản này giữ lại làm **MỐC LÙI**: nếu việc gộp ba game vào một app vỡ, đây là thứ để quay về.

Lý do gộp và cái giá phải trả ghi ở `du-an/docs/decisions/ADR-011-gop-vong-quay.md`
(đảo `ADR-010` viết cùng ngày). Điều đã mất, ghi thẳng: *"Vòng Quay hỏng thì Trúng Số vẫn
chạy"* — mệnh đề đó **không còn đúng** từ khi gộp.

## Không có gì ở đây

- `du-lieu/` (CSDL) **cố ý không đẩy lên** — nó chứa dữ liệu thử, và repo này CÔNG KHAI.
- `node_modules/`, `.next/` — dựng lại bằng `npm install`.

## Khi nào xoá được thư mục này

Sau khi anh Phúc chạy thử bản gộp trên máy quầy và xác nhận ba game chạy đúng. Trước đó nó
là lưới an toàn duy nhất ở mức mã nguồn.
