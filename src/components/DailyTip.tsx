"use client";

import { useState, useEffect } from "react";

const TIPS: string[] = [
  "Quando a ansiedade apertar, nomeie 3 coisas azuis ao seu redor.",
  "Coloque a mão no peito e sinta sua respiração. Você está aqui.",
  "Segure gelo na mão por 30 segundos. A sensação ancora no presente.",
  "Escreva 3 coisas que deram certo hoje — mesmo pequenas.",
  "Mude de posição. Levante, estique os braços. Movimento ajuda.",
  "Diga em voz alta: 'Isso é temporário. Eu já passei por coisas difíceis.'",
  "Beba um copo de água devagar. Hidratação é autocuidado.",
  "Olhe pela janela por 30 segundos. Observe algo que se move.",
  "Aperte os dedos dos pés dentro do sapato. Ninguém percebe, mas te ancora.",
  "Nomeie 5 sons que você consegue ouvir agora.",
];

function getTipOfDay(): string {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return TIPS[dayOfYear % TIPS.length] as string;
}

export default function DailyTip() {
  const [tip, setTip] = useState("");

  useEffect(() => {
    setTip(getTipOfDay());
  }, []);

  if (!tip) return null;

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-600">Dica do dia</h3>
      <p className="text-sm leading-relaxed text-slate-600">{tip}</p>
    </div>
  );
}
