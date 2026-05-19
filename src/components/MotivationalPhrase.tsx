"use client";

import { useState, useEffect } from "react";

const PHRASES: string[] = [
  "Você não precisa resolver tudo agora. Respire.",
  "Estar aqui já é um ato de coragem.",
  "Seus sentimentos são válidos — todos eles.",
  "Um passo de cada vez. Não existe pressa para se curar.",
  "Você não está sozinho(a) nessa jornada.",
  "Permita-se sentir sem se julgar.",
  "Você é mais forte do que a sua ansiedade diz.",
  "Tudo bem não estar bem. Isso também passa.",
  "Cada respiração é um recomeço.",
];

export default function MotivationalPhrase() {
  const [phrase, setPhrase] = useState("");

  useEffect(() => {
    setPhrase(PHRASES[Math.floor(Math.random() * PHRASES.length)] as string);
  }, []);

  if (!phrase) return null;

  return (
    <div className="rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 text-center">
      <p className="text-sm italic leading-relaxed text-slate-500">
        &ldquo;{phrase}&rdquo;
      </p>
    </div>
  );
}
