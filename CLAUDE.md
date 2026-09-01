# GAME_SU_KIEN — hướng dẫn cho Claude Code

Ứng dụng **TỰ CHỨA MỌI THỨ**: giao diện, máy chủ Node, cơ sở dữ liệu SQLite và kênh đồng bộ
thời gian thực nằm chung một repo. `git clone` + `npm install` + `npm start` là chạy được,
**không phụ thuộc dịch vụ ngoài nào** (không Supabase, không Vercel, không Redis).

Đứng RIÊNG, không dính gì tới hệ quản trị MASTER SATA ROBO. Từ bộ nhận diện SataRobo chỉ
**chép giá trị màu và font** vào `config/thuong-hieu.ts`, không import dòng code nào.

## Một ứng dụng, nhiều game

Ứng dụng chứa **nhiều game sự kiện**: `TRUNG_SO` và `CHON_SO` (cả hai đang chạy), và
`VONG_QUAY_MAY_MAN` (khung rỗng). **Cơ sở · nhân viên · khách tiềm năng · kho quà là DANH
MỤC DÙNG CHUNG**, chỉ tồn tại MỘT nơi — mọi game tham chiếu bằng id, không ai giữ bản sao
(ADR-005).

Phân biệt bằng cột `chuong_trinh.tro_choi`. **Máy chủ** rẽ nhánh bằng MỘT lớp luật chơi
(`lib/tro-choi/luat.ts`, fail-closed) — xương sống chống gian lận phải giống hệt nhau ở mọi
game. **Giao diện** rẽ bằng hai bộ component riêng, điều phối bằng đúng hai câu `if` ở gốc
cây thành phần trong `app/choi/[ma]/page.tsx` và `app/man-hinh/[ma]/page.tsx`.

- **TRÚNG SỐ** — có số trúng định trước, có kho quà, ván nhiều lần bấm, có người trượt.
- **CHỌN SỐ** — không trúng/thua, không kho quà. Chạy một DẢI SỐ xoay vòng; mỗi người bấm
  MỘT lần và nhận số của mình; quà đánh số thứ tự nằm NGOÀI hệ thống (ADR-009).

## Trò chơi hoạt động thế nào — HAI chế độ

- **`tai_quay`**: màn hình LCD ở lễ tân là **nơi DUY NHẤT hiện dãy số**, điện thoại phụ
  huynh chỉ là **nút bấm có đóng dấu thời gian**, và **một ghế một người**. Đòn bẩy nằm ở
  *một cú bấm có khán giả*.
- **`online`**: điện thoại **tự vẽ dãy số**, **bỏ giữ chỗ** — ai vào cũng chơi ngay,
  không hàng đợi. Dùng cho quảng cáo (ADR-004).

Trọng tài **giống hệt nhau** ở cả hai: máy nào bấm thì máy đó đo, máy chủ kẹp lại.

## Ván nhiều lần bấm

**Một VÁN = tối đa N lần bấm = MỘT phần quà** (ADR-006). `van_choi` là đơn vị nhận giải,
`luot_choi` là nhật ký từng lần bấm. Trúng là **dừng ngay**; kết quả ván lấy lần **lệch ít
nhất**, không phải lần cuối. Giới hạn là **1 VÁN/SĐT/ngày**, không phải 1 lượt.

## Luật bắt buộc

1. **Không hardcode hằng số nghiệp vụ** — đọc từ `config/game.ts`.
2. **Không hardcode màu/font** — đọc từ `config/thuong-hieu.ts` (và `app/globals.css` phải
   khớp với nó).
3. **Không viết thẳng chuỗi tiếng Việt vào component** — thêm vào `config/locale.ts` trước.
4. 🔴 **Máy nào bấm thì máy đó ĐO.** Nó gửi lên số mili-giây đã trôi kể từ lúc bảng số bắt
   đầu chạy. Nếu để máy chủ tính từ lúc NHẬN được lệnh thì độ trễ mạng bị cộng vào: phụ
   huynh thấy 0211, bấm, máy trả 0219 — nhìn y như ăn gian.
