"use client";

import DashboardLayout from "@/components/DashboardLayout";
import LoginForm from "@/components/LoginForm";
import { useUser } from "@/context/UserContext";

export default function Page() {
  const { user, loading } = useUser();

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

  return user ? (
    <DashboardLayout>
      <div>
        <h1 className="text-3xl font-bold text-blue-600">
          Heyyy, selamat datang di LaundryGo~
        </h1>
        <p className="mt-4 text-gray-700">dude ... what the flip</p>
      </div>
    </DashboardLayout>
  ) : (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <LoginForm />
    </div>
  );
}
