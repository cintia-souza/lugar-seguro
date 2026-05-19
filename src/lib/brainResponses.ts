// Sistema de Aprendizado de Respostas
// Aprende com as frases do usuário e gera respostas personalizadas

const RESPONSE_HISTORY_KEY = "meu-lugarzinho-response-history";

export interface UserPhrase {
  text: string;
  distortion: string;
  keywords: string[];
  timestamp: number;
}

interface ResponseHistory {
  phrases: UserPhrase[];
  themes: Record<string, number>; // keyword → frequency
  distortionCount: Record<string, number>;
}

// ===== KEYWORD EXTRACTION =====
const THEME_WORDS = new Set([
  // Relationships
  "mãe", "pai", "família", "namorado", "namorada", "amigo", "amiga", "chefe",
  "colega", "filho", "filha", "marido", "esposa", "ex",
  // Places/contexts
  "trabalho", "escola", "faculdade", "casa", "emprego", "empresa",
  // Themes
  "dinheiro", "saúde", "corpo", "peso", "aparência", "futuro", "passado",
  "relacionamento", "solidão", "morte", "doença", "sono", "comida",
  // Feelings as themes
  "rejeição", "abandono", "traição", "fracasso", "perda", "luto",
  "comparação", "pressão", "cobrança", "perfeição",
]);

function extractThemes(text: string): string[] {
  const lower = text.toLowerCase();
  const words = lower.split(/\s+/);
  return words.filter((w) => THEME_WORDS.has(w));
}

// ===== LOCAL STORAGE =====
function getHistory(): ResponseHistory {
  if (typeof window === "undefined") return { phrases: [], themes: {}, distortionCount: {} };
  try {
    const raw = localStorage.getItem(RESPONSE_HISTORY_KEY);
    return raw ? (JSON.parse(raw) as ResponseHistory) : { phrases: [], themes: {}, distortionCount: {} };
  } catch {
    return { phrases: [], themes: {}, distortionCount: {} };
  }
}

function saveHistory(data: ResponseHistory): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(RESPONSE_HISTORY_KEY, JSON.stringify(data));
}

// ===== SAVE USER PHRASE =====
export function saveUserPhrase(text: string, distortion: string): void {
  const history = getHistory();
  const keywords = extractThemes(text);

  // Save phrase
  history.phrases.push({
    text: text.slice(0, 200), // Limit stored text
    distortion,
    keywords,
    timestamp: Date.now(),
  });

  // Update theme frequency
  for (const kw of keywords) {
    history.themes[kw] = (history.themes[kw] ?? 0) + 1;
  }

  // Update distortion count
  history.distortionCount[distortion] = (history.distortionCount[distortion] ?? 0) + 1;

  // Keep last 100 phrases
  history.phrases = history.phrases.slice(-100);

  saveHistory(history);

  // Sync to server
  syncPhrase(text, distortion, keywords);
}

// ===== GENERATE CONTEXTUAL RESPONSE =====
export function getContextualResponse(distortion: string): string | null {
  const history = getHistory();
  const count = history.distortionCount[distortion] ?? 0;
  const topThemes = getTopThemes(history, 3);
  const recentPhrases = history.phrases
    .filter((p) => p.distortion === distortion)
    .slice(-5);

  // Not enough data yet
  if (count < 2) return null;

  // Progressive responses based on frequency
  if (count >= 8) {
    return generateDeepResponse(distortion, topThemes, recentPhrases);
  }

  if (count >= 5) {
    return generateActionResponse(distortion, topThemes);
  }

  if (count >= 3) {
    return generatePatternResponse(distortion, topThemes, recentPhrases);
  }

  return null;
}

// ===== PROGRESSIVE RESPONSE GENERATORS =====

