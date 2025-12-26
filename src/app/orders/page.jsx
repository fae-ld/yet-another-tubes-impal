"use client";

import DashboardLayout from "@/components/DashboardLayout";
import { useRouter } from "next/navigation";
import { useUser } from "@/contexts/UserContext";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { Clock, Loader2, CheckCircle, XCircle } from "lucide-react";

// =========================================================
// FUNGSI UTILITY: MAPPING SUB-STATUS KE SUPER STATUS BARU
// =========================================================

/**
 * Maps the detailed sub-status (from DB: status_pesanan) to the main Super Status
 * used for UI display (Pending, In Progress, Done, Cancelled).
 */
const getSuperStatus = (subStatus) => {
  // Status Akhir
  if (subStatus === "Selesai") return "Done";

  // Status Pembatalan
  if (subStatus === "Dibatalkan") return "Batal"; // Menggunakan "Batal" agar sesuai dengan switch case di bawah

  // Status Operasional (Sedang Dikerjakan)
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

  // Status Menunggu (Perlu Aksi/Belum Dimulai)
  if (["Pesanan Dibuat", "Menunggu Pembayaran"].includes(subStatus)) {
    return "Pending";
  }

  // Default/Fallback
  return "Pending";
};

export default function OrdersPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- Fetch data pesanan dari Supabase ---
  useEffect(() => {
    if (userLoading) return;
    if (!user) return;

    const fetchOrders = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("pesanan")
        .select(
          `
    id_pesanan, 
    id_layanan, 
    tgl_pesanan, 
    status_pembayaran, 
    status_pesanan,
    layanan:id_layanan (
      jenis_layanan,
      is_archived 
    )
    `,
        )
        .eq("id_pelanggan", user.id)
        // --- KONDISI FILTER: HANYA PESANAN DENGAN LAYANAN NON-ARSIP ---
        .eq("layanan.is_archived", false)
        // -----------------------------------------------------------------
        .order("tgl_pesanan", { ascending: false });

      if (error) {
        console.error("Gagal mengambil data pesanan:", error);
      } else {
        // --- LOGIKA UTAMA PERUBAHAN DI SINI ---
        const formatted = data.map((item) => {
          // 1. Tentukan Super Status menggunakan fungsi baru
          const superStatus = getSuperStatus(item.status_pesanan);

          return {
            id: item.id_pesanan,
            service: item.layanan?.jenis_layanan,
            date: new Date(item.tgl_pesanan).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "short",
              year: "numeric",
            }),
            // 2. Gunakan Super Status untuk display status
            status: superStatus,
            paymentStatus: item.status_pembayaran || "Pending",
          };
        });
        setOrders(formatted);
      }
      setLoading(false);
    };

    fetchOrders();
  }, [user, userLoading]);

  // --- Style dan icon status (Tidak ada perubahan, karena menggunakan Super Status) ---
  const getStatusStyles = (status) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "In Progress":
        return "bg-blue-100 text-blue-800";
      case "Done":
        return "bg-green-100 text-green-800";
      case "Batal":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
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

  console.log(orders.map((item) => item.service));

  return (
    <DashboardLayout>
      {/* ... (Sisa JSX tetap sama) ... */}
      <div className="p-6">
        <h1 className="text-3xl font-bold text-blue-600 mb-6">Orders</h1>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-10 text-blue-600">
            <Loader2 size={24} className="animate-spin mr-2" />
            Loading pesanan kamu...
          </div>
        )}

        {/* Empty State */}
        {!loading && orders.length === 0 && (
          <p className="text-gray-500 text-center mt-10">
            Belum ada pesanan nih 🧺 Yuk buat pesanan pertama kamu!
          </p>
        )}

        {/* Orders List */}
        <div className="flex flex-col gap-4">
          {orders.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl shadow-md p-5 flex items-center justify-between hover:shadow-lg hover:translate-x-1 transition cursor-pointer border border-blue-50"
              onClick={() => router.push(`/orders/${item.id}`)}
            >
              <div className="flex items-center gap-4">
                {getStatusIcon(item.status)}
                <div className="flex flex-col gap-0.5">
                  {/* Menampilkan ID Pesanan dengan gaya font mono agar terlihat seperti kode */}
                  <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">
                    ID: #{item.id_pesanan || item.id}
                  </span>

                  <div className="flex items-center gap-2">
                    <span className="text-blue-700 font-bold">
                      {item.service}
                    </span>
                    {/* Menampilkan Jenis Layanan (misal: Kilat/Reguler) dengan pemisah dot */}
                    {item.service && (
                      <>
                        <span className="text-gray-300">•</span>
                        <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md">
                          {item.service}
                        </span>
                      </>
                    )}
                  </div>

                  <span className="text-gray-500 text-sm">{item.date}</span>
                  <span className="text-xs text-gray-400">
                    Pembayaran:{" "}
                    <span
                      className={
                        item.paymentStatus === "Paid"
                          ? "text-green-600 font-medium"
                          : "text-orange-500 font-medium"
                      }
                    >
                      {item.paymentStatus}
                    </span>
                  </span>
                </div>
              </div>

              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusStyles(
                  item.status,
                )}`}
              >
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
