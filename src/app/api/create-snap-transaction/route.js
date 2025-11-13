// src/app/api/create-snap-transaction/route.js
import midtransClient from "midtrans-client";

export async function POST(req) {
  try {
    const body = await req.json();

    // Buat instance Snap Midtrans
    const snap = new midtransClient.Snap({
      isProduction: false,
      serverKey: process.env.MIDTRANS_SERVER_KEY,
    });

    // Dynamic order_id
    const orderId = "ORDER-" + Date.now();

    // Parameter transaksi
    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: body.gross_amount || 25000,
      },
      customer_details: {
        first_name: body.name || "Customer",
        email: body.email || "customer@example.com",
      },
      item_details: body.items || [
        {
          id: "CLEAN001",
          price: body.gross_amount || 25000,
          quantity: 1,
          name: "Jasa Laundry",
        },
      ],
      credit_card: {
        secure: true,
      },
    };

    // Buat transaksi Snap
    const transaction = await snap.createTransaction(parameter);

    // Kirim token ke frontend
    return Response.json({
      token: transaction.token,
      redirect_url: transaction.redirect_url,
      order_id: orderId,
    });
  } catch (err) {
    console.error("Midtrans Snap Error:", err);
    return new Response(
      JSON.stringify({
        error: "Gagal membuat transaksi",
        detail: err.message,
      }),
      { status: 500 },
    );
  }
}
