"use client";

import { useState, useEffect } from "react";

const STREAK_KEY = "meu-lugarzinho-streak";
const LAST_VISIT_KEY = "meu-lugarzinho-last-visit";

function computeStreak(): number {
  const today = new Date().toISOString().slice(0, 10);
  const lastVisit = localStorage.getItem(LAST_VISIT_KEY);
  const currentStreak = parseInt(localStorage.getItem(STREAK_KEY) ?? "0", 10);

  // Already visited today
  if (lastVisit === today) return Math.max(currentStreak, 1);

  // First visit ever
  if (!lastVisit) {
    localStorage.setItem(STREAK_KEY, "1");
    localStorage.setItem(LAST_VISIT_KEY, today);
    return 1;
  }

  // Check if yesterday
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  const newStreak = lastVisit === yesterdayStr ? currentStreak + 1 : 1;

  localStorage.setItem(STREAK_KEY, String(newStreak));
  localStorage.setItem(LAST_VISIT_KEY, today);
  return newStreak;
}

export default function SelfCareStreak() {
  const [streak, setStreak] = useState<number | null>(null);

  useEffect(() => {
    setStreak(computeStreak());
  }, []);

  if (streak === null) return null;

  return (
    <div className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-1.5">
      <div className="h-2 w-2 rounded-full bg-emerald-400" />
      <span className="text-xs font-medium text-emerald-700">
        {streak} {streak === 1 ? "dia" : "dias"} {streak === 1 ? "ativo" : "consecutivos"}
      </span>
    </div>
  );
}
