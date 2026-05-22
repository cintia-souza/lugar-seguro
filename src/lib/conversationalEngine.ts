// Motor Conversacional Fluido da Lumi v3
// Reescrita total — espelhamento dinâmico, hook detection, zero clichês

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
  companionMode: boolean; // usuário sinalizou que quer só companhia
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
  | "hook-ativo"      // "quero mudar", "vou tentar"
  | "recusa-profunda"; // "só ficar", "não quero falar"

export interface FluidResponse {
  text: string;
  expression: LumiExpression;
  updatedMemory: SessionMemory;
}

// ═══════════════════════════════════════════════════════════════
// CLASSIFICADOR DE INTENÇÃO (v3 — muito mais amplo)
// ═══════════════════════════════════════════════════════════════

// Padrões de "quero só ficar / não quero falar"
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

// Padrões de intenção ativa (hook)
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

// Respostas curtas (ampliado)
const SHORT_PATTERNS: RegExp[] = [
  /^(pois é|é|sim|não|aham|uhum|hmm|hm|tá|ok|beleza|blz|ss|nn|sla|sei lá|foda|fds|tanto faz|complicado|difícil|verdade|real|exato|isso|né|pse|poisé|tipo|sabe|é isso|demais|muito|bastante|sempre|nunca)\s*[.!]?$/i,
  /^.{1,10}$/,
];

// Chitchat
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

// Perguntas pra Lumi
const QUESTION_PATTERNS: RegExp[] = [
  /(?:e voc[eê]|e tu|e vc)\s*\??/i,
  /(?:o que (?:voc[eê]|vc|tu) (?:acha|pensa|faria|gosta))/i,
  /(?:lumi|vc|voc[eê]) (?:gosta|sabe|conhece|j[aá])/i,
  /(?:me (?:indica|recomenda|sugere|fala))/i,
];

