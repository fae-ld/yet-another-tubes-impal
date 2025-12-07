"use client";

import DashboardLayout from "@/components/DashboardLayout";
import {
  Info,
  CheckCircle,
  AlertTriangle,
  X,
  Clock,
  Loader2,
  MinusCircle,
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { useUser } from "@/contexts/UserContext";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

const NOTIFICATION_TYPE_MAP = {
  // Notifikasi Sukses/Selesai
  ORDER_COMPLETE: {
    uiType: "Success",
    title: "Pesanan Selesai",
    icon: CheckCircle,
  },
  READY_FOR_DELIVERY: {
    uiType: "Success",
    title: "Siap Dikirim",
    icon: CheckCircle,
  },
  IN_PROGRESS: {
    uiType: "Success",
    title: "Sedang Diproses",
    icon: CheckCircle,
  },
  DELIVERY: { uiType: "Success", title: "Sedang Diantar", icon: CheckCircle },

  // Notifikasi Informasi/Peringatan Ringan
  ORDER_CREATED: { uiType: "Info", title: "Pesanan Dibuat", icon: Info },
  PICKUP: { uiType: "Info", title: "Penjemputan", icon: Clock },

  // Notifikasi Kritis/Warning (Membutuhkan Aksi)
  PAYMENT_DUE: {
    uiType: "Warning",
    title: "Menunggu Pembayaran",
    icon: AlertTriangle,
  },
  CANCELLED: {
    uiType: "Error",
    title: "Pesanan Dibatalkan",
    icon: MinusCircle,
  },
};

export default function NotificationsPage() {
  const router = useRouter();

  const { user, loading: userLoading } = useUser();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fungsi untuk mengambil data notifikasi
  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("notifikasi")
      .select("id_notifikasi, id_pesanan, tipe, konten, tgl_kirim, is_read")
      .eq("id_user", user.id) // Filter hanya notifikasi untuk user ini
      .order("tgl_kirim", { ascending: false }); // Urutkan dari yang terbaru

    if (error) {
      console.error("Gagal mengambil notifikasi:", error);
      setError("Gagal memuat notifikasi.");
      setNotifications([]);
    } else {
      // Data notifikasi dari DB sudah terstruktur
      setNotifications(data || []);
    }
    setLoading(false);
  }, [user]);

  // Fetch data saat komponen dimuat atau user berubah
  useEffect(() => {
    if (!userLoading && user) {
      fetchNotifications();
    }
  }, [user, userLoading, fetchNotifications]);

  // ------------------------------------------
  // MARK AS READ LOGIC
  // ------------------------------------------
  const markAsRead = async (id_notifikasi) => {
    // 1. Update di database
    const { error } = await supabase
      .from("notifikasi")
      .update({ is_read: true })
      .eq("id_notifikasi", id_notifikasi);

    if (error) {
      console.error("Gagal menandai sudah dibaca:", error);
      alert("Gagal menandai notifikasi.");
      return;
    }

    setNotifications((prev) =>
      prev.filter((n) => n.id_notifikasi !== id_notifikasi),
    );
  };

  const getNotificationStyles = (uiType) => {
    switch (uiType) {
      case "Info":
        return "bg-blue-50 border-blue-200 text-blue-700";
      case "Success":
        return "bg-green-50 border-green-200 text-green-700";
      case "Warning":
        return "bg-yellow-50 border-yellow-200 text-yellow-800";
      case "Error":
        return "bg-red-50 border-red-200 text-red-700";
      default:
        return "bg-gray-50 border-gray-200 text-gray-700";
    }
  };

  const getNotificationIcon = (uiType) => {
    const map = {
      Info: <Info size={24} className="text-blue-500" />,
      Success: <CheckCircle size={24} className="text-green-500" />,
      Warning: <AlertTriangle size={24} className="text-yellow-500" />,
      Error: <MinusCircle size={24} className="text-red-500" />,
    };
    return map[uiType] || null;
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp) return "Tanggal tidak valid";
    return new Date(timestamp).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (userLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-10 text-blue-600">
          <Loader2 size={24} className="animate-spin mr-2" />
          Memuat notifikasi...
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="text-center py-10 text-red-600">{error}</div>
      </DashboardLayout>
    );
  }

  const handleNotificationClick = (notification) => {
    // Jika notifikasi memiliki ID pesanan, navigasi ke halaman detail
    if (notification.id_pesanan) {
      router.push(`/orders/${notification.id_pesanan}`);

      // Opsional: Tandai sebagai dibaca segera setelah klik
      markAsRead(notification.id_notifikasi);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-3xl font-bold text-blue-600">Notifications</h1>
        <p className="mt-2 text-gray-700 mb-6">
          Semua notifikasi terbaru kamu.
        </p>

        <div className="flex flex-col gap-4">
          {notifications.length > 0 ? (
            notifications.map((item) => {
              const mapping = NOTIFICATION_TYPE_MAP[item.tipe] || {
                uiType: "Default",
                title: item.tipe,
                icon: Info,
              };

              return (
                <div
                  key={item.id_notifikasi}
                  // Notifikasi yang belum dibaca akan memiliki border tebal
                  onClick={() => handleNotificationClick(item)}
                  className={`flex items-center gap-4 p-4 border rounded-xl shadow-sm hover:shadow-md transition cursor-pointer relative ${getNotificationStyles(
                    mapping.uiType,
                  )} ${item.is_read ? "opacity-70" : "border-2 border-dashed border-opacity-50"}`}
                >
                  {getNotificationIcon(mapping.uiType)}
                  <div className="flex flex-col">
                    <span className="font-semibold">{mapping.title}</span>
                    <span className="text-gray-600 text-sm">
                      {item.konten} {/* Menggunakan kolom konten dari DB */}
                    </span>
                  </div>
                  <span className="ml-auto text-gray-400 text-xs">
                    {formatDateTime(item.tgl_kirim)}
                  </span>

                  {/* Mark as read button */}
                  {!item.is_read && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Mencegah klik menyebar jika ada event lain
                        markAsRead(item.id_notifikasi);
                      }}
                      className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 p-1 rounded-full bg-white/50"
                      title="Tandai sudah dibaca"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              );
            })
          ) : (
            <p className="text-gray-500 text-center mt-4">
              Tidak ada notifikasi.
            </p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
