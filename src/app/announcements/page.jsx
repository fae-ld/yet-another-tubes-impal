"use client";

import DashboardLayout from "@/components/DashboardLayout";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnnouncements = async () => {
    setLoading(true);
    setError(null);

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("pengumuman")
      .select("*")
      .eq("status", true)
      .lte("tgl_mulai", now)
      .gte("tgl_selesai", now)
      .order("tgl_mulai", { ascending: false });

    if (error) {
      console.error("Gagal fetch pengumuman:", error);
      setError("Gagal memuat pengumuman.");
      setAnnouncements([]);
    } else {
      setAnnouncements(data || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  return (
    <DashboardLayout>
      <div className="p-6 w-full max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-blue-600 mb-6">📢 Pengumuman</h1>

        {loading ? (
          <div className="text-center py-10 text-gray-600">
            Memuat pengumuman...
          </div>
        ) : error ? (
          <div className="text-center py-10 text-red-600">{error}</div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            Belum ada pengumuman.
          </div>
        ) : (
          <div className="space-y-4">
            {announcements.map((ann) => (
              <div
                key={ann.id_pengumuman}
                className="bg-white rounded-xl shadow p-4 border border-gray-200"
              >
                <h2 className="text-lg font-semibold text-blue-600">
                  {ann.judul}
                </h2>
                <p className="text-sm text-gray-600 mb-2">{ann.tipe}</p>
                <p className="text-gray-800">{ann.konten}</p>
                <p className="text-xs text-gray-400 mt-2">
                  Aktif: {new Date(ann.tgl_mulai).toLocaleDateString("id-ID")} -{" "}
                  {new Date(ann.tgl_selesai).toLocaleDateString("id-ID")}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
