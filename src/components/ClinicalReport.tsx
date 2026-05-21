"use client";

import { useState } from "react";
import BaseCard from "@/components/BaseCard";
import {
  type ClinicalReportData,
  translateEmotion,
  translateDistortion,
  translateTheme,
  formatReportForPrint,
} from "@/lib/clinicalReportGenerator";

type Period = 7 | 14 | 30;

export default function ClinicalReport() {
  const [report, setReport] = useState<ClinicalReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [period, setPeriod] = useState<Period>(30);
  const [showFull, setShowFull] = useState(false);

  const fetchReport = async (days: Period) => {
    setPeriod(days);
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/brain/clinical-report?days=${days}`);
      if (!res.ok) throw new Error("Erro ao gerar relatório");
      const data = await res.json() as { report: ClinicalReportData };
      setReport(data.report);
    } catch {
      setError("Não foi possível gerar o relatório. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!report) return;
    const text = formatReportForPrint(report);
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-clinico-${report.period.start.replace(/\//g, "-")}-a-${report.period.end.replace(/\//g, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    if (!report) return;
    const text = formatReportForPrint(report);
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<html><head><title>Relatório Clínico</title><style>body{font-family:monospace;white-space:pre-wrap;padding:2rem;font-size:12px;line-height:1.6}@media print{body{padding:1cm}}</style></head><body>${text.replace(/\n/g, "<br>")}</body></html>`);
    win.document.close();
    win.print();
  };

  return (
    <BaseCard>
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
        Relatório para profissional
      </h2>
      <p className="mb-4 text-[10px] text-slate-400">
        Gere um relatório estruturado para levar ao seu psicólogo ou psiquiatra.
      </p>

      {/* Period selector */}
      <div className="mb-4 flex gap-2">
        {([7, 14, 30] as Period[]).map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => fetchReport(d)}
            disabled={loading}
            className={`flex-1 rounded-lg border py-1.5 text-[10px] font-medium transition-all ${
              period === d && report
                ? "border-blue-300 bg-blue-50 text-blue-700"
                : "border-slate-200 text-slate-500 hover:border-slate-300"
            } disabled:opacity-50`}
          >
            {d} dias
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-6">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
          <span className="ml-2 text-xs text-slate-400">Analisando dados...</span>
        </div>
      )}

      {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">{error}</p>}

      {report && !loading && (
        <div className="space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-slate-50 p-2.5 text-center">
              <p className="text-lg font-bold text-blue-600">{report.totalSessions}</p>
              <p className="text-[9px] text-slate-400">Sessões</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-2.5 text-center">
              <p className="text-lg font-bold text-violet-600">{report.cognitiveDistortions.totalDetections}</p>
              <p className="text-[9px] text-slate-400">Distorções</p>
            </div>
          </div>

          {/* Emotional pattern */}
          <div>
            <p className="mb-1 text-[10px] font-medium text-slate-500">Humor predominante</p>
            <p className="text-xs text-slate-700">{translateEmotion(report.emotionalPattern.dominant)}</p>
            <div className="mt-1 flex gap-2">
              <span className={`rounded-full px-2 py-0.5 text-[9px] font-medium ${
                report.emotionalPattern.volatility === "alta" ? "bg-rose-100 text-rose-700" :
                report.emotionalPattern.volatility === "moderada" ? "bg-amber-100 text-amber-700" :
                "bg-emerald-100 text-emerald-700"
              }`}>
                Volatilidade: {report.emotionalPattern.volatility}
              </span>
              <span className={`rounded-full px-2 py-0.5 text-[9px] font-medium ${
                report.emotionalPattern.trend === "piora" ? "bg-rose-100 text-rose-700" :
                report.emotionalPattern.trend === "melhora" ? "bg-emerald-100 text-emerald-700" :
                "bg-slate-100 text-slate-600"
              }`}>
                Tendência: {report.emotionalPattern.trend}
              </span>
            </div>
          </div>

          {/* Distortions */}
          {report.cognitiveDistortions.dominant && (
            <div>
              <p className="mb-1.5 text-[10px] font-medium text-slate-500">Distorções cognitivas</p>
              <div className="space-y-1">
                {Object.entries(report.cognitiveDistortions.frequency)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 4)
                  .map(([dist, count]) => {
                    const pct = Math.round((count / Math.max(report.cognitiveDistortions.totalDetections, 1)) * 100);
                    return (
                      <div key={dist} className="flex items-center gap-2">
                        <div className="h-1.5 flex-1 rounded-full bg-slate-100">
                          <div className="h-1.5 rounded-full bg-blue-400" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="w-20 text-right text-[9px] text-slate-500 truncate">{translateDistortion(dist)}</span>
                        <span className="text-[9px] font-medium text-slate-600">{pct}%</span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Themes */}
          {report.recurringThemes.length > 0 && (
            <div>
              <p className="mb-1.5 text-[10px] font-medium text-slate-500">Temas recorrentes</p>
              <div className="flex flex-wrap gap-1">
                {report.recurringThemes.slice(0, 5).map((t) => (
                  <span key={t.theme} className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] text-slate-600">
                    {translateTheme(t.theme)} ({t.count}x)
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Clinical signals alert */}
          {(report.clinicalSignals.crisisEpisodes > 0 || report.clinicalSignals.suicidalIdeation) && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-2.5">
              <p className="text-[10px] font-medium text-rose-700">⚠️ Sinais de atenção detectados</p>
              {report.clinicalSignals.suicidalIdeation && (
                <p className="mt-1 text-[9px] text-rose-600">• Expressões compatíveis com ideação suicida</p>
              )}
              {report.clinicalSignals.crisisEpisodes > 0 && (
                <p className="mt-0.5 text-[9px] text-rose-600">• {report.clinicalSignals.crisisEpisodes} episódio(s) de crise</p>
              )}
            </div>
          )}

          {/* Night activity */}
          {report.temporalPatterns.nightActivity > 20 && (
            <div className="rounded-lg bg-indigo-50 p-2.5">
              <p className="text-[10px] text-indigo-700">
                🌙 {report.temporalPatterns.nightActivity}% da atividade ocorre entre 0h-5h
              </p>
            </div>
          )}

          {/* Toggle full details */}
          <button
            type="button"
            onClick={() => setShowFull(!showFull)}
            className="w-full text-center text-[10px] font-medium text-blue-600 hover:text-blue-700"
          >
            {showFull ? "Ocultar detalhes" : "Ver relatório completo"}
          </button>

          {showFull && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-[9px] text-slate-600 leading-relaxed whitespace-pre-wrap font-mono max-h-64 overflow-y-auto">
              {formatReportForPrint(report)}
            </div>
          )}

          {/* Export buttons */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 rounded-lg bg-blue-600 py-2 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
            >
              Imprimir / PDF
            </button>
            <button
              type="button"
              onClick={handleExport}
              className="flex-1 rounded-lg border border-slate-200 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Baixar .txt
            </button>
          </div>

          <p className="text-center text-[8px] text-slate-300">
            Este relatório não constitui diagnóstico. Use como material de apoio na consulta.
          </p>
        </div>
      )}

      {!report && !loading && !error && (
        <button
          type="button"
          onClick={() => fetchReport(30)}
          className="w-full rounded-lg border border-slate-200 py-2.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
        >
          Gerar relatório (últimos 30 dias)
        </button>
      )}
    </BaseCard>
  );
}
