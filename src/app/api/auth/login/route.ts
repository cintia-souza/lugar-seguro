import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db";
import { createSession } from "@/lib/session";

export async function POST(request: Request) {
  const { email, password } = await request.json() as { email: string; password: string };

  if (!email || !password) {
    return NextResponse.json({ error: "E-mail e senha são obrigatórios." }, { status: 400 });
  }

  const sql = getDb();
  if (!sql) {
    return NextResponse.json({ error: "Banco de dados não configurado." }, { status: 500 });
  }

  const normalized = email.toLowerCase().trim();

  const result = await sql`
    SELECT id, name, email, password_hash, created_at FROM users WHERE email = ${normalized}
  `;

  if (result.length === 0) {
    return NextResponse.json({ error: "E-mail ou senha incorretos." }, { status: 401 });
  }

  const user = result[0] as { id: string; name: string; email: string; password_hash: string; created_at: string };

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return NextResponse.json({ error: "E-mail ou senha incorretos." }, { status: 401 });
  }

  await createSession({ userId: user.id, email: user.email, name: user.name });

  return NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, createdAt: user.created_at },
  });
}
