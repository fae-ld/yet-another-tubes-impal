"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/contexts/UserContext";
import { ArrowLeft, Loader2, Clock, CheckCircle, XCircle } from "lucide-react";
import ReviewForm from "@/components/ReviewForm";
import ReviewCard from "@/components/ReviewCard";
import { insertNotification } from "@/utils/notifications";
import {
  STATUS_INFO,
  getStatusColor,
  getSuperStatus,
} from "@/utils/orderdetails";

export const getStatusIcon = (superStatus) => {
  const icons = {
    Pending: <Clock size={20} className="text-yellow-500" />,
    "In Progress": <Loader2 size={20} className="text-blue-500 animate-spin" />,
    Done: <CheckCircle size={20} className="text-green-500" />,
    Batal: <XCircle size={20} className="text-red-500" />,
  };
  return icons[superStatus] || null;
};

const useOrderData = (id, user, loading) => {
  const [order, setOrder] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loadingPage, setLoadingPage] = useState(true);
  const [existingReview, setExistingReview] = useState(null);
  const [layanan, setLayanan] = useState(null);

  useEffect(() => {
    if (!user || loading) return;

    const fetchOrder = async () => {
      try {
        setLoadingPage(true);

        // 1. Fetch data utama
        const { data: pesanan, error: pesananError } = await supabase
          .from("pesanan")
          .select(`*, layanan (jenis_layanan, is_archived)`)
          .eq("id_pesanan", id)
          .eq("id_pelanggan", user.id)
          .eq("layanan.is_archived", false)
          .single();

        // 2. Sederhanakan validasi (Mengurangi percabangan bertingkat)
        const isInvalid =
          pesananError?.code === "PGRST116" ||
          !pesanan ||
          !pesanan.layanan ||
          pesanan.layanan.is_archived;

        if (isInvalid) {
          setOrder(null);
          setLayanan(null);
          return;
        }

        // 3. Set data pesanan yang valid
        setOrder(pesanan);
        setLayanan(pesanan.layanan);

        // 4. Jalankan fetch riwayat dan ulasan secara paralel (Lebih cepat & bersih)
        const [riwayatRes, ulasanRes] = await Promise.all([
          supabase
            .from("riwayat_status_pesanan")
            .select("*")
            .eq("id_pesanan", id)
            .order("waktu", { ascending: true }),
          supabase
            .from("ulasan")
            .select("*")
            .eq("id_pesanan", pesanan.id_pesanan)
            .single(),
        ]);

        setTimeline(riwayatRes.data || []);

        // Pengecekan ulasan yang lebih sederhana
        if (!ulasanRes.error || ulasanRes.error.code === "PGRST116") {
          setExistingReview(ulasanRes.data);
        }
      } catch (err) {
        console.error("Gagal fetch data:", err);
      } finally {
        setLoadingPage(false);
      }
    };

    fetchOrder();
  }, [id, user, loading]);

  return { order, timeline, loadingPage, existingReview, layanan };
};

const useMidtransScript = () => {
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
};

const usePaymentHandler = (order, user) => {
  const handleSnapPay = async () => {
    if (!order?.id_pesanan || !order?.total_biaya_final) {
      console.error("❌ Order belum lengkap untuk diproses pembayaran.");
      return;
    }

    try {
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

      if (!data.token) {
        console.error("❌ Tidak ada token dari backend:", data);
        return;
      }

      window.snap.pay(data.token, {
        onSuccess: async (result) => {
          await handlePaymentSuccess(result, order);
          window.location.reload();
        },
        onPending: (result) => console.warn("🕒 Pembayaran pending:", result),
        onError: (result) => console.error("❌ Error pembayaran:", result),
        onClose: () => console.warn("💤 Popup ditutup user."),
      });
    } catch (err) {
      console.error("💥 Error di handleSnapPay:", err);
    }
  };

  return { handleSnapPay };
};

const handlePaymentSuccess = async (result, order) => {
  const paymentType = "QRIS";
  const transactionRef = result.transaction_id || result.transaction_status;

  await supabase
    .from("pesanan")
    .update({
      status_pembayaran: "Paid",
      status_pesanan: "In Progress",
      metode_pembayaran: paymentType,
      jumlah_dibayar: order.total_biaya_final,
      tgl_pembayaran_lunas: new Date().toISOString(),
      referensi_pembayaran: transactionRef,
    })
    .eq("id_pesanan", order.id_pesanan);

  await supabase.from("riwayat_status_pesanan").insert([
    {
      id_pesanan: order.id_pesanan,
      status: "Sedang Dicuci",
      deskripsi: "Pembayaran berhasil. Pesanan masuk antrian pencucian.",
      waktu: new Date().toISOString(),
    },
  ]);

  await insertNotification(
    {
      id_pesanan: order.id_pesanan,
      id_pelanggan: order.id_pelanggan,
    },
    "Sedang Dicuci",
  );
};

