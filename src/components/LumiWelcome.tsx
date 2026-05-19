"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

const FIRST_VISIT_KEY = "meu-lugarzinho-first-visit-done";

interface WelcomeStep {
  text: string;
}

const INTRO_STEPS: WelcomeStep[] = [
  { text: "Oii! Eu sou a Lumi 💜" },
  { text: "Vou ser sua companheira por aqui. Este é o seu lugarzinho seguro — só seu." },
  { text: "Você pode desabafar, escrever no diário, respirar ou só ficar quietinha comigo. Sem pressão." },
  { text: "Eu vou te acompanhar e reagir ao que você sentir. Mas nunca vou te julgar, prometo." },
  { text: "Vamos começar? Me conta: como você está se sentindo agora?" },
];

function getGreetingText(): string {
  const hour = new Date().getHours();
  if (hour < 6) return "Boa madrugada 🌙 Não consegue dormir? Tudo bem, estou aqui com você.";
  if (hour < 12) return "Bom dia ☀️ Que bom te ver de volta. Como está hoje?";
  if (hour < 18) return "Boa tarde 🌤️ Como está sendo o seu dia? Estou aqui se precisar.";
  return "Boa noite 🌙 Descanse. Você merece. Estou aqui se quiser conversar.";
}

export default function LumiWelcome() {
  const [isFirstVisit, setIsFirstVisit] = useState<boolean | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    const done = localStorage.getItem(FIRST_VISIT_KEY);
    if (done) {
      setIsFirstVisit(false);
      setGreeting(getGreetingText());
    } else {
      setIsFirstVisit(true);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < INTRO_STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      // Finish intro
      localStorage.setItem(FIRST_VISIT_KEY, "true");
      setDismissed(true);
    }
  };

  const handleDismissGreeting = () => {
    setDismissed(true);
  };

  // Loading state
  if (isFirstVisit === null) return null;

  // Already dismissed
  if (dismissed) return null;

  // First visit — full introduction
  if (isFirstVisit) {
    const step = INTRO_STEPS[currentStep] as WelcomeStep;
    const isLast = currentStep === INTRO_STEPS.length - 1;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm">
        <div className="mx-4 w-full max-w-sm animate-page-enter rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl">
          {/* Lumi image */}
          <div className="mb-5 flex justify-center">
            <div className="relative h-32 w-32 overflow-hidden rounded-full border-4 border-blue-50 bg-blue-50 shadow-inner">
              <Image
                src="/lumi/Lumi Apresentaçao.png"
                alt="Lumi se apresentando"
                fill
                className="object-cover"
                sizes="128px"
                priority
              />
            </div>
          </div>

          {/* Text */}
          <p className="min-h-[3rem] text-center text-sm leading-relaxed text-slate-600">
            {step.text}
          </p>

          {/* Progress dots */}
          <div className="mt-4 flex justify-center gap-1.5">
            {INTRO_STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === currentStep ? "w-4 bg-blue-500" : "w-1.5 bg-slate-200"
                }`}
              />
            ))}
          </div>

          {/* Button */}
          <button
            type="button"
            onClick={handleNext}
            className="mt-5 w-full rounded-xl bg-blue-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            {isLast ? "Vamos lá!" : "Continuar"}
          </button>

          {/* Skip */}
          {!isLast && (
            <button
              type="button"
              onClick={() => {
                localStorage.setItem(FIRST_VISIT_KEY, "true");
                setDismissed(true);
              }}
              className="mt-2 w-full py-2 text-xs text-slate-400 transition-colors hover:text-slate-600"
            >
              Pular apresentação
            </button>
          )}
        </div>
      </div>
    );
  }

  // Returning user — warm greeting
  return (
    <div className="fixed inset-x-0 top-16 z-40 flex justify-center px-4 animate-page-enter">
      <div className="flex w-full max-w-sm items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-lg">
        {/* Mini Lumi */}
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-blue-50 bg-blue-50">
          <Image
            src="/lumi/Lumi Neutra - Companheira Estática.png"
            alt="Lumi"
            fill
            className="object-cover"
            sizes="40px"
          />
        </div>

        {/* Greeting text */}
        <p className="flex-1 text-xs leading-relaxed text-slate-600">
          {greeting}
        </p>

        {/* Dismiss */}
        <button
          type="button"
          onClick={handleDismissGreeting}
          aria-label="Fechar"
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-slate-300 transition-colors hover:bg-slate-100 hover:text-slate-500"
        >
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
