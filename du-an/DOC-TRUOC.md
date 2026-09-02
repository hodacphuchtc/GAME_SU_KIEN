# `du-an/` — BỘ NÃO DỰ ÁN

Thư mục này giữ **toàn bộ tài liệu, quyết định và lộ trình** của dự án GAME SỰ KIỆN.
Trước ngày 02/09/2026 chúng sống trong một repo Git RIÊNG (`IDEA/`) **không có remote nào**
— tức 12 ADR, sổ lộ trình và mọi quy tắc dự án chỉ tồn tại trên đúng một ổ cứng.

Anh Phúc chốt: **một repo duy nhất là `hodacphuchtc/GAME_SU_KIEN`.** Đây là chỗ chúng dọn về.

## Trong này có gì

| Đường dẫn | Nội dung |
| --- | --- |
| `CLAUDE.md` | Hiến pháp dự án: guardrails, trạng thái, quyết định, cạm bẫy đã trả giá |
| `PLAN.md` | Lộ trình gốc của IDEA |
| `modules/GAME_SU_KIEN/PLAN_TONG_HOP_V1.md` | 🔴 **SỔ ĐANG CHẠY** — đọc khối trạng thái đầu file |
| `docs/decisions/ADR-*.md` | 11 quyết định kiến trúc + lý do. `ADR-011` là bản gộp ba game |
| `docs/brd/` | Tài liệu yêu cầu nghiệp vụ |
| `.claude/rules/` | 5 quy tắc: workflow · security · module-boundaries · tech-defaults · ngôn ngữ UI |
| `.claude/commands/` | 8 handle giai đoạn (`B1_y_tuong` → `B6_xuat_ban`) |
| `rule/UI/` | Bộ nhận diện thương hiệu Sata Robo (viết cho IN ẤN, không phải design system) |

## 🔴 Hai cạm bẫy của chính thư mục này

1. **`du-an/.gitignore` là bản chép của IDEA và nó VẪN CÓ HIỆU LỰC cho cây con này.**
   Các luật trong đó viết cho gốc IDEA, nên khi nằm ở đây chúng chặn nhầm — ví dụ
   `modules/GAME_SU_KIEN/DATA/` làm file `VIDEO PHAN TICH.mp4` bị bỏ qua trong im lặng
   (đã phải `git add -f`). **Thêm file mới vào đây thì kiểm `git status` xem nó có thật sự
   được nhận không**, đừng tin là cứ chép vào là xong.

2. **`du-an/.github/workflows/` KHÔNG chạy.** GitHub chỉ đọc `.github/` ở GỐC repo. Muốn bật
   lại `quet-sau.yml` thì phải chuyển nó lên gốc — và biết rằng làm vậy là bật một workflow
   mới cho repo đang phục vụ quầy.

## Nguồn sự thật nằm ở đâu

Bản trong `du-an/` là **bản duy nhất được sao lưu**. Thư mục `IDEA/` trên máy anh Phúc vẫn
còn bản gốc và vẫn là nơi Claude Code đọc `CLAUDE.md` khi mở phiên. **Hai bản này sẽ lệch
nhau vào đúng ngày ai đó sửa một bên** — đó là cạm bẫy đã ghi trong chính `CLAUDE.md`.
Việc chọn nơi ở lâu dài cho bộ não còn đang chờ quyết.
