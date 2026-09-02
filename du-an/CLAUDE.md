# IDEA

## GUARDRAILS (tuân thủ tuyệt đối)

1. KHÔNG đọc/ghi/in `.env*`, `secrets/**`, token, key, password.
2. Dữ liệu cá nhân/nhạy cảm của người dùng cuối: không đưa vào prompt/log/seed/output.
3. Không chạy production/migration/deploy khi chưa duyệt.
4. Tuân thủ `.claude/rules/module-boundaries.md` — vi phạm ranh giới module là lỗi
   nghiêm trọng, dừng lại và hỏi.
5. Ngôn ngữ giao diện/tài liệu: Tiếng Việt (chi tiết: `.claude/rules/ngon-ngu-ui.md`).

## DỰ ÁN

Kho ươm ý tưởng thành dự án — thu thập, phân loại, chấm điểm và ươm ý tưởng thành dự án có thể triển khai.
Nguồn yêu cầu: `docs/brd/`. Lộ trình thi công: `PLAN.md` gốc dự án (checkbox, khuôn 6 dòng
(a)–(f)).
Quyết định kiến trúc: `docs/decisions/ADR-*`. Stack: Next.js (App Router) + TypeScript + Supabase (Postgres/Auth) + Vercel + Cloudflare R2.

## QUYỀN TỰ CHỦ (đã được cấp)

- Mọi thao tác TRONG thư mục dự án (chạy lệnh, sửa file, test/build): tự làm, KHÔNG hỏi lại.
- NGOẠI LỆ = DỪNG BẮT BUỘC (mọi mode): commit/push · deploy · migration production ·
  ghi/xóa DỮ LIỆU THẬT · tác động ra ngoài thư mục dự án · việc ngoài plan đã duyệt —
  và phải nói rõ làm gì, vì sao cần duyệt. Chi tiết: `.claude/rules/workflow.md`.

## XỬ LÝ MÂU THUẪN CHỈ DẪN

- Một skill/rule nói khác plan hiện hành hoặc CLAUDE.md → DỪNG, trình bày cả hai phía,
  hỏi tôi. Không tự chọn, không tự hoà giải, không "tổng hợp cả hai".

## QUY TẮC LÀM VIỆC

- Trước khi sửa code trong module nào: ĐỌC `OVERVIEW.md` của module đó.
- Mode do máy tự phân tích rồi báo 1 dòng `Mode: <plan|tự chạy|hỏi> — vì <lý do>`;
  ma trận R-cao/C-cao ở `.claude/rules/workflow.md`.
- Hằng số/ngưỡng nghiệp vụ: đọc từ `config/`, không hardcode.
- Sau build: chạy test/build thật, không xác nhận suông.
- Thi công theo PLAN.md kiểu GÓI: xong MỘT hạng mục → tick checkbox (CHỈ khi đã kiểm
  chứng) → báo cáo 3 dòng (đã làm / kiểm chứng / tiếp theo) → đi tiếp, KHÔNG dừng chờ;
  báo cáo tổng hợp cuối gói; chỉ dừng ở điểm DỪNG BẮT BUỘC.
- Quy trình 6 bước theo handle: `/B1_y_tuong` → `/B2_lo_trinh` → `/B3_thi_cong` →
  `/B4_nghiem_thu` → `/B5_luu_code` → `/B6_trien_khai` + `/B6_xuat_ban`.
  Phát triển & test trên LOCAL; chỉ `/B6_xuat_ban` mới đưa lên môi trường thật (cổng
  2 lớp qua Preview).
- Đầu phiên dùng `/mo_session`, cuối phiên dùng `/dong_session`.
- Chi tiết: `.claude/rules/` (workflow, security, module-boundaries, tech-defaults,
  ngon-ngu-ui).

## TRẠNG THÁI (cập nhật 02/09/2026 — tối)

