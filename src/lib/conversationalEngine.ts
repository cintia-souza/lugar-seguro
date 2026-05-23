// Motor Conversacional Fluido da Lumi v5
// - Filtro de escopo rígido (bloqueia uso utilitário)
// - Análise sintática autônoma (Rogerian fallback dinâmico)
// - Context Lock em companionMode
// - Correção crítica de falsos positivos em Chitchat (Fome/Preguiça/Cansaço)

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
  | "chitchat-estagnado" // NOVO: Chitchat com barreira (preguiça, cansaço)
  | "companhia"
  | "resposta-curta"
  | "repetição"
  | "mudanca-tema"
  | "pergunta"
  | "desconexo"
  | "hook-ativo"
  | "recusa-profunda"
  | "fora-escopo";

export interface FluidResponse {
  text: string;
  expression: LumiExpression;
  updatedMemory: SessionMemory;
}

// ═══════════════════════════════════════════════════════════════
// 1. FILTRO DE ESCOPO (Out-of-Scope Blocker)
// ═══════════════════════════════════════════════════════════════

const OUT_OF_SCOPE_TOKENS: RegExp[] = [
  /\b(javascript|typescript|python|java|html|css|react|node|api|código|codigo|programar|programação|algoritmo|função|variável|array|objeto|classe|import|export|console|debug|deploy|git|github|docker|sql|banco de dados|framework|library|npm|pip)\b/i,
  /\b(traduz|traduzir|tradução|resumir|resumo|calcul[ae]|equação|fórmula|matemática|física|química|biologia|história|geografia)\b/i,
  /\b(cri[ae] um|faz um|gera um|escreve um|monta um|desenvolve)\s+(código|script|programa|site|app|sistema|bot|planilha|texto|artigo|redação|trabalho|relatório)\b/i,
  /\b(pesquis[ae]|busca|google|wikipedia|explica? como funciona|me ensina|tutorial|passo a passo)\b/i,
  /\b(prova de|trabalho de|lição de|exercício de|questão de)\s+(matemática|português|inglês|física|química|história|biologia|geografia)\b/i,
];

function isOutOfScope(text: string): boolean {
  return OUT_OF_SCOPE_TOKENS.some(p => p.test(text));
}

const SCOPE_RESPONSES: string[] = [
  "Eu sou a Lumi, seu espacinho de acolhimento aqui no app. Não consigo ajudar com tarefas técnicas, mas se quiser conversar sobre como está se sentindo, tô aqui.",
  "Hmm, isso tá fora do que eu consigo fazer. Meu mundo é sobre sentimentos e autocuidado. Quer conversar sobre como tá o seu dia?",
  "Olha, eu não entendo dessas coisas técnicas — meu talento é ouvir e fazer companhia. Se quiser desabafar ou só ficar aqui, tô disponível.",
];

// ═══════════════════════════════════════════════════════════════
// 2. CLASSIFICADOR DE INTENÇÃO (Refatorado contra falsos positivos)
// ═══════════════════════════════════════════════════════════════

const COMPANION_SIGNALS: RegExp[] = [
  /s[oó] ficar/i, /ficar (por )?aqui/i, /n[aã]o (quero|preciso|vou) (falar|desabafar|contar)/i,
  /s[oó] (quero|preciso)? ?(de)? ?companhia/i, /n[aã]o (tenho|sei) o que (falar|dizer)/i,
  /tanto faz/i, /s[oó] (estar|ficar) aqui/i, /pode (s[oó])? ?ficar (aqui|comigo)/i,
  /n[aã]o quero pensar/i, /deixa quieto/i, /sem assunto/i,
];

