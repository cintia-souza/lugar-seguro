"use client";

import { useAppContext, type EmotionalState } from "@/context/AppContext";

interface Suggestion {
  message: string;
  links: { href: string; label: string }[];
}

const SUGGESTIONS: Record<EmotionalState, Suggestion> = {
  anxious: {
    message: "A ansiedade está presente. Que tal uma dessas ferramentas?",
    links: [
      { href: "/respirar", label: "Respirar" },
      { href: "/desabafo", label: "Desabafar" },
    ],
  },
  overwhelmed: {
    message: "Sobrecarga é pesado. Vamos tirar um pouco do peso?",
    links: [
      { href: "/relaxar", label: "Puzzle de foco" },
      { href: "/desabafo", label: "Colocar pra fora" },
    ],
  },
  sad: {
    message: "Tudo bem estar triste. Quer registrar o que sente?",
    links: [
      { href: "/diario", label: "Escrever no diário" },
      { href: "/desabafo", label: "Desabafar" },
    ],
  },
  angry: {
    message: "A raiva precisa de espaço. Libere aqui:",
    links: [
      { href: "/desabafo", label: "Explodir palavras" },
      { href: "/relaxar", label: "Foco no puzzle" },
    ],
  },
  numb: {
    message: "Sentir nada também é sentir. Que tal algo gentil?",
    links: [
      { href: "/diario", label: "Escrever um pouco" },
      { href: "/relaxar", label: "Mover as mãos" },
    ],
  },
  calm: {
    message: "Que bom que está calmo. Aproveite para registrar:",
    links: [
      { href: "/diario", label: "Gratidão no diário" },
    ],
  },
  neutral: { message: "", links: [] },
};

export default function ContextualSuggestion() {
  const { emotionalState } = useAppContext();
  const suggestion = SUGGESTIONS[emotionalState];

  if (!suggestion.message) return null;

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-600">{suggestion.message}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {suggestion.links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
          >
            {link.label}
          </a>
        ))}
      </div>
    </div>
  );
}