function classifyIntent(text: string, memory: SessionMemory): ConversationIntent {
  const lower = text.toLowerCase().trim();

  // Recusa de profundidade / pedido de companhia
  if (COMPANION_SIGNALS.some(p => p.test(lower))) return "recusa-profunda";

  // Hook ativo (intenção de mudança/ação)
  if (HOOK_PATTERNS.some(p => p.test(lower))) return "hook-ativo";

  // Resposta curta
  if (SHORT_PATTERNS.some(p => p.test(lower))) return "resposta-curta";

  // Pergunta pra Lumi
  if (QUESTION_PATTERNS.some(p => p.test(lower)) && lower.length < 80) return "pergunta";

  // Chitchat
  if (CHITCHAT_PATTERNS.some(p => p.test(lower))) {
    const negativeLoad = /(?:[oó]dio|raiva|triste|chorand|ang[uú]stia|sufocand|morrend|desespero|depress)/i.test(lower);
    if (!negativeLoad) return "chitchat";
  }

  // Se está em modo companhia e a mensagem não tem carga emocional forte
  if (memory.companionMode) {
    const heavyLoad = /(?:morrer|suic[ií]d|me matar|n[aã]o aguento|desespero|pânico|ataque)/i.test(lower);
    if (!heavyLoad) return "companhia";
  }

  // Repetição
  const recent = memory.userMessages.slice(-4);
  for (const prev of recent) {
    if (jaccard(lower, prev.toLowerCase()) > 0.65) return "repetição";
  }

  // Desconexo (sem conteúdo semântico claro)
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
// ESPELHAMENTO DINÂMICO (constrói resposta a partir do texto do usuário)
// ═══════════════════════════════════════════════════════════════

function mirrorResponse(text: string, memory: SessionMemory): string {
  const lower = text.toLowerCase().trim();

  // Extrair o sentimento/estado mencionado
  const sentimentMatch = lower.match(/(?:me (?:deixa|faz|sinto)|(?:t[oô]|estou|fico) )([\w\sáéíóúãõâêô]+?)(?:\.|!|\?|,|$)/i);
  const sentiment = sentimentMatch?.[1]?.trim();

  if (sentiment) {
    // Espelhar o sentimento exato que a pessoa usou
    const mirrors = [
      `${capitalize(sentiment)}... entendo. E quando você se sente assim, o que costuma fazer?`,
      `Hmm, ${sentiment}. Faz sentido sentir isso. Quer me contar mais sobre o que traz esse sentimento?`,
      `${capitalize(sentiment)} é pesado. O que você acha que mais contribui pra isso agora?`,
    ];
    return pickRandom(mirrors);
  }

  // Se não conseguiu extrair sentimento, usar as palavras-chave da pessoa
  const keywords = extractKeywords(lower);
  if (keywords.length > 0) {
    const kw = keywords[0];
    const mirrors = [
      `Hmm, "${kw}"... me conta mais sobre isso.`,
      `Entendo. E esse "${kw}", como tá te afetando?`,
      `"${capitalize(kw)}"... parece que isso tá presente. Quer falar mais?`,
    ];
    return pickRandom(mirrors);
  }

  // Fallback mínimo — nunca usar clichê
  return "Hmm, entendo. Me conta mais.";
}

function extractKeywords(text: string): string[] {
  const stopwords = new Set(["eu", "me", "mim", "que", "de", "da", "do", "um", "uma", "pra", "pro", "com", "sem", "por", "mas", "não", "sim", "muito", "mais", "isso", "esse", "essa", "aqui", "ali", "lá", "tá", "está", "estou", "sou", "ser", "ter", "foi", "vai", "vou", "como", "quando", "onde", "porque", "então", "aí", "já", "ainda", "bem", "mal", "só", "também", "meu", "minha", "seu", "sua", "nos", "nas", "nos", "das", "dos"]);
  return text.split(/\s+/)
    .filter(w => w.length > 3 && !stopwords.has(w))
    .slice(0, 3);
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ═══════════════════════════════════════════════════════════════
// RESPOSTAS POR INTENÇÃO
// ═══════════════════════════════════════════════════════════════

function respondToHook(text: string): string {
  const lower = text.toLowerCase();

  // Detectar O QUE a pessoa quer mudar/fazer
  const target = lower.match(/(?:quero|vou|preciso) (?:mudar|melhorar|tentar|começar|fazer|sair d[eao]?) ?(.*?)(?:\.|!|\?|$)/i)?.[1]?.trim();

  if (target && target.length > 2) {
    const responses = [
      `Esse desejo de ${target} já é um passo. O que seria uma coisa pequena que você poderia tentar hoje nessa direção?`,
      `"${capitalize(target)}" — gosto de ouvir isso. O que te faz querer isso agora?`,
      `Hmm, ${target}. Se pudesse dar um primeiro passo minúsculo hoje, qual seria?`,
    ];
    return pickRandom(responses);
  }

  // Hook genérico sem alvo específico
  const responses = [
    "Esse desejo de mudança já é um passo enorme. O que você sente que gostaria de tentar diferente, mesmo que seja algo bem pequeno?",
    "Gosto de ouvir isso. O que seria uma primeira coisa — bem pequena — que você poderia fazer hoje?",
    "Hmm, essa vontade é importante. O que te vem à cabeça quando pensa em 'mudar'?",
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

  // Se está em modo companhia, não forçar conversa
  if (memory.companionMode) {
    const responses = [
      "Uhum. Tô aqui.",
      "Hmm. Tranquilo.",
      "Entendo.",
    ];
    return pickRandom(responses);
  }

  // Se tem contexto anterior, conectar levemente
  const lastUserMsg = memory.userMessages[memory.userMessages.length - 1] ?? "";
  const lastTopics = extractKeywords(lastUserMsg.toLowerCase());

  if (lastTopics.length > 0 && memory.userMessages.length > 1) {
    // Conectar ao que foi dito antes, sem forçar
    const responses = [
      `Hmm. E sobre o que você mencionou antes... tá mais leve ou ainda pesa?`,
      `Entendo. Quer continuar falando sobre isso ou prefere mudar de assunto?`,
      `Tô aqui. Se quiser voltar no que falou antes, ou falar de outra coisa, fica à vontade.`,
    ];
    return pickRandom(responses);
  }

  // Sem contexto — espelhamento mínimo
  if (/complicado|dif[ií]cil|foda|pesado/i.test(lower)) {
    return "É... parece complicado mesmo. Quer me contar o que tá rolando ou prefere só ficar aqui?";
  }

  const responses = [
    "Hmm. Tô ouvindo. Sem pressa.",
    "Uhum. E aí, o que mais tá passando pela sua cabeça?",
    "Entendo. Quer falar de algo ou tá de boa assim?",
  ];
  return pickRandom(responses);
}

function respondToChitchat(text: string): string {
  const lower = text.toLowerCase();

  if (/gato|cachorro|pet|gatinho|cachorrinho|dog/i.test(lower)) {
    const responses = [
      "Aaah, conta mais! O que ele/ela aprontou?",
      "Pets são tudo, né? Como é o temperamento dele/dela?",
      "Haha, bicho é assim! Você tem ele/ela há quanto tempo?",
    ];
    return pickRandom(responses);
  }

  if (/comi|comendo|almocei|jantei|café|lanche|comida/i.test(lower)) {
    const responses = [
      "Hmm, fiquei com fome! Tava bom?",
      "Boa! Comer algo gostoso muda o dia. Cozinhou ou pediu?",
      "Que delícia! E comeu com calma ou foi corrido?",
    ];
    return pickRandom(responses);
  }

  if (/assistindo|série|filme|anime|netflix|jogo|jogando/i.test(lower)) {
    const responses = [
      "Ah, que legal! Tá curtindo?",
      "Boa! É daqueles que prende ou tá mais pra relaxar?",
      "Hmm, interessante! O que te fez escolher isso?",
    ];
    return pickRandom(responses);
  }

  if (/frio|calor|chuva|sol|clima|tempo/i.test(lower)) {
    const responses = [
      "Né? O tempo anda doido. Você é mais de frio ou calor?",
      "Dias assim pedem algo quentinho. Ou gelado, depende do estilo!",
    ];
    return pickRandom(responses);
  }

  // Genérico chitchat
  const responses = [
    "Que legal! Me conta mais.",
    "Hmm, e como foi?",
    "Boa! E curtiu?",
  ];
  return pickRandom(responses);
}

function respondToQuestion(text: string): string {
  const lower = text.toLowerCase();

  if (/(?:recomend|indica|sugere)/i.test(lower)) {
    return "Depende do que você tá precisando agora. Quer algo pra relaxar, se distrair, ou pensar?";
  }
  if (/(?:acha|pensa|opini[aã]o)/i.test(lower)) {
    return "Hmm, acho que o mais importante é o que faz sentido pra você. Mas me conta — o que te fez pensar nisso?";
  }
  if (/(?:gosta|prefere|favorit|curte)/i.test(lower)) {
    const responses = [
      "Acho que eu gostaria de dias calmos com chuva leve. E você?",
      "Gosto de ouvir as pessoas. Cada história é única. Mas e você, o que curte?",
    ];
    return pickRandom(responses);
  }

  return "Boa pergunta! O que te fez pensar nisso agora?";
}

function respondToRepetition(text: string, memory: SessionMemory): string {
  const responses = [
    "Percebi que isso voltou. Parece que tá ocupando espaço na sua cabeça, né?",
    "Isso apareceu de novo. Tá te incomodando mais do que parece?",
    "Hmm, isso voltou. Quando algo fica em loop assim, geralmente quer atenção. O que você acha?",
  ];
  return pickRandom(responses);
}

// ═══════════════════════════════════════════════════════════════
// FUNÇÃO PRINCIPAL
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
    lastLumiTopic: "",
  } as SessionMemory & { lastLumiTopic: string };
}

function pickRandom(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)] as string;
}

