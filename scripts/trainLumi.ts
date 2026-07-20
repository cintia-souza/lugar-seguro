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
 *
 * ARQUITETURA:
 *   - Tokenização: Bag-of-Words (BoW) com vocabulário extraído do dataset
 *   - Rede: brain.NeuralNetwork (feedforward, adequada para vetores fixos)
 *   - Input: vetor binário de presença de tokens (tamanho = vocabulário)
 *   - Output: vetor de 5 probabilidades (uma por intenção)
 */

import * as brain from "brain.js/browser";
import * as fs from "fs";
import * as path from "path";
import { LUMI_DATASET, INTENT_LABELS, type IntentLabel } from "./lumiDataset";

// ─── 1. TOKENIZAÇÃO (Bag-of-Words) ───────────────────────────────────────────

/**
 * Normaliza texto: lowercase, remove pontuação, acentos opcionais.
 * Mantém acentos pois o dataset é PT-BR e eles carregam significado.
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\wàáâãéêíóôõúç\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Tokeniza uma string em array de palavras */
function tokenize(text: string): string[] {
  return normalizeText(text).split(" ").filter(w => w.length > 1);
}

/** Constrói o vocabulário completo a partir de todos os exemplos */
function buildVocabulary(samples: typeof LUMI_DATASET): string[] {
  const vocab = new Set<string>();
  for (const sample of samples) {
    for (const token of tokenize(sample.input)) {
      vocab.add(token);
    }
  }
  // Ordenar para garantir índices determinísticos entre treinos
  return Array.from(vocab).sort();
}

/**
 * Converte uma string em vetor BoW binário.
 * Cada posição corresponde a uma palavra do vocabulário.
 * 1.0 = palavra presente, 0.0 = ausente.
 */
function textToVector(text: string, vocabulary: string[]): Record<string, number> {
  const tokens = new Set(tokenize(text));
  const vector: Record<string, number> = {};
  for (const word of vocabulary) {
    vector[word] = tokens.has(word) ? 1 : 0;
  }
  return vector;
}

// ─── 2. PREPARAÇÃO DOS DADOS ──────────────────────────────────────────────────

console.log("🧠 Lumi Neural Training Pipeline");
console.log("─".repeat(50));
console.log(`📊 Total de exemplos: ${LUMI_DATASET.length}`);

// Construir vocabulário
const vocabulary = buildVocabulary(LUMI_DATASET);
console.log(`📖 Vocabulário: ${vocabulary.length} tokens únicos`);

// Distribuição por intenção
const distribution: Record<string, number> = {};
for (const sample of LUMI_DATASET) {
  const intent = Object.entries(sample.output).find(([, v]) => v === 1)?.[0] ?? "unknown";
  distribution[intent] = (distribution[intent] ?? 0) + 1;
}
console.log("📈 Distribuição:", distribution);
console.log("─".repeat(50));

// Converter dataset para formato brain.js
const trainingData = LUMI_DATASET.map(sample => ({
  input: textToVector(sample.input, vocabulary),
  output: sample.output as Record<string, number>,
}));

// ─── 3. CONFIGURAÇÃO DA REDE NEURAL ──────────────────────────────────────────

/**
 * brain.NeuralNetwork — feedforward com backpropagation.
 * Adequada para vetores de entrada fixos (BoW).
 *
 * Arquitetura:
 *   Input layer:  tamanho do vocabulário (dinâmico)
 *   Hidden layer: 64 neurônios (bom equilíbrio para ~75 exemplos)
 *   Output layer: 5 neurônios (uma por intenção)
 */
const net = new brain.NeuralNetwork({
  hiddenLayers: [64, 32],       // 2 camadas ocultas: 64 → 32
  activation: "sigmoid",         // sigmoid para outputs de probabilidade
  learningRate: 0.01,            // taxa de aprendizado conservadora
  momentum: 0.1,                 // momentum para evitar mínimos locais
});

// ─── 4. TREINO ────────────────────────────────────────────────────────────────

console.log("🚀 Iniciando treino...\n");

const startTime = Date.now();

const result = net.train(trainingData, {
  iterations: 20000,
  errorThresh: 0.005,
  log: true,
  logPeriod: 1000,               // log a cada 1000 iterações
  callback: (stats: { iterations: number; error: number }) => {
    // Callback adicional para monitoramento
    if (stats.iterations % 5000 === 0) {
      console.log(`  ⏱  Iteração ${stats.iterations} — Erro: ${stats.error.toFixed(6)}`);
    }
  },
  callbackPeriod: 5000,
});

const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
console.log("\n" + "─".repeat(50));
console.log(`✅ Treino concluído em ${elapsed}s`);
console.log(`   Iterações: ${result.iterations}`);
console.log(`   Erro final: ${result.error.toFixed(6)}`);

// ─── 5. VALIDAÇÃO RÁPIDA ──────────────────────────────────────────────────────

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
  const output = net.run(inputVector) as Record<string, number>;

  // Encontrar intenção com maior probabilidade
  const predicted = (Object.entries(output)
    .sort(([, a], [, b]) => b - a)[0]?.[0] ?? "unknown") as IntentLabel;

  const isCorrect = predicted === expected;
  if (isCorrect) correct++;

  const scores = INTENT_LABELS
    .map(label => `${label}: ${((output[label] ?? 0) * 100).toFixed(0)}%`)
    .join(" | ");

  console.log(`  ${isCorrect ? "✅" : "❌"} "${text}"`);
  console.log(`     Esperado: ${expected} | Predito: ${predicted}`);
  console.log(`     [${scores}]`);
}

const accuracy = ((correct / testPhrases.length) * 100).toFixed(0);
console.log(`\n📊 Acurácia na validação: ${accuracy}% (${correct}/${testPhrases.length})`);

// ─── 6. EXPORTAR PESOS ────────────────────────────────────────────────────────

/**
 * Estrutura do JSON exportado:
 * {
 *   vocabulary: string[],          — vocabulário para vetorização no cliente
 *   intents: string[],             — labels das intenções na ordem do output
 *   network: object,               — pesos da rede (formato brain.js toJSON())
 *   meta: { trainedAt, samples, vocab, accuracy }
 * }
 */
const exportData = {
  vocabulary,
  intents: [...INTENT_LABELS],
  network: net.toJSON(),
  meta: {
    trainedAt: new Date().toISOString(),
    totalSamples: LUMI_DATASET.length,
    vocabularySize: vocabulary.length,
    hiddenLayers: [64, 32],
    iterations: result.iterations,
    finalError: result.error,
    validationAccuracy: `${accuracy}%`,
  },
};

const outputPath = path.join(__dirname, "lumi-brain-weights.json");
fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2), "utf-8");

const fileSizeKb = (fs.statSync(outputPath).size / 1024).toFixed(1);
console.log("\n" + "─".repeat(50));
console.log(`💾 Pesos salvos em: ${outputPath}`);
console.log(`   Tamanho: ${fileSizeKb} KB`);
console.log("\n📋 Próximos passos:");
console.log("   1. Copie 'lumi-brain-weights.json' para /public/");
console.log("   2. Importe em /src/lib/neuralClassifier.ts");
console.log("   3. Use como camada de pré-classificação antes do conversationalEngine");
console.log("─".repeat(50));
