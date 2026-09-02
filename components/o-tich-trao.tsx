"use client";

import { useState, useTransition } from "react";

import { danhDauTraoQua } from "@/app/actions/vong-quay-chuong-trinh";

/**
 * Ô tích "đã trao thưởng" trên bảng lịch sử.
 *
 * Cập nhật LẠC QUAN: tích hiện ngay rồi mới gửi lên máy chủ. Người ở quầy tích
 * liên tiếp mấy dòng trong lúc phụ huynh đứng chờ — bắt họ đợi máy chủ trả lời
 * từng cái là bắt cả hàng người đợi theo.
 *
 * Gửi hỏng thì trả tích về trạng thái cũ, chứ không im lặng giữ một dấu tích
 * chỉ tồn tại trên màn hình: sổ trao thưởng mà nói dối thì tệ hơn là không có.
 */
export function OTichTrao({
  chuongTrinhMa,
  luotId,
  banDau,
}: {
  chuongTrinhMa: string;
  luotId: number;
  banDau: boolean;
}) {
  const [tich, setTich] = useState(banDau);
  const [dangGui, batDau] = useTransition();

  return (
    <input
      type="checkbox"
      checked={tich}
      disabled={dangGui}
      aria-label="Đã trao thưởng"
      onChange={(e) => {
        const moi = e.target.checked;
        setTich(moi);
        batDau(async () => {
          try {
            const kq = await danhDauTraoQua(chuongTrinhMa, luotId, moi);
            if (!kq.ok) setTich(!moi);
          } catch {
            setTich(!moi);
          }
        });
      }}
      className="size-5 accent-luc disabled:opacity-50"
    />
  );
}
