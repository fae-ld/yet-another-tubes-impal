import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req) {
  try {
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // Admin client pakai SERVICE ROLE KEY (HARUS dari env server)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 1. Hapus ulasan user
    await supabaseAdmin.from("ulasan").delete().eq("id_pelanggan", userId);

    // 2. Hapus notifikasi user
    await supabaseAdmin.from("notifikasi").delete().eq("id_user", userId);

    // 3. Ambil semua id_pesanan user
    const { data: pesanan } = await supabaseAdmin
      .from("pesanan")
      .select("id_pesanan")
      .eq("id_pelanggan", userId);

    if (pesanan?.length > 0) {
      for (const p of pesanan) {
        await supabaseAdmin
          .from("riwayat_status_pesanan")
          .delete()
          .eq("id_pesanan", p.id_pesanan);
      }
    }

    // 4. Hapus pesanan user
    await supabaseAdmin.from("pesanan").delete().eq("id_pelanggan", userId);

    // 5. Hapus row pelanggan
    await supabaseAdmin
      .from("pelanggan")
      .delete()
      .eq("id_pelanggan", userId);

    // 6. Hapus auth user
    const { error: deleteError } =
      await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete account error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}