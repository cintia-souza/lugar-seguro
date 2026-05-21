"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { updateProfile } from "@/lib/auth";
import LayoutWrapper from "@/components/LayoutWrapper";
import BaseCard from "@/components/BaseCard";
import ClinicalReport from "@/components/ClinicalReport";

// --- Types ---
type VisualTheme = "padrao" | "escuro" | "alto-contraste";

interface WeekMood {
  day: string;
  emotion: string;
  value: number; // 0-5 for graph
}

// --- Helpers ---
function getStats(): { diaryEntries: number; ventSessions: number; daysActive: number } {
  try {
    const diary = localStorage.getItem("meu-lugarzinho-diary");
    const vent = localStorage.getItem("meu-lugarzinho-vent-history");
    const streak = localStorage.getItem("meu-lugarzinho-streak");
    return {
      diaryEntries: diary ? (JSON.parse(diary) as unknown[]).length : 0,
      ventSessions: vent ? (JSON.parse(vent) as unknown[]).length : 0,
      daysActive: streak ? parseInt(streak, 10) : 1,
    };
  } catch { return { diaryEntries: 0, ventSessions: 0, daysActive: 1 }; }
}

function getWeekMoods(): WeekMood[] {
  try {
    const raw = localStorage.getItem("meu-lugarzinho-mood-calendar");
    if (!raw) return [];
    const calendar = JSON.parse(raw) as Record<string, { emotion: string }>;
    const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const emotionValues: Record<string, number> = {
      calm: 5, neutral: 4, anxious: 2, sad: 1, overwhelmed: 1, angry: 2, numb: 1,
    };
    const result: WeekMood[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = date.toISOString().slice(0, 10);
      const entry = calendar[key];
      result.push({
        day: days[date.getDay()] as string,
        emotion: entry?.emotion ?? "",
        value: entry ? (emotionValues[entry.emotion] ?? 3) : 3,
      });
    }
    return result;
  } catch { return []; }
}

function getTopSymptoms(): string[] {
  try {
    const raw = localStorage.getItem("meu-lugarzinho-diary");
    if (!raw) return [];
    const entries = JSON.parse(raw) as { symptoms?: string[] }[];
    const count: Record<string, number> = {};
    for (const e of entries.slice(0, 14)) {
      for (const s of e.symptoms ?? []) {
        if (s !== "Nenhum") count[s] = (count[s] ?? 0) + 1;
      }
    }
    return Object.entries(count).sort(([, a], [, b]) => b - a).slice(0, 3).map(([s]) => s);
  } catch { return []; }
}

const EMOTION_EMOJIS: Record<string, string> = {
  calm: "😌", anxious: "😰", sad: "😢", overwhelmed: "🤯", angry: "😤", numb: "😶", neutral: "🙂",
};

// --- Mini SVG Graph ---
function MoodGraph({ data }: { data: WeekMood[] }) {
  if (data.length === 0) return <p className="text-xs text-slate-400 italic">Sem dados esta semana</p>;

  const width = 280;
  const height = 80;
  const padding = 20;
  const graphWidth = width - padding * 2;
  const graphHeight = height - padding;
  const stepX = graphWidth / (data.length - 1 || 1);

  const points = data.map((d, i) => ({
    x: padding + i * stepX,
    y: height - padding - (d.value / 5) * graphHeight,
  }));

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-[280px]" aria-label="Gráfico de humor semanal">
      {/* Grid lines */}
      {[0, 1, 2, 3, 4].map((i) => (
        <line key={i} x1={padding} x2={width - padding} y1={height - padding - (i / 4) * graphHeight} y2={height - padding - (i / 4) * graphHeight} stroke="#e2e8f0" strokeWidth={0.5} />
      ))}
      {/* Line */}
      <path d={pathD} fill="none" stroke="#3b82f6" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {/* Dots */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3} fill="#3b82f6" />
      ))}
      {/* Day labels */}
      {data.map((d, i) => (
        <text key={i} x={points[i]?.x ?? 0} y={height - 2} textAnchor="middle" className="fill-slate-400 text-[8px]">
          {d.day}
        </text>
      ))}
    </svg>
  );
}

