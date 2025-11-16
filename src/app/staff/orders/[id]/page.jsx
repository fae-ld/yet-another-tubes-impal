"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import StaffDashboardLayout from "@/components/staff/StaffDashboardLayout";

const ORDER_SUBSTEPS = [
  { step: 1, label: "Pesanan Baru", icon: "🧾", desc: "Baru masuk sistem, belum mulai." },
  { step: 2, label: "Penjemputan", icon: "🚗", desc: "Kurir sedang menjemput pakaian ke alamat pelanggan." },
  { step: 3, label: "Sedang Dicuci", icon: "💧", desc: "Pakaian sedang dicuci." },
  { step: 4, label: "Sedang Disetrika", icon: "🔥", desc: "Proses setrika / finishing." },
  { step: 5, label: "Selesai Dicuci", icon: "📦", desc: "Pakaian selesai dicuci, siap dikirim." },
  { step: 6, label: "Sedang Diantar", icon: "🛵", desc: "Kurir mengantar pakaian ke pelanggan." },
  { step: 7, label: "Selesai", icon: "✅", desc: "Pesanan diterima pelanggan, transaksi selesai." },
];

// Mapping sub-status ke super status
const getSuperStatus = (subStatus) => {
  if (subStatus === "Selesai") return "Done";
  if (
    ["Pesanan Baru", "Penjemputan", "Sedang Dicuci", "Sedang Disetrika", "Selesai Dicuci", "Sedang Diantar"].includes(subStatus)
  ) return "In Progress";
  return "Pending";
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
        setError(err.message || "Gagal mengambil data");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const handleStepClick = async (clickedStep) => {
  if (!order) return;

  const existingStatuses = order.riwayat_status_pesanan?.map(s => s.status) || [];
  const currentIndexInDB = Math.max(
    ...existingStatuses.map(s => ORDER_SUBSTEPS.findIndex(step => step.label === s)),
    -1 // kalau kosong
  );

  const clickedIndex = ORDER_SUBSTEPS.findIndex(s => s.label === clickedStep.label);

  if (clickedIndex <= currentIndexInDB) {
    alert("Status ini sudah tercapai sebelumnya.");
    return;
  }

  // slice sub-status yang harus diinsert (step2…step4 misal)
  const stepsToInsert = ORDER_SUBSTEPS.slice(currentIndexInDB + 1, clickedIndex + 1);

  const confirmUpdate = confirm(
    `Update status pesanan ke "${clickedStep.label}" dan semua langkah sebelumnya yang belum ada?`
  );
  if (!confirmUpdate) return;

  try {
    // bulk insert ke riwayat_status_pesanan
    const inserts = stepsToInsert.map(step => ({
      id_pesanan: order.id_pesanan,
      status: step.label,
      deskripsi: step.desc,
      waktu: new Date()
    }));

    const { error: riwayatError } = await supabase
      .from("riwayat_status_pesanan")
      .insert(inserts);
    if (riwayatError) throw riwayatError;

    // update super status terakhir
    const superStatus = getSuperStatus(clickedStep.label);
    const { error: pesananError } = await supabase
      .from("pesanan")
      .update({ status_pesanan: superStatus })
      .eq("id_pesanan", order.id_pesanan);
    if (pesananError) throw pesananError;

    // update local state
    setOrder({
      ...order,
      latestStatus: { status: clickedStep.label, waktu: new Date() },
      status_pesanan: superStatus,
      riwayat_status_pesanan: [
        ...(order.riwayat_status_pesanan || []),
        ...inserts
      ]
    });

    alert("Status pesanan berhasil diupdate!");
  } catch (err) {
    console.error(err);
    alert("Gagal mengupdate status pesanan");
  }
};


  if (loading) return <div className="p-6 text-center">Loading...</div>;
  if (error) return <div className="p-6 text-center text-red-600">{error}</div>;
  if (!order) return <div className="p-6 text-center text-gray-600">Order tidak ditemukan</div>;

  const currentSubIndex = ORDER_SUBSTEPS.findIndex(s => s.label === (order.latestStatus?.status || "Pesanan Baru"));

  // Helper: warna badge berdasarkan super status
  const getStepColor = (subStatus) => {
    const superStatus = getSuperStatus(subStatus);
    switch (superStatus) {
      case "Pending": return "bg-yellow-100 border-yellow-300 text-yellow-700";
      case "In Progress": return "bg-purple-100 border-purple-300 text-purple-700";
      case "Done": return "bg-green-100 border-green-300 text-green-700";
      default: return "bg-gray-100 border-gray-200 text-gray-700";
    }
  };

  return (
    <StaffDashboardLayout>
      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
        <h1 className="text-3xl font-bold text-purple-700">
          Detail Pesanan #{order.id_pesanan}
        </h1>

        {/* Cards Informasi Pelanggan & Pesanan bisa tetap pakai versi extreme beautify */}

        {/* Checklist Status Pesanan */}
        <div className="bg-white p-6 rounded-2xl shadow-2xl border border-gray-100 space-y-4">
          <h2 className="text-2xl font-bold text-purple-700 mb-4">
            Progress Pesanan
          </h2>

          <ul className="space-y-3">
            {ORDER_SUBSTEPS.map((step, idx) => {
              const completed = idx <= currentSubIndex;
              return (
                <li
                  key={step.step}
                  className={`flex items-center justify-between p-3 rounded-xl border ${getStepColor(step.label)} hover:cursor-pointer hover:shadow-md transition-shadow`}
                  onClick={() => handleStepClick(step)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{step.icon}</span>
                    <div>
                      <p className={`font-medium`}>{step.label}</p>
                      <p className="text-sm text-gray-500">{step.desc}</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={completed}
                    readOnly
                    className="w-5 h-5 accent-green-600"
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