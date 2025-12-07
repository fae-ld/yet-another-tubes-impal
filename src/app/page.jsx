"use client";

import DashboardLayout from "@/components/DashboardLayout";
import LoginForm from "@/components/LoginForm";
import { useUser } from "@/contexts/UserContext";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import HomePageContent from "@/app/HomePageContent"; // Import komponen baru

export default function Page() {
  const { user, loading } = useUser();
  const [role, setRole] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // set-role setelah OAuth redirect
  useEffect(() => {
    const setRoleAfterOAuth = async () => {
      if (!user) return; // hanya jalan kalau user ada

      const res = await fetch("/api/set-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await res.json();

      // if (data.success) {
      //   setIsLoggedIn(true);
      //   // fetch role dari debug-role
      //   const roleRes = await fetch("/api/debug-role");
      //   const roleData = await roleRes.json();
      //   setRole(roleData.role);
      // }
    };

    setRoleAfterOAuth();
  }, [user]);

  // Skeleton / loading screen (tetap sama)
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

  // callback untuk LoginForm email/password
  const handleLogin = async () => {
    if (user) {
      setIsLoggedIn(true);
      const roleRes = await fetch("/api/debug-role");
      const roleData = await roleRes.json();
      setRole(roleData.role);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
        <LoginForm onLogin={handleLogin} />
      </div>
    );
  }

  return (
    // Jika user sudah login, tampilkan DashboardLayout dengan konten homepage
    // Perhatikan: Konten ini mungkin lebih cocok sebagai landing page (jika belum login)
    // atau sebagai halaman "Home" di dalam dashboard. Saya asumsikan Anda ingin konten ini muncul.
    user ? (
      <DashboardLayout>
        {/* Konten homepage yang sudah dibuat */}
        <HomePageContent />
      </DashboardLayout>
    ) : (
      // Jika user belum login, tampilkan halaman Login
      <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
        {/* Pilihan 1: Jika ini landing page, tampilkan HomePageContent *TANPA* DashboardLayout */}
        {/* <HomePageContent /> */}

        {/* Pilihan 2: Jika ini halaman login seperti kode Anda sebelumnya */}
        <LoginForm />
      </div>
    )
  );
}
