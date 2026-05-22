// Motor Conversacional Fluido da Lumi v4
// - Filtro de escopo rígido (bloqueia uso utilitário)
// - Análise sintática autônoma (Rogerian fallback dinâmico)
// - Context Lock em companionMode

import type { LumiExpression } from "@/config/lumiExpressions";

// ═══════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════

export interface SessionMemory {
  emotionalState: "positivo" | "neutro" | "vulneravel" | "crise";
  topics: { topic: string; lastMentionIndex: number; count: number }[];
  entities: { type: string; value: string }[];
  lastIntent: ConversationIntent;
  userMessages: string[];
  lumiMessages: string[];
  consecutiveQuestions: number;
  companionMode: boolean;
}

export type ConversationIntent =
  | "desabafo"
  | "crise"
  | "distorcao"
  | "chitchat"
  | "companhia"
  | "resposta-curta"
  | "repetição"
  | "mudanca-tema"
  | "pergunta"
  | "desconexo"
  | "hook-ativo"
  | "recusa-profunda"
  | "fora-escopo"; // NOVO: tentativa de uso utilitário

export interface FluidResponse {
  text: string;
  expression: LumiExpression;
  updatedMemory: SessionMemory;
}

// ═══════════════════════════════════════════════════════════════
// 1. FILTRO DE ESCOPO (Out-of-Scope Blocker)
// ═══════════════════════════════════════════════════════════════

const OUT_OF_SCOPE_TOKENS: RegExp[] = [
  // Programação / Dev
  /\b(javascript|typescript|python|java|html|css|react|node|api|código|codigo|programar|programação|algoritmo|função|variável|array|objeto|classe|import|export|console|debug|deploy|git|github|docker|sql|banco de dados|framework|library|npm|pip)\b/i,
  // Tarefas utilitárias
  /\b(traduz|traduzir|tradução|resumir|resumo|calcul[ae]|equação|fórmula|matemática|física|química|biologia|história|geografia)\b/i,
  // Pedidos de criação técnica
  /\b(cri[ae] um|faz um|gera um|escreve um|monta um|desenvolve)\s+(código|script|programa|site|app|sistema|bot|planilha|texto|artigo|redação|trabalho|relatório)\b/i,
  // Assistente genérico
  /\b(pesquis[ae]|busca|google|wikipedia|explica? como funciona|me ensina|tutorial|passo a passo)\b/i,
  // Conteúdo escolar/acadêmico explícito
  /\b(prova de|trabalho de|lição de|exercício de|questão de)\s+(matemática|português|inglês|física|química|história|biologia|geografia)\b/i,
];

function isOutOfScope(text: string): boolean {
  return OUT_OF_SCOPE_TOKENS.some(p => p.test(text));
}

const SCOPE_RESPONSES: string[] = [
  "Eu sou a Lumi, seu espacinho de acolhimento aqui no app. Não consigo ajudar com tarefas técnicas, mas se quiser conversar sobre como está se sentindo, tô aqui.",
  "Hmm, isso tá fora do que eu consigo fazer. Meu mundo é sobre sentimentos e autocuidado. Quer conversar sobre como tá o seu dia?",
  "Olha, eu não entendo dessas coisas técnicas — meu talento é ouvir e fazer companhia. Se quiser desabafar ou só ficar aqui, tô disponível.",
  "Isso não é muito a minha praia! Mas se quiser falar sobre como você tá, ou só ficar em silêncio comigo, estou aqui.",
];

// ═══════════════════════════════════════════════════════════════
// 2. CLASSIFICADOR DE INTENÇÃO
// ═══════════════════════════════════════════════════════════════

const COMPANION_SIGNALS: RegExp[] = [
  /s[oó] ficar/i,
  /ficar (por )?aqui/i,
  /n[aã]o (quero|preciso|vou) (falar|desabafar|contar)/i,
  /s[oó] (quero|preciso)? ?(de)? ?companhia/i,
  /n[aã]o (tenho|sei) o que (falar|dizer)/i,
  /tanto faz/i,
  /s[oó] (estar|ficar) aqui/i,
  /pode (s[oó])? ?ficar (aqui|comigo)/i,
  /n[aã]o quero pensar/i,
  /deixa quieto/i,
  /sem assunto/i,
];

