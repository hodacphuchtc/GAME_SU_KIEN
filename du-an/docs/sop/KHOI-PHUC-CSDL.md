# Khôi phục cơ sở dữ liệu — GAME_SU_KIEN

> Đọc khi: mở trang quản trị thấy **trắng trơn**, mất chương trình, mất khách tiềm năng,
> hoặc tệp `du-lieu/game-su-kien.db` bị xoá / bị ghi đè.
>
> **Nguyên tắc số một: DỪNG TAY.** Đừng khởi động lại máy chủ, đừng chạy `npm run trung-tam`.
> Máy chủ khởi động sẽ **tạo một cơ sở dữ liệu trắng** ở đúng chỗ đó, và bản sao lưu tự động
> chạy ngay sau đó sẽ sao lưu chính cái tệp trắng ấy đè lên bản cũ nhất. Mỗi lần khởi động
> nhầm là mất thêm một bản sao.

## 0. Chuyện đã từng xảy ra thật

01/09/2026: một lệnh chẩn đoán gõ nhầm đường dẫn đã **tạo ra** một tệp `.db` rỗng (mở
`DatabaseSync` vào đường dẫn không tồn tại là TẠO tệp mới, không phải báo lỗi). Hàm đổi tên
sau đó mang đúng tệp rỗng ấy đặt vào chỗ cơ sở dữ liệu thật. **App vẫn khởi động, trang vẫn
mở, chỉ là trắng trơn — không một dòng báo lỗi nào.** Bản sao lưu cứu lại.

Bài học rộng hơn: **lệnh chẩn đoán cũng ghi được vào đĩa.** Đọc dữ liệu thì mở
`{ readOnly: true }`.

## 1. Tắt máy chủ

```bash
ps -eo pid,command | grep next-server | grep -v grep
kill <PID>
```

⚠️ `pkill -f "next start"` **KHÔNG khớp** — tiến trình thật tên `next-server`. Máy chủ cũ
còn sống sẽ giữ cổng và tiếp tục ghi vào cơ sở dữ liệu.

## 2. Giữ lại hiện trường

Đừng xoá tệp đang hỏng — nó có thể còn dữ liệu, và nó là bằng chứng để hiểu chuyện gì đã xảy ra.

```bash
cd modules/GAME_SU_KIEN/app
mv du-lieu/game-su-kien.db du-lieu/game-su-kien.db.hong-$(date +%Y%m%d-%H%M)
mv du-lieu/game-su-kien.db-wal du-lieu/game-su-kien.db-wal.hong 2>/dev/null
mv du-lieu/game-su-kien.db-shm du-lieu/game-su-kien.db-shm.hong 2>/dev/null
```

🔴 **Cả ba tệp** — `.db`, `-wal`, `-shm`. Bỏ quên `-wal` là bỏ quên phần dữ liệu mới nhất
chưa kịp gộp vào tệp chính.

## 3. Chọn bản sao lưu

```bash
ls -lah ../sao-luu-game-su-kien/
```

Bản sao đặt tên theo thời điểm. Chọn bản **mới nhất mà chắc chắn còn tốt** — nếu không rõ
tệp hỏng từ lúc nào thì lùi thêm một bản.

Kiểm bản sao TRƯỚC khi dùng (mở ở chế độ **chỉ đọc**, không ghi gì vào nó):

```bash
node -e '
const { DatabaseSync } = require("node:sqlite");
const db = new DatabaseSync(process.argv[1], { readOnly: true });
for (const b of ["chuong_trinh", "van_choi", "nguoi_choi", "khach_tiem_nang", "co_so"]) {
  console.log(b, db.prepare(`select count(*) as n from ${b}`).get().n);
}
db.close();
' ../sao-luu-game-su-kien/<tên-bản-sao>.db
```

Con số bằng 0 ở mọi bảng nghĩa là bản sao này cũng đã là bản trắng — lùi tiếp một bản.

## 4. Đưa bản sao về chỗ cũ

```bash
cp ../sao-luu-game-su-kien/<tên-bản-sao>.db du-lieu/game-su-kien.db
```

`cp`, **không phải** `mv` — giữ nguyên bản sao ở chỗ của nó phòng khi bước sau còn hỏng.

## 5. Khởi động lại và KIỂM

```bash
npm run trung-tam
# ở một cửa sổ khác:
npm run kiem-may-chu http://localhost:3000
```

Rồi mở `/quan-tri` bằng mắt: đúng số chương trình, đúng số khách tiềm năng như trước sự cố.

## 6. Sau khi xong

- Ghi lại vào `modules/GAME_SU_KIEN/TRUNG_SO/PLAN_TRUNG_SO_V2.md` (hoặc `CLAUDE.md` mục Cảnh báo):
  **mất bao nhiêu dữ liệu**, và **vì sao**.
- Nếu mất dữ liệu của cả một buổi: xem lại tần suất sao lưu. Hiện `npm run trung-tam` sao lưu
  **một lần mỗi khi khởi động**; trung tâm chạy liên tục cả ngày thì đó là một lần mỗi ngày.

## 7. Lỗ hổng đang còn — đọc cho biết

🔴 **Bản sao lưu vẫn nằm trên CÙNG một cái máy.** Máy hỏng ổ cứng, mất trộm, hay cháy thì
mất cả bản gốc lẫn mọi bản sao cùng lúc.

Đây là hạng mục **`N.7`** trong sổ lộ trình và nó **chưa làm**: cần một nơi để bản sao
**ngoài máy đó** (object storage, Drive, hay đơn giản là một ổ cứng ngoài cắm vào rồi
`rsync` mỗi tối). Đổi chỗ để bản sao bằng biến môi trường:

```bash
export GAME_SU_KIEN_SAO_LUU=/Volumes/ODIA-NGOAI/sao-luu-game-su-kien
```

Rẻ nhất trong mọi hạng mục còn lại, và bảo vệ thứ đắt nhất.
