# BRD — DEM_SO: Bộ đếm may mắn cho trung tâm

- **Mã:** DEM_SO
- **Ngày lập:** 30/08/2026
- **Nguồn ý tưởng:** `modules/GAME_SU_KIEN/DATA/VIDEO PHAN TICH.mp4` (47 giây, quay dọc)
- **Sản phẩm:** web app tĩnh, repo riêng `https://github.com/hodacphuchtc/DEM_SO`

---

## 1. Phân tích video nguồn

Video của kênh *Ý Tưởng Khởi Nghiệp (10X Startup)* phân tích một quán ăn ở **Lebanon**
(Kitchen Garage). Lời thoại ghép lại từ 24 khung hình đã trích:

> "Khi trò chơi trở thành **công cụ marketing** mà không cần tốn [chi phí quảng cáo]… Ở
> Lebanon… tưởng như đơn giản: **nút bấm của đồng hồ đếm giây**… [dừng] **chính xác ở mốc
> 10 giây**… bạn sẽ được **ăn miễn phí**… để canh chuẩn từng giây **là điều gần như không
> thể**… kiểu hôm nay làm chưa được **lại kích thích tâm lý** thì **mai phải quay lại thử
> tiếp**… [quán] cũng **đông nghẹt**… **hàng trăm video** [khách tự quay] giúp quán nổi
> tiếng… **marketing đỉnh cao**."

**Cơ chế quan sát được trên khung hình:** một **bảng LED đỏ 4 chữ số** gắn tường (hiện
`04:86`, `09:91`, `09:82`, `10:00`…) chạy theo **giây : phần trăm giây**, cạnh đó là **nút
bấm đỏ** và bảng nội quy *"Press the timer to stop at 10:00 and get the meal you have
ordered for free"*. Khách xếp hàng bấm, trượt, cười, quay video, hôm sau quay lại.

### 1.1 Bốn đòn bẩy làm nó chạy (bắt buộc giữ khi chuyển sang app)

| # | Đòn bẩy | Vì sao quan trọng | Chuyển sang DEM_SO thế nào |
| - | ------- | ----------------- | -------------------------- |
| 1 | **Mục tiêu công khai** | Ai cũng biết phải dừng ở `10:00`. Cái khó không nằm ở bí mật mà ở tay | Số trúng hiện to ngay trên màn chơi: `SỐ TRÚNG THƯỞNG HÔM NAY: 0211` |
| 2 | **Hai số đầu ĐỌC ĐƯỢC, hai số cuối NHOÈ** | Người chơi *tin là mình canh được* (kỹ năng) trong khi thực tế là may rủi. Đây là chi tiết kỹ thuật quan trọng nhất | Chốt `tocDoToiDa = 800 số/giây`: hàng nghìn + hàng trăm đọc được, hàng chục + đơn vị nhoè |
| 3 | **Trượt trong gang tấc** | `09:91` chứ không phải `03:47`. Hụt sát nút mới đẻ ra "mai quay lại thử tiếp" | Màn trượt bắt buộc hiện `Bạn dừng ở 0215 — lệch 4 số!` |
| 4 | **Một cú bấm, có khán giả** | Kịch tính đủ ngắn để quay clip đăng mạng | Một lượt ≤ 30 giây; có đếm ngược 3-2-1, tiếng tick nhanh dần, pháo giấy khi trúng |

### 1.2 Cái KHÔNG bê nguyên từ video sang

- **Phần cứng** (bảng LED + nút vật lý gắn tường): tốn tiền, phải thi công. DEM_SO chạy
  trên **điện thoại của chính phụ huynh** — quét QR là chơi.
- **Đích "10 giây"**: DEM_SO dùng **số 4 chữ số nhân viên tự cài** (vd `0211` — có thể là
  ngày khai giảng, số nhà, ngày sinh nhật trung tâm) nên đổi được mỗi ngày, mỗi sự kiện.

---

## 2. Bài toán & người dùng

**Bài toán:** trung tâm cần một trò chơi ngắn, vui, không tốn chi phí quảng cáo, khiến phụ
huynh/học sinh dừng lại ở quầy, tự quay clip và **quay lại lần sau**.

