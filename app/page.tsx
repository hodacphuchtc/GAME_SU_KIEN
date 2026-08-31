import { Suspense } from "react";

import { T } from "@/config/locale";
import { GameScreen } from "@/components/man-choi";

export default function Page() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-dvh items-center justify-center text-chu-mo">
          {T.appName}
        </main>
      }
    >
      <GameScreen />
    </Suspense>
  );
}
