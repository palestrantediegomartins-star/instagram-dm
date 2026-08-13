import { NextRequest, NextResponse } from "next/server";
import { verifySessionValue, SESSION_COOKIE } from "@/lib/session";

/** Protege o painel: sem sessão válida, vai pro /login. */
export async function middleware(req: NextRequest) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return NextResponse.redirect(new URL("/login", req.url));
  const cookie = req.cookies.get(SESSION_COOKIE)?.value;
  const ok = await verifySessionValue(cookie, secret);
  if (!ok) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/automations/:path*",
    "/atividade",
    "/api/auth/instagram",
  ],
};
