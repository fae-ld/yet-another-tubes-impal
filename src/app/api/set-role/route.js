// src/app/api/set-role/route.js
import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export async function POST(req) {
  const body = await req.json();
  const { userId } = body;

  if (!userId)
    return NextResponse.json({ error: "User ID required" }, { status: 400 });

  let role = null;

  // cek pelanggan
  const { data: pelanggan, error: pelangganError } = await supabase
    .from("pelanggan")
    .select("*")
    .eq("id_pelanggan", userId)
    .single();

  // if (pelangganError) {
  //   console.log("Error fetch pelanggan:", pelangganError);
  // } else {
  //   console.log("Pelanggan data:", pelanggan);
  // }

  if (pelanggan) role = "pelanggan";

  // cek staf
  const { data: staf, error: stafError } = await supabase
    .from("staf")
    .select("*")
    .eq("id_staf", userId)
    .single();

  // if (stafError) {
  //   console.log("Error fetch staf:", stafError);
  // } else {
  //   console.log("Staf data:", staf);
  // }

  if (staf) role = "staf";

  if (!role) {
    console.log("Role not found for userId:", userId);
    return NextResponse.json({ error: "User role not found" }, { status: 400 });
  }

  // buat token signed
  const token = await new SignJWT({ role })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("1d")
    .sign(new TextEncoder().encode(process.env.COOKIE_SECRET));

  const res = NextResponse.json({ success: true });

  res.cookies.set({
    name: "role",
    value: token,
    httpOnly: true,
    secure: false, // sesuaikan dengan environment
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });

  return res;
}
