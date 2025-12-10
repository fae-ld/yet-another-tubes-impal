"use client";

import StaffDashboardLayout from "@/components/staff/StaffDashboardLayout";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Archive, Undo2, TrashIcon } from "lucide-react";
import AnnouncementForm from "@/components/staff/announcements/AnnouncementForm";

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch pengumuman aktif & nonaktif
  const fetchAnnouncements = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("pengumuman")
      .select("*")
      .order("tgl_mulai", { ascending: false });

    if (error) {
      console.error("Gagal fetch pengumuman:", error);
      setAnnouncements([]);
    } else {
      setAnnouncements(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  // Soft delete / restore
  const handleDelete = async (announcement) => {
    if (!confirm(`Yakin mau hapus pengumuman "${announcement.judul}"?`)) return;

    const { data, error } = await supabase
      .from("pengumuman")
      .delete()
      .eq("id_pengumuman", announcement.id_pengumuman);

    if (error) {
      console.error("Gagal menghapus pengumuman:", error);
      alert("Gagal menghapus pengumuman.");
      return;
    }

    fetchAnnouncements();
  };

  return (
    <StaffDashboardLayout>
      <div className="p-6 w-full max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-purple-600 mb-6">
          📢 Manajemen Pengumuman
        </h1>

        {/* Form Create/Edit */}
        <AnnouncementForm
          initialData={editingAnnouncement}
          onSuccess={() => {
            setEditingAnnouncement(null);
            fetchAnnouncements();
          }}
          onCancel={() => setEditingAnnouncement(null)}
        />

        {/* Tabel Pengumuman */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mt-8">
          <Table>
            <TableHeader className="bg-gray-100">
              <TableRow>
                <TableHead className="w-[50px]">ID</TableHead>
                <TableHead>Judul</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Tgl Mulai</TableHead>
                <TableHead>Tgl Selesai</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center w-[150px]">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6">
                    Memuat pengumuman...
                  </TableCell>
                </TableRow>
              ) : announcements.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-gray-500 py-6"
                  >
                    Belum ada pengumuman.
                  </TableCell>
                </TableRow>
              ) : (
                announcements.map((ann) => (
                  <TableRow
                    key={ann.id_pengumuman}
                    className={
                      !ann.status
                        ? "bg-red-50/50"
                        : editingAnnouncement?.id_pengumuman ===
                            ann.id_pengumuman
                          ? "bg-yellow-50/70"
                          : ""
                    }
                  >
                    <TableCell className="font-medium">
                      {ann.id_pengumuman}
                    </TableCell>
                    <TableCell>{ann.judul}</TableCell>
                    <TableCell>{ann.tipe}</TableCell>
                    <TableCell>
                      {new Date(ann.tgl_mulai).toLocaleDateString("id-ID")}
                    </TableCell>
                    <TableCell>
                      {new Date(ann.tgl_selesai).toLocaleDateString("id-ID")}
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          ann.status
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {ann.status ? "Aktif" : "Nonaktif"}
                      </span>
                    </TableCell>
                    <TableCell className="space-x-2 flex justify-center">
                      {/* Edit */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingAnnouncement(ann)}
                        disabled={
                          editingAnnouncement !== null &&
                          editingAnnouncement.id_pengumuman !==
                            ann.id_pengumuman
                        }
                      >
                        <Edit className="h-4 w-4" />
                      </Button>

                      {/* Archive/Restore */}
                      <Button
                        size="sm"
                        variant={ann.status ? "destructive" : "success"}
                        onClick={() => handleDelete(ann)}
                        disabled={editingAnnouncement !== null}
                      >
                        {ann.status ? (
                          <TrashIcon className="h-4 w-4" />
                        ) : (
                          <Undo2 className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </StaffDashboardLayout>
  );
}
