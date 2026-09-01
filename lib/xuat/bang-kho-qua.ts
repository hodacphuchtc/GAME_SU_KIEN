import "server-only";

import { T } from "@/config/locale";
import { conLai } from "@/lib/qua/chon-qua";
import type { QuaTang } from "@/lib/qua/kho-qua";
import { chu, so, type TrangTinh } from "@/lib/xuat/xlsx";

/**
 * Kho quà → trang tính, để ĐỐI SOÁT NGÂN SÁCH.
 *
 * Cột "Thành tiền đã trao" là con số kế toán thật sự cần: phần trăm trúng và số
 * lượt chơi không nói được đã tiêu bao nhiêu.
 */
export function bangKhoQua(ten: string, kho: readonly QuaTang[]): TrangTinh {
  return {
    ten,
    tieuDe: [
      T.khoOrder,
      T.khoName,
      T.khoQty,
      T.khoGiven,
      T.khoLeft,
      T.khoCapDay,
      T.khoValue,
      "Thành tiền đã trao",
    ],
    dong: kho.map((q, i) => {
      const con = conLai(q);
      return [
        so(i + 1),
        chu(q.ten),
        // Không giới hạn thì để TRỐNG chứ không ghi 0: một ô 0 đọc lên là
        // "hết hàng", đúng ngược nghĩa.
        q.soLuong === null ? chu(T.khoQtyUnlimited) : so(q.soLuong),
        so(q.daTrao),
        con === null ? chu(T.khoQtyUnlimited) : so(con),
        q.tranMoiNgay === 0 ? chu("") : so(q.tranMoiNgay),
        so(q.giaTri),
        so(q.giaTri === null ? null : q.giaTri * q.daTrao),
      ];
    }),
  };
}