| Vai | Là ai | Cần gì |
| --- | ----- | ------ |
| **Người chơi** | Phụ huynh hoặc học sinh đến trung tâm | Quét QR là chơi ngay, không cài app, không đăng ký, không khai thông tin |
| **Nhân viên quầy** | Người trực quầy | Đổi số trúng + độ khó trong 30 giây; in QR dán quầy; nhìn màn hình là biết trúng thật hay giả |

---

## 3. Phạm vi

**IN (làm trong giai đoạn này):**

- Màn chơi mobile-first: bảng LED 4 chữ số, đếm ngược 3-2-1, nút BẮT ĐẦU / DỪNG.
- Bộ đếm tăng dần + tăng tốc theo hàm mũ; bấm dừng lấy đúng mốc thời gian sự kiện chạm.
- Màn kết quả: TRÚNG (pháo giấy + mã xác thực 60 giây) / TRƯỢT (nói rõ lệch mấy số).
- Trang `/cai-dat` cho nhân viên: nhập số trúng, chọn độ khó, tên trung tâm, tên giải →
  sinh link + **QR để in**.
- Trang `/the-le`.
- Âm thanh tick nhanh dần + nhạc trúng (tự tổng hợp bằng Web Audio, không file, không
  vướng bản quyền); rung máy khi bấm/khi trúng.

**IN — bổ sung 30/08/2026 (giai đoạn 2): chiếu song song lên màn hình LCD.**
Màn hình lớn tại trung tâm chiếu mã QR; phụ huynh quét; ván chơi hiện song song trên cả
điện thoại lẫn LCD, kết quả cuối khớp tuyệt đối. Chi tiết ở § 7.

**OUT (cố tình không làm — và nó thuộc về đâu):**

| Không làm | Vì sao | Sau này thuộc về |
| --------- | ------ | ---------------- |
| Lưu lịch sử lượt chơi, thống kê, báo cáo | Đã chốt "không lưu gì cả" | Giai đoạn sau, cần Supabase |
| Giới hạn mỗi người 1 lượt/ngày | Không lưu thì không chặn được về mặt kỹ thuật (xem § 6) | Giai đoạn sau, cần Supabase |
| Thu tên / số điện thoại người chơi | `.claude/rules/security.md` — không đụng dữ liệu định danh | Không làm |
| Đăng nhập, phân quyền | Trang cài đặt không giữ bí mật gì; ai mở được cũng chỉ sinh ra một link chơi | Không cần |
| Bản chạy trên TV / nút bấm vật lý | Đã chốt thiết bị là điện thoại phụ huynh | Giai đoạn sau nếu trung tâm muốn |

---

## 4. Luật chơi (bản chốt)

1. Mở link → thấy **số trúng thưởng** + bảng LED `0000`.
2. Bấm **BẮT ĐẦU** → đếm ngược **3-2-1**.
3. Dãy 4 chữ số chạy từ `0000` **tăng dần**, tốc độ **tăng liên tục** trong 6 giây đầu
   (250 → 800 số/giây) rồi giữ đỉnh. Chạy hết `9999` thì quay vòng về `0000`.
4. **Nút DỪNG bị khoá 6 giây đầu** (hiện `ĐANG TĂNG TỐC…`) — xem § 5.2 để hiểu vì sao.
5. Bấm **DỪNG** → lấy con số tại đúng khoảnh khắc chạm.
   - Trùng số đã cài → **TRÚNG**.
   - Không trùng → **TRƯỢT**, hiện rõ **lệch bao nhiêu số** (tính vòng tròn, lấy khoảng
     nhỏ hơn giữa hai chiều — vd dừng `9998` với số cài `0002` là **lệch 4**, không phải
     9996).
6. Quá **30 giây** không bấm → tự dừng, tính là trượt.

---

## 5. Thiết kế bộ đếm — chốt bằng con số, không cảm tính

### 5.1 Mô hình toán

```
v(t) = v0 · r^(t/T)   với t ≤ T,  r = vmax/v0      (số/giây)
v(t) = vmax           với t > T
n(t) = v0·T/ln(r) · (r^(t/T) − 1)                  (tổng số đã đếm)
Hiển thị = floor(n(t)) mod 10000
```

