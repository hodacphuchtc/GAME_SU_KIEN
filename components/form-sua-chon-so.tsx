"use client";

import { useActionState, useState } from "react";

import { T } from "@/config/locale";
import { suaChonSoForm, type KetQuaChonSoForm } from "@/app/actions/chon-so";
import { coDai, nhipCua } from "@/lib/chon-so/vong-so";

/**
 * Sửa thiết lập một chương trình CHỌN SỐ đang sống.
 *
 * 🔴 Bốn thứ cố ý KHÔNG có mặt: `ma` (mã QR đã in ra giấy dán ở quầy), cơ sở,
 * chế độ, và game. Đổi bất kỳ cái nào trong bốn là một chương trình khác, không
 * phải một bản sửa — và lịch sử ván cũ sẽ treo lơ lửng giữa hai thân phận.
 *
 * Ván đã chơi KHÔNG bị đụng tới. Thu hẹp dải sau khi đã phát vài số ngoài dải
 * mới là hợp lệ; khối cảnh báo dưới đây nói bằng CON SỐ chuyện đó nghĩa là gì.
 */
export function FormSuaChonSo({
  ma,
  daiTu,
  daiDen,
  loaiTruDaRa,
  tenDot,
  soDaPhat,
}: {
  ma: string;
  daiTu: number;
  daiDen: number;
  loaiTruDaRa: boolean;
  tenDot: string;
  /** Các số đã phát, để cảnh báo khi dải mới bỏ rơi một phần trong đó. */
  soDaPhat: number[];
}) {
  const [tu, setTu] = useState(String(daiTu));
  const [den, setDen] = useState(String(daiDen));
  const [loaiTru, setLoaiTru] = useState(loaiTruDaRa);
  const [ten, setTen] = useState(tenDot);
  const [trangThai, guiForm, dangGui] = useActionState<KetQuaChonSoForm, FormData>(
    suaChonSoForm,
    {},
  );

  const soTu = Number.parseInt(tu === "" ? "0" : tu, 10);
  const soDen = Number.parseInt(den === "" ? "0" : den, 10);
  const hopLe = Number.isFinite(soTu) && Number.isFinite(soDen) && soDen >= soTu;
  const soLuong = hopLe ? coDai({ tu: soTu, den: soDen }) : 0;
  const giayMotVong = hopLe && soLuong > 0 ? soLuong / nhipCua({ tu: soTu, den: soDen }).maxSpeed : 0;

  // Nói bằng CON SỐ: "đã phát 7 số, 3 trong đó nằm ngoài dải mới".
  const ngoaiDaiMoi = hopLe ? soDaPhat.filter((s) => s < soTu || s > soDen).length : 0;

  return (
    <form action={guiForm} className="mt-8 rounded-2xl border border-ke bg-white p-5 sm:p-6">
      <h2 className="text-lg font-black text-muc">{T.chonSoSuaTitle}</h2>
      <input type="hidden" name="ma" value={ma} />

      <label className="mt-4 flex flex-col gap-1.5 text-sm">
        <span className="font-semibold text-muc">{T.chonSoDot}</span>
        <input
          name="tenGiaiThuong"
          value={ten}
          onChange={(e) => setTen(e.target.value)}
          maxLength={80}
          className="rounded-xl border border-ke bg-white px-4 py-3 text-base text-muc focus:border-tim focus:outline-none"
        />
      </label>

      <fieldset className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-muc">{T.chonSoDaiTu}</span>
          <input
            name="daiTu"
            inputMode="numeric"
            value={tu}
            onChange={(e) => setTu(e.target.value.replace(/\D/g, "").slice(0, 4))}
            className="rounded-xl border border-ke bg-white px-4 py-3 text-base text-muc focus:border-tim focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-muc">{T.chonSoDaiDen}</span>
          <input
            name="daiDen"
            inputMode="numeric"
            value={den}
            onChange={(e) => setDen(e.target.value.replace(/\D/g, "").slice(0, 4))}
            className="rounded-xl border border-ke bg-white px-4 py-3 text-base text-muc focus:border-tim focus:outline-none"
          />
        </label>
      </fieldset>

      {hopLe && soLuong > 0 && (
        <div className="mt-3 rounded-xl bg-suong px-4 py-3 text-sm text-muc">
          <p className="font-semibold">{T.chonSoSoLuong(soLuong)}</p>
          <p className="mt-0.5 text-chi">{T.chonSoNhipQuay(giayMotVong.toFixed(1))}</p>
        </div>
      )}

      {ngoaiDaiMoi > 0 && (
        <p className="mt-3 rounded-xl bg-cam/10 px-4 py-3 text-sm font-semibold text-cam">
          {T.chonSoCanhBaoThuHep(soDaPhat.length, ngoaiDaiMoi)}
        </p>
      )}

      <label className="mt-3 flex cursor-pointer items-start gap-3 rounded-xl border border-ke p-4 text-sm">
        <input
          type="checkbox"
          name="loaiTruDaRa"
          value="1"
          checked={loaiTru}
          onChange={(e) => setLoaiTru(e.target.checked)}
          className="mt-0.5 h-5 w-5 accent-tim"
        />
        <span>
          <span className="font-semibold text-muc">{T.chonSoLoaiTru}</span>
          <span className="mt-0.5 block text-chi">
            {loaiTru ? T.chonSoLoaiTruMo : T.chonSoLoaiTruTat}
          </span>
        </span>
      </label>

      {trangThai.loi && (
        <p className="mt-3 rounded-xl bg-do/10 px-4 py-3 text-sm font-semibold text-do">
          {trangThai.loi}
        </p>
      )}
      {trangThai.xong && (
        <p className="mt-3 rounded-xl bg-luc/10 px-4 py-3 text-sm font-semibold text-luc">
          {T.chonSoDaLuu}
        </p>
      )}

      <button
        type="submit"
        disabled={dangGui}
        className="mt-5 rounded-xl bg-cam px-6 py-3 text-sm font-black text-white disabled:opacity-60"
      >
        {T.chonSoLuu}
      </button>
    </form>
  );
}
