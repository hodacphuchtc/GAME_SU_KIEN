# ADR-008 — Chạy VPS và GIỮ SQLite, thay vì chuyển sang Supabase

- **Ngày:** 01/09/2026
- **Trạng thái:** Đã chốt

## Bối cảnh

Chế độ chơi online (ADR-004) đưa ứng dụng ra Internet thật. Câu hỏi tự nhiên: có nên nhân
dịp này chuyển cơ sở dữ liệu sang một dịch vụ được quản lý (Supabase/Postgres) không?

Ứng dụng hiện dùng `node:sqlite` — có sẵn trong Node 24, không thêm thư viện, không mở tài
khoản dịch vụ nào. `git clone` + `npm start` là chạy.

## Quyết định

- **Chạy trên VPS có ổ đĩa bền, GIỮ SQLite.**
- Chấp nhận **ba ràng buộc**, ghi rõ ở đây để không ai ngạc nhiên về sau:
  1. **MỘT instance duy nhất.** SQLite là một tệp trên một ổ đĩa; hai tiến trình ghi song
     song trên hai máy là hỏng dữ liệu.
  2. **Không scale ngang.** Hết công suất thì lên máy to hơn, không thêm máy.
  3. **Sao lưu là việc của mình.** Không có ai bấm nút khôi phục hộ.
- Đổi lại, ba ràng buộc đó được trả bằng: `npm run sao-luu` (`VACUUM INTO`, giữ 14 bản,
  đã phục hồi thật một lần), và một bản sao **ra ngoài máy** (`N.7` trong sổ).

## Lý do

**Quy mô thật:** vài cơ sở, vài trăm ván mỗi ngày. Đó là con số mà một tệp SQLite trên một
ổ SSD xử lý mà không cần nghĩ. Chọn Postgres ở đây là mua một thứ cho quy mô chưa tồn tại,
và trả bằng một thứ có thật: mỗi lần cài đặt lại phải có mạng, có tài khoản, có biến môi
trường đúng.

**Luật TỰ CHỨA** của ứng dụng không phải sở thích — nó là thứ khiến trò chơi vẫn chạy khi
mạng ở trung tâm chập chờn, và khiến người tiếp quản dự án cài được trong năm phút.

**Điều đã trả giá và được tính vào quyết định:** đúng trong phiên xây v2, cơ sở dữ liệu thật
bị một tệp rỗng ghi đè (mở `DatabaseSync` vào đường dẫn không tồn tại là **tạo** tệp rỗng).
Bản sao lưu cứu lại. Bài học không phải "SQLite nguy hiểm" mà là "sao lưu phải có trước
mọi thứ khác" — và nó đúng với mọi loại cơ sở dữ liệu.

## Đường nâng cấp

Xem lại quyết định này khi **một** trong ba điều xảy ra:

- cần **hai máy chủ chạy song song** (chịu tải, hoặc không được phép có thời gian chết);
- cần nhiều người **ghi đồng thời từ nhiều nơi** ngoài phạm vi một tiến trình;
- nghiệp vụ cần thứ SQLite không có sẵn và bù bằng tay quá đắt (ví dụ replication đọc).

Đường đi khi đó: giữ nguyên tầng `lib/**/kho.ts` (mọi SQL đã gom về đúng những file đó),
đổi lớp `lib/db/truy-van.ts` sang trình điều khiển mới. Đó chính là lý do mọi câu SQL bị
bắt phải nằm trong các file `kho.ts` ngay từ đầu.