**Bấm DỪNG lấy `event.timeStamp` của chính sự kiện chạm** rồi tính `n(t)` bằng công thức —
KHÔNG lấy con số đang vẽ trên màn hình. Nhờ vậy kết quả không phụ thuộc frame rate: máy
yếu, máy khoẻ, máy đang lag đều cho cùng một kết quả. Đây là điều kiện để trò chơi **công
bằng và trung thực**.

### 5.2 Vì sao `vmax = 800 số/giây`

Tỉ lệ trúng mỗi lần số mục tiêu lướt qua ≈ `1 / (vmax × độ_lệch_phản_xạ)`, độ lệch phản xạ
người thường ≈ 0,08 giây:

| vmax | Chữ số hàng trăm | Cảm giác người chơi | Tỉ lệ mỗi lần lướt qua |
| ---- | ---------------- | ------------------- | ---------------------- |
| 400  | đổi 4 lần/giây — đọc rõ | dễ, canh được | ~1/32 |
| **800** | **đổi 8 lần/giây — vẫn đọc được** | **tin là kỹ năng** ✅ | **~1/64** |
| 1500 | đổi 15 lần/giây — bắt đầu nhoè | may rủi | ~1/120 |
| 3000+ | nhoè hết | vô vọng, chán, bỏ chơi | ~1/240 |

`800` giữ đúng **đòn bẩy số 2** của video.

> **Điều bất ngờ, đã kiểm chứng bằng toán VÀ bằng test:** tỉ lệ trúng cả lượt bằng
> `(số lần lướt qua) × (tỉ lệ mỗi lần)` = `(v·(giới_hạn − khoá)/10000) / (v·0,08)`
> — **tốc độ `v` triệt tiêu hoàn toàn**. Nói cách khác: **tốc độ quyết định CẢM GIÁC khó,
> còn tỉ lệ trúng chỉ do (giới hạn lượt − thời gian khoá nút) quyết định.** Vì vậy bốn mức
> khó phải khác nhau ở CẢ hai tham số, không chỉ ở tốc độ — nếu chỉ đổi tốc độ thì "Dễ" và
> "Khó" có cùng tỉ lệ trúng, chỉ khác vẻ ngoài.

### 5.3 Vì sao khoá nút DỪNG 6 giây đầu

Nếu mở nút ngay, số cài **nhỏ** (vd `0211`) bị lướt qua ở khoảng giây thứ 1 khi máy còn
chạy chậm ⇒ dễ ăn gian; còn số cài **lớn** (`9800`) thì không ⇒ hai số cài khác nhau có độ
khó khác nhau, trò chơi không công bằng.

Khoá nút đúng bằng thời gian tăng tốc (6 giây) xử lý triệt để: lúc mở nút bộ đếm đang ở
`~2837` và **đã đạt tốc tối đa**, nên **mọi số cài đều chỉ có thể gặp ở 800 số/giây**.

Kiểm chứng bằng số (số cài → giây gặp lần 1, lần 2):

| Số cài | Lần 1 | Lần 2 |
| ------ | ----- | ----- |
| `0211` | 15,2s | 27,7s |
| `3000` | 6,2s  | 18,7s |
| `9000` | 13,7s | 26,2s |

Giới hạn lượt 30 giây ⇒ **ai cũng có ít nhất 2 cơ hội**, tất cả ở cùng tốc độ. Đoạn khoá
nút cũng chính là đoạn dựng kịch tính trước khi bấm.

### 5.4 Hằng số nghiệp vụ (đặt ở `config/`, KHÔNG hardcode — rule 4 module-boundaries)

```ts
tocDoBatDau: 250      // số/giây lúc xuất phát
tocDoToiDa: 800       // số/giây khi đạt đỉnh
thoiGianTangToc: 6    // giây
khoaNutDungGiay: 6    // = thoiGianTangToc
gioiHanLuotGiay: 30   // hết giờ = trượt
demNguocGiay: 3       // 3-2-1 trước khi chạy
```

Bốn mức có sẵn cho nhân viên (số đo lấy từ chính hàm `estimateWinChance`, số cài `0211`):

