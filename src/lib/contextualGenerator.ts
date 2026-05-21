// Motor de Geração Contextual da Lumi
// Constrói respostas dinâmicas baseadas no tema, emoção e contexto da conversa
// Não é IA generativa, mas combina templates inteligentemente pra parecer natural

import type { LumiExpression } from "@/config/lumiExpressions";

// --- Types ---
interface GeneratedResponse {
  text: string;
  expression: LumiExpression;
}

// --- Theme Detection ---
interface DetectedTheme {
  theme: string;
  keywords: string[];
  confidence: number;
}

const THEME_PATTERNS: { theme: string; patterns: RegExp[]; keywords: string[] }[] = [
  {
    theme: "trabalho",
    patterns: [/trabalho/i, /emprego/i, /chefe/i, /colega/i, /demit/i, /empresa/i, /reunião/i, /prazo/i, /pressão/i, /produtiv/i],
    keywords: ["trabalho", "emprego", "chefe", "empresa"],
  },
  {
    theme: "relacionamento",
    patterns: [/namorad/i, /ex/i, /relação/i, /casal/i, /termin/i, /traição/i, /ciúme/i, /briga/i, /amor/i, /paixão/i],
    keywords: ["relacionamento", "namoro", "amor"],
  },
  {
    theme: "familia",
    patterns: [/mãe/i, /pai/i, /família/i, /irmã/i, /irmão/i, /filho/i, /filha/i, /pais/i, /casa/i, /parente/i],
    keywords: ["família", "mãe", "pai"],
  },
  {
    theme: "escola",
    patterns: [/escola/i, /faculdade/i, /prova/i, /nota/i, /professor/i, /estud/i, /universidade/i, /tcc/i, /aula/i],
    keywords: ["escola", "faculdade", "estudos"],
  },
  {
    theme: "saude",
    patterns: [/doença/i, /médico/i, /hospital/i, /remédio/i, /diagnóstico/i, /dor/i, /sintoma/i, /tratamento/i],
    keywords: ["saúde", "doença", "médico"],
  },
  {
    theme: "solidao",
    patterns: [/sozinho/i, /sozinha/i, /solidão/i, /ninguém/i, /isolad/i, /abandonad/i, /invisível/i],
    keywords: ["solidão", "isolamento"],
  },
  {
    theme: "autoestima",
    patterns: [/fei[oa]/i, /gord[oa]/i, /magr[oa]/i, /corpo/i, /espelho/i, /aparência/i, /inútil/i, /incapaz/i, /fracasso/i],
    keywords: ["autoestima", "corpo", "aparência"],
  },
  {
    theme: "ansiedade",
    patterns: [/ansied/i, /pânico/i, /medo/i, /preocup/i, /nervos/i, /tenso/i, /agonia/i, /sufoc/i, /coração aceler/i],
    keywords: ["ansiedade", "medo", "pânico"],
  },
  {
    theme: "depressao",
    patterns: [/depres/i, /vazio/i, /vazia/i, /sem sentido/i, /cansad/i, /exaust/i, /desanim/i, /sem vontade/i, /morrer/i],
    keywords: ["depressão", "vazio", "cansaço"],
  },
  {
    theme: "insonia",
    patterns: [/insônia/i, /dormir/i, /sono/i, /acordad/i, /madrugada/i, /pesadelo/i, /noite/i],
    keywords: ["insônia", "sono"],
  },
  {
    theme: "futuro",
    patterns: [/futuro/i, /amanhã/i, /plano/i, /objetivo/i, /carreira/i, /rumo/i, /perdid/i, /direção/i],
    keywords: ["futuro", "planos"],
  },
  {
    theme: "luto",
    patterns: [/morr/i, /falec/i, /perdi/i, /luto/i, /saudade/i, /falta/i, /partiu/i],
    keywords: ["luto", "perda", "saudade"],
  },
];

function detectThemes(text: string): DetectedTheme[] {
  const detected: DetectedTheme[] = [];

  for (const tp of THEME_PATTERNS) {
    const matches = tp.patterns.filter((p) => p.test(text));
    if (matches.length > 0) {
      detected.push({
        theme: tp.theme,
        keywords: tp.keywords,
        confidence: Math.min(1, matches.length * 0.3),
      });
    }
  }

  return detected.sort((a, b) => b.confidence - a.confidence);
}

