import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/session";
import {
  type ClinicalReportData,
  calculateVolatility,
  calculateTrend,
  generateBehavioralObservations,
  translateDistortion,
} from "@/lib/clinicalReportGenerator";

// Row types
interface PhraseRow { text_snippet: string; distortion: string; keywords: string[]; created_at: string }
interface FeedbackRow { distortion: string; helpful: boolean }
interface EmotionRow { emotional_state: string; logged_date: string }
interface SessionRow { created_at: string; message_count: number; primary_mood: string }
interface VentRow { distortion_types: string[]; intensity: number; sentiment_valence: string; created_at: string }
interface DiaryRow { emotional_state: string; created_at: string }

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const sql = getDb();
  if (!sql) {
    return NextResponse.json({ error: "Banco de dados não configurado." }, { status: 500 });
  }

  // Parse period from query params (default: 30 days)
  const { searchParams } = new URL(request.url);
  const days = Math.min(parseInt(searchParams.get("days") ?? "30", 10), 90);

  // Fetch all data in parallel
  const [phrases, feedback, emotions, sessions, vents, diaries, prevPhrases, prevSessions, userName] = await Promise.all([
    sql`SELECT text_snippet, distortion, keywords, created_at FROM user_phrases WHERE user_id = ${session.userId} AND created_at >= NOW() - INTERVAL '1 day' * ${days} ORDER BY created_at DESC` as unknown as Promise<PhraseRow[]>,
    sql`SELECT distortion, helpful FROM brain_feedback WHERE user_id = ${session.userId} AND created_at >= NOW() - INTERVAL '1 day' * ${days}` as unknown as Promise<FeedbackRow[]>,
    sql`SELECT emotional_state, logged_date FROM emotion_logs WHERE user_id = ${session.userId} AND logged_date >= CURRENT_DATE - ${days} ORDER BY logged_date ASC` as unknown as Promise<EmotionRow[]>,
    sql`SELECT created_at, message_count, primary_mood FROM diary_sessions WHERE user_id = ${session.userId} AND created_at >= NOW() - INTERVAL '1 day' * ${days} ORDER BY created_at DESC` as unknown as Promise<SessionRow[]>,
    sql`SELECT distortion_types, intensity, sentiment_valence, created_at FROM vent_history WHERE user_id = ${session.userId} AND created_at >= NOW() - INTERVAL '1 day' * ${days} ORDER BY created_at DESC` as unknown as Promise<VentRow[]>,
    sql`SELECT emotional_state, created_at FROM diaries WHERE user_id = ${session.userId} AND created_at >= NOW() - INTERVAL '1 day' * ${days} ORDER BY created_at DESC` as unknown as Promise<DiaryRow[]>,
    // Previous period for comparison
    sql`SELECT text_snippet, distortion FROM user_phrases WHERE user_id = ${session.userId} AND created_at >= NOW() - INTERVAL '1 day' * ${days * 2} AND created_at < NOW() - INTERVAL '1 day' * ${days}` as unknown as Promise<PhraseRow[]>,
    sql`SELECT created_at FROM diary_sessions WHERE user_id = ${session.userId} AND created_at >= NOW() - INTERVAL '1 day' * ${days * 2} AND created_at < NOW() - INTERVAL '1 day' * ${days}` as unknown as Promise<SessionRow[]>,
    sql`SELECT name FROM users WHERE id = ${session.userId}` as unknown as Promise<{ name: string }[]>,
  ]);

  const name = userName[0]?.name ?? "Usuário";

  // --- Emotional Pattern ---
  const emotionDist: Record<string, number> = {};
  const emotionList: string[] = [];
  for (const e of emotions) {
    emotionDist[e.emotional_state] = (emotionDist[e.emotional_state] ?? 0) + 1;
    emotionList.push(e.emotional_state);
  }
  // Also count from diary entries
  for (const d of diaries) {
    emotionDist[d.emotional_state] = (emotionDist[d.emotional_state] ?? 0) + 1;
    emotionList.push(d.emotional_state);
  }
  const dominantEmotion = Object.entries(emotionDist).sort(([, a], [, b]) => b - a)[0]?.[0] ?? "neutral";
  const volatility = calculateVolatility(emotionList);
  const trend = calculateTrend(emotions.map(e => ({ emotion: e.emotional_state, date: e.logged_date })));

  // --- Cognitive Distortions ---
  const distortionFreq: Record<string, number> = {};
  const examples: { distortion: string; snippet: string; date: string }[] = [];
  for (const p of phrases) {
    distortionFreq[p.distortion] = (distortionFreq[p.distortion] ?? 0) + 1;
    if (examples.filter(e => e.distortion === p.distortion).length < 2) {
      examples.push({
        distortion: p.distortion,
        snippet: p.text_snippet.slice(0, 80),
        date: new Date(p.created_at).toLocaleDateString("pt-BR"),
      });
    }
  }
  // Also from vent history
  for (const v of vents) {
    for (const d of v.distortion_types) {
      distortionFreq[d] = (distortionFreq[d] ?? 0) + 1;
    }
  }
  const totalDistortions = Object.values(distortionFreq).reduce((a, b) => a + b, 0);
  const dominantDistortion = Object.entries(distortionFreq).sort(([, a], [, b]) => b - a)[0]?.[0] ?? "";

  // --- Themes ---
  const themeCount: Record<string, number> = {};
  for (const p of phrases) {
    for (const kw of p.keywords) {
      themeCount[kw] = (themeCount[kw] ?? 0) + 1;
    }
  }
  const totalThemeHits = Object.values(themeCount).reduce((a, b) => a + b, 0) || 1;
  const recurringThemes = Object.entries(themeCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([theme, count]) => ({ theme, count, percentage: Math.round((count / totalThemeHits) * 100) }));

  // --- Clinical Signals ---
  let anxietyIndicators = 0;
  let depressionIndicators = 0;
  let sensoryOverload = 0;
  let crisisEpisodes = 0;
  let suicidalIdeation = false;

  for (const v of vents) {
    if (v.intensity >= 0.8) crisisEpisodes++;
    if (v.sentiment_valence === "negativo" && v.intensity >= 0.6) {
      if (v.distortion_types.includes("catastrofizacao")) anxietyIndicators++;
      if (v.distortion_types.includes("rotulacao") || v.distortion_types.includes("supergeneralizacao")) depressionIndicators++;
    }
  }
  // Check phrases for crisis keywords
  const crisisKeywords = ["morrer", "suicídio", "me matar", "acabar com tudo", "não quero mais viver"];
  for (const p of phrases) {
    const lower = p.text_snippet.toLowerCase();
    if (crisisKeywords.some(k => lower.includes(k))) {
      suicidalIdeation = true;
      crisisEpisodes++;
    }
    if (lower.includes("sobrecarga") || lower.includes("meltdown") || lower.includes("barulho demais")) {
      sensoryOverload++;
    }
  }
  // Count from emotion logs
  for (const e of emotions) {
    if (e.emotional_state === "anxious") anxietyIndicators++;
    if (e.emotional_state === "sad" || e.emotional_state === "numb") depressionIndicators++;
    if (e.emotional_state === "overwhelmed") sensoryOverload++;
  }

  // --- Temporal Patterns ---
  const hourCount: Record<number, number> = {};
  const dayCount: Record<string, number> = {};
  const dayNames = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
  let nightCount = 0;
  const allTimestamps = [
    ...sessions.map(s => s.created_at),
    ...vents.map(v => v.created_at),
    ...phrases.map(p => p.created_at),
  ];

  for (const ts of allTimestamps) {
    const date = new Date(ts);
    const hour = date.getHours();
    hourCount[hour] = (hourCount[hour] ?? 0) + 1;
    const dayName = dayNames[date.getDay()] as string;
    dayCount[dayName] = (dayCount[dayName] ?? 0) + 1;
    if (hour >= 0 && hour < 5) nightCount++;
  }

  const peakHours = Object.entries(hourCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([h]) => parseInt(h, 10));
  const nightActivity = allTimestamps.length > 0 ? Math.round((nightCount / allTimestamps.length) * 100) : 0;

  // --- Self-reported symptoms (from diary localStorage — not available server-side, use diary emotional states) ---
  const symptomCount: Record<string, number> = {};
  // Use emotional states as proxy for symptoms
  for (const e of emotions) {
    if (e.emotional_state !== "neutral" && e.emotional_state !== "calm") {
      const label = e.emotional_state === "anxious" ? "Ansiedade" :
        e.emotional_state === "sad" ? "Tristeza" :
        e.emotional_state === "overwhelmed" ? "Sobrecarga" :
        e.emotional_state === "angry" ? "Irritabilidade" :
        e.emotional_state === "numb" ? "Entorpecimento" : e.emotional_state;
      symptomCount[label] = (symptomCount[label] ?? 0) + 1;
    }
  }
  const selfReportedSymptoms = Object.entries(symptomCount)
    .sort(([, a], [, b]) => b - a)
    .map(([symptom, frequency]) => ({ symptom, frequency }));

  // --- Sessions stats ---
  const totalSessions = sessions.length + vents.length;
  const totalMessages = sessions.reduce((sum, s) => sum + (s.message_count ?? 0), 0);
  const avgSessionLength = sessions.length > 0 ? Math.round(totalMessages / sessions.length) : 0;

  // --- Behavioral Observations ---
  const behavioralObservations = generateBehavioralObservations({
    nightActivity,
    avgSessionLength,
    crisisCount: crisisEpisodes,
    dominantDistortion,
    volatility,
    totalSessions,
    days,
  });

  // --- Evolution ---
  const prevDistortionCount = prevPhrases.length;
  const currentDistortionCount = phrases.length;
  const distortionChange = currentDistortionCount > prevDistortionCount * 1.3 ? "aumento" as const :
    currentDistortionCount < prevDistortionCount * 0.7 ? "reducao" as const : "estavel" as const;

  const prevSessionCount = prevSessions.length;
  const engagementChange = totalSessions > prevSessionCount * 1.3 ? "mais" as const :
    totalSessions < prevSessionCount * 0.7 ? "menos" as const : "igual" as const;

  // --- Treatment Response ---
  const helpfulByDistortion: Record<string, { helpful: number; total: number }> = {};
  for (const f of feedback) {
    if (!helpfulByDistortion[f.distortion]) helpfulByDistortion[f.distortion] = { helpful: 0, total: 0 };
    helpfulByDistortion[f.distortion].total++;
    if (f.helpful) helpfulByDistortion[f.distortion].helpful++;
  }
  const helpfulCount = feedback.filter(f => f.helpful).length;
  const helpfulnessRate = feedback.length > 0 ? Math.round((helpfulCount / feedback.length) * 100) : 0;

  const sortedByHelpfulness = Object.entries(helpfulByDistortion)
    .map(([dist, data]) => ({ dist, rate: data.total > 0 ? data.helpful / data.total : 0, total: data.total }))
    .filter(d => d.total >= 2)
    .sort((a, b) => b.rate - a.rate);

  const now = new Date();
  const startDate = new Date(now.getTime() - days * 86400000);

  const report: ClinicalReportData = {
    period: {
      start: startDate.toLocaleDateString("pt-BR"),
      end: now.toLocaleDateString("pt-BR"),
      days,
    },
    generatedAt: now.toLocaleString("pt-BR"),
    userName: name,
    totalSessions,
    totalMessages,
    averageSessionLength: avgSessionLength,
    emotionalPattern: {
      dominant: dominantEmotion,
      distribution: emotionDist,
      volatility,
      trend,
    },
    cognitiveDistortions: {
      dominant: dominantDistortion,
      frequency: distortionFreq,
      totalDetections: totalDistortions,
      examples,
    },
    recurringThemes,
    clinicalSignals: {
      anxietyIndicators,
      depressionIndicators,
      sensoryOverload,
      crisisEpisodes,
      suicidalIdeation,
    },
    temporalPatterns: {
      peakHours,
      nightActivity,
      weekdayDistribution: dayCount,
    },
    selfReportedSymptoms,
    behavioralObservations,
    evolution: {
      previousPeriodSessions: prevSessionCount,
      distortionChange,
      moodChange: trend === "insuficiente" ? "estavel" : trend,
      engagementChange,
    },
    treatmentResponse: {
      helpfulnessRate,
      mostHelpfulApproach: sortedByHelpfulness[0]?.dist ? translateDistortion(sortedByHelpfulness[0].dist) : "",
      leastHelpfulApproach: sortedByHelpfulness.length > 1 ? translateDistortion(sortedByHelpfulness[sortedByHelpfulness.length - 1]?.dist ?? "") : "",
    },
  };

  return NextResponse.json({ report });
}
