# Quy trình làm việc với Claude Code

## Bộ handle giai đoạn (`.claude/commands/`)

`/B1_y_tuong` bàn + phản biện (Plan Mode, KHÔNG code) → `/B2_lo_trinh` ghi hạng mục vào
`PLAN.md` chờ DUYỆT → `/B3_thi_cong` code theo GÓI trên LOCAL → `/B4_nghiem_thu` đòi bằng
chứng + bộ cổng → `/B5_luu_code` commit + push → `/B6_trien_khai` (cấu hình hạ tầng, làm
một lần) + `/B6_xuat_ban` (Preview → DUYỆT → production).
`/reset_db` khi cần đưa Supabase local về trạng thái sạch có dữ liệu test.
Mở/đóng phiên dùng `/mo_session` · `/dong_session` (bản TOÀN CỤC ở `~/.claude/commands/`,
CỐ Ý không chép vào dự án — chép là có hai bản lệch nhau).

IDEA dùng ĐỦ cả 8 handle của bộ chuẩn: dự án có Supabase (cần `reset_db`) và có deploy
Vercel (cần cả hai handle B6).

## Plan Mode — bắt buộc khi

- Feature mới, task phức tạp, đụng ≥ 3 file, thay đổi schema/migration,
  thay đổi liên quan ≥ 2 module.
- Trình plan → chờ người dùng duyệt → mới thực hiện. Không "vừa plan vừa code".

## Thi công theo GÓI (cắm máy)

Plan đã duyệt = duyệt CẢ GÓI. Người dùng rời máy được; máy réo (hook toàn cục) khi
thật sự cần người.

- Tự chạy liền các hạng mục TRONG plan; **mỗi hạng mục xong phải lint/test/build XANH
  mới được đi tiếp** — test xanh thay cho người duyệt từng bước.
- Tick checkbox tại `PLAN.md` + báo cáo 3 dòng từng mục (đã làm / kiểm chứng / tiếp theo)
  nhưng KHÔNG dừng chờ; báo cáo tổng hợp cuối gói.
- **DỪNG BẮT BUỘC chờ duyệt khi:** commit/push GitHub · deploy · migration production ·
  ghi/xóa/vô hiệu hóa DỮ LIỆU THẬT (kể cả DB dev, nếu nó đã chứa dữ liệu thật) · tác
  động ra ngoài thư mục dự án · việc phát sinh NGOÀI phạm vi plan đã duyệt.
- **Thiếu key/env/dịch vụ ngoài → GOM, đừng dừng:** ghi vào mục "CHỜ NGOÀI" trong
  TRẠNG THÁI của `CLAUDE.md` kèm rõ *cần gì, để làm gì*, rồi chuyển sang hạng mục khác.
  Chỉ dừng khi TẤT CẢ hạng mục còn lại đều bị chặn — khi đó in danh sách
  "cần gì để mở khóa".
- Việc chạy dài (build, e2e, quét lớn) → chạy nền, làm tiếp hạng mục khác rồi quay lại
  đọc kết quả.
- Script vặt viết bằng `node` (đã pre-approve trong `.claude/settings.json`), KHÔNG dùng
  `python3` (mỗi lần gọi là một lần bắt người dùng quay lại bấm duyệt).

## Phân định AI ĐANG CHẶN từng hạng mục — dòng `(e) chặn:`

> **Vì sao có luật này.** % của sổ tính theo NGÀY CÔNG của mọi hạng mục, **tính cả việc
> của người và việc mua ngoài**. Nên một module xong sạch phần code vẫn đọc lên như còn
> dở, và người đọc sổ hỏi lại "sao chưa xong". Tệ hơn: chính máy suy từ một con số % ra
> "module này còn hở việc code" rồi khuyên sai, trong khi nó đã hết việc máy từ lâu.

**Mọi hạng mục CHƯA tick phải có dòng `(e) chặn:` trong thân hạng mục**, đặt sau `(d)`:

```
- [ ] **1.2 — …**
  - (d) 0,5 ngày dev.
  - (e) chặn: NGƯỜI — chờ chốt thang điểm chấm ý tưởng ở `docs/brd/…` § 3.
  - (f) phụ-thuộc: 1.1, 0.3
```

Đúng **BA nhãn**, không tự chế thêm:

- **`MÁY`** — không có gì chặn, giao là làm được ngay hôm nay.
- **`NGƯỜI`** — chờ quyết định · chữ ký · một cái TÊN · nghiệm thu phải dùng thật. 0 dòng code.
- **`NGOÀI`** — chờ mua / mở tài khoản / bên thứ ba (token, VPS, tên miền, bên duyệt).

