import type { Metadata } from "next";
import LayoutWrapper from "@/components/LayoutWrapper";
import BaseCard from "@/components/BaseCard";
import SensoryPanel from "@/components/SensoryPanel";
import MotivationalPhrase from "@/components/MotivationalPhrase";
import TimeGreeting from "@/components/TimeGreeting";
import SelfCareStreak from "@/components/SelfCareStreak";
import QuickBreath from "@/components/QuickBreath";
import DailyTip from "@/components/DailyTip";
import WeeklySummary from "@/components/WeeklySummary";
import ContextualSuggestion from "@/components/ContextualSuggestion";
import AmbientPlayer from "@/components/AmbientPlayer";

export const metadata: Metadata = {
  title: "Meu Lugarzinho — Autocuidado emocional gratuito para ansiedade e neurodivergência",
  description:
    "Plataforma gratuita e privada de autocuidado emocional. Desabafe com análise empática baseada em TCC, escreva no diário emocional, pratique exercícios de respiração e puzzles terapêuticos. Ideal para ansiedade, depressão e autismo.",
  alternates: { canonical: "/" },
};

// JSON-LD Structured Data for rich Google results
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Meu Lugarzinho",
  description: "Plataforma gratuita de autocuidado emocional para ansiedade, depressão e neurodivergência.",
  url: "https://meulugarzinho.com.br",
  applicationCategory: "HealthApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "BRL",
  },
  featureList: [
    "Diário emocional com análise de humor",
    "Desabafo com validação empática baseada em TCC",
    "Exercícios de respiração guiados",
    "Puzzles terapêuticos para foco",
    "Mascote interativa Lumi",
    "100% privado — dados criptografados",
  ],
  inLanguage: "pt-BR",
};

export default function HomePage() {
  return (
    <LayoutWrapper size="wide">
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Header */}
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <TimeGreeting />
        <SelfCareStreak />
      </header>

      {/* Motivational */}
      <section className="mb-6">
        <MotivationalPhrase />
      </section>

      {/* Main grid */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* Left */}
        <div className="flex flex-col gap-4 lg:col-span-3">
          <BaseCard>
            <SensoryPanel />
          </BaseCard>

          <AmbientPlayer />

          <ContextualSuggestion />

          <BaseCard>
            <QuickBreath />
          </BaseCard>
        </div>

        {/* Right */}
        <div className="flex flex-col gap-4 lg:col-span-2">
          <DailyTip />
          <WeeklySummary />

          <BaseCard padding="sm">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Acesso rápido</h3>
            <div className="grid grid-cols-2 gap-2">
              <a href="/desabafo" className="rounded-xl border border-slate-100 bg-slate-50/80 py-2.5 text-center text-xs font-medium text-slate-600 transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700">
                Desabafar
              </a>
              <a href="/diario" className="rounded-xl border border-slate-100 bg-slate-50/80 py-2.5 text-center text-xs font-medium text-slate-600 transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700">
                Diário
              </a>
              <a href="/relaxar" className="rounded-xl border border-slate-100 bg-slate-50/80 py-2.5 text-center text-xs font-medium text-slate-600 transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700">
                Puzzle
              </a>
              <a href="/respirar" className="rounded-xl border border-slate-100 bg-slate-50/80 py-2.5 text-center text-xs font-medium text-slate-600 transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700">
                Respirar
              </a>
            </div>
          </BaseCard>
        </div>
      </div>

      {/* Tools */}
      <section className="mt-8">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Ferramentas</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <a href="/desabafo" className="group overflow-hidden rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-sm transition-all hover:border-blue-200 hover:shadow-md">
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-500">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-700">Desabafo</p>
            <p className="mt-0.5 text-[11px] leading-tight text-slate-400">Escreva e libere</p>
          </a>

          <a href="/diario" className="group overflow-hidden rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-sm transition-all hover:border-blue-200 hover:shadow-md">
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-500">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-700">Diário</p>
            <p className="mt-0.5 text-[11px] leading-tight text-slate-400">Registro pessoal</p>
          </a>

          <a href="/relaxar" className="group overflow-hidden rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-sm transition-all hover:border-blue-200 hover:shadow-md">
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-500">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-700">Puzzle</p>
            <p className="mt-0.5 text-[11px] leading-tight text-slate-400">Foco terapêutico</p>
          </a>

          <a href="/respirar" className="group overflow-hidden rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-sm transition-all hover:border-blue-200 hover:shadow-md">
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-500">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-700">Respirar</p>
            <p className="mt-0.5 text-[11px] leading-tight text-slate-400">Exercícios guiados</p>
          </a>
        </div>
      </section>
    </LayoutWrapper>
  );
}
