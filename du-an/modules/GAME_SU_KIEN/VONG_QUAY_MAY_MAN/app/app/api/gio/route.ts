/**
 * Giờ máy chủ — để máy khách canh đồng hồ (xem `lib/dong-bo/dong-ho.ts`).
 *
 * 🔴 Route này CHỈ đúng khi KHÔNG bật `trailingSlash` trong `next.config.ts`:
 * bật lên thì `/api/gio` bị chuyển hướng 308 sang `/api/gio/`, thêm nguyên một
 * lượt đi–về vào đúng phép đo độ lệch — tức là làm hỏng chính thứ nó đang đo.
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function GET() {
  return Response.json({ gio: Date.now() }, { headers: { "cache-control": "no-store" } });
}
