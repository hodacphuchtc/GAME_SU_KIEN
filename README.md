# DEM_SO — Bộ đếm may mắn

Trò chơi quay số cho trung tâm. Một dãy **4 chữ số chạy tăng dần và mỗi lúc một nhanh**;
phụ huynh hoặc học sinh bấm **DỪNG** — trùng đúng con số đã cài thì trúng thưởng.

Chạy trên **điện thoại của chính người chơi**: quét mã QR dán ở quầy là chơi được ngay,
không cần cài ứng dụng, không phải đăng ký, không khai thông tin cá nhân.

## Chơi thế nào

1. Mở đường dẫn (hoặc quét QR) → thấy **SỐ TRÚNG THƯỞNG** của hôm nay.
2. Bấm **BẮT ĐẦU**, chờ đếm ngược 3 – 2 – 1.
3. Bảng số chạy từ `0000` và tăng tốc dần. Nút **DỪNG** bị khoá trong lúc tăng tốc.
4. Nút sáng đỏ thì bấm — trùng khít cả 4 chữ số mới tính là trúng.
5. Trượt thì màn hình nói rõ **lệch mấy số** để còn thử lại.

## Chiếu song song lên màn hình LCD tại trung tâm

Màn hình lớn chiếu mã QR; phụ huynh quét bằng điện thoại; **ván chơi hiện song song trên
cả hai màn hình và kết quả cuối khớp tuyệt đối**.

```bash
npm run trung-tam          # chạy MỘT lệnh cho cả trung tâm
```

Lệnh này bật cùng lúc web (cổng 3000) và máy chủ trung chuyển (cổng 3001), rồi in sẵn các
địa chỉ cần mở. Trên máy nối với LCD, mở `/man-hinh/?so=0211&muc=vua` và bật toàn màn hình
(F11 hoặc ⌃⌘F). Màn hình tự sinh **mã phòng** 4 ký tự và vẽ mã QR chứa mã đó.

**Cách đồng bộ — đây là chỗ dễ làm sai nhất.** Ứng dụng **không** truyền từng con số qua
mạng. Điện thoại chỉ báo "bắt đầu" rồi "kết quả"; màn hình LCD tự chạy bảng số bằng chính
công thức trong `lib/bo-dem.ts`, và khi nhận kết quả thì nhảy thẳng về đúng con số điện
thoại đã dừng. Nhờ vậy độ trễ mạng chỉ làm lệch phần **nhoè** ở giữa — thứ không ai nhìn ra
— còn **con số cuối thì khớp 100%**.

Vài điều đã tính sẵn:

- **Một người một lượt.** Người thứ hai bấm chơi trong lúc màn hình đang bận sẽ thấy dòng
  "Màn hình lớn đang có người chơi" và **vẫn chơi bình thường trên máy mình**.
- **Chiếu lên LCD là phần thưởng thêm, không phải điều kiện.** Tắt máy chủ trung chuyển,
  rớt wifi hay quét nhầm mã phòng thì điện thoại vẫn chơi trọn vẹn.
- Xong một ván, LCD tự quay về mã QR sau 8 giây (thắng thì 25 giây để kịp chụp ảnh).
- Điện thoại bỏ đi giữa chừng thì LCD tự về màn chờ sau 75 giây, không treo ở đó.

> **Máy chủ trung chuyển KHÔNG lưu gì.** Nó chỉ là cái loa nối hai màn hình, giữ tin trong
> bộ nhớ và mất sạch khi tắt — không đĩa, không cơ sở dữ liệu, không dấu vết người chơi.
> Chỉ chạy trong mạng nội bộ của trung tâm; đừng mở nó ra Internet.

## Dành cho nhân viên trực quầy

Mở trang **`/cai-dat`**:

- Nhập **số trúng thưởng** 4 chữ số (ví dụ `0211`).
- Chọn **độ khó**: `Chế độ thử` (xem trước màn trúng) · `Dễ` · `Vừa` (khuyên dùng) ·
  `Khó` · `Tuỳ chỉnh`.
- Điền tên trung tâm và tên phần thưởng.
- Trang hiện ngay **tỉ lệ trúng ước tính** và cảnh báo nếu cấu hình khiến không ai
  trúng nổi (hoặc dễ trúng bất thường).
- Bấm **In trang này** để in **mã QR** dán tại quầy.

**Xác minh người trúng:** màn hình trúng có đồng hồ đếm ngược 60 giây đang chạy và một
**mã xác thực 4 ký tự tự đổi mỗi phút**. Trang `/cai-dat` cũng hiện mã của phút hiện tại —
hai bên khớp nhau nghĩa là màn hình đang chạy thật, không phải ảnh chụp.

> Ứng dụng **không lưu bất cứ dữ liệu nào** — không lịch sử, không thông tin người chơi.
> Vì vậy nó cũng **không giới hạn được số lượt**: cách vận hành đúng là phụ huynh quét QR
> và chơi ngay trước mặt nhân viên tại quầy.

## Chạy trên máy

```bash
npm install
npm run dev          # http://localhost:3000
npm test             # bộ test lõi bộ đếm
npm run lint
npm run build        # xuất web tĩnh ra thư mục out/
```

### Thử trên điện thoại thật