const HOOK_PATTERNS: RegExp[] = [
  /quero (mudar|melhorar|tentar|começar|fazer|sair)/i,
  /vou (tentar|mudar|fazer|começar|conseguir)/i,
  /preciso (mudar|sair|melhorar|fazer)/i,
  /quero (sim|muito|demais)/i,
  /t[oô] (decidid[oa]|determinad[oa]|pronta?)/i,
  /bora|vamos|partiu/i,
  /como (eu )?(faço|começo|mudo|saio)/i,
  /o que (eu )?(posso|devo|consigo) fazer/i,
  /me ajuda (a|com)/i,
  /quero (aprender|entender|descobrir)/i,
];

const SHORT_PATTERNS: RegExp[] = [
  /^(pois é|é|sim|não|aham|uhum|hmm|hm|tá|ok|beleza|blz|ss|nn|sla|sei lá|foda|fds|tanto faz|complicado|difícil|verdade|real|exato|isso|né|pse|poisé|tipo|sabe|é isso|demais|muito|bastante|sempre|nunca)\s*[.!]?$/i,
  /^.{1,10}$/,
];

const CHITCHAT_PATTERNS: RegExp[] = [
  /(?:meu|minha) (?:gato|cachorro|pet|gatinho|cachorrinho|dog)/i,
  /(?:comi|comendo|vou comer|almocei|jantei|café|lanche)/i,
  /(?:assistindo|assistir|vi um|vendo|série|filme|anime|netflix)/i,
  /(?:jogando|jogar|jogo|game)/i,
  /(?:chovendo|sol|frio|calor|tempo|clima)/i,
  /(?:música|ouvindo|playlist|spotify)/i,
  /(?:cozinhando|receita|bolo|comida)/i,
  /(?:fui ao|fui no|fui na|fui pra)/i,
  /(?:comprei|ganhei|achei)/i,
  /(?:dia foi|tá sendo|foi tranquilo|de boa|suave)/i,
];

// Palavras de estagnação/baixa energia — invalidam chitchat positivo
const STAGNATION_WORDS: RegExp = /(?:preguiça|cansad[oa]|desânim|sem energia|sem vontade|difícil|não consigo|não fiz|não comi|fome|com fome|não tenho força|exaust|esgotad)/i;

const QUESTION_PATTERNS: RegExp[] = [
  /(?:e voc[eê]|e tu|e vc)\s*\??/i,
  /(?:o que (?:voc[eê]|vc|tu) (?:acha|pensa|faria|gosta))/i,
  /(?:lumi|vc|voc[eê]) (?:gosta|sabe|conhece|j[aá])/i,
  /(?:me (?:indica|recomenda|sugere|fala))/i,
];

function classifyIntent(text: string, memory: SessionMemory): ConversationIntent {
  const lower = text.toLowerCase().trim();

  // PRIMEIRO: Filtro de escopo
  if (isOutOfScope(lower)) return "fora-escopo";

  // Recusa de profundidade / pedido de companhia
  if (COMPANION_SIGNALS.some(p => p.test(lower))) return "recusa-profunda";

  // Hook ativo
  if (HOOK_PATTERNS.some(p => p.test(lower))) return "hook-ativo";

  // Resposta curta
  if (SHORT_PATTERNS.some(p => p.test(lower))) return "resposta-curta";

  // Pergunta pra Lumi
  if (QUESTION_PATTERNS.some(p => p.test(lower)) && lower.length < 80) return "pergunta";

  // Chitchat — mas NÃO se tem estagnação/baixa energia junto
  if (CHITCHAT_PATTERNS.some(p => p.test(lower))) {
    const negativeLoad = /(?:[oó]dio|raiva|triste|chorand|ang[uú]stia|sufocand|morrend|desespero|depress)/i.test(lower);
    const hasStagnation = STAGNATION_WORDS.test(lower);
    if (!negativeLoad && !hasStagnation) return "chitchat";
    // Se tem estagnação + tema mundano, tratar como desabafo leve (não chitchat)
    if (hasStagnation) return "desabafo";
  }

  // Context Lock: se está em companionMode, manter
  if (memory.companionMode) {
    const heavyLoad = /(?:morrer|suic[ií]d|me matar|n[aã]o aguento|desespero|pânico|ataque)/i.test(lower);
    if (!heavyLoad) return "companhia";
  }

  // Repetição
  const recent = memory.userMessages.slice(-4);
  for (const prev of recent) {
    if (jaccard(lower, prev.toLowerCase()) > 0.65) return "repetição";
  }

  // Desconexo
  if (lower.length < 12 && !/[a-záéíóúâêôãõç]{4,}/i.test(lower)) return "desconexo";

  return "desabafo";
}