> 🔴 **SỔ ĐANG CHẠY:** `modules/GAME_SU_KIEN/PLAN_TONG_HOP_V1.md` — đọc khối trạng thái ở
> đầu file đó TRƯỚC KHI làm tiếp. Sổ `VONG_QUAY_MAY_MAN/PLAN_VONG_QUAY_V2.md` (gộp app) và
> `PLAN_VONG_QUAY.md` (v1) đã đóng, chỉ để grep.

### ĐÃ XONG

**BA GAME CHUNG MỘT APP** (ADR-011) tại `modules/GAME_SU_KIEN/app/`: Trúng Số · Chọn Số ·
Vòng Quay — chung CSDL, chung một lần đăng nhập, rẽ bằng cột `chuong_trinh.tro_choi`.
Ba game nay **ngang hàng nhau ở màn quản trị**: đều có In mã QR · Mở màn hình LCD ·
TẮT CHƯƠNG TRÌNH · danh sách khách · xuất Excel · sửa chương trình.

**Hồ sơ khách xuyên ba game:** một số điện thoại = một hồ sơ; tab khách có cột "Game đầu
tiên" + bộ lọc theo game; có trang chi tiết `/quan-tri/khach/[id]` gộp cả ba game; và
**sổ thay đổi hồ sơ** ghi lại mỗi lần khách khai tên khác.

| Cổng kiểm chứng | Kết quả |
| ---- | ------- |
| `npm test` | **665 test / 54 file** xanh |
| `npx tsc --noEmit` · `npm run lint` | xanh |
| `npm run build` | xanh, **29 route** |
| `npm run e2e` | **20/20** kịch bản, exit 0 |
| Backfill v3 trên bản sao CSDL quầy | **0 cặp gộp · 0 số đổi · 0 dòng suy suyển** |

**Ba lỗi ĐANG SỐNG đã vá** (không nằm trong yêu cầu, khảo sát lòi ra):
1. `xoaTheoSdt` quên bảng `luot_quay` ⇒ xoá dữ liệu khách theo NĐ 13/2023 **ném lỗi khoá
   ngoại** với ai từng quay vòng quay. Hồi quy do chính việc gộp Vòng Quay tạo ra.
2. `datTrangThaiChuongTrinh` không kiểm quyền ⇒ sale cơ sở A tắt được chương trình cơ sở B.
3. `redirect` cứng về route Trúng Số ⇒ tắt chương trình Chọn Số rơi vào **404**.

### ĐANG DỞ

- **Sổ `PLAN_TONG_HOP_V1.md`: 13/19 tick.** Còn **Giai đoạn 5** — ba kịch bản e2e
  (`gd27` ba game ngang hàng · `gd28` trao quà Vòng Quay · `gd29` chi tiết khách).
  🔴 **Cho tới khi xong, ba nút mới và trang chi tiết khách CHƯA từng được bấm thử bằng
  trình duyệt thật trong bộ kiểm tự động** — chỉ có bài kiểm đơn vị canh.
- **Chưa commit gói này.** Nhánh `gop-vong-quay` ở app đích; mốc lùi tag `truoc-gop-vong-quay`.

### BƯỚC TIẾP THEO

1. **Anh Phúc chạy thử** — `npm run trung-tam`, mở bằng **địa chỉ IP LAN**: ba trang chi
   tiết đủ ba nút · bấm In ở Vòng Quay chỉ ra tấm QR · sửa chương trình Vòng Quay đang chạy.
2. **Giai đoạn 5** — ba kịch bản e2e.
3. **`N.1`** xác nhận bảng 23 đầu số 2018 · **`N.3`** chốt danh mục quà thật.

### CÒN LẠI · CHỜ NGOÀI

**Trúng Số/Chọn Số:** `TRUNG_SO/PLAN_TRUNG_SO_V1.md` mục N.1–N.9 (**N.7** bản sao lưu NGOÀI
máy · **N.1** NĐ 81/2018 · **N.8** 2 tư thế linh vật).
**Vòng Quay:** `N.1` NĐ 81/2018 (vòng quay là may rủi thuần) · danh mục quà thật · số ô đọc
được ở 3–5 m + panel ≥ 43" · font chính thức.

