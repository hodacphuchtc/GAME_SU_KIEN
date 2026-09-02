/**
 * Đăng nhập quản trị trong kịch bản e2e.
 *
 * Vòng Quay có ĐÚNG MỘT mật khẩu (không có tên đăng nhập, không có bảng nhân
 * viên) — xem mục "KHÔNG LÀM Ở PHIÊN BẢN NÀY" trong sổ. Bộ chạy đặt mật khẩu
 * này qua biến môi trường trước khi mở máy chủ.
 */
export const MAT_KHAU = "matkhau-e2e-12345";

export async function moTrangQuanTri(browser, goc, kichThuoc = { width: 1280, height: 900 }) {
  const ctx = await browser.newContext({ viewport: kichThuoc });
  const p = await ctx.newPage();
  await p.goto(`${goc}/quan-tri/vao`, { waitUntil: "networkidle" });
  await p.getByLabel("Mật khẩu quản trị").fill(MAT_KHAU);
  await p.getByRole("button", { name: "Đăng nhập" }).click();
  await p.waitForURL((u) => !u.pathname.includes("/vao"), { timeout: 15000 });
  return p;
}
