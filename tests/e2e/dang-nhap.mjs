/**
 * Đăng nhập quản trị trong kịch bản e2e.
 *
 * Từ GĐ 15, mọi trang `/quan-tri/*` đều bị `proxy.ts` chắn. Kịch bản viết trước
 * đó đi thẳng vào `/quan-tri/co-so` sẽ bị đá sang màn đăng nhập và chờ mãi một
 * cái nút không bao giờ hiện — trông y như app hỏng.
 *
 * Bộ chạy tạo sẵn tài khoản `sep` / `matkhau12345` cho MỌI kịch bản.
 */
export const TAI_KHOAN = { ten: "sep", matKhau: "matkhau12345" };

export async function moTrangQuanTri(browser, goc, kichThuoc = { width: 1280, height: 900 }) {
  const ctx = await browser.newContext({ viewport: kichThuoc });
  const p = await ctx.newPage();
  await p.goto(`${goc}/quan-tri/vao`, { waitUntil: "networkidle" });
  await p.getByLabel("Tên đăng nhập").fill(TAI_KHOAN.ten);
  await p.getByLabel("Mật khẩu").fill(TAI_KHOAN.matKhau);
  await p.getByRole("button", { name: "ĐĂNG NHẬP" }).click();
  await p.waitForURL((u) => !u.pathname.includes("/vao"), { timeout: 15000 });
  return p;
}
