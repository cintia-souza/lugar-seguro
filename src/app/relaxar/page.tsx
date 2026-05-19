"use client";

import { useState } from "react";
import LayoutWrapper from "@/components/LayoutWrapper";
import ColorPuzzle from "@/components/ColorPuzzle";
import BlockPuzzle from "@/components/BlockPuzzle";
import BackButton from "@/components/BackButton";

type PuzzleType = "block" | "color";

export default function RelaxarPage() {
  const [active, setActive] = useState<PuzzleType>("block");

  return (
    <LayoutWrapper size="default">
      <BackButton />
      <header className="mb-6 text-center">
        <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
          <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-slate-800">Descontração</h1>
        <p className="mt-1 text-sm text-slate-400">Foque no movimento. O resto pode esperar.</p>
      </header>

      {/* Puzzle selector */}
      <div className="mb-6 flex justify-center gap-2">
        <button
          type="button"
          onClick={() => setActive("block")}
          className={`rounded-lg px-4 py-2 text-xs font-medium transition-all ${
            active === "block" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Quebra-cabeça
        </button>
        <button
          type="button"
          onClick={() => setActive("color")}
          className={`rounded-lg px-4 py-2 text-xs font-medium transition-all ${
            active === "color" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Cores
        </button>
      </div>

      {/* Active puzzle */}
      <div className="flex justify-center">
        {active === "block" ? <BlockPuzzle /> : <ColorPuzzle />}
      </div>
    </LayoutWrapper>
  );
}
