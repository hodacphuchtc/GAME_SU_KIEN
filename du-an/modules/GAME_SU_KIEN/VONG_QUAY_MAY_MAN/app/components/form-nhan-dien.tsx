"use client";

import { useActionState, useEffect, useState } from "react";

import { T } from "@/config/locale";
import { vaoChoiForm, type KetQuaVaoChoi } from "@/app/actions/choi";
import type { NguoiChoi } from "@/lib/nguoi-choi/nhan-dien";

/**
 * Form nhận diện phụ huynh tại quầy.
 *
 * 🔴 MỌI ô đều CÓ KIỂM SOÁT. React dọn form sau mỗi lần chạy server action, nên
 * ô không kiểm soát bị xoá trắng khi form báo lỗi — phụ huynh gõ nhầm số điện
 * thoại một lần là mất luôn họ tên vừa nhập rồi bỏ cuộc. Đã trả giá ở Trúng Số.
 *
 * Ô đồng ý tư vấn tách RIÊNG khỏi việc chơi: chơi không đòi phải đồng ý nhận
 * quảng cáo. Gộp hai thứ vào một ô tích là moi sự đồng ý bằng cách giấu nó.
 */
export function FormNhanDien({
  ma,
  onXong,
}: {
  ma: string;
  onXong: (nguoiChoi: NguoiChoi) => void;
}) {
  const [trangThai, guiForm, dangGui] = useActionState<KetQuaVaoChoi, FormData>(
    vaoChoiForm,
    {},
  );
  const [hoTen, setHoTen] = useState("");
  const [sdt, setSdt] = useState("");
  const [dongY, setDongY] = useState(false);

  const o =
    "rounded-xl border border-ke px-4 py-3.5 text-base text-muc focus:border-tim focus:outline-none";

  // Nhận diện xong thì báo lên màn cha để chuyển sang khu vực quay. Làm trong
  // effect chứ không trong thân render: gọi setState của cha lúc đang render
  // con là lỗi React, và ở đây nó còn chạy lại mỗi lần cha vẽ lại.
  useEffect(() => {
    if (trangThai.nguoiChoi) onXong(trangThai.nguoiChoi);
  }, [trangThai.nguoiChoi, onXong]);

  return (
    <form action={guiForm} className="w-full">
      <input type="hidden" name="ma" value={ma} />
      <div className="grid gap-4 rounded-2xl border border-ke bg-white p-5">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-muc">{T.choiHoTen}</span>
          <input
            name="hoTen"
            required
            autoComplete="name"
            placeholder={T.choiHoTenGoiY}
            value={hoTen}
            onChange={(e) => setHoTen(e.target.value)}
            className={o}
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-muc">{T.choiSdt}</span>
          <input
            name="soDienThoai"
            required
            /* `inputMode=tel` bật bàn phím số trên điện thoại — người đứng ở quầy
               không có thời gian đi tìm phím số. */
            inputMode="tel"
            autoComplete="tel"
            placeholder={T.choiSdtGoiY}
            value={sdt}
            onChange={(e) => setSdt(e.target.value)}
            className={o}
          />
        </label>

        <label className="flex items-start gap-3 text-sm text-muc">
          <input
            type="checkbox"
            name="dongYTuVan"
            checked={dongY}
            onChange={(e) => setDongY(e.target.checked)}
            className="mt-0.5 size-5 shrink-0 accent-tim"
          />
          <span>{T.choiDongYTuVan}</span>
        </label>

        {trangThai.loi && (
          <p role="alert" className="rounded-xl bg-do/10 p-3 text-sm font-semibold text-do">
            {trangThai.loi}
          </p>
        )}

        <button
          type="submit"
          disabled={dangGui}
          className="rounded-xl bg-cam px-6 py-4 text-lg font-black text-white disabled:opacity-60"
        >
          {dangGui ? T.choiDangGui : T.choiNut}
        </button>
      </div>
    </form>
  );
}
