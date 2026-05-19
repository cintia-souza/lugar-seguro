// Configuração de Expressões da Lumi — Com ações de redirecionamento

export type LumiExpression =
  | "cansada"
  | "confusa"
  | "comemorando"
  | "triste"
  | "amorosa"
  | "aliviada"
  | "brincalhona"
  | "neutra";

export interface LumiAction {
  label: string;
  href: string;
}

export interface LumiExpressionConfig {
  id: LumiExpression;
  image: string;
  alt: string;
  triggers: string[];
  speeches: string[];
  actions: LumiAction[];
}

export const LUMI_EXPRESSIONS: LumiExpressionConfig[] = [
  {
    id: "cansada",
    image: "/lumi/Lumi Cansada - Exausta.png",
    alt: "Lumi com olhinhos fechados de cansaço",
    triggers: [
      "vazio", "vazia", "peso", "exausta", "exausto", "cansada", "cansado",
      "inútil", "fardo", "sozinha", "sozinho", "sem energia", "não consigo levantar",
      "não saio da cama", "pesado", "pesada", "esgotada", "esgotado",
    ],
    speeches: [
      "Tudo bem não dar conta de tudo hoje. Quer colocar isso pra fora?",
      "Está pesado, né? Às vezes escrever ajuda a aliviar...",
      "Seu corpo está pedindo uma pausa. Que tal registrar como se sente?",
    ],
    actions: [
      { label: "Desabafar", href: "/desabafo" },
      { label: "Escrever no diário", href: "/diario" },
    ],
  },
  {
    id: "confusa",
    image: "/lumi/Lumi Confusa - Pensativa.png",
    alt: "Lumi pensativa com a mão no queixo",
    triggers: [
      "medo", "tenso", "tensa", "pânico", "desespero", "e se", "não sei",
      "confuso", "confusa", "pensando demais", "acelerado", "acelerada",
      "não consigo parar de pensar", "ansiedade", "preocupado", "preocupada",
    ],
    speeches: [
      "Sua mente está acelerada... Que tal respirar um pouco pra desacelerar?",
      "Pensamentos não são fatos. Quer tentar colocar eles no papel?",
      "E se a gente respirar juntos primeiro? Depois você decide o que fazer.",
    ],
    actions: [
      { label: "Respirar", href: "/respirar" },
      { label: "Desabafar", href: "/desabafo" },
    ],
  },
  {
    id: "comemorando",
    image: "/lumi/Lumi Comemorando - Vitoriosa.png",
    alt: "Lumi pulando de alegria com braços abertos",
    triggers: [
      "consegui", "vitória", "venci", "melhor", "orgulho", "feliz",
      "superei", "completei", "terminei", "progresso", "evolução",
    ],
    speeches: [
      "Olha só pra você! Que tal registrar essa vitória no diário?",
      "Cada conquista merece ser lembrada. Quer guardar esse momento?",
      "Você é incrível! Que tal celebrar com um puzzle relaxante?",
    ],
    actions: [
      { label: "Registrar no diário", href: "/diario" },
      { label: "Relaxar", href: "/relaxar" },
    ],
  },
  {
    id: "triste",
    image: "/lumi/Lumi Triste - Chorando.png",
    alt: "Lumi com lágrimas nos olhos",
    triggers: [
      "chorar", "chorando", "dor", "explodindo", "socorro", "não aguento",
      "sofrimento", "machuca", "doendo", "desespero", "quero sumir",
      "ninguém se importa", "abandonada", "abandonado",
    ],
    speeches: [
      "Eu sinto muito... Não guarde isso aí dentro. Quer colocar pra fora?",
      "Sua dor é real. Às vezes escrever ajuda a tirar o peso. Quer tentar?",
      "Estou aqui. Quer desabafar? Ou prefere só respirar um pouco?",
    ],
    actions: [
      { label: "Desabafar", href: "/desabafo" },
      { label: "Respirar", href: "/respirar" },
    ],
  },
  {
    id: "amorosa",
    image: "/lumi/Lumi Amorosa - Aconchegante.png",
    alt: "Lumi com mãozinhas no peito e corações",
    triggers: [
      "amor", "conforto", "seguro", "segura", "obrigada", "obrigado",
      "carinho", "paz", "grata", "grato", "acolhida", "acolhido",
      "tranquila", "tranquilo", "bem",
    ],
    speeches: [
      "Que bom te ver em paz. Quer aproveitar pra escrever algo bonito no diário?",
      "Esse momento de calma é precioso. Que tal registrar ele?",
      "Você está segura aqui. Quer ouvir algo relaxante?",
    ],
    actions: [
      { label: "Escrever no diário", href: "/diario" },
    ],
  },
  {
    id: "aliviada",
    image: "/lumi/Lumi Aliviada - Respirando.png",
    alt: "Lumi de olhos fechados em paz",
    triggers: [
      "alívio", "calma", "passou", "respirar", "respirando", "melhorou",
      "acalmei", "tranquilo", "tranquila", "ufa", "consegui respirar",
    ],
    speeches: [
      "Ufa... Passou. Quer continuar respirando ou registrar como se sente?",
      "O pior ficou pra trás. Que tal um puzzle pra manter a calma?",
      "Você está se acalmando. Quer anotar isso no diário?",
    ],
    actions: [
      { label: "Continuar respirando", href: "/respirar" },
      { label: "Relaxar com puzzle", href: "/relaxar" },
    ],
  },
  {
    id: "brincalhona",
    image: "/lumi/Lumi Brincalhona - Terapêutica.png",
    alt: "Lumi piscando o olho com pose dinâmica",
    triggers: [
      "jogar", "puzzle", "descontração", "distrair", "brincar",
      "jogo", "peças", "organizar", "foco",
    ],
    speeches: [
      "Hora de dar descanso pros pensamentos! Bora organizar umas pecinhas?",
      "Seu cérebro precisa de uma pausa. Que tal um desafio leve?",
      "Foco no movimento, não nos problemas. Vamos lá?",
    ],
    actions: [
      { label: "Jogar puzzle", href: "/relaxar" },
    ],
  },
  {
    id: "neutra",
    image: "/lumi/Lumi Neutra - Companheira Estática.png",
    alt: "Lumi sorrindo com olhos abertos",
    triggers: [],
    speeches: [
      "Ei! Que bom ver você. Como está se sentindo?",
      "Estou aqui se precisar. Quer desabafar, respirar ou relaxar?",
      "Sem pressa. Esse espaço é seu. O que te faria bem agora?",
    ],
    actions: [
      { label: "Desabafar", href: "/desabafo" },
      { label: "Respirar", href: "/respirar" },
      { label: "Relaxar", href: "/relaxar" },
    ],
  },
];

export const ROUTE_EXPRESSIONS: Record<string, LumiExpression> = {
  "/respirar": "aliviada",
  "/relaxar": "brincalhona",
  "/desabafo": "confusa",
};

export function pickRandomSpeech(expression: LumiExpressionConfig): string {
  return expression.speeches[Math.floor(Math.random() * expression.speeches.length)] as string;
}

export function detectExpression(text: string): LumiExpression {
  const lower = text.toLowerCase();

  const priority: LumiExpression[] = [
    "triste", "cansada", "confusa", "comemorando", "amorosa", "aliviada", "brincalhona",
  ];

  for (const id of priority) {
    const config = LUMI_EXPRESSIONS.find((e) => e.id === id);
    if (config && config.triggers.some((t) => lower.includes(t))) {
      return id;
    }
  }

  return "neutra";
}
