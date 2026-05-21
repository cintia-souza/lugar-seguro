// Gerador de Relatório Clínico para Profissionais de Saúde Mental
// Estrutura dados coletados pela Lumi em formato útil para psicólogos/psiquiatras
// Não é diagnóstico — é observação comportamental e padrões auto-reportados

export interface ClinicalReportData {
  // Metadata
  period: { start: string; end: string; days: number };
  generatedAt: string;
  userName: string;

  // Dados quantitativos
  totalSessions: number;
  totalMessages: number;
  averageSessionLength: number; // mensagens por sessão

  // Padrões emocionais
  emotionalPattern: {
    dominant: string;
    distribution: Record<string, number>; // emotion -> count
    volatility: "estavel" | "moderada" | "alta"; // variação entre dias
    trend: "melhora" | "estavel" | "piora" | "insuficiente";
  };

  // Distorções cognitivas
  cognitiveDistortions: {
    dominant: string;
    frequency: Record<string, number>;
    totalDetections: number;
    examples: { distortion: string; snippet: string; date: string }[];
  };

  // Temas recorrentes
  recurringThemes: { theme: string; count: number; percentage: number }[];

  // Sinais clínicos
  clinicalSignals: {
    anxietyIndicators: number;
    depressionIndicators: number;
    sensoryOverload: number;
    crisisEpisodes: number;
    suicidalIdeation: boolean;
  };

  // Padrões temporais
  temporalPatterns: {
    peakHours: number[]; // horas com mais atividade
    nightActivity: number; // % de atividade entre 0h-5h
    weekdayDistribution: Record<string, number>;
  };

  // Sintomas auto-reportados (do diário)
  selfReportedSymptoms: { symptom: string; frequency: number }[];

  // Comportamento observado
  behavioralObservations: string[];

  // Evolução (comparação com período anterior)
  evolution: {
    previousPeriodSessions: number;
    distortionChange: "aumento" | "estavel" | "reducao";
    moodChange: "melhora" | "estavel" | "piora";
    engagementChange: "mais" | "igual" | "menos";
  };

  // Resposta ao tratamento (feedback)
  treatmentResponse: {
    helpfulnessRate: number; // 0-100
    mostHelpfulApproach: string;
    leastHelpfulApproach: string;
  };
}

// Tradução de emoções para linguagem clínica
const EMOTION_CLINICAL: Record<string, string> = {
  calm: "Calmo/Estável",
  anxious: "Ansioso",
  sad: "Triste/Deprimido",
  overwhelmed: "Sobrecarregado",
  angry: "Irritado/Raivoso",
  numb: "Entorpecido/Anedonia",
  neutral: "Neutro",
};

const DISTORTION_CLINICAL: Record<string, string> = {
  catastrofizacao: "Catastrofização",
  "tudo-ou-nada": "Pensamento Dicotômico (Tudo ou Nada)",
  "leitura-mental": "Leitura Mental / Inferência Arbitrária",
  "raciocinio-emocional": "Raciocínio Emocional",
  rotulacao: "Rotulação / Auto-depreciação",
  supergeneralizacao: "Supergeneralização",
};

const THEME_CLINICAL: Record<string, string> = {
  trabalho: "Estresse ocupacional",
  relacionamento: "Conflitos afetivos/relacionais",
  familia: "Dinâmica familiar",
  solidao: "Isolamento social",
  ansiedade: "Sintomas ansiosos",
  depressao: "Sintomas depressivos",
  autoestima: "Baixa autoestima / Autoimagem negativa",
  insonia: "Distúrbios do sono",
  luto: "Processo de luto",
  futuro: "Ansiedade antecipatória / Incerteza",
  escola: "Estresse acadêmico",
  saude: "Preocupações com saúde",
};

export function translateEmotion(emotion: string): string {
  return EMOTION_CLINICAL[emotion] ?? emotion;
}

export function translateDistortion(distortion: string): string {
  return DISTORTION_CLINICAL[distortion] ?? distortion;
}

export function translateTheme(theme: string): string {
  return THEME_CLINICAL[theme] ?? theme;
}

// Calcula volatilidade emocional
export function calculateVolatility(emotions: string[]): "estavel" | "moderada" | "alta" {
  if (emotions.length < 3) return "estavel";
  let changes = 0;
  for (let i = 1; i < emotions.length; i++) {
    if (emotions[i] !== emotions[i - 1]) changes++;
  }
  const rate = changes / (emotions.length - 1);
  if (rate > 0.7) return "alta";
  if (rate > 0.4) return "moderada";
  return "estavel";
}

// Calcula tendência emocional
const EMOTION_VALENCE: Record<string, number> = {
  calm: 5, neutral: 4, anxious: 2, sad: 1, overwhelmed: 1, angry: 2, numb: 0,
};

