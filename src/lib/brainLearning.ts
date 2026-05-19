// Sistema de Aprendizado Adaptativo — Neon + localStorage fallback

const LEARNING_KEY = "meu-lugarzinho-brain-learning";

export interface LearnedWord {
  word: string;
  associated_distortion: string;
  confidence: number;
  seen_count: number;
}

interface LocalLearning {
  learnedWords: LearnedWord[];
  wordCooccurrences: Record<string, string[]>;
  totalInteractions: number;
}

// ===== STOPWORDS =====
const STOPWORDS = new Set([
  "que", "não", "com", "para", "por", "uma", "mas", "como", "mais", "isso",
  "esse", "essa", "este", "esta", "são", "tem", "foi", "ser", "ter", "está",
  "muito", "também", "quando", "onde", "aqui", "ali", "ele", "ela", "eles",
  "elas", "nos", "nas", "dos", "das", "meu", "minha", "seu", "sua",
  "porque", "então", "ainda", "sobre", "depois", "antes", "entre", "cada",
  "mesmo", "outra", "outro", "toda", "todo", "coisa", "coisas", "gente",
  "vezes", "acho", "tipo", "meio", "bem", "dia", "hoje", "agora", "tudo",
  "nada", "algo", "alguém", "quem", "qual", "onde", "assim", "tanto",
]);

function extractWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\wàáâãéêíóôõúç\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w));
}

// ===== LOCAL STORAGE =====
function getLocal(): LocalLearning {
  if (typeof window === "undefined") return { learnedWords: [], wordCooccurrences: {}, totalInteractions: 0 };
  try {
    const raw = localStorage.getItem(LEARNING_KEY);
    return raw ? (JSON.parse(raw) as LocalLearning) : { learnedWords: [], wordCooccurrences: {}, totalInteractions: 0 };
  } catch {
    return { learnedWords: [], wordCooccurrences: {}, totalInteractions: 0 };
  }
}

function saveLocal(data: LocalLearning): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LEARNING_KEY, JSON.stringify(data));
}

// ===== CACHED SERVER DATA =====
let cachedServerWords: LearnedWord[] | null = null;

async function fetchServerWords(): Promise<LearnedWord[]> {
  if (cachedServerWords) return cachedServerWords;
  try {
    const res = await fetch("/api/brain/data");
    if (!res.ok) return [];
    const data = await res.json() as { learnedWords: LearnedWord[] };
    cachedServerWords = data.learnedWords;
    return data.learnedWords;
  } catch {
    return [];
  }
}

// Refresh cache periodically
export function invalidateCache(): void {
  cachedServerWords = null;
}

// ===== PUBLIC API =====

export function getLearnedTriggers(text: string): LearnedWord[] {
  const lower = text.toLowerCase();
  const local = getLocal();

  // Combine local + cached server words
  const allWords = [...local.learnedWords, ...(cachedServerWords ?? [])];

  // Deduplicate by word
  const seen = new Set<string>();
  const unique: LearnedWord[] = [];
  for (const lw of allWords) {
    if (!seen.has(lw.word) && lw.confidence >= 0.3 && lower.includes(lw.word)) {
      seen.add(lw.word);
      unique.push(lw);
    }
  }

  return unique;
}

export function learnFromInput(
  text: string,
  detectedTriggers: string[],
  detectedDistortion: string | null
): void {
  if (!detectedDistortion || detectedTriggers.length === 0) return;

  const words = extractWords(text);
  const unknownWords = words.filter((w) => !detectedTriggers.includes(w));

  if (unknownWords.length === 0) return;

  // Local learning
  const data = getLocal();
  data.totalInteractions++;

  for (const word of unknownWords) {
    if (!data.wordCooccurrences[word]) {
      data.wordCooccurrences[word] = [];
    }
    data.wordCooccurrences[word].push(detectedDistortion);

    const occurrences = data.wordCooccurrences[word];
    const count = occurrences.filter((d) => d === detectedDistortion).length;

    if (count >= 3) {
      const existing = data.learnedWords.find((lw) => lw.word === word);
      if (existing) {
        existing.seen_count++;
        existing.confidence = Math.min(1, existing.confidence + 0.1);
      } else {
        data.learnedWords.push({
          word,
          associated_distortion: detectedDistortion,
          confidence: 0.4,
          seen_count: count,
        });
      }
    }
  }

  // Keep top 100
  data.learnedWords.sort((a, b) => b.confidence - a.confidence);
  data.learnedWords = data.learnedWords.slice(0, 100);

  // Trim cooccurrences
  for (const key of Object.keys(data.wordCooccurrences)) {
    const arr = data.wordCooccurrences[key];
    if (arr && arr.length > 200) {
      data.wordCooccurrences[key] = arr.slice(-200);
    }
  }

  saveLocal(data);

  // Sync to server (fire and forget)
  syncToServer(unknownWords, detectedDistortion);
}

export function recordFeedback(distortion: string, helpful: boolean): void {
  // Sync to server
  fetch("/api/brain/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ distortion, helpful }),
  }).catch(() => { /* silent */ });

  // Local adjustment
  if (!helpful) {
    const data = getLocal();
    for (const lw of data.learnedWords) {
      if (lw.associated_distortion === distortion) {
        lw.confidence = Math.max(0, lw.confidence - 0.15);
      }
    }
    saveLocal(data);
  }

  invalidateCache();
}

// Load server data on init
export function initLearning(): void {
  fetchServerWords().catch(() => { /* silent */ });
}

// ===== PRIVATE =====
function syncToServer(unknownWords: string[], distortion: string): void {
  fetch("/api/brain/learn", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ unknownWords: unknownWords.slice(0, 20), distortion }),
  }).catch(() => { /* silent — works offline too */ });
}