🔴 **NHÃN NÓI CÁI GÌ ĐANG CHẶN, KHÔNG NÓI VIỆC ĐÓ CÓ PHẢI CODE HAY KHÔNG.** Một hạng mục
code thuần nhưng đang chờ mở tài khoản Supabase ⇒ nhãn `NGOÀI`. Phân loại theo "có phải
code không" thì con số trả lời sai đúng câu người ta hỏi: *còn việc nào giao máy làm
được ngay không?*

🔴 **Thiếu dòng `(e)` ⇒ xếp `CHƯA PHÂN ĐỊNH`, và nó KÉO % khối máy XUỐNG có chủ đích.**
Không đoán hộ — đoán hộ là đẻ ra một con số chẳng ai từng quyết mà đọc lên đầy thuyết
phục. Chưa phân định thì chưa được tuyên bố "hết việc máy".

**Khi đóng một hạng mục:** tick `[x]` và **xóa dòng `(e)`** của nó (xong rồi thì không
còn gì chặn). Khi lên hạng mục mới: viết `(e)` ngay từ đầu, đừng để lượt sau phân định lại.

## Dòng `(f) phụ-thuộc:` — nguồn DUY NHẤT của quan hệ "X chặn Y"

Đặt SAU dòng `(e)`. Cú pháp:

```
- (f) phụ-thuộc: 1.1, 0.3      ← danh sách mã, phân cách bằng , hoặc ·
- (f) phụ-thuộc: không          ← khẳng định ĐỘC LẬP (khác hẳn với THIẾU dòng f)
```

Vì sao: quan hệ "X chặn Y" nếu để dạng văn xuôi lặp ở 3–4 chỗ thì máy không đọc được,
và không ai trả lời nổi câu "mở mấy session song song thì an toàn?". Dòng `(f)` là nguồn
duy nhất; mọi bảng nhóm/cổng quyết định chỉ là văn tường thuật.

**Luật đọc kết quả:** LỚP 0 = không chờ hạng mục nào — nhóm theo nhãn `(e)`: `MÁY` = code
song song được NGAY; `NGƯỜI`/`NGOÀI` = chờ mở khóa. LỚP n = chỉ chờ các lớp trước nó.
Chu trình, hoặc mã không tồn tại = sổ SAI, phải sửa sổ.
**Hạng mục của `core` luôn được ưu tiên TRƯỚC** (luật "core trước, module sau").

## Sổ lộ trình: một file, tách khi phình

- **Hiện tại:** `PLAN.md` ở gốc là **nguồn lộ trình DUY NHẤT** — không đẻ file kế hoạch
  riêng; cần mở rộng thì đánh số con ngay tại đó (vd 2.1b, 3B.1).
- **Mốc tách:** khi `PLAN.md` vượt ~400 dòng hoặc khi ≥ 2 module chạy song song thật,
  `/B2_lo_trinh` tách sang cấu trúc `Plan/`: `PLAN.md` còn lại mục lục ≤ 80 dòng ·
  `Plan/PLAN_CORE.md` (đọc TRƯỚC) · `Plan/PLAN_<MODULE>.md` · `Plan/TIEN_DO.md` (máy
  sinh, không gõ tay) · `Plan/LICH_SU.md`. Tách đến đâu thì thêm script đọc sổ đến đó.
- Tách rồi thì **OVERVIEW của module chỉ TRỎ tới sổ, KHÔNG chép danh sách sang** — chép
  là dựng bản sao thứ hai, và hai bản chỉ lệch vào đúng ngày ai đó sửa một bản.

## Ba mức đọc sổ (chống đốt token)

> Luật chung: **file não > 30KB thì grep trước, `Read` theo khoảng (offset/limit); cần
> trọn file thì giao sub-agent đọc trong context riêng.** Nạp trọn một sổ đã phình chỉ
> để trả lời một câu là đốt hàng chục nghìn token vô ích.

- **Mức 1 — sửa code thường nhật trong module:** đọc OVERVIEW mục 1–4 (~1KB) +
  `grep -n "^##"` rồi Read ĐÚNG tiêu đề con liên quan.
- **Mức 2 — làm tiếp hạng mục đang dở:** mức 1 + grep MÃ hạng mục trong OVERVIEW và
  trong `PLAN.md`, đọc đúng khối đó.
- **Mức 3 — lên gói mới / review lớn / câu hỏi liên-module:** KHÔNG tự đọc — giao
  `researcher` đọc trọn trong context riêng, trả tóm tắt ≤ 40 dòng kèm pointer. Cần
  TOÀN CẢNH nhiều file một lượt → repomix cấp gói nén cho agent, thay 30 lượt Read lẻ.
  KHÔNG dùng repomix cho thi công thường nhật, KHÔNG gửi gói nén ra ngoài máy
  (xem `.repomixignore`).