// --- Main ---
export default function PerfilPage() {
  const router = useRouter();
  const { user, isLoading, logout, refresh } = useAuth();

  // Profile
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({ diaryEntries: 0, ventSessions: 0, daysActive: 1 });

  // Password
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [passError, setPassError] = useState("");
  const [passSaved, setPassSaved] = useState(false);

  // Theme
  const [theme, setTheme] = useState<VisualTheme>("padrao");

  // Emergency
  const [therapistPhone, setTherapistPhone] = useState("");

  // Report
  const [weekMoods, setWeekMoods] = useState<WeekMood[]>([]);
  const [topSymptoms, setTopSymptoms] = useState<string[]>([]);

  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setStats(getStats());
      setWeekMoods(getWeekMoods());
      setTopSymptoms(getTopSymptoms());
      const storedTheme = localStorage.getItem("meu-lugarzinho-theme") as VisualTheme | null;
      if (storedTheme) setTheme(storedTheme);
      const storedPhone = localStorage.getItem("meu-lugarzinho-therapist-phone");
      if (storedPhone) setTherapistPhone(storedPhone);
    }
  }, [user, isLoading, router]);

  // Profile save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    const result = await updateProfile({ name, email });
    setSaving(false);
    if (result.success) { refresh(); setSaved(true); setTimeout(() => setSaved(false), 2000); }
    else setError(result.error);
  };

  // Password change
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError("");
    if (newPass.length < 6) { setPassError("Mínimo 6 caracteres."); return; }
    if (newPass !== confirmPass) { setPassError("Senhas não coincidem."); return; }
    // In production: call API to change password
    setPassSaved(true);
    setCurrentPass(""); setNewPass(""); setConfirmPass("");
    setTimeout(() => setPassSaved(false), 2000);
  };

  // Theme change
  const handleThemeChange = (t: VisualTheme) => {
    setTheme(t);
    localStorage.setItem("meu-lugarzinho-theme", t);
    if (t === "padrao") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", t);
    }
  };

  // Emergency contact save
  const handleSavePhone = () => {
    localStorage.setItem("meu-lugarzinho-therapist-phone", therapistPhone);
  };

  // Average mood
  const avgMood = weekMoods.length > 0
    ? weekMoods.filter((m) => m.emotion).reduce((acc, m) => {
        acc[m.emotion] = (acc[m.emotion] ?? 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    : {};
  const dominantMood = Object.entries(avgMood).sort(([, a], [, b]) => b - a)[0]?.[0] ?? "neutral";

  if (isLoading || !user) return null;

  return (
    <LayoutWrapper size="default">
      {/* Header */}
      <header className="mb-8 text-center">
        <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
          <span className="text-2xl">👤</span>
        </div>
        <h1 className="text-xl font-semibold text-slate-800">Olá, {user.name}</h1>
        <p className="mt-1 text-xs text-slate-400">
          Membro desde {new Date(user.createdAt).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
        </p>
      </header>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <BaseCard padding="sm">
          <div className="text-center">
            <p className="text-xl font-bold text-blue-500">{stats.diaryEntries}</p>
            <p className="mt-0.5 text-[10px] text-slate-400">Diário</p>
          </div>
        </BaseCard>
        <BaseCard padding="sm">
          <div className="text-center">
            <p className="text-xl font-bold text-violet-500">{stats.ventSessions}</p>
            <p className="mt-0.5 text-[10px] text-slate-400">Desabafos</p>
          </div>
        </BaseCard>
        <BaseCard padding="sm">
          <div className="text-center">
            <p className="text-xl font-bold text-emerald-500">{stats.daysActive}</p>
            <p className="mt-0.5 text-[10px] text-slate-400">Dias ativos</p>
          </div>
        </BaseCard>
      </div>

      <div className="space-y-5">
        {/* === DADOS PESSOAIS === */}
        <BaseCard>
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Dados pessoais</h2>
          <form onSubmit={handleSave} className="space-y-3">
            {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">{error}</p>}
            <div>
              <label htmlFor="name" className="mb-1 block text-xs font-medium text-slate-600">Nome</label>
              <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100" />
            </div>
            <div>
              <label htmlFor="email" className="mb-1 block text-xs font-medium text-slate-600">E-mail</label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100" />
            </div>
            <div className="flex items-center gap-3">
              <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                {saving ? "Salvando..." : "Salvar"}
              </button>
              {saved && <span className="text-xs text-emerald-500">✓ Salvo</span>}
            </div>
          </form>
        </BaseCard>

        {/* === TROCA DE SENHA === */}
        <BaseCard>
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Alterar senha</h2>
          <form onSubmit={handlePasswordChange} className="space-y-3">
            {passError && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">{passError}</p>}
            <input type="password" placeholder="Senha atual" value={currentPass} onChange={(e) => setCurrentPass(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm placeholder:text-slate-300 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100" />
            <input type="password" placeholder="Nova senha (mín. 6)" value={newPass} onChange={(e) => setNewPass(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm placeholder:text-slate-300 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100" />
            <input type="password" placeholder="Confirmar nova senha" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm placeholder:text-slate-300 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100" />
            <div className="flex items-center gap-3">
              <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700">Alterar senha</button>
              {passSaved && <span className="text-xs text-emerald-500">✓ Senha alterada</span>}
            </div>
          </form>
        </BaseCard>

        {/* === TEMA VISUAL === */}
        <BaseCard>
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Tema visual</h2>
          <div className="grid grid-cols-3 gap-2">
            <button type="button" onClick={() => handleThemeChange("padrao")}
              className={`rounded-xl border p-3 text-center transition-all ${theme === "padrao" ? "border-blue-300 bg-blue-50" : "border-slate-200 hover:border-slate-300"}`}>
              <div className="mx-auto mb-1.5 h-6 w-6 rounded-full bg-gradient-to-br from-blue-100 to-rose-100" />
              <p className="text-[10px] font-medium text-slate-600">Padrão</p>
            </button>
            <button type="button" onClick={() => handleThemeChange("escuro")}
              className={`rounded-xl border p-3 text-center transition-all ${theme === "escuro" ? "border-blue-300 bg-blue-50" : "border-slate-200 hover:border-slate-300"}`}>
              <div className="mx-auto mb-1.5 h-6 w-6 rounded-full bg-gradient-to-br from-indigo-900 to-slate-800" />
              <p className="text-[10px] font-medium text-slate-600">Escuro</p>
            </button>
            <button type="button" onClick={() => handleThemeChange("alto-contraste")}
              className={`rounded-xl border p-3 text-center transition-all ${theme === "alto-contraste" ? "border-blue-300 bg-blue-50" : "border-slate-200 hover:border-slate-300"}`}>
              <div className="mx-auto mb-1.5 h-6 w-6 rounded-full bg-gradient-to-br from-yellow-400 to-blue-700" />
              <p className="text-[10px] font-medium text-slate-600">Alto contraste</p>
              <p className="text-[8px] text-slate-400">Daltonismo</p>
            </button>
          </div>
        </BaseCard>

        {/* === RELATÓRIO SEMANAL === */}
        <BaseCard>
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Relatório semanal</h2>

          <div className="mb-4 flex items-center gap-4">
            <div className="text-center">
              <span className="text-3xl">{EMOTION_EMOJIS[dominantMood] ?? "🙂"}</span>
              <p className="mt-1 text-[10px] text-slate-400">Humor dominante</p>
            </div>
            <div className="flex-1">
              <MoodGraph data={weekMoods} />
            </div>
          </div>

          {topSymptoms.length > 0 && (
            <div className="mb-4">
              <p className="mb-1.5 text-[10px] font-medium text-slate-500">Sintomas mais frequentes:</p>
              <div className="flex flex-wrap gap-1.5">
                {topSymptoms.map((s) => (
                  <span key={s} className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-medium text-slate-600">{s}</span>
                ))}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => window.print()}
            className="w-full rounded-lg border border-slate-200 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
          >
            Exportar relatório (PDF)
          </button>
        </BaseCard>

        {/* === RELATÓRIO CLÍNICO === */}
        <ClinicalReport />

        {/* === CONTATOS DE EMERGÊNCIA === */}
        <BaseCard>
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Contatos de emergência</h2>

          <div className="space-y-3">
            <div>
              <label htmlFor="therapist" className="mb-1 block text-xs font-medium text-slate-600">Telefone do terapeuta</label>
              <div className="flex gap-2">
                <input id="therapist" type="tel" value={therapistPhone} onChange={(e) => setTherapistPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm placeholder:text-slate-300 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100" />
                <button type="button" onClick={handleSavePhone} className="rounded-lg bg-slate-100 px-3 text-xs font-medium text-slate-600 hover:bg-slate-200">
                  Salvar
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-3">
              <p className="text-xs font-medium text-rose-700">CVV — Centro de Valorização da Vida</p>
              <p className="mt-0.5 text-[10px] text-rose-600">Ligação gratuita, 24h, sigilo total</p>
              <a href="tel:188" className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-rose-700">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Ligar 188
              </a>
            </div>
          </div>
        </BaseCard>

        {/* === SAIR === */}
        <div className="pt-2 text-center">
          <button type="button" onClick={() => { logout(); router.push("/"); }}
            className="text-xs font-medium text-rose-500 transition-colors hover:text-rose-700">
            Sair da conta
          </button>
        </div>
      </div>
    </LayoutWrapper>
  );
}
