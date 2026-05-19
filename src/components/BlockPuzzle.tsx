"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import Image from "next/image";
import { useBlockPuzzle, type PieceShape, type GameEvent } from "@/hooks/useBlockPuzzle";

// --- Types ---
type GamePhase = "start" | "playing" | "gameover";
type ComboEffect = null | "nice" | "great" | "fever" | "spectacular";

// --- Lumi ---
const LUMI_REACTIONS: Record<GameEvent, { image: string; speech: string }> = {
  idle: { image: "/lumi/Lumi Brincalhona - Terapêutica.png", speech: "Encaixe os blocos sem pressa!" },
  placed: { image: "/lumi/Lumi Neutra - Companheira Estática.png", speech: "Boa! Continue assim." },
  cleared: { image: "/lumi/Lumi Comemorando - Vitoriosa.png", speech: "Linha completa! 🎉" },
  gameover: { image: "/lumi/Lumi Amorosa - Aconchegante.png", speech: "Ótimo exercício!" },
};

const GHOST_COLORS: Record<string, string> = {
  "bg-blue-300": "bg-blue-200/50",
  "bg-violet-300": "bg-violet-200/50",
  "bg-emerald-300": "bg-emerald-200/50",
  "bg-amber-300": "bg-amber-200/50",
  "bg-rose-300": "bg-rose-200/50",
  "bg-sky-300": "bg-sky-200/50",
  "bg-indigo-300": "bg-indigo-200/50",
  "bg-teal-300": "bg-teal-200/50",
};

// ============================================================
// START SCREEN
// ============================================================
function StartScreen({ onStart, highScore }: { onStart: () => void; highScore: number }) {
  return (
    <div className="flex w-[320px] flex-col items-center rounded-3xl border border-slate-100 bg-white/95 p-8 shadow-lg backdrop-blur-sm">
      {/* Lumi with floating hearts */}
      <div className="relative mb-5">
        <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-teal-100 bg-teal-50 shadow-lg">
          <Image src="/lumi/Lumi Brincalhona - Terapêutica.png" alt="Lumi" fill className="object-cover" sizes="96px" />
        </div>
        {/* Floating hearts */}
        <span className="absolute -right-2 -top-1 text-lg" style={{ animation: "comboScale 2s ease-in-out infinite" }}>💜</span>
        <span className="absolute -left-3 top-3 text-sm" style={{ animation: "comboScale 2.5s ease-in-out infinite 0.5s" }}>💙</span>
        <span className="absolute -right-1 bottom-2 text-xs" style={{ animation: "comboScale 3s ease-in-out infinite 1s" }}>✨</span>
      </div>

      {/* Title */}
      <h2 className="text-xl font-bold text-teal-700">Quebra-Cabeça da Lumi</h2>
      <p className="mt-2 max-w-[240px] text-center text-xs leading-relaxed text-slate-400">
        Arraste os blocos para o tabuleiro 8×8. Complete linhas e colunas para limpar e pontuar!
      </p>

      {/* High score box */}
      {highScore > 0 && (
        <div className="mt-5 rounded-xl border border-slate-100 bg-white/60 px-5 py-2.5 text-center">
          <p className="text-[10px] uppercase tracking-wider text-slate-400">Recorde anterior</p>
          <p className="mt-0.5 text-lg font-bold text-teal-600">{highScore.toLocaleString()}</p>
        </div>
      )}

      {/* Play button */}
      <button
        type="button"
        onClick={onStart}
        className="mt-6 rounded-full bg-blue-600 px-10 py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-blue-700 hover:shadow-xl"
        style={{ animation: "pulse 2s ease-in-out infinite" }}
      >
        Jogar
      </button>
    </div>
  );
}

