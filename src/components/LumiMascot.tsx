"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLumiBrain } from "@/hooks/useLumiBrain";

export default function LumiMascot() {
  const { config, speech, isVisible } = useLumiBrain();
  const [expanded, setExpanded] = useState(false);

  if (!isVisible) return null;

  const hasActions = config.actions.length > 0;

  return (
    <div
      className="fixed bottom-4 right-4 z-30"
      role="status"
      aria-live="polite"
      aria-label={speech ? `Lumi diz: ${speech}` : "Lumi está aqui"}
    >
      {/* Speech bubble — shows on click or when speech changes */}
      {expanded && (
        <div className="absolute bottom-16 right-0 w-64 animate-page-enter">
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xl">
            {/* Speech text */}
            {speech && (
              <p className="text-xs leading-relaxed text-slate-600">
                {speech}
              </p>
            )}

            {/* Action buttons */}
            {hasActions && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {config.actions.map((action) => (
                  <Link
                    key={action.href}
                    href={action.href}
                    onClick={() => setExpanded(false)}
                    className="rounded-lg bg-blue-50 px-2.5 py-1.5 text-[11px] font-medium text-blue-600 transition-colors hover:bg-blue-100"
                  >
                    {action.label}
                  </Link>
                ))}
              </div>
            )}

            {/* Close */}
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full text-slate-300 transition-colors hover:bg-slate-100 hover:text-slate-500"
              aria-label="Fechar"
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tail */}
          <div className="absolute -bottom-1.5 right-5 h-3 w-3 rotate-45 border-b border-r border-slate-100 bg-white" />
        </div>
      )}

      {/* Lumi avatar — click to toggle bubble */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        aria-label={expanded ? "Fechar Lumi" : "Falar com Lumi"}
        className="relative h-14 w-14 overflow-hidden rounded-full border-2 border-white bg-white shadow-lg transition-transform duration-300 hover:scale-105 active:scale-95"
      >
        <Image
          src={config.image}
          alt={config.alt}
          fill
          className="object-cover"
          sizes="56px"
          priority
        />

        {/* Notification dot when has speech */}
        {speech && !expanded && (
          <span className="absolute right-0 top-0 h-3 w-3 rounded-full border-2 border-white bg-blue-500" />
        )}
      </button>
    </div>
  );
}
