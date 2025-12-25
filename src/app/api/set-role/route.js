import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import { supabase } from "@/lib/supabase";

export async function POST(req) {
  const { userId } = await req.json();

  if (!userId) {
    console.error("No User id");
    return NextResponse.json({ error: "User ID required" }, { status: 400 });
  }

  let role = null;

  const { data: pelanggan } = await supabase
    .from("pelanggan")
    .select("*")
    .eq("id_pelanggan", userId)
    .single();

  if (pelanggan) {
    role = "pelanggan";
  } else {
    const { data: staf } = await supabase
      .from("staf")
      .select("*")
      .eq("id_staf", userId)
      .single();

    if (staf) role = "staf";

    if (!role) {
      console.error("Gaada di staf");
      return NextResponse.json(
        { error: "User role not found" },
        { status: 400 },
      );
    }
  }

  const token = await new SignJWT({ role })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("1d")
    .sign(new TextEncoder().encode(process.env.COOKIE_SECRET));

  const res = NextResponse.json({ success: true });

  res.cookies.set({
    name: "role",
    value: token,
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: 86400,
  });

  return res;
}
