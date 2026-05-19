import type { Metadata } from "next";
import LayoutWrapper from "@/components/LayoutWrapper";
import BreathingExercise from "@/components/BreathingExercise";
import BackButton from "@/components/BackButton";

export const metadata: Metadata = {
  title: "Respirar — Exercícios Guiados",
  description: "Exercícios de respiração guiados baseados em técnicas terapêuticas.",
  alternates: { canonical: "/respirar" },
};

export default function RespirarPage() {
  return (
    <LayoutWrapper size="default">
      <BackButton />
      <header className="mb-8 text-center">
        <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50">
          <svg className="h-5 w-5 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-slate-800">Exercícios de Respiração</h1>
        <p className="mt-2 text-sm text-slate-400">Escolha uma técnica e siga o ritmo.</p>
      </header>
      <BreathingExercise />
    </LayoutWrapper>
  );
}
