"use client";

import { useAppContext, type EmotionalState } from "@/context/AppContext";

interface EmotionOption {
  state: EmotionalState;
  emoji: string;
  label: string;
  color: string;
}

const OPTIONS: EmotionOption[] = [
  { state: "calm", emoji: "😌", label: "Calmo(a)", color: "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30" },
  { state: "anxious", emoji: "😰", label: "Ansioso(a)", color: "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/30" },
  { state: "sad", emoji: "😢", label: "Triste", color: "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30" },
  { state: "overwhelmed", emoji: "🤯", label: "Sobrecarregado(a)", color: "border-stone-300 bg-stone-100 dark:border-stone-600 dark:bg-stone-800" },
  { state: "angry", emoji: "😤", label: "Com raiva", color: "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30" },
  { state: "numb", emoji: "😶", label: "Entorpecido(a)", color: "border-stone-200 bg-stone-50 dark:border-stone-700 dark:bg-stone-800/50" },
];

export default function EmotionalCheckIn() {
  const { emotionalState, setEmotionalState } = useAppContext();

  return (
    <div
      role="radiogroup"
      aria-label="Selecione como você está se sentindo"
      className="grid grid-cols-3 gap-3 sm:grid-cols-6"
    >
      {OPTIONS.map((opt) => {
        const isActive = emotionalState === opt.state;
        return (
          <button
            key={opt.state}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={opt.label}
            onClick={() => setEmotionalState(opt.state)}
            className={`flex flex-col items-center gap-1.5 rounded-2xl border-2 p-3 transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-rose-300 ${
              isActive
                ? `${opt.color} scale-105 shadow-sm ring-2 ring-rose-300`
                : "border-stone-100 bg-white dark:border-stone-700 dark:bg-stone-800"
            }`}
          >
            <span className="text-2xl" aria-hidden="true">{opt.emoji}</span>
            <span className="text-[11px] font-medium leading-tight text-stone-600 dark:text-stone-300">
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
