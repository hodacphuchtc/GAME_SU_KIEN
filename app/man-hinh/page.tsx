import { Suspense } from "react";

import { T } from "@/config/locale";
import { LcdScreen } from "@/components/man-hinh-lcd";

export default function Page() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-dvh items-center justify-center text-chu-mo">
          {T.lcdTitle}
        </main>
      }
    >
      <LcdScreen />
    </Suspense>
  );
}