5. 🔴 **SQLite làm trọng tài "ai bấm trước".** `UPDATE ... WHERE ket_thuc_luc IS NULL` chỉ
   đổi được một lần; máy bấm sau nhận 0 dòng và **im lặng bỏ qua**, không báo lỗi.
6. **Dữ liệu phụ huynh là dữ liệu cá nhân.** Có ô đồng ý tách riêng, bảng công khai chỉ
   hiện tên rút gọn, không export hàng loạt ra ngoài mục đích đối soát.
7. Đổi tham số trò chơi thì chạy lại `npm test` — bộ test canh phần công bằng (mọi số cài
   đều chỉ gặp ở tốc độ tối đa, số nào cũng có ít nhất một cơ hội).
8. 🔴 **Lọc theo quyền ở TẦNG KHO (SQL), không ở tầng giao diện.** Ẩn một cái nút mà câu
   truy vấn vẫn trả đủ dòng thì danh bạ khách đã nằm trong HTML gửi ra khỏi máy chủ. Mọi
   trang và mọi server action trong `/quan-tri` phải gọi `nguoiDangDangNhap()` rồi truyền
   `phamViCua(nguoi)` xuống kho.
9. **MỌI câu SQL của một bảng nằm trong đúng MỘT file `lib/**/kho.ts`.** Đây là thứ khiến
   đổi cơ sở dữ liệu về sau chỉ phải sửa một tầng (ADR-008).

## Cạm bẫy đã trả giá

- **Đừng bật `trailingSlash`** — nó khiến `/api/gio` bị chuyển hướng 308, thêm một lượt
  đi–về vào đúng phép đo độ lệch đồng hồ, làm hỏng chính thứ nó đang đo.
- **Trạm phát và kết nối CSDL phải giữ ở `globalThis`** — `next dev` nạp lại module mỗi lần
  sửa code, để ở biến module thì mất sạch người đang nghe / mở thêm kết nối bỏ rơi.
- **`instrumentation.ts` không tự chạy trong dev của Next 16** — CSDL mở lười ở lần dùng đầu.
- 🔴 **Next 16 đã đổi tên `middleware.ts` thành `proxy.ts`.** Đặt sai tên thì tệp không bao
  giờ chạy, trang quản trị mở toang, và **không một dòng lỗi nào**. Tài liệu nằm sẵn trong
  `node_modules/next/dist/docs/` — đọc ở đó, đừng dựa vào trí nhớ.
- 🔴 **Mở `DatabaseSync` vào đường dẫn không tồn tại là TẠO tệp rỗng.** Tệp rỗng đó có thể
  bị đổi tên đè lên CSDL thật; app vẫn chạy mà trắng trơn. Đã vá + 4 test canh.
- **Cookie phiên: chỉ bật `secure` khi thật sự chạy HTTPS.** Bật ở LAN (`http://192.168.x.x`)
  thì trình duyệt lặng lẽ vứt cookie — đăng nhập đúng mật khẩu mà cứ bị đá về màn đăng nhập.
- **Ván nhiều lần bấm: tin `ket-qua` mang số của lần VỪA BẤM, còn màn tổng kết phải vẽ lần
  TỐT NHẤT.** Hai con số khác nhau, phải truyền RIÊNG. Lỗi này lọt qua 190 test và cả build.
- **Giữa ván vẫn PHẢI phát tin lên màn hình lớn.** Bỏ phát cho "đỡ nhấp nháy" thì LCD đứng
  hình rồi tự về màn chờ — đá người đang chơi ra khỏi ván của chính họ.
- **Ngưỡng cảnh báo thuần TỈ LỆ chết lặng với kho nhỏ.** 20% của 4 là 0,8 mà tồn luôn là số
  nguyên ≥ 1 ⇒ loại còn 1 cái nhảy thẳng xanh → đỏ. Ngưỡng phải là `max(1, tỉ_lệ × tổng)`.