| Mức | vmax | Giới hạn lượt | Số lướt qua | Tỉ lệ mỗi lượt | Dùng khi |
| --- | ---- | ------------- | ----------- | -------------- | -------- |
| **Chế độ thử** | 8 | 180s | 1 | gần như chắc chắn | Xem trước màn TRÚNG, demo cho khách. Chỉ chạy tới ~1440 nên **số cài phải nhỏ hơn 1440** |
| **Dễ** | 400 | 60s | 2 | ~1/16 | Ngày vắng, muốn phát nhiều quà |
| **Vừa** ✅ | 800 | 30s | 2 | ~1/32 | Mặc định |
| **Khó** | 1500 | 20s | 2 | ~1/60 | Giải thưởng lớn |
| **Tuỳ chỉnh** | tự đặt | tự đặt | — | tính ngay | Khi cần chỉnh tay |

Trang cài đặt hiện luôn tỉ lệ trúng ước tính, và **cảnh báo đỏ nếu cấu hình khiến con số
cài không bao giờ lướt qua** (ví dụ Chế độ thử + số cài 9000 ⇒ không ai trúng nổi).

### 5.5 Cấu hình đi trong URL, không cần server

Không backend, không lưu gì ⇒ **URL trong QR chính là cấu hình**:

```
https://<domain>/?so=0211&muc=vua&tt=Trung+t%C3%A2m+ABC&qua=Voucher+200k
```

Số trúng vốn **công khai** (đúng như mốc `10:00` của quán) nên URL lộ số không phải vấn đề.

---

## 6. Rủi ro đã biết & cách xử

| Rủi ro | Mức | Cách xử trong bản này |
| ------ | --- | --------------------- |
| **Chơi lại không giới hạn** — "không lưu gì" ⇒ không chặn được bằng kỹ thuật; ai kiên trì bấm sẽ trúng | Cao | Chấp nhận có chủ ý: cách vận hành thực tế là phụ huynh quét QR và **chơi ngay trước mặt nhân viên tại quầy** — nhân viên chính là bộ đếm lượt. Muốn siết thật thì phải có nơi lưu ⇒ giai đoạn sau |
| **Chụp màn hình trúng rồi khoe cho người khác lĩnh thưởng** | Vừa | Màn TRÚNG có **đồng hồ ngược 60 giây đang chạy** + **mã xác thực 4 ký tự đổi theo phút**. Ảnh chụp đứng yên và mã hết hạn ⇒ phải đưa máy đang chạy cho nhân viên xem |
| **Sửa URL để đổi số trúng thành số vừa dừng** | Thấp | Số trúng của ngày được **in trên QR/poster dán tại quầy**; nhân viên đối chiếu màn hình với poster |
| **Máy yếu/lag làm kết quả sai lệch** | Vừa | Kết quả tính từ `event.timeStamp`, không phụ thuộc khung hình đang vẽ (§ 5.1) |
| **Quá khó ⇒ không ai trúng ⇒ phụ huynh chán** | Vừa | Ba mức khó + trang cài đặt hiện tỉ lệ trúng ước tính để nhân viên tự chỉnh |

---

## 7. Chiếu song song lên màn hình LCD (bổ sung 30/08/2026)

### 7.1 Quyết định này ĐẢO một quyết định cũ — nói thẳng

§ 5.5 chốt "không backend". Muốn hai thiết bị nhìn thấy cùng một ván thì **bắt buộc phải
có một chỗ trung chuyển** — không có cách nào lách. Nên giai đoạn 2 thêm
`server/relay.mjs`: một tiến trình Node thuần, không thư viện, **giữ tin trong bộ nhớ và
mất sạch khi tắt**. Nó là cái LOA, không phải cái SỔ — quyết định "không lưu gì" ở § 3
vẫn còn nguyên hiệu lực.

### 7.2 Cách đồng bộ — điểm dễ làm sai nhất

**KHÔNG truyền từng con số qua mạng.** Ở 800 số/giây thì việc đó vừa nghẽn mạng vừa lệch
nhịp. Thay vào đó:

