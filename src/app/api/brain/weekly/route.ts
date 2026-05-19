import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/session";

interface PhraseRow {
  text_snippet: string;
  distortion: string;
  keywords: string[];
  created_at: string;
}

interface FeedbackRow {
  distortion: string;
  helpful: boolean;
}

interface WeeklyReport {
  period: string;
  totalInteractions: number;
  dominantCondition: string;
  distortionBreakdown: Record<string, number>;
  topThemes: string[];
  progressIndicator: string;
  clinicalInsight: string;
  recommendation: string;
  helpfulnessRate: number;
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const sql = getDb();
  if (!sql) {
    return NextResponse.json({ error: "Banco de dados não configurado." }, { status: 500 });
  }

  // Get phrases from last 7 days
  const phrases = await sql`
    SELECT text_snippet, distortion, keywords, created_at
    FROM user_phrases
    WHERE user_id = ${session.userId}
      AND created_at >= NOW() - INTERVAL '7 days'
    ORDER BY created_at DESC
  ` as PhraseRow[];

  // Get feedback from last 7 days
  const feedback = await sql`
    SELECT distortion, helpful
    FROM brain_feedback
    WHERE user_id = ${session.userId}
      AND created_at >= NOW() - INTERVAL '7 days'
  ` as FeedbackRow[];

  // Get previous week for comparison
  const prevPhrases = await sql`
    SELECT distortion
    FROM user_phrases
    WHERE user_id = ${session.userId}
      AND created_at >= NOW() - INTERVAL '14 days'
      AND created_at < NOW() - INTERVAL '7 days'
  ` as { distortion: string }[];

  if (phrases.length === 0) {
    return NextResponse.json({
      report: {
        period: getWeekPeriod(),
        totalInteractions: 0,
        dominantCondition: "nenhuma",
        distortionBreakdown: {},
        topThemes: [],
        progressIndicator: "Sem dados suficientes esta semana. Continue usando o app — cada interação ajuda a entender melhor seus padrões.",
        clinicalInsight: "",
        recommendation: "Tente usar o desabafo pelo menos 3 vezes esta semana para começarmos a identificar padrões.",
        helpfulnessRate: 0,
      } satisfies WeeklyReport,
    });
  }

  // Analyze distortion breakdown
  const distortionCount: Record<string, number> = {};
  for (const p of phrases) {
    distortionCount[p.distortion] = (distortionCount[p.distortion] ?? 0) + 1;
  }

  // Find dominant
  const dominant = Object.entries(distortionCount)
    .sort(([, a], [, b]) => b - a)[0];

  // Extract themes
  const themeCount: Record<string, number> = {};
  for (const p of phrases) {
    for (const kw of p.keywords) {
      themeCount[kw] = (themeCount[kw] ?? 0) + 1;
    }
  }
  const topThemes = Object.entries(themeCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([theme]) => theme);

  // Helpfulness rate
  const helpfulCount = feedback.filter((f) => f.helpful).length;
  const helpfulnessRate = feedback.length > 0 ? Math.round((helpfulCount / feedback.length) * 100) : 0;

  // Progress comparison
  const prevCount = prevPhrases.length;
  const currentCount = phrases.length;
  const progressIndicator = generateProgress(currentCount, prevCount, dominant?.[0] ?? "");

  // Clinical insight
  const clinicalInsight = generateInsight(distortionCount, topThemes, phrases.length);

  // Recommendation
  const recommendation = generateRecommendation(dominant?.[0] ?? "", phrases.length, helpfulnessRate);

  const report: WeeklyReport = {
    period: getWeekPeriod(),
    totalInteractions: phrases.length,
    dominantCondition: translateDistortion(dominant?.[0] ?? ""),
    distortionBreakdown: distortionCount,
    topThemes,
    progressIndicator,
    clinicalInsight,
    recommendation,
    helpfulnessRate,
  };

  return NextResponse.json({ report });
}

// ===== HELPERS =====

function getWeekPeriod(): string {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86400000);
  return `${weekAgo.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} — ${now.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}`;
}

function translateDistortion(distortion: string): string {
  const map: Record<string, string> = {
    catastrofizacao: "Catastrofização",
    "tudo-ou-nada": "Pensamento Tudo ou Nada",
    "leitura-mental": "Leitura Mental",
    "raciocinio-emocional": "Raciocínio Emocional",
    rotulacao: "Rotulação",
    supergeneralizacao: "Supergeneralização",
  };
  return map[distortion] ?? distortion;
}

