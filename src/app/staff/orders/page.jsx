"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/contexts/UserContext";
import StaffDashboardLayout from "@/components/staff/StaffDashboardLayout";
import { supabase } from "@/lib/supabase";
import OrdersTable from "@/components/staff/orders/OrdersTable";
import NotFound from "@/components/errors/404";

export default function OrdersPage() {
  const { user, loading } = useUser();

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    if (!user || loading) {
      setOrdersLoading(true);
      return;
    }

    const loadOrders = async () => {
      setOrdersLoading(true);
      setFetchError(null);

      try {
        const { data, error } = await supabase
          .from("pesanan")
          .select("*")
          .order("id_pesanan", { ascending: false });

        if (error) throw error;
        setOrders(data || []);
      } catch (err) {
        setFetchError(err.message || "Unknown error");
      } finally {
        setOrdersLoading(false);
      }
    };

    loadOrders();
  }, [user, loading]);

  if (loading || ordersLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="w-full max-w-5xl bg-white rounded-xl shadow p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4 w-1/3"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <NotFound
        title="Akses Ditolak"
        message="Anda harus login sebagai Staff untuk melihat halaman ini."
      />
    );
  }

  return (
    <StaffDashboardLayout>
      <div className="p-6 w-full max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-purple-600">
            Daftar Pesanan
          </h1>
          <p className="text-sm text-gray-500">{orders.length} pesanan</p>
        </div>

        {fetchError && (
          <div className="mb-4 p-3 rounded bg-red-50 text-red-700 border border-red-100">
            Error memuat pesanan: {fetchError}
          </div>
        )}

        <OrdersTable orders={orders} />
      </div>
    </StaffDashboardLayout>
  );
}
