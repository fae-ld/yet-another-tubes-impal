// src/app/api/confirm-payment/route.js
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req) {
  try {
    const { orderId, gross_amount, payment_method } = await req.json();

    // ✅ Insert ke tabel pembayaran
    const { error: payErr } = await supabase.from("pembayaran").insert({
      id_pesanan: orderId,
      metode: payment_method || "Midtrans",
      jumlah: gross_amount,
      tgl_pembayaran: new Date().toISOString(),
    });
    if (payErr) throw payErr;

    // ✅ Update status pesanan
    const { error: orderErr } = await supabase
      .from("pesanan")
      .update({
        status_pembayaran: "Paid",
        status_pesanan: "In Progress",
      })
      .eq("id_pesanan", orderId);
    if (orderErr) throw orderErr;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ confirm-payment error:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}