const OrderHeader = ({ layanan, order, currentSubStatus, superStatus }) => (
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
    <WeightInfo order={order} />
    <div
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full mt-3 text-sm font-medium ${getStatusColor(
        superStatus,
      )}`}
    >
      {getStatusIcon(superStatus)}
      {currentSubStatus || "Status Belum Ditentukan"}
    </div>
  </div>
);

const WeightInfo = ({ order }) => (
  <div className="flex justify-center items-center space-x-6 border-t border-b py-3 mb-4 bg-blue-50/50 rounded-lg">
    <div className="flex flex-col items-center">
      <p className="text-sm font-semibold text-gray-600">Estimasi Berat ⚖️</p>
      <p className="text-xl font-bold text-blue-600">
        {order.estimasi_berat ? `${order.estimasi_berat.toFixed(1)} kg` : "N/A"}
      </p>
    </div>
    <div className="w-px h-10 bg-gray-300"></div>
    <div className="flex flex-col items-center">
      <p className="text-sm font-semibold text-gray-600">Berat Aktual ✅</p>
      <p className="text-xl font-bold text-green-600">
        {order.berat_aktual ? (
          `${order.berat_aktual.toFixed(1)} kg`
        ) : (
          <span className="text-red-500">Belum Ditimbang</span>
        )}
      </p>
    </div>
    {order.status_pesanan !== "Selesai" && <RemainingDays order={order} />}
  </div>
);

const RemainingDays = ({ order }) => {
  const calculateDaysRemaining = () => {
    if (!order.jadwal_selesai) return "TBD";

    const estimatedDate = new Date(order.jadwal_selesai);
    const today = new Date();
    estimatedDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const diffTime = estimatedDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Hari Ini!";
    if (diffDays < 0) return "Terlambat!";
    return `${diffDays} hari`;
  };

  return (
    <>
      <div className="w-px h-10 bg-gray-300"></div>
      <div className="flex flex-col items-center px-2">
        <p className="text-xs font-semibold text-gray-600">
          Sisa Hari (Estimasi) ⏳
        </p>
        <p className="text-lg font-bold text-purple-600">
          {calculateDaysRemaining()}
        </p>
      </div>
    </>
  );
};

const CancelledOrderNotice = ({ order }) => (
  <div className="bg-red-50 border border-red-200 p-6 rounded-2xl text-center mt-6 shadow-sm">
    <div className="flex justify-center mb-3">
      <div className="bg-red-100 p-3 rounded-full">
        <span className="text-2xl">🚫</span>
      </div>
    </div>
    <h3 className="text-red-900 font-bold text-lg">Pesanan Dibatalkan</h3>
    <p className="text-red-700 text-sm mb-4 leading-relaxed">
      Mohon maaf, pesanan ini telah dihentikan. Jika Anda merasa ini adalah
      kesalahan atau ingin bertanya lebih lanjut, silakan hubungi tim kami.
    </p>
    <div className="bg-white py-4 px-4 rounded-xl border border-red-100 mb-5 flex flex-col items-center gap-1">
      <span className="text-gray-400 text-[10px] uppercase font-bold tracking-widest">
        Customer Support
      </span>
      <span className="text-sm font-medium text-gray-700 italic">
        support@laundrygo.dummy
      </span>
    </div>
    <Button
      onClick={() =>
        (window.location.href =
          "mailto:support@laundrygo.dummy?subject=Tanya Pesanan Batal #" +
          order.id_pesanan)
      }
      className="bg-gray-800 text-white hover:bg-black rounded-xl py-5 text-sm font-semibold w-full"
    >
      Hubungi via Email
    </Button>
  </div>
);

const PaymentSection = ({
  order,
  isPendingPayment,
  shouldShowSnapButton,
  shouldShowCODInfo,
  handleSnapPay,
}) => {
  // 1. Persiapkan data biaya agar tidak diulang-ulang (mengurangi noise logika)
  const formattedTotal = order?.total_biaya_final?.toLocaleString("id-ID") || "0";
  const isPaid = order?.status_pembayaran === "Paid";

  // 2. Gunakan Early Returns yang lebih bersih
  if (isPendingPayment && shouldShowSnapButton) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-yellow-700 text-center mt-6">
        💰 Pesanan siap dibayar: **Rp {formattedTotal},-**
        <div className="mt-3">
          <Button
            onClick={handleSnapPay}
            className="bg-yellow-600 text-white hover:bg-yellow-700 rounded-lg px-4 py-2"
          >
            Bayar Sekarang
          </Button>
        </div>
      </div>
    );
  }

  if (shouldShowCODInfo) {
    return (
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-blue-700 text-center mt-6">
        🛵 Metode Pembayaran: **Bayar di Tempat (COD)**
        <p className="text-sm mt-1">
          Pembayaran sebesar Rp {formattedTotal},- akan dilakukan tunai saat pakaian diantar kembali.
        </p>
      </div>
    );
  }

  if (isPaid) {
    const paymentLabel = order.metode_pembayaran_initial === "COD" ? "Tunai (COD)" : "Prepaid";
    
    return (
      <div className="bg-green-50 border border-green-200 p-4 rounded-lg text-green-700 text-center mt-6">
        ✅ Pembayaran **LUNAS** sebesar Rp {formattedTotal},-
        {order.metode_pembayaran_initial && (
          <span className="text-sm block mt-1">({paymentLabel})</span>
        )}
      </div>
    );
  }

  return null;
};

const ReviewSection = ({
  order,
  currentSubStatus,
  superStatus,
  existingReview,
  user,
}) => {
  const isCompleted =
    order?.status_pesanan === "Selesai" &&
    currentSubStatus === "Selesai" &&
    superStatus === "Done";

  if (!isCompleted) return null;

  if (existingReview) {
    return (
      <div className="mt-3">
        <ReviewCard
          review={{
            ...existingReview,
            pelanggan_nama: user.user_metadata?.full_name || "Anda",
          }}
          variant="default"
        />
      </div>
    );
  }

  return (
    <div className="mt-3">
      <ReviewForm
        orderId={order.id_pesanan}
        onReviewSubmitted={() => {
          alert("Ulasan terkirim. Memuat ulang halaman...");
          window.location.reload();
        }}
      />
    </div>
  );
};

const Timeline = ({ timeline }) => (
  <div className="mt-6 space-y-4">
    <h2 className="font-semibold text-blue-700 mb-2">Riwayat Pesanan 🕒</h2>
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
            key={item.id_riwayat}
            className="flex items-start gap-3 p-3 rounded-xl shadow-sm bg-gray-50 border border-gray-200"
          >
            <span className="text-2xl pt-1">{info.emoji}</span>
            <div className="flex flex-col">
              <span className="text-blue-700 font-medium">{item.status}</span>
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
);

// =========================================================
// MAIN COMPONENT
// =========================================================
export default function OrderDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, loading } = useUser();

  const { order, timeline, loadingPage, existingReview, layanan } =
    useOrderData(id, user, loading);
  const { handleSnapPay } = usePaymentHandler(order, user);
  useMidtransScript();

  const isPrepaid = order?.metode_pembayaran === "QRIS";
  const currentSubStatus = order?.status_pesanan || "";
  const superStatus = getSuperStatus(currentSubStatus);
  const isPendingPayment =
    timeline.map((t) => t.status).includes("Menunggu Pembayaran") &&
    timeline.length === 4;
  const shouldShowSnapButton =
    isPrepaid &&
    currentSubStatus === "Menunggu Pembayaran" &&
    order?.status_pembayaran !== "Paid" &&
    order?.berat_aktual !== null;
  const shouldShowCODInfo = !isPrepaid && order?.status_pembayaran !== "Paid";

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
          <button
            onClick={() => router.push("/orders")}
            className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg shadow-sm hover:bg-blue-100 hover:scale-[1.03] hover:shadow-md transition-all duration-200 active:scale-95 cursor-pointer mb-4"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">Kembali</span>
          </button>

          <OrderHeader
            layanan={layanan}
            order={order}
            currentSubStatus={currentSubStatus}
            superStatus={superStatus}
          />

          {order?.cancelled_at && <CancelledOrderNotice order={order} />}

          {!order?.cancelled_at && (
            <PaymentSection
              order={order}
              isPendingPayment={isPendingPayment}
              shouldShowSnapButton={shouldShowSnapButton}
              shouldShowCODInfo={shouldShowCODInfo}
              handleSnapPay={handleSnapPay}
            />
          )}

          <ReviewSection
            order={order}
            currentSubStatus={currentSubStatus}
            superStatus={superStatus}
            existingReview={existingReview}
            user={user}
          />

          <Timeline timeline={timeline} />
        </div>
      </div>
    </DashboardLayout>
  );
}
