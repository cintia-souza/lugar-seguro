"use client";

import { useState, useCallback, useRef } from "react";
import { analyzeSentiment, type BrainResponse } from "@/lib/brainEngine";
import { KeystrokeTracker, type BehavioralSignal } from "@/lib/behavioralIntelligence";
import { analyzeExpressiveText } from "@/lib/expressiveAnalyzer";
import type { LumiExpression } from "@/config/lumiExpressions";

// --- Types ---
export interface ChatMessage {
  id: string;
  sender: "user" | "lumi";
  text: string;
  timestamp: number;
}

interface ContextMetadata {
  timestamp: string;
  hour: number;
  typingSpeed: "slow" | "normal" | "fast" | "frantic";
  recentMoods: string[];
}

interface LumiChatState {
  messages: ChatMessage[];
  isLumiTyping: boolean;
  lumiExpression: LumiExpression;
  sendMessage: (text: string) => void;
  saveSession: () => ChatMessage[];
  keystrokeTracker: KeystrokeTracker;
}

// --- Helpers ---
function getRecentMoods(): string[] {
  try {
    const raw = localStorage.getItem("meu-lugarzinho-mood-calendar");
    if (!raw) return [];
    const calendar = JSON.parse(raw) as Record<string, { emotion: string }>;
    const moods: string[] = [];
    for (let i = 0; i < 3; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = date.toISOString().slice(0, 10);
      const entry = calendar[key];
      if (entry) moods.push(entry.emotion);
    }
    return moods;
  } catch { return []; }
}

function buildMetadata(tracker: KeystrokeTracker): ContextMetadata {
  const metrics = tracker.getMetrics();
  let typingSpeed: ContextMetadata["typingSpeed"] = "normal";
  if (metrics.avgInterval < 80) typingSpeed = "frantic";
  else if (metrics.avgInterval < 150) typingSpeed = "fast";
  else if (metrics.avgInterval > 500) typingSpeed = "slow";

  return {
    timestamp: new Date().toISOString(),
    hour: new Date().getHours(),
    typingSpeed,
    recentMoods: getRecentMoods(),
  };
}

// --- Conversational responses for simple/short messages ---
const CONVERSATIONAL_RESPONSES: Record<string, { responses: string[]; expression: LumiExpression }> = {
  greeting: {
    responses: [
      "Oi! Que bom te ver. Como está se sentindo agora?",
      "Oii! Estou aqui. Quer conversar sobre algo ou só ficar por aqui?",
      "Ei! Tudo bem? Me conta como está o seu dia.",
    ],
    expression: "neutra",
  },
  fine: {
    responses: [
      "Que bom! E por dentro, como está de verdade? Aqui pode ser sincero(a).",
      "Fico feliz! Tem algo específico que te fez bem hoje?",
      "Legal! Quer aproveitar pra registrar algo no diário ou só relaxar?",
    ],
    expression: "amorosa",
  },
  sad: {
    responses: [
      "Sinto muito que esteja assim. Quer me contar o que aconteceu?",
      "Estou aqui. Não precisa explicar tudo — pode ir soltando aos poucos.",
      "Tudo bem se sentir assim. O que está pesando mais agora?",
    ],
    expression: "triste",
  },
  thanks: {
    responses: [
      "De nada! Estou sempre aqui quando precisar. 💜",
      "Fico feliz em ajudar. Volte sempre que quiser conversar.",
      "Disponível 24h! Cuide-se, tá?",
    ],
    expression: "amorosa",
  },
  confused: {
    responses: [
      "Sem pressa. Pode ir organizando os pensamentos aqui comigo.",
      "Tudo bem não saber o que dizer. Às vezes só estar aqui já ajuda.",
      "Quer tentar descrever o que está sentindo no corpo? Às vezes ajuda a nomear.",
    ],
    expression: "confusa",
  },
  generic: {
    responses: [
      "Entendo. Quer me contar mais sobre isso?",
      "Estou ouvindo. Continue, se quiser.",
      "Hmm... E como isso te faz sentir?",
      "Obrigada por compartilhar. Tem mais alguma coisa na sua cabeça?",
    ],
    expression: "neutra",
  },
};

