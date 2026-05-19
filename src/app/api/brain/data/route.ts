import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ learnedWords: [] });
  }

  const sql = getDb();
  if (!sql) return NextResponse.json({ learnedWords: [] });

  const result = await sql`
    SELECT word, associated_distortion, confidence, seen_count
    FROM learned_words
    WHERE user_id = ${session.userId} AND confidence >= 0.3
    ORDER BY confidence DESC
    LIMIT 100
  `;

  return NextResponse.json({ learnedWords: result });
}
