"use client";

import { T } from "@/config/locale";

/** In tờ QR dán quầy — chỉ khối QR được in, phần điều khiển bị ẩn bởi @media print. */
export function NutIn() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-xl bg-cam px-5 py-3 text-sm font-black text-white"
    >
      {T.detailPrint}
    </button>
  );
}
