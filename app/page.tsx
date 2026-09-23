import { Suspense } from "react";
import castData from "@/survivor-51-cast.json";
import { CastGrid, type Player } from "./components/cast-grid";

export default function Home() {
  const cast = castData.cast as Player[];

  return (
    <div className="min-h-full bg-zinc-100 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white px-6 py-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          Survivor 51 — Cast
        </h1>
      </header>

      <Suspense
        fallback={
          <p className="px-4 py-12 text-center text-sm text-zinc-500">
            Loading…
          </p>
        }
      >
        <CastGrid cast={cast} />
      </Suspense>
    </div>
  );
}
