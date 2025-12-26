"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Clock,
  Bell,
  Settings,
  LogOut,
  Menu,
  ShoppingCart,
  ReceiptText,
  MegaphoneIcon,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/contexts/UserContext";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { user } = useUser();

  const menuItems = [
    { name: "Home", icon: <Home size={24} />, href: "/" },
    { name: "Services", icon: <ShoppingCart size={24} />, href: "/services" },
    { name: "Orders", icon: <ReceiptText size={24} />, href: "/orders" },
    { name: "Notifications", icon: <Bell size={24} />, href: "/notifications" },
    {
      name: "Announcements",
      icon: <MegaphoneIcon size={24} />,
      href: "/announcements",
    },
    { name: "Settings", icon: <Settings size={24} />, href: "/settings" },
    { name: "Logout", icon: <LogOut size={24} />, href: "#", isLogout: true },
  ];

  const handleMenuClick = async (item) => {
    if (item.isLogout) {
      await supabase.auth.signOut(); // matiin session Supabase
      await fetch("/api/logout");
      router.push("/");
    } else {
      router.push(item.href);
      setSidebarOpen(false);
    }
  };

  return (
    <div className="flex w-full h-screen bg-gray-50 relative">
      {/* Hamburger mobile */}
      <button
        className="fixed top-4 left-4 z-50 p-2 rounded-md bg-white shadow-md md:hidden"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        <Menu size={24} />
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed md:static top-0 left-0 z-40 h-screen w-20 bg-white rounded-tr-xl rounded-br-xl shadow-md border-r border-gray-200 transform
                        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} transition-transform duration-300 ease-in-out md:translate-x-0`}
      >
        <div className="flex flex-col items-center gap-6 h-full mt-20 md:mt-0 md:justify-center">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <div
                key={item.href}
                className={`group relative flex items-center justify-center w-12 h-12 rounded-lg cursor-pointer transition-all
                          ${item.isLogout ? "text-red-600 hover:bg-red-600 hover:text-white" : isActive ? "bg-blue-600 text-white" : "text-blue-600 hover:bg-blue-600 hover:text-white"}`}
                onClick={() => handleMenuClick(item)}
              >
                {item.icon}
                <span className="hidden md:block absolute left-14 top-1/2 -translate-y-1/2 bg-black text-white text-sm px-2 py-1 rounded opacity-0 group-hover:opacity-100 translate-x-[-10px] group-hover:translate-x-0 transition-all whitespace-nowrap pointer-events-none z-50">
                  {item.name}
                </span>
              </div>
            );
          })}
        </div>
      </aside>

      {/* Floating profile */}
      <div className="fixed top-4 right-4 flex items-center gap-3 bg-white rounded-xl shadow-md px-4 py-2 z-50">
        <img
          src="/images/user.jpg"
          alt="Profile"
          className="w-10 h-10 rounded-full object-cover"
        />
        <span className="font-medium text-gray-800">
          {user?.nama_pelanggan || "User"}
        </span>
      </div>

      {/* Page content */}
      <main className="flex-1 overflow-auto md:pl-20 pt-20 relative">
        {children}
      </main>
    </div>
  );
}