function generateProgress(current: number, previous: number, dominant: string): string {
  if (previous === 0) {
    return `Esta é sua primeira semana com dados. Você registrou ${current} interações — isso já é autocuidado em ação.`;
  }

  const diff = current - previous;
  if (diff > 3) {
    return `Você interagiu mais esta semana (${current} vs ${previous} na semana anterior). Isso pode significar mais consciência emocional — ou uma semana mais difícil. Ambos são válidos.`;
  }
  if (diff < -3) {
    return `Menos interações esta semana (${current} vs ${previous}). Pode ser que você esteja se sentindo melhor — ou mais entorpecido(a). Só você sabe. E tudo bem.`;
  }
  return `Semana estável com ${current} interações. Consistência no autocuidado é um sinal de força.`;
}

function generateInsight(distortions: Record<string, number>, themes: string[], total: number): string {
  const entries = Object.entries(distortions).sort(([, a], [, b]) => b - a);
  if (entries.length === 0) return "";

  const [topDistortion, topCount] = entries[0] as [string, number];
  const percentage = Math.round((topCount / total) * 100);
  const themeText = themes.length > 0 ? `, frequentemente ligado a ${themes.slice(0, 2).join(" e ")}` : "";

  const insights: Record<string, string> = {
    catastrofizacao: `${percentage}% das suas expressões esta semana envolveram catastrofização${themeText}. Sua mente tende a imaginar o pior cenário. Isso é o sistema de proteção em overdrive — não é a realidade.`,
    "tudo-ou-nada": `${percentage}% das vezes você usou pensamento absoluto (tudo ou nada)${themeText}. Sua mente simplifica em extremos quando está sobrecarregada. A realidade geralmente mora no meio.`,
    "leitura-mental": `${percentage}% das interações envolveram leitura mental${themeText}. Você tende a assumir o que os outros pensam. Lembre-se: você não tem acesso à mente alheia.`,
    "raciocinio-emocional": `${percentage}% das vezes o raciocínio emocional dominou${themeText}. Seus sentimentos são válidos, mas nem sempre refletem fatos. Separar emoção de realidade é uma habilidade que se treina.`,
    rotulacao: `${percentage}% das expressões envolveram auto-rotulação${themeText}. Você tende a se definir por momentos ruins. Mas você é muito mais do que qualquer rótulo.`,
    supergeneralizacao: `${percentage}% das vezes houve supergeneralização${themeText}. Sua mente transforma eventos isolados em regras universais. Exceções existem — e são prova de possibilidade.`,
  };

  return insights[topDistortion] ?? `Padrão dominante: ${translateDistortion(topDistortion)} (${percentage}%)${themeText}.`;
}

function generateRecommendation(dominant: string, total: number, helpfulness: number): string {
  if (total >= 15) {
    return "Você tem usado bastante o app esta semana. Isso mostra consciência emocional. Mas se o sofrimento persiste, considere conversar com um psicólogo. O app complementa, mas não substitui acompanhamento profissional.";
  }

  if (helpfulness < 40 && total > 5) {
    return "As respostas não têm sido tão úteis pra você. Isso é feedback importante. Tente ser mais específico(a) no que escreve — quanto mais detalhes, melhor o engine entende. E considere terapia como complemento.";
  }

  const recs: Record<string, string> = {
    catastrofizacao: "Exercício da semana: quando um pensamento catastrófico surgir, escreva-o e depois escreva 3 cenários alternativos (neutro, bom, realista). Isso treina o cérebro a ver possibilidades.",
    "tudo-ou-nada": "Exercício da semana: substitua 'sempre' por 'às vezes' e 'nunca' por 'raramente' nos seus pensamentos. Anote quando conseguir. Isso reconstrói nuance.",
    "leitura-mental": "Exercício da semana: quando assumir o que alguém pensa, pergunte-se 'que evidência concreta eu tenho?' Se não tiver, solte o pensamento.",
    rotulacao: "Exercício da semana: toda noite, escreva 1 coisa que fez bem hoje. Pode ser mínima. Isso contradiz os rótulos negativos com evidência real.",
    supergeneralizacao: "Exercício da semana: quando pensar 'sempre' ou 'nunca', busque UMA exceção. Só uma. Ela é prova de que o padrão não é absoluto.",
  };

  return recs[dominant] ?? "Continue usando o app regularmente. Cada interação ensina o sistema a te entender melhor e te ajudar de forma mais personalizada.";
}
