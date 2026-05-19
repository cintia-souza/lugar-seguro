import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db";

export async function POST(request: Request) {
  const { email } = await request.json() as { email: string };

  if (!email) {
    return NextResponse.json({ error: "E-mail é obrigatório." }, { status: 400 });
  }

  const sql = getDb();
  if (!sql) {
    return NextResponse.json({ error: "Banco de dados não configurado." }, { status: 500 });
  }

  const normalized = email.toLowerCase().trim();

  const result = await sql`SELECT id FROM users WHERE email = ${normalized}`;
  if (result.length === 0) {
    return NextResponse.json({ error: "E-mail não encontrado." }, { status: 404 });
  }

  // In production: generate token, send email with reset link
  // For now: reset to temporary password
  const tempPassword = Math.random().toString(36).slice(-8);
  const hash = await bcrypt.hash(tempPassword, 10);

  await sql`UPDATE users SET password_hash = ${hash} WHERE email = ${normalized}`;

  return NextResponse.json({
    message: `Senha redefinida para: ${tempPassword} (em produção, um e-mail seria enviado)`,
  });
}
