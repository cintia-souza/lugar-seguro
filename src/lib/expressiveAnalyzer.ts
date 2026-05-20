// Pré-processador de Expressões Textuais
// Detecta vocalizações, alongamentos, risadas e mapeia para estados emocionais

import type { LumiExpression } from "@/config/lumiExpressions";

export type ExpressiveSignal =
  | "grito"        // aaaaaaa, AAAA
  | "empolgacao"   // oiiiii, lumiiiii
  | "riso"         // kkkkk, hahaha, rsrsrs
  | "hesitacao"    // hmmm, sabe..., tipo...
  | "choro"        // snif, buaaaa
  | "alivio"       // ufaaaa, ahhhh
  | "raiva"        // GRRRR, ARGH
  | null;

export interface ExpressiveAnalysis {
  signal: ExpressiveSignal;
  intensity: number; // 0-1 based on repetition length
  normalizedText: string; // text with elongations collapsed
  lumiExpression: LumiExpression;
  lumiResponse: string;
}

// --- Detection patterns ---
interface SignalPattern {
  signal: ExpressiveSignal;
  patterns: RegExp[];
  lumiExpression: LumiExpression;
  responses: string[];
}

const SIGNAL_PATTERNS: SignalPattern[] = [
  {
    signal: "grito",
    patterns: [
      /[aá]{4,}/i,        // aaaaaaa, AAAA
      /[eé]{4,}/i,        // eeeee
      /[oó]{4,}/i,        // ooooo
      /!{3,}/,            // !!!!!!
      /[A-ZÁÉÍÓÚ\s]{10,}/, // TUDO EM CAPS LOCK
    ],
    lumiExpression: "triste",
    responses: [
      "Pode gritar tudo o que precisar! Estou aqui ouvindo você. O que está pesando tanto?",
      "Eu ouço esse grito. Não precisa segurar. Solta tudo aqui que é seguro.",
      "Às vezes a gente precisa gritar pra fora. Estou aqui, segurando sua mão.",
    ],
  },
  {
    signal: "empolgacao",
    patterns: [
      /oi{4,}/i,          // oiiiiiii
      /lumi{3,}/i,        // lumiiiii
      /ola{3,}/i,         // olaaaa
      /ei{4,}/i,          // eiiiiii
      /oba{2,}/i,         // obaaa
    ],
    lumiExpression: "comemorando",
    responses: [
      "Oiiiiiii! Que alegria ver você por aqui! ✨ Como está o seu coração agora?",
      "Eiii! Que energia boa! Fico feliz de te ver assim. Conta, o que aconteceu de bom?",
      "Olááá! Adoro quando você chega assim! O que te trouxe aqui hoje?",
    ],
  },
  {
    signal: "riso",
    patterns: [
      /k{4,}/i,           // kkkkkk
      /ha{3,}/i,          // hahaha
      /rs{3,}/i,          // rsrsrs
      /he{3,}/i,          // hehehe
      /hi{3,}/i,          // hihihi
      /ja{3,}/i,          // jajaja
    ],
    lumiExpression: "confusa",
    responses: [
      "Haha! Mas espera... esse riso é de felicidade ou é nervoso? Me conta o que está por trás.",
      "Rindo bastante, né? Às vezes a gente ri pra não chorar. Está tudo bem de verdade?",
      "Adoro te ver rindo! Mas se por trás tiver algo pesado, pode falar também. Estou aqui pros dois.",
    ],
  },
  {
    signal: "hesitacao",
    patterns: [
      /h[um]{3,}/i,       // hmmmmm, hummmm
      /\.{4,}/,           // ......
      /sabe\.{2,}/i,      // sabe...
      /tipo\.{2,}/i,      // tipo...
      /é que\.{2,}/i,     // é que...
    ],
    lumiExpression: "confusa",
    responses: [
      "Sem pressa. Pode organizar os pensamentos no seu tempo. Estou aqui esperando.",
      "Parece que tem algo difícil de colocar em palavras. Tudo bem. Vai no seu ritmo.",
      "Hmm... Parece que algo está se formando aí dentro. Quando estiver pronto(a), eu ouço.",
    ],
  },
  {
    signal: "choro",
    patterns: [
      /bu[aá]{3,}/i,      // buaaaa
      /snif/i,            // snif
      /😭{2,}/,           // 😭😭😭
      /chorand/i,         // chorando
      /não par[oa] de chorar/i,
    ],
    lumiExpression: "triste",
    responses: [
      "Estou aqui. Chora tudo o que precisar. Não vou a lugar nenhum.",
      "Suas lágrimas são válidas. Cada uma delas. Estou aqui te abraçando.",
      "Pode chorar. Chorar é o corpo se curando. Eu fico aqui do seu lado.",
    ],
  },
  {
    signal: "alivio",
    patterns: [
      /uf[aá]{3,}/i,      // ufaaaa
      /ah{4,}/i,          // ahhhh (alívio)
      /finalmente/i,
      /consegui{2,}/i,    // conseguiii
    ],
    lumiExpression: "aliviada",
    responses: [
      "Ufaaa! Passou, né? Que alívio! Você é mais forte do que imagina.",
      "Ahhh, senti esse alívio daqui! Que bom. Respira fundo e aproveita esse momento.",
      "Isso! Esse suspiro de alívio é lindo. Você merece essa paz.",
    ],
  },
  {
    signal: "raiva",
    patterns: [
      /gr{3,}/i,          // grrrrr
      /arg[h]{2,}/i,      // arghhhh
      /pqp/i,             // pqp
      /put[a\*]{2,}/i,    // palavrão
      /ódio{2,}/i,        // ódioooo
    ],
    lumiExpression: "confusa",
    responses: [
      "Sinto a raiva daqui. Ela é válida. Quer colocar pra fora com palavras? Aqui é seguro.",
      "Tá com raiva, né? Tudo bem. A raiva é um sentimento legítimo. O que causou isso?",
      "Pode xingar, pode gritar aqui. Esse espaço é seu. Depois a gente respira junto.",
    ],
  },
];

// --- Normalize elongated text ---
function normalizeText(text: string): string {
  // Collapse repeated characters to max 2 (aaaa → aa, kkkk → kk)
  return text.replace(/(.)\1{2,}/g, "$1$1");
}

// --- Calculate intensity based on repetition length ---
function calculateIntensity(text: string): number {
  const matches = text.match(/(.)\1{3,}/g);
  if (!matches) return 0;
  const maxRepeat = Math.max(...matches.map((m) => m.length));
  return Math.min(1, maxRepeat / 15); // 15+ chars = max intensity
}

// --- Main analysis function ---
export function analyzeExpressiveText(text: string): ExpressiveAnalysis {
  for (const pattern of SIGNAL_PATTERNS) {
    for (const regex of pattern.patterns) {
      if (regex.test(text)) {
        const response = pattern.responses[Math.floor(Math.random() * pattern.responses.length)] as string;
        return {
          signal: pattern.signal,
          intensity: calculateIntensity(text),
          normalizedText: normalizeText(text),
          lumiExpression: pattern.lumiExpression,
          lumiResponse: response,
        };
      }
    }
  }

  return {
    signal: null,
    intensity: 0,
    normalizedText: text,
    lumiExpression: "neutra",
    lumiResponse: "",
  };
}
