"use client";

import { useState, useTransition } from "react";

import { T } from "@/config/locale";
import { vaoChoiVongQuay } from "@/app/actions/vong-quay";

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
export function FormNhanDienVongQuay({
  ma,
  coSoChon,
  onXong,
}: {
  ma: string;
  /** Danh sách cơ sở để phụ huynh tự chọn. `null` = chương trình đã gán sẵn. */
  coSoChon: { id: number; nhan: string }[] | null;
  onXong: (nguoiChoi: { id: number; hoTen: string }) => void;
}) {
  const [hoTen, setHoTen] = useState("");
  const [sdt, setSdt] = useState("");
  const [dongY, setDongY] = useState(false);
  const [coSoId, setCoSoId] = useState<string>("");
  const [loi, setLoi] = useState<string | null>(null);
  const [dangGui, batDau] = useTransition();

  function gui(e: React.FormEvent) {
    e.preventDefault();
    setLoi(null);
    batDau(async () => {
      const kq = await vaoChoiVongQuay(
        ma,
        hoTen,
        sdt,
        dongY,
        coSoChon === null || coSoId === "" ? null : Number(coSoId),
      );
      if (!kq.ok || kq.nguoiChoiId == null) {
        setLoi(kq.loi ?? null);
        return;
      }
      onXong({ id: kq.nguoiChoiId, hoTen });
    });
  }

  const o =
    "rounded-xl border border-ke px-4 py-3.5 text-base text-muc focus:border-tim focus:outline-none";

  return (
    <form onSubmit={gui} className="w-full">
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

        {coSoChon !== null && (
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-semibold text-muc">{T.onlineChonCoSo}</span>
            <select
              value={coSoId}
              onChange={(e) => setCoSoId(e.target.value)}
              className={o}
            >
              <option value="">—</option>
              {coSoChon.map((cs) => (
                <option key={cs.id} value={cs.id}>
                  {cs.nhan}
                </option>
              ))}
            </select>
          </label>
        )}

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

        {loi && (
          <p role="alert" className="rounded-xl bg-do/10 p-3 text-sm font-semibold text-do">
            {loi}
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
