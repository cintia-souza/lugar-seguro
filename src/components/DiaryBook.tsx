"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { analyzeSentiment, type BrainResponse } from "@/lib/brainEngine";
import { useAppContext, type EmotionalState } from "@/context/AppContext";
import { playLockClick, playSuccessChime } from "@/lib/sounds";
import DiarySummary from "@/components/DiarySummary";

// --- Types ---
type DiaryPhase = "closed" | "step-emotion" | "step-symptoms" | "writing";

interface DiaryEntry {
  id: string;
  timestamp: number;
  text: string;
  emotionalState: string;
  symptoms: string[];
  analysis: BrainResponse;
}

interface CoverOption {
  id: string;
  src: string;
  label: string;
  description: string;
  /** Internal page theme when this cover is selected */
  pageTheme: {
    bg: string;
    lines: string;
    accent: string;
  };
}

const COVERS: CoverOption[] = [
  {
    id: "nuvem",
    src: "/books/diario1.png",
    label: "Nuvem Acolhedora",
    description: "Acolhimento e segurança",
    pageTheme: { bg: "bg-rose-50/30", lines: "#fecdd320", accent: "border-rose-100" },
  },
  {
    id: "noite",
    src: "/books/diario2.png",
    label: "Noite Estrelada",
    description: "Introspecção e calma profunda",
    pageTheme: { bg: "bg-indigo-50/30", lines: "#c7d2fe20", accent: "border-indigo-100" },
  },
  {
    id: "jardim",
    src: "/books/diario3.png",
    label: "Jardim Terapêutico",
    description: "Crescimento e renovação",
    pageTheme: { bg: "bg-emerald-50/30", lines: "#a7f3d020", accent: "border-emerald-100" },
  },
  {
    id: "tecido",
    src: "/books/diario4.png",
    label: "Tecido Minimalista",
    description: "Zero estímulos — calma pura",
    pageTheme: { bg: "bg-stone-50/30", lines: "#e7e5e420", accent: "border-stone-100" },
  },
];

const EMOTIONS: { state: EmotionalState; emoji: string; label: string }[] = [
  { state: "calm", emoji: "😌", label: "Calmo" },
  { state: "anxious", emoji: "😰", label: "Ansioso" },
  { state: "sad", emoji: "😢", label: "Triste" },
  { state: "overwhelmed", emoji: "🤯", label: "Sobrec." },
  { state: "angry", emoji: "😤", label: "Irritado" },
  { state: "numb", emoji: "😶", label: "Vazio" },
];

const SYMPTOMS: string[] = [
  "Enxaqueca", "Cólica", "Pensamento acelerado", "Cansaço",
  "Insônia", "Nó na garganta", "Aperto no peito", "Choro",
  "Irritabilidade", "Falta de foco", "Náusea", "Nenhum",
];

const STORAGE_KEY = "meu-lugarzinho-diary";
const COVER_KEY = "meu-lugarzinho-diary-cover";
const MOOD_CALENDAR_KEY = "meu-lugarzinho-mood-calendar";

function loadEntries(): DiaryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as DiaryEntry[]) : [];
  } catch { return []; }
}

function saveEntries(entries: DiaryEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, 50)));
}

function saveMoodToCalendar(emotion: string, symptoms: string[]): void {
  try {
    const raw = localStorage.getItem(MOOD_CALENDAR_KEY);
    const calendar = raw ? JSON.parse(raw) as Record<string, { emotion: string; symptoms: string[] }> : {};
    calendar[new Date().toISOString().slice(0, 10)] = { emotion, symptoms };
    localStorage.setItem(MOOD_CALENDAR_KEY, JSON.stringify(calendar));
  } catch { /* silent */ }
}

function formatDate(): string {
  return new Date().toLocaleDateString("pt-BR", {
    weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
  });
}

// --- Padlock ---
function Padlock({ locked }: { locked: boolean }) {
  return (
    <motion.div
      animate={locked ? {} : { rotate: [0, -12, 12, -6, 0], scale: [1, 1.15, 0.95, 1] }}
      transition={{ duration: 0.4 }}
      className="rounded-full bg-white/80 p-3 shadow-lg backdrop-blur-sm"
    >
      <svg className="h-8 w-8 drop-shadow" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3" y="11" width="18" height="11" rx="2" fill="#F59E0B" opacity={0.9} />
        <rect x="3" y="11" width="18" height="11" rx="2" stroke="#D97706" strokeWidth={1} />
        {locked ? (
          <path d="M7 11V7a5 5 0 0110 0v4" stroke="#D97706" strokeWidth={1.5} fill="none" />
        ) : (
          <path d="M7 11V7a5 5 0 019.9-.8" stroke="#D97706" strokeWidth={1.5} fill="none" />
        )}
        <circle cx="12" cy="16" r="1.5" fill="#92400E" />
        <rect x="11.5" y="16.5" width="1" height="2.5" rx="0.5" fill="#92400E" />
      </svg>
    </motion.div>
  );
}