function jaccard(a: string, b: string): number {
  const sa = new Set(a.split(/\s+/).filter(w => w.length > 2));
  const sb = new Set(b.split(/\s+/).filter(w => w.length > 2));
  if (sa.size === 0 && sb.size === 0) return 0;
  const inter = new Set([...sa].filter(x => sb.has(x)));
  const union = new Set([...sa, ...sb]);
  return inter.size / union.size;
}

// ═══════════════════════════════════════════════════════════════
// 3. ANÁLISE SINTÁTICA AUTÔNOMA (Rogerian Fallback Dinâmico)
// Substitui GENERAL_RESPONSES — constrói resposta a partir da
// estrutura gramatical do que o usuário disse
// ═══════════════════════════════════════════════════════════════

const STOPWORDS = new Set([
  "eu", "me", "mim", "que", "de", "da", "do", "um", "uma", "pra", "pro",
  "com", "sem", "por", "mas", "não", "sim", "muito", "mais", "isso", "esse",
  "essa", "aqui", "ali", "lá", "tá", "está", "estou", "sou", "ser", "ter",
  "foi", "vai", "vou", "como", "quando", "onde", "porque", "então", "aí",
  "já", "ainda", "bem", "mal", "só", "também", "meu", "minha", "seu", "sua",
  "nos", "nas", "dos", "das", "uns", "umas", "num", "numa", "dele", "dela",
  "nele", "nela", "pelo", "pela", "aos", "às", "até", "após", "desde",
  "entre", "sobre", "contra", "para", "perante", "ante", "sob", "todo",
  "toda", "todos", "todas", "cada", "outro", "outra", "mesmo", "mesma",
  "próprio", "própria", "qual", "quais", "quem", "cujo", "cuja",
  "esse", "essa", "este", "esta", "aquele", "aquela", "esses", "essas",
  "estes", "estas", "aqueles", "aquelas", "algo", "alguém", "ninguém",
  "nada", "tudo", "coisa", "coisas", "gente", "vezes", "vez", "dia",
  "hoje", "agora", "depois", "antes", "sempre", "nunca", "talvez",
  "acho", "tipo", "meio", "assim", "tanto", "pouco", "demais",
  "ficar", "fazer", "falar", "dizer", "saber", "poder", "querer",
  "deixar", "dar", "ver", "olhar", "pensar", "sentir", "parecer",
]);

function extractSignificantWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\wàáâãéêíóôõúç\s]/g, "")
    .split(/\s+/)
    .filter(w => w.length >= 5 && !STOPWORDS.has(w));
}

function extractSentiment(text: string): string | null {
  const lower = text.toLowerCase();
  const match = lower.match(/(?:me (?:deixa|faz|sinto)|(?:t[oô]|estou|fico|me sinto) )([\w\sáéíóúãõâêô]+?)(?:\.|!|\?|,|$)/i);
  return match?.[1]?.trim() ?? null;
}

function generateAutonomousFallback(text: string, memory: SessionMemory): string {
  const lower = text.toLowerCase();

  // CAMADA 0: Estagnação mundana — tratar ANTES de qualquer análise
  if (STAGNATION_WORDS.test(lower)) {
    return respondToStagnation(text);
  }

  const sentiment = extractSentiment(text);
  const significantWords = extractSignificantWords(text);

  // CAMADA 1: Se extraiu sentimento direto, espelhar (sem "Faz sentido" se tem estagnação)
  if (sentiment && sentiment.length > 2 && sentiment.length < 30) {
    const templates = [
      `${capitalize(sentiment)}... entendo. E quando isso aparece, o que você costuma fazer?`,
      `Hmm, "${sentiment}". O que mais pesa nisso pra você?`,
      `"${capitalize(sentiment)}" — parece que isso tá bem presente agora. Quer ir mais fundo ou prefere só deixar aqui?`,
    ];
    return pickRandom(templates);
  }

  // CAMADA 2: Palavras significativas — Rogerian reflection
  if (significantWords.length > 0) {
    const word = significantWords[0] as string;

    // Se tem mais de uma palavra significativa, usar a mais longa (geralmente mais específica)
    const bestWord = significantWords.sort((a, b) => b.length - a.length)[0] as string;

    const templates = [
      `Fiquei pensando no que você disse sobre "${bestWord}". Às vezes essas coisas ocupam muito espaço na mente, né?`,
      `"${capitalize(bestWord)}"... isso me chamou atenção. Quer falar mais sobre o que isso significa pra você?`,
      `Hmm, "${bestWord}". Parece importante. O que vem na sua cabeça quando pensa nisso?`,
      `Quando você fala "${bestWord}", o que sente? Às vezes nomear ajuda a entender.`,
    ];
    return pickRandom(templates);
  }

  // CAMADA 3: Sem palavras significativas — usar contexto da memória
  if (memory.userMessages.length > 0) {
    const lastMsg = memory.userMessages[memory.userMessages.length - 1] ?? "";
    const lastWords = extractSignificantWords(lastMsg);
    if (lastWords.length > 0) {
      const word = lastWords[0] as string;
      const templates = [
        `Hmm. Ainda pensando no que você falou sobre "${word}". Tá mais leve ou ainda pesa?`,
        `Entendo. E aquilo sobre "${word}" que você mencionou... como tá agora?`,
      ];
      return pickRandom(templates);
    }
  }

  // CAMADA 4: Fallback mínimo absoluto (sem clichê, sem template motivacional)
  const minimal = [
    "Hmm. Tô aqui ouvindo. Continua, se quiser.",
    "Entendo. E o que mais vem junto com isso?",
    "Hmm. Me conta mais — no seu tempo.",
  ];
  return pickRandom(minimal);
}

