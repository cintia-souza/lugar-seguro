"use client";

import { useState, useEffect, useRef, useCallback } from "react";

type Technique = "4-7-8" | "caixa" | "calma";
type Phase = "inspire" | "segure" | "expire" | "pausa";

interface BreathStep {
  phase: Phase;
  label: string;
  duration: number;
}

interface TechniqueConfig {
  id: Technique;
  name: string;
  description: string;
  steps: BreathStep[];
  cycles: number;
}

const TECHNIQUES: TechniqueConfig[] = [
  {
    id: "4-7-8",
    name: "4-7-8 Relaxante",
    description: "Ativa o sistema parassimpático. Ideal para ansiedade e insônia.",
    steps: [
      { phase: "inspire", label: "Inspire", duration: 4 },
      { phase: "segure", label: "Segure", duration: 7 },
      { phase: "expire", label: "Expire", duration: 8 },
    ],
    cycles: 4,
  },
  {
    id: "caixa",
    name: "Respiração Caixa",
    description: "Usada por militares para manter calma sob pressão.",
    steps: [
      { phase: "inspire", label: "Inspire", duration: 4 },
      { phase: "segure", label: "Segure", duration: 4 },
      { phase: "expire", label: "Expire", duration: 4 },
      { phase: "pausa", label: "Pausa", duration: 4 },
    ],
    cycles: 4,
  },
  {
    id: "calma",
    name: "Respiração Calma",
    description: "Simples e suave. Expire mais longo que inspira para acalmar.",
    steps: [
      { phase: "inspire", label: "Inspire", duration: 4 },
      { phase: "expire", label: "Expire", duration: 6 },
    ],
    cycles: 6,
  },
];

export default function BreathingExercise() {
  const [selectedTechnique, setSelectedTechnique] = useState<TechniqueConfig>(TECHNIQUES[0] as TechniqueConfig);
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [currentCycle, setCurrentCycle] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [completed, setCompleted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsActive(false);
    setCurrentStep(0);
    setCurrentCycle(0);
    setCountdown(0);
  }, []);

  const start = () => {
    setCompleted(false);
    setIsActive(true);
    setCurrentStep(0);
    setCurrentCycle(0);
    const firstStep = selectedTechnique.steps[0];
    if (firstStep) setCountdown(firstStep.duration);
  };

  useEffect(() => {
    if (!isActive) return;

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Move to next step
          const nextStep = currentStep + 1;

          if (nextStep >= selectedTechnique.steps.length) {
            // End of cycle
            const nextCycle = currentCycle + 1;
            if (nextCycle >= selectedTechnique.cycles) {
              // All cycles done
              stop();
              setCompleted(true);
              return 0;
            }
            setCurrentCycle(nextCycle);
            setCurrentStep(0);
            const first = selectedTechnique.steps[0];
            return first ? first.duration : 0;
          }

          setCurrentStep(nextStep);
          const next = selectedTechnique.steps[nextStep];
          return next ? next.duration : 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, currentStep, currentCycle, selectedTechnique, stop]);

  const activeStep = selectedTechnique.steps[currentStep];
  const circleScale = activeStep?.phase === "inspire" ? 1.4 : activeStep?.phase === "expire" ? 0.7 : 1;

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Technique selector */}
      {!isActive && !completed && (
        <div className="w-full max-w-md">
          <h2 className="mb-4 text-sm font-medium text-slate-700">Escolha uma técnica</h2>
          <div className="grid gap-3">
            {TECHNIQUES.map((tech) => (
              <button
                key={tech.id}
                type="button"
                onClick={() => setSelectedTechnique(tech)}
                className={`rounded-xl border p-4 text-left transition-all ${
                  selectedTechnique.id === tech.id
                    ? "border-blue-200 bg-blue-50 shadow-sm"
                    : "border-slate-100 bg-white hover:border-slate-200"
                }`}
              >
                <p className={`text-sm font-medium ${selectedTechnique.id === tech.id ? "text-blue-700" : "text-slate-700"}`}>
                  {tech.name}
                </p>
                <p className="mt-0.5 text-xs text-slate-400">{tech.description}</p>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={start}
            className="mt-6 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-blue-700"
          >
            Começar
          </button>
        </div>
      )}

      {/* Active breathing */}
      {isActive && activeStep && (
        <div className="flex flex-col items-center gap-6">
          {/* Animated circle */}
          <div className="relative flex h-48 w-48 items-center justify-center">
            <div
              className="absolute inset-0 rounded-full bg-blue-100 transition-transform duration-1000 ease-in-out"
              style={{ transform: `scale(${circleScale})` }}
            />
            <div
              className="absolute inset-4 rounded-full bg-blue-50 transition-transform duration-1000 ease-in-out"
              style={{ transform: `scale(${circleScale * 0.9})` }}
            />
            <div className="relative z-10 flex flex-col items-center">
              <span className="text-3xl font-bold text-blue-600">{countdown}</span>
              <span className="mt-1 text-sm font-medium text-blue-500">{activeStep.label}</span>
            </div>
          </div>

          {/* Progress */}
          <div className="text-center">
            <p className="text-xs text-slate-400">
              Ciclo {currentCycle + 1} de {selectedTechnique.cycles}
            </p>
            <div className="mt-2 flex justify-center gap-1">
              {Array.from({ length: selectedTechnique.cycles }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 w-6 rounded-full ${i <= currentCycle ? "bg-blue-400" : "bg-slate-200"}`}
                />
              ))}
            </div>
          </div>

          {/* Stop button */}
          <button
            type="button"
            onClick={stop}
            className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-50"
          >
            Parar
          </button>
        </div>
      )}

      {/* Completed */}
      {completed && (
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
            <svg className="h-7 w-7 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-slate-700">Exercício completo</p>
            <p className="mt-1 text-sm text-slate-400">
              Você completou {selectedTechnique.cycles} ciclos de {selectedTechnique.name}.
            </p>
          </div>
          <button
            type="button"
            onClick={() => { setCompleted(false); }}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            Fazer novamente
          </button>
        </div>
      )}
    </div>
  );
}