- **Máy chủ cũ còn sống sẽ giữ cổng và TRẢ LỜI.** `pkill -f "next start"` không khớp —
  tiến trình thật tên `next-server`. Kill theo PID; bộ chạy e2e tự dừng nếu cổng đang bận.
- **Đổi tên sản phẩm thì grep cả tên CŨ.** GĐ 9 đổi "Đếm số" → "Trúng Số" nhưng bỏ sót
  `T.appName` — `title` của tab trình duyệt vẫn đề "Bộ đếm may mắn" suốt từ v1. Lọt qua 360
  test, build, 14 kịch bản e2e và cả bộ ảnh nghiệm thu: không bài kiểm nào nhìn vào cái tab.
- **Rác không làm gãy gì cả, nên không ai thấy nó.** Trang `/cai-dat` bị xoá để lại 46 khoá
  locale mồ côi và thư mục `out/` build tĩnh cũ. `tests/locale.test.ts` và
  `tests/thuong-hieu.test.ts` nay canh hai chỗ đó — chú thích in hoa không canh được gì.
- 🔴 **Trang trong `/quan-tri` KHÔNG tự có phân quyền chỉ vì `proxy.ts` đã chắn cửa.**
  `proxy.ts` chỉ hỏi "đã đăng nhập chưa", không hỏi "được xem cơ sở nào". Suốt từ GĐ 15,
  trang chi tiết chương trình và hai route xuất Excel đọc dữ liệu KHÔNG lọc theo phạm vi —
  sale cơ sở này gõ đúng mã là đọc trọn lịch sử cơ sở kia. Mọi trang mới trong `/quan-tri`
  phải gọi `batBuocDangNhap()` rồi truyền `phamViCua(nguoi)` xuống kho (GĐ 21.1).
- **Đừng chạy `npm run e2e` hai lần trong CÙNG một lệnh shell.** Lượt sau khởi động khi lượt
  trước chưa dọn xong, đụng cổng, và báo hỏng những kịch bản hoàn toàn đúng — đã mất hai
  lượt chẩn đoán nhầm. Chạy một lượt, đọc kết quả, rồi mới chạy lượt sau.
- **Màn Khách tiềm năng mặc định CHỈ hiện người đã đồng ý tư vấn** (`chiDongY` bật sẵn, phải
  có `?chiDongY=0` trên URL mới tắt). Kịch bản e2e quên tick ô đồng ý thì lead có sinh cũng
  không nhìn thấy, và báo hỏng như thể tính năng gãy.
- **Lỗi bố cục chỉ sống ở khung hẹp.** Khối gợi ý `?` neo `absolute left-0` vào dấu hỏi nằm
  gần mép phải ⇒ tràn 70px ra ngoài khung 390px, chữ bị cắt mà không cuộn ngang tới được.
  Trên màn rộng hoàn toàn bình thường. Chỉ kịch bản e2e **đo toạ độ** ở khung điện thoại mới
  bắt được — nhìn bằng mắt trên máy tính thì không bao giờ.

- **Giữa ván PHẢI vẫn phát tin lên màn hình lớn.** Bỏ phát cho "đỡ nhấp nháy" thì LCD
  đứng hình, chạy hết giờ rồi tự về màn chờ — tức là đá người đang chơi ra khỏi ván của
  chính họ. Cờ `vanXong` trong tin là thứ giữ hai màn hình nói cùng một câu.
- **Giới hạn "1 lượt/SĐT/ngày" phải đổi thành "1 VÁN/ngày" TRƯỚC khi bật nhiều lần bấm.**
  Không đổi thì chính lần bấm thứ hai của ván đang chơi bị luật đó chặn.

- **Đổi tốc độ KHÔNG đổi tỉ lệ trúng của trò bấm dừng.** Tỉ lệ = (giới hạn lượt − thời
  gian khoá nút) ÷ (10000 × 0,08); tốc độ triệt tiêu trong phép tính. Suýt làm 3 mức khó
  có cùng tỉ lệ mà chỉ khác vẻ ngoài — phát hiện khi cho code in bảng tra ra đối chiếu.