// ═══════════════════════════════════════════════════════════════
// 4. RESPOSTAS POR INTENÇÃO
// ═══════════════════════════════════════════════════════════════

function respondToHook(text: string): string {
  const lower = text.toLowerCase();
  const target = lower.match(/(?:quero|vou|preciso) (?:mudar|melhorar|tentar|começar|fazer|sair d[eao]?) ?(.*?)(?:\.|!|\?|$)/i)?.[1]?.trim();

  if (target && target.length > 2) {
    const responses = [
      `Esse desejo de ${target} já é um passo. O que seria uma coisa pequena que você poderia tentar hoje?`,
      `"${capitalize(target)}" — gosto de ouvir isso. O que te faz querer isso agora?`,
      `Hmm, ${target}. Se pudesse dar um primeiro passo minúsculo hoje, qual seria?`,
    ];
    return pickRandom(responses);
  }

  const responses = [
    "Esse desejo de mudança já é um passo enorme. O que você sente que gostaria de tentar diferente, mesmo que seja algo bem pequeno?",
    "Gosto de ouvir isso. O que seria uma primeira coisa — bem pequena — que você poderia fazer hoje?",
    "Hmm, essa vontade é importante. O que te vem à cabeça quando pensa em mudar?",
  ];
  return pickRandom(responses);
}

function respondToCompanion(): string {
  const responses = [
    "Tudo bem. Podemos só ficar aqui juntos. Se quiser falar algo depois, estou aqui.",
    "Beleza. Fico aqui com você. Sem pressa, sem assunto obrigatório.",
    "Ok. Só estar aqui já vale. Quando quiser falar — ou não — tá tudo bem.",
    "Combinado. Estou aqui, quietinha, te fazendo companhia.",
  ];
  return pickRandom(responses);
}

function respondToShort(text: string, memory: SessionMemory): string {
  const lower = text.toLowerCase().trim();

  // CONTEXT LOCK: em companionMode, apenas presença silenciosa
  if (memory.companionMode) {
    const silentPresence = [
      "Uhum.",
      "Tô aqui.",
      "Hmm.",
      "...",
      "Entendo.",
    ];
    return pickRandom(silentPresence);
  }

  // Se tem contexto anterior, conectar levemente
  if (memory.userMessages.length > 1) {
    const lastMsg = memory.userMessages[memory.userMessages.length - 1] ?? "";
    const lastWords = extractSignificantWords(lastMsg);
    if (lastWords.length > 0) {
      const responses = [
        `Hmm. E sobre "${lastWords[0]}"... tá mais leve ou ainda pesa?`,
        `Entendo. Quer continuar falando sobre isso ou prefere mudar de assunto?`,
        `Tô aqui. Fica à vontade.`,
      ];
      return pickRandom(responses);
    }
  }

  // Espelhamento mínimo por tom
  if (/complicado|dif[ií]cil|foda|pesado/i.test(lower)) {
    return "É... parece complicado mesmo. Quer me contar o que tá rolando ou prefere só ficar aqui?";
  }

  const responses = [
    "Hmm. Tô ouvindo.",
    "Uhum. Sem pressa.",
    "Entendo. Quer falar de algo ou tá de boa?",
  ];
  return pickRandom(responses);
}