// ============================================================
// GAME OVER OVERLAY
// ============================================================
function GameOverOverlay({ score, highScore, onRestart }: { score: number; highScore: number; onRestart: () => void }) {
  const isNewRecord = score >= highScore && score > 0;

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-slate-900/60 backdrop-blur-sm">
      <div className="flex w-[260px] flex-col items-center rounded-3xl bg-white p-7 shadow-2xl">
        {/* Lumi Amorosa */}
        <div className="relative mb-4 h-16 w-16 overflow-hidden rounded-full border-3 border-rose-100 bg-rose-50 shadow-md">
          <Image src="/lumi/Lumi Amorosa - Aconchegante.png" alt="Lumi" fill className="object-cover" sizes="64px" />
        </div>

        <p className="text-sm font-semibold text-slate-600">Fim de jogo!</p>

        {/* Score — large */}
        <p className="mt-2 text-5xl font-black text-blue-600">{score.toLocaleString()}</p>
        <p className="mt-1 text-[10px] text-slate-400">pontos</p>

        {/* New record badge */}
        {isNewRecord && (
          <div className="mt-2 rounded-full bg-amber-50 px-3 py-1">
            <p className="text-xs font-bold text-amber-600">🏆 Novo recorde!</p>
          </div>
        )}

        <p className="mt-4 max-w-[200px] text-center text-[11px] leading-relaxed text-slate-400">
          Ótimo exercício para a mente. Cada partida fortalece seu foco e concentração.
        </p>

        {/* Restart button */}
        <button
          type="button"
          onClick={onRestart}
          className="mt-5 w-full rounded-full bg-blue-600 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-blue-700"
        >
          Jogar novamente
        </button>
      </div>
    </div>
  );
}

// ============================================================
// COMBO EFFECT WITH PARTICLES
// ============================================================
function ComboOverlay({ effect }: { effect: ComboEffect }) {
  if (!effect) return null;

  const config: Record<NonNullable<ComboEffect>, { text: string; color: string; particles: string[] }> = {
    nice: { text: "Nice!", color: "text-blue-500", particles: ["✨", "⭐"] },
    great: { text: "Great!", color: "text-violet-600", particles: ["🔥", "✨", "⭐"] },
    fever: { text: "FEVER!", color: "text-amber-500", particles: ["🎉", "🔥", "🎉", "✨", "💥"] },
    spectacular: { text: "ESPETACULAR!", color: "text-rose-500", particles: ["💥", "🏆", "🎉", "🔥", "💥", "✨", "🎊"] },
  };

  const c = config[effect];

  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center overflow-hidden">
      {/* Particles */}
      {c.particles.map((p, i) => (
        <span
          key={i}
          className="absolute text-lg"
          style={{
            left: `${15 + (i * 12)}%`,
            top: `${20 + ((i * 17) % 50)}%`,
            animation: `comboScale ${1 + i * 0.2}s ease-out forwards`,
            animationDelay: `${i * 0.1}s`,
            opacity: 0,
          }}
        >
          {p}
        </span>
      ))}
      {/* Text */}
      <div className="text-center" style={{ animation: "comboScale 0.6s ease-out" }}>
        <p className={`text-3xl font-black drop-shadow-lg ${c.color}`}>{c.text}</p>
      </div>
    </div>
  );
}