## QUYẾT ĐỊNH QUAN TRỌNG

| Ngày | Quyết định | Lý do |
| ---- | ---------- | ----- |
| 29/08/2026 | Dùng bộ khung chuẩn từ skill `khoi-tao-du-an` | Tái dùng hệ điều hành đã kiểm chứng: não 4 tầng, nghiệm thu bằng DEMO, decision log, sổ sẹo |
| 30/08/2026 | DEM_SO là **repo Git riêng** lồng trong `modules/GAME_SU_KIEN/app/` | Repo sản phẩm chỉ nên chứa code sản phẩm, không kéo theo bộ khung IDEA; tư liệu + BRD vẫn ở chung một workspace |
| 30/08/2026 | ~~DEM_SO không backend, cấu hình trong URL của mã QR~~ — **ĐÃ BỊ ĐẢO 01/09** | Chạy nhiều cơ sở + lưu lịch sử tra soát thì bắt buộc phải có nơi lưu; xem ba dòng 01/09 bên dưới |
| 30/08/2026 | **Đảo một phần quyết định trên**: thêm `server/relay.mjs` để chiếu song song lên LCD | Hai thiết bị muốn thấy cùng một ván thì bắt buộc có chỗ trung chuyển. Nó là cái LOA (giữ tin trong RAM, mất khi tắt), không phải cái SỔ — nên "không lưu gì" vẫn đúng |
| 30/08/2026 | LCD **không nhận từng con số qua mạng** mà tự tính rồi SNAP về kết quả cuối | Ở 800 số/giây thì truyền từng số vừa nghẽn vừa lệch nhịp; cách này khiến độ trễ mạng chỉ làm lệch phần nhoè, còn con số cuối khớp 100% |
| 01/09/2026 | Đổi tên module → **GAME_SU_KIEN**, MỘT app chứa nhiều game | Cơ sở · nhân viên · khách tiềm năng · kho quà là danh mục dùng chung; hai app riêng là hai bản sao danh bạ khách, chỉ lệch vào đúng ngày ai đó sửa một bên |
| 01/09/2026 | **Đảo GĐ 5.1**: màn thua không còn tặng quà, chỉ "KHÔNG TRÚNG THƯỞNG + cảm ơn" | Không trúng thì không nhận gì. Lead KHÔNG mất vì form họ tên + SĐT chạy TRƯỚC ván chơi |
| 01/09/2026 | Nâng cấp lược đồ tách **HAI lớp**: cấu trúc chạy mỗi lần khởi động, dữ liệu chạy đúng một lần canh `user_version` | Câu "sinh cơ sở từ tên trung tâm đang có" không an toàn khi chạy lại: đổi tên một cơ sở rồi khởi động lại là đẻ thêm cơ sở trùng |
| 01/09/2026 | Tách sổ Trúng Số: **V1 lịch sử · V2 đang chạy**, cùng nằm trong `TRUNG_SO/` | Sổ v1→v2 phình lên 96 KB; nạp trọn để tra một câu là đốt hàng chục nghìn token. V2 giữ bàn giao, V1 chỉ để grep |
| 01/09/2026 | **Xoá dữ liệu có hai mức: XOÁ HẲN khi sạch, ẨN khi còn dấu vết** — máy chủ tự quyết, không nhận lệnh từ máy khách | `van_choi` là sổ đối soát khi phụ huynh khiếu nại quà; và `co_so` bị xoá là cuốn theo cả danh bạ khách lẫn nhân viên qua CASCADE |
| 01/09/2026 | **Chế độ chơi KHÔNG còn quyết thay người dùng chuyện cơ sở** — bỏ luật "tại quầy thì luôn gán sẵn" | Luật cũ sai với một quầy dùng CHUNG một mã QR cho nhiều cơ sở; màn chọn vốn luôn hiện theo `nguonCoSo`, chưa bao giờ theo chế độ |
| 01/09/2026 | **Game thứ hai CHỌN SỐ gộp chung app** qua cột `tro_choi`; máy chủ rẽ bằng MỘT lớp luật, giao diện rẽ bằng hai bộ component riêng | Cơ sở · nhân viên · khách là danh mục dùng chung; cột `tro_choi` đã chừa sẵn từ GĐ 9. Tiết kiệm ~5.100 dòng mã và ~3.000 dòng test không phải chép |
| 01/09/2026 | **Loại trừ số đã ra đổi VÒNG CHẠY, không ánh xạ kết quả** (ADR-009) | Thấy 42 mà nhận 43 là thay thầm — đúng thứ đã có sẹo ở cả hai sổ. Vòng lúc 8h dài 100 số, lúc 20h dài 60 số là TRUNG THỰC |
| 01/09/2026 | Sao lưu là hạng mục **đầu tiên tuyệt đối**, trước cả sửa lỗi đang phơi ra trước mặt khách | Đã trả giá ngay trong phiên: CSDL thật bị thay bằng tệp rỗng, bản sao cứu lại |