1. Điện thoại báo `bat-dau` kèm tham số ván.
2. LCD tự chạy bảng số bằng **chính công thức § 5.1** — nó có đủ dữ kiện để tự tính.
3. Điện thoại báo `ket-qua` kèm con số đã dừng; LCD **nhảy thẳng** về đúng con số đó.

Hệ quả: độ trễ mạng chỉ làm lệch phần **nhoè** ở giữa — thứ không ai nhìn ra — còn **con
số cuối khớp 100%**. Đây là lý do lõi bộ đếm phải là hàm THUẦN của thời gian ngay từ đầu.

### 7.3 Luật vận hành

| Tình huống | Xử lý |
| ---------- | ----- |
| Hai phụ huynh cùng bấm | **Một người một lượt.** Người thứ hai thấy "Màn hình lớn đang có người chơi" và **vẫn chơi bình thường trên máy mình** |
| Mất kết nối máy chủ trung chuyển | Điện thoại **vẫn chơi trọn vẹn**; LCD hiện cảnh báo cho nhân viên. Chiếu lên LCD là phần thưởng thêm, không phải điều kiện |
| Phụ huynh bỏ đi giữa chừng | LCD tự về màn chờ sau 75 giây |
| Xong một ván | LCD về mã QR sau 8 giây (thắng: 25 giây, để kịp chụp ảnh khoe) |

### 7.4 Giới hạn còn lại

Máy chủ trung chuyển chạy trong **mạng LAN của trung tâm** ⇒ phụ huynh phải vào wifi trung
tâm, và máy chạy lệnh phải luôn bật. Muốn chạy qua 4G thì thay đúng hai hàm
`subscribeRoom` / `sendToRoom` trong `lib/ket-noi.ts` bằng một dịch vụ realtime trên
mạng (Supabase Realtime — đã nằm trong stack dự án); phần còn lại của ứng dụng không phải
sửa gì. Việc đó cần tài khoản + khoá ⇒ thuộc mục **CHỜ NGOÀI**.

---

## 8. Tiêu chí nghiệm thu

**Tự động** (trong `modules/GAME_SU_KIEN/app/`): `npm test` · `npm run lint` · `npm run build`
(static export) đều xanh. Tại gốc IDEA: `node scripts/check-structure.mjs` exit 0.

**Bằng tay — người dùng tự bấm thử được:**

1. Mở `/cai-dat`, nhập `0211`, mức **Vừa** → bấm link sinh ra.
2. Chơi một lượt: thấy đếm ngược 3-2-1 → nút khoá 6 giây → mở → bấm DỪNG → màn TRƯỢT nói
   đúng **"lệch N số"**.
3. Xem màn TRÚNG không cần may mắn: `/cai-dat` → **Tuỳ chỉnh**, đặt tốc độ đầu = tốc độ
   tối đa = `2` số/giây, tăng tốc = 0, khoá nút = 0, số cài = `0004` → mỗi con số hiện
   nửa giây, bấm trúng dễ dàng → kiểm tra pháo giấy, đồng hồ ngược 60 giây, mã xác thực.
   (Đã tự động hoá: kịch bản Playwright bấm đúng giây 2,25 và trúng ổn định.) Đổi lại mức
   **Vừa** sau khi xem xong.
4. Mở trên **điện thoại thật** cùng wifi: ngón cái với tới nút, chữ số đủ lớn, có tiếng
   tick nhanh dần, máy rung khi bấm.
5. Quét QR ở `/cai-dat` bằng camera điện thoại → mở đúng ván đã cấu hình.
6. **Chiếu song song:** chạy `npm run trung-tam`, mở `/man-hinh/` trên máy nối LCD, quét
   mã QR đang hiện trên đó bằng điện thoại → chơi một ván → LCD phải chiếu đúng nhịp và
   **hiện đúng con số cùng câu "lệch N số"** như trên điện thoại.
7. Người thứ hai bấm chơi trong lúc màn hình đang bận → thấy "Màn hình lớn đang có người
   chơi" nhưng **vẫn chơi được bình thường**.
8. Tắt máy chủ trung chuyển → LCD hiện cảnh báo, **điện thoại vẫn chơi trọn vẹn**.
