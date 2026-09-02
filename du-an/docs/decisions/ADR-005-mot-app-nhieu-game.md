# ADR-005 — Một ứng dụng chứa nhiều game, không phải mỗi game một ứng dụng

- **Ngày:** 01/09/2026
- **Trạng thái:** Đã chốt — **HIỆU LỰC TRỌN VẸN TRỞ LẠI** từ 02/09/2026 (`ADR-010` từng đảo một phần, nay chính ADR-010 bị `ADR-011` đảo)
- **Đọc kèm:** [`ADR-011`](ADR-011-gop-vong-quay.md) — gộp Vòng Quay vào app GAME_SU_KIEN, đưa ADR này trở lại làm luật chung cho **cả ba** game. · [`ADR-010`](ADR-010-vong-quay-dung-rieng.md) — bản đảo đã hết hiệu lực, giữ làm dấu vết.

## Bối cảnh

Module `DEM_SO` được đổi tên thành **`GAME_SU_KIEN`**, chứa hai game con:
**`TRUNG_SO`** (đang chạy) và **`VONG_QUAY_MAY_MAN`** (khung rỗng, làm sau).

Câu hỏi: mỗi game một ứng dụng riêng, hay một ứng dụng chứa nhiều game?

## Quyết định

- **MỘT ứng dụng Next.js** chứa nhiều game.
- **Cơ sở · nhân viên · khách tiềm năng · kho quà** là **danh mục dùng chung**, chỉ tồn tại
  MỘT nơi, mọi game tham chiếu bằng id.
- Bảng riêng của từng game (`chuong_trinh`, `van_choi`, `luot_choi`) mang cột `tro_choi` để
  phân biệt.
- Thanh bên quản trị gom theo **nhóm**: "Game sự kiện" liệt kê các game, rồi tới các mục
  dùng chung ("Tổ chức", "Khách hàng").

## Lý do

Hai ứng dụng riêng nghĩa là **hai bản sao danh bạ khách hàng**. Chị Hoa chơi Trúng Số hôm
nay và Vòng Quay tuần sau sẽ thành hai dòng trong hai hệ thống, hai sale khác nhau gọi cho
cùng một người, và không ai biết ai đã gọi trước. Hai bản sao chỉ lệch vào đúng ngày ai đó
sửa một bản — và ngày đó không ai được báo.

Cùng lập luận cho kho quà và nhân viên: chúng là tài sản của **trung tâm**, không phải của
một trò chơi.

Đây cũng chính là rule 3 của `.claude/rules/module-boundaries.md`, áp vào trong một module.

## Đường nâng cấp

Khi một game phát triển tới mức có nhịp phát hành riêng và đội riêng, tách nó thành module
Next.js riêng **nhưng vẫn dùng chung tầng danh mục** — qua service của module nền tảng hoặc
qua sự kiện khai trong manifest, không bao giờ bằng cách chép bảng. Điều kiện để xét lại:
hai game bắt đầu cần hai lịch phát hành khác nhau.