| 02/09/2026 | 🔴 **GỘP Vòng Quay VÀO app GAME_SU_KIEN** (ADR-011) — đảo ADR-010 ngay trong ngày | Anh Phúc test thật rồi nêu bốn yêu cầu vận hành (một lần đăng nhập · menu ba game · thông số chung dùng chung · một chỗ duy nhất) — bốn thứ đó về kỹ thuật chỉ đạt được khi hai app thành MỘT. Nghĩa vụ chứng minh "máy không chỉnh" KHÔNG mất khi gộp: nó nằm ở thuật toán (góc ngẫu nhiên đều) và ở lược đồ (ảnh chụp mặt vòng), không nằm ở việc chạy trong tiến trình Node nào. Cái THẬT SỰ mất là sự cách ly khi hỏng — từ nay lỗi Vòng Quay làm ngã được Trúng Số đang chạy thật |
| 02/09/2026 | **Vòng Quay ĐỨNG RIÊNG** — app/CSDL/cổng/repo riêng, đảo ADR-005 — ❌ **ĐÃ BỊ ĐẢO cùng ngày, xem dòng trên** | Nó do MÁY quyết kết quả (hai game kia do người bấm) nên nghĩa vụ chứng minh "không bị chỉnh" khác hẳn; và lỗi/tải của game mới không được phép làm ngã Trúng Số đang chạy thật tại quầy. Giá phải trả đã ghi rõ: hai kho khách, hai sổ ngân sách quà, hai lần đăng nhập, hai lần sao lưu |
| 02/09/2026 | Bốc ô bằng **GÓC NGẪU NHIÊN ĐỀU**, bỏ hẳn trọng số | Rút góc đều rồi xem kim rơi vào cung nào ⇒ "cung rộng bao nhiêu thì cơ hội bấy nhiêu" thành ĐỒNG NHẤT THỨC TOÁN HỌC, không phải một luật ai đó phải nhớ mà tuân thủ. Không có trọng số thì không có gì để chỉnh lén |
| 02/09/2026 | Vòng Quay **không có ca "hết giờ"**; hàm chấm nhận `hetGio` thì NÉM lỗi | Nó chỉ có MỘT lần chạm nên không có cửa sổ thời gian nào để mà hết — đó là cách nó thoát cạm bẫy `Math.min/max`. Fail-closed để cạm bẫy đó không lẻn về |
| 02/09/2026 | Tái dùng giữa hai app = **chép tay có ghi nguồn**, cấm `import` xuyên | 19 file hạ tầng (~1.705 dòng) chép từ `app/` @ `3d96358`, mỗi file mang dòng đầu ghi nguồn + commit. Import xuyên qua là dựng lại đúng thứ mà việc tách hai app sinh ra để tránh |
| 02/09/2026 | 🔴 **ĐẢO ADR-010: gộp Vòng Quay VÀO app GAME_SU_KIEN** (ADR-011, chờ duyệt) | Anh Phúc đòi một lần đăng nhập, menu "Game sự kiện" ba game, thông số chung dùng chung — về kỹ thuật chỉ đạt được khi hai app thành MỘT. Chấp nhận mất đúng mệnh đề mà ADR-010 mua: "Vòng Quay hỏng thì Trúng Số vẫn chạy". Rẻ hơn tưởng vì Vòng Quay vốn là bản chép tay từ chính app đích, và CSDL của nó còn rỗng |
| 02/09/2026 | Màn LCD **nền SÁNG, mạch neon ở viền** — không đi theo neon-nền-tối | Bộ nhận diện cấm nền tối nặng (dòng 1215, 1308) và quy định nền trắng 55–65%. Đổi lại, dải letterbox của khung 16:9 tô trắng thì mắt không thấy — nền tối mới làm phương án khoá tỉ lệ trở nên xấu |
| 02/09/2026 | Số lượt là **N cho TRỌN chương trình**, không reset theo ngày | Hợp với sự kiện một–hai ngày ở quầy và giữ ngân sách quà chặt hơn. Kéo theo: hằng `LUOT_MOI_NGUOI_MOI_NGAY` bị xoá, phép đếm bỏ cột `ngay`, và câu "mời bạn quay lại vào ngày mai" thành SAI |
| 02/09/2026 | **Giữ song song 4 cặp file cùng tên** giữa hai app thay vì hợp nhất | Chúng cố ý khác nhau: mã xác thực của Trúng Số tự đổi mỗi phút (chống chuyền ảnh), của Vòng Quay bất biến (để một tuần sau còn đối soát phiếu). Hợp nhất là viết lại đường chạy của trò đang phục vụ khách thật để đổi lấy con số không |
| 02/09/2026 | Lưu **ảnh chụp mặt vòng** (`luot_quay.cung_json`) chứ không chỉ số phiên bản | Số phiên bản nói được "mặt vòng đã đổi" nhưng KHÔNG nói nó cũ trông thế nào. Thiếu ảnh chụp thì nút "Dựng lại ván" vẽ ra một vòng **chưa từng tồn tại** — đúng thứ nó sinh ra để bác bỏ |
| 02/09/2026 | Màn LCD có nút **"Bật tiếng"** phải bấm một lần | Trình duyệt khoá `AudioContext` tới khi có người chạm vào trang, mà màn LCD thì không ai chạm suốt buổi. Không có nút đó thì tiếng im lặng không kêu và không một dòng lỗi nào giải thích |
| 01/09/2026 | ĐẾM SỐ **đứng riêng**, không dính gì MASTER SATA ROBO | Hai dự án tách hẳn — lỗi hay tải nặng ở quầy lễ tân không được phép đụng tới CRM đang chạy thật |
| 01/09/2026 | Tự chứa bằng **`node:sqlite`**, bỏ Supabase/Vercel | Có sẵn trong Node 24 ⇒ không thêm thư viện, không mở tài khoản, `npm start` là chạy |
| 01/09/2026 | **Điện thoại là NÚT BẤM**, màn hình LCD là nơi duy nhất hiện số | Một màn hình thì không có hai màn hình để mà lệch nhau; cả sảnh cùng nhìn một chỗ, và bớt ~1 ngày công |

