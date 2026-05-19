"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import Image from "next/image";
import { useBlockPuzzle, type PieceShape, type GameEvent } from "@/hooks/useBlockPuzzle";

// --- Lumi ---
const LUMI_REACTIONS: Record<GameEvent, { image: string; speech: string }> = {
  idle: { image: "/lumi/Lumi Brincalhona - Terapêutica.png", speech: "Vamos encaixar alguns blocos sem pressa?" },
  placed: { image: "/lumi/Lumi Neutra - Companheira Estática.png", speech: "Boa! Continue no seu ritmo." },
  cleared: { image: "/lumi/Lumi Comemorando - Vitoriosa.png", speech: "Linha completa! Incrível!" },
  gameover: { image: "/lumi/Lumi Amorosa - Aconchegante.png", speech: "Ótimo exercício! Vamos de novo?" },
};

const GHOST_COLORS: Record<string, string> = {
  "bg-blue-300": "bg-blue-200/60",
  "bg-violet-300": "bg-violet-200/60",
  "bg-emerald-300": "bg-emerald-200/60",
  "bg-amber-300": "bg-amber-200/60",
  "bg-rose-300": "bg-rose-200/60",
  "bg-sky-300": "bg-sky-200/60",
  "bg-indigo-300": "bg-indigo-200/60",
  "bg-teal-300": "bg-teal-200/60",
};

type GamePhase = "start" | "playing" | "gameover";
type ComboEffect = null | "nice" | "great" | "fever" | "spectacular";

// --- Start Screen ---
function StartScreen({ onStart, highScore }: { onStart: () => void; highScore: number }) {
  return (
    <div className="flex flex-col items-center gap-6 py-8 text-center">
      <div className="relative h-20 w-20 overflow-hidden rounded-full border-4 border-blue-100 bg-blue-50 shadow-lg">
        <Image src="/lumi/Lumi Brincalhona - Terapêutica.png" alt="Lumi" fill className="object-cover" sizes="80px" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-slate-800">Quebra-Cabeça da Lumi</h2>
        <p className="mt-2 max-w-[260px] text-sm text-slate-400">
          Arraste os blocos para o tabuleiro. Complete linhas e colunas para limpar e pontuar!
        </p>
      </div>
      {highScore > 0 && (
        <p className="text-xs text-slate-400">Seu recorde: <span className="font-bold text-blue-600">{highScore}</span></p>
      )}
      <button
        type="button"
        onClick={onStart}
        className="rounded-xl bg-blue-600 px-8 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-blue-700 hover:shadow-lg"
      >
        Jogar
      </button>
    </div>
  );
}

// --- Game Over Overlay ---
function GameOverOverlay({ score, highScore, onRestart }: { score: number; highScore: number; onRestart: () => void }) {
  const isNewRecord = score >= highScore && score > 0;

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center rounded-lg bg-slate-900/60 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 rounded-2xl bg-white p-6 shadow-2xl">
        <div className="relative h-14 w-14 overflow-hidden rounded-full border-2 border-white bg-white shadow-md">
          <Image src="/lumi/Lumi Amorosa - Aconchegante.png" alt="Lumi" fill className="object-cover" sizes="56px" />
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-slate-800">Fim de jogo!</p>
          <p className="mt-1 text-2xl font-black text-blue-600">{score} pts</p>
          {isNewRecord && (
            <p className="mt-1 text-xs font-semibold text-amber-500">🏆 Novo recorde!</p>
          )}
        </div>
        <p className="max-w-[200px] text-center text-xs text-slate-400">
          Ótimo exercício para a mente. Cada partida fortalece seu foco.
        </p>
        <button
          type="button"
          onClick={onRestart}
          className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
        >
          Jogar novamente
        </button>
      </div>
    </div>
  );
}

// --- Combo Effect ---
function ComboOverlay({ effect }: { effect: ComboEffect }) {
  if (!effect) return null;

  const config: Record<NonNullable<ComboEffect>, { text: string; color: string; emoji: string }> = {
    nice: { text: "Nice!", color: "text-blue-500", emoji: "✨" },
    great: { text: "Great!", color: "text-violet-500", emoji: "🔥" },
    fever: { text: "FEVER!", color: "text-amber-500", emoji: "🎉🔥🎉" },
    spectacular: { text: "ESPETACULAR!", color: "text-rose-500", emoji: "💥🏆💥" },
  };

  const c = config[effect];

  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
      <div className="animate-page-enter text-center">
        <p className="text-3xl">{c.emoji}</p>
        <p className={`text-2xl font-black ${c.color}`} style={{ animation: "comboScale 0.6s ease-out" }}>
          {c.text}
        </p>
      </div>
    </div>
  );
}

