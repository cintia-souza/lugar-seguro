"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { logEmotion } from "@/components/WeeklySummary";

export type EmotionalState =
  | "calm"
  | "anxious"
  | "sad"
  | "overwhelmed"
  | "angry"
  | "numb"
  | "neutral";

export type SensoryMode = "default" | "low-stimulation";

interface AppState {
  emotionalState: EmotionalState;
  isDemoMode: boolean;
  sensoryMode: SensoryMode;
  setEmotionalState: (state: EmotionalState) => void;
  setSensoryMode: (mode: SensoryMode) => void;
}

const AppContext = createContext<AppState | null>(null);

const DEMO_KEY = "meu-lugarzinho-demo-emotional-state";
const SENSORY_KEY = "meu-lugarzinho-sensory-mode";

// States that auto-trigger low-stimulation mode
const OVERLOAD_STATES: EmotionalState[] = ["overwhelmed", "anxious", "numb"];

export function AppProvider({ children }: { children: ReactNode }) {
  const [emotionalState, setEmotionalStateRaw] = useState<EmotionalState>("neutral");
  const [sensoryMode, setSensoryModeRaw] = useState<SensoryMode>("default");
  const [isDemoMode] = useState(true);

  useEffect(() => {
    const storedEmotion = localStorage.getItem(DEMO_KEY) as EmotionalState | null;
    const storedSensory = localStorage.getItem(SENSORY_KEY) as SensoryMode | null;
    if (storedEmotion) setEmotionalStateRaw(storedEmotion);
    if (storedSensory) setSensoryModeRaw(storedSensory);
  }, []);

  const setSensoryMode = useCallback((mode: SensoryMode) => {
    setSensoryModeRaw(mode);
    localStorage.setItem(SENSORY_KEY, mode);
  }, []);

  const setEmotionalState = useCallback((state: EmotionalState) => {
    setEmotionalStateRaw(state);
    localStorage.setItem(DEMO_KEY, state);
    logEmotion(state);

    // Auto-adapt: activate low-stimulation for overload states
    if (OVERLOAD_STATES.includes(state)) {
      setSensoryModeRaw("low-stimulation");
      localStorage.setItem(SENSORY_KEY, "low-stimulation");
    } else {
      setSensoryModeRaw("default");
      localStorage.setItem(SENSORY_KEY, "default");
    }
  }, []);

  return (
    <AppContext.Provider
      value={{ emotionalState, isDemoMode, sensoryMode, setEmotionalState, setSensoryMode }}
    >
      <div data-sensory={sensoryMode} data-emotion={emotionalState} className="contents">
        {children}
      </div>
    </AppContext.Provider>
  );
}

export function useAppContext(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within AppProvider");
  return ctx;
}
