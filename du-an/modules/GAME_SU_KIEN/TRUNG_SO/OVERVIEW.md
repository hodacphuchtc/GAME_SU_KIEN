# TRÚNG SỐ — game sự kiện tại quầy

## 1. Mục đích

Trò chơi ngắn dùng làm công cụ marketing tại quầy trung tâm: bảng LED 4 chữ số chạy nhanh
dần, người chơi bấm DỪNG đúng số đã cài thì trúng thưởng. Mục tiêu thật không phải 3% người
trúng mà là **số điện thoại của 97% người chơi**.

## 2. Phạm vi

**Trong:** cấu hình chương trình · bảng LED · trọng tài chấm điểm phía máy chủ · nhận diện
phụ huynh · lịch sử quay số · kho quà · hai chế độ chơi (tại quầy / online).

**Ngoài:** vòng quay may mắn (game riêng, xem `../VONG_QUAY_MAY_MAN/`) · quản lý cơ sở, nhân
viên, khách tiềm năng (dùng CHUNG cho mọi game, nằm ở tầng ứng dụng chứ không thuộc game này).

## 3. Code nằm ở đâu

Toàn bộ trong `../app/` — **một app Next.js duy nhất chứa nhiều game**. Phần riêng của Trúng
Số: `lib/bo-dem.ts` (lõi tính số theo thời gian, hàm THUẦN) · `components/led-4-so.tsx` ·
`components/man-hinh.tsx` · `components/man-dien-thoai.tsx` · `lib/luot/` · `config/game.ts`.

## 4. Lộ trình

Nguồn DUY NHẤT: **`PLAN_TRUNG_SO_V3.md`** (đang chạy — game CHỌN SỐ, kèm BÀN GIAO phiên gần
nhất) · `PLAN_TRUNG_SO_V2.md` (lịch sử v2.1) · `PLAN_TRUNG_SO_V1.md` (lịch sử v1→v2),
cùng thư mục này. **Không chép danh sách hạng mục sang đây** — hai bản
chỉ lệch nhau vào đúng ngày ai đó sửa một bản.

## 5. Trạng thái

v1 đã chạy thật tại quầy · **v2 xong 41/51** · **v2.1 xong 9/9** · **v3 xong 13/13**
(01/09/2026 — v3 là game thứ hai CHỌN SỐ, chạy chung app này).
Cổng kiểm chứng: **501 test / 44 file** · **e2e 20/20** · build **22 route**.
Đã push app `3d96358`.

Việc còn chặn, tất cả ở NGƯỜI hoặc NGOÀI: **âm thanh trên iPhone thật** (`22.1`, sổ V2) ·
ba mục `C.N2`–`C.N4` của Chọn Số (sổ V3) · `N.1`, `N.4`–`N.9` (sổ V1).

## 6. Quyết định quan trọng

Ghi tại `docs/decisions/` của dự án IDEA. Riêng game này:

- Lõi bộ đếm là **hàm thuần của thời gian** — nhờ đó thêm chế độ chơi thứ hai chỉ là bỏ bớt
  cơ chế, không phải viết lại.
- **Xoá dữ liệu có hai mức** (v2.1): xoá hẳn khi sạch, **ẩn** khi còn dấu vết — và máy chủ
  tự quyết mức nào, không nhận lệnh từ máy khách. `van_choi` là sổ đối soát khi phụ huynh
  khiếu nại quà; `co_so` bị xoá là cuốn theo cả danh bạ khách lẫn nhân viên qua CASCADE.
- **Chế độ chơi không còn quyết thay người dùng chuyện cơ sở** (v2.1) — một quầy dùng chung
  mã QR cho nhiều cơ sở là ca thật, và màn chọn vốn luôn hiện theo `nguonCoSo`.
