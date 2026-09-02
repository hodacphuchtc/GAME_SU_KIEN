# ADR-009 — Loại trừ số đã ra: đổi VÒNG CHẠY, không ánh xạ kết quả

- **Ngày:** 01/09/2026
- **Trạng thái:** Đã chốt
- **Bối cảnh:** game thứ ba **CHỌN SỐ** (`tro_choi = 'chon_so'`), lộ trình
  `modules/GAME_SU_KIEN/TRUNG_SO/PLAN_TRUNG_SO_V3.md`

## Bối cảnh

CHỌN SỐ phát cho mỗi người chơi một con số trong dải X→Y; số đó ứng với phần quà
đã đánh số thứ tự chuẩn bị sẵn **bên ngoài hệ thống**. Khi mỗi số chỉ có một món
quà, chương trình bật **loại trừ số đã ra**: số đã có người lấy thì không được ra
lần nữa.

Có đúng hai cách làm điều đó, và chúng cho ra hai trải nghiệm khác hẳn nhau.

## Quyết định

**Loại trừ đổi chính VÒNG CHẠY.** Số đã phát biến mất khỏi dãy đang chạy trên
bảng LED: người đứng xem thấy `0041 → 0043` vì 42 đã có người lấy. Vòng lúc 8 giờ
sáng dài 100 số, lúc 8 giờ tối dài 60 số — và đó là sự thật của buổi chiều hôm đó.

Cài đặt: `lib/chon-so/vong-so.ts` · `vongChay(dai, daRa)` trả danh sách số còn
lại, `soTaiGiay(nhip, vong, t)` lấy phần tử thứ `floor(countAt(nhip, t)) % vong.length`.

## Phương án bị loại

**Chạy đủ dải rồi ánh xạ kết quả sang số trống gần nhất.** LED vẫn hiện `0042`,
người chơi bấm đúng lúc thấy `0042`, máy trả `0043`.

Bị loại vì ba lý do, mỗi lý do đủ để loại một mình:

1. **Nó là "thay thầm".** Đúng thứ bài học L1 của Vòng Quay cấm: *"ô hết quà biến
   mất khỏi vòng quay ngay — không thay thầm bằng quà khác. Thay thầm là lừa
   người đứng xem."*
2. **Nó vi phạm luật 4 của `app/CLAUDE.md`**: *"phụ huynh thấy 0211, bấm, máy trả
   0219 — nhìn y như ăn gian."* Ở CHỌN SỐ còn tệ hơn Trúng Số: người chơi cầm con
   số trong đầu đi ra quầy nhận quà số 42, rồi nhân viên đưa quà số 43.
3. **"Gần nhất" không có định nghĩa duy nhất.** Khi 41 và 43 cùng cách 42 một
   đơn vị, mọi cách phá hoà đều là một luật ngầm không ai đọc được trên màn hình.

## Hệ quả

- **Vòng phải được chốt tại lúc mở lượt** và gửi cho cả hai màn hình qua tin
  `bat-dau-chon-so` (`{dai, daRa}`), để máy chủ và hai màn hình dựng lại cùng một
  vòng bằng chính `vongChay()`. Truyền biểu diễn tối thiểu, không truyền cả mảng
  số đang chạy.
- **Bắt buộc có luật "mỗi lúc một lượt"** (`coLuotDangMo`). Hai người bấm cùng
  lúc sẽ cùng đọc một tập `daRa` và có thể ra cùng một số — mà không một bài test
  đơn lẻ nào bắt được. Luật này cũng vá luôn khe hở sẵn có: `batDauTaiCho` trên
  màn hình LCD mở lượt mà **không xin chỗ**.
- Cộng hai điều trên ta có bất biến sạch: **vòng lúc bắt đầu ≡ vòng lúc bấm ≡
  vòng máy chủ chấm.**
- **Hết sạch số ⇒ chương trình tự dừng** (`doiTrangThai('ket_thuc')` + phát tin
  `trang-thai`). Cố ý không tái dùng cờ `chiVui` của Trúng Số: ở đây không còn số
  thì không có gì để cho, và cho người ta bấm rồi mới nói là tệ hơn nói trước.

## Quyết định kèm theo — hết giờ thì KHÔNG cấp số

Phép kẹp `Math.min(toiDaMs, Math.max(toiThieuMs, ms))` trong `dungLuot` quy mọi
lần "để hết giờ" về đúng một mốc thời gian, nên **mọi người đều nhận cùng một con
số**. Ở Trúng Số đó chỉ là một số trượt nên không ai thấy; ở CHỌN SỐ đó là mười
phụ huynh cùng cầm số `0037` đi nhận một phần quà.

Vì vậy `luatChonSo.cham` trả `null` khi hết giờ: lượt bị huỷ, không tiêu lượt
trong ngày, người chơi được mời bấm lại.

## Quan hệ với ADR-005

Quyết định gộp CHỌN SỐ vào cùng một app **củng cố ADR-005** ("một app chứa nhiều
game"): cột `chuong_trinh.tro_choi` đã nằm sẵn trong lược đồ từ GĐ 9 và đây là
lần đầu có mã đọc nó.

⚠️ Mâu thuẫn giữa ADR-005 và việc **Vòng Quay May Mắn đứng riêng** vẫn chưa được
hoà giải. ADR này không giải điểm đó.
