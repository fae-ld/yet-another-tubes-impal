import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "role";
const COOKIE_SECRET = process.env.COOKIE_SECRET;

export async function middleware(req) {
  const url = req.nextUrl.clone();
  const { pathname } = req.nextUrl;

  // ambil cookie
  const token = req.cookies.get(COOKIE_NAME)?.value;

  let role = null;

  // kalau ada token, verify
  if (token) {
    try {
      const { payload } = await jwtVerify(
        token,
        new TextEncoder().encode(COOKIE_SECRET),
      );
      role = payload.role;
    } catch (err) {
      console.log("Invalid role token:", err.message);
    }
  }

  // ====== RULE: BELUM LOGIN → BEBAS MASUK KEMANA SAJA ======
  if (!role) {
    return NextResponse.next();
  }

  // ====== SUDAH LOGIN → CEK ROLE ======

  // kalau staff → hanya boleh ke /staff*
  if (role === "staf" && !pathname.startsWith("/staff")) {
    url.pathname = "/staff";
    return NextResponse.redirect(url);
  }

  // kalau pelanggan → tidak boleh ke /staff*
  if (role === "pelanggan" && pathname.startsWith("/staff")) {
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|images|api).*)"],
};
