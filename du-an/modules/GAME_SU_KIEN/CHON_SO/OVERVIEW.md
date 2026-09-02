# CHỌN SỐ — game phát số may mắn

## 1. Mục đích

Phát cho mỗi người chơi **một con số** trong dải đã khai, công bằng và có sổ đối
soát. Con số đó ứng với **phần quà đã đánh số thứ tự chuẩn bị sẵn bên ngoài hệ
thống** — app không quản lý quà, chỉ phát số và ghi lại ai nhận số nào.

Khác Trúng Số ở một điều gốc: **không có ai trượt**. Ai bấm cũng có một con số.

## 2. Phạm vi

**Trong:** dải số X→Y chạy xoay vòng trên bảng LED 4 chữ số · một lần bấm mỗi
ván · loại trừ số đã ra (bật/tắt được) · mã xác thực chống chụp màn hình · sổ số
đã phát + xuất Excel · đồng bộ màn hình LCD và điện thoại.

**Ngoài:** kho quà trong máy (quà nằm ngoài hệ thống) · chế độ chơi online ·
nhiều lần bấm · tra cứu "số của tôi" sau khi mất màn hình · bảng tỉ lệ trúng.
Lý do từng mục: mục "KHÔNG LÀM ở v3" trong sổ lộ trình.

## 3. Code nằm ở đâu

🔴 **Không có thư mục code riêng.** CHỌN SỐ chạy trong **cùng một app** với Trúng
Số tại `modules/GAME_SU_KIEN/app/`, phân biệt bằng cột `chuong_trinh.tro_choi`
(ADR-005). Thư mục này chỉ giữ tư liệu nghiệp vụ.

| Đường dẫn (trong `app/`) | Vai trò |
| ------------------------ | ------- |
| `config/chon-so.ts` | Hằng số: dải mặc định, biên dải, nhịp quay, ngưỡng cảnh báo |
| `lib/chon-so/vong-so.ts` | ★ Lõi thuần: `coDai` · `vongChay` · `nhipCua` · `soTaiGiay` |
| `lib/tro-choi/luat.ts` | Bảng tra luật chơi, fail-closed |
| `lib/tro-choi/luat-chon-so.ts` | Loại trừ · một-lượt-một-lúc · hết giờ không cấp số |
| `components/man-hinh-chon-so.tsx` | Màn hình LCD |
| `components/man-dien-thoai-chon-so.tsx` | Điện thoại — nút bấm có đóng dấu thời gian |
| `components/form-tao-chon-so.tsx` · `form-sua-chon-so.tsx` | Tạo và sửa thiết lập |
| `components/bang-lich-su-chon-so.tsx` | Sổ số đã phát |
| `app/quan-tri/chon-so/**` | Ba trang quản trị |
| `app/api/xuat/chon-so/[ma]/route.ts` · `lib/xuat/bang-so-da-chon.ts` | Xuất Excel |
| `tests/vong-so.test.ts` · `chon-so.test.ts` · `tao-chon-so.test.ts` | Test |
| `tests/e2e/gd19-chon-so.mjs` · `gd20-chon-so-loai-tru.mjs` | e2e trình duyệt thật |

## 4. Lộ trình

`../TRUNG_SO/PLAN_TRUNG_SO_V3.md` — sổ mang tên `TRUNG_SO_V3` vì CHỌN SỐ gộp
thẳng vào app Trúng Số, nên nó đúng là phiên bản 3 của cùng một app.

🔴 **KHÔNG chép danh sách hạng mục sang đây.** Chép là dựng bản sao thứ hai, và
hai bản chỉ lệch vào đúng ngày ai đó sửa một bản.

## 5. Trạng thái

**Xong toàn bộ phần máy (01/09/2026).** 13/13 hạng mục máy đã tick.

| Lệnh (trong `app/`) | Kết quả |
| ------------------- | ------- |
| `npm test` | **501 test / 44 file** xanh |
| `npm run e2e` | **20/20 kịch bản** (18 cũ + 2 mới) |
| `npm run build` | xanh, 22 route |
| `node scripts/check-structure.mjs` | 56 mục, 9 ADR |

**Còn lại — chờ NGƯỜI / NGOÀI:** mở file Excel bằng Excel/Numbers thật (`C.N2`) ·
chạy thử tại quầy một buổi với người lạ bấm (`C.N3`) · dán nhãn số lên bộ quà
(`C.N4`).

## 6. Quyết định quan trọng

- **Gộp vào app Trúng Số**, rẽ nhánh bằng `tro_choi` — dùng chung cơ sở · nhân
  viên · khách tiềm năng · phân quyền · nhật ký · xuất Excel · sao lưu. Tiết kiệm
  ~5.100 dòng mã không phải chép (ADR-005).
- 🔴 **Loại trừ đổi VÒNG CHẠY, không ánh xạ kết quả** — ADR-009. Thấy 42 thì nhận
  42; số đã có người lấy thì biến mất khỏi dãy chứ không bị thay thầm.
- **Nhịp quay tính theo độ dài dải**, một vòng ~1,5 giây — không dùng 4 mức khó
  của Trúng Số (800 số/giây trên dải 100 là 8 vòng mỗi giây, một vệt mờ).
- **Hết giờ thì KHÔNG cấp số** — phép kẹp trong `dungLuot` quy mọi lần hết giờ về
  một mốc, nên mọi người sẽ nhận cùng một con số.
- **Mã xác thực lấy hạt là CHÍNH CON SỐ** — hai người cầm hai số khác nhau thì mã
  khác nhau, không mượn mã của nhau được.
- **v1 chỉ chế độ tại quầy** — online cố ý bỏ giữ chỗ, mà quà đánh số thì không
  gửi được cho người ở nhà.
