"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/contexts/UserContext";
import { ArrowLeft, Clock, Loader2, CheckCircle, XCircle } from "lucide-react";

const STATUS_INFO = {
  "Pesanan Baru": { emoji: "🧾", desc: "Order baru diterima sistem" },
  Penjemputan: { emoji: "🚗", desc: "Kurir sedang menjemput pakaian" },
  "Sedang Dicuci": { emoji: "💧", desc: "Pakaian sedang dicuci" },
  "Sedang Disetrika": { emoji: "🔥", desc: "Proses setrika" },
  "Selesai Dicuci": { emoji: "📦", desc: "Siap dikirim" },
  "Sedang Diantar": { emoji: "🛵", desc: "Kurir mengantar pakaian" },
  Selesai: { emoji: "✅", desc: "Pesanan selesai" },
  Dibatalkan: { emoji: "❌", desc: "Pesanan dibatalkan" },
};

export default function OrderDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, loading } = useUser();

  const [order, setOrder] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loadingPage, setLoadingPage] = useState(true);

  // Fetch data pesanan & timeline
  useEffect(() => {
    if (!user) return;
    const fetchOrder = async () => {
      try {
        setLoadingPage(true);

        // Ambil data pesanan
        const { data: pesanan, error: pesananError } = await supabase
          .from("pesanan")
          .select("*")
          .eq("id_pesanan", id)
          .eq("id_pelanggan", user.id)
          .single();

        if (pesananError) throw pesananError;
        setOrder(pesanan);

        // Ambil data riwayat status
        const { data: riwayat, error: riwayatError } = await supabase
          .from("riwayat_status_pesanan")
          .select("*")
          .eq("id_pesanan", id)
          .order("waktu", { ascending: true });

        if (riwayatError) throw riwayatError;
        setTimeline(riwayat || []);
      } catch (err) {
        console.error("Gagal fetch data:", err);
      } finally {
        setLoadingPage(false);
      }
    };

    fetchOrder();
  }, [id, user]);

  //  Midtrans Snap
  useEffect(() => {
    if (!window.snap) {
      const script = document.createElement("script");
      script.src = "https://app.sandbox.midtrans.com/snap/snap.js";
      script.setAttribute(
        "data-client-key",
        process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY,
      );
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const handleSnapPay = async () => {
    if (!order?.id_pesanan) {
      console.error("❌ Order belum siap diproses pembayaran.");
      return;
    }

    try {
      // 1️Request token transaksi Midtrans
      const res = await fetch("/api/create-snap-transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gross_amount: order.total_biaya_final || 25000,
          name: user.user_metadata?.full_name || "User",
          email: user.email,
        }),
      });

      const data = await res.json();
      console.log("🧾 Midtrans token response:", data);

      if (!data.token) {
        console.error("❌ Tidak ada token dari backend:", data);
        return;
      }

      // Jalankan popup Snap
      window.snap.pay(data.token, {
        onSuccess: async (result) => {
          console.log("✅ Payment success:", result);

          // Update status pembayaran di tabel pesanan
          const { error: payErr } = await supabase
            .from("pesanan")
            .update({ status_pembayaran: "Paid" })
            .eq("id_pesanan", order.id_pesanan);

          if (payErr) console.error("⚠️ Gagal update pesanan:", payErr);

          // Insert data ke tabel pembayaran
          const { error: insertErr } = await supabase
            .from("pembayaran")
            .insert([
              {
                id_pesanan: order.id_pesanan,
                metode: result.payment_type || "QRIS",
                jumlah: order.total_biaya_final || 25000,
                tgl_pembayaran: new Date().toISOString(),
              },
            ]);

          if (insertErr) console.error("⚠️ Gagal insert pembayaran:", insertErr);

          // Tambahkan ke tabel riwayat_status_pesanan
          const { error: histErr } = await supabase
            .from("riwayat_status_pesanan")
            .insert([
              {
                id_pesanan: order.id_pesanan,
                status: "In Progress",
                deskripsi: "Pesanan dikonfirmasi setelah pembayaran berhasil.",
                waktu: new Date().toISOString(),
              },
            ]);

          if (histErr) console.error("⚠️ Gagal insert riwayat:", histErr);

          // (Opsional) kirim ke backend endpoint
          await fetch("/api/confirm-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId: order.id_pesanan,
              gross_amount: order.total_biaya_final || 25000,
              payment_method: result.payment_type || "QRIS",
            }),
          }).catch((err) => console.warn("⚠️ Backend confirm skipped:", err));

          // Refresh halaman biar data baru muncul
          window.location.reload();
        },

        onPending: (result) => {
          console.log("🕒 Pembayaran pending:", result);
        },

        onError: (result) => {
          console.error("❌ Error pembayaran:", result);
        },

        onClose: () => {
          console.log("💤 Popup ditutup user.");
        },
      });
    } catch (err) {
      console.error("💥 Error di handleSnapPay:", err);
    }
  };

  if (loading || loadingPage) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="animate-spin text-blue-500 w-8 h-8" />
        </div>
      </DashboardLayout>
    );
  }

  if (!order) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen text-gray-500">
          Pesanan tidak ditemukan 😢
        </div>
      </DashboardLayout>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending":
      case "Baru":
        return "text-yellow-600 bg-yellow-100";
      case "In Progress":
        return "text-blue-600 bg-blue-100";
      case "Done":
      case "Selesai":
        return "text-green-600 bg-green-100";
      case "Batal":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Pending":
      case "Baru":
        return <Clock size={20} className="text-yellow-500" />;
      case "In Progress":
        return <Loader2 size={20} className="text-blue-500 animate-spin" />;
      case "Done":
      case "Selesai":
        return <CheckCircle size={20} className="text-green-500" />;
      case "Batal":
        return <XCircle size={20} className="text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen p-6 flex flex-col items-center">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-6">
          {/* Back button */}
          <button
            onClick={() => router.push("/orders")}
            className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg shadow-sm 
                       hover:bg-blue-100 hover:scale-[1.03] hover:shadow-md 
                       transition-all duration-200 active:scale-95 cursor-pointer mb-4"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">Kembali</span>
          </button>

          {/* Header */}
          <div className="text-center">
            <h1 className="text-2xl font-bold text-blue-700 mb-2">
              {order.jenis_layanan}
            </h1>
            <p className="text-gray-500">
              {new Date(order.tgl_pesanan).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>

            <div
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full mt-3 text-sm font-medium ${getStatusColor(
                order.status_pesanan,
              )}`}
            >
              {getStatusIcon(order.status_pesanan)}
              {order.status_pesanan}
            </div>
          </div>

          {/* Payment Section */}
          {order.status_pembayaran === "Pending" && (
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-yellow-700 text-center mt-6">
              💰 Pesanan belum dibayar.
              <div className="mt-3">
                <Button
                  onClick={handleSnapPay}
                  className="bg-yellow-600 text-white hover:bg-yellow-700 rounded-lg px-4 py-2"
                >
                  Bayar Sekarang
                </Button>
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="mt-6 space-y-4">
            <h2 className="font-semibold text-blue-700 mb-2">
              Riwayat Pesanan 🕒
            </h2>
            {timeline.length === 0 ? (
              <p className="text-gray-500 text-sm">Belum ada riwayat</p>
            ) : (
              timeline.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 rounded-xl shadow-sm bg-gray-50 border border-gray-200"
                >
                  <CheckCircle size={20} className="text-blue-500" />
                  <div className="flex flex-col">
                    <span className="text-blue-700 font-medium">
                      {item.status}
                    </span>
                    <span className="text-gray-500 text-sm">
                      {new Date(item.waktu).toLocaleString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
