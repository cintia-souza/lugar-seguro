/**
 * lumiDataset.ts
 * Base de dados de treino para a rede neural da Lumi.
 *
 * Formato brain.js: { input: string, output: Record<string, number> }
 * Cada output é um vetor de probabilidade onde 1.0 = intenção correta.
 *
 * INTENÇÕES:
 *   desabafo      — pessoa expressando sofrimento emocional ativo
 *   crise         — auto-ódio, urgência, ideação, colapso emocional
 *   distorcao     — catastrofização, tudo-ou-nada, leitura mental, rotulação
 *   chitchat      — conversa leve, cotidiana, sem carga emocional
 *   companhia     — pessoa quer presença silenciosa, recusa desabafo profundo
 */

export interface TrainingSample {
  input: string;
  output: {
    desabafo: number;
    crise: number;
    distorcao: number;
    chitchat: number;
    companhia: number;
  };
}

// ─── DESABAFO ────────────────────────────────────────────────────────────────
// Expressão ativa de sofrimento emocional — pessoa quer ser ouvida
const desabafoSamples: TrainingSample[] = [
  { input: "estou me sentindo muito mal hoje", output: { desabafo: 1, crise: 0, distorcao: 0, chitchat: 0, companhia: 0 } },
  { input: "tô com o coração pesado sem saber o porquê", output: { desabafo: 1, crise: 0, distorcao: 0, chitchat: 0, companhia: 0 } },
  { input: "brigou com minha mãe de novo e tô arrasada", output: { desabafo: 1, crise: 0, distorcao: 0, chitchat: 0, companhia: 0 } },
  { input: "não consigo parar de chorar e não sei o motivo", output: { desabafo: 1, crise: 0, distorcao: 0, chitchat: 0, companhia: 0 } },
  { input: "meu relacionamento tá destruído e eu não sei o que fazer", output: { desabafo: 1, crise: 0, distorcao: 0, chitchat: 0, companhia: 0 } },
  { input: "sinto que ninguém me entende de verdade", output: { desabafo: 1, crise: 0, distorcao: 0, chitchat: 0, companhia: 0 } },
  { input: "tô exausta de tentar e não conseguir nada", output: { desabafo: 1, crise: 0, distorcao: 0, chitchat: 0, companhia: 0 } },
  { input: "perdi meu emprego e tô desesperada", output: { desabafo: 1, crise: 0, distorcao: 0, chitchat: 0, companhia: 0 } },
  { input: "minha ansiedade tá insuportável hoje", output: { desabafo: 1, crise: 0, distorcao: 0, chitchat: 0, companhia: 0 } },
  { input: "me sinto completamente sozinha mesmo rodeada de gente", output: { desabafo: 1, crise: 0, distorcao: 0, chitchat: 0, companhia: 0 } },
  { input: "tô com medo do futuro e não consigo me acalmar", output: { desabafo: 1, crise: 0, distorcao: 0, chitchat: 0, companhia: 0 } },
  { input: "sinto um vazio enorme que não passa", output: { desabafo: 1, crise: 0, distorcao: 0, chitchat: 0, companhia: 0 } },
  { input: "meu chefe me humilhou na frente de todo mundo", output: { desabafo: 1, crise: 0, distorcao: 0, chitchat: 0, companhia: 0 } },
  { input: "terminei com meu namorado e tô destruída", output: { desabafo: 1, crise: 0, distorcao: 0, chitchat: 0, companhia: 0 } },
  { input: "não consigo dormir de tanto pensar", output: { desabafo: 1, crise: 0, distorcao: 0, chitchat: 0, companhia: 0 } },
];

// ─── CRISE ───────────────────────────────────────────────────────────────────
// Auto-ódio, ideação, colapso emocional, urgência — requer resposta imediata
const criseSamples: TrainingSample[] = [
  { input: "me odeio tanto por ser assim", output: { desabafo: 0, crise: 1, distorcao: 0, chitchat: 0, companhia: 0 } },
  { input: "às vezes penso que seria melhor não estar aqui", output: { desabafo: 0, crise: 1, distorcao: 0, chitchat: 0, companhia: 0 } },
  { input: "não aguento mais viver assim", output: { desabafo: 0, crise: 1, distorcao: 0, chitchat: 0, companhia: 0 } },
  { input: "só tenho vontade de gritar e sumir", output: { desabafo: 0, crise: 1, distorcao: 0, chitchat: 0, companhia: 0 } },
  { input: "me detesto completamente não tem jeito", output: { desabafo: 0, crise: 1, distorcao: 0, chitchat: 0, companhia: 0 } },
  { input: "quero desaparecer e não voltar mais", output: { desabafo: 0, crise: 1, distorcao: 0, chitchat: 0, companhia: 0 } },
  { input: "tô tendo um ataque de pânico agora não consigo respirar", output: { desabafo: 0, crise: 1, distorcao: 0, chitchat: 0, companhia: 0 } },
  { input: "penso em me machucar quando fico assim", output: { desabafo: 0, crise: 1, distorcao: 0, chitchat: 0, companhia: 0 } },
  { input: "odeio quem eu sou não consigo me suportar", output: { desabafo: 0, crise: 1, distorcao: 0, chitchat: 0, companhia: 0 } },
  { input: "tô no limite não sei mais o que fazer comigo", output: { desabafo: 0, crise: 1, distorcao: 0, chitchat: 0, companhia: 0 } },
  { input: "sinto que sou um peso pra todo mundo", output: { desabafo: 0, crise: 1, distorcao: 0, chitchat: 0, companhia: 0 } },
  { input: "não vejo saída pra nada que tá acontecendo", output: { desabafo: 0, crise: 1, distorcao: 0, chitchat: 0, companhia: 0 } },
  { input: "minha cabeça vai explodir de tanto sofrimento", output: { desabafo: 0, crise: 1, distorcao: 0, chitchat: 0, companhia: 0 } },
  { input: "tô chorando sem parar e não consigo me controlar", output: { desabafo: 0, crise: 1, distorcao: 0, chitchat: 0, companhia: 0 } },
  { input: "é minha culpa tudo que aconteceu eu sou horrível", output: { desabafo: 0, crise: 1, distorcao: 0, chitchat: 0, companhia: 0 } },
];

