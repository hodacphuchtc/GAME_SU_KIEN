/**
 * Chạy MỘT lần lúc máy chủ khởi động (móc chính thức của Next).
 *
 * Mở sẵn cơ sở dữ liệu ngay từ đầu thay vì đợi người dùng đầu tiên: hỏng đường
 * dẫn hay hỏng quyền ghi thì phải biết lúc khởi động, không phải lúc phụ huynh
 * đang đứng trước màn hình.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { csdl, duongDanCsdl } = await import("./lib/db/ket-noi");
  csdl();
  console.log(`› Cơ sở dữ liệu ĐẾM SỐ: ${duongDanCsdl()}`);
}