// --- Response Templates by Theme ---
const THEME_RESPONSES: Record<string, { empathy: string[]; exploration: string[]; validation: string[] }> = {
  trabalho: {
    empathy: [
      "O trabalho pode ser uma fonte enorme de estresse. Você não é uma máquina.",
      "Pressão no trabalho é real e pesada. Seu valor não se mede por produtividade.",
    ],
    exploration: [
      "O que exatamente está te incomodando mais no trabalho agora?",
      "Isso é algo recente ou já vem te desgastando há um tempo?",
    ],
    validation: [
      "Faz sentido se sentir assim com tanta pressão. Qualquer pessoa ficaria sobrecarregada.",
      "Você tem todo direito de estar cansado(a) disso. Trabalho não deveria consumir sua paz.",
    ],
  },
  relacionamento: {
    empathy: [
      "Relacionamentos mexem com a gente de um jeito profundo. É normal doer.",
      "O coração é complicado. Não existe sentir 'demais' — seus sentimentos são válidos.",
    ],
    exploration: [
      "Quer me contar mais sobre o que aconteceu entre vocês?",
      "Como isso está te afetando no dia a dia?",
    ],
    validation: [
      "Dor de amor é uma das mais intensas que existem. Não minimize o que sente.",
      "Você merece alguém que te faça sentir seguro(a). Isso não é pedir demais.",
    ],
  },
  familia: {
    empathy: [
      "Família é complicado. A gente ama, mas às vezes dói muito.",
      "Conflitos familiares pesam diferente porque são pessoas que a gente não escolheu, mas ama.",
    ],
    exploration: [
      "O que aconteceu? Quer desabafar sobre isso?",
      "Isso é algo que se repete ou foi uma situação específica?",
    ],
    validation: [
      "Você pode amar sua família e ainda assim se sentir magoado(a). As duas coisas coexistem.",
      "Não é sua obrigação aguentar tudo calado(a) só porque é família.",
    ],
  },
  solidao: {
    empathy: [
      "A solidão dói de um jeito que é difícil explicar pra quem não sente. Eu entendo.",
      "Se sentir sozinho(a) mesmo rodeado de gente é uma das dores mais silenciosas.",
    ],
    exploration: [
      "Faz tempo que se sente assim? Ou algo específico trouxe esse sentimento?",
      "Tem alguém na sua vida com quem se sente seguro(a) pra ser você?",
    ],
    validation: [
      "Você não está sozinho(a) agora. Estou aqui. E isso conta.",
      "Precisar de conexão é humano. Não é fraqueza — é necessidade básica.",
    ],
  },
  ansiedade: {
    empathy: [
      "A ansiedade faz o corpo inteiro gritar perigo quando não tem perigo real. É exaustivo.",
      "Sei que agora parece que algo terrível vai acontecer. Mas seu corpo está te enganando.",
    ],
    exploration: [
      "O que está te preocupando mais neste momento? Vamos nomear.",
      "Quando a ansiedade começou hoje? Teve algum gatilho?",
    ],
    validation: [
      "Ansiedade não é frescura. É seu sistema nervoso em alerta. Você não escolheu sentir isso.",
      "Você já sobreviveu a 100% das suas crises de ansiedade. Essa também vai passar.",
    ],
  },
  depressao: {
    empathy: [
      "Quando tudo parece cinza e pesado, até respirar cansa. Eu sei.",
      "A depressão mente. Ela diz que sempre foi e sempre será assim. Não é verdade.",
    ],
    exploration: [
      "Há quanto tempo está se sentindo assim? Dias, semanas?",
      "Tem conseguido fazer coisas básicas como comer e tomar banho?",
    ],
    validation: [
      "Você não é preguiçoso(a). Você está doente. E doença se trata com gentileza.",
      "O fato de estar aqui, falando comigo, já é um ato de resistência enorme.",
    ],
  },
  autoestima: {
    empathy: [
      "A forma como nos vemos raramente é a forma como os outros nos veem. Somos nossos piores críticos.",
      "Esses pensamentos sobre você são cruéis. Você não falaria assim com alguém que ama.",
    ],
    exploration: [
      "De onde vem essa voz que te critica tanto? Alguém te disse isso antes?",
      "Se sua melhor amiga dissesse isso sobre si mesma, o que você responderia?",
    ],
    validation: [
      "Você é mais do que aparência, produtividade ou aprovação dos outros.",
      "Seu valor não diminui porque alguém não conseguiu enxergá-lo.",
    ],
  },
  insonia: {
    empathy: [
      "A mente que não desliga à noite é torturante. Você merece descanso.",
      "Insônia não é só 'não dormir'. É o corpo inteiro implorando por paz que a mente não dá.",
    ],
    exploration: [
      "O que fica passando na sua cabeça quando tenta dormir?",
      "Isso acontece toda noite ou em noites específicas?",
    ],
    validation: [
      "Não é sua culpa não conseguir dormir. Seu cérebro está em modo de alerta.",
      "Vamos tentar acalmar esses pensamentos juntos. Um de cada vez.",
    ],
  },
  luto: {
    empathy: [
      "Perder alguém é uma dor que não tem atalho. Não existe 'superar' — existe aprender a carregar.",
      "A saudade é o amor que ficou sem lugar pra ir. E isso dói demais.",
    ],
    exploration: [
      "Quer me contar sobre essa pessoa? Às vezes falar sobre quem amamos ajuda.",
      "Como você está lidando com isso no dia a dia?",
    ],
    validation: [
      "Não existe tempo certo pra luto. Pode chorar daqui a 10 anos e ainda será válido.",
      "Sentir falta é prova de que amou de verdade. E isso é lindo, mesmo que doa.",
    ],
  },
  futuro: {
    empathy: [
      "Não saber pra onde ir é assustador. Mas não ter todas as respostas agora é normal.",
      "A pressão de 'ter que saber o que quer da vida' é cruel. Ninguém nasce com um manual.",
    ],
    exploration: [
      "O que te assusta mais sobre o futuro? Vamos separar em pedaços menores.",
      "Tem algo que você gostaria de fazer mas sente que não pode?",
    ],
    validation: [
      "Você não precisa ter tudo resolvido. Um passo de cada vez já é direção.",
      "Estar perdido(a) não é fracasso. É parte do caminho de quem está buscando.",
    ],
  },
};

