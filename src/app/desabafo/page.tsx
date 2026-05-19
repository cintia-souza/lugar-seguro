import type { Metadata } from "next";
import LayoutWrapper from "@/components/LayoutWrapper";
import VentSection from "@/components/VentSection";
import BackButton from "@/components/BackButton";

export const metadata: Metadata = {
  title: "Desabafo — Explosão de Palavras",
  description: "Escreva o que está sentindo e libere. Receba validação empática baseada em TCC.",
  alternates: { canonical: "/desabafo" },
};

export default function DesabafoPage() {
  return (
    <LayoutWrapper size="default">
      <BackButton />
      <VentSection />
    </LayoutWrapper>
  );
}
