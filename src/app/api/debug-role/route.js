import { jwtVerify } from "jose";
import { NextResponse } from "next/server";

// TODO: Jangan di prod 💀😭🥀
export async function GET(req) {
  const token = req.cookies.get("role")?.value;
  let role = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(
        token,
        new TextEncoder().encode(process.env.COOKIE_SECRET),
      );
      role = payload.role;
    } catch (err) {
      console.log("Invalid token:", err);
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
  } else {
    return NextResponse.json(
      { error: "No role cookie found" },
      { status: 401 },
    );
  }

  return NextResponse.json({ role });
}
