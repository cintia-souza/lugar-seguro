"use client";

import { useState, useCallback, useRef } from "react";
import { analyzeSentiment } from "@/lib/brainEngine";
import { KeystrokeTracker } from "@/lib/behavioralIntelligence";
import {
  type SessionMemory,
  type ConversationIntent,
  createSessionMemory,
  generateFluidResponse,
  shouldUseFluidFlow,
} from "@/lib/conversationalEngine";
import type { LumiExpression } from "@/config/lumiExpressions";

// --- Types ---
export interface ChatMessage {
  id: string;
  sender: "user" | "lumi";
  text: string;
  timestamp: number;
}

interface LumiChatState {
  messages: ChatMessage[];
  isLumiTyping: boolean;
  lumiExpression: LumiExpression;
  sendMessage: (text: string) => void;
  saveSession: () => ChatMessage[];
  keystrokeTracker: KeystrokeTracker;
}

// --- Quick responses (saudação/despedida apenas) ---
function detectQuickType(text: string): string | null {
  const lower = text.toLowerCase().trim();
  if (/^(oi+|ol[aá]|hey|ei+|eai|e ai|fala|opa|bom dia|boa tarde|boa noite|oie)/i.test(lower) && lower.length < 20) return "greeting";
  if (/^(obrigad|valeu|brigad|vlw|thanks)/i.test(lower)) return "thanks";
  if (/^(tchau|bye|at[eé]|flw|falou|fui|vou indo)/i.test(lower)) return "goodbye";
  return null;
}

const QUICK_POOL: Record<string, { responses: string[]; expression: LumiExpression }> = {
  greeting: {
    responses: [
      "Oi! Que bom te ver. Como tá?",
      "Oii! Tô aqui. Quer conversar ou só ficar por aqui?",
      "Ei! Como você tá hoje?",
      "Opa! Chega mais. O que tá rolando?",
    ],
    expression: "neutra",
  },
  thanks: {
    responses: [
      "De nada! Tô sempre aqui. 💜",
      "Imagina! Pra isso que tô aqui.",
      "Fico feliz! Volte quando quiser.",
    ],
    expression: "amorosa",
  },
  goodbye: {
    responses: [
      "Tchau! Cuide-se. Volte quando quiser. 💜",
      "Até mais! Estarei aqui quando precisar.",
      "Tchau! Descanse bem!",
    ],
    expression: "amorosa",
  },
};

// --- Main response generator ---
function generateLumiResponse(
  text: string,
  memory: SessionMemory,
  messageIndex: number
): { response: string; expression: LumiExpression; updatedMemory: SessionMemory } {

  // ═══ 1. CRISE CLÍNICA — sempre prioridade máxima ═══
  const analysis = analyzeSentiment(text);
  if (analysis.clinicalReport?.isCrisis) {
    let response = analysis.validation;
    if (analysis.clinicalReport.response.safetyBridge) {
      response += `\n\n⚠️ ${analysis.clinicalReport.response.safetyBridge}`;
    }
    const updatedMemory: SessionMemory = {
      ...memory,
      emotionalState: "crise",
      userMessages: [...memory.userMessages, text],
      lastIntent: "crise" as ConversationIntent,
      companionMode: false,
    };
    return { response, expression: "triste", updatedMemory };
  }

  // ═══ 2. SAUDAÇÃO / DESPEDIDA (curtas e óbvias) ═══
  const quickType = detectQuickType(text);
  if (quickType) {
    const pool = QUICK_POOL[quickType] ?? QUICK_POOL.greeting;
    const response = pool.responses[Math.floor(Math.random() * pool.responses.length)] as string;
    const updatedMemory: SessionMemory = {
      ...memory,
      userMessages: [...memory.userMessages, text],
      consecutiveQuestions: 0,
    };
    return { response, expression: pool.expression, updatedMemory };
  }

  // ═══ 3. SINAL EXPRESSIVO FORTE (grito, choro — não riso) ═══
  if (analysis.expressiveSignal?.signal) {
    const sig = analysis.expressiveSignal;
    if (sig.signal === "choro" || sig.signal === "grito" || sig.signal === "raiva") {
      const updatedMemory: SessionMemory = {
        ...memory,
        emotionalState: "vulneravel",
        userMessages: [...memory.userMessages, text],
        lastIntent: "desabafo" as ConversationIntent,
        companionMode: false,
      };
      return { response: sig.lumiResponse, expression: sig.lumiExpression, updatedMemory };
    }
  }

  // ═══ 4. DISTORÇÃO COGNITIVA FORTE (confidence > 0.7) ═══
  // Só intervém com distorção se for MUITO forte — senão deixa o fluxo fluido
  if (analysis.distortions.length > 0 && analysis.distortions[0] && analysis.distortions[0].confidence > 0.7) {
    // Mesmo com distorção, se está em modo companhia, não forçar
    if (!memory.companionMode) {
      let response = analysis.validation;
      if (Math.random() > 0.6) {
        response += `\n\n${analysis.reframe}`;
      }
      const updatedMemory: SessionMemory = {
        ...memory,
        emotionalState: "vulneravel",
        userMessages: [...memory.userMessages, text],
        lastIntent: "distorcao" as ConversationIntent,
        companionMode: false,
      };
      return { response, expression: "confusa", updatedMemory };
    }
  }

  // ═══ 5. MOTOR FLUIDO (cuida de TUDO o resto) ═══
  const fluid = generateFluidResponse(text, memory, messageIndex);
  return { response: fluid.text, expression: fluid.expression, updatedMemory: fluid.updatedMemory };
}

