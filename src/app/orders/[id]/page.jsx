"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/contexts/UserContext";
import { ArrowLeft, Clock, Loader2, CheckCircle, XCircle } from "lucide-react";

// =========================================================
// KONSTANTA STATUS BARU
// =========================================================
const STATUS_INFO = {
  "Pesanan Dibuat": { emoji: "🧾", desc: "Order berhasil dibuat, menunggu penjemputan." },
  "Penjemputan": { emoji: "🚗", desc: "Kurir sedang menjemput pakaian ke alamat pelanggan." },
  "Verifikasi Berat": { emoji: "⚖️", desc: "Pakaian sudah diterima dan sedang ditimbang/diverifikasi." },
  "Menunggu Pembayaran": { emoji: "💳", desc: "Harga final telah dikonfirmasi, menunggu pembayaran pelanggan." },
  "Sedang Dicuci": { emoji: "💧", desc: "Proses pencucian dimulai (setelah pembayaran lunas)." },
  "Sedang Disetrika": { emoji: "🔥", desc: "Proses setrika / finishing sedang berlangsung." },
  "Selesai Dicuci": { emoji: "📦", desc: "Semua pakaian selesai dicuci dan disetrika, siap dikirim." },
  "Sedang Diantar": { emoji: "🛵", desc: "Kurir mengantar pakaian kembali ke pelanggan." },
  "Selesai": { emoji: "✅", desc: "Pesanan diterima pelanggan, transaksi selesai." },
  "Dibatalkan": { emoji: "❌", desc: "Pesanan dibatalkan (oleh pelanggan/admin)." },
};

// =========================================================
// FUNGSI UTILITY: MAPPING SUB-STATUS KE SUPER STATUS
// =========================================================
const getSuperStatus = (subStatus) => {
  if (subStatus === "Selesai") return "Done";
  if (subStatus === "Dibatalkan") return "Batal";

  if (
    [
      "Penjemputan",
      "Verifikasi Berat",
      "Sedang Dicuci",
      "Sedang Disetrika",
      "Selesai Dicuci",
      "Sedang Diantar",
    ].includes(subStatus)
  ) {
    return "In Progress";
  }

  if (
    [
      "Pesanan Dibuat",
      "Menunggu Pembayaran",
    ].includes(subStatus)
  ) {
    return "Pending";
  }
  return "Pending";
};


