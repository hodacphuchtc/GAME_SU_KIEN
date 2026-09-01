"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { T } from "@/config/locale";
import { nguoiDangDangNhap } from "@/lib/bao-ve/phien-hien-tai";
import { phamViCua } from "@/lib/bao-ve/quyen";
import { suaChonSo, taoChuongTrinh, timTheoMaChonSo } from "@/lib/chuong-trinh/kho";
import { kiemThietLapChonSo } from "@/lib/chuong-trinh/kiem-hop-le";
import { timCoSo } from "@/lib/co-so/kho";
import { ghiNhatKy, HANH_DONG } from "@/lib/nhat-ky/kho";

/**
 * Tạo và sửa chương trình CHỌN SỐ.
 *
 * 🔴 Mọi kiểm tra nằm ở đây chứ không chỉ ở phía trình duyệt: form có thể bị
 * gửi thẳng bằng công cụ khác, và một dải số sai thì cả buổi phát nhầm quà.
 */

export interface KetQuaChonSoForm {
  loi?: string;
  xong?: boolean;
}

function docSo(gt: FormDataEntryValue | null): number {
  const so = Number.parseInt(String(gt ?? "").trim(), 10);
  return Number.isFinite(so) ? so : Number.NaN;
}

function docThietLap(form: FormData) {
  return {
    daiTu: docSo(form.get("daiTu")),
    daiDen: docSo(form.get("daiDen")),
    loaiTruDaRa: String(form.get("loaiTruDaRa") ?? "") === "1",
    tenGiaiThuong: String(form.get("tenGiaiThuong") ?? "").trim().slice(0, 80),
  };
}

export async function taoChonSoForm(
  _truoc: KetQuaChonSoForm,
  form: FormData,
): Promise<KetQuaChonSoForm> {
  const nguoi = await nguoiDangDangNhap();
  if (!nguoi) return { loi: T.createErrNoBranch };

  const d = docThietLap(form);
  const loi = kiemThietLapChonSo(d);
  if (loi) return { loi };

  // Ô cơ sở bỏ trống = cố ý không gán; phụ huynh tự chọn lúc chơi (GĐ 25).
  const boTrong = String(form.get("coSoId") ?? "").trim() === "";
  const coSoId = docSo(form.get("coSoId"));
  const coSo = !boTrong && Number.isFinite(coSoId) ? timCoSo(coSoId) : null;
  if (!boTrong) {
    if (!coSo) return { loi: T.createErrNoBranch };
    if (coSo.trangThai !== "bat") return { loi: T.createErrBranchOff };
  }

  const ct = taoChuongTrinh({
    tenTrungTam: coSo ? coSo.ten : T.chuaGanCoSo,
    // Ba ô dưới đây không có nghĩa với Chọn Số nhưng là cột NOT NULL. Đặt giá
    // trị trung tính và KHÔNG hiện trên form — xem sổ v3 mục "sáu giả định".
    soTrung: 0,
    mucDo: "vua",
    tranGiaiMoiNgay: 0,
    soLanChoi: 1,
    coSoId: coSo ? coSo.id : null,
    cheDo: "tai_quay",
    nguonCoSo: coSo ? "gan_san" : "phu_huynh_chon",
    troChoi: "chon_so",
    ...d,
  });

  ghiNhatKy({
    nhanVienId: nguoi.id,
    hanhDong: HANH_DONG.taoChonSo,
    doiTuong: ct.ma,
  });
  redirect(`/quan-tri/chon-so/${ct.ma}`);
}

export async function suaChonSoForm(
  _truoc: KetQuaChonSoForm,
  form: FormData,
): Promise<KetQuaChonSoForm> {
  const nguoi = await nguoiDangDangNhap();
  if (!nguoi) return { loi: T.createErrNoBranch };

  const ma = String(form.get("ma") ?? "").trim();
  // 🔴 Đọc qua cửa CÓ phạm vi: sale cơ sở này không được sửa chương trình của
  // cơ sở kia dù họ gõ đúng mã.
  const ct = timTheoMaChonSo(ma, phamViCua(nguoi));
  if (!ct) return { loi: T.createErrNoBranch };

  const d = docThietLap(form);
  const loi = kiemThietLapChonSo(d);
  if (loi) return { loi };

  suaChonSo(ct.id, d);
  ghiNhatKy({
    nhanVienId: nguoi.id,
    hanhDong: HANH_DONG.suaChonSo,
    doiTuong: ma,
  });
  revalidatePath(`/quan-tri/chon-so/${ma}`);
  return { xong: true };
}
