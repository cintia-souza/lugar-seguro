"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { useAppContext, type EmotionalState } from "@/context/AppContext";
import {
  LUMI_EXPRESSIONS,
  ROUTE_EXPRESSIONS,
  detectExpression,
  pickRandomSpeech,
  type LumiExpression,
  type LumiExpressionConfig,
} from "@/config/lumiExpressions";
import { analyzeExpressiveText } from "@/lib/expressiveAnalyzer";

interface LumiBrainOutput {
  expression: LumiExpression;
  config: LumiExpressionConfig;
  speech: string;
  isVisible: boolean;
  reactToText: (text: string) => void;
}

const EMOTION_TO_EXPRESSION: Record<EmotionalState, LumiExpression> = {
  calm: "amorosa",
  anxious: "confusa",
  sad: "cansada",
  overwhelmed: "confusa",
  angry: "triste",
  numb: "cansada",
  neutral: "neutra",
};

function getConfig(id: LumiExpression): LumiExpressionConfig {
  return LUMI_EXPRESSIONS.find((e) => e.id === id) ?? LUMI_EXPRESSIONS[7] as LumiExpressionConfig;
}

export function useLumiBrain(): LumiBrainOutput {
  const pathname = usePathname();
  const { emotionalState } = useAppContext();
  const [expression, setExpression] = useState<LumiExpression>("neutra");
  const [speech, setSpeech] = useState("");
  const [isVisible, setIsVisible] = useState(true);
  const lastChangeRef = useRef(Date.now());
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const config = getConfig(expression);

  // Debounced update — minimum 6 seconds between changes
  const updateLumi = useCallback((newExpression: LumiExpression) => {
    const now = Date.now();
    const elapsed = now - lastChangeRef.current;
    const newConfig = getConfig(newExpression);

    const apply = () => {
      setExpression(newExpression);
      setSpeech(pickRandomSpeech(newConfig));
      lastChangeRef.current = Date.now();
    };

    if (elapsed < 6000) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(apply, 6000 - elapsed);
    } else {
      apply();
    }
  }, []);

  // Route-based reaction
  useEffect(() => {
    const routeExpression = ROUTE_EXPRESSIONS[pathname];
    if (routeExpression) {
      updateLumi(routeExpression);
    } else if (pathname === "/") {
      updateLumi("neutra");
    }
  }, [pathname, updateLumi]);

  // Emotion-based reaction (delayed to not clash with route)
  useEffect(() => {
    const timer = setTimeout(() => {
      const mapped = EMOTION_TO_EXPRESSION[emotionalState];
      // Don't override route-specific expressions
      if (!ROUTE_EXPRESSIONS[pathname]) {
        updateLumi(mapped);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [emotionalState, pathname, updateLumi]);

  // Text-based reaction (called from VentSection or Diary)
  const reactToText = useCallback((text: string) => {
    if (text.length < 3) return;

    // First check expressive signals (elongations, laughs, screams)
    const expressive = analyzeExpressiveText(text);
    if (expressive.signal) {
      setExpression(expressive.lumiExpression);
      setSpeech(expressive.lumiResponse);
      lastChangeRef.current = Date.now();
      return;
    }

    // Then check keyword-based expressions
    if (text.length < 10) return;
    const detected = detectExpression(text);
    if (detected !== "neutra") {
      updateLumi(detected);
    }
  }, [updateLumi]);

  // Go idle after 25 seconds
  useEffect(() => {
    const idleTimer = setTimeout(() => {
      setSpeech("");
    }, 25000);

    return () => clearTimeout(idleTimer);
  }, [speech]);

  // Hide on auth pages
  useEffect(() => {
    const hidden = ["/login", "/cadastro", "/recuperar-senha"];
    setIsVisible(!hidden.includes(pathname));
  }, [pathname]);

  return { expression, config, speech, isVisible, reactToText };
}
