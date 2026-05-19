"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signUp } from "@/lib/auth";
import { useAuth } from "@/context/AuthContext";

export default function CadastroPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    const result = await signUp(name, email, password);
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
          <span className="text-4xl" aria-hidden="true">✨</span>
          <h1 className="mt-3 text-2xl font-bold text-slate-700">Criar conta</h1>
          <p className="mt-1 text-sm text-slate-400">Seu lugarzinho vai ficar salvo pra sempre</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-600 border border-rose-200">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-600 mb-1">Como quer ser chamado(a)?</label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-sky-100 bg-white px-4 py-3 text-sm text-slate-700 placeholder:text-slate-300 focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-100"
              placeholder="Seu nome ou apelido"
            />
          </div>

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
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <div>
            <label htmlFor="confirm" className="block text-sm font-medium text-slate-600 mb-1">Confirmar senha</label>
            <input
              id="confirm"
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full rounded-xl border border-sky-100 bg-white px-4 py-3 text-sm text-slate-700 placeholder:text-slate-300 focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-100"
              placeholder="Repita a senha"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-sky-400 to-pink-400 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md disabled:opacity-50"
          >
            {loading ? "Criando..." : "Criar minha conta"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Já tem conta?{" "}
          <Link href="/login" className="font-medium text-sky-600 hover:text-pink-500 transition-colors">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
