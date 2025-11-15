"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/contexts/UserContext";
import DashboardLayout from "@/components/DashboardLayout";
import StaffLoginForm from "@/components/staff/StaffLoginForm";
import StaffDashboard from "@/components/staff/StaffDashboard";

export default function StaffPage() {
  const { user, loading } = useUser();
  const [role, setRole] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Setelah OAuth redirect → panggil /api/set-role (mirip page utama kamu)
  useEffect(() => {
    const applyRoleAfterOAuth = async () => {
      if (!user) return;

      try {
        await fetch("/api/set-role", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id }),
        });

        // cek role terbaru
        const r = await fetch("/api/debug-role");
        const data = await r.json();
        setRole(data.role);
        setIsLoggedIn(true);
      } catch (err) {
        console.error("Failed to apply role:", err);
      }
    };

    applyRoleAfterOAuth();
  }, [user]);

  // Skeleton loading sama persis nuansanya
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

  // callback login manual
  const handleLoginSuccess = async () => {
    if (!user) return;

    const res = await fetch("/api/debug-role");
    const data = await res.json();

    setRole(data.role);
    setIsLoggedIn(true);
  };

  // belum login → tampilkan LoginForm
  if (!user || !isLoggedIn || !role) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
        <StaffLoginForm onLogin={handleLoginSuccess} />
      </div>
    );
  }

  // memastikan hanya role staf yg boleh (optional check)
  if (role !== "staf") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg font-semibold text-red-500">
          Kamu bukan staf… balik sana 😭
        </p>
      </div>
    );
  }

  // Logged in & staf → tampilkan dashboard
  return (
    <DashboardLayout>
      <div>
        <h1 className="text-3xl font-bold text-blue-600">
          Heyyy, selamat datang di Dashboard Staff~
        </h1>
        <p className="mt-4 text-gray-700">dude ... what the flip 😳</p>
      </div>
    </DashboardLayout>
  );
}
