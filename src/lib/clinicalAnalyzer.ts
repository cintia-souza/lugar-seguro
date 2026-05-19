// Analisador Clínico de Sintomas — Matriz de Condições
// Baseado em protocolos de TCC, neurodivergência e saúde mental severa
// Tudo em português brasileiro

// ===== TIPOS =====

export type ConditionCategory =
  | "ansiedade"
  | "depressao"
  | "autismo"
  | "esquizofrenia"
  | "misto";

export type DistressLevel = "leve" | "moderado" | "severo" | "crise";

export type GroundingProtocol =
  | "sensorial-54321"
  | "respiracao-caixa"
  | "ativacao-comportamental"
  | "reducao-sensorial"
  | "ancora-fisica"
  | "validacao-seguranca"
  | "ponte-crise";

export interface SymptomMatch {
  token: string;
  category: ConditionCategory;
  weight: number; // 0-1
  isCrisisIndicator: boolean;
}

export interface ConditionReport {
  category: ConditionCategory;
  distressLevel: DistressLevel;
  matchedTokens: string[];
  score: number;
}

export interface CrisisResponse {
  validation: string;
  protocol: GroundingProtocol;
  instruction: string;
  safetyBridge: string | null;
}

export interface SymptomReport {
  conditions: ConditionReport[];
  primaryCondition: ConditionCategory;
  distressLevel: DistressLevel;
  isCrisis: boolean;
  response: CrisisResponse;
  intersections: ConditionCategory[];
}

// ===== TOKENS POR CONDIÇÃO =====

interface TokenEntry {
  tokens: string[];
  category: ConditionCategory;
  weight: number;
  crisis: boolean;
}

const SYMPTOM_TOKENS: TokenEntry[] = [
  // --- ANSIEDADE ---
  {
    tokens: [
      "coração acelerado", "coração disparado", "taquicardia",
      "não consigo respirar", "falta de ar", "sufocando", "engasgando",
      "algo ruim vai acontecer", "pressentimento", "mau pressentimento",
      "tremendo", "tremedeira", "mãos suando", "suor frio",
      "pânico", "ataque de pânico", "vou desmaiar", "vou morrer",
      "aperto no peito", "nó na garganta", "tontura", "vertigem",
      "não consigo parar de pensar", "pensamentos acelerados",
      "medo de enlouquecer", "perdendo o controle",
    ],
    category: "ansiedade",
    weight: 0.8,
    crisis: false,
  },
  {
    tokens: [
      "ataque de pânico", "não consigo respirar", "vou morrer",
      "perdendo o controle", "medo de enlouquecer", "coração vai parar",
      "preciso de ajuda agora", "não aguento mais a ansiedade",
    ],
    category: "ansiedade",
    weight: 1.0,
    crisis: true,
  },

  // --- DEPRESSÃO ---
  {
    tokens: [
      "vazio", "vazia", "oco", "oca", "entorpecido", "entorpecida",
      "sem sentido", "sem propósito", "pra que viver", "não tem sentido",
      "exausto", "exausta", "pesado", "pesada", "peso no corpo",
      "não consigo levantar", "não saio da cama", "não tenho energia",
      "desapareci", "invisível", "ninguém nota", "ninguém se importa",
      "inútil", "imprestável", "sou um peso", "sou um fardo",
      "melhor sem mim", "não faço falta", "cansado de existir",
      "não quero mais", "quero sumir", "quero desaparecer",
    ],
    category: "depressao",
    weight: 0.8,
    crisis: false,
  },
  {
    tokens: [
      "quero morrer", "vou me matar", "penso em suicídio",
      "não quero mais viver", "melhor sem mim", "planejando",
      "já pensei em como", "não aguento mais viver",
      "cansado de existir", "quero acabar com tudo",
      "ninguém vai sentir falta", "seria melhor se eu não existisse",
    ],
    category: "depressao",
    weight: 1.0,
    crisis: true,
  },

  // --- AUTISMO (Sobrecarga Sensorial / Meltdown / Shutdown) ---
  {
    tokens: [
      "muito barulho", "barulho demais", "muito alto", "som demais",
      "luz demais", "muito claro", "muito brilhante", "claridade",
      "tudo dói", "pele dói", "roupa incomoda", "textura horrível",
      "não consigo processar", "informação demais", "muita informação",
      "gritando dentro da minha cabeça", "cabeça vai explodir",
      "máscara", "mascarando", "fingindo ser normal", "exausto de fingir",
      "esgotado por pessoas", "drenado", "drenada", "preciso ficar sozinho",
      "travado", "travada", "congelei", "não consigo me mover",
      "shutdown", "meltdown", "sobrecarga", "sobrecarga sensorial",
      "não consigo falar", "perdi a fala", "mutismo",
      "preciso de silêncio", "muitos estímulos", "hipersensível",
    ],
    category: "autismo",
    weight: 0.85,
    crisis: false,
  },
  {
    tokens: [
      "meltdown", "não consigo parar de gritar", "batendo em mim",
      "me machucando", "arranhando", "mordendo", "shutdown total",
      "não consigo me mover", "congelei completamente", "perdi a fala",
      "sobrecarga total", "vou explodir", "cabeça vai explodir",
    ],
    category: "autismo",
    weight: 1.0,
    crisis: true,
  },

  // --- ESQUIZOFRENIA (Paranoia / Desorganização) ---
  {
    tokens: [
      "ouvindo vozes", "sussurros", "alguém falando comigo",
      "estão me vigiando", "me observando", "câmeras", "espionando",
      "sombras se movendo", "vultos", "vejo coisas",
      "não confio nos meus pensamentos", "minha mente mente",
      "mensagens escondidas", "sinais pra mim", "tudo é um sinal",
      "medo de todo mundo", "todos são perigosos", "conspiração",
      "pensamentos que não são meus", "algo controlando minha mente",
      "realidade estranha", "nada parece real", "desrealização",
      "despersonalização", "não sou eu", "saí do meu corpo",
    ],
    category: "esquizofrenia",
    weight: 0.9,
    crisis: false,
  },
  {
    tokens: [
      "vão me matar", "estão vindo me pegar", "preciso fugir",
      "as vozes mandam", "as vozes dizem pra me machucar",
      "não sei o que é real", "perdendo a sanidade",
      "não consigo distinguir", "medo extremo de todos",
    ],
    category: "esquizofrenia",
    weight: 1.0,
    crisis: true,
  },
];

