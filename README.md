# ĐẾM SỐ — trò chơi quay số may mắn cho trung tâm

Màn hình lớn ở lễ tân chiếu **mã QR** và **dãy 4 chữ số chạy tăng dần, mỗi lúc một nhanh**.
Phụ huynh quét mã bằng điện thoại của mình, nhìn màn hình lớn rồi **bấm DỪNG** trên máy —
trùng đúng con số đã cài thì trúng thưởng, trượt thì được mời một buổi học thử miễn phí.

Ứng dụng **tự chứa mọi thứ**: giao diện, máy chủ, cơ sở dữ liệu và kênh đồng bộ thời gian
thực nằm chung một repo. Không Supabase, không Vercel, không Redis, **không tài khoản dịch
vụ nào**.

## Chạy tại trung tâm

```bash
npm install
npm run trung-tam
```

Một lệnh này dựng bản thật, chạy máy chủ và in sẵn các địa chỉ cần mở:

| Mở ở đâu | Địa chỉ |
| --- | --- |
| **Máy nối màn hình LCD** (bật toàn màn hình F11 / ⌃⌘F) | `http://<IP-máy>:3000/man-hinh/<mã>` |
| **Máy nhân viên** (tạo chương trình, in mã QR) | `http://<IP-máy>:3000/quan-tri` |
| **Điện thoại phụ huynh** | quét mã QR trên màn hình LCD |

Điện thoại phải **cùng wifi** với máy chạy. Lần đầu macOS hỏi *"accept incoming network
connections"* thì bấm **Allow**, không cho thì điện thoại không vào được.

Dữ liệu nằm ở `du-lieu/dem-so.db` — **tắt máy bật lại vẫn còn nguyên**.

## Nhân viên làm gì

1. Vào `/quan-tri` → **Tạo chương trình**: nhập số trúng thưởng 4 chữ số, chọn **Dễ /
   Trung bình / Khó**, đặt **trần số giải mỗi ngày**.
2. Trang hiện ngay **tỉ lệ trúng ước tính** — con số để quyết định treo giải gì.
3. Bấm **In mã QR** → dán tờ đó tại quầy, hoặc mở màn hình LCD để phụ huynh quét thẳng.
4. Khách báo trúng → so **mã xác thực** trên máy khách (đổi mỗi phút, có đồng hồ ngược 60
   giây) để biết màn hình đang chạy thật chứ không phải ảnh chụp.
5. Cần dừng gấp → nút **TẮT CHƯƠNG TRÌNH** màu đỏ, một bấm là xong.
6. Đối soát hoặc chuyển sang CRM → nút **Xuất CSV**.

## Ba cái van giữ cho không vỡ ngân sách

- **Một lượt mỗi số điện thoại mỗi ngày.** Không có van này thì ai kiên trì bấm sẽ trúng.
- **Trần giải mỗi ngày.** Chạm trần thì chuyển sang *chế độ chỉ vui*: vẫn chơi, vẫn ghi
  lịch sử, nhưng màn hình nói thẳng là hết quà.
- **Mỗi chương trình một màn hình và một người chơi** tại một thời điểm. Xong ván là nhả
  chỗ ngay cho người xếp hàng sau.

## Trò chơi được thiết kế thế nào

Tốc độ tăng theo hàm mũ rồi giữ đỉnh:

```
v(t) = v0 · r^(t/T)   với t ≤ T,  r = vmax/v0
n(t) = v0·T/ln(r) · (r^(t/T) − 1)
hiển thị = floor(n(t)) mod 10000
```

Bốn lựa chọn đáng chú ý:

1. **Điện thoại KHÔNG hiện dãy số** — chỉ là nút bấm. Một màn hình duy nhất thì không có
   hai màn hình để mà lệch nhau, và cả sảnh cùng nhìn về một chỗ.
2. **`vmax` mức Trung bình = 800 số/giây** — hàng nghìn và hàng trăm còn đọc được để canh,
   hàng chục và đơn vị thì nhoè. Người chơi vì thế *tin rằng mình canh được*.
3. **Nút DỪNG khoá đúng bằng thời gian tăng tốc** — nếu mở ngay, số cài nhỏ như `0211` bị
   lướt qua khi máy còn chạy chậm, dễ hơn hẳn số cài lớn.
4. **Máy nào bấm thì máy đó ĐO**, rồi gửi số mili-giây lên. Để máy chủ tính từ lúc *nhận*
   lệnh thì độ trễ mạng bị cộng vào: phụ huynh thấy `0211`, bấm, máy trả `0219`.

Một điều đã kiểm chứng bằng toán và bằng test: **tốc độ đổi CẢM GIÁC khó, còn tỉ lệ trúng
lại do (giới hạn lượt − thời gian khoá nút) quyết định** — tốc độ tự triệt tiêu trong phép
tính. Vì vậy ba mức khó khác nhau ở cả hai tham số, không chỉ ở tốc độ.

## Cấu trúc

| Thư mục | Vai trò |
| --- | --- |
| `config/game.ts` | Hằng số nghiệp vụ + ba mức khó. Sửa luật chơi thì sửa ở đây |
| `config/thuong-hieu.ts` | Bộ nhận diện Sata Robo (tím 30 / cam 10 / trắng 60, Be Vietnam Pro) |
| `config/locale.ts` | Từ điển tiếng Việt duy nhất |
| `lib/bo-dem.ts` | Lõi bộ đếm — hàm thuần của thời gian, được test kỹ |
| `lib/db/` | SQLite qua `node:sqlite` (có sẵn trong Node 24) |
| `lib/dong-bo/` | Kênh SSE + canh đồng hồ giữa hai máy |
| `lib/phien/`, `lib/luot/`, `lib/nguoi-choi/` | Giữ chỗ · vòng đời ván · nhận diện phụ huynh |
| `app/quan-tri/` | Trang nhân viên |
| `app/man-hinh/[ma]/`, `app/choi/[ma]/` | Màn hình LCD · màn hình điện thoại |
| `tests/` | Vitest |

## Lệnh khác

```bash
npm run dev                       # chỉ máy này
npm run dev:dienthoai             # mở cho cả mạng LAN (bản dev)
npm test                          # bộ test
npm run lint
node scripts/tao-thu.mjs 0211 vua # tạo nhanh một chương trình để thử tay
```

## Dữ liệu cá nhân

Ứng dụng lưu **họ tên và số điện thoại** phụ huynh để đối soát giải thưởng, kèm ô đồng ý
nhận tư vấn tách riêng. Bảng công khai chỉ hiện tên rút gọn (*Nguyễn H.*). File
`du-lieu/dem-so.db` **không** được đưa lên Git.

> ⚠️ Trước khi mở cho phụ huynh thật, cần hỏi luật về **khuyến mại mang tính may rủi**
> (Nghị định 81/2018) và chốt cách xử lý khi **trẻ em dưới 16 tuổi** chơi.