// 3+ times: "Percebi que isso é recorrente..."
function generatePatternResponse(distortion: string, themes: string[], phrases: UserPhrase[]): string {
  const themeText = themes.length > 0 ? ` relacionado a ${themes.join(" e ")}` : "";
  const lastKeyword = phrases[phrases.length - 1]?.keywords[0];

  const templates = [
    `Percebi que esse sentimento${themeText} tem aparecido com frequência. Isso não te define — mas merece atenção e cuidado.`,
    `Você já trouxe isso antes${themeText}. O fato de continuar expressando mostra coragem. Cada vez que coloca pra fora, o peso diminui um pouco.`,
    `Esse padrão${themeText} está se repetindo. Não é fraqueza — é seu cérebro pedindo ajuda pra processar. E você está fazendo isso agora.`,
    lastKeyword
      ? `Você mencionou "${lastKeyword}" mais de uma vez. Esse tema parece importante pra você. Que tal explorar isso no diário com mais calma?`
      : `Esse sentimento voltou. Tudo bem. Às vezes precisamos processar a mesma coisa várias vezes até ela perder a força.`,
  ];

  return templates[Math.floor(Math.random() * templates.length)] as string;
}

// 5+ times: "Que tal tentar algo diferente..."
function generateActionResponse(distortion: string, themes: string[]): string {
  const themeText = themes.length > 0 ? ` sobre ${themes[0]}` : "";

  const templates = [
    `Esse sentimento${themeText} tem sido frequente. Que tal tentar algo novo hoje? Escreva uma carta pra si mesmo(a) do futuro — alguém que já superou isso.`,
    `Você já expressou isso várias vezes${themeText}. Isso mostra consciência. O próximo passo pode ser: escolha UMA pequena ação que mude algo nessa situação.`,
    `Esse padrão${themeText} está pedindo atenção. Experimente: por 3 dias, anote uma coisa que contradiz esse pensamento. Pode ser mínima.`,
    `Já são várias vezes que esse tema aparece. Você já tentou conversar com alguém de confiança sobre isso? Às vezes uma perspectiva externa ilumina.`,
    `Esse sentimento é persistente${themeText}. Que tal um exercício: escreva o pensamento negativo, depois reescreva como se fosse um amigo te dizendo isso. O que muda?`,
  ];

  return templates[Math.floor(Math.random() * templates.length)] as string;
}

// 8+ times: "Considere buscar apoio profissional..."
function generateDeepResponse(distortion: string, themes: string[], phrases: UserPhrase[]): string {
  const daysSinceFirst = phrases.length > 0
    ? Math.floor((Date.now() - (phrases[0]?.timestamp ?? Date.now())) / 86400000)
    : 0;

  const templates = [
    `Esse sentimento tem sido companheiro constante há ${daysSinceFirst > 0 ? `${daysSinceFirst} dias` : "um tempo"}. Você não precisa carregar isso sozinho(a). Um profissional pode te ajudar a encontrar caminhos que sozinho(a) é difícil ver.`,
    `Você tem muita coragem de continuar expressando isso. Mas se esse peso não está diminuindo, considere conversar com um psicólogo. Não é fraqueza — é a decisão mais forte que existe.`,
    `Esse padrão se repete e eu quero ser honesto(a) com você: o que posso oferecer aqui tem limite. Um terapeuta pode te dar ferramentas personalizadas que vão além do que um app consegue. Você merece esse cuidado.`,
    `Já são muitas vezes. E tudo bem. Mas quero te lembrar: o CVV (188) está disponível 24h se precisar falar com alguém agora. E buscar terapia não é admitir derrota — é escolher se cuidar de verdade.`,
  ];

  return templates[Math.floor(Math.random() * templates.length)] as string;
}

// ===== HELPERS =====
function getTopThemes(history: ResponseHistory, count: number): string[] {
  return Object.entries(history.themes)
    .sort(([, a], [, b]) => b - a)
    .slice(0, count)
    .map(([theme]) => theme);
}

// ===== SERVER SYNC =====
function syncPhrase(text: string, distortion: string, keywords: string[]): void {
  fetch("/api/brain/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: text.slice(0, 200),
      distortion,
      keywords,
    }),
  }).catch(() => { /* silent */ });
}
