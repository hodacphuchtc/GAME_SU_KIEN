import Link from "next/link";

import { RULES_CHON_SO, T } from "@/config/locale";

/**
 * Thể lệ game CHỌN SỐ.
 *
 * 🔴 Trang riêng, không dùng chung `/the-le`: thể lệ kia nói về số trúng và
 * phần thưởng, mà ở đây KHÔNG có ai trượt. Một trang thể lệ nói sai luật còn
 * tệ hơn không có trang nào.
 */
export default function TrangTheLeChonSo() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-5 py-8">
      <h1 className="text-2xl font-black">{T.chonSoTheLeTitle}</h1>
      <ol className="flex flex-col gap-4">
        {RULES_CHON_SO.map((dong, i) => (
          <li key={dong} className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-led text-sm font-bold text-white">
              {i + 1}
            </span>
            <span className="pt-0.5 leading-relaxed">{dong}</span>
          </li>
        ))}
      </ol>
      <Link href="/" className="text-sm font-semibold text-tim underline">
        {T.back}
      </Link>
    </main>
  );
}