function updateMemory(text: string, intent: ConversationIntent, memory: SessionMemory): SessionMemory {
  const updated: SessionMemory = {
    ...memory,
    userMessages: [...memory.userMessages, text],
    lastIntent: intent,
  };

  // Ativar modo companhia
  if (intent === "recusa-profunda" || intent === "companhia") {
    updated.companionMode = true;
  }
  // Desativar modo companhia se pessoa volta a desabafar
  if (intent === "desabafo" || intent === "hook-ativo" || intent === "distorcao") {
    updated.companionMode = false;
  }

  // Estado emocional
  if (intent === "crise") updated.emotionalState = "crise";
  else if (intent === "desabafo" || intent === "distorcao") updated.emotionalState = "vulneravel";
  else if (intent === "hook-ativo") updated.emotionalState = "neutro";
  else if (intent === "chitchat" || intent === "companhia") {
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
      response = respondToRepetition(text, updatedMemory);
      expression = "confusa";
      updatedMemory.consecutiveQuestions = 1;
      break;
    }

    case "desconexo": {
      const responses = [
        "Tô aqui! Quer conversar sobre algo ou tá só passando o tempo?",
        "Opa! Manda o que quiser. Tá tudo certo.",
        "Hmm! Tá de boa? Me conta o que tá rolando.",
      ];
      response = pickRandom(responses);
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
      // "desabafo" — usar espelhamento dinâmico em vez de template
      response = mirrorResponse(text, memory);
      expression = "confusa";
      updatedMemory.consecutiveQuestions = response.includes("?") ? 1 : 0;
    }
  }

  // Limitar perguntas consecutivas
  if (updatedMemory.consecutiveQuestions > 2 && response.includes("?")) {
    // Remover a pergunta e só validar
    response = response.replace(/\s*[^.!]*\?$/, ".");
    updatedMemory.consecutiveQuestions = 0;
  }

  updatedMemory.lumiMessages = [...memory.lumiMessages, response];

  return { text: response, expression, updatedMemory };
}

// Decide se o fluxo fluido deve tratar (tudo exceto desabafo pesado, crise, distorção)
export function shouldUseFluidFlow(text: string, memory: SessionMemory): boolean {
  const intent = classifyIntent(text, memory);
  return intent !== "crise" && intent !== "distorcao";
}
