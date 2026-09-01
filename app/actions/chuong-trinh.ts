"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { DIFFICULTIES, WHEEL_SIZE, type DifficultyId } from "@/config/game";
import { doiTrangThai, taoChuongTrinh, type TrangThaiChuongTrinh } from "@/lib/chuong-trinh/kho";
import { phat } from "@/lib/dong-bo/tram-phat";

/**
 * Tạo chương trình từ form của nhân viên.
 *
 * Mọi kiểm tra nằm ở đây chứ không chỉ ở phía trình duyệt: form có thể bị gửi
 * thẳng bằng công cụ khác, và một chương trình cấu hình sai thì cả buổi không
 * ai trúng nổi mà chẳng ai hiểu vì sao.
 */

export interface KetQuaTaoForm {
  loi?: string;
}

function docSo(gt: FormDataEntryValue | null): number {
  const so = Number.parseInt(String(gt ?? "").trim(), 10);
  return Number.isFinite(so) ? so : Number.NaN;
}

export async function taoChuongTrinhForm(
  _truoc: KetQuaTaoForm,
  form: FormData,
): Promise<KetQuaTaoForm> {
  const tenTrungTam = String(form.get("tenTrungTam") ?? "").trim().slice(0, 80);
  const tenGiaiThuong = String(form.get("tenGiaiThuong") ?? "").trim().slice(0, 80);
  const soTrung = docSo(form.get("soTrung"));
  const mucDo = String(form.get("mucDo") ?? "") as DifficultyId;
  const tranGiai = docSo(form.get("tranGiaiMoiNgay"));

  if (tenTrungTam === "") return { loi: "Chưa điền tên cơ sở." };
  if (tenGiaiThuong === "") return { loi: "Chưa điền tên phần thưởng." };
  if (!Number.isFinite(soTrung) || soTrung < 0 || soTrung >= WHEEL_SIZE) {
    return { loi: "Số trúng thưởng phải là 4 chữ số từ 0000 đến 9999." };
  }
  if (!(mucDo in DIFFICULTIES)) return { loi: "Chưa chọn độ khó." };
  if (!Number.isFinite(tranGiai) || tranGiai < 0) {
    return { loi: "Trần giải mỗi ngày không được là số âm." };
  }

  const ct = taoChuongTrinh({
    tenTrungTam,
    soTrung,
    mucDo,
    tenGiaiThuong,
    tranGiaiMoiNgay: tranGiai,
  });
  redirect(`/quan-tri/chuong-trinh/${ct.ma}`);
}

/**
 * Nhận TRẠNG THÁI ĐÍCH chứ không phải "lật".
 *
 * Lật thì nhấp đúp sẽ lật hai lần và người bấm không hiểu vì sao chẳng có gì
 * thay đổi. Trạng thái đích thì bấm bao nhiêu lần cũng ra đúng một kết quả.
 */
export async function datTrangThaiChuongTrinh(
  ma: string,
  trangThai: TrangThaiChuongTrinh,
): Promise<void> {
  doiTrangThai(ma, trangThai);
  // Gỡ người đang kẹt ở màn "Chưa chơi được" mà không bắt họ tải lại trang.
  phat(ma, { loai: "trang-thai", dangChay: trangThai === "dang_chay" });
  revalidatePath("/quan-tri");
  redirect(`/quan-tri/chuong-trinh/${ma}`);
}
