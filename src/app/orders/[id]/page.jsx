"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Clock, Loader2, CheckCircle, XCircle } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useUser } from "@/contexts/UserContext";
import { supabase } from "@/lib/supabase";

export default function OrderDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, loading: userLoading } = useUser();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch data pesanan berdasarkan id
  useEffect(() => {
    if (userLoading) return;
    if (!user) return;

    const fetchOrder = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("pesanan")
        .select("*")
        .eq("id_pelanggan", user.id)
        .eq("id_pesanan", id)
        .single();

      if (error) {
        console.error("Gagal mengambil pesanan:", error);
      } else {
        setOrder(data);
      }
      setLoading(false);
    };

    fetchOrder();
  }, [id, user, userLoading]);

  // Load Snap.js untuk Midtrans
  useEffect(() => {
    if (!window.snap) {
      const script = document.createElement("script");
      script.src = "https://app.sandbox.midtrans.com/snap/snap.js";
      script.setAttribute(
        "data-client-key",
        process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY
      );
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const handleSnapPay = async () => {
    try {
      const res = await fetch("/api/create-snap-transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gross_amount: order.total_biaya_final || 25000,
          name: user.user_metadata?.full_name || "User name",
          email: user.email,
        }),
      });

      const data = await res.json();

      if (data.token) {
        window.snap.pay(data.token, {
          onSuccess: async (result) => {
            console.log("✅ success:", result);

            // Update status di tabel pesanan
            const { error: updateError } = await supabase
              .from("pesanan")
              .update({
                status_pembayaran: "Paid",
                status_pesanan: "In Progress",
              })
              .eq("id_pesanan", order.id_pesanan || id); // fallback ke param

            if (updateError) {
              console.error("Gagal update pesanan:", updateError);
            }

            // Insert ke tabel pembayaran
            const { error: insertError } = await supabase.from("pembayaran").insert([
              {
                id_pesanan: order.id_pesanan || id,
                metode: "QRIS",
                jumlah: order.total_biaya_final || 25000,
                tgl_pembayaran: new Date().toISOString(),
              },
            ]);

            if (insertError) {
              console.error("Gagal insert pembayaran:", insertError);
            }

            // Reload biar UI update
            window.location.reload();
          },
          onPending: (result) => console.log("🕒 pending:", result),
          onError: (result) => console.log("❌ error:", result),
          onClose: () => console.log("popup closed by user"),
        });
      } else {
        console.error("no token from backend:", data);
      }
    } catch (err) {
      console.error("snap pay error:", err);
    }
  };

  if (loading || userLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 animate-pulse">
            <div className="h-6 bg-gray-300 rounded mb-4"></div>
            <div className="h-4 bg-gray-300 rounded mb-2"></div>
            <div className="h-4 bg-gray-300 rounded mb-2"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-gray-500">User tidak ditemukan</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!order) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen text-gray-500">
          Pesanan tidak ditemukan 🧐
        </div>
      </DashboardLayout>
    );
  }

  const renderTracker = (status) => {
    const steps = [
      { label: "Pesanan diterima 🧾", done: true },
      {
        label: "Sedang dicuci 💧",
        done: status === "In Progress" || status === "Done",
      },
      { label: "Disetrika 🔥", done: status === "Done" },
      { label: "Selesai 📦", done: status === "Done" },
    ];

    if (order.status_pembayaran === "Pending") {
      return (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-yellow-700 text-center mt-4">
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
      );
    }

    if (order.status_pesanan === "Batal") {
      return (
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg text-red-600 text-center mt-4">
          ❌ Pesanan dibatalkan karena keterlambatan pembayaran.
        </div>
      );
    }

    return (
      <div className="mt-6 space-y-4">
        {steps.map((step, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 p-3 rounded-xl shadow-sm ${
              step.done
                ? "bg-blue-50 border border-blue-200"
                : "bg-gray-50 border border-gray-200"
            }`}
          >
            {step.done ? (
              <CheckCircle size={20} className="text-blue-500" />
            ) : (
              <Clock size={20} className="text-gray-400" />
            )}
            <span
              className={`${
                step.done ? "text-blue-700 font-medium" : "text-gray-500"
              }`}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
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

  const getStatusIcon = (status) => {
    switch (status) {
      case "Pending":
        return <Clock size={22} className="text-yellow-500" />;
      case "In Progress":
        return <Loader2 size={22} className="text-blue-500 animate-spin" />;
      case "Done":
        return <CheckCircle size={22} className="text-green-500" />;
      case "Batal":
        return <XCircle size={22} className="text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen p-6 flex flex-col items-center">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-6 relative">
          <button
            onClick={() => router.push("/orders")}
            className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg shadow-sm 
                      hover:bg-blue-100 hover:scale-[0.95] hover:shadow-md 
                      transition-all duration-200 cursor-pointer mb-4"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">Kembali</span>
          </button>

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
                order.status_pesanan
              )}`}
            >
              {getStatusIcon(order.status_pesanan)}
              {order.status_pesanan}
            </div>
          </div>

          {renderTracker(order.status_pesanan)}
        </div>
      </div>
    </DashboardLayout>
  );
}