## CẢNH BÁO / CẠM BẪY (đã trả giá, đừng lặp lại)

- **`layMot` trả `undefined` khi không có dòng, KHÔNG phải `null`.** So `!== null` làm
  hàm "còn ai đang chơi không" trả TRUE ngay từ lượt đầu, khoá chặt cả chương trình mà
  không một dòng lỗi nào. Dùng `!= null`.

- 🔴 **Bài kiểm viết cứng CHỈ SỐ CỘT sẽ đỏ oan khi thêm một cột.** Thêm cột "Game đầu
  tiên" vào bản xuất Excel làm hai bài kiểm đỏ — một bài đơn vị tra `dong[3]`/`dong[7]`,
  một kịch bản e2e tra ô `r="I\d+"` — trong khi mã hoàn toàn đúng. Tra theo **TÊN cột**
  (hoặc theo KIỂU ô), đừng tra theo vị trí.
- 🔴 **Chạy e2e ở chế độ NỀN trong lúc còn sửa file là tự bịa ra một lỗi không có thật.**
  Bộ e2e tự chạy `npm run build` bên trong; build đó dựng trên cây đang động và chết vì
  một lỗi kiểu nửa vời. Mất công truy một "hồi quy" vốn không tồn tại. Việc chạy dài thì
  chạy nền được, nhưng **đừng đụng vào cây mã trong lúc nó chạy**.