export default function OrderDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, loading } = useUser();

  const [order, setOrder] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loadingPage, setLoadingPage] = useState(true);
  const [paymentData, setPaymentData] = useState({});

  // Fetch data pesanan & timeline
  useEffect(() => {
    if (!user || loading) return;
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

        if (pesananError) {
            // Logika untuk 404 jika pesanan tidak ditemukan atau tidak valid
            if (pesananError.code === "PGRST116") { // Error code jika single() tidak menemukan data
                setOrder(null); 
            } else {
                throw pesananError;
            }
        }
        setOrder(pesanan);

        // Ambil data riwayat status
        const { data: riwayat, error: riwayatError } = await supabase
          .from("riwayat_status_pesanan")
          .select("*")
          .eq("id_pesanan", id)
          .order("waktu", { ascending: true });

        if (riwayatError) throw riwayatError;
        setTimeline(riwayat || []);

        const { data: pembayaran, error: pembayaranError } = await supabase
          .from("pembayaran")
          .select("*")
          .eq("id_pesanan", pesanan.id_pesanan)
          .maybeSingle();

        if (pembayaranError) throw pembayaranError;
        setPaymentData(pembayaran);
      } catch (err) {
        console.error("Gagal fetch data:", err);
      } finally {
        setLoadingPage(false);
      }
    };

    fetchOrder();
  }, [id, user, loading]);

  // Midtrans Snap initialization (tidak ada perubahan)
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

  const isPendingPayment = timeline.map(t => t.status).includes("Menunggu Pembayaran") && timeline.length == 4 && paymentData === null;

  const handleSnapPay = async () => {
    // Pastikan status_pesanan saat ini adalah "Menunggu Pembayaran"
    if (!isPendingPayment) {
      console.error("❌ Pesanan belum/sudah melewati tahap pembayaran.");
      return;
    }
    
    if (!order?.id_pesanan || !order?.total_biaya_final) {
      console.error("❌ Order belum lengkap untuk diproses pembayaran.");
      return;
    }

    try {
      // ... (Bagian request token Midtrans tetap sama) ...
      const res = await fetch("/api/create-snap-transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gross_amount: order.total_biaya_final,
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

          // Update status pembayaran & status pesanan di tabel pesanan
          // STATUS PESANAN DIUBAH KE "Sedang Dicuci" setelah pembayaran lunas
          const { error: payErr } = await supabase
            .from("pesanan")
            .update({ 
                status_pembayaran: "Paid",
                status_pesanan: "Sedang Dicuci" // Pindah ke tahap operasional selanjutnya
            })
            .eq("id_pesanan", order.id_pesanan);

          if (payErr) console.error("⚠️ Gagal update pesanan:", payErr);

          // Insert data ke tabel pembayaran (TETAP SAMA)
          const { error: insertErr } = await supabase
            .from("pembayaran")
            .insert([
              {
                id_pesanan: order.id_pesanan,
                metode: result.payment_type || "QRIS",
                jumlah: order.total_biaya_final,
                tgl_pembayaran: new Date().toISOString(),
              },
            ]);

          if (insertErr) console.error("⚠️ Gagal insert pembayaran:", insertErr);

          // Tambahkan ke tabel riwayat_status_pesanan
          // Status yang diinsert adalah "Sedang Dicuci"
          const { error: histErr } = await supabase
            .from("riwayat_status_pesanan")
            .insert([
              {
                id_pesanan: order.id_pesanan,
                status: "Sedang Dicuci", // Status baru setelah lunas
                deskripsi: "Pembayaran berhasil. Pesanan masuk antrian pencucian.",
                waktu: new Date().toISOString(),
              },
            ]);

          if (histErr) console.error("⚠️ Gagal insert riwayat:", histErr);

          // (Opsional) kirim ke backend endpoint (TETAP SAMA)
          await fetch("/api/confirm-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId: order.id_pesanan,
              gross_amount: order.total_biaya_final,
              payment_method: result.payment_type || "QRIS",
            }),
          }).catch((err) => console.warn("⚠️ Backend confirm skipped:", err));

          // Refresh halaman biar data baru muncul
          window.location.reload();
        },

        onPending: (result) => {
          console.log("🕒 Pembayaran pending:", result);
          // Opsional: update status_pembayaran di DB menjadi "Pending Midtrans"
          // untuk membedakan dari "Pending" yang berarti belum diverifikasi/ditentukan harga.
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

  // ... (JSX Loading dan Not Found tetap sama) ...

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


  // =========================================================
  // LOGIKA TAMPILAN (DISESUAIKAN UNTUK SUPER STATUS)
  // =========================================================
  const currentSubStatus = order.status_pesanan || "";
  const superStatus = getSuperStatus(currentSubStatus); 

  const getStatusColor = (superStatus) => {
    switch (superStatus) {
      case "Pending":
        return "text-yellow-600 bg-yellow-100";
      case "In Progress":
        return "text-blue-600 bg-blue-100";
      case "Done":
        return "text-green-600 bg-green-100";
      case "Batal":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusIcon = (superStatus) => {
    switch (superStatus) {
      case "Pending":
        return <Clock size={20} className="text-yellow-500" />;
      case "In Progress":
        return <Loader2 size={20} className="text-blue-500 animate-spin" />;
      case "Done":
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
                day: "numeric", month: "short", year: "numeric",
              })}
            </p>

            {/* Menampilkan Status Saat Ini */}
            <div
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full mt-3 text-sm font-medium ${getStatusColor(
                superStatus, 
              )}`}
            >
              {getStatusIcon(superStatus)} 
              {currentSubStatus || "Status Belum Ditentukan"}
            </div>

          </div>

          {/* ============================================================= */}
          {/* PAYMENT SECTION: IF STATUS MENUNGGU PEMBAYARAN, TAMPILKAN SNAP */}
          {/* ============================================================= */}
          {isPendingPayment && (
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-yellow-700 text-center mt-6">
              💰 Pesanan siap dibayar: **Rp{order.total_biaya_final?.toLocaleString('id-ID') || 0},-**
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
          
          {/* Payment Section (Jika sudah Paid) */}
          {order.status_pembayaran === "Paid" && (
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg text-green-700 text-center mt-6">
              ✅ Pembayaran **LUNAS** sebesar Rp{order.total_biaya_final?.toLocaleString('id-ID') || 0},-
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
              timeline.map((item) => {
                const info = STATUS_INFO[item.status] || { emoji: '❓', desc: 'Detail status tidak tersedia.' };
                return (
                  <div
                    key={item.id_riwayat} // Gunakan id_riwayat sebagai key jika tersedia
                    className="flex items-start gap-3 p-3 rounded-xl shadow-sm bg-gray-50 border border-gray-200"
                  >
                    <span className="text-2xl pt-1">{info.emoji}</span>
                    <div className="flex flex-col">
                      <span className="text-blue-700 font-medium">
                        {item.status}
                      </span>
                      <span className="text-gray-600 text-sm">
                        {info.desc}
                      </span>
                      <span className="text-gray-500 text-xs mt-1">
                        {new Date(item.waktu).toLocaleString("id-ID", {
                          hour: "2-digit", minute: "2-digit", day: "numeric", month: "short", year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}