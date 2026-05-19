import { learnFromInput, getLearnedTriggers, initLearning } from "@/lib/brainLearning";
import { saveUserPhrase, getContextualResponse } from "@/lib/brainResponses";
import { analyzeUserSymptoms, type SymptomReport } from "@/lib/clinicalAnalyzer";

// Inicializa cache de palavras aprendidas do servidor
if (typeof window !== "undefined") {
  initLearning();
}

// Motor Cerebral Determinístico v3 — Com memória, progressão e aprendizado
// Nunca repete a mesma resposta, adapta ao histórico do usuário

export type SentimentValence = "negativo" | "neutro" | "misto";

export interface UserSentiment {
  valence: SentimentValence;
  intensity: number;
  triggers: string[];
}

export type CognitiveDistortionType =
  | "catastrofizacao"
  | "tudo-ou-nada"
  | "leitura-mental"
  | "raciocinio-emocional"
  | "rotulacao"
  | "supergeneralizacao";

export interface CognitiveDistortion {
  type: CognitiveDistortionType;
  confidence: number;
  matchedTokens: string[];
}

export interface BrainResponse {
  sentiment: UserSentiment;
  distortions: CognitiveDistortion[];
  validation: string;
  grounding: string;
  reframe: string;
  practicalTip: string;
  clinicalReport: SymptomReport | null;
}

interface TokenRule {
  tokens: string[];
  distortion: CognitiveDistortionType;
  weight: number;
}

// ===== EXPANDED TOKEN RULES =====
const TOKEN_RULES: TokenRule[] = [
  {
    tokens: ["sempre", "nunca", "toda vez", "nada nunca", "jamais", "tudo", "nada funciona", "impossível", "sem saída"],
    distortion: "tudo-ou-nada",
    weight: 0.8,
  },
  {
    tokens: ["desastre", "catástrofe", "fim do mundo", "arruinado", "explodindo", "pior coisa", "horrível", "terrível", "não vou aguentar", "vou morrer", "não suporto"],
    distortion: "catastrofizacao",
    weight: 0.9,
  },
  {
    tokens: ["eles acham", "todo mundo sabe", "me odeiam", "me julgando", "estão rindo de mim", "pensam que", "acham que sou", "ninguém gosta"],
    distortion: "leitura-mental",
    weight: 0.7,
  },
  {
    tokens: ["eu sou um", "eu sou uma", "inútil", "imprestável", "quebrado", "fracasso", "burro", "burra", "lixo", "idiota", "incompetente", "patético", "ridículo"],
    distortion: "rotulacao",
    weight: 0.85,
  },
  {
    tokens: ["eu sinto", "parece que", "deve ser verdade", "com medo", "apavorado", "apavorada", "aterrorizado", "sinto que vou", "tenho certeza que", "meu coração"],
    distortion: "raciocinio-emocional",
    weight: 0.6,
  },
  {
    tokens: ["sozinho", "sozinha", "ninguém", "todo mundo vai embora", "abandonado", "abandonada", "ninguém se importa", "sempre assim", "toda vez igual"],
    distortion: "supergeneralizacao",
    weight: 0.75,
  },
];

const TRIGGER_WORDS: string[] = [
  "inútil", "sozinho", "sozinha", "explodindo", "com medo", "sempre", "nunca",
  "imprestável", "quebrado", "fracasso", "ódio", "morrer", "sem esperança",
  "ansioso", "ansiosa", "pânico", "preso", "presa", "entorpecido", "vazio", "vazia",
  "sobrecarregado", "sobrecarregada", "desespero", "angústia", "sufocando",
  "cansado", "cansada", "exausto", "exausta", "chorando", "triste", "raiva",
  "culpa", "vergonha", "insônia", "dor", "perdido", "perdida",
];

