"use client";

import { useState, useEffect } from "react";

interface Greeting {
  text: string;
  sub: string;
}

function getGreeting(): Greeting {
  const hour = new Date().getHours();
  if (hour < 6) return { text: "Boa madrugada", sub: "Não consegue dormir? Tudo bem, estou aqui." };
  if (hour < 12) return { text: "Bom dia", sub: "Que bom te ver por aqui." };
  if (hour < 18) return { text: "Boa tarde", sub: "Como está sendo o seu dia?" };
  return { text: "Boa noite", sub: "Descanse. Você merece." };
}

export default function TimeGreeting() {
  const [greeting, setGreeting] = useState<Greeting | null>(null);

  useEffect(() => {
    setGreeting(getGreeting());
  }, []);

  if (!greeting) return null;

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-800">{greeting.text}</h1>
      <p className="mt-0.5 text-sm text-slate-400">{greeting.sub}</p>
    </div>
  );
}
