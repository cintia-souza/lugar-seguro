"use client";

import { useState } from "react";
import { useAppContext, type EmotionalState } from "@/context/AppContext";

interface EmotionOption {
  state: EmotionalState;
  emoji: string;
  label: string;
}

const EMOTIONS: EmotionOption[] = [
  { state: "calm", emoji: "😌", label: "Calmo" },
  { state: "anxious", emoji: "😰", label: "Ansioso" },
  { state: "sad", emoji: "😢", label: "Triste" },
  { state: "overwhelmed", emoji: "🤯", label: "Sobrec." },
  { state: "angry", emoji: "😤", label: "Irritado" },
  { state: "numb", emoji: "😶", label: "Vazio" },
];

export default function SensoryPanel() {
  const { emotionalState, setEmotionalState } = useAppContext();
  const [bouncing, setBouncing] = useState<EmotionalState | null>(null);

  const handleSelect = (state: EmotionalState) => {
    setEmotionalState(state);
    setBouncing(state);
    setTimeout(() => setBouncing(null), 350);
  };

  return (
    <section aria-labelledby="sensory-heading">
      <h2 id="sensory-heading" className="mb-3 text-sm font-medium text-slate-700">
        Como você está?
      </h2>

      <div role="radiogroup" aria-label="Estado emocional" className="grid grid-cols-6 gap-1.5">
        {EMOTIONS.map((emotion) => {
          const isActive = emotionalState === emotion.state;
          const isBouncing = bouncing === emotion.state;

          return (
            <button
              key={emotion.state}
              type="button"
              role="radio"
              aria-checked={isActive}
              aria-label={emotion.label}
              onClick={() => handleSelect(emotion.state)}
              className={`flex flex-col items-center justify-center gap-1 rounded-lg border py-2.5 transition-all ${
                isActive
                  ? "border-blue-200 bg-blue-50"
                  : "border-slate-100 bg-white hover:border-slate-200"
              }`}
            >
              <span className={`text-lg leading-none ${isBouncing ? "animate-emoji-bounce" : ""}`} aria-hidden="true">
                {emotion.emoji}
              </span>
              <span className={`text-[9px] font-medium leading-none ${isActive ? "text-blue-600" : "text-slate-400"}`}>
                {emotion.label}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
