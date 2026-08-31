/** Giờ máy chủ — để máy khách canh đồng hồ (xem `lib/dong-bo/dong-ho.ts`). */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function GET() {
  return Response.json(
    { gio: Date.now() },
    { headers: { "cache-control": "no-store" } },
  );
}
