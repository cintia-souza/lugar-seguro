import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/session";

interface ResponseRequest {
  text: string;
  distortion: string;
  keywords: string[];
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: true });

  const { text, distortion, keywords } = await request.json() as ResponseRequest;
  if (!text || !distortion) return NextResponse.json({ ok: true });

  const sql = getDb();
  if (!sql) return NextResponse.json({ ok: true });

  await sql`
    INSERT INTO user_phrases (user_id, text_snippet, distortion, keywords)
    VALUES (${session.userId}, ${text.slice(0, 200)}, ${distortion}, ${keywords})
  `;

  return NextResponse.json({ ok: true });
}