// ===== MULTIPLE RESPONSE POOLS =====
const VALIDATIONS: Record<CognitiveDistortionType, string[]> = {
  catastrofizacao: [
    "O que você está sentindo é real e intenso. Sua mente está tentando te proteger imaginando o pior — mas essa projeção não é um fato. Você está seguro(a) neste momento.",
    "Sua mente está em modo de alerta máximo agora. Isso é o sistema nervoso tentando te proteger. Mas o perigo que você imagina não está acontecendo de verdade — não agora.",
    "Quando tudo parece catastrófico, lembre-se: sua mente está amplificando. O momento é difícil, sim. Mas não é o fim. Você já sobreviveu a 100% dos seus piores dias.",
    "A ansiedade grita que o pior vai acontecer. Mas quantas vezes o pior realmente aconteceu? Você é mais resiliente do que sua mente ansiosa acredita.",
    "Respire. O cenário que sua mente está pintando é uma possibilidade, não uma certeza. Você não precisa resolver o futuro agora — só precisa estar aqui.",
  ],
  "tudo-ou-nada": [
    "Sua dor é válida. Mas a vida raramente existe em absolutos. Existem tons entre o 'sempre' e o 'nunca' — e você merece enxergá-los.",
    "O pensamento preto-e-branco é uma armadilha da mente cansada. A realidade tem nuances. Hoje pode ser difícil sem ser um desastre total.",
    "Quando pensamos em 'tudo ou nada', perdemos o meio do caminho — que é onde a maioria da vida acontece. O 'mais ou menos ok' também conta.",
    "'Sempre' e 'nunca' são palavras pesadas demais pra carregar. A verdade geralmente mora no 'às vezes' e no 'depende'. E tudo bem.",
    "Sua mente está simplificando uma situação complexa. Isso é normal quando estamos sobrecarregados. Mas você não precisa resolver tudo em categorias absolutas.",
  ],
  "leitura-mental": [
    "É exaustivo carregar o peso do que você acha que os outros pensam. Você não lê mentes — e a maioria das pessoas está muito menos focada em nós do que nossa ansiedade sugere.",
    "Você está assumindo o que os outros pensam sem evidências concretas. Na maioria das vezes, as pessoas estão ocupadas demais com seus próprios problemas pra nos julgar tanto.",
    "A mente ansiosa é uma péssima leitora de mentes. Ela sempre assume o pior cenário social. Mas e se as pessoas não estiverem pensando nada disso?",
    "Você não tem acesso aos pensamentos dos outros. O que parece julgamento pode ser indiferença, distração, ou até admiração. Não confie na versão que a ansiedade conta.",
    "Carregar o peso da opinião alheia é como carregar malas que não são suas. Você pode soltar. O que os outros pensam é problema deles, não seu.",
  ],
  "raciocinio-emocional": [
    "Sentimentos são reais, mas nem sempre são relatores precisos da realidade. Você sente isso — e isso importa — mas sentir algo não torna aquilo uma verdade permanente.",
    "Só porque você sente que é verdade, não significa que é. Emoções são como o clima — passam. Elas informam, mas não definem a realidade.",
    "Seu corpo está gritando algo agora. Ouça com compaixão, mas não tome decisões baseadas apenas nesse grito. Ele vai acalmar.",
    "Sentir medo não significa estar em perigo. Sentir-se incapaz não significa ser incapaz. Emoções são visitantes temporários, não moradores permanentes.",
    "O que você sente agora é intenso e real. Mas pergunte-se: daqui a uma semana, isso ainda vai parecer tão absoluto? Provavelmente não. E tudo bem sentir agora.",
  ],
  rotulacao: [
    "Você não é um rótulo. Você é uma pessoa inteira e complexa passando por um momento difícil. Uma dificuldade não define toda a sua identidade.",
    "Quando nos rotulamos, congelamos nossa identidade num momento ruim. Mas você é muito mais do que esse momento. Você é todas as vezes que tentou, que cuidou, que resistiu.",
    "Chamar a si mesmo de [rótulo negativo] é como tirar uma foto num dia ruim e dizer que é seu retrato oficial. Não é. Você é o álbum inteiro.",
    "Rótulos são atalhos preguiçosos que a mente usa quando está cansada. Você não é 'um fracasso' — você é uma pessoa que está enfrentando algo difícil. Tem diferença.",
    "Se alguém que você ama dissesse sobre si mesmo o que você está dizendo sobre você, o que você responderia? Ofereça a si mesmo essa mesma gentileza.",
  ],
  supergeneralizacao: [
    "A solidão pode fazer o mundo parecer universalmente frio. Mas uma experiência dolorosa — ou mesmo várias — não significa que todo momento futuro será igual.",
    "Sua mente está pegando um evento e transformando numa regra universal. Mas exceções existem. Momentos bons existiram antes e vão existir de novo.",
    "Quando generalizamos, perdemos de vista as exceções. E as exceções são a prova de que as coisas podem ser diferentes. Elas existem — mesmo que agora pareçam distantes.",
    "O padrão que você está vendo pode ser real, mas não é permanente. Padrões mudam. Pessoas mudam. Circunstâncias mudam. Inclusive as suas.",
    "Parece que 'sempre foi assim'. Mas será mesmo? Tente lembrar de uma vez — só uma — em que foi diferente. Essa memória é prova de possibilidade.",
  ],
};

