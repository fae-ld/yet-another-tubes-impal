"use client";

import DashboardLayout from "@/components/DashboardLayout";
import { Info, CheckCircle, AlertTriangle, X } from "lucide-react";
import { useState } from "react";

// TODO:
// - notifikasi itu mark as read nya bakal obliterated atau tetep ada di client?

const initialNotifications = [
  {
    id: 1,
    type: "Info",
    title: "Order Received",
    description: 'Laundry "Cuci & Setrika" kamu telah diterima.',
    datetime: "2025-11-11 09:30",
  },
  {
    id: 2,
    type: "Success",
    title: "Laundry Completed",
    description: 'Pesanan "Setrika Saja" telah selesai dicuci.',
    datetime: "2025-11-10 15:20",
  },
  {
    id: 3,
    type: "Warning",
    title: "Payment Pending",
    description: 'Pembayaran untuk "Cuci Kering Cepat" belum diterima.',
    datetime: "2025-11-09 11:45",
  },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(initialNotifications);

  const getNotificationStyles = (type) => {
    switch (type) {
      case "Info":
        return "bg-blue-50 border-blue-200 text-blue-700";
      case "Success":
        return "bg-green-50 border-green-200 text-green-700";
      case "Warning":
        return "bg-yellow-50 border-yellow-200 text-yellow-800";
      default:
        return "bg-gray-50 border-gray-200 text-gray-700";
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "Info":
        return <Info size={24} className="text-blue-500" />;
      case "Success":
        return <CheckCircle size={24} className="text-green-500" />;
      case "Warning":
        return <AlertTriangle size={24} className="text-yellow-500" />;
      default:
        return null;
    }
  };

  const markAsRead = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-3xl font-bold text-blue-600">Notifications</h1>
        <p className="mt-2 text-gray-700 mb-6">
          Semua notifikasi terbaru kamu.
        </p>

        <div className="flex flex-col gap-4">
          {notifications.map((item) => (
            <div
              key={item.id}
              className={`flex items-center gap-4 p-4 border rounded-xl shadow-sm hover:shadow-md transition cursor-pointer relative ${getNotificationStyles(
                item.type,
              )}`}
            >
              {getNotificationIcon(item.type)}
              <div className="flex flex-col">
                <span className="font-semibold">{item.title}</span>
                <span className="text-gray-600 text-sm">
                  {item.description}
                </span>
              </div>
              <span className="ml-auto text-gray-400 text-xs">
                {item.datetime}
              </span>

              {/* Mark as read button */}
              <button
                onClick={() => markAsRead(item.id)}
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"
              >
                <X size={16} />
              </button>
            </div>
          ))}
          {notifications.length === 0 && (
            <p className="text-gray-500 text-center mt-4">
              Tidak ada notifikasi.
            </p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