// --- Main ---
export default function DiaryBook() {
  const { setEmotionalState } = useAppContext();
  const [phase, setPhase] = useState<DiaryPhase>("closed");
  const [coverId, setCoverId] = useState("nuvem");
  const [showCoverPicker, setShowCoverPicker] = useState(false);
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionalState>("neutral");
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setEntries(loadEntries());
    const stored = localStorage.getItem(COVER_KEY);
    if (stored) setCoverId(stored);
  }, []);

  const currentCover = COVERS.find((c) => c.id === coverId) ?? COVERS[0] as CoverOption;
  const selectedEmoji = EMOTIONS.find((e) => e.state === selectedEmotion)?.emoji ?? "📝";

  const handleOpen = () => {
    playLockClick();
    setTimeout(() => setPhase("step-emotion"), 300);
  };

  const handleSelectEmotion = (state: EmotionalState) => {
    setSelectedEmotion(state);
    setEmotionalState(state);
    saveMoodToCalendar(state, []);
    setTimeout(() => setPhase("step-symptoms"), 400);
  };

  const handleSymptomsNext = () => {
    saveMoodToCalendar(selectedEmotion, selectedSymptoms);
    setPhase("writing");
  };

  const toggleSymptom = (s: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const handleSave = useCallback(() => {
    if (!text.trim()) return;
    const analysis = analyzeSentiment(text);
    const entry: DiaryEntry = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      text,
      emotionalState: selectedEmotion,
      symptoms: selectedSymptoms,
      analysis,
    };
    const updated = [entry, ...entries];
    setEntries(updated);
    saveEntries(updated);
    saveMoodToCalendar(selectedEmotion, selectedSymptoms);
    setText("");
    setSaved(true);
    playSuccessChime();
    setTimeout(() => setSaved(false), 2500);
  }, [text, entries, selectedEmotion, selectedSymptoms]);

  const handleClose = () => {
    if (text.trim()) handleSave();
    playLockClick();
    setPhase("closed");
    setSelectedSymptoms([]);
  };

  const selectCover = (id: string) => {
    setCoverId(id);
    localStorage.setItem(COVER_KEY, id);
    setShowCoverPicker(false);
  };

  return (
    <section aria-label="Diário Encantado" className="mx-auto w-full max-w-[600px]">
      <AnimatePresence mode="wait">
        {/* ===== CLOSED ===== */}
        {phase === "closed" && (
          <motion.div
            key="closed"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, rotateY: -60, originX: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center"
            style={{ perspective: "1200px" }}
          >
            {/* Cover image — clean, no overlays */}
            <div className="relative w-full max-w-[240px] overflow-hidden rounded-2xl shadow-xl">
              <div className="relative aspect-[3/4] w-full">
                <Image src={currentCover.src} alt={currentCover.label} fill className="object-cover" priority />

                {/* Clickable padlock area — positioned over the lock in the artwork */}
                {/* Centered horizontally, ~45% from top (where the lock typically sits) */}
                <button
                  type="button"
                  onClick={handleOpen}
                  onKeyDown={(e) => { if (e.key === "Enter") handleOpen(); }}
                  aria-label="Destrancar diário"
                  className="absolute left-1/2 top-[42%] h-[18%] w-[30%] -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full transition-all duration-300 hover:scale-110 hover:drop-shadow-[0_0_12px_rgba(244,114,182,0.5)] focus-visible:scale-110 focus-visible:drop-shadow-[0_0_12px_rgba(244,114,182,0.5)]"
                />
              </div>
            </div>

            {/* Title below image */}
            <h2 className="mt-4 text-sm font-semibold text-slate-700">Meu Diário</h2>

            {/* Cover picker link */}
            <button
              type="button"
              onClick={() => setShowCoverPicker(!showCoverPicker)}
              className="mt-1.5 text-[11px] text-slate-400 transition-colors hover:text-slate-600"
            >
              Trocar capa
            </button>

            <AnimatePresence>
              {showCoverPicker && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mt-3 w-full max-w-[360px] rounded-2xl border border-slate-100 bg-white p-4 shadow-lg"
                >
                  <div className="grid grid-cols-2 gap-3">
                    {COVERS.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => selectCover(c.id)}
                        className={`overflow-hidden rounded-xl border-2 text-left transition-all ${
                          coverId === c.id ? "border-blue-400 shadow-sm" : "border-transparent opacity-70 hover:opacity-100"
                        }`}
                      >
                        <div className="relative aspect-[4/3] w-full">
                          <Image src={c.src} alt={c.label} fill className="object-cover" />
                        </div>
                        <div className="p-2">
                          <p className="text-[11px] font-medium text-slate-700">{c.label}</p>
                          <p className="text-[9px] text-slate-400">{c.description}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ===== STEP 1: EMOTION ===== */}
        {phase === "step-emotion" && (
          <motion.div
            key="step-emotion"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center text-center"
          >
            <Padlock locked={false} />
            <h2 className="mt-4 text-lg font-semibold text-slate-700">Como você está se sentindo?</h2>
            <p className="mt-1 text-xs text-slate-400">Escolha o que mais se aproxima</p>

            <div className="mt-6 grid w-full max-w-[300px] grid-cols-3 gap-2">
              {EMOTIONS.map((e) => (
                <button
                  key={e.state}
                  type="button"
                  onClick={() => handleSelectEmotion(e.state)}
                  className="flex flex-col items-center gap-1 rounded-xl border border-slate-100 bg-white py-3 transition-all hover:border-blue-200 hover:shadow-sm active:scale-95"
                >
                  <span className="text-2xl">{e.emoji}</span>
                  <span className="text-[10px] font-medium text-slate-500">{e.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ===== STEP 2: SYMPTOMS ===== */}
        {phase === "step-symptoms" && (
          <motion.div
            key="step-symptoms"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center text-center"
          >
            <span className="text-3xl">{selectedEmoji}</span>
            <h2 className="mt-3 text-lg font-semibold text-slate-700">Algum sintoma?</h2>
            <p className="mt-1 text-xs text-slate-400">Selecione quantos quiser</p>

            <div className="mt-5 flex max-w-[360px] flex-wrap justify-center gap-2">
              {SYMPTOMS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSymptom(s)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                    selectedSymptoms.includes(s)
                      ? "border-blue-300 bg-blue-50 text-blue-700"
                      : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleSymptomsNext}
              className="mt-6 w-full max-w-[260px] rounded-xl bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              Continuar
            </button>
          </motion.div>
        )}

        {/* ===== WRITING ===== */}
        {phase === "writing" && (
          <motion.div
            key="writing"
            initial={{ opacity: 0, rotateY: 20 }}
            animate={{ opacity: 1, rotateY: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5 }}
            className="w-full"
          >
            {/* Top bar */}
            <div className="mb-4 flex items-center justify-between">
              <button
                type="button"
                onClick={handleClose}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Fechar e guardar
              </button>
              {saved && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs font-medium text-emerald-600">
                  ✓ Salvo
                </motion.span>
              )}
            </div>

            <div className="grid gap-4 lg:grid-cols-5">
              {/* Notebook — themed by cover */}
              <div className="relative lg:col-span-3">
                <div
                  className={`overflow-hidden rounded-2xl border ${currentCover.pageTheme.accent} ${currentCover.pageTheme.bg} p-5 shadow-sm`}
                  style={{
                    backgroundImage: `repeating-linear-gradient(to bottom, transparent, transparent calc(1.85rem - 1px), ${currentCover.pageTheme.lines} calc(1.85rem - 1px), ${currentCover.pageTheme.lines} 1.85rem)`,
                  }}
                >
                  {/* Date + emotion */}
                  <div className="mb-3 flex items-center justify-between border-b border-slate-100/50 pb-2.5">
                    <span className="text-[10px] capitalize text-slate-400">{formatDate()}</span>
                    <span className="text-lg">{selectedEmoji}</span>
                  </div>

                  {/* Symptoms */}
                  {selectedSymptoms.length > 0 && selectedSymptoms[0] !== "Nenhum" && (
                    <div className="mb-3 flex flex-wrap gap-1">
                      {selectedSymptoms.map((s) => (
                        <span key={s} className="rounded-full bg-white/60 px-2 py-0.5 text-[9px] text-slate-400">{s}</span>
                      ))}
                    </div>
                  )}

                  {/* Textarea — handwriting font */}
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && e.ctrlKey) handleSave(); }}
                    placeholder="O espaço é seu. Pode escrever tudo o que quiser…"
                    aria-label="Escreva no diário"
                    rows={10}
                    className="w-full resize-none bg-transparent font-[family-name:var(--font-caveat)] text-xl leading-[1.85rem] text-slate-700 placeholder:font-sans placeholder:text-sm placeholder:text-slate-300 focus:outline-none"
                  />

                  {/* Save */}
                  <div className="mt-3 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={!text.trim()}
                      className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-40"
                    >
                      Guardar
                    </button>
                    <span className="text-[10px] text-slate-300">
                      <kbd className="rounded bg-white/60 px-1">Ctrl</kbd>+<kbd className="rounded bg-white/60 px-1">Enter</kbd>
                    </span>
                  </div>
                </div>

                {/* Lumi watching */}
                <div className="absolute -bottom-2 -right-2 h-11 w-11 overflow-hidden rounded-full border-2 border-white bg-white shadow-md">
                  <Image
                    src="/lumi/Lumi Confusa - Pensativa.png"
                    alt="Lumi ouvindo"
                    fill
                    className="object-cover"
                    sizes="44px"
                  />
                </div>
              </div>

              {/* Summary */}
              <div className="lg:col-span-2">
                <DiarySummary entries={entries} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
