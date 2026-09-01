"use client";

import { useActionState, useState } from "react";

import { DAI_MAC_DINH } from "@/config/chon-so";
import { T } from "@/config/locale";
import { taoChonSoForm, type KetQuaChonSoForm } from "@/app/actions/chon-so";
import { Led4Digits } from "@/components/led-4-so";
import { coDai, nhipCua } from "@/lib/chon-so/vong-so";
import { formatNumber } from "@/lib/bo-dem";
import type { CoSo } from "@/lib/co-so/nhan";

/**
 * Màn tạo chương trình CHỌN SỐ.
 *
 * Điểm quan trọng nhất không phải mấy cái ô nhập, mà là hai dòng nói thẳng hệ
 * quả của dải vừa khai: **dải này phục vụ được bao nhiêu lượt** và **một vòng
 * chạy mất bao lâu**. Đây là bản đối ứng của `BangTiLe` bên Trúng Số — không có
 * nó thì nhân viên khai một dải rồi mới biết mình vừa hứa gì.
 */
export function FormTaoChonSo({ coSo }: { coSo: CoSo[] }) {
  // Ô CÓ KIỂM SOÁT: hai dòng hệ quả phải đổi ngay lúc gõ, và React dọn form sau
  // mỗi server action nên ô không kiểm soát sẽ bị xoá trắng khi form báo lỗi.
  const [tu, setTu] = useState(String(DAI_MAC_DINH.tu));
  const [den, setDen] = useState(String(DAI_MAC_DINH.den));
  const [loaiTru, setLoaiTru] = useState(true);
  const [tenDot, setTenDot] = useState("");
  const [coSoId, setCoSoId] = useState<string>(String(coSo[0]?.id ?? ""));
  const [trangThai, guiForm, dangGui] = useActionState<KetQuaChonSoForm, FormData>(
    taoChonSoForm,
    {},
  );

  const soTu = Number.parseInt(tu === "" ? "0" : tu, 10);
  const soDen = Number.parseInt(den === "" ? "0" : den, 10);
  const hopLe = Number.isFinite(soTu) && Number.isFinite(soDen) && soDen >= soTu;
  const dai = { tu: soTu, den: soDen };
  const soLuong = hopLe ? coDai(dai) : 0;
  const giayMotVong = hopLe && soLuong > 0 ? soLuong / nhipCua(dai).maxSpeed : 0;

  return (
    <form action={guiForm} className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-black text-muc sm:text-3xl">{T.chonSoCreateTitle}</h1>
      <p className="mt-1 text-sm text-chi">{T.chonSoCreateSubtitle}</p>

      <div className="mt-6 grid gap-5 rounded-2xl border border-ke bg-white p-5 sm:p-6">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-muc">{T.createBranch}</span>
          <select
            name="coSoId"
            value={coSoId}
            onChange={(e) => setCoSoId(e.target.value)}
            className="rounded-xl border border-ke bg-white px-4 py-3 text-base text-muc focus:border-tim focus:outline-none"
          >
            {coSo.map((cs) => (
              <option key={cs.id} value={cs.id}>
                {cs.ma} — {cs.ten}
              </option>
            ))}
            <option value="">{T.chuaGanCoSo}</option>
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-muc">{T.chonSoDot}</span>
          <input
            name="tenGiaiThuong"
            value={tenDot}
            onChange={(e) => setTenDot(e.target.value)}
            placeholder={T.chonSoDotGoiY}
            maxLength={80}
            className="rounded-xl border border-ke bg-white px-4 py-3 text-base text-muc focus:border-tim focus:outline-none"
          />
        </label>

        <fieldset className="grid gap-3 sm:grid-cols-2">
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

        {/* Hai dòng hệ quả — nói thẳng dải vừa khai nghĩa là gì. */}
        {hopLe && soLuong > 0 && (
          <div className="rounded-xl bg-suong px-4 py-3 text-sm text-muc">
            <p className="font-semibold">{T.chonSoSoLuong(soLuong)}</p>
            <p className="mt-0.5 text-chi">{T.chonSoNhipQuay(giayMotVong.toFixed(1))}</p>
            <div className="mt-3 flex items-center gap-2">
              <Led4Digits value={formatNumber(soTu)} size="small" />
              <span className="text-chi">→</span>
              <Led4Digits value={formatNumber(soDen)} size="small" />
            </div>
          </div>
        )}

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-ke p-4 text-sm">
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
      </div>

      {trangThai.loi && (
        <p className="mt-4 rounded-xl bg-do/10 px-4 py-3 text-sm font-semibold text-do">
          {trangThai.loi}
        </p>
      )}

      <button
        type="submit"
        disabled={dangGui}
        className="mt-6 w-full rounded-xl bg-cam px-6 py-3.5 text-base font-black text-white disabled:opacity-60"
      >
        {T.chonSoTaoNut}
      </button>
    </form>
  );
}
