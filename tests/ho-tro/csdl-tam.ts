import { rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { dongCsdl } from "@/lib/db/ket-noi";

/**
 * Mỗi ca test một cơ sở dữ liệu riêng trong thư mục tạm.
 * Trả về hàm dọn — gọi trong `afterEach`, nếu không thư mục tạm đầy file .db.
 */
export function dungCsdlTam(): () => void {
  const duongDan = join(tmpdir(), `game-su-kien-${Math.random().toString(36).slice(2)}.db`);
  process.env.GAME_SU_KIEN_CSDL = duongDan;
  dongCsdl();
  return () => {
    dongCsdl();
    for (const hau of ["", "-wal", "-shm"]) rmSync(duongDan + hau, { force: true });
    delete process.env.GAME_SU_KIEN_CSDL;
  };
}