// --- Drag Overlay ---
function DragOverlay({ piece, position }: { piece: PieceShape; position: { x: number; y: number } }) {
  return (
    <div
      className="pointer-events-none fixed z-50 opacity-80"
      style={{ left: position.x - 10, top: position.y - 10 }}
    >
      <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${piece.shape[0]?.length ?? 1}, 1fr)` }}>
        {piece.shape.map((row, r) =>
          row.map((cell, c) => (
            <div key={`${r}-${c}`} className={`h-5 w-5 rounded-sm ${cell === 1 ? piece.color : "bg-transparent"}`} />
          ))
        )}
      </div>
    </div>
  );
}

// --- Piece Slot ---
function PieceSlot({ piece, index, onDragStart, disabled }: {
  piece: PieceShape | null;
  index: number;
  onDragStart: (index: number, e: React.MouseEvent | React.TouchEvent) => void;
  disabled: boolean;
}) {
  if (!piece) {
    return <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-dashed border-slate-200" />;
  }

  return (
    <div
      className={`rounded-xl border border-slate-100 bg-white p-2.5 shadow-sm transition-all ${
        disabled ? "opacity-40" : "cursor-grab hover:shadow-md active:scale-95 active:cursor-grabbing"
      }`}
      onMouseDown={(e) => !disabled && onDragStart(index, e)}
      onTouchStart={(e) => !disabled && onDragStart(index, e)}
      aria-label={`Peça ${index + 1}`}
      role="button"
      tabIndex={disabled ? -1 : 0}
    >
      <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${piece.shape[0]?.length ?? 1}, 1fr)` }}>
        {piece.shape.map((row, r) =>
          row.map((cell, c) => (
            <div key={`${r}-${c}`} className={`h-4 w-4 rounded-sm ${cell === 1 ? piece.color : "bg-transparent"}`} />
          ))
        )}
      </div>
    </div>
  );
}

