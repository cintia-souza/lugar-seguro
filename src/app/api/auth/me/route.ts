import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getDb } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ user: null });
  }

  const sql = getDb();
  if (!sql) {
    // Return session data if DB not configured
    return NextResponse.json({
      user: { id: session.userId, name: session.name, email: session.email, createdAt: "" },
    });
  }

  const result = await sql`
    SELECT id, name, email, created_at FROM users WHERE id = ${session.userId}
  `;

  if (result.length === 0) {
    return NextResponse.json({ user: null });
  }

  const user = result[0] as { id: string; name: string; email: string; created_at: string };

  return NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, createdAt: user.created_at },
  });
}
