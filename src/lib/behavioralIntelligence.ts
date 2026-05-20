// Inteligência Comportamental da Lumi
// Detecta padrões de digitação, horário, histórico e mudanças de baseline

import type { LumiExpression } from "@/config/lumiExpressions";

// ===== TYPES =====

export interface BehavioralSignal {
  type: "keystroke" | "time" | "memory" | "baseline-shift";
  lumiExpression: LumiExpression;
  lumiResponse: string;
  priority: number; // 0-1, higher = more important
}

interface KeystrokeMetrics {
  avgInterval: number; // ms between keystrokes
  backspaceRatio: number; // backspaces / total keys
  burstSpeed: boolean; // very fast typing
  longPauses: boolean; // pauses > 3s between keys
}

// ===== STORAGE KEYS =====
const KEYSTROKE_KEY = "meu-lugarzinho-keystroke-history";
const BASELINE_KEY = "meu-lugarzinho-text-baseline";

// ===== 1. KEYSTROKE DYNAMICS =====

export class KeystrokeTracker {
  private timestamps: number[] = [];
  private backspaceCount = 0;
  private totalKeys = 0;

  recordKey(isBackspace: boolean): void {
    this.timestamps.push(Date.now());
    this.totalKeys++;
    if (isBackspace) this.backspaceCount++;

    // Keep only last 50 keystrokes
    if (this.timestamps.length > 50) {
      this.timestamps = this.timestamps.slice(-50);
    }
  }

  getMetrics(): KeystrokeMetrics {
    if (this.timestamps.length < 5) {
      return { avgInterval: 200, backspaceRatio: 0, burstSpeed: false, longPauses: false };
    }

    // Calculate intervals
    const intervals: number[] = [];
    for (let i = 1; i < this.timestamps.length; i++) {
      intervals.push((this.timestamps[i] as number) - (this.timestamps[i - 1] as number));
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const backspaceRatio = this.totalKeys > 0 ? this.backspaceCount / this.totalKeys : 0;
    const burstSpeed = avgInterval < 80; // < 80ms = frantic typing
    const longPauses = intervals.some((i) => i > 3000); // > 3s pause

    return { avgInterval, backspaceRatio, burstSpeed, longPauses };
  }

  reset(): void {
    this.timestamps = [];
    this.backspaceCount = 0;
    this.totalKeys = 0;
  }
}

export function analyzeKeystroke(metrics: KeystrokeMetrics): BehavioralSignal | null {
  // Hesitant typing — lots of backspace + long pauses
  if (metrics.backspaceRatio > 0.3 && metrics.longPauses) {
    return {
      type: "keystroke",
      lumiExpression: "confusa",
      lumiResponse: "Não precisa pressa pra encontrar as palavras certas. Estou aqui esperando você no seu tempo.",
      priority: 0.6,
    };
  }

  // Frantic typing — anxiety burst
  if (metrics.burstSpeed && metrics.avgInterval < 60) {
    return {
      type: "keystroke",
      lumiExpression: "confusa",
      lumiResponse: "Respira... Seus pensamentos estão acelerados, mas você está seguro(a). Pode ir devagar.",
      priority: 0.7,
    };
  }

  // Lots of backspace without pauses — frustration
  if (metrics.backspaceRatio > 0.4) {
    return {
      type: "keystroke",
      lumiExpression: "cansada",
      lumiResponse: "Parece difícil colocar em palavras, né? Tudo bem. Pode escrever do jeito que sair, sem se preocupar com perfeição.",
      priority: 0.5,
    };
  }

  return null;
}

// ===== 2. TIME-OF-DAY AWARENESS =====

export function analyzeTimeOfDay(): BehavioralSignal | null {
  const hour = new Date().getHours();

  // Madrugada — 01:00 a 05:00
  if (hour >= 1 && hour < 5) {
    return {
      type: "time",
      lumiExpression: "cansada",
      lumiResponse: "A mente não quer dormir hoje, né? Vamos colocar esses pensamentos pra fora pro seu coração descansar um pouquinho?",
      priority: 0.8,
    };
  }

  // Muito tarde — 23:00 a 01:00
  if (hour >= 23 || hour < 1) {
    return {
      type: "time",
      lumiExpression: "amorosa",
      lumiResponse: "Noite profunda... Está tudo bem? Se a mente está agitada, estou aqui pra ouvir antes de dormir.",
      priority: 0.5,
    };
  }

  // Muito cedo — 05:00 a 06:00
  if (hour >= 5 && hour < 6) {
    return {
      type: "time",
      lumiExpression: "aliviada",
      lumiResponse: "Acordou cedo... Pesadelo ou a mente não parou? Estou aqui. Vamos começar o dia com calma.",
      priority: 0.6,
    };
  }

  return null;
}

// ===== 3. HISTORICAL MEMORY =====

interface HistoryEntry {
  date: string;
  emotion: string;
  keywords: string[];
}

function getRecentHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("meu-lugarzinho-mood-calendar");
    if (!raw) return [];
    const calendar = JSON.parse(raw) as Record<string, { emotion: string; symptoms?: string[] }>;

    const entries: HistoryEntry[] = [];
    const today = new Date();

    for (let i = 1; i <= 3; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const key = date.toISOString().slice(0, 10);
      const entry = calendar[key];
      if (entry) {
        entries.push({
          date: key,
          emotion: entry.emotion,
          keywords: entry.symptoms ?? [],
        });
      }
    }

    return entries;
  } catch {
    return [];
  }
}