const HOOK_PATTERNS: RegExp[] = [
  /quero (mudar|melhorar|tentar|começar|fazer|sair)/i, /vou (tentar|mudar|fazer|começar|conseguir)/i,
  /preciso (mudar|sair|melhorar|fazer)/i, /quero (sim|muito|demais)/i,
  /t[oô] (decidid[oa]|determinad[oa]|pronta?)/i, /bora|vamos|partiu/i,
  /como (eu )?(faço|começo|mudo|saio)/i, /o que (eu )?(posso|devo|consigo) fazer/i,
  /me ajuda (a|com)/i, /quero (aprender|entender|descobrir)/i,
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

// Captura barreiras físicas/emocionais atreladas a necessidades cotidianas
const ESTAGNATION_TRIGGERS = /(?:preguiça|cansad[oa]|sem energia|dif[ií]cil|exaust[oa]|sem vontade|pesado)/i;

const QUESTION_PATTERNS: RegExp[] = [
  /(?:e voc[eê]|e tu|e vc)\s*\??/i,
  /(?:o que (?:voc[eê]|vc|tu) (?:acha|pensa|faria|gosta))/i,
  /(?:lumi|vc|voc[eê]) (?:gosta|sabe|conhece|j[aá])/i,
];

function classifyIntent(text: string, memory: SessionMemory): ConversationIntent {
  const lower = text.toLowerCase().trim();

  // 1. PRIMEIRO: Filtro de escopo rígido
  if (isOutOfScope(lower)) return "fora-escopo";

  // 2. SEGUNDO: Recusa de profundidade / pedido de companhia
  if (COMPANION_SIGNALS.some(p => p.test(lower))) return "recusa-profunda";

  // 3. TERCEIRO: Hook ativo de mudança
  if (HOOK_PATTERNS.some(p => p.test(lower))) return "hook-ativo";

  // 4. QUARTO: Resposta curta ou afirmação (Ex: "só estou cansada", "pois é")
  // Movido para cima para evitar que afirmações curtas caiam no Jaccard de repetição
  if (SHORT_PATTERNS.some(p => p.test(lower)) || lower.split(/\s+/).length <= 3) {
    // Se o usuário está só repetindo uma palavra curta no modo companhia, mantém o lock
    if (memory.companionMode) return "resposta-curta";
    
    // Se a frase tem menos de 3 palavras, tratamos como resposta/afirmação direta
    return "resposta-curta";
  }

  // 5. QUINTO: Pergunta pra Lumi
  if (QUESTION_PATTERNS.some(p => p.test(lower)) && lower.length < 80) return "pergunta";

  // 6. SEXTO: Chitchat e Chitchat Estagnado
  if (CHITCHAT_PATTERNS.some(p => p.test(lower))) {
    const negativeLoad = /(?:[oó]dio|raiva|triste|chorand|ang[uú]stia|sufocand|morrend|desespero|depress)/i.test(lower);
    if (negativeLoad) return "desabafo";
    if (ESTAGNATION_TRIGGERS.test(lower)) return "chitchat-estagnado";
    return "chitchat";
  }

  // 7. SÉTIMO: Context Lock do modo Companhia
  if (memory.companionMode) {
    const heavyLoad = /(?:morrer|suic[ií]d|me matar|n[aã]o aguento|desespero|pânico|ataque)/i.test(lower);
    if (!heavyLoad) return "companhia";
  }

  // 8. OITAVO: Repetição Real (Loop de pensamentos)
  // Mudança: Só valida repetição se houver pelo menos 3 mensagens no histórico 
  // e ignora se o usuário estiver apenas respondendo à pergunta anterior da Lumi
  if (memory.userMessages.length >= 3) {
    const recent = memory.userMessages.slice(-4, -1); // Ignora a mensagem imediatamente anterior
    for (const prev of recent) {
      if (jaccard(lower, prev.toLowerCase()) > 0.75) return "repetição"; // Subiu o limiar para 0.75
    }
  }

  // 9. NONO: Desconexo
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
// ═══════════════════════════════════════════════════════════════

const STOPWORDS = new Set([
  "eu", "me", "mim", "que", "de", "da", "do", "um", "uma", "pra", "pro",
  "com", "sem", "por", "mas", "não", "sim", "muito", "mais", "isso", "esse",
  "essa", "aqui", "ali", "lá", "tá", "está", "estou", "sou", "ser", "ter",
  "foi", "vai", "vou", "como", "quando", "onde", "porque", "então", "aí",
  "já", "ainda", "bem", "mal", "só", "também", "meu", "minha", "seu", "sua",
  "nos", "nas", "dos", "das", "uns", "umas", "num", "numa", "dele", "dela",
  "nele", "nela", "pelo", "pela", "todo", "toda", "todos", "todas", "cada",
  "ficar", "fazer", "falar", "dizer", "saber", "poder", "querer", "deixar"
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
  const lower = text.toLowerCase().trim();
  const sentiment = extractSentiment(text);
  const significantWords = extractSignificantWords(text);

  // 1. Tratamento específico para o desabafo de "tudo dar errado" / frustração contínua
  if (/(?:nunca|nada|tudo)\s+(?:da|dá)\s+(?:certo|errado)/i.test(lower) || /cansad[oa]\s+de/i.test(lower)) {
    const respostasFrustracao = [
      "É extremamente exaustivo sentir que você tá nadando contra a corrente o tempo todo. Às vezes parece que o esforço não compensa, né?",
      "Essa sensação de que nada engrena cansa o corpo e a mente. Parece que a gente gasta uma energia enorme pra não sair do lugar...",
      "Quando acumula tudo assim, dá uma sensação de impotência muito pesada. Tô aqui te ouvindo, viu? Pode soltar o peso."
    ];
    return pickRandom(respostasFrustracao);
  }

  // 2. Se o usuário trouxe um sentimento explícito válido (cansada, triste, angustiada)
  if (sentiment && sentiment.length > 2 && sentiment.length < 20) {
    const templatesSentimento = [
      `Carregar esse peso de estar ${sentiment} não é fácil. Quer colocar isso pra fora ou prefere só desanuviar um pouco?`,
      `Respeita esse momento de estar ${sentiment}. Se quiser me contar o que disparou isso hoje, tô aqui. Se não, tudo bem também.`
    ];
    return pickRandom(templatesSentimento);
  }

  // 3. ROGERIAN SUAVE: Se houver palavras significativas, contextualizar sem repetir como um papagaio
  if (significantWords.length > 0) {
    const bestWord = significantWords.sort((a, b) => b.length - a.length)[0] as string;

    // Bloqueia palavras vazias de significado emocional que passaram pelas stopwords (ex: "impressão", "parece")
    const palavrasProibidas = ["impressao", "impressão", "parece", "acho", "coisa", "coisas", "tenho"];
    
    if (!palavrasProibidas.includes(bestWord)) {
      const templatesSuaves = [
        `Imagino que lidar com tudo isso envolvendo ${bestWord} esteja te desgastando bastante...`,
        `Essa questão de ${bestWord} parece que mexeu com você de um jeito mais profundo hoje, né?`,
        `Às vezes, quando as coisas chegam nesse ponto com ${bestWord}, a gente só precisa de um espaço pra respirar.`
      ];
      return pickRandom(templatesSuaves);
    }
  }

  // 4. FALLBACK HUMANO DE CONTINUIDADE (Sem repetir palavras do usuário)
  const continuidades = [
    "Tô te acompanhando. Às vezes é difícil até organizar o que tá sentindo de tão confuso que fica tudo, né?",
    "É foda quando chega nesse limite onde tudo pesa. Pode continuar falando, tô aqui prestando atenção.",
    "Entendo... É um cansaço que vai além do corpo, né? Fica à vontade para desabafar no seu ritmo."
  ];
  return pickRandom(continuidades);
}

// ═══════════════════════════════════════════════════════════════
// 4. RESPOSTAS POR INTENÇÃO CONTEXTUALIZADA
// ═══════════════════════════════════════════════════════════════

// NOVO: Resposta inteligente para quando o usuário quer fazer algo cotidiano mas está sem forças
function respondToChitchatEstagnado(text: string): string {
  const lower = text.toLowerCase();
  
  if (/comida|fazer|cozinhar|comer/i.test(lower)) {
    return pickRandom([
      "Bate uma preguiça enorme mesmo quando a energia tá baixa. Tem algo pronto ou fácil que você consiga beliscar por aí, sem se cobrar?",
      "Cozinhar cansada é um desafio mesmo. Se não conseguir fazer nada agora, tá tudo bem. Consegue pedir algo ou pegar algo bem simples?",
      "Respeita seu cansaço. Às vezes comer um lanche rápido ou o que tiver mais fácil é o melhor caminho pro momento."
    ]);
  }
  
  return pickRandom([
    "Quando o corpo pede uma pausa, até o que é simples fica pesado. Não se força, tá?",
    "Entendo perfeitamente. Às vezes a melhor escolha é só aceitar a preguiça e descansar um pouco."
  ]);
}

function respondToChitchat(text: string): string {
  const lower = text.toLowerCase();

  // Validação interna contextual real
  if (/gato|cachorro|pet|gatinho|cachorrinho|dog/i.test(lower)) {
    return pickRandom([
      "Aaah, conta mais! O que ele/ela aprontou?",
      "Pets são tudo, né? Como é o temperamento dele/dela?",
    ]);
  }

  if (/comi|comendo|almocei|jantei|café|lanche|comida/i.test(lower)) {
    // Se a frase contiver sinais de que ele ainda vai fazer ou está com dificuldade, desvia
    if (/vou fazer|tentando|dif[ií]cil/i.test(lower)) {
      return "Fazer comida exige uma energia que às vezes a gente simplesmente não tem. Vai no seu ritmo.";
    }
    return pickRandom([
      "Hmm! Tava gostoso?",
      "Boa! Comer algo gostoso muda o dia. Cozinhou ou pediu?",
    ]);
  }

  return pickRandom([
    "Que legal! Me conta mais.",
    "Hmm, e como foi?",
  ]);
}

function respondToHook(text: string): string {
  const lower = text.toLowerCase();
  const target = lower.match(/(?:quero|vou|preciso) (?:mudar|melhorar|tentar|começar|fazer|sair d[eao]?) ?(.*?)(?:\.|!|\?|$)/i)?.[1]?.trim();

  if (target && target.length > 2) {
    return `Esse desejo de ${target} já é um passo. O que seria uma coisa bem pequena que você poderia tentar hoje?`;
  }
  return "Esse desejo de mudança já é um passo enorme. O que você sente que gostaria de tentar diferente, mesmo que seja algo bem pequeno?";
}

function respondToCompanion(): string {
  return pickRandom([
    "Tudo bem. Podemos só ficar aqui juntos. Se quiser falar algo depois, estou aqui.",
    "Beleza. Fico aqui com você. Sem pressa, sem assunto obrigatório.",
  ]);
}

function respondToShort(text: string, memory: SessionMemory): string {
  if (memory.companionMode) {
    return pickRandom(["Uhum.", "Tô aqui.", "Hmm.", "Entendo."]);
  }

  if (memory.userMessages.length > 1) {
    const lastMsg = memory.userMessages[memory.userMessages.length - 2] ?? "";
    const lastWords = extractSignificantWords(lastMsg);
    if (lastWords.length > 0) {
      return `Hmm. E sobre aquilo que você mencionou... quer continuar falando ou prefere mudar de assunto?`;
    }
  }

  return "Hmm. Tô ouvindo. Fica à vontade.";
}

function respondToQuestion(text: string): string {
  return "Boa pergunta! O que te fez pensar nisso agora?";
}

function respondToRepetition(): string {
  return "Percebi que isso voltou. Parece que tá ocupando espaço na sua cabeça, né?";
}

// ═══════════════════════════════════════════════════════════════
// 5. FUNÇÃO PRINCIPAL E FLUXO DE EXECUÇÃO
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

  if (intent === "recusa-profunda" || intent === "companhia") {
    updated.companionMode = true;
  }
  if (intent === "desabafo" || intent === "hook-ativo" || intent === "chitchat-estagnado") {
    updated.companionMode = false;
  }

  if (intent === "crise") updated.emotionalState = "crise";
  else if (intent === "desabafo") updated.emotionalState = "vulneravel";
  else if (intent === "hook-ativo" || intent === "chitchat-estagnado") updated.emotionalState = "neutro";

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
      response = respondToShort(text, memory); // Passa a memória antiga para evitar recursão cega
      expression = "neutra";
      updatedMemory.consecutiveQuestions = response.includes("?") ? updatedMemory.consecutiveQuestions + 1 : 0;
      break;
    }

    case "chitchat-estagnado": {
      response = respondToChitchatEstagnado(text);
      expression = "cansada";
      updatedMemory.consecutiveQuestions = response.includes("?") ? 1 : 0;
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
      response = "Tô aqui acompanhando você no seu tempo. Se quiser falar de algo, manda bala.";
      expression = "neutra";
      updatedMemory.consecutiveQuestions = 0;
      break;
    }

    default: {
      response = generateAutonomousFallback(text, memory);
      expression = "neutra";
      updatedMemory.consecutiveQuestions = response.includes("?") ? 1 : 0;
    }
  }

  // Guardrail para evitar looping de interrogações
  if (updatedMemory.consecutiveQuestions > 2 && response.includes("?")) {
    response = response.replace(/\s*[^.!]*\?$/, ".");
    updatedMemory.consecutiveQuestions = 0;
  }

  // AUTENTICIDADE ADAPTATIVA: calibrar tamanho da resposta ao input
  const userWordCount = text.split(/\s+/).length;
  if (userWordCount <= 4 && response.length > 120) {
    // Input curto → resposta curta (cortar na primeira frase)
    const firstSentence = response.match(/^[^.!?]+[.!?]/)?.[0];
    if (firstSentence && firstSentence.length > 20) {
      response = firstSentence;
    }
  }

  updatedMemory.lumiMessages = [...(memory.lumiMessages ?? []), response];

  return { text: response, expression, updatedMemory };
}

export function shouldUseFluidFlow(text: string, memory: SessionMemory): boolean {
  const intent = classifyIntent(text, memory);
  return intent !== "crise" && intent !== "distorcao";
}