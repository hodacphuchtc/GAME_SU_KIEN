"use client";

import { useState } from "react";

import { T } from "@/config/locale";
import type { Cung } from "@/lib/vong-quay/chia-o";
import { VongQuay } from "./vong-quay";

/**
 * Chạy lại đúng cú quay cũ.
 *
 * 🔴 Vòng vẽ ra từ ẢNH CHỤP đã lưu cùng lượt, không phải từ danh sách ô hiện
 * tại. Nếu lấy ô hiện tại thì ô thêm sau sẽ lọt vào và ô đã sửa hiện tên mới —
 * ta sẽ vẽ ra một vòng quay CHƯA TỪNG TỒN TẠI, đúng thứ mà nút này sinh ra để
 * bác bỏ.
 */
export function DungLaiVan({ cung, gocDung }: { cung: Cung[]; gocDung: number }) {
  const [batDauLuc, setBatDauLuc] = useState<number | null>(null);
  const [lan, setLan] = useState(0);

  return (
    <div className="flex flex-col items-center">
      <VongQuay
        key={lan}
        cung={cung}
        gocDich={batDauLuc === null ? null : gocDung}
        batDauLuc={batDauLuc}
      />
      <button
        type="button"
        onClick={() => {
          setLan((n) => n + 1);
          setBatDauLuc(performance.now());
        }}
        className="mt-5 rounded-xl bg-tim px-6 py-3 text-base font-black text-white hover:brightness-110"
      >
        {T.dlChayLai}
      </button>
    </div>
  );
}
