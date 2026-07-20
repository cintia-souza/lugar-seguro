/**
 * neuralClassifier.ts
 * Classificador neural client-side que carrega os pesos pré-treinados.
 *
 * FLUXO HÍBRIDO:
 *   1. Rede neural classifica a intenção (probabilidade)
 *   2. Se confiança >= threshold → usa resultado da rede
 *   3. Se confiança < threshold → fallback para conversationalEngine (pattern-matching)
 *
 * Isso garante que o sistema nunca falhe: a rede melhora com o tempo,
 * mas o pattern-matching é o safety net.
 */

import type { ConversationIntent } from "@/lib/conversationalEngine";

// ─── TIPOS ────────────────────────────────────────────────────────────────────

interface NeuralWeights {
  vocabulary: string[];
  intents: string[];
  network: object;
  meta: {
    trainedAt: string;
    totalSamples: number;
    vocabularySize: number;
    validationAccuracy: string;
  };
}

interface ClassificationResult {
  intent: ConversationIntent;
  confidence: number;
  scores: Record<string, number>;
  source: "neural" | "fallback";
}

// ─── ESTADO DO MÓDULO ─────────────────────────────────────────────────────────

let weights: NeuralWeights | null = null;
let vocabulary: string[] = [];
let isLoaded = false;

// Threshold mínimo de confiança para usar o resultado da rede
// Abaixo disso, o conversationalEngine (pattern-matching) assume
const CONFIDENCE_THRESHOLD = 0.65;

// ─── CARREGAMENTO DOS PESOS ───────────────────────────────────────────────────

/**
 * Carrega os pesos do JSON pré-treinado.
 * Chamado uma vez na inicialização — lazy loading.
 * O arquivo deve estar em /public/lumi-brain-weights.json
 */
export async function loadNeuralWeights(): Promise<boolean> {
  if (isLoaded) return true;

  try {
    const res = await fetch("/lumi-brain-weights.json");
    if (!res.ok) return false;

    weights = await res.json() as NeuralWeights;
    vocabulary = weights.vocabulary;
    isLoaded = true;

    console.log(
      `[Lumi Neural] Pesos carregados — ${weights.meta.totalSamples} exemplos, ` +
      `vocab: ${weights.meta.vocabularySize}, ` +
      `acurácia: ${weights.meta.validationAccuracy}`
    );
    return true;
  } catch {
    console.warn("[Lumi Neural] Pesos não encontrados — usando apenas pattern-matching");
    return false;
  }
}

// ─── TOKENIZAÇÃO (espelho do trainLumi.ts) ────────────────────────────────────

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\wàáâãéêíóôõúç\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function textToVector(text: string): Record<string, number> {
  const tokens = new Set(normalizeText(text).split(" ").filter(w => w.length > 1));
  const vector: Record<string, number> = {};
  for (const word of vocabulary) {
    vector[word] = tokens.has(word) ? 1 : 0;
  }
  return vector;
}

// ─── CLASSIFICAÇÃO ────────────────────────────────────────────────────────────

/**
 * Classifica a intenção de um texto usando a rede neural.
 * Retorna null se os pesos não estiverem carregados.
 */
export function classifyWithNeural(text: string): ClassificationResult | null {
  if (!isLoaded || !weights) return null;

  try {
    // Importação dinâmica do brain.js — só no cliente
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const brain = require("brain.js/browser") as typeof import("brain.js");

    // Reconstituir a rede a partir dos pesos salvos
    const net = new brain.NeuralNetwork();
    net.fromJSON(weights.network as Parameters<typeof net.fromJSON>[0]);

    // Vetorizar e classificar
    const inputVector = textToVector(text);
    const output = net.run(inputVector) as Record<string, number>;

    // Encontrar intenção com maior score
    const sorted = Object.entries(output).sort(([, a], [, b]) => b - a);
    const topIntent = sorted[0];

    if (!topIntent) return null;

    const [intentStr, confidence] = topIntent;

    // Mapear para ConversationIntent válido
    const validIntents: ConversationIntent[] = [
      "desabafo", "crise", "distorcao", "chitchat", "companhia"
    ];

    const intent = validIntents.includes(intentStr as ConversationIntent)
      ? (intentStr as ConversationIntent)
      : null;

    if (!intent) return null;

    return {
      intent,
      confidence,
      scores: output,
      source: confidence >= CONFIDENCE_THRESHOLD ? "neural" : "fallback",
    };
  } catch {
    return null;
  }
}

/**
 * Retorna true se a rede neural deve ser usada para este input.
 * Critérios: pesos carregados + confiança acima do threshold.
 */
export function shouldUseNeural(text: string): boolean {
  const result = classifyWithNeural(text);
  return result !== null && result.confidence >= CONFIDENCE_THRESHOLD;
}

/**
 * Retorna a intenção classificada pela rede, ou null se não confiável.
 * Integração com useLumiChat.ts — chamado antes do conversationalEngine.
 */
export function getNeuralIntent(text: string): ConversationIntent | null {
  const result = classifyWithNeural(text);
  if (!result || result.source === "fallback") return null;
  return result.intent;
}

export { CONFIDENCE_THRESHOLD };
