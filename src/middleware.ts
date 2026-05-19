import { NextResponse, type NextRequest } from "next/server";

// Simple in-memory rate limiter (resets on deploy — use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function isRateLimited(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return false;
  }

  entry.count++;
  return entry.count > limit;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rate limit auth endpoints: 10 requests per minute per IP
  if (pathname.startsWith("/api/auth/")) {
    const ip = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "unknown";

    if (isRateLimited(ip, 10, 60_000)) {
      return NextResponse.json(
        { error: "Muitas tentativas. Aguarde um momento." },
        { status: 429 }
      );
    }
  }

  // Rate limit brain endpoints: 30 requests per minute
  if (pathname.startsWith("/api/brain/")) {
    const ip = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "unknown";

    if (isRateLimited(`brain-${ip}`, 30, 60_000)) {
      return NextResponse.json(
        { error: "Limite de requisições atingido." },
        { status: 429 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
