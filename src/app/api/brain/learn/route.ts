import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/session";

interface LearnRequest {
  unknownWords: string[];
  distortion: string;
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { unknownWords, distortion } = await request.json() as LearnRequest;
  if (!unknownWords?.length || !distortion) {
    return NextResponse.json({ ok: true });
  }

  const sql = getDb();
  if (!sql) return NextResponse.json({ ok: true });

  for (const word of unknownWords) {
    // Save co-occurrence
    await sql`
      INSERT INTO word_cooccurrences (user_id, word, distortion)
      VALUES (${session.userId}, ${word}, ${distortion})
    `;

    // Count how many times this word appeared with this distortion
    const countResult = await sql`
      SELECT COUNT(*) as cnt FROM word_cooccurrences
      WHERE user_id = ${session.userId} AND word = ${word} AND distortion = ${distortion}
    `;

    const count = Number((countResult[0] as { cnt: string }).cnt);

    // Promote to learned word after 3 occurrences
    if (count >= 3) {
      await sql`
        INSERT INTO learned_words (user_id, word, associated_distortion, confidence, seen_count)
        VALUES (${session.userId}, ${word}, ${distortion}, 0.4, ${count})
        ON CONFLICT (user_id, word)
        DO UPDATE SET
          confidence = LEAST(1, learned_words.confidence + 0.1),
          seen_count = ${count},
          updated_at = NOW()
      `;
    }
  }

  return NextResponse.json({ ok: true });
}
