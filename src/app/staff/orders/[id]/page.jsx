"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import StaffDashboardLayout from "@/components/staff/StaffDashboardLayout";

const ORDER_SUBSTEPS = [
  // ... (Array ini sudah benar dan tidak diubah) ...
  {
    step: 1,
    label: "Pesanan Dibuat",
    icon: "🧾",
    desc: "Order berhasil dibuat dan masuk sistem.",
  },
  {
    step: 2,
    label: "Penjemputan",
    icon: "🚗",
    desc: "Kurir sedang menjemput pakaian ke alamat pelanggan.",
  },
  {
    step: 3,
    label: "Verifikasi Berat",
    icon: "⚖️",
    desc: "Pakaian sudah diterima di laundry dan sedang ditimbang/diverifikasi.",
  },
  {
    step: 4,
    label: "Menunggu Pembayaran",
    icon: "💳",
    desc: "Berat/harga akhir sudah dikonfirmasi, menunggu pembayaran dari pelanggan.",
  },
  {
    step: 5,
    label: "Sedang Dicuci",
    icon: "💧",
    desc: "Pakaian sedang dicuci (dimulai setelah pembayaran lunas).",
  },
  {
    step: 6,
    label: "Sedang Disetrika",
    icon: "🔥",
    desc: "Proses setrika / finishing.",
  },
  {
    step: 7,
    label: "Selesai Dicuci",
    icon: "📦",
    desc: "Pakaian selesai dicuci, siap dikirim.",
  },
  {
    step: 8,
    label: "Sedang Diantar",
    icon: "🛵",
    desc: "Kurir mengantar pakaian ke pelanggan.",
  },
  {
    step: 9,
    label: "Selesai",
    icon: "✅",
    desc: "Pesanan diterima pelanggan, transaksi selesai.",
  },
];

// Mapping sub-status ke super status
const getSuperStatus = (subStatus) => {
  // Status Akhir
  if (subStatus === "Selesai") return "Done";
  
  // Status Pembatalan
  if (subStatus === "Dibatalkan") return "Cancelled"; // Menggunakan 'Cancelled' untuk konsistensi

  // Status Operasional (Sedang Dikerjakan)
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

  // Status Menunggu (Awal/Pembayaran)
  if (
    [
      "Pesanan Dibuat",
      "Menunggu Pembayaran",
    ].includes(subStatus)
  ) {
    return "Pending"; // Diperbaiki: Mengembalikan "Pending" agar cocok dengan switch case
  }
  
  // Kasus fallback jika status tidak dikenal
  return "Unknown Status"; 
};

const getStepColor = (subStatus) => {
    const superStatus = getSuperStatus(subStatus);
    switch (superStatus) {
      case "Pending": 
        return "bg-yellow-100 border-yellow-300 text-yellow-700";
      case "In Progress":
        return "bg-purple-100 border-purple-300 text-purple-700";
      case "Done":
        return "bg-green-100 border-green-300 text-green-700";
      case "Cancelled": //  penanganan untuk status dibatalkan
        return "bg-red-100 border-red-300 text-red-700";
      default:
        return "bg-gray-100 border-gray-200 text-gray-700";
    }
};

