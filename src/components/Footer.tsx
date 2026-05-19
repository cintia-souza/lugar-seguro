import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-slate-100 bg-white">
      <div className="mx-auto max-w-5xl px-5 py-10">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50">
                <svg className="h-3.5 w-3.5 text-blue-500" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-slate-700">Meu Lugarzinho</span>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-slate-400">
              Plataforma gratuita e privada de autocuidado emocional. Baseada em técnicas de terapia cognitivo-comportamental.
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Ferramentas</p>
            <ul className="mt-3 space-y-2">
              <li><Link href="/desabafo" className="text-sm text-slate-500 transition-colors hover:text-blue-600">Desabafo</Link></li>
              <li><Link href="/diario" className="text-sm text-slate-500 transition-colors hover:text-blue-600">Diário</Link></li>
              <li><Link href="/relaxar" className="text-sm text-slate-500 transition-colors hover:text-blue-600">Descontração</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Segurança</p>
            <ul className="mt-3 space-y-2 text-xs text-slate-400">
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Dados criptografados localmente
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Sem rastreamento ou analytics
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Privacidade por design
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center gap-3 border-t border-slate-50 pt-6 sm:flex-row sm:justify-between">
          <p className="text-xs text-slate-300">
            © 2025 Meu Lugarzinho. Feito com cuidado.
          </p>
          <p className="text-[11px] text-slate-300">
            Este app não substitui acompanhamento profissional. Em crise: <strong className="text-slate-500">CVV 188</strong> (24h)
          </p>
        </div>
      </div>
    </footer>
  );
}
