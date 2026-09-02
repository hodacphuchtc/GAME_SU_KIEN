# ADR-007 — Kho quà xếp thứ tự + loại đáy không giới hạn: vì sao KHÔNG ép thành thua khi hết quà

- **Ngày:** 01/09/2026
- **Trạng thái:** Đã chốt

## Bối cảnh

Kho quà có hạn. Chuyện gì xảy ra khi người chơi bấm **trúng** đúng con số đã cài, mà kho
đã hết Balo STEM?

Ba phương án được cân nhắc:

1. **Ép thành thua** — bảo họ không trúng.
2. **Đóng chương trình** khi hết quà.
3. **Tụt xuống loại đáy** — vẫn trúng, nhưng nhận phần quà rẻ hơn ở đáy kho.

## Quyết định

- Kho quà **nhiều loại, bốc theo THỨ TỰ ƯU TIÊN**: hết loại 1 mới sang loại 2.
- Loại có `so_luong = NULL` là **loại ĐÁY KHO**, không giới hạn, đặt cuối danh sách.
- Hết mọi loại có hạn thì **tự tụt xuống loại đáy**. Người chơi **vẫn trúng thật**, màn hình
  vẫn reo "CHÚC MỪNG" y hệt.
- Form cảnh báo **màu** khi kho không có loại đáy nào.
- Việc bốc quà nằm **trong cùng một giao dịch** với việc chốt ván.
- Số đã trao **đếm từ `van_choi.qua_tang_id`**, không lưu bộ đếm riêng.

## Lý do

**Vì sao KHÔNG ép thành thua (phương án 1)** — đây là phần quan trọng nhất của ADR này:

Ở chế độ tại quầy, **con số trúng thưởng in ngay trên màn hình**, và bảng LED cũng ngay
trên màn hình đó. Người chơi nhìn thấy **hai con số khớp nhau** rồi màn hình báo "không
trúng". Không có cách nào giải thích chuyện đó mà không mất lòng tin — và mất lòng tin ở
quầy lễ tân thì mất luôn cả những người đứng xem.

Thêm một lý do nữa, và nó thuộc về pháp lý: câu hỏi **NĐ 81/2018 về khuyến mại may rủi**
vẫn đang treo (mục `N.1` trong sổ). Một trò chơi công bố tỉ lệ trúng rồi **âm thầm ép
thua** khi hết hàng là chuyện rất khác về mặt pháp lý so với một trò chơi luôn trao đúng
thứ đã hứa. Chưa có câu trả lời thì chọn phía an toàn.

**Vì sao không đóng chương trình (phương án 2):** quầy vẫn đông người, và tắt máy giữa buổi
là vứt đi toàn bộ số khách tiềm năng của buổi đó — thứ thật sự đáng tiền của trò chơi này.

**Vì sao bốc quà phải cùng giao dịch với chốt ván:** tách ra thì hai người trúng sát nhau
cùng đọc thấy "còn 1 cái" và cùng nhận cái cuối cùng. Quầy hứa hai phần quà mà trong tay
chỉ có một.

**Vì sao không lưu bộ đếm:** một bộ đếm lưu sẵn là con số chỉ chờ ngày lệch khỏi sự thật —
và ngày nó lệch thì không ai biết bên nào đúng.

## Đường nâng cấp

Cảnh báo ba kênh (dải trong quản trị · chấm trên LCD · dòng nhật ký) là để quản lý **nhập
hàng kịp** chứ không phải để tắt máy. Nếu sau này có câu trả lời dứt khoát cho `N.1` theo
hướng phải công bố cơ cấu giải thưởng cố định, xem lại ADR này — lúc đó "tụt đáy" có thể
phải đổi thành "công bố sẵn loại đáy trong thể lệ".