export function analyzeHistory(): BehavioralSignal | null {
  const history = getRecentHistory();
  if (history.length === 0) return null;

  const yesterday = history[0];
  if (!yesterday) return null;

  // If yesterday was very negative
  if (yesterday.emotion === "anxious" || yesterday.emotion === "overwhelmed") {
    return {
      type: "memory",
      lumiExpression: "amorosa",
      lumiResponse: "Ei... Ontem foi um dia tenso, né? Como você está se sentindo hoje depois que o turbilhão passou?",
      priority: 0.7,
    };
  }

  if (yesterday.emotion === "sad" || yesterday.emotion === "numb") {
    return {
      type: "memory",
      lumiExpression: "amorosa",
      lumiResponse: "Lembrei que ontem estava pesado pra você. Hoje está um pouquinho mais leve? Estou aqui de qualquer forma.",
      priority: 0.7,
    };
  }

  // If multiple bad days in a row
  const badDays = history.filter((h) => ["sad", "anxious", "overwhelmed", "angry"].includes(h.emotion));
  if (badDays.length >= 3) {
    return {
      type: "memory",
      lumiExpression: "cansada",
      lumiResponse: "Percebi que os últimos dias têm sido difíceis. Você não precisa resolver tudo sozinho(a). Que tal conversar com alguém de confiança?",
      priority: 0.9,
    };
  }

  return null;
}

// ===== 4. BASELINE SHIFT DETECTION =====

interface TextBaseline {
  avgLength: number;
  avgExclamations: number;
  avgEmojis: number;
  avgEnergy: number; // 0-1
  sampleCount: number;
}

function getBaseline(): TextBaseline {
  if (typeof window === "undefined") return { avgLength: 50, avgExclamations: 1, avgEmojis: 0.5, avgEnergy: 0.5, sampleCount: 0 };
  try {
    const raw = localStorage.getItem(BASELINE_KEY);
    return raw ? JSON.parse(raw) as TextBaseline : { avgLength: 50, avgExclamations: 1, avgEmojis: 0.5, avgEnergy: 0.5, sampleCount: 0 };
  } catch {
    return { avgLength: 50, avgExclamations: 1, avgEmojis: 0.5, avgEnergy: 0.5, sampleCount: 0 };
  }
}

function saveBaseline(baseline: TextBaseline): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(BASELINE_KEY, JSON.stringify(baseline));
}

function calculateEnergy(text: string): number {
  const exclamations = (text.match(/!/g) ?? []).length;
  const emojis = (text.match(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu) ?? []).length;
  const elongations = (text.match(/(.)\1{3,}/g) ?? []).length;
  const caps = (text.match(/[A-Z]{3,}/g) ?? []).length;

  const energy = Math.min(1, (exclamations * 0.15 + emojis * 0.2 + elongations * 0.25 + caps * 0.2));
  return energy;
}

export function updateBaseline(text: string): void {
  const baseline = getBaseline();
  const energy = calculateEnergy(text);
  const exclamations = (text.match(/!/g) ?? []).length;
  const emojis = (text.match(/[\u{1F600}-\u{1F64F}]/gu) ?? []).length;

  // Rolling average (last 20 samples)
  const weight = Math.min(baseline.sampleCount, 20);
  baseline.avgLength = (baseline.avgLength * weight + text.length) / (weight + 1);
  baseline.avgExclamations = (baseline.avgExclamations * weight + exclamations) / (weight + 1);
  baseline.avgEmojis = (baseline.avgEmojis * weight + emojis) / (weight + 1);
  baseline.avgEnergy = (baseline.avgEnergy * weight + energy) / (weight + 1);
  baseline.sampleCount++;

  saveBaseline(baseline);
}

export function detectBaselineShift(text: string): BehavioralSignal | null {
  const baseline = getBaseline();

  // Need at least 5 samples to detect shift
  if (baseline.sampleCount < 5) return null;

  const currentEnergy = calculateEnergy(text);
  const energyDrop = baseline.avgEnergy - currentEnergy;

  // Significant energy drop (user usually energetic, now flat)
  if (energyDrop > 0.3 && text.length < baseline.avgLength * 0.5) {
    return {
      type: "baseline-shift",
      lumiExpression: "amorosa",
      lumiResponse: "Essa resposta pareceu um pouquinho mais cinza do que o seu colorido de sempre... Se quiser ficar em silêncio aqui comigo, tudo bem. Mas se quiser falar, estou toda ouvidos.",
      priority: 0.8,
    };
  }

  // Very short + period at end (defensive)
  if (text.length < 20 && text.endsWith(".") && baseline.avgLength > 40) {
    return {
      type: "baseline-shift",
      lumiExpression: "amorosa",
      lumiResponse: "Hmm... Senti que tem algo por trás dessas poucas palavras. Não precisa abrir se não quiser, mas saiba que estou aqui.",
      priority: 0.6,
    };
  }

  return null;
}

// ===== COMBINED ANALYSIS =====

export function analyzeBehavior(text: string, keystrokeMetrics: KeystrokeMetrics | null): BehavioralSignal | null {
  const signals: BehavioralSignal[] = [];

  // Time of day
  const timeSignal = analyzeTimeOfDay();
  if (timeSignal) signals.push(timeSignal);

  // History
  const historySignal = analyzeHistory();
  if (historySignal) signals.push(historySignal);

  // Baseline shift
  const shiftSignal = detectBaselineShift(text);
  if (shiftSignal) signals.push(shiftSignal);

  // Keystroke
  if (keystrokeMetrics) {
    const keystrokeSignal = analyzeKeystroke(keystrokeMetrics);
    if (keystrokeSignal) signals.push(keystrokeSignal);
  }

  // Update baseline with this text
  updateBaseline(text);

  // Return highest priority signal
  if (signals.length === 0) return null;
  signals.sort((a, b) => b.priority - a.priority);
  return signals[0] as BehavioralSignal;
}
