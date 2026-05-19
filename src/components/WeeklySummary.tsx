"use client";

import { useState, useEffect } from "react";

const HISTORY_KEY = "meu-lugarzinho-emotion-history";

interface EmotionLog {
  date: string;
  state: string;
}

const EMOTION_LABELS: Record<string, string> = {
  calm: "calmo(a) 😌",
  anxious: "ansioso(a) 😰",
  sad: "triste 😢",
  overwhelmed: "sobrecarregado(a) 🤯",
  angry: "com raiva 😤",
  numb: "entorpecido(a) 😶",
  neutral: "neutro(a) 🙂",
};

function getWeekSummary(): string | null {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return null;

    const history: EmotionLog[] = JSON.parse(raw) as EmotionLog[];
    if (history.length < 3) return null;

    // Count occurrences
    const counts = new Map<string, number>();
    for (const log of history.slice(0, 7)) {
      counts.set(log.state, (counts.get(log.state) ?? 0) + 1);
    }

    // Find most frequent
    let maxState = "neutral";
    let maxCount = 0;
    for (const [state, count] of counts) {
      if (count > maxCount) {
        maxState = state;
        maxCount = count;
      }
    }

    const label = EMOTION_LABELS[maxState] ?? maxState;
    return `Esta semana você se sentiu mais ${label}`;
  } catch {
    return null;
  }
}

export function logEmotion(state: string): void {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const history: EmotionLog[] = raw ? (JSON.parse(raw) as EmotionLog[]) : [];
    const today = new Date().toISOString().slice(0, 10);

    // Only one log per day
    if (history[0]?.date === today) {
      history[0].state = state;
    } else {
      history.unshift({ date: today, state });
    }

    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 30)));
  } catch { /* silent */ }
}

export default function WeeklySummary() {
  const [summary, setSummary] = useState<string | null>(null);

  useEffect(() => {
    setSummary(getWeekSummary());
  }, []);

  if (!summary) return null;

  return (
    <div className="w-full max-w-md rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="shrink-0 text-lg" aria-hidden="true">📊</span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-violet-500">Sua semana</p>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">{summary}</p>
        </div>
      </div>
    </div>
  );
}
