import type { Metadata } from "next";
import LayoutWrapper from "@/components/LayoutWrapper";
import ColorPuzzle from "@/components/ColorPuzzle";
import BackButton from "@/components/BackButton";

export const metadata: Metadata = {
  title: "Descontração — Puzzles Terapêuticos",
  description: "Jogos de foco visual que ativam o córtex pré-frontal e ajudam a sair do estado de luta ou fuga.",
  alternates: { canonical: "/relaxar" },
};

export default function RelaxarPage() {
  return (
    <LayoutWrapper size="default">
      <BackButton />
      <div className="flex flex-col items-center">
        <header className="mb-8 text-center">
          <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
            <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-slate-800">Descontração</h1>
          <p className="mt-2 text-sm text-slate-400">Organize do mais claro ao mais escuro.</p>
        </header>
        <ColorPuzzle />
      </div>
    </LayoutWrapper>
  );
}
