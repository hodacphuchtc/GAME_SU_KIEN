import Link from "next/link";

import { RULES, T } from "@/config/locale";

export default function RulesPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-5 py-8">
      <h1 className="text-2xl font-black">{T.rulesTitle}</h1>
      <ol className="flex flex-col gap-4">
        {RULES.map((rule, index) => (
          <li key={rule} className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-led text-sm font-bold text-white">
              {index + 1}
            </span>
            <span className="pt-0.5 leading-relaxed">{rule}</span>
          </li>
        ))}
      </ol>
      <Link
        href="/"
        className="mt-auto rounded-2xl bg-nen-nhat py-4 text-center text-lg font-bold ring-1 ring-vien"
      >
        {T.back}
      </Link>
    </main>
  );
}