// ============================================================
// DRAG OVERLAY
// ============================================================
function DragOverlay({ piece, position }: { piece: PieceShape; position: { x: number; y: number } }) {
  return (
    <div className="pointer-events-none fixed z-50 opacity-75" style={{ left: position.x - 10, top: position.y - 10 }}>
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

// ============================================================
// PIECE SLOT
// ============================================================
function PieceSlot({ piece, index, onDragStart, disabled }: {
  piece: PieceShape | null;
  index: number;
  onDragStart: (index: number, e: React.MouseEvent | React.TouchEvent) => void;
  disabled: boolean;
}) {
  if (!piece) {
    return <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60" />;
  }

  return (
    <div
      className={`rounded-xl border bg-slate-50/60 p-2.5 transition-all ${
        disabled
          ? "pointer-events-none border-slate-100 opacity-40"
          : "cursor-grab border-slate-100 shadow-sm hover:border-slate-200 hover:shadow-md active:scale-90 active:cursor-grabbing"
      }`}
      onMouseDown={(e) => !disabled && onDragStart(index, e)}
      onTouchStart={(e) => !disabled && onDragStart(index, e)}
      aria-label={`Peça ${index + 1}`}
      role="button"
      tabIndex={disabled ? -1 : 0}
    >
      <div className="grid gap-px" style={{ gridTemplateColumns: `repeat(${piece.shape[0]?.length ?? 1}, 1fr)` }}>
        {piece.shape.map((row, r) =>
          row.map((cell, c) => (
            <div key={`${r}-${c}`} className={`h-4 w-4 rounded-sm ${cell === 1 ? piece.color : "bg-transparent"}`} />
          ))
        )}
      </div>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function BlockPuzzle() {
  const { board, pieces, score, highScore, gameOver, lastEvent, placePiece, canPlace, restart } = useBlockPuzzle();
  const [phase, setPhase] = useState<GamePhase>("start");
  const [dragging, setDragging] = useState<{ pieceIndex: number; position: { x: number; y: number } } | null>(null);
  const [hoverCell, setHoverCell] = useState<{ row: number; col: number } | null>(null);
  const [comboEffect, setComboEffect] = useState<ComboEffect>(null);
  const [totalCleared, setTotalCleared] = useState(0);
  const [scoreGlow, setScoreGlow] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);

  const lumiReaction = LUMI_REACTIONS[lastEvent];
  const activePiece = dragging !== null ? pieces[dragging.pieceIndex] : null;

  // Game over detection
  useEffect(() => {
    if (gameOver && phase === "playing") setPhase("gameover");
  }, [gameOver, phase]);

  // Combo tracking
  useEffect(() => {
    if (lastEvent === "cleared") {
      setTotalCleared((prev) => {
        const next = prev + 1;
        if (next >= 5) setComboEffect("spectacular");
        else if (next >= 3) setComboEffect("fever");
        else if (next >= 2) setComboEffect("great");
        else setComboEffect("nice");
        return next;
      });
      setScoreGlow(true);
      setTimeout(() => setComboEffect(null), 1800);
      setTimeout(() => setScoreGlow(false), 600);
    } else if (lastEvent === "placed") {
      setTotalCleared(0);
      setScoreGlow(true);
      setTimeout(() => setScoreGlow(false), 400);
    }
  }, [lastEvent]);

  // Cell from cursor position
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

  const ghostColor = activePiece ? (GHOST_COLORS[activePiece.color] ?? "bg-slate-200/50") : "";

  const handleStart = () => { restart(); setPhase("playing"); setTotalCleared(0); };
  const handleRestart = () => { restart(); setPhase("playing"); setTotalCleared(0); setComboEffect(null); };

  // --- START ---
  if (phase === "start") {
    return (
      <div className="flex items-center justify-center">
        <StartScreen onStart={handleStart} highScore={highScore} />
      </div>
    );
  }

  // --- GAME ---
  return (
    <div className="flex flex-col items-center gap-4">
      {/* Score bar */}
      <div className="flex w-[300px] items-center justify-between rounded-2xl border border-slate-100 bg-white/90 px-4 py-2.5 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border-2 border-white bg-white shadow">
            <Image src={lumiReaction.image} alt="Lumi" fill className="object-cover" sizes="36px" />
          </div>
          <p className="max-w-[120px] truncate text-[11px] text-slate-500">{lumiReaction.speech}</p>
        </div>
        <div className="text-right">
          <p className={`text-base font-bold transition-all duration-300 ${scoreGlow ? "scale-110 text-teal-500" : "text-slate-800"}`}>
            {score.toLocaleString()}
          </p>
          <p className="text-[9px] text-slate-400">Recorde: {highScore.toLocaleString()}</p>
        </div>
      </div>

      {/* Board — FIXED SIZE */}
      <div className="relative w-[300px] rounded-2xl border border-slate-100 bg-white/90 p-3 shadow-sm">
        <div className="overflow-hidden rounded-xl bg-slate-100" style={{ width: "276px", height: "276px", position: "relative" }}>
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
                if (isFilled) bg = "bg-blue-300";
                else if (isGhost) bg = hoverValid ? ghostColor : "bg-rose-200/40";
                else bg = "bg-white";

                return <div key={key} className={`transition-colors duration-75 ${bg}`} />;
              })
            )}
          </div>
        </div>

        {/* Combo */}
        <ComboOverlay effect={comboEffect} />

        {/* Game Over */}
        {phase === "gameover" && (
          <GameOverOverlay score={score} highScore={highScore} onRestart={handleRestart} />
        )}
      </div>

      {/* Pieces */}
      <div className="flex w-[300px] items-center justify-center gap-3 rounded-2xl border border-slate-100 bg-white/90 px-4 py-3 shadow-sm">
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
