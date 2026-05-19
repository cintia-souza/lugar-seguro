import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/session";

interface FeedbackRequest {
  distortion: string;
  helpful: boolean;
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { distortion, helpful } = await request.json() as FeedbackRequest;
  if (!distortion) {
    return NextResponse.json({ ok: true });
  }

  const sql = getDb();
  if (!sql) return NextResponse.json({ ok: true });

  // Save feedback
  await sql`
    INSERT INTO brain_feedback (user_id, distortion, helpful)
    VALUES (${session.userId}, ${distortion}, ${helpful})
  `;

  // If unhelpful, check if we should reduce confidence
  if (!helpful) {
    const recentResult = await sql`
      SELECT helpful FROM brain_feedback
      WHERE user_id = ${session.userId} AND distortion = ${distortion}
      ORDER BY created_at DESC LIMIT 5
    `;

    const recent = recentResult as { helpful: boolean }[];
    const unhelpfulCount = recent.filter((r) => !r.helpful).length;

    // If 3+ of last 5 were unhelpful, reduce confidence of learned words
    if (unhelpfulCount >= 3) {
      await sql`
        UPDATE learned_words
        SET confidence = GREATEST(0, confidence - 0.15), updated_at = NOW()
        WHERE user_id = ${session.userId} AND associated_distortion = ${distortion}
      `;
    }
  }

  return NextResponse.json({ ok: true });
}
