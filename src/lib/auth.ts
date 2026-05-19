export interface UserProfile {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

type AuthResult =
  | { success: true; user: UserProfile }
  | { success: false; error: string };

export async function signUp(name: string, email: string, password: string): Promise<AuthResult> {
  const res = await fetch("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });

  const data = await res.json() as { user?: UserProfile; error?: string };

  if (!res.ok || !data.user) {
    return { success: false, error: data.error ?? "Erro ao criar conta." };
  }

  return { success: true, user: data.user };
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json() as { user?: UserProfile; error?: string };

  if (!res.ok || !data.user) {
    return { success: false, error: data.error ?? "E-mail ou senha incorretos." };
  }

  return { success: true, user: data.user };
}

export async function signOut(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST" });
}

export async function getCurrentUser(): Promise<UserProfile | null> {
  try {
    const res = await fetch("/api/auth/me");
    const data = await res.json() as { user: UserProfile | null };
    return data.user;
  } catch {
    return null;
  }
}

export async function resetPassword(email: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch("/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  const data = await res.json() as { message?: string; error?: string };

  if (!res.ok) {
    return { success: false, message: data.error ?? "Erro ao recuperar senha." };
  }

  return { success: true, message: data.message ?? "Senha redefinida com sucesso." };
}

export async function updateProfile(updates: { name?: string; email?: string }): Promise<AuthResult> {
  const res = await fetch("/api/auth/update-profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });

  const data = await res.json() as { user?: UserProfile; error?: string };

  if (!res.ok || !data.user) {
    return { success: false, error: data.error ?? "Erro ao atualizar perfil." };
  }

  return { success: true, user: data.user };
}
