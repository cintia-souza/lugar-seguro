"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import type { BrainResponse } from "@/lib/brainEngine";

interface DiaryEntry {
  id: string;
  timestamp: number;
  text: string;
  emotionalState: string;
  analysis: BrainResponse;
}

interface DiarySummaryProps {
  entries: DiaryEntry[];
}

const EMOTION_COLORS: Record<string, string> = {
  calm: "bg-emerald-300",
  anxious: "bg-amber-300",
  sad: "bg-sky-300",
  overwhelmed: "bg-violet-300",
  angry: "bg-rose-300",
  numb: "bg-stone-300",
  neutral: "bg-slate-200",
};

const EMOTION_EMOJIS: Record<string, string> = {
  calm: "😌",
  anxious: "😰",
  sad: "😢",
  overwhelmed: "🤯",
  angry: "😤",
  numb: "😶",
  neutral: "🙂",
};

const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];

function getMonthDays(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function EmotionalCalendar({ entries }: { entries: DiaryEntry[] }) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const totalDays = getMonthDays(year, month);
  const firstDay = getFirstDayOfWeek(year, month);

  const dayEmotions = useMemo(() => {
    const map = new Map<number, string>();
    for (const entry of entries) {
      const date = new Date(entry.timestamp);
      if (date.getFullYear() === year && date.getMonth() === month) {
        if (!map.has(date.getDate())) {
          map.set(date.getDate(), entry.emotionalState);
        }
      }
    }
    return map;
  }, [entries, year, month]);

  const monthName = now.toLocaleDateString("pt-BR", { month: "long" });

  return (
    <div className="rounded-xl border border-amber-100 bg-white p-4 shadow-sm">
      <h4 className="mb-3 text-center text-sm font-semibold capitalize text-amber-700">
        📅 {monthName} {year}
      </h4>

      <div className="mb-1 grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((day, i) => (
          <span key={i} className="text-[10px] font-bold text-slate-300">{day}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}

        {Array.from({ length: totalDays }).map((_, i) => {
          const day = i + 1;
          const emotion = dayEmotions.get(day);
          const isToday = day === now.getDate();
          const dotColor = emotion ? (EMOTION_COLORS[emotion] ?? "bg-slate-200") : "";

          return (
            <motion.div
              key={day}
              className={`relative flex aspect-square items-center justify-center rounded-lg text-[10px] ${
                isToday
                  ? "bg-amber-100 font-bold text-amber-700"
                  : "text-slate-400 hover:bg-amber-50"
              }`}
              whileHover={{ scale: 1.15 }}
              title={emotion ? `${day}: ${EMOTION_EMOJIS[emotion] ?? ""} ${emotion}` : `${day}`}
            >
              {day}
              {emotion && (
                <span className={`absolute bottom-0.5 h-2 w-2 rounded-full ${dotColor}`} />
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap justify-center gap-x-3 gap-y-1">
        {Object.entries(EMOTION_COLORS).slice(0, 6).map(([emotion, color]) => (
          <div key={emotion} className="flex items-center gap-1">
            <span className={`h-2 w-2 rounded-full ${color}`} />
            <span className="text-[9px] text-slate-400">{EMOTION_EMOJIS[emotion] ?? ""}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DiarySummary({ entries }: DiarySummaryProps) {
  return (
    <div className="flex flex-col gap-4">
      <EmotionalCalendar entries={entries} />

      <div className="relative rounded-xl border border-amber-100 bg-white p-4 shadow-sm">
        {/* Binder tabs */}
        <div className="absolute -left-2 top-4 h-5 w-3 rounded-l-md bg-amber-300" />
        <div className="absolute -left-2 top-12 h-5 w-3 rounded-l-md bg-rose-300" />
        <div className="absolute -left-2 top-20 h-5 w-3 rounded-l-md bg-sky-300" />

        <h4 className="mb-3 text-sm font-semibold text-amber-700">📖 Sumário</h4>

        {entries.length === 0 ? (
          <p className="py-4 text-center text-xs italic text-slate-300">
            Nenhuma entrada ainda. Comece a escrever! ✨
          </p>
        ) : (
          <ul className="max-h-56 space-y-1 overflow-y-auto pr-1">
            {entries.slice(0, 20).map((entry, i) => {
              const date = new Date(entry.timestamp);
              const emoji = EMOTION_EMOJIS[entry.emotionalState] ?? "🙂";
              const preview = entry.text.length > 28 ? entry.text.slice(0, 28) + "…" : entry.text;

              return (
                <motion.li
                  key={entry.id}
                  initial={{ opacity: 0, x: -3 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors hover:bg-amber-50"
                >
                  <span className="shrink-0 font-mono text-[10px] text-slate-300">
                    {date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                  </span>
                  <span className="truncate text-slate-500">📝 {preview}</span>
                  <span className="ml-auto shrink-0">{emoji}</span>
                </motion.li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