// --- Main ---
export default function BlockPuzzle() {
  const { board, pieces, score, highScore, gameOver, lastEvent, placePiece, canPlace, restart } = useBlockPuzzle();
  const [phase, setPhase] = useState<GamePhase>("start");
  const [dragging, setDragging] = useState<{ pieceIndex: number; position: { x: number; y: number } } | null>(null);
  const [hoverCell, setHoverCell] = useState<{ row: number; col: number } | null>(null);
  const [comboEffect, setComboEffect] = useState<ComboEffect>(null);
  const [totalCleared, setTotalCleared] = useState(0);
  const boardRef = useRef<HTMLDivElement>(null);

  const lumiReaction = LUMI_REACTIONS[lastEvent];
  const activePiece = dragging !== null ? pieces[dragging.pieceIndex] : null;

  // Track game over
  useEffect(() => {
    if (gameOver && phase === "playing") {
      setPhase("gameover");
    }
  }, [gameOver, phase]);

  // Track combos when lines are cleared
  useEffect(() => {
    if (lastEvent === "cleared") {
      setTotalCleared((prev) => {
        const next = prev + 1;
        if (next >= 5) {
          setComboEffect("spectacular");
        } else if (next >= 3) {
          setComboEffect("fever");
        } else if (next >= 2) {
          setComboEffect("great");
        } else {
          setComboEffect("nice");
        }
        return next;
      });

      // Clear effect after animation
      setTimeout(() => setComboEffect(null), 1500);
    } else if (lastEvent === "placed") {
      // Reset combo streak on regular placement without clearing
      setTotalCleared(0);
    }
  }, [lastEvent]);

  // Get board cell from cursor
  const getCellFromPosition = useCallback((clientX: number, clientY: number): { row: number; col: number } | null => {
    if (!boardRef.current) return null;
    const rect = boardRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    if (x < 0 || y < 0 || x > rect.width || y > rect.height) return null;
    const col = Math.floor((x / rect.width) * 8);
    const row = Math.floor((y / rect.height) * 8);
    if (row < 0 || row >= 8 || col < 0 || col >= 8) return null;
    return { row, col };
  }, []);

  // Drag handlers
  const handleDragStart = useCallback((index: number, e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const pos = "touches" in e
      ? { x: e.touches[0]?.clientX ?? 0, y: e.touches[0]?.clientY ?? 0 }
      : { x: e.clientX, y: e.clientY };
    setDragging({ pieceIndex: index, position: pos });
  }, []);

  useEffect(() => {
    if (dragging === null) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      const pos = "touches" in e
        ? { x: e.touches[0]?.clientX ?? 0, y: e.touches[0]?.clientY ?? 0 }
        : { x: e.clientX, y: e.clientY };
      setDragging((prev) => prev ? { ...prev, position: pos } : null);
      setHoverCell(getCellFromPosition(pos.x, pos.y));
    };

    const handleEnd = (e: MouseEvent | TouchEvent) => {
      const pos = "changedTouches" in e
        ? { x: e.changedTouches[0]?.clientX ?? 0, y: e.changedTouches[0]?.clientY ?? 0 }
        : { x: e.clientX, y: e.clientY };
      const cell = getCellFromPosition(pos.x, pos.y);
      if (cell && dragging) placePiece(dragging.pieceIndex, cell.row, cell.col);
      setDragging(null);
      setHoverCell(null);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleEnd);
    window.addEventListener("touchmove", handleMove, { passive: false });
    window.addEventListener("touchend", handleEnd);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleEnd);
    };
  }, [dragging, getCellFromPosition, placePiece]);

  // Ghost cells
  const ghostCells = useMemo((): Set<string> => {
    if (!activePiece || !hoverCell) return new Set();
    const cells = new Set<string>();
    for (let r = 0; r < activePiece.shape.length; r++) {
      const row = activePiece.shape[r];
      if (!row) continue;
      for (let c = 0; c < row.length; c++) {
        if (row[c] === 1) cells.add(`${hoverCell.row + r}-${hoverCell.col + c}`);
      }
    }
    return cells;
  }, [activePiece, hoverCell]);

  const hoverValid = useMemo((): boolean => {
    if (!activePiece || !hoverCell) return false;
    return canPlace(activePiece, hoverCell.row, hoverCell.col);
  }, [activePiece, hoverCell, canPlace]);

  const ghostColor = activePiece ? (GHOST_COLORS[activePiece.color] ?? "bg-slate-200/60") : "";

  const handleStart = () => {
    restart();
    setPhase("playing");
    setTotalCleared(0);
  };

  const handleRestart = () => {
    restart();
    setPhase("playing");
    setTotalCleared(0);
    setComboEffect(null);
  };

  // --- START SCREEN ---
  if (phase === "start") {
    return <StartScreen onStart={handleStart} highScore={highScore} />;
  }

  // --- GAME ---
  return (
    <div className="flex flex-col items-center gap-5">
      {/* Lumi + Score */}
      <div className="flex w-[300px] items-center gap-3">
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-white bg-white shadow-md">
          <Image src={lumiReaction.image} alt="Lumi" fill className="object-cover" sizes="40px" />
        </div>
        <p className="min-w-0 flex-1 truncate text-xs text-slate-600">{lumiReaction.speech}</p>
        <div className="shrink-0 text-right">
          <p className="text-sm font-bold text-slate-700">{score}</p>
          <p className="text-[9px] text-slate-400">Recorde: {highScore}</p>
        </div>
      </div>

      {/* Board */}
      <div className="relative w-[300px] rounded-2xl border border-slate-100 bg-white/90 p-3 shadow-sm">
        <div
          className="overflow-hidden rounded-lg bg-slate-100"
          style={{ width: "276px", height: "276px", position: "relative" }}
        >
          <div
            ref={boardRef}
            className="absolute inset-0 grid gap-px"
            style={{ gridTemplateColumns: "repeat(8, 1fr)" }}
          >
            {board.map((row, r) =>
              row.map((cell, c) => {
                const key = `${r}-${c}`;
                const isGhost = ghostCells.has(key);
                const isFilled = cell === 1;

                let bg: string;
                if (isFilled) {
                  bg = "bg-blue-300";
                } else if (isGhost) {
                  bg = hoverValid ? ghostColor : "bg-rose-200/50";
                } else {
                  bg = "bg-white";
                }

                return <div key={key} data-cell className={`transition-colors duration-75 ${bg}`} />;
              })
            )}
          </div>
        </div>

        {/* Combo effect */}
        <ComboOverlay effect={comboEffect} />

        {/* Game over overlay */}
        {phase === "gameover" && (
          <GameOverOverlay score={score} highScore={highScore} onRestart={handleRestart} />
        )}
      </div>

      {/* Pieces */}
      <div className="flex items-center justify-center gap-3">
        {pieces.map((piece, i) => (
          <PieceSlot
            key={piece?.id ?? `empty-${i}`}
            piece={piece}
            index={i}
            onDragStart={handleDragStart}
            disabled={phase === "gameover"}
          />
        ))}
      </div>

      {/* Drag overlay */}
      {dragging !== null && activePiece && (
        <DragOverlay piece={activePiece} position={dragging.position} />
      )}
    </div>
  );
}
