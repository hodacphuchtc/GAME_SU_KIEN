import { T } from "@/config/locale";
import type { CanhBaoKho } from "@/lib/qua/canh-bao";

/**
 * KÊNH 1 của cảnh báo kho (Đ14): dải màu trong trang quản trị.
 *
 * Dùng chung cho danh sách lẫn trang chi tiết — hai chỗ vẽ hai dải khác nhau là
 * hai câu chuyện khác nhau về cùng một cái kho.
 *
 * Đây là kênh DUY NHẤT nói bằng chữ. Hai kênh kia (chấm trên màn LCD, dòng nhật
 * ký) cố ý không có chữ: màn LCD là chỗ phụ huynh đang nhìn.
 */
export function DaiCanhBaoKho({ canhBao, nhanCoSo }: { canhBao: CanhBaoKho; nhanCoSo: string }) {
  if (canhBao.muc === "xanh") return null;

  const khoCan = canhBao.loaiDangTrao === null;
  const chu =
    canhBao.muc === "vang"
      ? T.canhBaoVang(
          nhanCoSo,
          canhBao.conLai ?? 0,
          canhBao.tong ?? 0,
          canhBao.loaiDangTrao?.ten ?? "",
        )
      : khoCan
        ? T.canhBaoDoCan(nhanCoSo)
        : T.canhBaoDoDay(nhanCoSo, canhBao.loaiDangTrao?.ten ?? "");

  return (
    <p
      role="status"
      aria-label={T.canhBaoNhan}
      className={[
        "khong-in mb-4 rounded-xl px-4 py-3 text-sm font-semibold",
        canhBao.muc === "vang" ? "bg-vang/20 text-muc" : "bg-do/10 text-do",
      ].join(" ")}
    >
      {chu}
    </p>
  );
}
