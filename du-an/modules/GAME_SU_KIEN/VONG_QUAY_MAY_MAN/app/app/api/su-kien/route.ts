import { dangKy, phat, soNguoiNghe } from "@/lib/dong-bo/tram-phat";

/*
 * NGUỒN: chép từ `modules/GAME_SU_KIEN/app/app/api/su-kien/route.ts` @ 3d96358.
 * Giữ nguyên — cơ chế SSE không khác nhau giữa hai app.
 */

/**
 * Kênh đồng bộ giữa màn hình LCD và điện thoại phụ huynh.
 *
 *   GET  /api/su-kien?phong=AC37  → mở luồng SSE, nghe diễn biến của lượt quay
 *   POST /api/su-kien?phong=AC37  → phát một tin cho cả phòng
 *
 * Chạy trong chính máy chủ Next nên không cần tiến trình riêng, và cũng không
 * cần dịch vụ thời gian thực bên ngoài.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Luồng SSE sống lâu — không được để nền tảng cắt giữa chừng.
export const maxDuration = 3600;

const NHIP_PING_MS = 20_000;

function layPhong(req: Request): string {
  return (new URL(req.url).searchParams.get("phong") ?? "").toUpperCase().slice(0, 8);
}

export function GET(req: Request) {
  const phong = layPhong(req);
  if (phong === "") {
    return Response.json({ ok: false, loi: "thiếu mã phòng" }, { status: 400 });
  }

  const bang = new TextEncoder();
  let nhipPing: ReturnType<typeof setInterval> | undefined;
  let roiPhong: (() => void) | undefined;

  const luong = new ReadableStream<Uint8Array>({
    start(dieuKhien) {
      const day = (chuoi: string) => dieuKhien.enqueue(bang.encode(chuoi));

      // Bảo trình duyệt nối lại sau 2 giây nếu đứt — wifi trung tâm hay chập chờn.
      day("retry: 2000\n\n");
      day(`data: ${JSON.stringify({ loai: "da-noi", phong })}\n\n`);

      roiPhong = dangKy(phong, (tin) => day(`data: ${tin}\n\n`));

      // Ping định kỳ: nhiều proxy cắt kết nối im lặng sau ~30 giây không có dữ liệu.
      nhipPing = setInterval(() => {
        try {
          day(": ping\n\n");
        } catch {
          clearInterval(nhipPing);
        }
      }, NHIP_PING_MS);

      req.signal.addEventListener("abort", () => {
        clearInterval(nhipPing);
        roiPhong?.();
        try {
          dieuKhien.close();
        } catch {
          // Đã đóng rồi thì thôi.
        }
      });
    },
    cancel() {
      clearInterval(nhipPing);
      roiPhong?.();
    },
  });

  return new Response(luong, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      "x-accel-buffering": "no",
    },
  });
}

export async function POST(req: Request) {
  const phong = layPhong(req);
  if (phong === "") {
    return Response.json({ ok: false, loi: "thiếu mã phòng" }, { status: 400 });
  }
  let than: unknown;
  try {
    than = await req.json();
  } catch {
    return Response.json({ ok: false, loi: "không phải JSON hợp lệ" }, { status: 400 });
  }
  return Response.json({ ok: true, daGui: phat(phong, than), dangNghe: soNguoiNghe(phong) });
}