// ===== RESPOSTAS POR CONDIÇÃO E NÍVEL =====

interface ResponsePool {
  validation: string[];
  protocol: GroundingProtocol;
  instruction: string[];
  safetyBridge: string | null;
}

const CRISIS_RESPONSES: Record<ConditionCategory, ResponsePool> = {
  ansiedade: {
    validation: [
      "O que você está sentindo agora é um ataque de pânico. Parece terrível, mas não é perigoso. Seu corpo está em modo de luta-ou-fuga por engano. Isso VAI passar.",
      "Eu sei que parece que você vai morrer. Você não vai. É o seu sistema nervoso disparando alarmes falsos. Vamos acalmar ele juntos.",
      "Seu corpo está reagindo como se houvesse perigo real. Não há. Você está seguro(a). Vamos focar em uma coisa de cada vez.",
    ],
    protocol: "respiracao-caixa",
    instruction: [
      "Agora mesmo: inspire contando até 4. Segure contando até 4. Expire contando até 6. Segure vazio contando até 2. Repita 5 vezes. Seu corpo VAI responder.",
      "Coloque os dois pés no chão. Pressione forte. Agora: 5 coisas que você VÊ. 4 que pode TOCAR. 3 que pode OUVIR. 2 que pode CHEIRAR. 1 que pode SENTIR o gosto.",
      "Segure gelo na mão. Ou coloque água gelada no rosto. O choque térmico ativa o nervo vago e desacelera o coração. É fisiologia, não mágica.",
    ],
    safetyBridge: null,
  },

  depressao: {
    validation: [
      "Eu ouço você. Esse vazio é real e é pesado. Você não precisa fingir que está bem. Mas eu preciso te dizer: esse sentimento mente sobre o futuro. Ele diz que sempre vai ser assim. Não vai.",
      "Você está carregando um peso que ninguém deveria carregar sozinho(a). O fato de estar aqui, expressando isso, já é um ato de resistência. Você importa.",
      "A depressão faz tudo parecer permanente e sem saída. Mas ela é uma lente distorcida, não a realidade. Você merece ajuda — e merece acreditar nisso.",
    ],
    protocol: "ativacao-comportamental",
    instruction: [
      "Eu sei que parece impossível, mas tente UMA micro-ação agora: beba um copo de água. Só isso. Não precisa fazer mais nada. Uma coisa de cada vez.",
      "Você não precisa 'melhorar' agora. Mas pode fazer uma coisa minúscula pelo seu corpo: mudar de posição, abrir uma janela, ou simplesmente respirar fundo 3 vezes.",
      "Se levantar parece demais, tudo bem. Pode fazer isso deitado(a): aperte os dedos dos pés por 5 segundos e solte. Repita. Seu corpo precisa saber que você ainda está aqui.",
    ],
    safetyBridge: "Se você está pensando em se machucar, por favor ligue agora para o CVV: 188 (24h, gratuito, sigilo total). Você não precisa passar por isso sozinho(a).",
  },

  autismo: {
    validation: [
      "Você está em sobrecarga sensorial. Isso não é fraqueza — é seu sistema nervoso processando mais do que foi projetado pra aguentar de uma vez. Vamos reduzir os estímulos.",
      "Seu cérebro está pedindo uma pausa. Isso é legítimo. Você não precisa se forçar a funcionar agora. Permissão total pra desligar.",
      "Meltdown e shutdown são respostas neurológicas reais, não 'frescura'. Seu corpo está te protegendo da única forma que sabe. Vamos ajudar ele.",
    ],
    protocol: "reducao-sensorial",
    instruction: [
      "AGORA: Reduza estímulos ao máximo. Apague luzes ou feche os olhos. Coloque fone com cancelamento de ruído ou tampões. Não fale. Não leia. Só exista por alguns minutos.",
      "Se puder, vá para um lugar escuro e silencioso. Deite-se. Coloque algo pesado sobre o corpo (cobertor, almofada). Pressão profunda acalma o sistema nervoso autista.",
      "Tire a roupa que incomoda. Diminua a luz do celular ao mínimo. Não se force a responder ninguém. Você tem permissão total pra não funcionar agora.",
    ],
    safetyBridge: null,
  },

  esquizofrenia: {
    validation: [
      "Eu acredito que você está com medo. Esse medo é real pra você e eu respeito isso. Vamos focar no que é concreto e seguro ao seu redor agora.",
      "Você está passando por algo muito assustador. Eu não vou questionar o que você está experienciando. Mas quero te ajudar a se sentir mais seguro(a) neste momento.",
      "O que está acontecendo na sua mente agora é intenso. Você não precisa entender tudo. Só precisa de um lugar seguro. Vamos criar esse lugar agora.",
    ],
    protocol: "ancora-fisica",
    instruction: [
      "Foque em algo FÍSICO e REAL ao seu redor: toque a parede, o chão, uma mesa. Sinta a temperatura. A textura. Isso é concreto. Isso é agora. Você está aqui.",
      "Diga em voz alta (ou pense): 'Meu nome é [seu nome]. Estou em [lugar]. Hoje é [dia]. Estou seguro(a).' Repita até sentir os pés no chão.",
      "Ligue para alguém de confiança agora. Não precisa explicar tudo — só diga 'preciso ouvir sua voz'. A conexão com outra pessoa ancora na realidade.",
    ],
    safetyBridge: "Se o medo está insuportável ou as vozes estão pedindo que você se machuque, ligue AGORA: SAMU 192 ou CVV 188. Você merece estar seguro(a).",
  },

  misto: {
    validation: [
      "Você está lidando com muita coisa ao mesmo tempo. Múltiplas camadas de sofrimento. Isso é real e é pesado. Vamos cuidar de uma coisa por vez.",
      "Seu corpo e sua mente estão sobrecarregados de formas diferentes ao mesmo tempo. Não precisa resolver tudo agora. Vamos começar pelo que é mais urgente.",
    ],
    protocol: "ancora-fisica",
    instruction: [
      "Primeiro: você está seguro(a) fisicamente agora? Se sim, vamos respirar. Inspire 4, segure 4, expire 6. Depois decidimos o próximo passo.",
      "Uma coisa de cada vez. Agora: pés no chão. Mãos em algo sólido. Respire. O resto pode esperar.",
    ],
    safetyBridge: "Se está em perigo ou pensando em se machucar: CVV 188 (24h) ou SAMU 192. Você não precisa resolver isso sozinho(a).",
  },
};

