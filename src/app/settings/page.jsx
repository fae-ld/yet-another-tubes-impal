"use client";

import DashboardLayout from "@/components/DashboardLayout";
import { useUser } from "@/context/UserContext";

export default function SettingsPage() {
  const { user, loading } = useUser();

  if (loading) {
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

  return (
    <DashboardLayout>
      <div className="p-6 max-w-md mx-auto">
        <h1 className="text-3xl font-bold text-blue-600 mb-6">Settings</h1>

        <div className="flex flex-col gap-6">
          {/* Profile picture */}
          <div className="flex flex-col items-center gap-3">
            <img
              src={"https://avatar.iran.liara.run/public/girl"}
              alt="Profile Picture"
              className="w-24 h-24 rounded-full object-cover border-2 border-blue-200"
            />
            <span className="text-gray-700 text-sm">
              Profile picture (read-only)
            </span>
          </div>

          {/* Name */}
          <div className="flex flex-col">
            <label className="text-gray-600 font-medium mb-1">Name</label>
            <input
              type="text"
              value={user.user_metadata?.full_name || ""}
              readOnly
              className="border border-blue-200 rounded-lg px-4 py-2 bg-gray-50 text-gray-700 focus:outline-none"
            />
          </div>

          {/* Email */}
          <div className="flex flex-col">
            <label className="text-gray-600 font-medium mb-1">Email</label>
            <input
              type="email"
              value={user.email || ""}
              readOnly
              className="border border-blue-200 rounded-lg px-4 py-2 bg-gray-50 text-gray-700 focus:outline-none"
            />
          </div>

          {/* Password */}
          <div className="flex flex-col">
            <label className="text-gray-600 font-medium mb-1">Password</label>
            <input
              type="password"
              value="********"
              readOnly
              className="border border-blue-200 rounded-lg px-4 py-2 bg-gray-50 text-gray-700 focus:outline-none"
            />
            <span className="text-gray-500 text-sm mt-1">
              Password tidak bisa diubah sementara
            </span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