// --- Memory persistence ---
const MEMORY_KEY = "meu-lugarzinho-session-memory";

function loadMemory(): SessionMemory {
  if (typeof window === "undefined") return createSessionMemory();
  try {
    const raw = localStorage.getItem(MEMORY_KEY);
    if (!raw) return createSessionMemory();
    const saved = JSON.parse(raw) as SessionMemory & { savedAt?: number };
    if (Date.now() - (saved.savedAt ?? 0) > 2 * 60 * 60 * 1000) return createSessionMemory();
    return saved;
  } catch { return createSessionMemory(); }
}

function persistMemory(memory: SessionMemory): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(MEMORY_KEY, JSON.stringify({ ...memory, savedAt: Date.now() }));
  } catch { /* silent */ }
}

// --- Hook ---
export function useLumiChat(): LumiChatState {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLumiTyping, setIsLumiTyping] = useState(false);
  const [lumiExpression, setLumiExpression] = useState<LumiExpression>("neutra");
  const trackerRef = useRef(new KeystrokeTracker());
  const memoryRef = useRef<SessionMemory>(loadMemory());
  const processingRef = useRef(false);

  const sendMessage = useCallback((text: string) => {
    if (!text.trim() || processingRef.current) return;
    processingRef.current = true;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      sender: "user",
      text: text.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLumiTyping(true);
    trackerRef.current.reset();

    const msgIndex = memoryRef.current.userMessages.length + 1;
    const thinkTime = Math.min(2000, 600 + text.length * 8);

    setTimeout(() => {
      const { response, expression, updatedMemory } = generateLumiResponse(
        text,
        memoryRef.current,
        msgIndex
      );

      memoryRef.current = updatedMemory;
      persistMemory(updatedMemory);

      const lumiMsg: ChatMessage = {
        id: crypto.randomUUID(),
        sender: "lumi",
        text: response,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, lumiMsg]);
      setIsLumiTyping(false);
      setLumiExpression(expression);
      processingRef.current = false;
    }, thinkTime);
  }, []);

  const saveSession = useCallback((): ChatMessage[] => {
    const session = [...messages];

    try {
      const raw = localStorage.getItem("meu-lugarzinho-chat-sessions");
      const sessions: ChatMessage[][] = raw ? JSON.parse(raw) as ChatMessage[][] : [];
      sessions.unshift(session);
      localStorage.setItem("meu-lugarzinho-chat-sessions", JSON.stringify(sessions.slice(0, 20)));
    } catch { /* silent */ }

    try {
      const raw = localStorage.getItem("meu-lugarzinho-vent-history");
      const history = raw ? JSON.parse(raw) as unknown[] : [];
      history.unshift({ id: crypto.randomUUID(), timestamp: Date.now(), type: "chat", messageCount: session.length });
      localStorage.setItem("meu-lugarzinho-vent-history", JSON.stringify(history.slice(0, 50)));
    } catch { /* silent */ }

    memoryRef.current = createSessionMemory();
    localStorage.removeItem(MEMORY_KEY);

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
