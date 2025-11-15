"use client";

import DashboardLayout from "@/components/DashboardLayout";
import LoginForm from "@/components/LoginForm";
import { useUser } from "@/contexts/UserContext";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

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

  // Skeleton / loading screen
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
    <DashboardLayout>
      <div>
        <h1 className="text-3xl font-bold text-blue-600">
          Heyyy, selamat datang di LaundryGo~
        </h1>
        <p className="mt-4 text-gray-700">dude ... what the flip</p>
      </div>
    </DashboardLayout>
  );
}
