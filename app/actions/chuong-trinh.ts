"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { DIFFICULTIES, WHEEL_SIZE, type DifficultyId } from "@/config/game";
import { T } from "@/config/locale";
import {
  CHE_DO_CHOI,
  NGUON_CO_SO,
  SO_LAN_CHOI,
  type CheDoChoi,
  type NguonCoSo,
} from "@/config/to-chuc";
import { timCoSo } from "@/lib/co-so/kho";
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
  const tenGiaiThuong = String(form.get("tenGiaiThuong") ?? "").trim().slice(0, 80);
  const soTrung = docSo(form.get("soTrung"));
  const mucDo = String(form.get("mucDo") ?? "") as DifficultyId;
  const tranGiai = docSo(form.get("tranGiaiMoiNgay"));
  const coSoId = docSo(form.get("coSoId"));
  const cheDo = String(form.get("cheDo") ?? "tai_quay") as CheDoChoi;
  const nguonCoSo = String(form.get("nguonCoSo") ?? "gan_san") as NguonCoSo;
  const soLanChoi = docSo(form.get("soLanChoi"));

  if (tenGiaiThuong === "") return { loi: "Chưa điền tên phần thưởng." };
  if (!Number.isFinite(soTrung) || soTrung < 0 || soTrung >= WHEEL_SIZE) {
    return { loi: "Số trúng thưởng phải là 4 chữ số từ 0000 đến 9999." };
  }
  if (!(mucDo in DIFFICULTIES)) return { loi: "Chưa chọn độ khó." };
  if (!Number.isFinite(tranGiai) || tranGiai < 0) {
    return { loi: "Trần giải mỗi ngày không được là số âm." };
  }

  // Cơ sở: phải TỒN TẠI và đang BẬT. Tắt rồi mà vẫn tạo được chương trình mới ở
  // đó thì cái nút Tắt chẳng có nghĩa gì.
  const coSo = Number.isFinite(coSoId) ? timCoSo(coSoId) : null;
  if (!coSo) return { loi: T.createErrNoBranch };
  if (coSo.trangThai !== "bat") return { loi: T.createErrBranchOff };

  if (!CHE_DO_CHOI.includes(cheDo)) return { loi: T.createErrMode };
  if (!NGUON_CO_SO.includes(nguonCoSo)) return { loi: T.createErrBranchSource };
  if (
    !Number.isFinite(soLanChoi) ||
    soLanChoi < SO_LAN_CHOI.toiThieu ||
    soLanChoi > SO_LAN_CHOI.toiDa
  ) {
    return { loi: T.createErrTries(SO_LAN_CHOI.toiThieu, SO_LAN_CHOI.toiDa) };
  }

  const ct = taoChuongTrinh({
    // Bản chụp: tên cơ sở lúc tạo. Đổi tên cơ sở sang năm không được làm sai
    // tên trên biên lai đã in năm ngoái.
    tenTrungTam: coSo.ten,
    soTrung,
    mucDo,
    tenGiaiThuong,
    tranGiaiMoiNgay: tranGiai,
    coSoId: coSo.id,
    cheDo,
    // Chơi tại quầy thì cơ sở luôn là cơ sở đã gán — không có chỗ nào để phụ
    // huynh chọn, nên nhận giá trị kia từ form là nhận một lời nói dối.
    nguonCoSo: cheDo === "tai_quay" ? "gan_san" : nguonCoSo,
    soLanChoi,
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
