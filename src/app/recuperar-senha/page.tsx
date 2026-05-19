"use client";

import { useState } from "react";
import Link from "next/link";
import { resetPassword } from "@/lib/auth";

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = await resetPassword(email);
    setLoading(false);
    setMessage(result.message);
    setIsError(!result.success);
  };

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="text-4xl" aria-hidden="true">🔑</span>
          <h1 className="mt-3 text-2xl font-bold text-slate-700">Recuperar senha</h1>
          <p className="mt-1 text-sm text-slate-400">Vamos te ajudar a voltar pro seu lugarzinho</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {message && (
            <div className={`rounded-xl px-4 py-3 text-sm border ${
              isError
                ? "bg-rose-50 text-rose-600 border-rose-200"
                : "bg-emerald-50 text-emerald-600 border-emerald-200"
            }`}>
              {message}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-600 mb-1">E-mail cadastrado</label>
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

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-sky-400 to-pink-400 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md disabled:opacity-50"
          >
            {loading ? "Enviando..." : "Recuperar senha"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Lembrou?{" "}
          <Link href="/login" className="font-medium text-sky-600 hover:text-pink-500 transition-colors">
            Voltar ao login
          </Link>
        </p>
      </div>
    </div>
  );
}
