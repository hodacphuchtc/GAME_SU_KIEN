# Kiểm thử đầu–cuối (e2e)

Những kịch bản ở đây **lái trình duyệt thật** trên **bản build thật** (`npm run build`
rồi `next start`), không phải bản dev. Chúng là thứ đã bắt được các lỗi mà 360 bài
test đơn vị và `npm run build` đều không thấy — xem mục "CẢNH BÁO / CẠM BẪY" trong
`CLAUDE.md` của repo IDEA.

## Chạy

```bash
npm run e2e            # dựng, khởi động trên cổng 3111, chạy hết kịch bản, tắt máy chủ
npm run e2e -- gd11    # chỉ chạy một kịch bản
```

## Ba luật của thư mục này

1. **KHÔNG đụng vào cơ sở dữ liệu thật.** Bộ chạy luôn đặt `GAME_SU_KIEN_CSDL` sang một
   tệp tạm và xoá nó trước mỗi lần chạy. Chưa bao giờ có ngoại lệ, và đừng tạo cái đầu tiên.
2. **Chạy trên bản BUILD, không phải `next dev`.** `next dev` chặn tài nguyên từ mọi địa
   chỉ khác `localhost` và hành xử khác ở nhiều chỗ; nghiệm thu trên nó là nghiệm thu một
   ứng dụng khác.
3. **Tắt máy chủ theo PID.** `pkill -f "next start"` KHÔNG khớp — tiến trình thật tên
   `next-server`. Máy chủ cũ còn sống sẽ giữ cổng và trả lời, và bài đo cho kết quả của
   phiên bản cũ mà không ai biết.

## Vì sao viết bằng Playwright thuần chứ không phải `@playwright/test`

Ứng dụng có luật **tự chứa**: `git clone` + `npm start` là chạy, không thêm phụ thuộc.
Playwright ở đây được nạp từ bộ nhớ đệm `npx` sẵn có trên máy (`DUONG_DAN_PLAYWRIGHT`
trong `playwright.mjs`), không nằm trong `package.json`. Đổi lại, mỗi kịch bản tự in ra danh
sách bước và tự quyết đạt/hỏng — đủ dùng, và không kéo theo một bộ khung test thứ hai.
