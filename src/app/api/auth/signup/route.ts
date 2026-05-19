import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db";
import { createSession } from "@/lib/session";

export async function POST(request: Request) {
  const { name, email, password } = await request.json() as { name: string; email: string; password: string };

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Todos os campos são obrigatórios." }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: "A senha precisa ter pelo menos 6 caracteres." }, { status: 400 });
  }

  const sql = getDb();
  if (!sql) {
    return NextResponse.json({ error: "Banco de dados não configurado." }, { status: 500 });
  }

  const normalized = email.toLowerCase().trim();

  // Check if user exists
  const existing = await sql`SELECT id FROM users WHERE email = ${normalized}`;
  if (existing.length > 0) {
    return NextResponse.json({ error: "Este e-mail já está cadastrado." }, { status: 409 });
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Create user
  const result = await sql`
    INSERT INTO users (name, email, password_hash)
    VALUES (${name.trim()}, ${normalized}, ${passwordHash})
    RETURNING id, name, email, created_at
  `;

  const user = result[0] as { id: string; name: string; email: string; created_at: string };

  // Create session
  await createSession({ userId: user.id, email: user.email, name: user.name });

  return NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, createdAt: user.created_at },
  });
}
