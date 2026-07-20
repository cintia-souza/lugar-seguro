/**
 * trainLumi.ts
 * Script de treino isolado para a rede neural da Lumi.
 *
 * COMO USAR:
 *   1. Instalar dependências:
 *      npm install brain.js tsx --save-dev
 *
 *   2. Rodar o treino:
 *      npx tsx scripts/trainLumi.ts
 *
 *   3. O arquivo 'lumi-brain-weights.json' será gerado em /scripts/
 *      Copie-o para /public/lumi-brain-weights.json para uso no Next.js
 */

import * as brain from "brain.js";
import * as fs from "fs";
import * as path from "path";
import { LUMI_DATASET, INTENT_LABELS, type IntentLabel } from "./lumiDataset";

// ─── 1. TOKENIZAÇÃO OTIMIZADA (Bag-of-Words) ───────────────────────────────────

/**
 * Normaliza o texto removendo acentos completamente para mitigar discrepâncias 
 * na entrada do usuário final no client-side.
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos decompostos (á -> a)
    .replace(/[^a-z0-9\s]/g, " ")    // Mantém apenas alfanuméricos básicos
    .replace(/\s+/g, " ")
    .trim();
}

/** Tokeniza uma string em array de palavras significativas */
function tokenize(text: string): string[] {
  return normalizeText(text).split(" ").filter(w => w.length > 1);
}

/** Constrói o vocabulário ordenado de forma determinística */
function buildVocabulary(samples: typeof LUMI_DATASET): string[] {
  const vocab = new Set<string>();
  for (const sample of samples) {
    for (const token of tokenize(sample.input)) {
      vocab.add(token);
    }
  }
  return Array.from(vocab).sort();
}

/**
 * Converte texto em um vetor numérico indexado puro (Array de 0 e 1).
 * Abordagem robusta e segura para a exportação/importação no Next.js.
 */
function textToVector(text: string, vocabulary: string[]): number[] {
  const tokens = new Set(tokenize(text));
  return vocabulary.map(word => (tokens.has(word) ? 1 : 0));
}

/** Converte o objeto de output da intenção em um vetor posicional fixo */
function intentToVector(outputObj: Record<string, number>): number[] {
  return INTENT_LABELS.map(label => outputObj[label] ?? 0);
}

// ─── 2. PREPARAÇÃO DOS DADOS ──────────────────────────────────────────────────

console.log("🧠 Lumi Neural Training Pipeline (Production Ready)");
console.log("─".repeat(50));
console.log(`📊 Total de exemplos: ${LUMI_DATASET.length}`);

const vocabulary = buildVocabulary(LUMI_DATASET);
console.log(`📖 Vocabulário: ${vocabulary.length} tokens únicos mapeados.`);

// Converter dataset para matrizes numéricas puras compatíveis com brain.js
const trainingData = LUMI_DATASET.map(sample => ({
  input: textToVector(sample.input, vocabulary),
  output: intentToVector(sample.output as Record<string, number>),
}));

// ─── 3. CONFIGURAÇÃO AJUSTADA DA REDE NEURAL ──────────────────────────────────

const net = new brain.NeuralNetwork({
  hiddenLayers: [32],          // Reduzido para uma camada de 32 para evitar overfitting crônico
  activation: "sigmoid",
  learningRate: 0.1,           // Aumentado para acelerar a convergência
  momentum: 0.5,               // Ajustado para estabilizar os gradientes com maior learning rate
});

// ─── 4. TREINO ────────────────────────────────────────────────────────────────

console.log("🚀 Iniciando treino estatístico...\n");
const startTime = Date.now();

const result = net.train(trainingData, {
  iterations: 5000,            // 5k iterações são suficientes devido à topologia mais leve
  errorThresh: 0.002,          // Erro estrito para forçar boa convergência no BoW
  log: true,
  logPeriod: 1000,
});

const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
console.log("\n" + "─".repeat(50));
console.log(`✅ Treino concluído em ${elapsed}s`);
console.log(`   Iterações: ${result.iterations}`);
console.log(`   Erro final: ${result.error.toFixed(6)}`);

// ─── 5. VALIDAÇÃO COM VETORES INDEXADOS ──────────────────────────────────────

console.log("\n🧪 Validação com frases de teste:");

const testPhrases: { text: string; expected: IntentLabel }[] = [
  { text: "tô me sentindo péssima hoje", expected: "desabafo" },
  { text: "me odeio por ser assim", expected: "crise" },
  { text: "nunca dá certo nada na minha vida", expected: "distorcao" },
  { text: "meu gato dormiu no meu colo", expected: "chitchat" },
  { text: "só quero ficar aqui sem falar nada", expected: "companhia" },
  { text: "não aguento mais viver assim", expected: "crise" },
  { text: "sou um fracasso total", expected: "distorcao" },
  { text: "comi um sorvete gostoso hoje", expected: "chitchat" },
];

let correct = 0;
for (const { text, expected } of testPhrases) {
  const inputVector = textToVector(text, vocabulary);
  const outputVector = net.run(inputVector) as number[];

  // Reconstrói o mapeamento posicional do array de scores para mapear a intenção
  let maxScore = -1;
  let predicted: IntentLabel = "chitchat";

  const scores = INTENT_LABELS.map((label, idx) => {
    const score = outputVector[idx] ?? 0;
    if (score > maxScore) {
      maxScore = score;
      predicted = label;
    }
    return `${label}: ${(score * 100).toFixed(0)}%`;
  }).join(" | ");

  const isCorrect = predicted === expected;
  if (isCorrect) correct++;

  console.log(`  ${isCorrect ? "✅" : "❌"} "${text}"`);
  console.log(`     Esperado: ${expected} | Predito: ${predicted}`);
  console.log(`     [${scores}]`);
}

const accuracy = ((correct / testPhrases.length) * 100).toFixed(0);
console.log(`\n📊 Acurácia na validação: ${accuracy}% (${correct}/${testPhrases.length})`);

// ─── 6. EXPORTAR PESOS SEGUROS PARA NEXT.JS ───────────────────────────────────

const exportData = {
  vocabulary,
  intents: [...INTENT_LABELS],
  network: net.toJSON(),
  meta: {
    trainedAt: new Date().toISOString(),
    totalSamples: LUMI_DATASET.length,
    vocabularySize: vocabulary.length,
    hiddenLayers: [32],
    iterations: result.iterations,
    finalError: result.error,
    validationAccuracy: `${accuracy}%`,
  },
};

const outputPath = path.join(__dirname, "lumi-brain-weights.json");
fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2), "utf-8");

const fileSizeKb = (fs.statSync(outputPath).size / 1024).toFixed(1);
console.log("\n" + "─".repeat(50));
console.log(`💾 Pesos salvos com segurança em: ${outputPath}`);
console.log(`   Tamanho: ${fileSizeKb} KB`);
console.log("─".repeat(50));