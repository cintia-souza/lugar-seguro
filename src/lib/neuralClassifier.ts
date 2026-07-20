/**
 * neuralClassifier.ts
 * Classificador neural client-side otimizado para a Lumi.
 *
 * FLUXO HÍBRIDO:
 *   1. Rede neural classifica a intenção via vetores numéricos estáveis.
 *   2. Se confiança >= threshold → usa resultado da rede.
 *   3. Se confiança < threshold → fallback para conversationalEngine (pattern-matching).
 */

import type { INeuralNetworkJSON, NeuralNetwork } from "brain.js/dist/neural-network";
import type { ConversationIntent } from "@/lib/conversationalEngine";

// ─── TIPOS ────────────────────────────────────────────────────────────────────

interface NeuralWeights {
  vocabulary: string[];
  intents: string[];
  network: INeuralNetworkJSON;
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

// ─── ESTADO E INSTÂNCIA DO MÓDULO ─────────────────────────────────────────────

let weights: NeuralWeights | null = null;
let vocabulary: string[] = [];
let intentLabels: string[] = [];
type BrainNet = NeuralNetwork<number[], number[]>;

let neuralNetInstance: BrainNet | null = null;
let isLoaded = false;

// Threshold mínimo de confiança para usar o resultado da rede
const CONFIDENCE_THRESHOLD = 0.65;

// ─── CARREGAMENTO DOS PESOS (LAZY LOADING) ───────────────────────────────────

/**
 * Carrega os pesos do JSON e instancia a rede neural de forma persistente.
 * Chamado uma vez na inicialização da aplicação.
 */
export async function loadNeuralWeights(): Promise<boolean> {
  if (isLoaded) return true;

  try {
    const res = await fetch("/lumi-brain-weights.json");
    if (!res.ok) return false;

    weights = (await res.json()) as NeuralWeights;
    vocabulary = weights.vocabulary;
    intentLabels = weights.intents;

    // Import dinâmico — garante que brain.js só carrega no cliente, nunca no SSR
    const brain = await import("brain.js");

    // Instancia e hidrata a rede UMA ÚNICA VEZ utilizando tipagem correta
    neuralNetInstance = new brain.NeuralNetwork<number[], number[]>();
    neuralNetInstance.fromJSON(weights.network);

    isLoaded = true;

    console.log(
      `[Lumi Neural] Engine sincronizada — ${weights.meta.totalSamples} exemplos, ` +
        `vocab: ${weights.meta.vocabularySize}, ` +
        `acurácia: ${weights.meta.validationAccuracy}`
    );
    return true;
  } catch (err) {
    console.warn("[Lumi Neural] Pesos não encontrados ou falha no parser — usando apenas pattern-matching", err);
    return false;
  }
}

// ─── TOKENIZAÇÃO (Espelho idêntico ao trainLumi.ts) ───────────────────────────

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos decompostos (ex: á -> a)
    .replace(/[^a-z0-9\s]/g, " ")    // Mantém apenas alfanuméricos básicos
    .replace(/\s+/g, " ")
    .trim();
}

function textToVector(text: string): number[] {
  const tokens = new Set(
    normalizeText(text)
      .split(" ")
      .filter((w) => w.length > 1)
  );
  // Gera uma lista estável de 0 e 1 indexada pelas palavras do vocabulário
  return vocabulary.map((word) => (tokens.has(word) ? 1 : 0));
}

// ─── CLASSIFICAÇÃO ────────────────────────────────────────────────────────────

/**
 * Classifica a intenção de um texto usando a rede neural hidratada.
 */
export function classifyWithNeural(text: string): ClassificationResult | null {
  if (!isLoaded || !neuralNetInstance) return null;

  try {
    // Vetoriza a string do usuário no formato numérico estável
    const inputVector = textToVector(text);
    
    // O brain.js retorna um Float32Array ou number[], forçamos a tipagem segura aqui
    const outputVector = neuralNetInstance.run(inputVector);

    let maxScore = -1;
    let predictedIntentStr = "chitchat";
    const mappedScores: Record<string, number> = {};

    // Remapeia a resposta matricial indexada de volta para o formato legível de objeto
    intentLabels.forEach((label, idx) => {
      const score = outputVector[idx] ?? 0;
      mappedScores[label] = score;

      if (score > maxScore) {
        maxScore = score;
        predictedIntentStr = label;
      }
    });

    // Mapeia e valida se a string predita pertence ao tipo ConversationIntent
    const validIntents: ConversationIntent[] = [
      "desabafo",
      "crise",
      "distorcao",
      "chitchat",
      "companhia",
    ];

    const intent = validIntents.includes(predictedIntentStr as ConversationIntent)
      ? (predictedIntentStr as ConversationIntent)
      : null;

    if (!intent) return null;

    return {
      intent,
      confidence: maxScore,
      scores: mappedScores,
      source: maxScore >= CONFIDENCE_THRESHOLD ? "neural" : "fallback",
    };
  } catch (error) {
    console.error("[Lumi Neural] Erro durante a inferência local:", error);
    return null;
  }
}

/**
 * Retorna true se a rede neural deve ser usada para este input.
 */
export function shouldUseNeural(text: string): boolean {
  const result = classifyWithNeural(text);
  return result !== null && result.confidence >= CONFIDENCE_THRESHOLD;
}

/**
 * Retorna a intenção classificada pela rede, ou null se não confiável.
 */
export function getNeuralIntent(text: string): ConversationIntent | null {
  const result = classifyWithNeural(text);
  if (!result || result.source === "fallback") return null;
  return result.intent;
}

export { CONFIDENCE_THRESHOLD };