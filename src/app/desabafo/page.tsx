import type { Metadata } from "next";
import LayoutWrapper from "@/components/LayoutWrapper";
import LumiChat from "@/components/LumiChat";
import BackButton from "@/components/BackButton";

export const metadata: Metadata = {
  title: "Desabafo — Conversa com a Lumi",
  description: "Converse com a Lumi em tempo real. Desabafe, receba validação empática e guarde no diário.",
  alternates: { canonical: "/desabafo" },
};

export default function DesabafoPage() {
  return (
    <LayoutWrapper size="default">
      <BackButton />
      <LumiChat />
    </LayoutWrapper>
  );
}