```bash
npm run dev:dienthoai        # mở cho cả máy khác trong mạng LAN
```

Rồi mở `http://<địa-chỉ-IP-của-máy>:3000/` trên điện thoại **cùng wifi**.

> `npm run dev` thường chỉ nghe `localhost`, điện thoại không vào được — phải dùng
> `dev:dienthoai`. Ngoài ra `next dev` mặc định **chặn tài nguyên dev từ địa chỉ khác
> localhost**: trang vẫn mở, vẫn thấy giao diện, nhưng JS không tải nên bấm gì cũng không
> ăn, trông y như app treo. `next.config.ts` đã khai sẵn `allowedDevOrigins` cho dải
> 192.168.\*, 10.\*, 172.16.\* và `*.local` để tránh cái bẫy này.

**Khi in mã QR nhớ mở `/cai-dat` bằng đúng địa chỉ mà điện thoại sẽ dùng** (không phải
`localhost`), hoặc sửa thẳng ô *Địa chỉ máy chủ* trên trang đó. Mở bằng `localhost` rồi in
thì tấm QR không ai quét được — trang có cảnh báo đỏ khi bạn rơi vào trường hợp này.

## Đưa lên mạng

`npm run build` sinh ra thư mục `out/` là web tĩnh thuần — đưa lên Vercel, Netlify,
GitHub Pages hay bất kỳ máy chủ tĩnh nào đều chạy. Không cần biến môi trường, không
cần khoá bí mật.

## Cấu hình nằm trong đường dẫn

```
https://<tên-miền>/?so=0211&muc=vua&tt=Trung+t%C3%A2m+ABC&qua=Voucher+200k
```

| Tham số | Nghĩa |
| ------- | ----- |
| `so`    | Số trúng thưởng, 4 chữ số |
| `muc`   | `thu` · `de` · `vua` · `kho` · `custom` |
| `tt`    | Tên trung tâm |
| `qua`   | Tên phần thưởng |
| `v0` `vmax` `ramp` `khoa` `gh` `dn` | Chỉ dùng khi `muc=custom`: tốc độ đầu, tốc độ đỉnh, thời gian tăng tốc, khoá nút DỪNG, giới hạn lượt, đếm ngược |

Con số trúng thưởng vốn **công khai** (như mốc `10:00` của quán ăn trong ý tưởng gốc), nên
việc nó nằm trên đường dẫn không phải là vấn đề.

## Cấu trúc

| Thư mục | Vai trò |
| ------- | ------- |
| `config/game.ts` | Toàn bộ hằng số nghiệp vụ + 4 mức khó. Sửa luật chơi thì sửa ở đây |
| `config/locale.ts` | Từ điển tiếng Việt duy nhất |
| `lib/bo-dem.ts` | Lõi bộ đếm — thuần tuý, được test kỹ |
| `lib/cau-hinh-url.ts` | Đọc–ghi cấu hình trên đường dẫn |
| `lib/ma-xac-thuc.ts` | Mã xác thực đổi theo phút |
| `lib/am-thanh.ts` `lib/rung.ts` | Tiếng tick tự tổng hợp (Web Audio) · rung máy |
| `components/` | Bảng LED 7 đoạn, nút bấm, màn kết quả |
| `app/` | 4 trang: màn chơi · `/cai-dat` · `/man-hinh` (LCD) · `/the-le` |
| `lib/ket-noi.ts` | Lớp truyền tin giữa điện thoại và màn hình LCD |
| `server/relay.mjs` | Máy chủ trung chuyển — Node thuần, không thư viện, không lưu gì |
| `tests/` | Vitest |

## Trò chơi được thiết kế thế nào

Tốc độ tăng theo hàm mũ rồi giữ đỉnh:

```
v(t) = v0 · r^(t/T)   với t ≤ T,  r = vmax/v0
n(t) = v0·T/ln(r) · (r^(t/T) − 1)
hiển thị = floor(n(t)) mod 10000
```

Ba lựa chọn đáng chú ý:

1. **`vmax` mặc định 800 số/giây** — hàng nghìn và hàng trăm còn đọc được để canh, hàng
   chục và hàng đơn vị thì nhoè. Người chơi vì thế *tin rằng mình canh được*, dù thực tế
   chủ yếu là may rủi. Đó là thứ khiến trò chơi gây nghiện chứ không gây nản.
2. **Nút DỪNG khoá đúng bằng thời gian tăng tốc** — nếu mở ngay, số cài nhỏ như `0211` sẽ
   bị lướt qua khi máy còn chạy chậm, dễ hơn hẳn số cài lớn. Khoá xong thì mọi số cài đều
   chỉ gặp được ở tốc độ đỉnh.
3. **Kết quả tính từ `event.timeStamp`, không lấy con số đang vẽ** — máy yếu, máy lag hay
   máy 120Hz đều cho cùng một kết quả.

Một điều đã kiểm chứng bằng toán và bằng test: **tốc độ đổi cảm giác khó, còn tỉ lệ trúng
lại do (giới hạn lượt − thời gian khoá nút) quyết định** — tốc độ tự triệt tiêu trong phép
tính. Vì vậy bốn mức khó khác nhau ở cả hai tham số, không chỉ ở tốc độ.
