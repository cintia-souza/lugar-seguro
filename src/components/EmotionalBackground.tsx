"use client";

import { useAppContext, type EmotionalState } from "@/context/AppContext";

interface SceneConfig {
  label: string;
  gradient: string;
  elements: React.ReactNode;
}

function RainScene() {
  return (
    <>
      {Array.from({ length: 15 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-px rounded-full bg-blue-300/50"
          style={{
            left: `${6 + i * 6}%`,
            height: `${6 + (i % 3) * 3}px`,
            top: "-8px",
            animation: `rainfall ${0.9 + (i % 4) * 0.15}s linear infinite`,
            animationDelay: `${(i % 6) * 0.12}s`,
          }}
        />
      ))}
      <div className="absolute bottom-0 left-0 h-4 w-full bg-gradient-to-t from-blue-50/50 to-transparent" />
    </>
  );
}

function BreezeScene() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="absolute text-emerald-400/60"
          style={{
            top: `${20 + i * 18}%`,
            left: "-8px",
            fontSize: `${9 + (i % 2) * 3}px`,
            animation: `breeze ${7 + i * 2}s ease-in-out infinite`,
            animationDelay: `${i * 1.5}s`,
          }}
        >
          🍃
        </div>
      ))}
      <div className="absolute right-4 top-4 h-6 w-6 rounded-full bg-amber-100/50 blur-sm" />
    </>
  );
}

function CloudScene() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-slate-200/40"
          style={{
            width: `${25 + (i % 3) * 12}px`,
            height: `${10 + (i % 2) * 5}px`,
            top: `${15 + i * 20}%`,
            animation: `cloudFadePass ${6 + i * 1.5}s ease-in-out infinite`,
            animationDelay: `${i * 1.2}s`,
          }}
        />
      ))}
    </>
  );
}

function FogScene() {
  return (
    <>
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-full bg-gradient-to-r from-transparent via-slate-200/25 to-transparent"
          style={{
            height: `${12 + (i % 2) * 6}px`,
            top: `${20 + i * 25}%`,
            animation: `fogdrift ${7 + i * 2}s ease-in-out infinite alternate`,
            animationDelay: `${i * 1}s`,
          }}
        />
      ))}
    </>
  );
}

function StormScene() {
  return (
    <>
      <div className="absolute inset-0 bg-rose-50/20" style={{ animation: "angerpulse 3s ease-in-out infinite" }} />
      {Array.from({ length: 2 }).map((_, i) => (
        <div
          key={i}
          className="absolute h-px bg-amber-300/40"
          style={{
            width: `${15 + i * 8}px`,
            top: `${30 + i * 25}%`,
            left: `${20 + i * 30}%`,
            animation: `lightningStrike ${2.5 + i}s ease-in-out infinite`,
            animationDelay: `${i * 1.5}s`,
          }}
        />
      ))}
    </>
  );
}

function SnowScene() {
  return (
    <>
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-slate-300/40"
          style={{
            width: `${2 + (i % 3)}px`,
            height: `${2 + (i % 3)}px`,
            left: `${8 + i * 9}%`,
            top: "-4px",
            animation: `snowfall ${4 + (i % 3) * 1.5}s linear infinite`,
            animationDelay: `${(i % 5) * 0.6}s`,
          }}
        />
      ))}
      <div className="absolute bottom-0 left-0 h-5 w-full bg-gradient-to-t from-slate-100/40 to-transparent" />
    </>
  );
}

const SCENES: Record<EmotionalState, SceneConfig | null> = {
  calm: { label: "Brisa suave", gradient: "from-emerald-50/80 to-sky-50/80", elements: <BreezeScene /> },
  anxious: { label: "Céu nublado", gradient: "from-slate-50/80 to-slate-100/80", elements: <CloudScene /> },
  sad: { label: "Dia chuvoso", gradient: "from-blue-50/80 to-slate-50/80", elements: <RainScene /> },
  overwhelmed: { label: "Névoa", gradient: "from-slate-50/80 to-violet-50/80", elements: <FogScene /> },
  angry: { label: "Tempestade", gradient: "from-rose-50/80 to-slate-50/80", elements: <StormScene /> },
  numb: { label: "Neve", gradient: "from-slate-50/80 to-white/80", elements: <SnowScene /> },
  neutral: null,
};

export default function EmotionalBackground() {
  const { emotionalState } = useAppContext();
  const scene = SCENES[emotionalState];

  if (!scene) return null;

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
      <div className={`relative h-36 overflow-hidden rounded-xl bg-gradient-to-b ${scene.gradient}`}>
        {/* Window frame lines */}
        <div className="pointer-events-none absolute inset-0 z-10">
          <div className="absolute left-1/2 top-0 h-full w-px bg-white/30" />
          <div className="absolute left-0 top-1/2 h-px w-full bg-white/30" />
        </div>
        {/* Scene */}
        <div className="absolute inset-0 overflow-hidden">
          {scene.elements}
        </div>
      </div>
      <p className="mt-2 text-center text-[10px] font-medium text-slate-400">{scene.label}</p>
    </div>
  );
}