const GROUNDINGS: string[] = [
  "Tente isso: Nomeie 5 coisas que você vê, 4 que pode tocar, 3 que pode ouvir, 2 que pode cheirar e 1 que pode sentir o gosto.",
  "Coloque os dois pés firmes no chão. Sinta o peso do seu corpo. Você está aqui. Você está presente.",
  "Inspire por 4 segundos, segure por 4, expire por 6. Repita três vezes. Seu sistema nervoso vai acompanhar.",
  "Pressione as palmas das mãos uma contra a outra com força por 10 segundos. Solte. Sinta o calor.",
  "Segure um cubo de gelo na mão por alguns segundos. Foque na sensação. Isso é o presente.",
  "Coloque a mão no peito. Sinta seu coração batendo. Ele está trabalhando por você agora mesmo.",
  "Olhe ao redor e encontre 3 coisas da mesma cor. Descreva-as mentalmente em detalhes.",
  "Lave as mãos com água fria. Sinta a temperatura. Preste atenção na textura da água.",
  "Estique os braços acima da cabeça por 10 segundos. Solte. Sinta a diferença no corpo.",
  "Morda um limão ou chupe uma bala azeda. A sensação forte te traz pro presente imediatamente.",
  "Conte de trás pra frente de 7 em 7 a partir de 100. Isso ocupa a mente ansiosa.",
  "Toque em 5 texturas diferentes ao seu redor. Descreva cada uma mentalmente.",
];

const REFRAMES: Record<CognitiveDistortionType, string[]> = {
  catastrofizacao: [
    "E se o pior cenário não acontecer? Qual é uma pequena coisa que poderia dar certo?",
    "Numa escala de 1 a 10, quão provável é que o pior realmente aconteça? Geralmente é menos do que sentimos.",
    "O que você diria a um amigo que estivesse pensando isso? Provavelmente algo mais gentil do que está dizendo a si mesmo.",
    "Daqui a 5 anos, isso ainda vai importar tanto? Se não, talvez não mereça tanto sofrimento agora.",
  ],
  "tudo-ou-nada": [
    "Existe um meio-termo entre os extremos? Como seria o 'bom o suficiente' hoje?",
    "Em vez de 'perfeito ou fracasso', que tal 'progresso'? Qualquer passo conta.",
    "O que seria 70% bom? Não precisa ser 100%. A maioria da vida acontece no 'razoável'.",
    "Tente trocar 'sempre' por 'às vezes' e 'nunca' por 'raramente'. Como a frase muda?",
  ],
  "leitura-mental": [
    "Que evidência concreta você tem? Poderia existir outra explicação?",
    "Já aconteceu de você achar que alguém pensava algo ruim e descobrir que estava errado?",
    "Se você perguntasse diretamente, o que acha que a pessoa responderia de verdade?",
    "E se, em vez de julgamento, fosse indiferença? Às vezes as pessoas simplesmente não estão prestando atenção.",
  ],
  "raciocinio-emocional": [
    "Se um amigo sentisse isso, o que você diria a ele? Ofereça a si mesmo essa mesma compaixão.",
    "Sentir não é saber. O que os fatos dizem, separado do que você sente?",
    "Essa emoção vai passar. Ela sempre passa. O que você pode fazer enquanto ela está aqui?",
    "Tente separar: 'Eu sinto que sou incapaz' vs 'Eu estou me sentindo sobrecarregado'. Qual é mais preciso?",
  ],
  rotulacao: [
    "Em vez de 'eu sou [rótulo]', tente 'eu estou vivenciando [sentimento]'. Você não é o seu pior momento.",
    "Liste 3 coisas que você fez bem esta semana — mesmo pequenas. Isso contradiz o rótulo?",
    "Se você fosse definido pelo seu melhor momento, qual seria? Esse também é você.",
    "Rótulos são fixos. Pessoas são fluidas. Você está em movimento, não preso numa definição.",
  ],
  supergeneralizacao: [
    "Você consegue lembrar de uma exceção — uma vez em que as coisas foram diferentes? Essa exceção é prova de possibilidade.",
    "O que mudou entre aquela vez que deu certo e agora? Talvez a diferença seja menor do que parece.",
    "Se alguém te contasse essa história, você diria que 'sempre' é verdade? Ou veria nuances?",
    "Tente completar: 'Nem sempre é assim porque uma vez...' — o que vem depois?",
  ],
};