export function calculateTrend(emotions: { emotion: string; date: string }[]): "melhora" | "estavel" | "piora" | "insuficiente" {
  if (emotions.length < 5) return "insuficiente";

  const half = Math.floor(emotions.length / 2);
  const firstHalf = emotions.slice(0, half);
  const secondHalf = emotions.slice(half);

  const avgFirst = firstHalf.reduce((sum, e) => sum + (EMOTION_VALENCE[e.emotion] ?? 3), 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((sum, e) => sum + (EMOTION_VALENCE[e.emotion] ?? 3), 0) / secondHalf.length;

  const diff = avgSecond - avgFirst;
  if (diff > 0.5) return "melhora";
  if (diff < -0.5) return "piora";
  return "estavel";
}

// Gera observações comportamentais a partir dos dados
export function generateBehavioralObservations(data: {
  nightActivity: number;
  avgSessionLength: number;
  crisisCount: number;
  dominantDistortion: string;
  volatility: string;
  totalSessions: number;
  days: number;
}): string[] {
  const obs: string[] = [];

  if (data.nightActivity > 30) {
    obs.push(`Atividade noturna significativa (${data.nightActivity}% entre 0h-5h) — possível indicador de insônia ou ruminação noturna.`);
  }

  if (data.avgSessionLength > 15) {
    obs.push(`Sessões longas (média ${data.avgSessionLength} mensagens) — sugere necessidade intensa de expressão ou dificuldade de regulação.`);
  }

  if (data.crisisCount > 0) {
    obs.push(`${data.crisisCount} episódio(s) de crise detectado(s) no período — conteúdo com indicadores de risco ativou protocolo de segurança.`);
  }

  if (data.dominantDistortion === "rotulacao") {
    obs.push("Padrão predominante de auto-rotulação negativa — possível indicador de baixa autoestima crônica.");
  }

  if (data.dominantDistortion === "catastrofizacao") {
    obs.push("Catastrofização frequente — hiperativação do sistema de ameaça, comum em transtornos ansiosos.");
  }

  if (data.volatility === "alta") {
    obs.push("Alta volatilidade emocional — mudanças frequentes de estado entre dias, possível desregulação afetiva.");
  }

  const frequency = data.totalSessions / Math.max(data.days, 1);
  if (frequency > 2) {
    obs.push(`Uso frequente (${frequency.toFixed(1)}x/dia) — indica alta necessidade de suporte emocional no período.`);
  }

  if (obs.length === 0) {
    obs.push("Padrão de uso dentro do esperado para o período observado.");
  }

  return obs;
}

// Formata o relatório em texto para impressão/PDF
export function formatReportForPrint(report: ClinicalReportData): string {
  const lines: string[] = [];

  lines.push("═══════════════════════════════════════════════════════════════");
  lines.push("        RELATÓRIO DE OBSERVAÇÃO COMPORTAMENTAL");
  lines.push("        Gerado por: Meu Lugarzinho (ferramenta de autocuidado)");
  lines.push("═══════════════════════════════════════════════════════════════");
  lines.push("");
  lines.push("⚠️  AVISO: Este relatório NÃO constitui diagnóstico clínico.");
  lines.push("    São observações baseadas em auto-relato e análise de padrões");
  lines.push("    textuais. Deve ser usado como material complementar pelo");
  lines.push("    profissional de saúde mental responsável.");
  lines.push("");
  lines.push("───────────────────────────────────────────────────────────────");
  lines.push("DADOS DO PACIENTE");
  lines.push(`  Nome: ${report.userName}`);
  lines.push(`  Período: ${report.period.start} a ${report.period.end} (${report.period.days} dias)`);
  lines.push(`  Gerado em: ${report.generatedAt}`);
  lines.push("");

  lines.push("───────────────────────────────────────────────────────────────");
  lines.push("1. ENGAJAMENTO");
  lines.push(`  • Sessões no período: ${report.totalSessions}`);
  lines.push(`  • Total de mensagens: ${report.totalMessages}`);
  lines.push(`  • Média por sessão: ${report.averageSessionLength} mensagens`);
  lines.push("");

  lines.push("───────────────────────────────────────────────────────────────");
  lines.push("2. PADRÃO EMOCIONAL");
  lines.push(`  • Humor predominante: ${translateEmotion(report.emotionalPattern.dominant)}`);
  lines.push(`  • Volatilidade: ${report.emotionalPattern.volatility}`);
  lines.push(`  • Tendência: ${report.emotionalPattern.trend}`);
  lines.push("  • Distribuição:");
  for (const [emotion, count] of Object.entries(report.emotionalPattern.distribution)) {
    lines.push(`      ${translateEmotion(emotion)}: ${count} dia(s)`);
  }
  lines.push("");

  lines.push("───────────────────────────────────────────────────────────────");
  lines.push("3. DISTORÇÕES COGNITIVAS IDENTIFICADAS");
  lines.push(`  • Total de detecções: ${report.cognitiveDistortions.totalDetections}`);
  lines.push(`  • Predominante: ${translateDistortion(report.cognitiveDistortions.dominant)}`);
  lines.push("  • Frequência:");
  for (const [dist, count] of Object.entries(report.cognitiveDistortions.frequency)) {
    const pct = Math.round((count / Math.max(report.cognitiveDistortions.totalDetections, 1)) * 100);
    lines.push(`      ${translateDistortion(dist)}: ${count}x (${pct}%)`);
  }
  if (report.cognitiveDistortions.examples.length > 0) {
    lines.push("  • Exemplos representativos:");
    for (const ex of report.cognitiveDistortions.examples.slice(0, 5)) {
      lines.push(`      [${ex.date}] ${translateDistortion(ex.distortion)}: "${ex.snippet}"`);
    }
  }
  lines.push("");

  lines.push("───────────────────────────────────────────────────────────────");
  lines.push("4. TEMAS RECORRENTES");
  for (const t of report.recurringThemes) {
    lines.push(`  • ${translateTheme(t.theme)}: ${t.count}x (${t.percentage}%)`);
  }
  lines.push("");

  lines.push("───────────────────────────────────────────────────────────────");
  lines.push("5. SINAIS CLÍNICOS OBSERVADOS");
  lines.push(`  • Indicadores de ansiedade: ${report.clinicalSignals.anxietyIndicators}`);
  lines.push(`  • Indicadores de depressão: ${report.clinicalSignals.depressionIndicators}`);
  lines.push(`  • Sobrecarga sensorial: ${report.clinicalSignals.sensoryOverload}`);
  lines.push(`  • Episódios de crise: ${report.clinicalSignals.crisisEpisodes}`);
  if (report.clinicalSignals.suicidalIdeation) {
    lines.push("  ⚠️  ATENÇÃO: Foram detectadas expressões compatíveis com ideação suicida.");
  }
  lines.push("");

  lines.push("───────────────────────────────────────────────────────────────");
  lines.push("6. PADRÕES TEMPORAIS");
  lines.push(`  • Horários de pico: ${report.temporalPatterns.peakHours.map(h => `${h}h`).join(", ")}`);
  lines.push(`  • Atividade noturna (0h-5h): ${report.temporalPatterns.nightActivity}%`);
  lines.push("  • Distribuição semanal:");
  for (const [day, count] of Object.entries(report.temporalPatterns.weekdayDistribution)) {
    lines.push(`      ${day}: ${count} sessão(ões)`);
  }
  lines.push("");

  if (report.selfReportedSymptoms.length > 0) {
    lines.push("───────────────────────────────────────────────────────────────");
    lines.push("7. SINTOMAS AUTO-REPORTADOS (Diário)");
    for (const s of report.selfReportedSymptoms) {
      lines.push(`  • ${s.symptom}: ${s.frequency}x`);
    }
    lines.push("");
  }

  lines.push("───────────────────────────────────────────────────────────────");
  lines.push("8. OBSERVAÇÕES COMPORTAMENTAIS");
  for (const obs of report.behavioralObservations) {
    lines.push(`  • ${obs}`);
  }
  lines.push("");

  lines.push("───────────────────────────────────────────────────────────────");
  lines.push("9. EVOLUÇÃO (vs. período anterior)");
  lines.push(`  • Sessões: ${report.evolution.previousPeriodSessions} → ${report.totalSessions} (${report.evolution.engagementChange})`);
  lines.push(`  • Distorções: ${report.evolution.distortionChange}`);
  lines.push(`  • Humor: ${report.evolution.moodChange}`);
  lines.push("");

  lines.push("───────────────────────────────────────────────────────────────");
  lines.push("10. RESPOSTA ÀS INTERVENÇÕES");
  lines.push(`  • Taxa de utilidade reportada: ${report.treatmentResponse.helpfulnessRate}%`);
  if (report.treatmentResponse.mostHelpfulApproach) {
    lines.push(`  • Abordagem mais eficaz: ${translateDistortion(report.treatmentResponse.mostHelpfulApproach)}`);
  }
  if (report.treatmentResponse.leastHelpfulApproach) {
    lines.push(`  • Abordagem menos eficaz: ${translateDistortion(report.treatmentResponse.leastHelpfulApproach)}`);
  }
  lines.push("");

  lines.push("═══════════════════════════════════════════════════════════════");
  lines.push("Este documento foi gerado automaticamente pela plataforma");
  lines.push("Meu Lugarzinho como material de apoio para acompanhamento");
  lines.push("profissional. Não substitui avaliação clínica.");
  lines.push("═══════════════════════════════════════════════════════════════");

  return lines.join("\n");
}
