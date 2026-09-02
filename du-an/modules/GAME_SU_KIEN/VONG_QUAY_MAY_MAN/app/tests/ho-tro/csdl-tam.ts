import { rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { dongCsdl } from "@/lib/db/ket-noi";

/**
 * Chép từ GAME_SU_KIEN/app/tests/ho-tro/csdl-tam.ts @ 3d96358.
 * Sửa: đổi biến môi trường sang VONG_QUAY_CSDL.
 *
 * Mỗi ca test một cơ sở dữ liệu riêng trong thư mục tạm. Trả về hàm dọn — gọi
 * trong `afterEach`, nếu không thư mục tạm đầy tệp .db.
 */
export function dungCsdlTam(): () => void {
  const duongDan = join(tmpdir(), `vong-quay-${Math.random().toString(36).slice(2)}.db`);
  process.env.VONG_QUAY_CSDL = duongDan;
  dongCsdl();
  return () => {
    dongCsdl();
    for (const hau of ["", "-wal", "-shm"]) rmSync(duongDan + hau, { force: true });
    delete process.env.VONG_QUAY_CSDL;
  };
}
