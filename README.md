# Game sự kiện Sata Robo

Trò chơi ở quầy lễ tân: phụ huynh bấm dừng một dãy 4 chữ số đúng lúc nó hiện đúng con số
trúng thưởng. Ứng dụng **tự chứa mọi thứ** — `npm install` rồi `npm start` là chạy, không
cần mở tài khoản dịch vụ nào.

---

## Dành cho NHÂN VIÊN TRUNG TÂM

### Mở máy mỗi ngày — MỘT lệnh

```bash
npm run trung-tam
```

Nó tự làm hết: sao lưu dữ liệu → dựng bản thật → chạy máy chủ cho **cả mạng wifi** → in ra
sẵn địa chỉ cần mở. Lần đầu chạy nó cũng tự sinh khoá ký phiên và giữ lại, nên bạn không
phải nhớ gì thêm.

Kết thúc, màn hình in ra hai địa chỉ:

- **Trang nhân viên** `http://192.168.x.x:3000/quan-tri` — tạo chương trình, in mã QR;
- **Màn hình LCD** `http://192.168.x.x:3000/man-hinh/<mã>` — mở trên máy nối TV.

### Lần đầu cài đặt

```bash
npm install
npm run trung-tam        # để nó chạy, mở một cửa sổ Terminal khác rồi:
npm run tao-quan-tri -- sep
```

Máy sẽ **hỏi mật khẩu**, không hiện lên màn hình. Xong thì mở trang nhân viên và đăng nhập.

Kiểm máy chủ đã sẵn sàng chưa (chạy được từ máy khác trong mạng):

```bash
npm run kiem-may-chu http://192.168.x.x:3000
```

> 🔴 **Đang chạy trong mạng nội bộ thì KHÔNG có HTTPS.** Chỉ dùng cho máy trong cùng wifi
> của trung tâm — **đừng mở cổng ra Internet** ở chế độ này, vì đường truyền chưa mã hoá mà
> đang đi qua họ tên và số điện thoại phụ huynh. Muốn chạy **online thật** (link quảng cáo,
> người lạ mở từ 4G) thì cần tên miền + HTTPS.

### Mở một chương trình mới

1. Vào **TỔ CHỨC › Cơ sở**, khai các cơ sở (mã CS1, CS2… máy tự sinh).
2. Vào **Trúng Số › Tạo chương trình**: chọn cơ sở, chọn **chế độ chơi**, đặt số trúng
   thưởng, độ khó, phần thưởng, trần giải mỗi ngày và **số lần bấm mỗi ván**.
3. Nhìn khối **Tỉ lệ trúng ước tính** — nó nói thẳng *"khoảng N giải mỗi ngày"*. Dải đỏ
   nghĩa là dự báo đã vượt trần bạn vừa đặt.
4. Vào trang chi tiết, khai **Kho quà** (xem dưới), rồi **In mã QR** dán ở quầy.
5. Mở **Màn hình LCD** trên máy nối với TV, bật toàn màn hình, bấm **🔊 Bật tiếng** một lần
   đầu ca làm.

### Hai chế độ chơi

| | **Tại quầy** | **Online** |
| --- | --- | --- |
| Dãy số hiện ở | Màn hình LCD | Chính điện thoại người chơi |
| Điện thoại là | Nút bấm | Cả bảng số lẫn nút bấm |
| Cùng lúc | **Một người** | Bao nhiêu người cũng được |
| Dùng khi | Có khán giả ở quầy | Chạy quảng cáo |

### Kho quà

Khai theo **thứ tự ưu tiên**, trên xuống dưới. Hết loại trên mới sang loại dưới.

> 🔴 **Luôn để một loại ở đáy kho với ô "Số lượng" ĐỂ TRỐNG** (không giới hạn) — ví dụ
> "Buổi học thử". Không có nó thì khi hết hàng, người **trúng thật** sẽ ra về tay không.
> Màn hình sẽ cảnh báo vàng nếu bạn quên.

Ba kênh báo kho: dải màu trong trang quản trị · một chấm nhỏ cạnh mã phòng trên LCD (nhân
viên hiểu, khách nhìn không biết là gì) · một dòng trong Nhật ký.

### Khách tiềm năng

