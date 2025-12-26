"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/contexts/UserContext";
import { ArrowLeft, Clock, Loader2, CheckCircle, XCircle } from "lucide-react";
import ReviewForm from "@/components/ReviewForm";
import ReviewCard from "@/components/ReviewCard";
import { insertNotification } from '@/utils/notifications';

// =========================================================
// KONSTANTA STATUS BARU
// =========================================================
const STATUS_INFO = {
  "Pesanan Dibuat": {
    emoji: "🧾",
    desc: "Order berhasil dibuat, menunggu penjemputan.",
  },
  Penjemputan: {
    emoji: "🚗",
    desc: "Kurir sedang menjemput pakaian ke alamat pelanggan.",
  },
  "Verifikasi Berat": {
    emoji: "⚖️",
    desc: "Pakaian sudah diterima dan sedang ditimbang/diverifikasi.",
  },
  "Menunggu Pembayaran": {
    emoji: "💳",
    desc: "Harga final telah dikonfirmasi, menunggu pembayaran pelanggan.",
  },
  "Sedang Dicuci": {
    emoji: "💧",
    desc: "Proses pencucian dimulai (setelah pembayaran lunas).",
  },
  "Sedang Disetrika": {
    emoji: "🔥",
    desc: "Proses setrika / finishing sedang berlangsung.",
  },
  "Selesai Dicuci": {
    emoji: "📦",
    desc: "Semua pakaian selesai dicuci dan disetrika, siap dikirim.",
  },
  "Sedang Diantar": {
    emoji: "🛵",
    desc: "Kurir mengantar pakaian kembali ke pelanggan.",
  },
  Selesai: {
    emoji: "✅",
    desc: "Pesanan diterima pelanggan, transaksi selesai.",
  },
  Dibatalkan: {
    emoji: "❌",
    desc: "Pesanan dibatalkan (oleh pelanggan/admin).",
  },
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
      "In Progress",
    ].includes(subStatus)
  ) {
    return "In Progress";
  }

  if (["Pesanan Dibuat", "Menunggu Pembayaran"].includes(subStatus)) {
    return "Pending";
  }
  return "Pending";
};

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

