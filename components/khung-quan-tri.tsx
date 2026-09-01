"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { T } from "@/config/locale";
import { dangXuat } from "@/app/actions/dang-nhap";
import { LogoSata } from "@/components/nhan-dien-sata";

/**
 * Khung trang quản trị: thanh bên trái + vùng nội dung.
 *
 * Thanh bên gom theo NHÓM: "Game sự kiện" xổ xuống danh sách game, rồi tới các
 * mục dùng chung. Một app chứa nhiều game nên mục điều hướng phải nói rõ đâu là
 * game, đâu là thứ dùng chung cho mọi game.
 *
 * Game chưa làm thì vẫn hiện nhưng MỜ và không bấm được — người dùng thấy được
 * lộ trình mà không bấm vào một trang trống. Trên điện thoại thanh bên thu thành
 * ngăn kéo mở bằng nút ☰.
 */

function BieuTuongTrungSo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <rect x="2.5" y="5" width="19" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M7 9.5v5M11 9.5v5M15 9.5h2M15 12h2M15 14.5h2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function BieuTuongVongQuay({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 3.5v17M3.5 12h17M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function BieuTuongCoSo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M4 20V9.5l8-5.5 8 5.5V20" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M9.5 20v-5h5v5M3 20h18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

/** Hai chữ cái đầu của họ và tên — rơi về "SR" khi chưa đăng nhập. */
function chuTat(ten: string | undefined): string {
  if (!ten) return "SR";
  const tu = ten.trim().split(/\s+/);
  const dau = tu[0]?.[0] ?? "";
  const cuoi = tu.length > 1 ? (tu[tu.length - 1][0] ?? "") : "";
  return (dau + cuoi).toUpperCase() || "SR";
}

function BieuTuongNhanVien({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <circle cx="9" cy="8.5" r="3.2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M3.5 20c0-3 2.5-5 5.5-5s5.5 2 5.5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M16 6.5a3 3 0 0 1 0 5.6M17.5 20c0-2.2-.9-4-2.3-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function BieuTuongKhach({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M4 6.5h16v11H8l-4 3.5z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M8.5 11h7M8.5 14h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function BieuTuongNhatKy({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <rect x="4.5" y="3.5" width="15" height="17" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Logo ẢNH THẬT thay cho chữ "SataRobo" dựng bằng CSS.
 *
 * Bản chữ cũ là chỗ giữ tạm cho tới khi có ảnh master; giữ nó lại nghĩa là thanh bên nói
 * một thương hiệu hơi khác với mọi tài liệu in ra.
 */
function Logo() {
  return (
    <div className="flex items-baseline gap-3">
      <LogoSata chieuCao={28} sizes="112px" preload />
      <span className="text-sm font-medium text-chi">{T.adminBrandTag}</span>
    </div>
  );
}

function ThanhBen({ dong, laQuanTri }: { dong?: () => void; laQuanTri: boolean }) {
  const duongDan = usePathname() ?? "";
  // 🔴 Không dùng startsWith("/quan-tri") cho Trúng Số nữa: từ khi có mục dùng
  // chung, tiền tố đó khớp CẢ trang Cơ sở, và thanh bên tô sáng nhầm mục.
  const laCoSo = duongDan.startsWith("/quan-tri/co-so");
  const laNhanVien = duongDan.startsWith("/quan-tri/nhan-vien");
  const laKhach = duongDan.startsWith("/quan-tri/khach");
  const laNhatKy = duongDan.startsWith("/quan-tri/nhat-ky");
  const dangMo =
    duongDan.startsWith("/quan-tri") && !laCoSo && !laNhanVien && !laKhach && !laNhatKy;

  return (
    <div className="flex h-full flex-col border-r border-ke bg-white">
      <div className="px-6 py-6">
        <Logo />
      </div>

      <nav className="flex-1 px-3">
        <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-chi">
          {T.adminGroupGame}
        </p>

        <Link
          href="/quan-tri"
          onClick={dong}
          aria-current={dangMo ? "page" : undefined}
          className={[
            "relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition",
            dangMo ? "bg-tim-nhat text-tim" : "text-muc hover:bg-suong hover:text-tim",
          ].join(" ")}
        >
          {dangMo && (
            <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-tim" aria-hidden="true" />
          )}
          <BieuTuongTrungSo className="h-5 w-5 shrink-0" />
          {T.adminNavTrungSo}
        </Link>

        {/* Game chưa làm: hiện để thấy lộ trình, nhưng KHÔNG bấm được — bấm vào
            một trang trống còn tệ hơn không có mục nào. */}
        <span
          aria-disabled="true"
          className="mt-1 flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-chi/70"
        >
          <BieuTuongVongQuay className="h-5 w-5 shrink-0" />
          {T.adminNavVongQuay}
          <span className="ml-auto rounded-full bg-chi/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
            {T.adminSapCo}
          </span>
        </span>
        <p className="px-3 pb-2 pt-6 text-[11px] font-bold uppercase tracking-[0.14em] text-chi">
          {T.adminGroupKhach}
        </p>

        <Link
          href="/quan-tri/khach"
          onClick={dong}
          aria-current={laKhach ? "page" : undefined}
          className={[
            "relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition",
            laKhach ? "bg-tim-nhat text-tim" : "text-muc hover:bg-suong hover:text-tim",
          ].join(" ")}
        >
          {laKhach && (
            <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-tim" aria-hidden="true" />
          )}
          <BieuTuongKhach className="h-5 w-5 shrink-0" />
          {T.adminNavKhach}
        </Link>

        {laQuanTri && (
          <p className="px-3 pb-2 pt-6 text-[11px] font-bold uppercase tracking-[0.14em] text-chi">
            {T.adminGroupToChuc}
          </p>
        )}

        {laQuanTri && (
        <Link
          href="/quan-tri/co-so"
          onClick={dong}
          aria-current={laCoSo ? "page" : undefined}
          className={[
            "relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition",
            laCoSo ? "bg-tim-nhat text-tim" : "text-muc hover:bg-suong hover:text-tim",
          ].join(" ")}
        >
          {laCoSo && (
            <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-tim" aria-hidden="true" />
          )}
          <BieuTuongCoSo className="h-5 w-5 shrink-0" />
          {T.adminNavCoSo}
        </Link>
        )}

        {laQuanTri && (
          <Link
            href="/quan-tri/nhan-vien"
            onClick={dong}
            aria-current={laNhanVien ? "page" : undefined}
            className={[
              "relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition",
              laNhanVien ? "bg-tim-nhat text-tim" : "text-muc hover:bg-suong hover:text-tim",
            ].join(" ")}
          >
            {laNhanVien && (
              <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-tim" aria-hidden="true" />
            )}
            <BieuTuongNhanVien className="h-5 w-5 shrink-0" />
            {T.adminNavNhanVien}
          </Link>
        )}

        {laQuanTri && (
          <Link
            href="/quan-tri/nhat-ky"
            onClick={dong}
            aria-current={laNhatKy ? "page" : undefined}
            className={[
              "relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition",
              laNhatKy ? "bg-tim-nhat text-tim" : "text-muc hover:bg-suong hover:text-tim",
            ].join(" ")}
          >
            {laNhatKy && (
              <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-tim" aria-hidden="true" />
            )}
            <BieuTuongNhatKy className="h-5 w-5 shrink-0" />
            {T.adminNavNhatKy}
          </Link>
        )}
      </nav>

      <p className="px-6 py-5 text-xs leading-relaxed text-chi">{T.adminFooter}</p>
    </div>
  );
}

export interface NguoiDungKhung {
  ten: string;
  vaiTro: string;
  /**
   * Có được thấy các mục dùng chung không.
   *
   * ⚠️ Ẩn mục ở đây CHỈ là dọn màn hình cho gọn. Cửa chặn thật nằm ở từng trang
   * (`notFound()`) và ở tầng kho (mệnh đề WHERE). Nếu chỗ này là lớp bảo vệ duy
   * nhất thì gõ thẳng địa chỉ là vào được.
   */
  laQuanTri: boolean;
}

const NHAN_VAI_TRO: Record<string, string> = {
  quan_tri: "Toàn quyền",
  quan_ly_co_so: "Quản lý cơ sở",
  sale: "Chăm sóc khách",
};

export function KhungQuanTri({
  children,
  nguoiDung,
}: {
  children: React.ReactNode;
  nguoiDung: NguoiDungKhung | null;
}) {
  const [moNganKeo, setMoNganKeo] = useState(false);
  const duongDan = usePathname() ?? "";

  // Trang đăng nhập KHÔNG được bọc trong khung: thanh bên đầy đủ mục điều hướng
  // ở một trang mà người xem chưa được phép vào là vừa vô lý vừa lộ cấu trúc.
  if (duongDan.startsWith("/quan-tri/vao")) return <>{children}</>;

  return (
    <div className="flex min-h-dvh bg-suong">
      {/* Thanh bên cố định trên màn hình rộng */}
      <aside className="hidden w-72 shrink-0 lg:block">
        <div className="fixed inset-y-0 w-72">
          <ThanhBen laQuanTri={nguoiDung?.laQuanTri === true} />
        </div>
      </aside>

      {/* Ngăn kéo trên điện thoại */}
      {moNganKeo && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label={T.adminCloseMenu}
            onClick={() => setMoNganKeo(false)}
            className="absolute inset-0 bg-muc/40"
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[80vw] shadow-2xl">
            <ThanhBen dong={() => setMoNganKeo(false)} laQuanTri={nguoiDung?.laQuanTri === true} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-ke bg-white px-4 py-3 sm:px-6">
          <button
            type="button"
            aria-label={T.adminOpenMenu}
            onClick={() => setMoNganKeo(true)}
            className="rounded-lg p-2 text-muc ring-1 ring-ke lg:hidden"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>

          <label className="relative hidden min-w-0 flex-1 items-center sm:flex">
            <span className="sr-only">{T.adminSearch}</span>
            <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-4 h-4 w-4 text-chi" fill="none" aria-hidden="true">
              <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
              <path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <input
              placeholder={T.adminSearch}
              className="w-full max-w-xl rounded-full border border-ke bg-white py-2.5 pl-11 pr-4 text-sm text-muc placeholder:text-chi focus:border-tim focus:outline-none"
            />
          </label>

          <div className="ml-auto flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-tim text-sm font-bold text-white">
              {chuTat(nguoiDung?.ten)}
            </span>
            <span className="hidden leading-tight sm:block">
              <span className="block text-sm font-semibold text-muc">
                {nguoiDung?.ten ?? T.adminUserName}
              </span>
              <span className="block text-xs text-chi">
                {nguoiDung ? (NHAN_VAI_TRO[nguoiDung.vaiTro] ?? nguoiDung.vaiTro) : T.adminUserRole}
              </span>
            </span>
            {nguoiDung && (
              <form action={dangXuat}>
                <button
                  type="submit"
                  className="rounded-lg border border-ke px-3 py-2 text-xs font-bold text-muc hover:border-tim hover:text-tim"
                >
                  {T.vaoRa}
                </button>
              </form>
            )}
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