## Verification Loop

- Sau mỗi thay đổi có ý nghĩa: chạy `npm run lint` / `npm test` / `npm run build` thật.
- Cấu trúc dự án: `node scripts/check-structure.mjs` (chạy được ngay từ hôm nay).
- KHÔNG xác nhận "đã xong" khi chưa có bằng chứng lệnh chạy pass.
- Test fail → hỏi root cause trước (code mới sai / test lỗi thời / fixture /
  environment / dependency), không xóa test vội.

## Session Handoff (nhịp làm việc)

| Thời điểm    | Việc phải làm                                                                                                                                                            |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Mở session   | `/mo_session`: đọc CLAUDE.md + PLAN.md + OVERVIEW.md module đang làm → báo trạng thái, bước tiếp theo                                                                     |
| Session lớn  | Vào Plan Mode lên kế hoạch phiên, chốt thứ tự ưu tiên                                                                                                                    |
| Context      | Auto-compact tự lo; phiên dài thì chủ động `/compact` ở mốc nghỉ giữa 2 hạng mục — giữ lại: kiến trúc/schema/danh sách file/quyết định. Mở lại phiên: `claude --continue` |
| Đóng session | `/dong_session`: cập nhật mục 5–6 OVERVIEW.md module + mục TRẠNG THÁI/QUYẾT ĐỊNH/CẢNH BÁO của CLAUDE.md, ghi BÀN GIAO cho phiên sau, rồi `/B5_luu_code`                   |

## Sub-agents (3 agent trong `.claude/agents/`)

`researcher` (đào bới, so sánh phương án) · `code-reviewer` (mắt mới sau khi xong tính
năng) · `qa-tester` (test case theo user flow trong `docs/brd/`).

- Dùng cho việc "đào bới": đọc nhiều file, log dài, review kiến trúc, draft BRD.
- Main session chỉ nhận kết luận theo khung: Objective / Files inspected /
  Key findings / Risks / Recommendation / Next steps.
- KHÔNG dùng subagent cho việc sửa 1 dòng.

## Git + DEV SONG SONG nhiều session

- **1 session = 1 module = 1 worktree = 1 nhánh**
  (`git worktree add ../idea-<mod> -b goi/<mod>-<ten>`). Session nhánh CHỈ ghi:
  `modules/<X>/**`, route của X, test của X.
- **File DÙNG CHUNG chỉ SESSION CHỦ đụng:** `CLAUDE.md` · `PLAN.md` · `config/` ·
  `scripts/` chung · `modules/core/**` · thư mục migration. Trước khi đụng: kiểm
  `ps aux | grep claude`, có phiên khác thì HỎI người dùng.
- 🔴 **Session nhánh KHÔNG tick sổ** — tick một ô là ghi vào `PLAN.md` dùng chung ⇒
  conflict chắc chắn. Tick nghĩa là "ĐÃ KIỂM CHỨNG", nên session CHỦ tick SAU khi merge
  và test xanh trên nhánh chính.
- **Điểm TUẦN TỰ HÓA (xếp hàng qua session chủ, ưu tiên làm TRƯỚC):** hạng mục
  `modules/core/**` = lớp 0 ưu tiên, xong merge rồi các nhánh mới rebase · migration DB
  CHỈ session chủ chạy (nhánh chỉ ĐỂ file `.sql`, merge rồi mới migrate) · e2e + dev
  server ở CÂY CHÍNH, một session một thời điểm (worktree không có `.env*`).
- **Worktree KHÔNG phát hành được** (thiếu `.env.production.local`) — phát hành chỉ ở
  cây chính qua `/B6_xuat_ban`.
- **Merge:** session chủ `git fetch` → rebase/merge TUẦN TỰ từng nhánh vào nhánh chính →
  test sau mỗi merge → tick sổ MỘT lần → migration (nếu có) → soát → DUYỆT → phát hành.
  Commit trên nhánh: stage theo ĐƯỜNG DẪN, cấm `git add -A`.
- Merge conflict: giải thích ý nghĩa business 2 bên trước, sửa sau khi duyệt.
- Commit/push: luôn hỏi trước (theo `ask` trong `.claude/settings.json`).
- Mức nhẹ không cần mở nhiều cửa sổ: Agent tool `isolation: worktree` cho tác vụ độc lập
  cùng lớp 0 — session chính làm session chủ điều phối.

## Ba tầng năng lực

1. Nền tảng (PHẢI có): CLAUDE.md + Verification Loop + Plan Mode.
2. Tăng tốc (NÊN có): Skills (`.claude/skills/`) + Context Management + MCP.
3. Mở rộng (KHI CẦN): Sub-agents & Agent Teams — chỉ khi build song song nhiều module.
