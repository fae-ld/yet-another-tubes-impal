import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "role";
const COOKIE_SECRET = process.env.COOKIE_SECRET;

export async function middleware(req) {
  const url = req.nextUrl.clone();
  const { pathname } = req.nextUrl;

  // exclude halaman login dan API route
  if (pathname === "/" || pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // ambil cookie role
  const token = req.cookies.get(COOKIE_NAME)?.value;

  let role = null;

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

  // jika tidak ada role → redirect ke login
  if (!role) {
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // staff hanya boleh ke /staff
  if (role === "staf" && !pathname.startsWith("/staff")) {
    url.pathname = "/staff";
    return NextResponse.redirect(url);
  }

  // pelanggan tidak boleh ke /staff
  if (role === "pelanggan" && pathname.startsWith("/staff")) {
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images).*)",
  ],
};