- **Bảng LED vẽ đoạn tắt quá sáng thì `0000` đọc thành `8888`.** Quầng sáng phải chỉ
  áp cho nhóm đoạn ĐANG BẬT. Chỉ lộ ra khi nhìn ảnh chụp thật, build và test đều xanh.
- **Nút bấm nhấp nháy bằng `transform: scale` làm xê dịch vùng chạm** — với trò bấm phản
  xạ là làm khó người chơi vô cớ (và Playwright cũng không bấm nổi). Nhấp nháy quầng sáng.
- **`next dev` CHẶN tài nguyên dev từ mọi địa chỉ khác `localhost`.** Điện thoại vẫn mở
  được trang, vẫn thấy giao diện, nhưng JS không tải nên KHÔNG BẤM ĐƯỢC GÌ — trông y hệt
  app bị treo, không một dòng báo lỗi trên màn hình. Phải khai `allowedDevOrigins` trong
  `next.config.ts`. Chỉ lộ ra khi mở thật bằng IP LAN; `curl` trả 200 vẫn qua như thường.
- **Đừng truyền từng khung hình qua mạng để đồng bộ hai màn hình.** Truyền MỐC BẮT ĐẦU
  rồi để mỗi máy tự tính bằng cùng một công thức, và SNAP về kết quả cuối khi có. Đây là
  phần thưởng cho việc lõi bộ đếm là hàm THUẦN của thời gian ngay từ đầu.
- **Đừng bật `trailingSlash` khi có route API đo thời gian.** Nó khiến `/api/gio` bị
  chuyển hướng 308 — thêm nguyên một lượt đi–về vào đúng phép đo độ lệch đồng hồ, tức là
  làm hỏng chính thứ nó đang đo.
- **Giữ chỗ chơi sau khi ván đã chốt là khoá người xếp hàng phía sau.** Họ quét mã chỉ
  thấy "đang có người chơi" mà không hiểu vì sao. Nhả chỗ NGAY lúc có kết quả.
- **Lấy con số đang VẼ khi bấm dừng là sai.** Phải tính từ `event.timeStamp`, nếu không
  máy yếu và máy 120Hz cho kết quả khác nhau — trò chơi mất công bằng.

## Lệnh

`npm run dev` (chỉ máy này) · `npm run dev:dienthoai` (mở cho cả mạng LAN) · `npm test` ·
`npm run lint` · `npm run build` · `npm run e2e` (20 kịch bản trình duyệt thật trên bản
build, CSDL tạm) · `npm run anh-chup` (bộ ảnh nghiệm thu GĐ 20.1) · `npm run sao-luu`
(**chạy TRƯỚC mọi việc đụng CSDL**) · `npm run don-du-lieu-thu -- --xem` (dọn dữ liệu chơi thử trước khi giao máy cho quầy) · `npm run tao-quan-tri -- <tên>` (tạo tài khoản, hỏi
mật khẩu qua stdin) · `npm run trung-tam` (**mở máy tại quầy**: sao lưu + dựng + chạy cho
cả mạng LAN, tự sinh và giữ khoá ký phiên) · `npm run kiem-may-chu [địa chỉ]` (5 mục kiểm
sau khởi động) · `node scripts/tao-thu.mjs 0211 vua` (tạo nhanh một chương trình).

## Biến môi trường

- `GAME_SU_KIEN_CSDL` — đường dẫn tệp CSDL. **Bộ test và e2e LUÔN đặt biến này** sang tệp
  tạm; không kịch bản nào được đụng vào dữ liệu thật.
