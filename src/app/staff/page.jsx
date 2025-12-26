"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@/contexts/UserContext";
import StaffLoginForm from "@/components/staff/StaffLoginForm";
import StaffDashboardLayout from "@/components/staff/StaffDashboardLayout";
import {
  ClipboardList,
  Sparkles,
  Megaphone,
  Timer,
  CreditCard,
  BadgeCheck,
} from "lucide-react";

export default function StaffPage() {
  const { user, loading } = useUser();
  const [role, setRole] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [roleLoading, setRoleLoading] = useState(true);

  useEffect(() => {
    const applyRoleAfterOAuth = async () => {
      if (!user) return;

      try {
        await fetch("/api/set-role", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id }),
        });

        const r = await fetch("/api/debug-role");
        const data = await r.json();
        setRole(data.role);
        setIsLoggedIn(true);
        setRoleLoading(false);
      } catch (err) {
        console.error("Failed to apply role:", err);
        setRoleLoading(false);
      }
    };

    applyRoleAfterOAuth();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="w-full max-w-4xl bg-white rounded-xl shadow-lg p-8 animate-pulse">
          <div className="h-6 bg-gray-300 rounded mb-4"></div>
          <div className="h-4 bg-gray-300 rounded mb-2"></div>
          <div className="h-4 bg-gray-300 rounded mb-2"></div>
        </div>
      </div>
    );
  }

  const handleLoginSuccess = async () => {
    if (!user) return;
    const res = await fetch("/api/debug-role");
    const data = await res.json();
    setRole(data.role);
    setIsLoggedIn(true);
  };

  if (!user || !isLoggedIn || !role) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
        <StaffLoginForm onLogin={handleLoginSuccess} />
      </div>
    );
  }

  if (role !== "staf") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg font-semibold text-red-500">
          Kamu bukan staf… balik sana 😭
        </p>
      </div>
    );
  }

  return (
    <StaffDashboardLayout>
      <div className="px-4 md:px-8 py-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Hero */}
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 overflow-hidden">
            <div className="p-6 md:p-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-purple-50 text-purple-700 ring-1 ring-purple-100 px-3 py-1 text-xs font-semibold">
                <Sparkles size={14} />
                Staff Dashboard
              </div>

              <h1 className="mt-4 text-2xl md:text-3xl font-extrabold text-gray-900">
                Hi, selamat datang!
              </h1>

              <p className="mt-2 text-gray-600 max-w-2xl">
                Kelola pesanan, layanan, dan pengumuman dengan cepat & rapi dari
                satu tempat.
              </p>

              {/* Agenda hari ini (text, not card) */}
              <div className="mt-6">
                <p className="text-sm font-bold text-gray-900">
                  Agenda hari ini
                </p>

                <ul className="mt-4 space-y-2">
                  <li className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-purple-700 ring-1 ring-purple-100">
                      <Timer size={16} />
                    </span>
                    <div className="leading-snug">
                      <p className="text-sm font-semibold text-gray-900">
                        Update status pesanan
                      </p>
                      <p className="text-xs text-gray-500">
                        Biar pelanggan dapat notifikasi progress yang benar.
                      </p>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-purple-700 ring-1 ring-purple-100">
                      <CreditCard size={16} />
                    </span>
                    <div className="leading-snug">
                      <p className="text-sm font-semibold text-gray-900">
                        Cek pesanan unpaid
                      </p>
                      <p className="text-xs text-gray-500">
                        Pastikan tidak ada pesanan nyangkut di pembayaran.
                      </p>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-purple-700 ring-1 ring-purple-100">
                      <BadgeCheck size={16} />
                    </span>
                    <div className="leading-snug">
                      <p className="text-sm font-semibold text-gray-900">
                        Pastikan berat aktual benar
                      </p>
                      <p className="text-xs text-gray-500">
                        Total biaya final ikut akurat dan mengurangi komplain.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Quick Actions (tanpa Pengaturan) */}
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Quick Actions</h2>
              <p className="text-sm text-gray-600 mt-1">
                Akses cepat ke halaman yang sering dipakai staff.
              </p>
            </div>

            <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link
                href="/staff/orders"
                className="group rounded-2xl ring-1 ring-gray-200 hover:ring-purple-200 hover:bg-purple-50 transition p-5"
              >
                <div className="h-10 w-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <ClipboardList size={20} />
                </div>
                <p className="mt-3 font-bold text-gray-900">Kelola Pesanan</p>
                <p className="text-sm text-gray-600">
                  Lihat & update status pesanan.
                </p>
              </Link>

              <Link
                href="/staff/services"
                className="group rounded-2xl ring-1 ring-gray-200 hover:ring-purple-200 hover:bg-purple-50 transition p-5"
              >
                <div className="h-10 w-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Sparkles size={20} />
                </div>
                <p className="mt-3 font-bold text-gray-900">Kelola Layanan</p>
                <p className="text-sm text-gray-600">Atur layanan & harga.</p>
              </Link>

              <Link
                href="/staff/announcements"
                className="group rounded-2xl ring-1 ring-gray-200 hover:ring-purple-200 hover:bg-purple-50 transition p-5"
              >
                <div className="h-10 w-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Megaphone size={20} />
                </div>
                <p className="mt-3 font-bold text-gray-900">Pengumuman</p>
                <p className="text-sm text-gray-600">
                  Info promo & operasional.
                </p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </StaffDashboardLayout>
  );
}
