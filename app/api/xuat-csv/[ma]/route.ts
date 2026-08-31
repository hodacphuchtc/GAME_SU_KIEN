import { formatNumber } from "@/lib/bo-dem";
import { timTheoMa } from "@/lib/chuong-trinh/kho";
import { toanBoLichSu } from "@/lib/luot/kho-luot";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Xuất lịch sử quay số ra CSV cho nhân viên đối soát hoặc nhập sang CRM.
 *
 * Dùng BOM + dấu chấm phẩy: Excel bản tiếng Việt mở file UTF-8 không BOM sẽ hiện
 * chữ có dấu thành ký tự lạ, và nó tách cột theo dấu chấm phẩy chứ không phải phẩy.
 */
const COT = [
  "Thời điểm",
  "Họ tên",
  "Số điện thoại",
  "Dừng ở",
  "Kết quả",
  "Lệch",
  "Bấm từ",
  "Mã xác thực",
  "Đã trao thưởng",
  "Quan tâm học thử",
];

function oCsv(gt: string | number | null): string {
  const s = String(gt ?? "");
  return /[";\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ ma: string }> },
) {
  const { ma } = await params;
  const ct = timTheoMa(ma.toUpperCase());
  if (!ct) return new Response("Không tìm thấy chương trình", { status: 404 });

  const dinhDangGio = new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    dateStyle: "short",
    timeStyle: "medium",
  });

  const dong = toanBoLichSu(ct.id).map((l) =>
    [
      l.ketThucLuc === null ? "" : dinhDangGio.format(new Date(l.ketThucLuc)),
      l.hoTen ?? "",
      l.soDienThoai ?? "",
      l.soDaDung === null ? "" : formatNumber(l.soDaDung),
      l.trung ? "TRÚNG" : l.hetGio ? "Hết giờ" : "Trượt",
      l.khoangLech ?? "",
      l.thietBiBam ?? "",
      l.maXacThuc ?? "",
      l.daTraoThuong ? "x" : "",
      l.quanTamHocThu ? "x" : "",
    ]
      .map(oCsv)
      .join(";"),
  );

  const noiDung = `﻿${COT.join(";")}\n${dong.join("\n")}\n`;
  return new Response(noiDung, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="dem-so-${ct.ma}.csv"`,
    },
  });
}
