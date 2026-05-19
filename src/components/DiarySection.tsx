"use client";

import { useState, useEffect, useCallback } from "react";
import { analyzeSentiment, type BrainResponse } from "@/lib/brainEngine";
import { useAppContext } from "@/context/AppContext";

const STORAGE_KEY = "meu-lugarzinho-diary";

interface DiaryEntry {
  id: string;
  timestamp: number;
  text: string;
  emotionalState: string;
  analysis: BrainResponse;
}

function loadEntries(): DiaryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as DiaryEntry[]) : [];
  } catch {
    return [];
  }
}

function saveEntries(entries: DiaryEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, 50)));
}

function computeTrend(entries: DiaryEntry[]): string | null {
  if (entries.length < 3) return null;

  const recent = entries.slice(0, 7);
  const older = entries.slice(7, 14);

  if (older.length === 0) return null;

  const avgRecent = recent.reduce((sum, e) => sum + e.analysis.sentiment.intensity, 0) / recent.length;
  const avgOlder = older.reduce((sum, e) => sum + e.analysis.sentiment.intensity, 0) / older.length;

  const diff = Math.round((avgOlder - avgRecent) * 100);

  if (diff > 5) return `Você está ${diff}% mais calma(o) nos últimos registros comparado aos anteriores. Continue assim 💛`;
  if (diff < -5) return `Seus últimos registros mostram mais intensidade emocional. Lembre-se: pedir ajuda é força, não fraqueza.`;
  return "Sua intensidade emocional está estável. Consistência no registro é um ato de autocuidado.";
}

export default function DiarySection() {
  const { emotionalState } = useAppContext();
  const [text, setText] = useState("");
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setEntries(loadEntries());
  }, []);

  const handleSave = useCallback(() => {
    if (!text.trim()) return;

    const analysis = analyzeSentiment(text);
    const entry: DiaryEntry = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      text,
      emotionalState,
      analysis,
    };

    const updated = [entry, ...entries];
    setEntries(updated);
    saveEntries(updated);
    setText("");
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [text, entries, emotionalState]);

  const trend = computeTrend(entries);

  return (
    <section aria-label="Diário emocional" className="mx-auto max-w-2xl px-4 py-8">
      <header className="mb-6">
        <h2 className="text-2xl font-semibold text-stone-800 dark:text-stone-100">
          Seu Diário
        </h2>
        <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
          Escreva livremente. Ninguém vai ler além de você. No modo demo, tudo fica salvo apenas no seu navegador.
        </p>
      </header>

      {trend && (
        <div
          aria-live="polite"
          className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200"
        >
          <span className="font-medium">📊 Tendência:</span> {trend}
        </div>
      )}

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && e.ctrlKey) handleSave();
        }}
        placeholder="Como foi seu dia? O que está passando pela sua cabeça?…"
        aria-label="Escreva no seu diário"
        rows={8}
        className="w-full resize-y rounded-xl border-2 border-stone-200 bg-white p-4 text-base text-stone-800 placeholder:text-stone-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:placeholder:text-stone-500 dark:focus:border-indigo-500 dark:focus:ring-indigo-900"
      />

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={!text.trim()}
          className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-indigo-500 dark:hover:bg-indigo-600"
        >
          Salvar entrada
        </button>
        {saved && (
          <span className="text-sm text-teal-600 dark:text-teal-400">✓ Salvo com sucesso</span>
        )}
        <p className="ml-auto text-xs text-stone-500">
          <kbd className="rounded bg-stone-200 px-1 dark:bg-stone-700">Ctrl</kbd>+<kbd className="rounded bg-stone-200 px-1 dark:bg-stone-700">Enter</kbd>
        </p>
      </div>

      {entries.length > 0 && (
        <div className="mt-10">
          <h3 className="mb-4 text-sm font-medium uppercase tracking-wide text-stone-500 dark:text-stone-400">
            Entradas recentes ({entries.length})
          </h3>
          <ul className="space-y-3">
            {entries.slice(0, 10).map((entry) => (
              <li
                key={entry.id}
                className="rounded-lg border border-stone-200 bg-stone-50 p-4 dark:border-stone-700 dark:bg-stone-800/50"
              >
                <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
                  <time dateTime={new Date(entry.timestamp).toISOString()}>
                    {new Date(entry.timestamp).toLocaleDateString("pt-BR", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                  <span className="rounded bg-stone-200 px-2 py-0.5 dark:bg-stone-700">
                    intensidade: {Math.round(entry.analysis.sentiment.intensity * 100)}%
                  </span>
                </div>
                <p className="mt-2 line-clamp-3 text-sm text-stone-700 dark:text-stone-200">
                  {entry.text}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
