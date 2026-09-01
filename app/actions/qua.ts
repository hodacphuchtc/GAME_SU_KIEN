"use server";

import { revalidatePath } from "next/cache";

import { T } from "@/config/locale";
import { danhSachQua, suaQua, themQua, thuTuKeTiep, xoaQua } from "@/lib/qua/kho-qua";

/**
 * Server action của khối Kho quà.
 *
 * Mọi kiểm tra ở đây, không chỉ ở trình duyệt: một loại quà khai số lượng âm sẽ
 * lặng lẽ không bao giờ được bốc, và không ai hiểu vì sao khách toàn nhận loại
 * đáy kho.
 */

export interface KetQuaQua {
  loi?: string;
  xong?: boolean;
}

/** Ô số lượng ĐỂ TRỐNG nghĩa là KHÔNG GIỚI HẠN — khác hẳn với số 0 (hết hàng). */
function docSoLuong(gt: FormDataEntryValue | null): number | null | "sai" {
  const chu = String(gt ?? "").trim();
  if (chu === "") return null;
  const so = Number.parseInt(chu, 10);
  return Number.isFinite(so) && so >= 0 ? so : "sai";
}

export async function luuQuaForm(_truoc: KetQuaQua, form: FormData): Promise<KetQuaQua> {
  const ma = String(form.get("ma") ?? "");
  const chuongTrinhId = Number.parseInt(String(form.get("chuongTrinhId") ?? ""), 10);
  const idText = String(form.get("id") ?? "").trim();
  const id = idText === "" ? null : Number.parseInt(idText, 10);

  const ten = String(form.get("ten") ?? "").trim().slice(0, 80);
  const soLuong = docSoLuong(form.get("soLuong"));
  const tranMoiNgay = Number.parseInt(String(form.get("tranMoiNgay") ?? "0").trim() || "0", 10);
  const giaTriText = String(form.get("giaTri") ?? "").trim();
  const giaTri = giaTriText === "" ? null : Number.parseInt(giaTriText, 10);

  if (ten === "") return { loi: T.khoErrName };
  if (soLuong === "sai") return { loi: T.khoErrQty };
  if (!Number.isFinite(tranMoiNgay) || tranMoiNgay < 0) return { loi: T.khoErrCap };
  if (!Number.isFinite(chuongTrinhId)) return { loi: T.khoErrName };

  const dauVao = {
    ten,
    soLuong,
    tranMoiNgay,
    giaTri: giaTri !== null && Number.isFinite(giaTri) && giaTri >= 0 ? giaTri : null,
    thuTu: 0,
  };

  if (id === null) {
    themQua(chuongTrinhId, { ...dauVao, thuTu: thuTuKeTiep(chuongTrinhId) });
  } else {
    const cu = danhSachQua(chuongTrinhId).find((q) => q.id === id);
    if (!cu) return { loi: T.khoErrName };
    // Giữ nguyên thứ tự khi sửa: nút Lên/Xuống mới là chỗ đổi thứ tự.
    suaQua(id, { ...dauVao, thuTu: cu.thuTu });
  }

  revalidatePath(`/quan-tri/chuong-trinh/${ma}`);
  return { xong: true };
}

export async function xoaQuaAction(id: number, ma: string): Promise<KetQuaQua> {
  const kq = xoaQua(id);
  revalidatePath(`/quan-tri/chuong-trinh/${ma}`);
  return kq.xong ? { xong: true } : { loi: T.khoErrGiven };
}

/**
 * Đưa một loại lên trên / xuống dưới một bậc.
 *
 * 🔴 ĐÁNH SỐ LẠI cả danh sách chứ không hoán đổi hai giá trị `thu_tu`. Hoán đổi
 * chết lặng khi hai loại tình cờ mang cùng một số (dữ liệu cũ đều là 0): câu
 * UPDATE chạy, không lỗi gì, mà thứ tự không nhúc nhích — người bấm tưởng nút
 * hỏng. Đánh số lại thì thứ tự sau mỗi lần bấm luôn là 0,1,2,… không mơ hồ, và
 * thứ tự bốc chính là thứ tự tiêu tiền nên không được phép mơ hồ.
 */
export async function doiChoQuaAction(
  chuongTrinhId: number,
  id: number,
  huong: "len" | "xuong",
  ma: string,
): Promise<void> {
  const kho = danhSachQua(chuongTrinhId);
  const i = kho.findIndex((q) => q.id === id);
  const j = huong === "len" ? i - 1 : i + 1;
  if (i === -1 || j < 0 || j >= kho.length) return;

  const thuTuMoi = [...kho];
  [thuTuMoi[i], thuTuMoi[j]] = [thuTuMoi[j], thuTuMoi[i]];
  thuTuMoi.forEach((q, vt) => suaQua(q.id, { ...q, thuTu: vt }));

  revalidatePath(`/quan-tri/chuong-trinh/${ma}`);
}