- 🔴 **Backtick trong chuỗi mẫu cắt đứt nó ở BẤT CỨ ĐÂU, không riêng lược đồ SQL.**
  `luoc-do.ts` đã ghi luật này cho lược đồ; hôm nay vấp lại ở một chú thích `--` bên trong
  câu SQL của `lib/lead/kho.ts`. Chú thích trong chuỗi mẫu thì viết chữ trần, đừng trích
  tên cột bằng backtick.
- 🔴 **Bộ test XANH không có nghĩa là mã BIÊN DỊCH ĐƯỢC.** `vitest` không chạy `tsc`: 559
  test xanh trong khi `app/actions/dang-nhap.ts` thiếu một import và `tsc` đỏ. Bộ test và
  bộ kiểm kiểu trả lời hai câu hỏi khác nhau — chạy cả hai, đừng suy cái này từ cái kia.
- 🔴 **`lệnh | head` trả mã thoát của `head`, luôn là 0.** `npx tsc --noEmit | head -10`
  in ra lỗi rồi vẫn cho `$?` bằng 0, và dòng "tsc XANH" ngay sau đó là lời nói dối. Đây là
  cùng một cạm bẫy với `npm install | tail` đã ghi bên dưới, chỉ khác cái lệnh. Muốn vừa
  xem vừa lấy mã thoát: chạy lệnh trần, hoặc dùng `${PIPESTATUS[0]}`.
- 🔴 **Dấu nháy đơn trong SQL cắt đứt chuỗi `node -e '...'` của shell.** Một câu
  `DEFAULT 'x'` nằm giữa script làm phần còn lại rơi ra ngoài dấu nháy và node nhận về
  một chương trình khác hẳn thứ mình viết. Script vặt có SQL/tiếng Việt thì **ghi ra file
  rồi `node file.mjs`**, đừng nhét vào `-e`.
- 🔴 **Một cột được lưu, được hiện lên màn hình quản trị, mà KHÔNG hề được áp dụng — tệ hơn
  là không có cột.** `tran_giai_moi_ngay` của Vòng Quay: nhân viên khai "trần 20 giải/ngày",
  tin là nó chạy, và phát hết kho. Cột chết phải hoặc nối dây, hoặc **gỡ khỏi giao diện** —
  không được để nguyên vì "sau này dùng".
- 🔴 **Bảng lịch sử join sang bảng danh mục HIỆN TẠI là viết lại quá khứ.** Đổi tên một mục
  trong danh mục thì mọi bản ghi cũ bỗng mang tên mới — kể cả trong file Excel dùng để đối
  soát với khách. Sổ đối soát phải lưu **ảnh chụp** giá trị tại thời điểm ghi, không phải khoá
  ngoại trỏ tới thứ còn sửa được.
- 🔴 **Optional chaining nuốt trọn ca hỏng.** `mayRef.current?.datLichQuay(...)` — chưa khởi
  tạo thì lặng lẽ không làm gì, **không lỗi, không log**, người dùng chỉ thấy "nó không kêu".
  Ở nhánh mà sự vắng mặt là BẤT THƯỜNG, đừng dùng `?.` — hãy làm sự im lặng nhìn thấy được.