// ─── DISTORÇÃO COGNITIVA ──────────────────────────────────────────────────────
// Catastrofização, tudo-ou-nada, leitura mental, rotulação, supergeneralização
const distorcaoSamples: TrainingSample[] = [
  { input: "sempre acontece isso comigo nunca dá certo nada", output: { desabafo: 0, crise: 0, distorcao: 1, chitchat: 0, companhia: 0 } },
  { input: "sou um fracasso completo não sirvo pra nada", output: { desabafo: 0, crise: 0, distorcao: 1, chitchat: 0, companhia: 0 } },
  { input: "todo mundo me odeia eu sei que eles falam mal de mim", output: { desabafo: 0, crise: 0, distorcao: 1, chitchat: 0, companhia: 0 } },
  { input: "se eu errar nessa prova minha vida acabou", output: { desabafo: 0, crise: 0, distorcao: 1, chitchat: 0, companhia: 0 } },
  { input: "ou faço tudo perfeito ou não vale nada", output: { desabafo: 0, crise: 0, distorcao: 1, chitchat: 0, companhia: 0 } },
  { input: "sou burra demais pra isso nunca vou conseguir", output: { desabafo: 0, crise: 0, distorcao: 1, chitchat: 0, companhia: 0 } },
  { input: "ninguém nunca vai me amar do jeito que sou", output: { desabafo: 0, crise: 0, distorcao: 1, chitchat: 0, companhia: 0 } },
  { input: "tenho certeza que meu chefe vai me demitir ele me odeia", output: { desabafo: 0, crise: 0, distorcao: 1, chitchat: 0, companhia: 0 } },
  { input: "sou inútil e imprestável não faço nada direito", output: { desabafo: 0, crise: 0, distorcao: 1, chitchat: 0, companhia: 0 } },
  { input: "vai ser um desastre total eu sei que vai dar tudo errado", output: { desabafo: 0, crise: 0, distorcao: 1, chitchat: 0, companhia: 0 } },
  { input: "todo mundo percebeu que eu sou incompetente", output: { desabafo: 0, crise: 0, distorcao: 1, chitchat: 0, companhia: 0 } },
  { input: "sempre fui assim e sempre vou ser assim não tem jeito", output: { desabafo: 0, crise: 0, distorcao: 1, chitchat: 0, companhia: 0 } },
  { input: "se ele não respondeu é porque me odeia tenho certeza", output: { desabafo: 0, crise: 0, distorcao: 1, chitchat: 0, companhia: 0 } },
  { input: "sou um lixo de pessoa não mereço nada bom", output: { desabafo: 0, crise: 0, distorcao: 1, chitchat: 0, companhia: 0 } },
  { input: "nunca vou melhorar é impossível pra mim", output: { desabafo: 0, crise: 0, distorcao: 1, chitchat: 0, companhia: 0 } },
];

