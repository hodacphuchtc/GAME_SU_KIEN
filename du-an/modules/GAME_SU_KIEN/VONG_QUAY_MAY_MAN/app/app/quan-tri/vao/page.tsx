import { T } from "@/config/locale";
import { daCoKhoaPhien, daCoMatKhauQuanTri } from "@/lib/bao-ve/phien-quan-tri";
import { FormDangNhap } from "@/components/form-dang-nhap";

export const dynamic = "force-dynamic";

/**
 * Trang đăng nhập — trang DUY NHẤT trong `/quan-tri` mà `proxy.ts` cho qua.
 *
 * 🔴 Khi thiếu cấu hình, trang này in THẲNG câu lệnh cần chạy. Không có nó thì
 * người vận hành bị khoá ngoài chính hệ thống của mình mà màn hình chỉ nói "sai
 * mật khẩu" — không có đường nào để đoán ra phải làm gì.
 */
export default async function TrangVao({
  searchParams,
}: {
  searchParams: Promise<{ tiep?: string }>;
}) {
  const { tiep } = await searchParams;
  const coKhoa = daCoKhoaPhien();
  const coMatKhau = daCoMatKhauQuanTri();

  return (
    <main className="flex min-h-dvh items-center justify-center bg-suong p-6">
      <div className="w-full max-w-sm">
        {!coKhoa && (
          <div className="mb-4 rounded-xl bg-do/10 p-4 text-sm text-do">
            <p className="font-semibold">{T.vaoThieuKhoa}</p>
            <code className="mt-2 block rounded-lg bg-white px-3 py-2 font-mono text-xs text-muc">
              {T.vaoHuongDanKhoa}
            </code>
          </div>
        )}
        {!coMatKhau && (
          <div className="mb-4 rounded-xl bg-vang/20 p-4 text-sm text-muc">
            <p className="font-semibold">{T.vaoThieuMatKhau}</p>
            <code className="mt-2 block rounded-lg bg-white px-3 py-2 font-mono text-xs">
              {T.vaoLenhTao}
            </code>
          </div>
        )}
        <FormDangNhap tiep={tiep ?? "/quan-tri"} />
      </div>
    </main>
  );
}