const PRACTICAL_TIPS: string[] = [
  "Tente escrever 3 coisas pelas quais é grato(a) hoje — mesmo que sejam simples como 'tomei água'.",
  "Saia de onde está por 5 minutos. Mude de ambiente. Às vezes o espaço físico influencia o mental.",
  "Coloque uma música que te faz bem. Não pra 'ficar feliz', mas pra se sentir acompanhado(a).",
  "Mande uma mensagem pra alguém. Não precisa falar sobre como se sente — só conectar já ajuda.",
  "Tome um banho morno. A água quente relaxa os músculos e sinaliza segurança pro cérebro.",
  "Faça uma lista do que está te preocupando. Tirar da cabeça e colocar no papel reduz a carga.",
  "Coma algo nutritivo. Às vezes a ansiedade piora com fome. Seu corpo precisa de combustível.",
  "Defina um timer de 10 minutos pra se preocupar. Quando tocar, pare. Dê permissão limitada à ansiedade.",
  "Faça algo com as mãos: desenhe, amasse papel, organize algo. Movimento repetitivo acalma.",
  "Deite no chão por 2 minutos. Sinta a superfície sólida. Isso ativa o sistema parassimpático.",
  "Assista um vídeo curto de animais fofos. Parece bobo, mas ativa circuitos de ternura no cérebro.",
  "Chore se precisar. Chorar libera cortisol. É literalmente seu corpo se curando.",
];

// ===== MEMORY SYSTEM =====
const MEMORY_KEY = "meu-lugarzinho-brain-memory";

interface BrainMemory {
  lastValidationIndex: Record<string, number>;
  lastReframeIndex: Record<string, number>;
  lastGroundingIndex: number;
  lastTipIndex: number;
  consecutiveDistortions: Record<string, number>;
}

function getMemory(): BrainMemory {
  if (typeof window === "undefined") {
    return { lastValidationIndex: {}, lastReframeIndex: {}, lastGroundingIndex: -1, lastTipIndex: -1, consecutiveDistortions: {} };
  }
  try {
    const raw = localStorage.getItem(MEMORY_KEY);
    return raw ? (JSON.parse(raw) as BrainMemory) : { lastValidationIndex: {}, lastReframeIndex: {}, lastGroundingIndex: -1, lastTipIndex: -1, consecutiveDistortions: {} };
  } catch {
    return { lastValidationIndex: {}, lastReframeIndex: {}, lastGroundingIndex: -1, lastTipIndex: -1, consecutiveDistortions: {} };
  }
}

function saveMemory(memory: BrainMemory): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(MEMORY_KEY, JSON.stringify(memory));
}

function pickFromPool(pool: string[], lastIndex: number): { text: string; index: number } {
  let index = Math.floor(Math.random() * pool.length);
  // Avoid repeating the last one
  if (pool.length > 1 && index === lastIndex) {
    index = (index + 1) % pool.length;
  }
  return { text: pool[index] as string, index };
}

// ===== MAIN ANALYSIS =====
function detectTriggers(text: string): string[] {
  const lower = text.toLowerCase();
  const baseTriggers = TRIGGER_WORDS.filter((word) => lower.includes(word));

  // Add learned triggers
  const learned = getLearnedTriggers(text);
  const learnedWords = learned.map((lw) => lw.word);

  // Merge without duplicates
  return [...new Set([...baseTriggers, ...learnedWords])];
}

