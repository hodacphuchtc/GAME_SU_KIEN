/**
 * NÂNG CẤP LƯỢC ĐỒ trên cơ sở dữ liệu ĐANG CHẠY THẬT.
 *
 * Chép CƠ CHẾ từ GAME_SU_KIEN/app/lib/db/nang-cap.ts @ 3d96358 — KHÔNG chép
 * danh sách cột của họ, vì cột của Trúng Số không thuộc lược đồ này.
 *
 * Hai lớp, cố ý tách:
 *
 * 1. **Cột bổ sung** — chạy MỖI lần khởi động, an toàn vì có kiểm trước khi
 *    thêm. Đây là chỗ khai mọi cột sinh sau `luoc-do.ts`.
 * 2. **Vá dữ liệu** — chạy ĐÚNG MỘT LẦN, canh bằng `PRAGMA user_version`. Câu
 *    kiểu "sinh dữ liệu mặc định từ thứ đang có" mà chạy lại lần hai là đẻ bản
 *    sao trùng, nên nó buộc phải có công tắc một chiều.
 */
import type { DatabaseSync } from "node:sqlite";

/** Phiên bản dữ liệu hiện hành. Tăng khi thêm một bước vá CHẠY MỘT LẦN. */
export const PHIEN_BAN_DU_LIEU = 1;

interface CotBoSung {
  bang: string;
  cot: string;
  /** Phần khai kiểu + mặc định, ví dụ `INTEGER NOT NULL DEFAULT 0`. */
  khai: string;
}

/**
 * Cột thêm SAU khi `luoc-do.ts` đã chốt.
 *
 * Cột sinh về sau khai vào ĐÂY, không sửa `luoc-do.ts` — sửa lược đồ gốc thì
 * cơ sở dữ liệu đang chạy thật ở quầy không bao giờ nhận được cột mới.
 */
const COT_BO_SUNG: CotBoSung[] = [
  {
    // ẢNH CHỤP mặt vòng tại đúng lúc quay, dạng JSON.
    //
    // 🔴 Vì sao không dựng lại từ bảng `o_qua`: `suaO` GHI ĐÈ tên/số lượng/màu,
    // và ô thêm sau sẽ lọt vào vòng cũ. Dựng lại kiểu đó cho ra một vòng quay
    // CHƯA TỪNG TỒN TẠI — đúng thứ mà nút "Dựng lại" sinh ra để bác bỏ.
    //
    // Số phiên bản một mình nó không cứu được: nó nói "mặt vòng đã đổi", nhưng
    // không nói mặt vòng CŨ trông thế nào.
    bang: "luot_quay",
    cot: "cung_json",
    khai: "TEXT",
  },
];

/** Bảng này đã có cột đó chưa. */
function coCot(db: DatabaseSync, bang: string, cot: string): boolean {
  const dong = db.prepare(`PRAGMA table_info(${bang})`).all() as { name: string }[];
  return dong.some((d) => d.name === cot);
}

/** Bảng này có tồn tại không — CSDL trắng thì chưa có gì để mà thêm cột. */
function coBang(db: DatabaseSync, bang: string): boolean {
  const dong = db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
    .get(bang);
  // layMot trả `undefined` khi không có dòng, KHÔNG phải `null` — so `!== null`
  // ở đây là luôn TRUE và mọi thứ hỏng lặng lẽ. Đã trả giá ở app Trúng Số.
  return dong != null;
}

export function nangCap(db: DatabaseSync): void {
  for (const { bang, cot, khai } of COT_BO_SUNG) {
    if (!coBang(db, bang)) continue;
    if (coCot(db, bang, cot)) continue;
    db.exec(`ALTER TABLE ${bang} ADD COLUMN ${cot} ${khai}`);
  }

  const hienTai = (db.prepare("PRAGMA user_version").get() as { user_version: number })
    .user_version;
  if (hienTai >= PHIEN_BAN_DU_LIEU) return;

  // Chỗ đặt các bước vá dữ liệu CHẠY MỘT LẦN. Chưa có bước nào.

  db.exec(`PRAGMA user_version = ${PHIEN_BAN_DU_LIEU}`);
}