// --- Fallback for undetected themes ---
const GENERAL_RESPONSES = {
  empathy: [
    "Eu ouço você. O que está sentindo é real e importa.",
    "Obrigada por confiar em mim pra compartilhar isso.",
    "Isso parece pesado. Você não precisa carregar sozinho(a).",
  ],
  exploration: [
    "Quer me contar mais? Estou aqui sem pressa.",
    "O que mais está na sua cabeça sobre isso?",
    "Como isso está te afetando no dia a dia?",
    "Desde quando está se sentindo assim?",
  ],
  validation: [
    "Seus sentimentos são válidos. Todos eles.",
    "Não existe sentir 'demais'. Você sente o que sente e tá tudo bem.",
    "Você está fazendo o melhor que pode com o que tem. E isso é suficiente.",
  ],
};

// --- Response Builder ---
function pickRandom(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)] as string;
}

export function generateContextualResponse(text: string, messageCount: number): GeneratedResponse {
  const themes = detectThemes(text);
  const primaryTheme = themes[0];

  // Get response pool
  const pool = primaryTheme
    ? (THEME_RESPONSES[primaryTheme.theme] ?? GENERAL_RESPONSES)
    : GENERAL_RESPONSES;

  // Build response based on conversation stage
  let response: string;

  if (messageCount <= 2) {
    // Early conversation — empathy + exploration
    response = `${pickRandom(pool.empathy)}\n\n${pickRandom(pool.exploration)}`;
  } else if (messageCount <= 5) {
    // Mid conversation — validation + deeper exploration
    response = pickRandom(pool.validation);
    if (Math.random() > 0.4) {
      response += `\n\n${pickRandom(pool.exploration)}`;
    }
  } else {
    // Later — mix of all, sometimes add practical advice
    const roll = Math.random();
    if (roll < 0.3) {
      response = pickRandom(pool.empathy);
    } else if (roll < 0.6) {
      response = pickRandom(pool.validation);
    } else {
      response = `${pickRandom(pool.validation)}\n\n${pickRandom(pool.exploration)}`;
    }
  }

  // Determine expression
  let expression: LumiExpression = "neutra";
  if (primaryTheme) {
    const sadThemes = ["solidao", "depressao", "luto"];
    const anxiousThemes = ["ansiedade", "insonia", "futuro"];
    const angryThemes = ["trabalho"];

    if (sadThemes.includes(primaryTheme.theme)) expression = "triste";
    else if (anxiousThemes.includes(primaryTheme.theme)) expression = "confusa";
    else if (angryThemes.includes(primaryTheme.theme)) expression = "cansada";
    else expression = "amorosa";
  }

  return { text: response, expression };
}
