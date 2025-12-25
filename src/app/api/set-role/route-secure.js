// app/api/set-role/route.js - PERBAIKAN MINIMAL
import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// GUNAKAN ANON KEY, BUKAN SERVICE ROLE!
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, // <- INI!
);

export async function POST(req) {
  try {
    // AMBIL SESSION DARI COOKIE/HEADER, BUKAN USER ID DARI BODY!
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: "Unauthorized" }, 
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    // VERIFIKASI USER DARI SUPABASE AUTH
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Invalid token" }, 
        { status: 401 }
      );
    }

    // PAKAI user.id dari Supabase Auth, bukan dari client!
    const userId = user.id;
    let role = null;

    // Cari berdasarkan auth_user_id, bukan id_pelanggan langsung
    const { data: pelanggan } = await supabase
      .from("pelanggan")
      .select("*")
      .eq("auth_user_id", userId)  // <- KOLOM INI HARUS ADA
      .single();

    if (pelanggan) {
      role = "pelanggan";
    } else {
      const { data: staf } = await supabase
        .from("staf")
        .select("*")
        .eq("auth_user_id", userId)  // <- KOLOM INI HARUS ADA
        .single();

      if (staf) role = "staf";

      if (!role) {
        return NextResponse.json(
          { error: "User role not found" },
          { status: 404 }, // <- 404 lebih tepat
        );
      }
    }

    const token = await new SignJWT({ 
      role,
      userId: user.id, // Pakai verified user.id
      email: user.email 
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("1d")
      .sign(new TextEncoder().encode(process.env.JWT_SECRET));

    const res = NextResponse.json({ success: true, role });

    res.cookies.set({
      name: "session-token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // <- Auto secure di prod
      sameSite: "lax",
      path: "/",
      maxAge: 86400,
    });

    return res;
  } catch (error) {
    console.error("Set-role error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}