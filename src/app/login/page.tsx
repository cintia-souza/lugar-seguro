"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "@/lib/auth";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn(email, password);
    setLoading(false);

    if (result.success) {
      refresh();
      router.push("/perfil");
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="text-4xl" aria-hidden="true">🔐</span>
          <h1 className="mt-3 text-2xl font-bold text-slate-700">Entrar</h1>
          <p className="mt-1 text-sm text-slate-400">Acesse seu lugarzinho seguro</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-600 border border-rose-200">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-600 mb-1">E-mail</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-sky-100 bg-white px-4 py-3 text-sm text-slate-700 placeholder:text-slate-300 focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-100"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-600 mb-1">Senha</label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-sky-100 bg-white px-4 py-3 text-sm text-slate-700 placeholder:text-slate-300 focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-100"
              placeholder="••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-sky-400 to-pink-400 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md disabled:opacity-50"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <div className="mt-6 space-y-2 text-center text-sm">
          <Link href="/recuperar-senha" className="block text-sky-600 hover:text-pink-500 transition-colors">
            Esqueci minha senha
          </Link>
          <p className="text-slate-400">
            Não tem conta?{" "}
            <Link href="/cadastro" className="font-medium text-sky-600 hover:text-pink-500 transition-colors">
              Criar conta
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