// ─── CHITCHAT ─────────────────────────────────────────────────────────────────
// Conversa leve, cotidiana, sem carga emocional negativa
const chitchatSamples: TrainingSample[] = [
  { input: "meu gato ficou me olhando enquanto eu trabalhava", output: { desabafo: 0, crise: 0, distorcao: 0, chitchat: 1, companhia: 0 } },
  { input: "comi uma pizza incrível hoje à noite", output: { desabafo: 0, crise: 0, distorcao: 0, chitchat: 1, companhia: 0 } },
  { input: "tô assistindo uma série nova e tá muito boa", output: { desabafo: 0, crise: 0, distorcao: 0, chitchat: 1, companhia: 0 } },
  { input: "hoje tá um frio gostoso aqui", output: { desabafo: 0, crise: 0, distorcao: 0, chitchat: 1, companhia: 0 } },
  { input: "fui ao mercado e comprei um monte de coisa", output: { desabafo: 0, crise: 0, distorcao: 0, chitchat: 1, companhia: 0 } },
  { input: "meu cachorro aprontou de novo rasgou o travesseiro", output: { desabafo: 0, crise: 0, distorcao: 0, chitchat: 1, companhia: 0 } },
  { input: "tô ouvindo uma playlist boa enquanto trabalho", output: { desabafo: 0, crise: 0, distorcao: 0, chitchat: 1, companhia: 0 } },
  { input: "almocei bem hoje fiz macarrão em casa", output: { desabafo: 0, crise: 0, distorcao: 0, chitchat: 1, companhia: 0 } },
  { input: "fui caminhar no parque essa manhã", output: { desabafo: 0, crise: 0, distorcao: 0, chitchat: 1, companhia: 0 } },
  { input: "tô jogando um game novo que comprei", output: { desabafo: 0, crise: 0, distorcao: 0, chitchat: 1, companhia: 0 } },
  { input: "o dia foi tranquilo nada de especial", output: { desabafo: 0, crise: 0, distorcao: 0, chitchat: 1, companhia: 0 } },
  { input: "tomei um café gostoso de manhã", output: { desabafo: 0, crise: 0, distorcao: 0, chitchat: 1, companhia: 0 } },
  { input: "vi um filme ótimo no fim de semana", output: { desabafo: 0, crise: 0, distorcao: 0, chitchat: 1, companhia: 0 } },
  { input: "tá chovendo aqui e eu adoro chuva", output: { desabafo: 0, crise: 0, distorcao: 0, chitchat: 1, companhia: 0 } },
  { input: "comprei um livro novo e tô animada pra ler", output: { desabafo: 0, crise: 0, distorcao: 0, chitchat: 1, companhia: 0 } },
];

// ─── COMPANHIA ────────────────────────────────────────────────────────────────
// Pessoa quer presença silenciosa, recusa desabafo profundo
const companhiaSamples: TrainingSample[] = [
  { input: "só quero ficar aqui um pouco", output: { desabafo: 0, crise: 0, distorcao: 0, chitchat: 0, companhia: 1 } },
  { input: "não quero falar só quero companhia", output: { desabafo: 0, crise: 0, distorcao: 0, chitchat: 0, companhia: 1 } },
  { input: "pode ficar aqui comigo sem precisar falar nada", output: { desabafo: 0, crise: 0, distorcao: 0, chitchat: 0, companhia: 1 } },
  { input: "não tenho forças pra explicar nada agora", output: { desabafo: 0, crise: 0, distorcao: 0, chitchat: 0, companhia: 1 } },
  { input: "só preciso de alguém por perto", output: { desabafo: 0, crise: 0, distorcao: 0, chitchat: 0, companhia: 1 } },
  { input: "não sei o que dizer mas não quero ficar sozinha", output: { desabafo: 0, crise: 0, distorcao: 0, chitchat: 0, companhia: 1 } },
  { input: "tô aqui só passando o tempo", output: { desabafo: 0, crise: 0, distorcao: 0, chitchat: 0, companhia: 1 } },
  { input: "não precisa me perguntar nada só fica aqui", output: { desabafo: 0, crise: 0, distorcao: 0, chitchat: 0, companhia: 1 } },
  { input: "não quero pensar em nada agora", output: { desabafo: 0, crise: 0, distorcao: 0, chitchat: 0, companhia: 1 } },
  { input: "tanto faz pode ficar quieta", output: { desabafo: 0, crise: 0, distorcao: 0, chitchat: 0, companhia: 1 } },
  { input: "sem assunto só quero estar aqui", output: { desabafo: 0, crise: 0, distorcao: 0, chitchat: 0, companhia: 1 } },
  { input: "não tenho energia pra conversar só quero presença", output: { desabafo: 0, crise: 0, distorcao: 0, chitchat: 0, companhia: 1 } },
  { input: "deixa quieto só me faz companhia", output: { desabafo: 0, crise: 0, distorcao: 0, chitchat: 0, companhia: 1 } },
  { input: "não quero desabafar só quero não estar sozinha", output: { desabafo: 0, crise: 0, distorcao: 0, chitchat: 0, companhia: 1 } },
  { input: "pode só ficar aqui sem me fazer perguntas", output: { desabafo: 0, crise: 0, distorcao: 0, chitchat: 0, companhia: 1 } },
];

// ─── EXPORT CONSOLIDADO ───────────────────────────────────────────────────────
export const LUMI_DATASET: TrainingSample[] = [
  ...desabafoSamples,
  ...criseSamples,
  ...distorcaoSamples,
  ...chitchatSamples,
  ...companhiaSamples,
];

export const INTENT_LABELS = ["desabafo", "crise", "distorcao", "chitchat", "companhia"] as const;
export type IntentLabel = typeof INTENT_LABELS[number];