export default function OrderDetailPage() {
  const { id: orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!orderId) return;

    const fetchOrder = async () => {
      setLoading(true);
      try {
        const { data: orderData, error: orderError } = await supabase
          .from("pesanan")
          .select("*")
          .eq("id_pesanan", orderId)
          .single();
        if (orderError) throw orderError;

        const { data: pelangganData, error: pelangganError } = await supabase
          .from("pelanggan")
          .select("nama")
          .eq("id_pelanggan", orderData.id_pelanggan)
          .single();
        if (pelangganError) throw pelangganError;

        const { data: statusData, error: statusError } = await supabase
          .from("riwayat_status_pesanan")
          .select("*")
          .eq("id_pesanan", orderId)
          .order("waktu", { ascending: false });
        if (statusError) throw statusError;

        setOrder({
          ...orderData,
          pelanggan: pelangganData,
          riwayat_status_pesanan: statusData,
          latestStatus: statusData?.[0] || null,
        });
      } catch (err) {
        console.error(err);
        setError("Gagal mengambil data");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const handleStepClick = async (clickedStep) => {
    if (!order) return;

    const existingStatuses =
      order.riwayat_status_pesanan?.map((s) => s.status) || [];
    const clickedIndex = ORDER_SUBSTEPS.findIndex(
      (s) => s.label === clickedStep.label,
    );

    // cari index terakhir yang ada di DB
    const currentIndexInDB = Math.max(
      ...existingStatuses.map((s) =>
        ORDER_SUBSTEPS.findIndex((step) => step.label === s),
      ),
      -1,
    );

    try {
      if (clickedIndex > currentIndexInDB) {
        // FORWARD: insert semua step yang belum ada
        const stepsToInsert = ORDER_SUBSTEPS.slice(
          currentIndexInDB + 1,
          clickedIndex + 1,
        ).filter((step) => !existingStatuses.includes(step.label));

        if (stepsToInsert.length > 0) {
          const inserts = stepsToInsert.map((step) => ({
            id_pesanan: order.id_pesanan,
            status: step.label,
            deskripsi: step.desc,
            waktu: new Date(),
          }));
          const { error: insertError } = await supabase
            .from("riwayat_status_pesanan")
            .insert(inserts);
          if (insertError) throw insertError;
        }
      } else if (clickedIndex < currentIndexInDB) {
        // BACKWARD: hapus semua step yang lebih tinggi dari step yang diklik
        const stepsToDelete = ORDER_SUBSTEPS.slice(clickedIndex + 1).map(
          (s) => s.label,
        );
        if (stepsToDelete.length > 0) {
          const { error: deleteError } = await supabase
            .from("riwayat_status_pesanan")
            .delete()
            .in("status", stepsToDelete)
            .eq("id_pesanan", order.id_pesanan);
          if (deleteError) throw deleteError;
        }
      }

      // Update super status di tabel pesanan
      const superStatus = getSuperStatus(clickedStep.label);
      const { error: pesananError } = await supabase
        .from("pesanan")
        .update({ status_pesanan: superStatus })
        .eq("id_pesanan", order.id_pesanan);
      if (pesananError) throw pesananError;

      // update state lokal
      const updatedStatuses = await supabase
        .from("riwayat_status_pesanan")
        .select("*")
        .eq("id_pesanan", order.id_pesanan)
        .order("waktu", { ascending: true });

      setOrder({
        ...order,
        status_pesanan: superStatus,
        riwayat_status_pesanan: updatedStatuses.data || [],
        latestStatus:
          updatedStatuses.data?.[updatedStatuses.data.length - 1] || null,
      });

      alert("Status pesanan berhasil diupdate!");
    } catch (err) {
      console.error(err);
      alert("Gagal update status pesanan");
    }
  };

  if (loading) return <div className="p-6 text-center">Loading...</div>;
  if (error) {
    return (
      <StaffDashboardLayout>
        <div className="p-6 text-center text-red-600">{error}</div>;
      </StaffDashboardLayout>
    )
  }
  if (!order)
    return (
      <div className="p-6 text-center text-gray-600">Order tidak ditemukan</div>
    );

  // const currentSubIndex = ORDER_SUBSTEPS.findIndex(
  //   (s) => s.label === (order.latestStatus?.status || "Pesanan Baru"),
  // );

  const currentSubIndex = order.riwayat_status_pesanan.length == 0 ? 0 : order.riwayat_status_pesanan.length - 1;
  
  // Helper: warna badge berdasarkan super status

  return (
    <StaffDashboardLayout>
      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
        <h1 className="text-3xl font-bold text-purple-700">
          Detail Pesanan #{order.id_pesanan}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Informasi Pelanggan */}
          <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
            <h2 className="text-lg font-semibold mb-4">Informasi Pelanggan</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 font-medium">Nama</span>
                <span className="text-gray-800 font-semibold">
                  {order.pelanggan?.nama ?? "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 font-medium">ID Pelanggan</span>
                <span className="text-gray-800 font-semibold">
                  {order.id_pelanggan}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 font-medium">Email</span>
                <span className="text-gray-800 font-semibold">
                  {order.pelanggan?.email ?? "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 font-medium">Telepon</span>
                <span className="text-gray-800 font-semibold">
                  {order.pelanggan?.telepon ?? "-"}
                </span>
              </div>
            </div>
          </div>

          {/* Informasi Pesanan */}
          <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
            <h2 className="text-lg font-semibold mb-4">Informasi Pesanan</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 font-medium">Jenis Layanan</span>
                <span className="text-gray-800 font-semibold">
                  {order.jenis_layanan ?? "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 font-medium">
                  Estimasi Berat
                </span>
                <span className="text-gray-800 font-semibold">
                  {order.estimasi_berat ?? "-"} kg
                </span>
              </div>

              {/* Input Berat Aktual */}
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Berat Aktual</span>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder={order.estimasi_berat ?? ""}
                  value={order.berat_aktual ?? ""}
                  onChange={(e) => {
                    const berat = parseFloat(e.target.value);
                    const hargaPerKg = 5000; // asumsi harga per kg
                    setOrder({
                      ...order,
                      berat_aktual: berat,
                      total_biaya_final: berat
                        ? berat * hargaPerKg
                        : order.total_biaya_final,
                    });
                  }}
                  className="border border-gray-300 rounded px-2 py-1 w-24 text-right"
                />
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600 font-medium">Total Biaya</span>
                <span className="text-gray-800 font-semibold">
                  {order.total_biaya_final != null
                    ? Number(order.total_biaya_final).toLocaleString("id-ID")
                    : "-"}{" "}
                  Rp
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600 font-medium">
                  Status Pembayaran
                </span>
                <span className="text-gray-800 font-semibold">
                  {order.status_pembayaran ?? "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 font-medium">
                  Status Pesanan
                </span>
                <span className="text-gray-800 font-semibold">
                  {order.latestStatus?.status ?? order.status_pesanan}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 font-medium">
                  Jadwal Selesai
                </span>
                <span className="text-gray-800 font-semibold">
                  {order.jadwal_selesai
                    ? new Date(order.jadwal_selesai).toLocaleString()
                    : "-"}
                </span>
              </div>
            </div>

            {/* Button Save Berat Aktual */}
            <div className="mt-4 flex justify-end">
              <button
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
                onClick={async () => {
                  try {
                    const { error } = await supabase
                      .from("pesanan")
                      .update({
                        berat_aktual: order.berat_aktual,
                        total_biaya_final: order.total_biaya_final,
                      })
                      .eq("id_pesanan", order.id_pesanan);
                    if (error) throw error;
                    alert("Berat aktual & total biaya berhasil diupdate!");
                  } catch (err) {
                    console.error(err);
                    alert("Gagal update berat aktual");
                  }
                }}
              >
                Simpan
              </button>
            </div>
          </div>
        </div>

        {/* Checklist Status Pesanan */}
        <div className="bg-white p-6 rounded-2xl shadow-2xl border border-gray-100 space-y-4">
          <h2 className="text-2xl font-bold text-purple-700 mb-4">
            Progress Pesanan
          </h2>

          <ul className="space-y-3">
            {ORDER_SUBSTEPS.map((step, idx) => {
              const completed = idx <= currentSubIndex;

              // cari data riwayat untuk step ini
              const stepHistory = order.riwayat_status_pesanan?.find(
                (s) => s.status === step.label,
              );

              return (
                <li
                  key={step.step}
                  className={`flex flex-col md:flex-row items-start md:items-center justify-between p-3 rounded-xl border ${getStepColor(step.label)} hover:cursor-pointer hover:shadow-md transition-shadow`}
                  onClick={() => handleStepClick(step)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{step.icon}</span>
                    <div>
                      <p className={`font-medium`}>{step.label}</p>
                      <p className="text-sm text-gray-500">{step.desc}</p>
                      {completed && stepHistory?.waktu && (
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(stepHistory.waktu).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={completed}
                    readOnly
                    className="w-5 h-5 accent-green-600 mt-2 md:mt-0"
                  />
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </StaffDashboardLayout>
  );
}
