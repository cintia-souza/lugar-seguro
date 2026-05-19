"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

interface NavItem {
  href: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Início" },
  { href: "/desabafo", label: "Desabafo" },
  { href: "/diario", label: "Diário" },
  { href: "/relaxar", label: "Relaxar" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <nav
      aria-label="Navegação principal"
      className="sticky top-0 z-40 border-b border-slate-100 bg-white/80 backdrop-blur-xl"
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-semibold text-slate-800 transition-colors hover:text-blue-600"
          aria-label="Ir para a página inicial"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
            <svg className="h-4 w-4 text-blue-500" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>
          <span className="hidden text-sm sm:inline">Meu Lugarzinho</span>
        </Link>

        <div className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                }`}
              >
                {item.label}
              </Link>
            );
          })}

          <div className="ml-3 h-5 w-px bg-slate-200" />

          {user ? (
            <Link
              href="/perfil"
              className={`ml-2 flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                pathname === "/perfil"
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              <div className="h-5 w-5 rounded-full bg-gradient-to-br from-blue-400 to-indigo-400" />
              <span className="hidden sm:inline">{user.name.split(" ")[0]}</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="ml-2 rounded-lg bg-blue-600 px-3.5 py-1.5 text-sm font-medium text-white transition-all hover:bg-blue-700"
            >
              Entrar
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
