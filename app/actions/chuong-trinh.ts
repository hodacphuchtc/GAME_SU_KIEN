"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { DifficultyId } from "@/config/game";
import { T } from "@/config/locale";
import {
  CHE_DO_CHOI,
  NGUON_CO_SO,
  type CheDoChoi,
  type NguonCoSo,
} from "@/config/to-chuc";
import { headers } from "next/headers";

import { timCoSo } from "@/lib/co-so/kho";
import {
  anChuongTrinh,
  demRangBuoc,
  doiTrangThai,
  suaChuongTrinh,
  taoChuongTrinh,
  timTheoMa,
  xoaChuongTrinh,
  type TrangThaiChuongTrinh,
} from "@/lib/chuong-trinh/kho";
import { kiemThietLap } from "@/lib/chuong-trinh/kiem-hop-le";
import { nguoiDangDangNhap } from "@/lib/bao-ve/phien-hien-tai";
import { phamViCua } from "@/lib/bao-ve/quyen";
import { ghiNhatKy, HANH_DONG } from "@/lib/nhat-ky/kho";
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

  // Một bộ luật DUY NHẤT cho cả tạo lẫn sửa — xem `lib/chuong-trinh/kiem-hop-le.ts`.
  const loiThietLap = kiemThietLap({
    soTrung,
    mucDo,
    tenGiaiThuong,
    tranGiaiMoiNgay: tranGiai,
    soLanChoi,
  });
  if (loiThietLap) return { loi: loiThietLap };

  // Ô cơ sở BỎ TRỐNG = cố ý không gán (GĐ 25). Khác hẳn với gõ một id không tồn
  // tại — cái đó vẫn là lỗi.
  const boTrong = String(form.get("coSoId") ?? "").trim() === "";
  const coSo = !boTrong && Number.isFinite(coSoId) ? timCoSo(coSoId) : null;
  if (!boTrong) {
    // Cơ sở đã chọn thì phải TỒN TẠI và đang BẬT. Tắt rồi mà vẫn tạo được
    // chương trình mới ở đó thì cái nút Tắt chẳng có nghĩa gì.
    if (!coSo) return { loi: T.createErrNoBranch };
    if (coSo.trangThai !== "bat") return { loi: T.createErrBranchOff };
  }

  if (!CHE_DO_CHOI.includes(cheDo)) return { loi: T.createErrMode };
  if (!NGUON_CO_SO.includes(nguonCoSo)) return { loi: T.createErrBranchSource };

  const ct = taoChuongTrinh({
    // Bản chụp: tên cơ sở lúc tạo. Đổi tên cơ sở sang năm không được làm sai
    // tên trên biên lai đã in năm ngoái.
    tenTrungTam: coSo ? coSo.ten : T.chuaGanCoSo,
    soTrung,
    mucDo,
    tenGiaiThuong,
    tranGiaiMoiNgay: tranGiai,
    coSoId: coSo ? coSo.id : null,
    cheDo,
    // 🔴 Không gán cơ sở thì BUỘC phụ huynh tự chọn — không có cơ sở nào để mà
    // "gán sẵn", và một ván không thuộc cơ sở nào sẽ rơi ra ngoài mọi báo cáo.
    //
    // Trước GĐ 25, dòng này còn ép mọi chương trình TẠI QUẦY về "gan_san" với
    // lý do "phụ huynh đứng ngay trước mặt thì hỏi làm gì". Lý do đó sai với
    // một quầy dùng chung mã QR cho nhiều cơ sở — nên nay chế độ không còn
    // quyết thay người dùng nữa.
    nguonCoSo: coSo ? nguonCoSo : "phu_huynh_chon",
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

export interface KetQuaSua {
  loi?: string;
  xong?: boolean;
}

/**
 * Sửa thiết lập của một chương trình đang sống.
 *
 * Dùng CHUNG `kiemThietLap` với đường tạo — hai bộ luật lệch nhau là chuyện chỉ
 * chờ ngày xảy ra, và bên lỏng hơn sẽ là bên người ta dùng để lách.
 *
 * Không nhận `coSoId` lẫn `cheDo`: đổi chúng là một chương trình khác.
 */
export async function suaChuongTrinhForm(
  _truoc: KetQuaSua,
  form: FormData,
): Promise<KetQuaSua> {
  const nguoi = await nguoiDangDangNhap();
  if (!nguoi) return { loi: T.nvErrQuyen };

  const ma = String(form.get("ma") ?? "").trim().toUpperCase();
  const ct = timTheoMa(ma, phamViCua(nguoi));
  if (!ct) return { loi: T.createErrNoBranch };

  const d = {
    soTrung: docSo(form.get("soTrung")),
    mucDo: String(form.get("mucDo") ?? "") as DifficultyId,
    tenGiaiThuong: String(form.get("tenGiaiThuong") ?? "").trim().slice(0, 80),
    tranGiaiMoiNgay: docSo(form.get("tranGiaiMoiNgay")),
    soLanChoi: docSo(form.get("soLanChoi")),
  };

  const loi = kiemThietLap(d);
  if (loi) return { loi };

  suaChuongTrinh(ct.id, d);

  const rb = demRangBuoc(ct.id);
  const h = await headers();
  ghiNhatKy({
    nhanVienId: nguoi.id,
    hanhDong: HANH_DONG.suaChuongTrinh,
    // Ghi lại số cũ → số mới VÀ số ván đang có: sau này còn tra được "ai đổi
    // số, lúc nào, khi đã có bao nhiêu ván chấm theo số cũ".
    doiTuong: `${ct.ma} · ${ct.soTrung} → ${d.soTrung}`,
    soDong: rb.soVan,
    diaChiIp: h.get("x-forwarded-for") ?? h.get("x-real-ip"),
  });

  revalidatePath(`/quan-tri/chuong-trinh/${ct.ma}`);
  revalidatePath("/quan-tri");
  return { xong: true };
}

export interface KetQuaDon {
  /** `xoa` = xoá hẳn · `an` = chỉ ẩn vì đã có ván chơi. */
  daLam?: "xoa" | "an";
  loi?: string;
}

/**
 * Xoá chương trình — hoặc ẩn nó, nếu xoá là mất sổ đối soát.
 *
 * 🔴 **Máy chủ tự quyết xoá hay ẩn**, không nhận lệnh đó từ máy khách. Hộp xác
 * nhận trên trình duyệt chỉ để báo trước cho người bấm; nếu tin tham số client
 * gửi lên thì một yêu cầu nặn tay là xoá sạch lịch sử trao thưởng của cả tháng.
 *
 * Ranh giới: **chưa có ván nào ⇒ xoá hẳn** (chương trình tạo nhầm, tạo thử);
 * **đã có ván ⇒ ẩn**, vì `van_choi` là sổ đối soát khi phụ huynh khiếu nại phần
 * quà đã nhận.
 */
export async function xoaHoacAnChuongTrinh(ma: string): Promise<KetQuaDon> {
  const nguoi = await nguoiDangDangNhap();
  if (!nguoi) return { loi: T.nvErrQuyen };

  // Lọc theo phạm vi ngay ở đây: không ai được dọn chương trình của cơ sở khác.
  const ct = timTheoMa(ma.toUpperCase(), phamViCua(nguoi));
  if (!ct) return { loi: T.createErrNoBranch };

  const rb = demRangBuoc(ct.id);
  const h = await headers();
  const ip = h.get("x-forwarded-for") ?? h.get("x-real-ip");

  if (rb.soVan === 0) {
    xoaChuongTrinh(ct.id);
    ghiNhatKy({
      nhanVienId: nguoi.id,
      hanhDong: HANH_DONG.xoaChuongTrinh,
      doiTuong: `${ct.ma} · ${ct.tenTrungTam}`,
      soDong: 0,
      diaChiIp: ip,
    });
    revalidatePath("/quan-tri");
    redirect("/quan-tri");
  }

  anChuongTrinh(ct.id);
  // Người đang mở màn chơi phải được biết ngay, đừng để họ bấm vào hư không.
  phat(ct.ma, { loai: "trang-thai", dangChay: false });
  ghiNhatKy({
    nhanVienId: nguoi.id,
    hanhDong: HANH_DONG.anChuongTrinh,
    doiTuong: `${ct.ma} · ${ct.tenTrungTam}`,
    soDong: rb.soVan,
    diaChiIp: ip,
  });
  revalidatePath("/quan-tri");
  redirect("/quan-tri");
}
