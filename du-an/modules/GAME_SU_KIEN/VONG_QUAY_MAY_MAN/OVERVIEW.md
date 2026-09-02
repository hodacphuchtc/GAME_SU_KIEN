# VÒNG QUAY MAY MẮN — ứng dụng đứng riêng

## 1. Mục đích

Vòng quay chia ô: người chơi bấm QUAY, vòng quay chạy trên màn hình LCD và dừng lại ở một
ô — **ô đó chính là phần quà**. Khác Trúng Số ở chỗ căn bản: Trúng Số do người chơi bấm mà
quyết kết quả, vòng quay do **máy** quyết. Vì vậy nó dễ chơi hơn, ai cũng nhận được gì đó,
nhưng phải chứng minh được là không bị chỉnh — xem mục 6.

## 2. Phạm vi

**Trong:** khung app riêng · danh sách ô (chính là kho quà) · lõi quay là hàm thuần của
thời gian · vẽ vòng SVG với cung tỉ lệ đúng cơ hội trúng · LCD quay / điện thoại là nút
bấm · nhận diện người chơi (họ tên + SĐT, 1 lượt/ngày) · lịch sử · **dựng lại được mọi ván
đã quay** · một mật khẩu quản trị · sao lưu · xuất CSV.

**Ngoài:** Trúng Số (ứng dụng khác hẳn, xem `../TRUNG_SO/`) · cơ sở · nhân viên đa vai trò ·
khách tiềm năng · chia luân phiên — cắt khỏi v1 có chủ ý, xem `../PLAN_VONG_QUAY.md` mục
Q3. Bốc thăm gọi tên trước đám đông là một nghề khác, để v2.

## 3. Code nằm ở đâu

`VONG_QUAY_MAY_MAN/app/` — **ứng dụng ĐỨNG RIÊNG**: Next.js riêng, SQLite riêng, cổng
riêng, repo Git riêng. Không chung một dòng code nào với Trúng Số ở `../app/`.

🔴 **Không import bất cứ thứ gì từ `../app/`.** Khuôn nào của Trúng Số đáng dùng lại thì
**chép logic bằng tay** rồi ghi rõ chép từ đâu — `../PLAN_VONG_QUAY.md` mục "Đã đo, đừng đo
lại" liệt kê 5 khuôn đáng chép. Import xuyên qua là dựng lại đúng thứ mà việc tách hai app
sinh ra để tránh.

Hai game **chỉ chung một thư mục tư liệu** (`modules/GAME_SU_KIEN/`), không chung app,
không chung cơ sở dữ liệu, không chung sổ ngân sách giải thưởng.

## 4. Lộ trình

Nguồn DUY NHẤT: `../PLAN_VONG_QUAY.md` — 14 hạng mục, 6,75 ngày. **Không chép danh sách
hạng mục sang đây** — hai bản chỉ lệch nhau vào đúng ngày ai đó sửa một bản.

## 5. Trạng thái

🔴 **ĐÃ GỘP. Code Vòng Quay nay SỐNG Ở `modules/GAME_SU_KIEN/app/`**, không phải ở
`VONG_QUAY_MAY_MAN/app/` nữa (ADR-011, 02/09/2026). Thư mục `VONG_QUAY_MAY_MAN/app/` còn
nằm trên đĩa nhưng là **BẢN CŨ ĐÃ NGỪNG** — giữ tạm làm mốc lùi cho tới khi anh Phúc chạy
thử bản gộp và xác nhận. Đừng sửa gì trong đó.

**v1 — đóng sổ.** Repo riêng đã đẩy lên GitHub: **github.com/hodacphuchtc/VONG_QUAY_MAY_MAN**
(riêng tư). Đó là bản lùi nếu việc gộp vỡ.

**v2 — Giai đoạn 0 → 2 XONG** (13/27 hạng mục, sổ `PLAN_VONG_QUAY_V2.md`). Còn lại: GĐ 3
(màn LCD 16:9 theo brand) · GĐ 4 (màn điện thoại một khung hình) · 5.2–5.3 (sửa chương
trình, N lượt) · GĐ 6 (5 kiểu nhạc, thống kê khách) + việc NGƯỜI/NGOÀI.

**Năm lỗi buổi test 02/09 — đã vá bốn:** QR `localhost` (dải cảnh báo trên chính màn LCD +
nút chép địa chỉ đúng) · không có nhạc (điện thoại nay có máy âm thanh; LCD có lớp phủ
"▶ BẮT ĐẦU CHIẾU" mở khoá AudioContext) · hai màn lệch nhịp (điện thoại cũng đo lệch đồng
hồ và dùng chung mốc máy chủ) · không thấy game trong quản trị (menu ba game đã mở). Lỗi
thứ năm — **sửa chương trình đã tạo** — nằm ở hạng mục 5.2, chưa làm.

