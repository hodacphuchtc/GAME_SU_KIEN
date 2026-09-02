# ADR-006 — Ván N lần bấm, và công thức tỉ lệ `1 − (1 − p)^N`

- **Ngày:** 01/09/2026
- **Trạng thái:** Đã chốt

## Bối cảnh

v1 cho mỗi người **một lần bấm**. Bấm hụt là hết, và nhiều phụ huynh bỏ đi ngay — họ chưa
kịp hiểu luật chơi thì ván đã xong.

v2 cho khai **1–5 lần bấm mỗi ván**. Nhưng nhiều lần bấm là **nhiều tiền quà hơn**, và con
số đó phải hiện ra trước mắt người khai cấu hình, không phải hiện ra ở cuối tháng.

## Quyết định

- **Một VÁN = tối đa N lần bấm = MỘT phần quà.** `van_choi` là đơn vị nhận giải;
  `luot_choi` xuống làm nhật ký từng lần bấm.
- **TRÚNG là dừng ngay** — không bắt bấm nốt các lần còn lại.
- Kết quả ván = lần bấm **lệch ít nhất**, không phải lần cuối.
- Giới hạn đổi từ "1 lượt/SĐT/ngày" thành **"1 VÁN/SĐT/ngày"**; trần giải đếm `van_choi`.
- Tỉ lệ theo ván tính bằng **`1 − (1 − p)^N`**, KHÔNG phải `N × p`.
- Form tạo chương trình hiện tỉ lệ theo ván **và** dự báo số quà/ngày, đối chiếu thẳng với
  trần đã khai; vượt trần thì đổi màu cảnh báo.

## Lý do

**Vì sao tách hai bảng:** bấm ba lần trúng hai lần vẫn chỉ **một** phần quà. Để `trung`,
`ma_xac_thuc`, `da_trao_thuong` ở tầng lượt thì trần giải đếm ra hai, thước đo ghi danh
đếm ra ba — và cả hai con số đều sai **theo hướng đẹp mắt**, loại sai khó phát hiện nhất.

**Vì sao trúng là dừng:** kéo dài thêm hai lần bấm sau khi mã xác thực đã hiện ra là kéo
dài cái cửa sổ mà nhân viên chưa trao quà.

**Vì sao lấy lần tốt nhất:** người bấm lệch 5 ở lần một rồi lệch 900 ở lần ba mà bị chấm
900 thì họ có quyền giận, và họ đúng.

**Vì sao công thức luỹ thừa:** mức Vừa có p ≈ 4%; ba lần bấm thành **11,5%**, gần gấp ba
tiền quà. Nhân thẳng `N × p` sai số nhỏ ở đây nhưng **vọt quá 100%** ở mức Dễ với N = 5 —
và một bảng nói "trúng 130%" thì nhân viên bỏ luôn cả bảng, tức là mất đúng cái van duy
nhất ngăn họ treo giải quá tay. Đây là họ hàng của vết sẹo *"đổi tốc độ KHÔNG đổi tỉ lệ
trúng"* đã trả giá một lần.

## Đường nâng cấp

Số ván ước tính mỗi ngày (`VAN_UOC_TINH_MOI_NGAY` trong `config/game.ts`) hiện là một **giả
định**, không phải số đo — nó có mặt để dòng dự báo nói được điều gì đó. Đo được lưu lượng
thật ở quầy rồi thì sửa đúng một chỗ đó, và dự báo trở thành số thật.