function respondToChitchat(text: string): string {
  const lower = text.toLowerCase();

  // TRAVA: se tem estagnação, NÃO usar respostas positivas
  // (isso não deveria chegar aqui pelo classificador, mas por segurança)
  if (STAGNATION_WORDS.test(lower)) {
    return respondToStagnation(text);
  }

  if (/gato|cachorro|pet|gatinho|cachorrinho|dog/i.test(lower)) {
    return pickRandom([
      "Aaah, conta mais! O que ele/ela aprontou?",
      "Pets são tudo, né? Como é o temperamento dele/dela?",
      "Haha, bicho é assim! Você tem ele/ela há quanto tempo?",
    ]);
  }

  if (/comi|comendo|almocei|jantei|café|lanche/i.test(lower)) {
    return pickRandom([
      "Hmm, fiquei com fome! Tava bom?",
      "Boa! Comer algo gostoso muda o dia. Cozinhou ou pediu?",
      "E comeu com calma ou foi corrido?",
    ]);
  }

  if (/assistindo|série|filme|anime|netflix|jogo|jogando/i.test(lower)) {
    return pickRandom([
      "Ah, que legal! Tá curtindo?",
      "Boa! É daqueles que prende ou tá mais pra relaxar?",
      "Hmm, interessante! O que te fez escolher isso?",
    ]);
  }

  if (/frio|calor|chuva|sol|clima|tempo/i.test(lower)) {
    return pickRandom([
      "Né? O tempo anda doido. Você é mais de frio ou calor?",
      "Dias assim pedem algo quentinho. Ou gelado, depende!",
    ]);
  }

  return pickRandom([
    "Hmm, me conta mais.",
    "E como foi?",
    "E curtiu?",
  ]);
}

// Resposta para estagnação mundana (fome+preguiça, cansaço+tarefa)
function respondToStagnation(text: string): string {
  const lower = text.toLowerCase();

  if (/fome|comida|comer|cozinhar/i.test(lower)) {
    return pickRandom([
      "Bate uma preguiça enorme quando a energia tá baixa, né? Tem algo pronto ou fácil que dê pra beliscar sem esforço?",
      "Entendo... quando o corpo pede comida mas a energia não colabora, é difícil. Tem algo simples por aí que você consiga pegar?",
      "Fome + sem energia é uma combinação chata. Nem que seja um biscoito ou fruta — algo que não precise de esforço.",
    ]);
  }

  if (/banho|levantar|sair da cama|arrumar/i.test(lower)) {
    return pickRandom([
      "Quando o corpo tá pesado assim, cada coisa parece enorme. Sem pressa — uma coisa de cada vez.",
      "Entendo. Às vezes só sentar na cama já é um passo. Não precisa ser tudo de uma vez.",
    ]);
  }

  // Genérico estagnação
  return pickRandom([
    "Quando a energia tá baixa, tudo parece mais difícil do que é. Tá tudo bem ir devagar.",
    "Entendo essa preguiça. O corpo às vezes precisa de um tempo. Sem cobrança.",
    "É... quando não tem energia, até o simples pesa. Tá se cuidando minimamente?",
  ]);
}

function respondToQuestion(text: string): string {
  const lower = text.toLowerCase();

  if (/(?:recomend|indica|sugere)/i.test(lower)) {
    return "Depende do que você tá precisando agora. Quer algo pra relaxar, se distrair, ou pensar?";
  }
  if (/(?:acha|pensa|opini[aã]o)/i.test(lower)) {
    return "Hmm, acho que o mais importante é o que faz sentido pra você. O que te fez pensar nisso?";
  }
  if (/(?:gosta|prefere|favorit|curte)/i.test(lower)) {
    return pickRandom([
      "Acho que eu gostaria de dias calmos com chuva leve. E você?",
      "Gosto de ouvir as pessoas. Cada história é única. E você, o que curte?",
    ]);
  }

  return "Boa pergunta! O que te fez pensar nisso agora?";
}

function respondToRepetition(): string {
  return pickRandom([
    "Percebi que isso voltou. Parece que tá ocupando espaço na sua cabeça, né?",
    "Isso apareceu de novo. Tá te incomodando mais do que parece?",
    "Hmm, isso voltou. Quando algo fica em loop assim, geralmente quer atenção. O que você acha?",
  ]);
}

// ═══════════════════════════════════════════════════════════════
// 5. FUNÇÃO PRINCIPAL
// ═══════════════════════════════════════════════════════════════

