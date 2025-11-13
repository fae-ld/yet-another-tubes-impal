"use client";

import DashboardLayout from "@/components/DashboardLayout";
import { useRouter } from "next/navigation";
import { useUser } from "@/contexts/UserContext"; // pastikan path sesuai
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { Clock, Loader2, CheckCircle, XCircle } from "lucide-react";

export default function OrdersPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- Fetch data pesanan dari Supabase ---
  useEffect(() => {
    if (userLoading) return;
    if (!user) return; // belum login, skip

    const fetchOrders = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("pesanan")
        .select("id_pesanan, jenis_layanan, tgl_pesanan, status_pembayaran, status_pesanan")
        .eq("id_pelanggan", user.id)
        .order("tgl_pesanan", { ascending: false });

      if (error) {
        console.error("Gagal mengambil data pesanan:", error);
      } else {
        // Format data biar match ke struktur UI lama
        const formatted = data.map((item) => ({
          id: item.id_pesanan,
          service: item.jenis_layanan,
          date: new Date(item.tgl_pesanan).toISOString().split("T")[0],
          status:
            item.status_pesanan === "Baru"
              ? "Pending"
              : item.status_pesanan || "Pending",
          paymentStatus: item.status_pembayaran || "Pending",
        }));
        setOrders(formatted);
      }
      setLoading(false);
    };

    fetchOrders();
  }, [user, userLoading]);

  // --- Style dan icon status ---
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

  return (
    <DashboardLayout>
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
                <div className="flex flex-col">
                  <span className="text-blue-700 font-semibold">
                    {item.service}
                  </span>
                  <span className="text-gray-500 text-sm">{item.date}</span>
                  <span className="text-xs text-gray-400">
                    Pembayaran: {item.paymentStatus}
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