export default function OrderDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, loading } = useUser();

  const [order, setOrder] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loadingPage, setLoadingPage] = useState(true);
  const [existingReview, setExistingReview] = useState(null);
  const [layanan, setLayanan] = useState(null);

  // Fetch data pesanan & timeline
  useEffect(() => {
    if (!user || loading) return;
    const fetchOrder = async () => {
      try {
        setLoadingPage(true);

        // Ambil data pesanan
        const { data: pesanan, error: pesananError } = await supabase
          .from("pesanan")
          .select(
            `
      *,
      layanan (
        jenis_layanan,
        is_archived
      )
    `,
          )
          .eq("id_pesanan", id)
          .eq("id_pelanggan", user.id)
          // --- KONDISI FILTER PADA TABEL YANG DI-JOIN ---
          // Memastikan layanan yang di-join tidak diarsipkan.
          .eq("layanan.is_archived", false)
          .single();

        if (pesananError) {
          // PGRST116: Error code jika single() tidak menemukan data
          if (pesananError.code === "PGRST116") {
            setOrder(null);
            setLayanan(null); // Penting: set layanan menjadi null juga
          } else {
            // Error lain (misalnya, masalah koneksi)
            throw pesananError;
          }
        }

        // Cek integritas data: Jika pesanan ditemukan tetapi layanannya null karena filter (walaupun harusnya tidak terjadi jika filter .eq("layanan.is_archived", false) berfungsi)
        if (pesanan && (!pesanan.layanan || pesanan.layanan.is_archived)) {
          // Jika pesanan ada, tapi layanan di-filter (sudah diarsipkan), perlakukan sebagai 404/Not Found
          setOrder(null);
          setLayanan(null);
          return;
        }

        // Jika berhasil, data layanan akan berada di dalam objek pesanan
        if (pesanan) {
          // Memecah hasil
          setOrder(pesanan);
          setLayanan(pesanan.layanan);
        }

        // Ambil data riwayat status
        const { data: riwayat, error: riwayatError } = await supabase
          .from("riwayat_status_pesanan")
          .select("*")
          .eq("id_pesanan", id)
          .order("waktu", { ascending: true });

        if (riwayatError) throw riwayatError;
        setTimeline(riwayat || []);

        if (pesanan?.id_pesanan) {
          const { data: ulasan, error: ulasanError } = await supabase
            .from("ulasan")
            .select("*")
            .eq("id_pesanan", pesanan.id_pesanan)
            .single(); // Karena diasumsikan 1 pesanan hanya 1 ulasan

          if (ulasanError && ulasanError.code !== "PGRST116") {
            // Abaikan error 'data tidak ditemukan' (PGRST116)
            throw ulasanError;
          }
          // Set state ulasan (akan null jika tidak ditemukan)
          setExistingReview(ulasan);
        }
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

  //   Helper vars
  const isPrepaid = order?.metode_pembayaran === "QRIS";

  const currentSubStatus = order?.status_pesanan || "";
  const superStatus = getSuperStatus(currentSubStatus);

  const shouldShowSnapButton =
    isPrepaid && // Hanya untuk prepaid
    currentSubStatus === "Menunggu Pembayaran" && // Hanya saat status ini
    order?.status_pembayaran !== "Paid" &&
    order?.berat_aktual !== null;

  const isPendingPayment =
    timeline.map((t) => t.status).includes("Menunggu Pembayaran") &&
    timeline.length == 4;

  const shouldShowCODInfo = !isPrepaid && order?.status_pembayaran !== "Paid";

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

          // --- Variabel Baru ---
          const paymentType = "QRIS";
          const transactionRef =
            result.transaction_id || result.transaction_status; // Gunakan ID transaksi Midtrans
          // ---------------------

          // 1. UPDATE status_pembayaran, status_pesanan, DAN DETAIL PEMBAYARAN di tabel pesanan
          const { error: payErr } = await supabase
            .from("pesanan")
            .update({
              // Status Pesanan & Pembayaran
              status_pembayaran: "Paid",
              status_pesanan: "In Progress",

              // 🆕 Detail Pembayaran (Dipindahkan dari tabel pembayaran)
              metode_pembayaran: paymentType,
              jumlah_dibayar: order.total_biaya_final,
              tgl_pembayaran_lunas: new Date().toISOString(),
              referensi_pembayaran: transactionRef,
            })
            .eq("id_pesanan", order.id_pesanan);

          if (payErr) console.error("⚠️ Gagal update pesanan:", payErr);

          // 2. Tambahkan ke tabel riwayat_status_pesanan (TETAP SAMA)
          const { error: histErr } = await supabase
            .from("riwayat_status_pesanan")
            .insert([
              {
                id_pesanan: order.id_pesanan,
                status: "Sedang Dicuci", // Status baru setelah lunas
                deskripsi:
                  "Pembayaran berhasil. Pesanan masuk antrian pencucian.",
                waktu: new Date().toISOString(),
              },
            ]);

          if (histErr) console.error("⚠️ Gagal insert riwayat:", histErr);

          // 3. (Opsional) kirim ke backend endpoint (Disesuaikan dengan kolom baru)
          // await fetch("/api/confirm-payment", {
          //   method: "POST",
          //   headers: { "Content-Type": "application/json" },
          //   body: JSON.stringify({
          //     orderId: order.id_pesanan,
          //     gross_amount: order.total_biaya_final,
          //     payment_method: paymentType, // Gunakan paymentType yang didapat dari Midtrans
          //   }),
          // }).catch((err) => console.warn("⚠️ Backend confirm skipped:", err));

          // 4. Notifikasi ke pelanggan: Pesanan sudah mulai diproses
          // Anda bisa memanggil insertNotification di sini jika Anda membuatnya sebagai fungsi global/helper
          await insertNotification(
            {
              id_pesanan: order.id_pesanan,
              id_pelanggan: order.id_pelanggan,
            },
            "Sedang Dicuci",
          );

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
              {layanan.jenis_layanan}
            </h1>
            <p className="text-gray-500 mb-4">
              {new Date(order.tgl_pesanan).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>

            {/* --- START: Detail Informasi Berat --- */}
            <div className="flex justify-center items-center space-x-6 border-t border-b py-3 mb-4 bg-blue-50/50 rounded-lg">
              {/* 1. Berat Estimasi */}
              <div className="flex flex-col items-center">
                <p className="text-sm font-semibold text-gray-600">
                  Estimasi Berat ⚖️
                </p>
                <p className="text-xl font-bold text-blue-600">
                  {order.estimasi_berat
                    ? `${order.estimasi_berat.toFixed(1)} kg`
                    : "N/A"}
                </p>
              </div>

              {/* Pembatas Vertikal */}
              <div className="w-px h-10 bg-gray-300"></div>

              {/* 2. Berat Aktual */}
              <div className="flex flex-col items-center">
                <p className="text-sm font-semibold text-gray-600">
                  Berat Aktual ✅
                </p>
                <p className="text-xl font-bold text-green-600">
                  {order.berat_aktual ? (
                    `${order.berat_aktual.toFixed(1)} kg`
                  ) : (
                    <span className="text-red-500">Belum Ditimbang</span>
                  )}
                </p>
              </div>
            </div>

            {/* 3. Estimasi Sisa Hari (Baru Ditambahkan) */}
            <div className="flex flex-col items-center px-2">
              {order.status_pesanan !== "Selesai" && (
                <>
                  {/* Pembatas Vertikal */}
                  <div className="w-px h-10 bg-gray-300"></div>

                  {/* 3. Estimasi Sisa Hari */}
                  <div className="flex flex-col items-center px-2">
                    <p className="text-xs font-semibold text-gray-600">
                      Sisa Hari (Estimasi) ⏳
                    </p>
                    <p className="text-lg font-bold text-purple-600">
                      {(() => {
                        if (!order.jadwal_selesai) return "TBD";

                        const estimatedDate = new Date(order.jadwal_selesai);
                        const today = new Date();

                        // Normalisasi waktu ke tengah malam untuk perhitungan hari yang akurat
                        estimatedDate.setHours(0, 0, 0, 0);
                        today.setHours(0, 0, 0, 0);

                        const diffTime =
                          estimatedDate.getTime() - today.getTime();
                        const diffDays = Math.ceil(
                          diffTime / (1000 * 60 * 60 * 24),
                        );

                        if (diffDays === 0) return "Hari Ini!";
                        if (diffDays < 0) return "Terlambat!"; // Jika tanggal estimasi sudah lewat

                        return `${diffDays} hari`;
                      })()}
                    </p>
                  </div>
                </>
              )}
            </div>

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
          {isPendingPayment && shouldShowSnapButton && (
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-yellow-700 text-center mt-6">
              💰 Pesanan siap dibayar: **Rp
              {order.total_biaya_final?.toLocaleString("id-ID") || 0},-**
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

          {shouldShowCODInfo && (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-blue-700 text-center mt-6">
              🛵 Metode Pembayaran: **Bayar di Tempat (COD)**{" "}
              <p className="text-sm mt-1">
                Pembayaran sebesar Rp{" "}
                {order.total_biaya_final?.toLocaleString("id-ID") || 0},- akan
                dilakukan tunai saat pakaian diantar kembali.
              </p>{" "}
            </div>
          )}

          {/* Payment Section (Jika sudah Paid, baik Prepaid maupun COD) */}
          {order?.status_pembayaran === "Paid" && (
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg text-green-700 text-center mt-6">
                  ✅ Pembayaran **LUNAS** sebesar Rp{" "}
              {order.total_biaya_final?.toLocaleString("id-ID") || 0},-    {" "}
              {order.metode_pembayaran_initial && (
                <span className="text-sm block mt-1">
                  (
                  {order.metode_pembayaran_initial === "COD"
                    ? "Tunai (COD)"
                    : "Prepaid"}
                  )
                </span>
              )}
               {" "}
            </div>
          )}

          {/* Review Form */}
          {/* Kondisi 1: Pesanan Selesai dan Belum Ada Ulasan */}
          {order?.status_pesanan === "Selesai" &&
            currentSubStatus == "Selesai" &&
            superStatus == "Done" &&
            !existingReview && (
              <div className="mt-3">
                <ReviewForm
                  orderId={order.id_pesanan}
                  onReviewSubmitted={() => {
                    // Setelah ulasan dikirim, lakukan fetch ulang data ulasan
                    // Idealnya, Anda memanggil fetchOrder() lagi, tapi untuk simplicity, kita reload.
                    alert("Ulasan terkirim. Memuat ulang halaman...");
                    window.location.reload();
                  }}
                />
              </div>
            )}

          {/* Kondisi 2: Pesanan Selesai dan Sudah Ada Ulasan */}
          {order?.status_pesanan === "Selesai" &&
            currentSubStatus == "Selesai" &&
            superStatus == "Done" &&
            existingReview && (
              // Asumsi Anda telah mengimpor ReviewCard
              <div className="mt-3">
                <ReviewCard
                  review={{
                    ...existingReview,
                    pelanggan_nama: user.user_metadata?.full_name || "Anda", // Tampilkan nama pengguna
                  }}
                  variant="default"
                />
              </div>
            )}

          {/* Kondisi 3: Pesanan Belum Selesai */}
          {/* {order?.status_pesanan !== "Selesai" && (
            <p className="text-gray-500 p-3 bg-gray-50 rounded-lg text-sm">
              Form ulasan akan tersedia setelah pesanan berstatus **Selesai**.
            </p>
          )} */}

          <p className="text-center mt-3 mb-1">{order?.metode_pembayaran}</p>

          {/* Timeline */}
          <div className="mt-6 space-y-4">
            <h2 className="font-semibold text-blue-700 mb-2">
              Riwayat Pesanan 🕒
            </h2>
            {timeline.length === 0 ? (
              <p className="text-gray-500 text-sm">Belum ada riwayat</p>
            ) : (
              timeline.map((item) => {
                const info = STATUS_INFO[item.status] || {
                  emoji: "❓",
                  desc: "Detail status tidak tersedia.",
                };
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
                      <span className="text-gray-600 text-sm">{info.desc}</span>
                      <span className="text-gray-500 text-xs mt-1">
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
                );
              })
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
