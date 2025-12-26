import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const uuid = searchParams.get("uuid");

  if (!uuid) {
    return NextResponse.json({ error: "UUID wajib diisi" }, { status: 400 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  const { data, error } = await supabaseAdmin.auth.admin.getUserById(uuid);

  if (error || !data.user) {
    return NextResponse.json(
      { error: "User tidak ditemukan" },
      { status: 404 },
    );
  }

  return NextResponse.json({ user: data.user });
}