**Ba lỗi nặng chưa từng gặp, đã vá:** chữ vô hình trên ô vàng/mint (nay màu chữ suy từ độ
chói, có `tests/mau-chu.test.ts` canh ≥ 4,2:1) · lịch sử join sang danh mục hiện tại (nay
đọc ẢNH CHỤP `luot_quay.o_ten`) · cột "trần giải mỗi ngày" chết (đã **gỡ khỏi giao diện**,
trần thật nằm ở từng ô và được `conPhatDuoc()` áp dụng).

## 6. Quyết định quan trọng

- 🔴 **02/09/2026 — GỘP vào app `GAME_SU_KIEN`, đảo quyết định "đứng riêng" bên dưới.** Lý do:
  anh Phúc đòi một lần đăng nhập, menu "Game sự kiện" ba game, kho khách dùng chung — chỉ đạt
  được khi hai app thành một. Rẻ hơn tưởng vì Vòng Quay vốn là **bản chép tay** từ chính app
  đích (mỗi file trùng mang dòng `@ 3d96358`) và **CSDL của nó còn rỗng** ⇒ không có di trú
  dữ liệu. Giá phải trả: mất đúng mệnh đề mà việc tách đã mua — *"Vòng Quay hỏng thì Trúng Số
  vẫn chạy"*. Chi tiết ở ADR-011.
- **02/09/2026 — Màn LCD nền SÁNG, mạch neon ở viền.** Bộ nhận diện cấm nền tối nặng và quy
  định nền trắng 55–65%. Đi ngược lại xu hướng "neon trên nền tối" một cách có chủ đích.
- **02/09/2026 — Số lượt là N cho TRỌN chương trình**, không reset theo ngày. Kéo theo: hằng
  `LUOT_MOI_NGUOI_MOI_NGAY` bị xoá và câu "mời bạn quay lại vào ngày mai" thành SAI.

- **Đứng riêng hoàn toàn** (01/09/2026, đảo quyết định gộp chung app cùng ngày). Đổi 1,75
  ngày công lấy sự tách bạch: lỗi hay tải nặng của game này không đụng tới Trúng Số đang
  chạy thật. Cái mất: không ké được `van_choi`, kho quà, đăng nhập, phân quyền, sao lưu —
  và từ nay có **hai sổ ngân sách giải thưởng riêng**, phải tự đối chiếu.
- **Cắt tầng tổ chức khỏi v1** — một mật khẩu quản trị, không đa vai trò, không khách tiềm
  năng. Chép nguyên tầng đó tốn ~4 ngày cho thứ v1 chưa dùng tới.
- 🔴 **Bốc ô bằng GÓC NGẪU NHIÊN ĐỀU, bỏ hẳn trọng số.** Rút một góc đều trên [0°,360°)
  rồi xem kim rơi vào cung nào ⇒ "cung rộng bao nhiêu thì cơ hội bấy nhiêu" là **đồng nhất
  thức toán học**, không phải một luật ai đó phải nhớ mà tuân thủ. Không tồn tại con số
  trọng số nào để chỉnh lén, vì không có trọng số.
- 🔴 **Vòng quay KHÔNG có ca "hết giờ"** — chỉ có MỘT lần chạm (bấm QUAY), kết quả quyết
  ngay lúc đó. Đây là cách nó thoát cạm bẫy `Math.min/max` mà Chọn Số đã trả giá. Hàm chấm
  bỏ qua tham số `giay`; nhận `hetGio = true` thì NÉM lỗi, không chấm.
- **Độ rộng cung chốt theo PHIÊN BẢN, không co giãn từng lượt.** Vòng chỉ đổi hình khi có ô
  hết hàng và bị gỡ — lúc đó `phien_ban` tăng, và mọi lượt đã quay vẫn dựng lại được.
- **Kho quà GÁNH LUÔN vai trò danh sách ô** — một ô là một loại quà. Hai danh sách tách rời
  chắc chắn sẽ lệch nhau.
- **Ô hết quà thì biến mất khỏi vòng quay ngay**, không thay thầm bằng quà khác. Vòng quay
  buổi sáng khác buổi tối là trung thực, không phải lỗi.
- **Độ rộng cung tỉ lệ đúng với cơ hội trúng** — cấm trọng số ẩn. Giữ ngân sách bằng số
  lượng quà và trần mỗi ngày, không bằng cách vẽ cung rộng mà tỉ lệ lại thấp.
- **Máy chủ quyết kết quả trước**, hai màn hình cùng chạy hàm thuần theo thời gian tới đó.
  Không truyền từng khung hình qua mạng.
- **Mỗi lượt quay lưu hạt giống ngẫu nhiên + phiên bản cấu hình ô + góc dừng** để dựng lại
  được. Trò do máy quyết kết quả thì sớm muộn cũng bị hỏi "có chỉnh không", và câu trả lời
  phải là bấm một nút chứ không phải lời hứa.

Lập luận đầy đủ: `../PLAN_VONG_QUAY.md` mục "ĐẢO QUYẾT ĐỊNH" và "QUYẾT ĐỊNH ĐÃ CHỐT".
