"use client";

import { useRouter } from "next/navigation";

export function ImportHeroHeader() {
  const router = useRouter();

  return (
    <div>
      {/* Sticky top bar */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-3 bg-[#F5F3EF]/90 backdrop-blur-sm">
        <button
          onClick={() => router.back()}
          className="flex size-10 items-center justify-center rounded-full hover:bg-black/5 transition-colors -ml-2"
        >
          <span className="material-symbols-outlined text-2xl text-gray-800">
            arrow_back
          </span>
        </button>
        <span className="text-sm font-medium uppercase tracking-wide text-gray-400">
          Settings
        </span>
        <button className="flex size-10 items-center justify-center rounded-full hover:bg-black/5 transition-colors -mr-2">
          <span className="material-symbols-outlined text-2xl text-gray-400">
            more_horiz
          </span>
        </button>
      </div>

      {/* Hero title */}
      <div className="px-6 pt-4 pb-6">
        <h1 className="font-serif-display text-4xl leading-tight text-gray-800">
          Importar com{" "}
          <br />
          <em className="text-calma-accent">Calma</em>
        </h1>
        <p className="mt-2 text-base text-gray-400 leading-relaxed">
          Conecte seus apps de saude para trazer equilibrio aos seus dados. Nos cuidamos do resto.
        </p>
      </div>
    </div>
  );
}
