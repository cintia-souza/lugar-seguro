"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import LayoutWrapper from "@/components/LayoutWrapper";
import DiaryBook from "@/components/DiaryBook";
import BackButton from "@/components/BackButton";

export default function DiarioPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-slate-400">Carregando...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <LayoutWrapper size="wide">
      <BackButton />
      <DiaryBook />
    </LayoutWrapper>
  );
}
