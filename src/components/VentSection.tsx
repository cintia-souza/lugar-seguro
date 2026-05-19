"use client";

import { useState, useCallback, useRef } from "react";
import { analyzeSentiment, type BrainResponse } from "@/lib/brainEngine";
import { recordFeedback } from "@/lib/brainLearning";

const STORAGE_KEY = "meu-lugarzinho-vent-history";

interface VentEntry {
  id: string;
  timestamp: number;
  response: BrainResponse;
}

function saveEntry(entry: VentEntry): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const history: VentEntry[] = raw ? (JSON.parse(raw) as VentEntry[]) : [];
    history.unshift(entry);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, 20)));
  } catch { /* silent */ }
}

const DISTORTION_LABELS: Record<string, string> = {
  catastrofizacao: "Catastrofização",
  "tudo-ou-nada": "Tudo ou Nada",
  "leitura-mental": "Leitura Mental",
  "raciocinio-emocional": "Raciocínio Emocional",
  rotulacao: "Rotulação",
  supergeneralizacao: "Supergeneralização",
};

interface Particle {
  id: number;
  word: string;
  x: number;
  y: number;
  rotation: number;
}

export default function VentSection() {
  const [text, setText] = useState("");
  const [response, setResponse] = useState<BrainResponse | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isExploding, setIsExploding] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSubmit = useCallback(() => {
    if (!text.trim()) return;

    const result = analyzeSentiment(text);
    const words = text.split(/\s+/).slice(0, 15);
    const newParticles: Particle[] = words.map((word, i) => ({
      id: i,
      word,
      x: (Math.random() - 0.5) * 500,
      y: (Math.random() - 0.5) * 300 - 150,
      rotation: (Math.random() - 0.5) * 600,
    }));

    setParticles(newParticles);
    setIsExploding(true);
    setResponse(null);

    setTimeout(() => {
      setParticles([]);
      setIsExploding(false);
      setText("");
      setResponse(result);
      saveEntry({ id: crypto.randomUUID(), timestamp: Date.now(), response: result });
    }, 1100);
  }, [text]);

  return (
    <section aria-label="Desabafe e libere seus pensamentos" className="py-6">
      <header className="mb-6">
        <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50">
          <svg className="h-4 w-4 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-slate-800">Desabafo</h1>
        <p className="mt-1 text-sm text-slate-400">
          Escreva o que está sentindo. Ao enviar, as palavras se dissolvem — é o desapego físico do pensamento.
        </p>
      </header>

      <div ref={containerRef} className="relative overflow-hidden rounded-2xl">
        {particles.length > 0 && (
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
            {particles.map((p) => (
              <span
                key={p.id}
                className="absolute text-sm font-medium text-blue-400/70"
                style={{
                  transform: `translate(${p.x}px, ${p.y}px) rotate(${p.rotation}deg)`,
                  animation: "explode 1.1s forwards",
                }}
              >
                {p.word}
              </span>
            ))}
          </div>
        )}

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && e.ctrlKey) handleSubmit(); }}
          placeholder="Escreva o que está pesando em você…"
          aria-label="Escreva seus pensamentos"
          rows={6}
          className={`w-full resize-none rounded-2xl border border-slate-200 bg-white p-5 text-sm leading-relaxed text-slate-700 placeholder:text-slate-300 transition-all duration-500 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 ${
            isExploding ? "scale-95 opacity-0" : "scale-100 opacity-100"
          }`}
        />

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!text.trim() || isExploding}
          aria-label="Enviar e liberar"
          className="mt-3 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isExploding ? "Liberando…" : "Liberar"}
        </button>

        <p className="mt-2 text-[11px] text-slate-300">
          <kbd className="rounded bg-slate-100 px-1">Ctrl</kbd>+<kbd className="rounded bg-slate-100 px-1">Enter</kbd> para enviar
        </p>
      </div>

      {response && (
        <article aria-live="polite" className="mt-6 space-y-4 rounded-2xl border border-slate-100 bg-white p-5">
          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-blue-500">Validação</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{response.validation}</p>
          </div>
          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-emerald-500">Grounding</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{response.grounding}</p>
          </div>
          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-violet-500">Reenquadramento</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{response.reframe}</p>
          </div>
          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-amber-500">Dica prática</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{response.practicalTip}</p>
          </div>

          {response.distortions.length > 0 && (
            <details className="pt-2">
              <summary className="cursor-pointer text-[11px] text-slate-400 hover:text-slate-600">
                Padrões detectados
              </summary>
              <ul className="mt-2 space-y-1 text-[11px] text-slate-500">
                {response.distortions.map((d) => (
                  <li key={d.type}>
                    <span className="font-medium text-slate-600">{DISTORTION_LABELS[d.type] ?? d.type}</span>
                    {" — "}{d.matchedTokens.join(", ")}
                  </li>
                ))}
              </ul>
            </details>
          )}

          <div className="flex items-center gap-2 border-t border-slate-50 pt-3">
            <span className="text-[11px] text-slate-400">Isso te ajudou?</span>
            <button
              type="button"
              onClick={() => { if (response.distortions[0]) recordFeedback(response.distortions[0].type, true); }}
              className="rounded-md bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-600 transition-colors hover:bg-emerald-100"
            >
              Sim
            </button>
            <button
              type="button"
              onClick={() => { if (response.distortions[0]) recordFeedback(response.distortions[0].type, false); }}
              className="rounded-md bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-500 transition-colors hover:bg-slate-100"
            >
              Não muito
            </button>
          </div>

          {response.clinicalReport?.response.safetyBridge && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
              <p className="text-sm font-medium text-rose-700">
                {response.clinicalReport.response.safetyBridge}
              </p>
            </div>
          )}
        </article>
      )}
    </section>
  );
}