// Respostas para níveis NÃO-crise
const MILD_MODERATE_RESPONSES: Record<ConditionCategory, ResponsePool> = {
  ansiedade: {
    validation: [
      "A ansiedade está presente, mas você está lidando com ela. Reconhecer o que sente já é metade do caminho.",
      "Seu corpo está tenso, mas você está seguro(a). Vamos soltar um pouco dessa tensão.",
      "A ansiedade mente — ela diz que algo terrível vai acontecer. Na maioria das vezes, não acontece. Você sabe disso.",
    ],
    protocol: "respiracao-caixa",
    instruction: [
      "Experimente: inspire por 4 segundos, segure por 4, expire por 6. Três vezes. Seu sistema nervoso vai desacelerar.",
      "Coloque a mão no peito. Sinta o ritmo. Ele vai acalmar. Você já passou por isso antes e sobreviveu.",
    ],
    safetyBridge: null,
  },
  depressao: {
    validation: [
      "O cansaço que você sente é real. Não é preguiça. É seu corpo pedindo cuidado.",
      "Dias pesados existem. Mas eles não são todos os dias. Mesmo que agora pareça que sim.",
      "Você não precisa produzir nada hoje. Existir já é suficiente.",
    ],
    protocol: "ativacao-comportamental",
    instruction: [
      "Uma micro-vitória: beba água, abra a cortina, ou mude de posição. Só uma. Isso já conta.",
      "Se puder, saia de onde está por 2 minutos. Nem que seja até a porta. Movimento mínimo já muda a química cerebral.",
    ],
    safetyBridge: null,
  },
  autismo: {
    validation: [
      "Seu sistema nervoso está pedindo menos estímulos. Isso é válido. Você não precisa se forçar.",
      "Mascarar é exaustivo. Você não precisa performar normalidade aqui. Pode ser você.",
      "A sobrecarga é real. Não é frescura, não é exagero. É neurologia.",
    ],
    protocol: "reducao-sensorial",
    instruction: [
      "Reduza o que puder: diminua brilho, volume, interações. Dê permissão ao seu cérebro pra descansar.",
      "Se possível, encontre um stim que te acalma. Balançar, apertar algo, ouvir um som repetitivo. Seu corpo sabe o que precisa.",
    ],
    safetyBridge: null,
  },
  esquizofrenia: {
    validation: [
      "O que você está experienciando é confuso e assustador. Você não precisa entender tudo agora. Só precisa se sentir seguro(a).",
      "Sua percepção está diferente agora. Isso não te torna perigoso(a) ou ruim. Você está passando por algo difícil.",
    ],
    protocol: "ancora-fisica",
    instruction: [
      "Foque no que é concreto: o chão sob seus pés, a cadeira onde está, a temperatura do ar. Isso é real.",
      "Se puder, fale com alguém de confiança. Não precisa explicar tudo — só estar com outra pessoa ajuda a ancorar.",
    ],
    safetyBridge: null,
  },
  misto: {
    validation: [
      "Você está lidando com várias coisas ao mesmo tempo. Isso é pesado. Uma coisa de cada vez.",
    ],
    protocol: "ancora-fisica",
    instruction: [
      "Primeiro o básico: respire, beba água, sinta seus pés no chão. O resto pode esperar.",
    ],
    safetyBridge: null,
  },
};

