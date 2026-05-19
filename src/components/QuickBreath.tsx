"use client";

import { useState, useEffect, useRef } from "react";

type Phase = "inspire" | "segure" | "expire";

const PHASES: { phase: Phase; label: string; duration: number }[] = [
  { phase: "inspire", label: "Inspire", duration: 4 },
  { phase: "segure", label: "Segure", duration: 4 },
  { phase: "expire", label: "Expire", duration: 6 },
];

export default function QuickBreath() {
  const [active, setActive] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [cycles, setCycles] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startBreathing = () => {
    setActive(true);
    setPhaseIndex(0);
    setCycles(0);
  };

  useEffect(() => {
    if (!active) return;

    const current = PHASES[phaseIndex % PHASES.length];
    if (!current) return;

    timerRef.current = setTimeout(() => {
      const nextIdx = phaseIndex + 1;
      if (nextIdx % PHASES.length === 0) {
        const nextCycle = cycles + 1;
        if (nextCycle >= 3) {
          setActive(false);
          return;
        }
        setCycles(nextCycle);
      }
      setPhaseIndex(nextIdx);
    }, current.duration * 1000);

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [active, phaseIndex, cycles]);

  const currentPhase = PHASES[phaseIndex % PHASES.length];
  const scale = currentPhase?.phase === "inspire" ? "scale-125" : currentPhase?.phase === "expire" ? "scale-75" : "scale-100";

  if (!active) {
    return (
      <div className="flex flex-col items-center gap-2">
        <p className="text-xs text-slate-400">Respiração rápida — 3 ciclos</p>
        <button
          type="button"
          onClick={startBreathing}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          Começar
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className={`flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 transition-transform duration-1000 ease-in-out ${scale}`}>
        <span className="text-xs font-medium text-blue-600">{currentPhase?.label}</span>
      </div>
      <p className="text-[11px] text-slate-400">Ciclo {Math.min(cycles + 1, 3)} de 3</p>
    </div>
  );
}