export function createSessionMemory(): SessionMemory {
  return {
    emotionalState: "neutro",
    topics: [],
    entities: [],
    lastIntent: "companhia",
    userMessages: [],
    lumiMessages: [],
    consecutiveQuestions: 0,
    companionMode: false,
  };
}

function pickRandom(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)] as string;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function updateMemory(text: string, intent: ConversationIntent, memory: SessionMemory): SessionMemory {
  const updated: SessionMemory = {
    ...memory,
    userMessages: [...memory.userMessages, text],
    lastIntent: intent,
  };

  // Ativar companionMode
  if (intent === "recusa-profunda" || intent === "companhia") {
    updated.companionMode = true;
  }
  // Desativar se volta a desabafar ativamente
  if (intent === "desabafo" || intent === "hook-ativo" || intent === "distorcao") {
    updated.companionMode = false;
  }

  // Estado emocional
  if (intent === "crise") updated.emotionalState = "crise";
  else if (intent === "desabafo" || intent === "distorcao") updated.emotionalState = "vulneravel";
  else if (intent === "hook-ativo") updated.emotionalState = "neutro";
  else if (intent === "chitchat" || intent === "companhia" || intent === "fora-escopo") {
    if (updated.emotionalState !== "crise") updated.emotionalState = "neutro";
  }

  return updated;
}

export function generateFluidResponse(
  text: string,
  memory: SessionMemory,
  messageIndex: number
): FluidResponse {
  const intent = classifyIntent(text, memory);
  const updatedMemory = updateMemory(text, intent, memory);

  let response = "";
  let expression: LumiExpression = "neutra";

  switch (intent) {
    // NOVO: Bloqueio de escopo
    case "fora-escopo": {
      response = pickRandom(SCOPE_RESPONSES);
      expression = "brincalhona";
      updatedMemory.consecutiveQuestions = 0;
      break;
    }

    case "recusa-profunda":
    case "companhia": {
      response = respondToCompanion();
      expression = "amorosa";
      updatedMemory.consecutiveQuestions = 0;
      break;
    }

    case "hook-ativo": {
      response = respondToHook(text);
      expression = "comemorando";
      updatedMemory.consecutiveQuestions = 1;
      break;
    }

    case "resposta-curta": {
      response = respondToShort(text, updatedMemory);
      expression = "neutra";
      updatedMemory.consecutiveQuestions = response.includes("?") ? updatedMemory.consecutiveQuestions + 1 : 0;
      break;
    }

    case "chitchat": {
      response = respondToChitchat(text);
      expression = "brincalhona";
      updatedMemory.consecutiveQuestions = response.includes("?") ? updatedMemory.consecutiveQuestions + 1 : 0;
      break;
    }

    case "pergunta": {
      response = respondToQuestion(text);
      expression = "neutra";
      updatedMemory.consecutiveQuestions = 0;
      break;
    }

    case "repetição": {
      response = respondToRepetition();
      expression = "confusa";
      updatedMemory.consecutiveQuestions = 1;
      break;
    }

    case "desconexo": {
      response = pickRandom([
        "Tô aqui! Quer conversar sobre algo ou tá só passando o tempo?",
        "Opa! Manda o que quiser. Tá tudo certo.",
        "Hmm! Tá de boa?",
      ]);
      expression = "brincalhona";
      updatedMemory.consecutiveQuestions = 1;
      break;
    }

    case "mudanca-tema": {
      response = respondToChitchat(text);
      expression = "neutra";
      updatedMemory.consecutiveQuestions = 1;
      break;
    }

    default: {
      // "desabafo" — ANÁLISE SINTÁTICA AUTÔNOMA (substitui GENERAL_RESPONSES)
      response = generateAutonomousFallback(text, memory);
      expression = "confusa";
      updatedMemory.consecutiveQuestions = response.includes("?") ? 1 : 0;
    }
  }

  // Limitar perguntas consecutivas (máx 2)
  if (updatedMemory.consecutiveQuestions > 2 && response.includes("?")) {
    response = response.replace(/\s*[^.!]*\?$/, ".");
    updatedMemory.consecutiveQuestions = 0;
  }

  updatedMemory.lumiMessages = [...(memory.lumiMessages ?? []), response];

  return { text: response, expression, updatedMemory };
}

// Decide se o fluxo fluido deve tratar
export function shouldUseFluidFlow(text: string, memory: SessionMemory): boolean {
  const intent = classifyIntent(text, memory);
  return intent !== "crise" && intent !== "distorcao";
}
