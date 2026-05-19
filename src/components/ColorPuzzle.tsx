"use client";

import { useState, useCallback } from "react";
import { analyzeSentiment, type BrainResponse } from "@/lib/brainEngine";

interface ColorTile {
  id: number;
  hue: number;
  color: string;
}

function generateTiles(): ColorTile[] {
  const sorted: ColorTile[] = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    hue: 90 - i * 10,
    color: `hsl(210, 40%, ${88 - i * 8}%)`,
  }));
  const shuffled = [...sorted];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j] as ColorTile, shuffled[i] as ColorTile];
  }
  return shuffled;
}

function isSolved(tiles: ColorTile[]): boolean {
  return tiles.every((tile, i) => i === 0 || tile.hue <= (tiles[i - 1] as ColorTile).hue);
}

export default function ColorPuzzle() {
  const [tiles, setTiles] = useState<ColorTile[]>(generateTiles);
  const [selected, setSelected] = useState<number | null>(null);
  const [response, setResponse] = useState<BrainResponse | null>(null);
  const [moves, setMoves] = useState(0);

  const handleTileClick = useCallback(
    (index: number) => {
      if (response) return;
      if (selected === null) {
        setSelected(index);
      } else {
        setTiles((prev) => {
          const next = [...prev];
          [next[selected], next[index]] = [next[index] as ColorTile, next[selected] as ColorTile];
          if (isSolved(next)) {
            setResponse(analyzeSentiment("eu sinto calma e foco depois de completar este exercício de grounding"));
          }
          return next;
        });
        setMoves((m) => m + 1);
        setSelected(null);
      }
    },
    [selected, response]
  );

  const reset = () => {
    setTiles(generateTiles());
    setSelected(null);
    setResponse(null);
    setMoves(0);
  };

  return (
    <section aria-label="Puzzle terapêutico" className="w-full max-w-xs">
      <div className="grid grid-cols-4 gap-2.5" role="grid" aria-label="Grade de cores">
        {tiles.map((tile, i) => (
          <button
            key={tile.id}
            type="button"
            onClick={() => handleTileClick(i)}
            aria-label={`Bloco ${i + 1}`}
            aria-pressed={selected === i}
            className={`aspect-square rounded-xl transition-all duration-150 ${
              selected === i
                ? "scale-90 ring-2 ring-blue-400 ring-offset-2"
                : "hover:scale-95 hover:shadow-md"
            }`}
            style={{ backgroundColor: tile.color }}
          />
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between">
        <span className="text-xs text-slate-400">Movimentos: {moves}</span>
        <button
          type="button"
          onClick={reset}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
        >
          Recomeçar
        </button>
      </div>

      {response && (
        <article aria-live="polite" className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5">
          <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
            <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-sm font-medium text-slate-700">Exercício completo</p>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">{response.grounding}</p>
        </article>
      )}
    </section>
  );
}