- `GAME_SU_KIEN_KHOA_PHIEN` — khoá ký cookie phiên, **≥ 32 ký tự**. Thiếu thì mọi phiên bị
  từ chối (cố ý: không bao giờ rơi về một khoá mặc định nằm trong mã nguồn). `npm run
  trung-tam` tự sinh và giữ ở `du-lieu/khoa-phien.txt` (0600, đã gitignore) — giữ lại chứ
  không sinh mới mỗi lần, nếu không mọi phiên đang mở bị đá ra sau mỗi lần khởi động lại.
- `GAME_SU_KIEN_SAO_LUU` — thư mục để bản sao lưu. 🔴 Mặc định nằm cùng máy; trỏ sang ổ
  ngoài mới thật sự an toàn (`N.7`).
- `GAME_SU_KIEN_HTTPS=1` — chỉ đặt khi thật sự chạy sau HTTPS.

## Bối cảnh đầy đủ

Phân tích ý tưởng và lập luận cho từng con số: `docs/brd/dem-so-bo-dem-may-man.md` trong dự
án IDEA. Lộ trình: `modules/GAME_SU_KIEN/TRUNG_SO/PLAN_TRUNG_SO_V2.md` (đang chạy) ·
`TRUNG_SO/PLAN_TRUNG_SO_V1.md` (lịch sử v1→v2). Quyết định kiến trúc:
`docs/decisions/ADR-001` … `ADR-008`.

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Game CHỌN SỐ (v3) — bài học mới

- 🔴 **`layMot` trả `undefined` khi không có dòng, KHÔNG phải `null`.** So
  `!== null` làm `coLuotDangMo` báo "đang có người chơi" ngay từ lượt đầu tiên và
  khoá chặt cả chương trình — không ai mở nổi ván nào, mà không một dòng lỗi.
  Dùng `!= null` hoặc `toBeFalsy()` khi kiểm sự tồn tại của một dòng.
- 🔴 **Phép kẹp `Math.min/max` trong `dungLuot` quy mọi lần "hết giờ" về ĐÚNG MỘT
  mốc thời gian**, nên mọi người để hết giờ đều nhận **cùng một con số**. Ở Trúng
  Số đó chỉ là một số trượt nên không ai thấy suốt từ v1; ở Chọn Số đó là mười
  phụ huynh cùng cầm `0037` đi nhận một phần quà. Luật Chọn Số trả `null` khi hết
  giờ để huỷ lượt.
- 🔴 **Bảng tra luật chơi phải FAIL-CLOSED.** Cho một game chưa khai luật rơi về
  luật của game khác nghĩa là Chọn Số chạy `resolveRound` với `so_trung = 0`, ghi
  `trung = 1` mỗi khi số ra đúng 0, rồi bốc quà trên một kho rỗng — và đẩy vào
  cột "Đã trúng" của file Excel gửi đội sale. Ném lỗi, đừng đoán.
- **Thêm khoá `locale` TRƯỚC khi có chỗ dùng là `tests/locale.test.ts` đỏ ngay.**
  Thêm khoá và chỗ dùng trong CÙNG một commit. Và luôn viết `T.a` / `T.b` tường
  minh — truy cập động `T[bien]` làm CẢ HAI khoá bị coi là mồ côi.
- **Cạm bẫy "hai lượt e2e" áp cả với HAI LỆNH LIÊN TIẾP**, không chỉ hai lượt
  trong cùng một lệnh shell. Chạy `npm run e2e -- chon-so` rồi `npm run e2e` ngay
  sau đó làm 2/20 kịch bản báo hỏng hoàn toàn oan. Chờ cổng 3111 trống hẳn
  (`lsof -iTCP:3111 -sTCP:LISTEN`) rồi mới chạy lượt sau.
- **`lib/db/luoc-do.ts` là hình dạng NGUYÊN THUỶ, không phải hình dạng hiện tại.**
  Mọi cột thêm sau (`co_so_id`, `che_do`, `tro_choi`, `dai_tu`…) chỉ sống trong
  `COT_BO_SUNG` của `nang-cap.ts`. Thêm cột vào cả hai file là dựng hai nguồn sự
  thật.