- **Bộ nhận diện thương hiệu viết cho IN ẤN không phải design system cho phần mềm.** File của
  Sata Robo: không một con số px, không spacing scale, không animation, không shadow, không
  màu trạng thái, không quy chuẩn màn hình — và **tự khai là chưa có font chính thức**. Đọc nó
  để biết cái gì CẤM (nền tối, xoay logo, hoạ tiết xuyên QR), rồi tự quyết phần còn lại và
  **ghi rõ chỗ nào là quyết định của mình** — vì nó nằm ở bậc thấp nhất trong thứ tự nguồn.
- 🔴 **Hàm "tìm theo mã" chặn sớm đầu vào sai định dạng và trả `null` TRƯỚC KHI chạm CSDL.**
  Bộ e2e chờ máy chủ sẵn sàng bằng một mã BỊA ⇒ trang trả **200 vui vẻ** trong khi tệp CSDL
  còn chưa ra đời, rồi bước dựng nền ném "no such table". Phép chờ đúng phải dùng đầu vào
  HỢP LỆ, và kiểm **sự tồn tại vật lý** của thứ mình đang chờ — đừng suy từ mã trạng thái.
- 🔴 **Bài kiểm giao diện đọc QUÁ SỚM sẽ báo hỏng hoàn toàn oan.** Chờ đúng lúc phần tử vừa
  xuất hiện thì bắt được khoảnh khắc form còn "Đang kiểm…", và kết luận "sản phẩm treo" —
  trong khi hàm phía dưới trả kết quả trong 300ms. Chờ tới khi phần tử **CÓ CHỮ**, đừng chờ
  mỗi sự xuất hiện của nó.
- **Selector theo vai trò ARIA có thể khớp NHIỀU phần tử hơn bạn nghĩ** — framework chèn
  thêm phần tử rỗng cùng vai trò, và hàm đọc nội dung trả về **chuỗi rỗng** thay vì báo lỗi.
  Trỏ locator vào đúng vùng chứa (`form p[role=alert]`), đừng dùng vai trò trần trụi.
- **Chép cơ sở dữ liệu SQLite mà quên `-wal` là chép ra một CSDL RỖNG.** Bảng hiện 0 cột,
  trông y như lược đồ chưa dựng. Chép đủ `.db` + `-wal` + `-shm`.
- **Bài kiểm cấm hardcode có thể bắt nhầm chính LỜI CẤM** nằm trong khối chú thích nhiều
  dòng. Cắt chú thích trước khi soi — và thay khối bằng đúng bấy nhiêu dòng trống, đừng xoá
  hẳn, nếu không mọi số dòng trong báo lỗi đều lệch và người đọc mất niềm tin vào bài kiểm.
- 🔴 **Một lệnh kiểm báo XANH có thể là dấu xanh GIẢ — nó xanh vì KHÔNG CÓ GÌ MỚI để kiểm.**
  Heredoc ghi file vào thư mục chưa tồn tại thì hỏng lặng lẽ, file không ra đời, và `tsc`
  ngay sau đó vẫn xanh. Vấp hai lần trong một phiên. Luật rút ra rộng hơn cả heredoc: sau
  mỗi thao tác tạo tệp, hãy kiểm **sự tồn tại vật lý** của thứ vừa tạo, đừng suy ra từ một
  lệnh kiểm chạy sau nó.
- **Mã thoát qua đường ống là mã thoát của lệnh CUỐI.** `npm install | tail` báo `exit 0`
  trong khi npm đã chết vì `ENOSPC` và cài dở dang. Kiểm bằng bằng chứng vật lý, đừng tin
  mã thoát đi qua ống.
