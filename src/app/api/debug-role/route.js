import { jwtVerify } from "jose";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const token = req.cookies.get("role")?.value;

  if (!token) {
    return NextResponse.json(
      { error: "No role cookie found" },
      { status: 401 },
    );
  }

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.COOKIE_SECRET),
    );

    return NextResponse.json({ role: payload.role });
  } catch (err) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}