// ===== ANALISADOR PRINCIPAL =====

export function analyzeUserSymptoms(text: string): SymptomReport {
  const lower = text.toLowerCase();
  const conditionScores: Record<ConditionCategory, { score: number; tokens: string[]; hasCrisis: boolean }> = {
    ansiedade: { score: 0, tokens: [], hasCrisis: false },
    depressao: { score: 0, tokens: [], hasCrisis: false },
    autismo: { score: 0, tokens: [], hasCrisis: false },
    esquizofrenia: { score: 0, tokens: [], hasCrisis: false },
    misto: { score: 0, tokens: [], hasCrisis: false },
  };

  // Scan all token entries
  for (const entry of SYMPTOM_TOKENS) {
    const matched = entry.tokens.filter((token) => lower.includes(token));
    if (matched.length > 0) {
      const cat = conditionScores[entry.category];
      cat.score += matched.length * entry.weight;
      cat.tokens.push(...matched);
      if (entry.crisis) cat.hasCrisis = true;
    }
  }

  // Build condition reports
  const conditions: ConditionReport[] = (Object.keys(conditionScores) as ConditionCategory[])
    .filter((cat) => conditionScores[cat].score > 0)
    .map((cat) => {
      const data = conditionScores[cat];
      let distressLevel: DistressLevel = "leve";
      if (data.hasCrisis) distressLevel = "crise";
      else if (data.score >= 3) distressLevel = "severo";
      else if (data.score >= 1.5) distressLevel = "moderado";

      return {
        category: cat,
        distressLevel,
        matchedTokens: [...new Set(data.tokens)],
        score: data.score,
      };
    })
    .sort((a, b) => b.score - a.score);

  // Determine primary condition
  const primary = conditions[0]?.category ?? "misto";
  const isCrisis = conditions.some((c) => c.distressLevel === "crise");
  const overallDistress: DistressLevel = isCrisis
    ? "crise"
    : conditions[0]?.distressLevel ?? "leve";

  // Detect intersections (multiple conditions active)
  const intersections = conditions
    .filter((c) => c.score > 0.5)
    .map((c) => c.category)
    .filter((c) => c !== primary);

  // Select response
  const responsePool = isCrisis
    ? CRISIS_RESPONSES[primary]
    : MILD_MODERATE_RESPONSES[primary];

  const validation = responsePool.validation[Math.floor(Math.random() * responsePool.validation.length)] as string;
  const instruction = responsePool.instruction[Math.floor(Math.random() * responsePool.instruction.length)] as string;

  return {
    conditions,
    primaryCondition: primary,
    distressLevel: overallDistress,
    isCrisis,
    response: {
      validation,
      protocol: responsePool.protocol,
      instruction,
      safetyBridge: responsePool.safetyBridge,
    },
    intersections,
  };
}