- **`gitleaks dir` quét cả thư mục đã gitignore.** Nó báo 10 "khoá" trong `.next/` — toàn
  khoá Next.js tự sinh mỗi lần build, không phải rò rỉ. Phép đo đúng là quét **từng file
  sắp commit**, không phải quét cả thư mục rồi hoảng.

> 🔴 **Bài học theo MIỀN nằm ở CLAUDE.md của từng app** — `modules/GAME_SU_KIEN/app/CLAUDE.md`
> (Next 16, node:sqlite, React form, e2e, ảnh thương hiệu) và
> `modules/GAME_SU_KIEN/VONG_QUAY_MAY_MAN/app/CLAUDE.md` (QR LAN, tương phản màu).
> **Mục này chỉ giữ thứ đúng cho MỌI dự án.**
- 🔴 **"Đã có lớp chặn ở cửa" KHÔNG có nghĩa là từng phòng đã khoá.** `proxy.ts` chắn cả
  `/quan-tri` nên ai cũng tin trang bên trong đã an toàn — thực ra nó chỉ hỏi "đã đăng
  nhập chưa", không hỏi "được xem dữ liệu của ai". Suốt nhiều tháng, một sale gõ đúng đường
  dẫn là đọc trọn danh sách khách của cơ sở khác. Lớp chặn ngoài và lọc theo phạm vi là hai
  việc khác nhau; đừng để cái thứ nhất ru ngủ cái thứ hai.
- **Lỗi bố cục có thể chỉ sống ở một khung màn hình.** Một khối tràn 70px ra ngoài mép phải
  điện thoại mà trên máy tính hoàn toàn bình thường — nhìn bằng mắt không bao giờ ra. Chỉ
  bài kiểm tự động **đo toạ độ ở đúng khung hẹp** mới bắt được.
- **Bài kiểm cũ đỏ sau khi đổi thiết kế thường là bài kiểm LỖI THỜI, không phải mã sai.**
  Phiên này có 4 bài như vậy. Đừng xoá chúng: sửa kèm ghi rõ luật cũ là gì và vì sao đảo —
  người đọc sau cần biết chỗ đó từng có một quy tắc khác.

- **Xoá một trang không xoá chuỗi tiếng Việt của nó.** Trang `/cai-dat` bị xoá để lại **46
  khoá locale mồ côi** nằm im trong từ điển, và `out/` build tĩnh cũ vẫn còn nguyên trên đĩa
  với thư mục `cai-dat/` bên trong — ai mở ra xem sẽ tưởng route đó còn sống. Không có gì
  báo, vì rác thì không làm gãy cái gì cả. Nay `tests/locale.test.ts` canh.
- **File tự xưng "NGUỒN GIÁ TRỊ DUY NHẤT" mà không ai import thì nó chỉ là một tờ giấy dán
  tường.** `config/thuong-hieu.ts` khai bảng màu, còn màu thật đi qua `@theme` trong
  `globals.css` — hai bên đã lệch **sáu màu** trước khi có ai để ý. Quy ước cần một cái test
  chứ không cần một dòng chú thích in hoa.

- **`npx` là LỚP BỌC — giết nó không giết tiến trình con.** Bộ chạy e2e sinh máy chủ qua
  `npx next start` rồi `kill` cái `npx`; `next-server` thành mồ côi, **vẫn sống và vẫn giữ
  cổng**, nên 10/13 kịch bản sau đó hỏng. Gọi thẳng `node_modules/.bin/next`, và chờ tới khi
  **không ai còn trả lời** trên cổng rồi mới mở máy chủ mới. Chạy RIÊNG từng kịch bản thì
  xanh hết — chỉ lộ ra khi chạy trọn bộ.
- **Đổi tên thư mục module làm `.gitignore` trỏ hụt.** Đường dẫn cũ không còn khớp nên repo
  Git độc lập của app bị `git add -A` **nhúng vào repo cha**. Đổi tên thư mục xong là phải
  soi lại mọi dòng `.gitignore` có chứa đường dẫn đó.
