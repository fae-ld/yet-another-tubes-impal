import midtransClient from "midtrans-client";

export async function POST(req) {
  const body = await req.json();

  const snap = new midtransClient.Snap({
    isProduction: false,
    serverKey: process.env.MIDTRANS_SERVER_KEY,
  });

  const parameter = {
    transaction_details: {
      order_id: "ORDER-" + Date.now(),
      gross_amount: body.gross_amount,
    },
    customer_details: {
      first_name: body.name,
      email: body.email,
    },
  };

  try {
    const transaction = await snap.createTransaction(parameter);
    return Response.json({ token: transaction.token });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Gagal membuat transaksi" }), {
      status: 500,
    });
  }
}