Mọi phụ huynh bấm **TIẾP TỤC** đều thành một dòng khách — kể cả người bị chặn vì đã chơi
hôm nay. Lọc theo cơ sở, trạng thái, sale, khoảng ngày; giao khách cho sale bằng ô xổ
xuống trên từng dòng, hoặc bấm **Chia luân phiên** cho những khách chưa giao.

- Ô **"Chỉ người đồng ý nhận tư vấn"** **bật sẵn**. Cái tick đó là căn cứ hợp pháp để gọi
  điện — muốn xem hết thì phải chủ động bỏ tick.
- Số điện thoại **che sẵn**; bấm **Hiện đầy đủ** khi cần gọi.
- Nhãn **"Số chưa xác thực"** nghĩa là khách chơi online tự gõ số, chưa qua mã xác minh.
- **Xuất Excel** lấy **đúng những dòng đang hiện trên màn**, không phải toàn bộ.

### Sao lưu

```bash
npm run sao-luu
```

`npm run trung-tam` đã tự sao lưu mỗi lần khởi động, nhưng chạy tay trước mọi việc đụng tới
dữ liệu thì vẫn nên. Nó giữ 14 bản gần nhất.

> 🔴 **Bản sao vẫn nằm trên CÙNG cái máy này.** Máy hỏng ổ cứng hay mất trộm là mất cả bản
> gốc lẫn mọi bản sao. Cắm một ổ cứng ngoài rồi trỏ chỗ để bản sao sang đó:
> `export GAME_SU_KIEN_SAO_LUU=/Volumes/O-NGOAI/sao-luu-game-su-kien`

Mất dữ liệu rồi thì làm theo **`docs/sop/KHOI-PHUC-CSDL.md`** — và việc đầu tiên là **DỪNG
TAY**, đừng khởi động lại máy chủ.

---

## Dành cho NGƯỜI PHÁT TRIỂN

| Lệnh | Việc |
| ---- | ---- |
| `npm run dev` | Chạy trên máy này |
| `npm run dev:dienthoai` | Mở cho cả mạng LAN (thử bằng điện thoại thật) |
| `npm test` | 360 bài test |
| `npm run lint` · `npx tsc --noEmit` | Soi mã |
| `npm run build` | Dựng bản phát hành |
| `npm run e2e` | 13 kịch bản trình duyệt thật trên **bản build**, CSDL tạm |
| `npm run anh-chup` | Bộ ảnh nghiệm thu bằng mắt |
| `npm run sao-luu` | Sao lưu CSDL |
| `npm run trung-tam` | **Mở máy tại quầy** — sao lưu + dựng + chạy cho cả mạng LAN |
| `npm run kiem-may-chu [địa chỉ]` | Kiểm máy chủ sau khi khởi động (5 mục) |
| `npm run tao-quan-tri -- <tên>` | Tạo / đổi mật khẩu tài khoản quản trị |

Biến môi trường: `GAME_SU_KIEN_CSDL` (đường dẫn tệp CSDL) · `GAME_SU_KIEN_KHOA_PHIEN`
(khoá ký phiên, ≥ 32 ký tự) · `GAME_SU_KIEN_HTTPS=1` (chỉ khi thật sự chạy sau HTTPS).

Luật viết mã, cạm bẫy đã trả giá và bối cảnh: **`CLAUDE.md`** cùng thư mục.
Quyết định kiến trúc: `docs/decisions/ADR-001` … `ADR-008` trong dự án IDEA.

---

## Điều PHẢI biết trước khi mở cho phụ huynh thật

- **Chế độ online KHÔNG xác thực số điện thoại.** Giới hạn "1 ván mỗi ngày" chỉ cần gõ số
  khác là qua được. Lead online mang nhãn *"Số chưa xác thực"* — gọi thử trước khi tính vào
  chỉ tiêu.
- **Câu hỏi pháp lý về khuyến mại may rủi (NĐ 81/2018) vẫn đang treo.** Code chạy được
  không có nghĩa là được phép chạy quảng cáo.
- **Trẻ dưới 16 tuổi:** thu số điện thoại của trẻ cần đồng ý của cha mẹ. Chưa có quy trình
  cho việc này.