function detectConversationType(text: string): string {
  const lower = text.toLowerCase().trim();

  // Greetings
  if (/^(oi|olá|ola|hey|ei|eai|e ai|fala|opa|bom dia|boa tarde|boa noite)/i.test(lower)) return "greeting";

  // Fine/good
  if (/^(bem|tudo bem|estou bem|to bem|tô bem|de boa|suave|tranquilo|ok)/i.test(lower)) return "fine";

  // Sad indicators (short)
  if (/^(triste|mal|péssimo|horrível|ruim|não tô bem|não estou bem|mais ou menos)/i.test(lower)) return "sad";

  // Thanks
  if (/^(obrigad|valeu|brigad|thanks|vlw)/i.test(lower)) return "thanks";

  // Confused/uncertain
  if (/^(não sei|sei lá|sei la|hmm|hm|tipo|sabe|é que)/i.test(lower)) return "confused";

  return "generic";
}

function generateLumiResponse(text: string): { response: string; expression: LumiExpression; analysis: BrainResponse } {
  const analysis = analyzeSentiment(text);

  // Priority: clinical > expressive > behavioral > distortion > conversational
  let response = "";
  let expression: LumiExpression = "neutra";

  // 1. Clinical crisis
  if (analysis.clinicalReport?.isCrisis) {
    response = analysis.validation;
    expression = "triste";
  }
  // 2. Expressive signal (screams, laughs, etc)
  else if (analysis.expressiveSignal?.signal) {
    expression = analysis.expressiveSignal.lumiExpression;
    response = analysis.expressiveSignal.lumiResponse;
  }
  // 3. Behavioral signal (time, history, baseline)
  else if (analysis.behavioralSignal && analysis.behavioralSignal.priority >= 0.7 && analysis.distortions.length === 0) {
    expression = analysis.behavioralSignal.lumiExpression;
    response = analysis.behavioralSignal.lumiResponse;
  }
  // 4. Cognitive distortions detected
  else if (analysis.distortions.length > 0) {
    expression = "confusa";
    response = analysis.validation;
    // Sometimes add a practical tip
    if (Math.random() > 0.6) {
      response += `\n\n💡 ${analysis.practicalTip}`;
    }
  }
  // 5. No distortions — use conversational responses
  else {
    const type = detectConversationType(text);
    const pool = CONVERSATIONAL_RESPONSES[type] ?? CONVERSATIONAL_RESPONSES.generic;
    const responses = pool?.responses ?? CONVERSATIONAL_RESPONSES.generic.responses;
    response = responses[Math.floor(Math.random() * responses.length)] as string;
    expression = pool?.expression ?? "neutra";
  }

  return { response, expression, analysis };
}

// --- Hook ---
export function useLumiChat(): LumiChatState {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLumiTyping, setIsLumiTyping] = useState(false);
  const [lumiExpression, setLumiExpression] = useState<LumiExpression>("neutra");
  const trackerRef = useRef(new KeystrokeTracker());

  const sendMessage = useCallback((text: string) => {
    if (!text.trim()) return;

    // Add user message
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      sender: "user",
      text: text.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLumiTyping(true);

    // Build metadata (for future API integration)
    const _metadata = buildMetadata(trackerRef.current);
    trackerRef.current.reset();

    // Simulate Lumi "thinking" delay (800-2000ms based on text length)
    const thinkTime = Math.min(2000, 800 + text.length * 15);

    setTimeout(() => {
      const { response, expression } = generateLumiResponse(text);

      const lumiMsg: ChatMessage = {
        id: crypto.randomUUID(),
        sender: "lumi",
        text: response,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, lumiMsg]);
      setIsLumiTyping(false);
      setLumiExpression(expression);
    }, thinkTime);
  }, []);

  const saveSession = useCallback((): ChatMessage[] => {
    const session = [...messages];

    // Save to localStorage
    try {
      const raw = localStorage.getItem("meu-lugarzinho-chat-sessions");
      const sessions: ChatMessage[][] = raw ? JSON.parse(raw) as ChatMessage[][] : [];
      sessions.unshift(session);
      localStorage.setItem("meu-lugarzinho-chat-sessions", JSON.stringify(sessions.slice(0, 20)));
    } catch { /* silent */ }

    // Also save to vent history
    try {
      const raw = localStorage.getItem("meu-lugarzinho-vent-history");
      const history = raw ? JSON.parse(raw) as unknown[] : [];
      history.unshift({ id: crypto.randomUUID(), timestamp: Date.now(), type: "chat", messageCount: session.length });
      localStorage.setItem("meu-lugarzinho-vent-history", JSON.stringify(history.slice(0, 50)));
    } catch { /* silent */ }

    return session;
  }, [messages]);

  return {
    messages,
    isLumiTyping,
    lumiExpression,
    sendMessage,
    saveSession,
    keystrokeTracker: trackerRef.current,
  };
}
