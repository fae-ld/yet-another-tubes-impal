// src/app/api/create-transaction/route.js
import midtransClient from "midtrans-client";

export async function POST(req) {
  const body = await req.json();

  // ambil origin buat callback (otomatis localhost/vercel)
  const origin = req.headers.get("origin") || "http://localhost:3000";

  // inisialisasi Core API
  const core = new midtransClient.CoreApi({
    isProduction: false,
    serverKey: process.env.MIDTRANS_SERVER_KEY,
    clientKey: process.env.MIDTRANS_CLIENT_KEY,
  });

  // parameter sesuai dokumentasi resmi Midtrans
  const parameter = {
    payment_type: "gopay",
    transaction_details: {
      order_id: "ORDER-" + Date.now(),
      gross_amount: body.gross_amount || 25000,
    },
    gopay: {
      enable_callback: true,
      callback_url: `${origin}`,
    },
  };

  try {
    const chargeResponse = await core.charge(parameter);
    return Response.json(chargeResponse);
  } catch (err) {
    console.error("Midtrans charge error:", err.ApiResponse || err);
    return new Response(
      JSON.stringify({
        error: "Gagal membuat transaksi",
        detail: err.ApiResponse || err.message,
      }),
      { status: 500 },
    );
  }
}