function detectDistortions(text: string): CognitiveDistortion[] {
  const lower = text.toLowerCase();
  const detected: CognitiveDistortion[] = [];

  // Base rules
  for (const rule of TOKEN_RULES) {
    const matched = rule.tokens.filter((token) => lower.includes(token));
    if (matched.length > 0) {
      const confidence = Math.min(1, (matched.length / rule.tokens.length) * rule.weight);
      detected.push({ type: rule.distortion, confidence, matchedTokens: matched });
    }
  }

  // Learned word associations
  const learned = getLearnedTriggers(text);
  for (const lw of learned) {
    const existing = detected.find((d) => d.type === lw.associated_distortion as CognitiveDistortionType);
    if (existing) {
      // Boost confidence of existing detection
      existing.confidence = Math.min(1, existing.confidence + lw.confidence * 0.3);
      existing.matchedTokens.push(lw.word);
    } else {
      // Add new detection from learned word
      detected.push({
        type: lw.associated_distortion as CognitiveDistortionType,
        confidence: lw.confidence * 0.6,
        matchedTokens: [lw.word],
      });
    }
  }

  return detected.sort((a, b) => b.confidence - a.confidence);
}

function computeSentiment(triggers: string[], distortions: CognitiveDistortion[]): UserSentiment {
  const intensity = Math.min(1, (triggers.length * 0.15) + (distortions.length * 0.2));
  const valence: SentimentValence =
    triggers.length === 0 ? "neutro" : distortions.length > 1 ? "negativo" : "misto";
  return { valence, intensity, triggers };
}

export function analyzeSentiment(text: string): BrainResponse {
  const triggers = detectTriggers(text);
  const distortions = detectDistortions(text);
  const sentiment = computeSentiment(triggers, distortions);
  const memory = getMemory();

  const primaryDistortion = distortions[0]?.type ?? "raciocinio-emocional";

  // Track consecutive same distortion
  memory.consecutiveDistortions[primaryDistortion] = (memory.consecutiveDistortions[primaryDistortion] ?? 0) + 1;
  // Reset others
  for (const key of Object.keys(memory.consecutiveDistortions)) {
    if (key !== primaryDistortion) {
      memory.consecutiveDistortions[key] = 0;
    }
  }

  // Pick validation (non-repeating)
  let validation: string;
  if (distortions.length > 0) {
    const pool = VALIDATIONS[primaryDistortion];
    const lastIdx = memory.lastValidationIndex[primaryDistortion] ?? -1;
    const picked = pickFromPool(pool, lastIdx);
    validation = picked.text;
    memory.lastValidationIndex[primaryDistortion] = picked.index;
  } else {
    validation = "Obrigado por compartilhar. O que você está sentindo agora é válido. Você não precisa justificar suas emoções para ninguém — nem para si mesmo(a).";
  }

  // Pick reframe (non-repeating)
  let reframe: string;
  if (distortions.length > 0) {
    const pool = REFRAMES[primaryDistortion];
    const lastIdx = memory.lastReframeIndex[primaryDistortion] ?? -1;
    const picked = pickFromPool(pool, lastIdx);
    reframe = picked.text;
    memory.lastReframeIndex[primaryDistortion] = picked.index;
  } else {
    reframe = "Reserve um momento para simplesmente notar o que está sentindo, sem tentar consertar. A consciência em si já é uma forma de cuidado.";
  }

  // Pick grounding (non-repeating)
  const groundingPick = pickFromPool(GROUNDINGS, memory.lastGroundingIndex);
  memory.lastGroundingIndex = groundingPick.index;

  // Pick practical tip (non-repeating)
  const tipPick = pickFromPool(PRACTICAL_TIPS, memory.lastTipIndex);
  memory.lastTipIndex = tipPick.index;

  saveMemory(memory);

  // Learn from this interaction
  learnFromInput(text, triggers, distortions[0]?.type ?? null);
  saveUserPhrase(text, primaryDistortion);

  // Try to get a contextual response based on history
  const contextual = getContextualResponse(primaryDistortion);
  if (contextual && distortions.length > 0) {
    validation = contextual;
  }

  // Clinical analysis for severe symptoms
  const clinicalReport = analyzeUserSymptoms(text);
  const hasClinicalCrisis = clinicalReport.isCrisis || clinicalReport.conditions.length > 0;

  // If clinical analyzer detected something significant, use its response
  if (hasClinicalCrisis && clinicalReport.conditions[0] && clinicalReport.conditions[0].score >= 1.5) {
    validation = clinicalReport.response.validation;
  }

  return {
    sentiment,
    distortions,
    validation,
    grounding: hasClinicalCrisis && clinicalReport.isCrisis ? clinicalReport.response.instruction : groundingPick.text,
    reframe,
    practicalTip: tipPick.text,
    clinicalReport: hasClinicalCrisis ? clinicalReport : null,
  };
}
