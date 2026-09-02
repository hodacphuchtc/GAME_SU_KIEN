"use client";

import { T } from "@/config/locale";
import { CHE_DO_CHOI, type CheDoChoi } from "@/config/to-chuc";
import { GoiY } from "@/components/goi-y";

/**
 * BA THẺ CHẾ ĐỘ CHƠI — dùng chung cho form tạo Trúng Số và form tạo Chọn Số.
 *
 * 🔴 Một định nghĩa DUY NHẤT, cố ý. Bản trước chỉ Trúng Số có ô chế độ, và mảng
 * thẻ nằm ngay trong file form của nó. Chép mảng ấy sang form thứ hai là dựng
 * bản sao thứ hai của cùng một danh sách — và hai bản chỉ lệch nhau vào đúng
 * ngày ai đó thêm chế độ thứ tư vào một bên.
 *
 * 🔴 Nhãn lấy theo CHE_DO_CHOI của config/to-chuc.ts. Thêm giá trị ở đó mà quên
 * nhãn ở đây thì TypeScript đỏ ngay — Record đòi đủ khoá.
 */

const NHAN: Record<CheDoChoi, { nhan: string; ghiChu: string }> = {
  tai_quay: { nhan: T.createModeCounter, ghiChu: T.createModeCounterNote },
  tai_quay_hai_man: { nhan: T.createModeTwoScreens, ghiChu: T.createModeTwoScreensNote },
  online: { nhan: T.createModeOnline, ghiChu: T.createModeOnlineNote },
};

export function TheCheDo({
  giaTri,
  doi,
}: {
  giaTri: CheDoChoi;
  doi: (gt: CheDoChoi) => void;
}) {
  return (
    <fieldset className="rounded-2xl border border-ke p-4">
      <legend className="px-2 text-sm font-semibold text-muc">
        {T.createMode}
        <GoiY chu={T.gyCheDo} />
      </legend>
      <div className="grid gap-2 sm:grid-cols-3">
        {CHE_DO_CHOI.map((id) => (
          <label key={id} className="cursor-pointer">
            <input
              type="radio"
              name="cheDo"
              value={id}
              checked={giaTri === id}
              onChange={() => doi(id)}
              className="peer sr-only"
            />
            <span className="block h-full rounded-xl border border-ke px-3 py-3 text-sm text-muc transition peer-checked:border-tim peer-checked:bg-tim-nhat">
              <span className="block font-bold">{NHAN[id].nhan}</span>
              <span className="mt-0.5 block text-xs leading-relaxed text-chi">
                {NHAN[id].ghiChu}
              </span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
