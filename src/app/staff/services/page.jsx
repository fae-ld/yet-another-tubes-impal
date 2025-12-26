"use client";

import { useEffect, useState, useMemo } from "react";
import StaffDashboardLayout from "@/components/staff/StaffDashboardLayout";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/contexts/UserContext";
import { Edit, Archive, Loader2, Undo2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// =========================================================
// UTILITY FUNCTIONS
// =========================================================
const showToast = (title, description, variant = "default") => {
  toast({
    title,
    description,
    variant,
    className: variant === "success" ? "bg-green-500 text-white" : undefined,
  });
};

const prepareServiceData = (formData) => ({
  jenis_layanan: formData.jenis_layanan,
  harga_per_kg: parseFloat(formData.harga_per_kg),
  deskripsi: formData.deskripsi,
});

// =========================================================
// SERVICE OPERATIONS
// =========================================================
const createService = async (data) => {
  return await supabase.from("layanan").insert([data]);
};

const updateService = async (id, data) => {
  return await supabase.from("layanan").update(data).eq("id_layanan", id);
};

const toggleArchiveService = async (serviceId, newStatus) => {
  return await supabase
    .from("layanan")
    .update({ is_archived: newStatus })
    .eq("id_layanan", serviceId);
};

// =========================================================
// CUSTOM HOOKS
// =========================================================
const useServiceForm = (initialData, onSuccess) => {
  const [formData, setFormData] = useState({
    jenis_layanan: "",
    harga_per_kg: "",
    deskripsi: "",
  });
  const [loading, setLoading] = useState(false);

  const isEdit = useMemo(() => !!initialData, [initialData]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        jenis_layanan: initialData.jenis_layanan || "",
        harga_per_kg: String(initialData.harga_per_kg) || "",
        deskripsi: initialData.deskripsi || "",
      });
    } else {
      setFormData({
        jenis_layanan: "",
        harga_per_kg: "",
        deskripsi: "",
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({ jenis_layanan: "", harga_per_kg: "", deskripsi: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const dataToSubmit = prepareServiceData(formData);
    const result = isEdit
      ? await updateService(initialData.id_layanan, dataToSubmit)
      : await createService(dataToSubmit);

    setLoading(false);

    if (result.error) {
      console.error("Error submit layanan:", result.error);
      showToast(
        "Gagal Menyimpan",
        `Terjadi kesalahan: ${result.error.message}`,
        "destructive",
      );
    } else {
      showToast(
        "Berhasil",
        `Layanan berhasil ${isEdit ? "diperbarui" : "dibuat"}.`,
        "success",
      );
      onSuccess();
      if (!isEdit) resetForm();
    }
  };

  return {
    formData,
    loading,
    isEdit,
    handleChange,
    handleSubmit,
  };
};

const useServices = (userLoading) => {
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchServices = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("layanan")
      .select("*")
      .order("id_layanan", { ascending: false });

    if (error) {
      console.error("Error fetching services:", error);
      showToast("Gagal memuat", "Gagal memuat daftar layanan.", "destructive");
      setServices([]);
    } else {
      setServices(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (!userLoading) {
      fetchServices();
    }
  }, [userLoading]);

  return { services, isLoading, fetchServices };
};

// =========================================================
// COMPONENTS
// =========================================================
const ServiceForm = ({ initialData, onCancel, onSuccess }) => {
  const { formData, loading, isEdit, handleChange, handleSubmit } =
    useServiceForm(initialData, onSuccess);

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-purple-100 mb-8">
      <div className="flex justify-between items-center mb-4 border-b pb-3">
        <h2 className="text-xl font-bold text-purple-700">
          {isEdit ? "Edit Layanan" : "Buat Layanan Baru"}
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
        <Input
          name="jenis_layanan"
          placeholder="Nama Layanan (Contoh: Cuci Kering)"
          value={formData.jenis_layanan}
          onChange={handleChange}
          required
          className="col-span-1 md:col-span-1"
        />
        <Input
          name="harga_per_kg"
          type="number"
          step="any"
          min="1"
          placeholder="Harga/Kg (Rp)"
          value={formData.harga_per_kg}
          onChange={handleChange}
          required
        />
        <Textarea
          name="deskripsi"
          placeholder="Deskripsi singkat (pisahkan fitur dengan |)"
          value={formData.deskripsi}
          onChange={handleChange}
          className="col-span-1 md:col-span-3"
          rows={1}
        />
        <div className="md:col-span-4 flex justify-end">
          <Button
            type="submit"
            disabled={loading}
            className="min-w-[150px] bg-purple-600 hover:bg-purple-700"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : isEdit ? (
              "Simpan Perubahan"
            ) : (
              "Tambah Layanan"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

const ServiceStatusBadge = ({ isArchived }) => (
  <span
    className={`px-3 py-1 text-xs font-semibold rounded-full ${
      isArchived ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
    }`}
  >
    {isArchived ? "Diarsipkan" : "Aktif"}
  </span>
);

const ServiceActionButtons = ({
  service,
  editingService,
  onEdit,
  onArchive,
}) => {
  const isDisabled =
    editingService !== null && editingService.id_layanan !== service.id_layanan;
  const isArchived = service.is_archived;

  return (
    <div className="space-x-2 flex justify-center">
      <Button
        size="sm"
        variant="outline"
        onClick={() => onEdit(service)}
        title="Edit Layanan"
        disabled={isDisabled}
      >
        <Edit className="h-4 w-4" />
      </Button>

      <Button
        size="sm"
        variant={isArchived ? "success" : "destructive"}
        onClick={() => onArchive(service)}
        title={isArchived ? "Pulihkan Layanan" : "Arsipkan Layanan"}
        disabled={editingService !== null}
      >
        {isArchived ? (
          <Undo2 className="h-4 w-4" />
        ) : (
          <Archive className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
};

const getRowClassName = (service, editingService) => {
  if (service.is_archived) return "bg-red-50/50";
  if (editingService?.id_layanan === service.id_layanan)
    return "bg-yellow-50/70";
  return "";
};

const ServiceTableRow = ({ service, editingService, onEdit, onArchive }) => (
  <TableRow className={getRowClassName(service, editingService)}>
    <TableCell className="font-medium">{service.id_layanan}</TableCell>
    <TableCell>{service.jenis_layanan}</TableCell>
    <TableCell>Rp{service.harga_per_kg.toLocaleString("id-ID")}</TableCell>
    <TableCell className="text-sm text-gray-600">
      {service.deskripsi?.split("|").slice(0, 1).join("") || "-"}
    </TableCell>
    <TableCell className="text-center">
      <ServiceStatusBadge isArchived={service.is_archived} />
    </TableCell>
    <TableCell>
      <ServiceActionButtons
        service={service}
        editingService={editingService}
        onEdit={onEdit}
        onArchive={onArchive}
      />
    </TableCell>
  </TableRow>
);

const ServicesTable = ({ services, editingService, onEdit, onArchive }) => (
  <div className="bg-white rounded-xl shadow-lg overflow-hidden mt-8">
    <Table>
      <TableHeader className="bg-gray-100">
        <TableRow>
          <TableHead className="w-[50px]">ID</TableHead>
          <TableHead>Nama Layanan</TableHead>
          <TableHead>Harga/Kg</TableHead>
          <TableHead>Deskripsi</TableHead>
          <TableHead className="text-center">Status</TableHead>
          <TableHead className="text-center w-[150px]">Aksi</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {services.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="h-24 text-center text-gray-500">
              Belum ada data layanan.
            </TableCell>
          </TableRow>
        ) : (
          services.map((service) => (
            <ServiceTableRow
              key={service.id_layanan}
              service={service}
              editingService={editingService}
              onEdit={onEdit}
              onArchive={onArchive}
            />
          ))
        )}
      </TableBody>
    </Table>
  </div>
);

// =========================================================
// MAIN COMPONENT
// =========================================================
export default function StaffServicesPage() {
  const { user, loading: userLoading } = useUser();
  const { services, isLoading, fetchServices } = useServices(userLoading);
  const [editingService, setEditingService] = useState(null);

  const handleArchive = async (service) => {
    const newArchivedStatus = !service.is_archived;
    const action = newArchivedStatus ? "Arsipkan" : "Pulihkan";

    const { error } = await toggleArchiveService(
      service.id_layanan,
      newArchivedStatus,
    );

    if (error) {
      console.error(`Error ${action} layanan:`, error);
      showToast(
        "Gagal",
        `Gagal ${action} layanan: ${error.message}`,
        "destructive",
      );
    } else {
      showToast(
        "Berhasil",
        `Layanan ${service.jenis_layanan} berhasil di${newArchivedStatus ? "arsip" : "pulihkan"}.`,
        "success",
      );
      fetchServices();
    }
  };

  if (userLoading || isLoading) {
    return (
      <StaffDashboardLayout>
        <div className="p-10 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
          <p className="ml-3 text-purple-600">Memuat data...</p>
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
        <h1 className="text-3xl font-bold text-purple-600 mb-6">
          🧺 Manajemen Layanan
        </h1>

        <ServiceForm
          initialData={editingService}
          onSuccess={() => {
            setEditingService(null);
            fetchServices();
          }}
          onCancel={() => setEditingService(null)}
        />

        <ServicesTable
          services={services}
          editingService={editingService}
          onEdit={setEditingService}
          onArchive={handleArchive}
        />
      </div>
    </StaffDashboardLayout>
  );
}
