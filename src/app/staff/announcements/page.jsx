"use client";

import { useEffect, useState, useMemo } from "react";
import StaffDashboardLayout from "@/components/staff/StaffDashboardLayout";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/contexts/UserContext";
import { Plus, Edit, X, Loader2, Calendar, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format, isBefore, isAfter, isToday } from "date-fns";
import { id } from "date-fns/locale"; // Untuk format tanggal Indonesia
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils"; // Utilitas Tailwind
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// --- Komponen Form Pengumuman (Create/Edit Inline) ---
const AnnouncementForm = ({ initialData, onCancel, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    start_date: undefined,
    end_date: undefined,
    status: "Published", // Default status langsung Published
  });
  const [loading, setLoading] = useState(false);

  const isEdit = useMemo(() => !!initialData, [initialData]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || "",
        content: initialData.content || "",
        start_date: initialData.start_date
          ? new Date(initialData.start_date)
          : undefined,
        end_date: initialData.end_date
          ? new Date(initialData.end_date)
          : undefined,
        status: initialData.status || "Published",
      });
    } else {
      setFormData({
        title: "",
        content: "",
        start_date: undefined,
        end_date: undefined,
        status: "Published",
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { title, content, start_date, end_date } = formData;

    // Alternate Flow: Validasi
    if (!title || !content || !start_date || !end_date) {
      toast({
        title: "Gagal Publikasi",
        description: "Semua kolom (termasuk tanggal) wajib diisi.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    if (isBefore(end_date, start_date)) {
      toast({
        title: "Gagal Publikasi",
        description: "Tanggal selesai harus setelah Tanggal mulai.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const dataToSubmit = {
      title,
      content,
      start_date: format(start_date, "yyyy-MM-dd"),
      end_date: format(end_date, "yyyy-MM-dd"),
      status: "Published", // Untuk MVP, selalu publish
    };

    let result;

    if (isEdit) {
      // Edit / Update
      result = await supabase
        .from("announcement")
        .update(dataToSubmit)
        .eq("id", initialData.id);
    } else {
      // Create / Insert
      result = await supabase.from("announcement").insert([dataToSubmit]);
    }

    setLoading(false);

    if (result.error) {
      console.error("Error submit pengumuman:", result.error);
      toast({
        title: "Gagal Menyimpan",
        description: `Terjadi kesalahan: ${result.error.message}`,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Berhasil",
        description: `Pengumuman berhasil ${isEdit ? "diperbarui" : "diterbitkan"}.`,
        className: "bg-green-500 text-white",
      });
      onSuccess();
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-red-100 mb-8">
      <div className="flex justify-between items-center mb-4 border-b pb-3">
        <h2 className="text-xl font-bold text-red-700">
          {isEdit ? "Edit Pengumuman" : "Buat Pengumuman Baru"}
        </h2>
        {isEdit && (
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4 mr-1" /> Batal Edit
          </Button>
        )}
      </div>
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        {/* Input Judul */}
        <Input
          name="title"
          placeholder="Judul Pengumuman/Promosi"
          value={formData.title}
          onChange={handleChange}
          required
          className="col-span-full"
        />

        {/* Input Isi Promosi/Informasi */}
        <Textarea
          name="content"
          placeholder="Isi Promosi/Informasi selengkapnya..."
          value={formData.content}
          onChange={handleChange}
          required
          className="col-span-full md:col-span-4"
          rows={2}
        />

        {/* Date Pickers */}
        <div className="flex space-x-4 col-span-full md:col-span-3">
          {/* Start Date */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.start_date && "text-muted-foreground",
                )}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {formData.start_date ? (
                  format(formData.start_date, "PPP", { locale: id })
                ) : (
                  <span>Tanggal Mulai Aktif</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={formData.start_date}
                onSelect={(date) =>
                  setFormData((prev) => ({ ...prev, start_date: date }))
                }
                initialFocus
                locale={id}
              />
            </PopoverContent>
          </Popover>

          {/* End Date */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.end_date && "text-muted-foreground",
                )}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {formData.end_date ? (
                  format(formData.end_date, "PPP", { locale: id })
                ) : (
                  <span>Tanggal Selesai Aktif</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={formData.end_date}
                onSelect={(date) =>
                  setFormData((prev) => ({ ...prev, end_date: date }))
                }
                initialFocus
                locale={id}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Tombol Submit */}
        <div className="md:col-span-1 flex justify-end">
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : isEdit ? (
              "Simpan & Terbitkan Ulang"
            ) : (
              "Terbitkan Pengumuman"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

// --- Komponen Utama Halaman Pengumuman ---
export default function StaffAnnouncementsPage() {
  const { user, loading: userLoading } = useUser();

  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);

  const fetchAnnouncements = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("announcement")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching announcements:", error);
      toast({
        title: "Gagal memuat",
        description: "Gagal memuat daftar pengumuman.",
        variant: "destructive",
      });
      setAnnouncements([]);
    } else {
      setAnnouncements(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (!userLoading) {
      fetchAnnouncements();
    }
  }, [userLoading]);

  // Fungsi untuk menentukan status aktif (Berlaku/Belum/Kadaluarsa)
  const getStatus = (announcement) => {
    const today = new Date();
    const start = new Date(announcement.start_date);
    const end = new Date(announcement.end_date);

    // Perlu diset jamnya agar perbandingan lebih akurat
    today.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999); // Akhir hari terakhir

    if (isAfter(today, end)) {
      return { label: "Kadaluarsa", className: "bg-gray-100 text-gray-600" };
    }
    if (isBefore(today, start)) {
      return { label: "Akan Datang", className: "bg-blue-100 text-blue-700" };
    }
    // isToday(start) || (isAfter(today, start) && isBefore(today, end))
    return { label: "Berlaku", className: "bg-green-100 text-green-700" };
  };

  const handleDelete = async (announcement) => {
    if (
      !window.confirm(
        `Yakin ingin menghapus pengumuman: "${announcement.title}"?`,
      )
    ) {
      return;
    }

    const { error } = await supabase
      .from("announcement")
      .delete()
      .eq("id", announcement.id);

    if (error) {
      toast({
        title: "Gagal",
        description: `Gagal menghapus pengumuman: ${error.message}`,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Berhasil",
        description: "Pengumuman berhasil dihapus.",
        className: "bg-green-500 text-white",
      });
      fetchAnnouncements();
    }
  };

  if (userLoading || isLoading) {
    return (
      <StaffDashboardLayout>
        <div className="p-10 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-red-500" />
          <p className="ml-3 text-red-600">Memuat data...</p>
        </div>
      </StaffDashboardLayout>
    );
  }

  if (!user) {
    return <div className="p-10 text-center text-red-500">Akses Ditolak</div>;
  }

  return (
    <StaffDashboardLayout>
      <div className="p-6 w-full max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-red-600 mb-6">
          📢 Kelola Pengumuman & Promosi
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

        {/* Tabel Daftar Pengumuman */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mt-8">
          <Table>
            <TableHeader className="bg-gray-100">
              <TableRow>
                <TableHead>Judul</TableHead>
                <TableHead className="w-[100px] text-center">Status</TableHead>
                <TableHead className="w-[150px] text-center">
                  Mulai Aktif
                </TableHead>
                <TableHead className="w-[150px] text-center">
                  Selesai Aktif
                </TableHead>
                <TableHead className="w-[100px] text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {announcements.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-gray-500"
                  >
                    Belum ada pengumuman yang diterbitkan.
                  </TableCell>
                </TableRow>
              ) : (
                announcements.map((announcement) => {
                  const status = getStatus(announcement);
                  return (
                    <TableRow
                      key={announcement.id}
                      className={
                        status.label === "Kadaluarsa"
                          ? "bg-gray-50"
                          : editingAnnouncement?.id === announcement.id
                            ? "bg-yellow-50/70"
                            : ""
                      }
                    >
                      <TableCell className="font-medium">
                        {announcement.title}
                        <p className="text-xs text-gray-500 truncate mt-1">
                          {announcement.content}
                        </p>
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={`px-3 py-1 text-xs font-semibold rounded-full ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        {format(
                          new Date(announcement.start_date),
                          "dd MMM yyyy",
                          { locale: id },
                        )}
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        {format(
                          new Date(announcement.end_date),
                          "dd MMM yyyy",
                          { locale: id },
                        )}
                      </TableCell>
                      <TableCell className="space-x-2 flex justify-center">
                        {/* Tombol Edit */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingAnnouncement(announcement)}
                          title="Edit Pengumuman"
                          disabled={
                            editingAnnouncement !== null &&
                            editingAnnouncement.id !== announcement.id
                          }
                        >
                          <Edit className="h-4 w-4" />
                        </Button>

                        {/* Tombol Hapus */}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(announcement)}
                          title="Hapus Pengumuman Permanen"
                          disabled={editingAnnouncement !== null}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </StaffDashboardLayout>
  );
}
