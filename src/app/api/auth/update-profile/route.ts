import { NextResponse } from "next/server";
import { getSession, createSession } from "@/lib/session";
import { getDb } from "@/lib/db";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { name, email } = await request.json() as { name?: string; email?: string };

  const sql = getDb();
  if (!sql) {
    return NextResponse.json({ error: "Banco de dados não configurado." }, { status: 500 });
  }

  const updates: string[] = [];
  if (name) updates.push("name");
  if (email) updates.push("email");

  if (updates.length === 0) {
    return NextResponse.json({ error: "Nenhum dado para atualizar." }, { status: 400 });
  }

  const normalizedEmail = email?.toLowerCase().trim();
  const trimmedName = name?.trim();

  await sql`
    UPDATE users SET
      name = COALESCE(${trimmedName ?? null}, name),
      email = COALESCE(${normalizedEmail ?? null}, email),
      updated_at = NOW()
    WHERE id = ${session.userId}
  `;

  // Refresh session with new data
  await createSession({
    userId: session.userId,
    email: normalizedEmail ?? session.email,
    name: trimmedName ?? session.name,
  });

  const result = await sql`SELECT id, name, email, created_at FROM users WHERE id = ${session.userId}`;
  const user = result[0] as { id: string; name: string; email: string; created_at: string };

  return NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, createdAt: user.created_at },
  });
}
