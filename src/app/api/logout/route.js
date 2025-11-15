// src/app/api/logout/route.js
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET() {
  const cookieStore = cookies();

  // Hapus cookies custom yang kamu pakai
  cookieStore.set("role", "", {
    path: "/",
    maxAge: 0,
  });

  return NextResponse.json({ message: "Logged out" });
}
