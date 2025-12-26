"use client";

import { useState } from "react";
import { LogOut, Home, Clock, Bell, Settings, Menu } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

// ============= Constants =============
const MENU_ITEMS = [
  { name: "Home", icon: <Home size={24} />, key: "home", href: "#home" },
  {
    name: "Layanan",
    icon: <Clock size={24} />,
    key: "layanan",
    href: "#layanan",
  },
  {
    name: "History & Status",
    icon: <Clock size={24} />,
    key: "history",
    href: "#history",
  },
  {
    name: "Notifikasi",
    icon: <Bell size={24} />,
    key: "notifikasi",
    href: "#notifikasi",
  },
  {
    name: "Settings",
    icon: <Settings size={24} />,
    key: "settings",
    href: "#settings",
  },
  {
    name: "Logout",
    icon: <LogOut size={24} />,
    key: "logout",
    href: "#logout",
    isLogout: true,
  },
];

// ============= Helper Components =============
function MenuButton({ item, isActive, onClick }) {
  const getButtonClasses = () => {
    const baseClasses =
      "group relative flex items-center justify-center w-12 h-12 rounded-lg cursor-pointer transition-all";

    if (isActive) {
      return `${baseClasses} bg-blue-600 text-white`;
    }

    if (item.isLogout) {
      return `${baseClasses} text-red-600 hover:bg-red-600 hover:text-white`;
    }

    return `${baseClasses} text-blue-600 hover:bg-blue-600 hover:text-white`;
  };

  return (
    <div className={getButtonClasses()} onClick={onClick}>
      {item.icon}
      <span className="hidden md:block absolute left-14 top-1/2 -translate-y-1/2 bg-black text-white text-sm px-2 py-1 rounded opacity-0 group-hover:opacity-100 translate-x-[-10px] group-hover:translate-x-0 transition-all whitespace-nowrap pointer-events-none z-50">
        {item.name}
      </span>
    </div>
  );
}

function FloatingProfile({ user }) {
  return (
    <div className="fixed top-4 right-4 flex items-center gap-3 bg-white rounded-xl shadow-md px-4 py-2 z-50">
      <img
        src="https://avatar.iran.liara.run/public"
        alt="Profile"
        className="w-10 h-10 rounded-full object-cover"
      />
      <span className="font-medium text-gray-800">
        {user?.user_metadata?.full_name || "Nama User"}
      </span>
    </div>
  );
}

function ContentArea({ active, userEmail }) {
  const contentMap = {
    home: (
      <>
        <h1 className="text-3xl font-bold text-blue-600">
          Welcome, {userEmail || "User"}!
        </h1>
        <p className="mt-4 text-gray-700">Ini halaman utama kamu.</p>
      </>
    ),
    layanan: <p className="text-gray-700">Ini halaman Layanan</p>,
    history: <p className="text-gray-700">Ini halaman History & Status</p>,
    notifikasi: <p className="text-gray-700">Ini halaman Notifikasi</p>,
    settings: <p className="text-gray-700">Ini halaman Settings</p>,
  };

  return contentMap[active] || null;
}

// ============= Main Component =============
export default function HomeSection({ user }) {
  const router = useRouter();
  const [active, setActive] = useState("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleMenuClick = async (item) => {
    if (item.key === "logout") {
      await supabase.auth.signOut();
      return;
    }

    setActive(item.key);
    router.push(item.href);
    setSidebarOpen(false);
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const sidebarClasses = `fixed md:static top-0 left-0 z-40 h-screen w-20 bg-white rounded-tr-xl rounded-br-xl shadow-md border-r border-gray-200 transform
    ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} transition-transform duration-300 ease-in-out md:translate-x-0`;

  return (
    <div className="flex w-full h-screen bg-gray-50 relative">
      {/* Hamburger Menu */}
      <button
        className="fixed top-4 left-4 z-50 p-2 rounded-md bg-white shadow-md md:hidden"
        onClick={toggleSidebar}
      >
        <Menu size={24} />
      </button>

      {/* Sidebar */}
      <aside className={sidebarClasses}>
        <div className="flex flex-col items-center gap-6 h-full mt-20 md:mt-0 md:justify-center">
          {MENU_ITEMS.map((item) => (
            <MenuButton
              key={item.key}
              item={item}
              isActive={active === item.key}
              onClick={() => handleMenuClick(item)}
            />
          ))}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 overflow-auto md:pl-20 pt-20 relative">
        <FloatingProfile user={user} />
        <ContentArea active={active} userEmail={user?.email} />
      </div>
    </div>
  );
}
