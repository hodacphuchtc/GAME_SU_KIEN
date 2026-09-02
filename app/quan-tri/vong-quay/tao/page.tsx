import Link from "next/link";

import { T } from "@/config/locale";
import { coSoDangBat } from "@/lib/co-so/kho";
import { batBuocDangNhap } from "@/lib/bao-ve/phien-hien-tai";
import { FormTaoVongQuay } from "@/components/form-tao-vong-quay";

/** Đọc cơ sở mỗi lần vào — vừa thêm một cơ sở mà ô chọn còn cũ là bẫy khó chịu. */
export const dynamic = "force-dynamic";

export default async function TrangTaoVongQuay() {
  await batBuocDangNhap();
  const coSo = coSoDangBat();

  // Không có cơ sở nào thì KHÔNG dựng form: một ô chọn rỗng chỉ khiến người ta
  // bấm Tạo rồi nhận lỗi, thay vì biết ngay mình phải đi làm gì trước.
  if (coSo.length === 0) {
    return (
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-black text-muc sm:text-3xl">{T.vongQuayCreateTitle}</h1>
        <p className="mt-6 rounded-2xl border border-dashed border-ke bg-white p-8 text-center text-sm text-chi">
          {T.createBranchNone}
        </p>
        <div className="mt-4 flex justify-center">
          <Link
            href="/quan-tri/co-so"
            className="rounded-xl bg-cam px-6 py-3.5 text-base font-black text-white"
          >
            {T.createBranchGo}
          </Link>
        </div>
      </div>
    );
  }

  return <FormTaoVongQuay coSo={coSo} />;
}
