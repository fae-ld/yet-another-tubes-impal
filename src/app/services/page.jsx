"use client";

import DashboardLayout from "@/components/DashboardLayout";
import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/contexts/UserContext";
import { Minus, Plus, Loader2 } from "lucide-react";

// =========================================================
// CONSTANTS
// =========================================================
const CACHE_KEY = "services_cache";
const CACHE_TTL = 6000 * 60 * 60; // 6 jam
const MAX_DAYS_AHEAD = 7;

// =========================================================
// UTILITY FUNCTIONS
// =========================================================
const getServiceIcon = (title = "") => {
  const lower = title.toLowerCase();
  if (lower.includes("setrika") && lower.includes("cuci")) {
    return "/images/ic-ironwash.png";
  }
  if (lower.includes("setrika")) {
    return "/images/ic-ironing.png";
  }
  if (lower.includes("cuci")) {
    return "/images/ic-wash.png";
  }
  return "/images/ic-wash.png";
};

const formatServiceData = (data) => {
  return data.map((item) => ({
    id: item.id_layanan,
    title: item.jenis_layanan,
    harga_per_kg: item.harga_per_kg,
    features: item.deskripsi
      ? item.deskripsi.split("|").map((d) => d.trim())
      : [],
    priceDisplay: `Rp${item.harga_per_kg.toLocaleString("id-ID")} / kg`,
  }));
};

const getMaxDate = () => {
  const max = new Date();
  max.setDate(max.getDate() + MAX_DAYS_AHEAD);
  return max.toISOString().split("T")[0];
};

const getTodayDate = () => {
  return new Date().toISOString().split("T")[0];
};

// =========================================================
// VALIDATION FUNCTIONS
// =========================================================
const validateDateRange = (dateString) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selected = new Date(dateString);
  selected.setHours(0, 0, 0, 0);

  if (selected < today) {
    return {
      valid: false,
      message: "Tanggal estimasi tidak boleh sebelum hari ini 😅",
    };
  }

  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + MAX_DAYS_AHEAD);

  if (selected > maxDate) {
    return {
      valid: false,
      message: `Tanggal estimasi maksimal ${MAX_DAYS_AHEAD} hari dari sekarang ⏰`,
    };
  }

  return { valid: true };
};

const validateOrderSubmission = (userLoading, user, selectedService) => {
  if (userLoading) {
    return {
      valid: false,
      message: "Tunggu sebentar... sedang memeriksa status login 🕐",
    };
  }
  if (!user) {
    return {
      valid: false,
      message: "Kamu harus login dulu sebelum membuat pesanan!",
    };
  }
  if (!selectedService) {
    return { valid: false, message: "Pilih jenis layanan terlebih dahulu." };
  }
  return { valid: true };
};

// =========================================================
// CUSTOM HOOKS
// =========================================================
const useServices = (selectedServiceId) => {
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      setLoadingServices(true);

      const cached = localStorage.getItem(CACHE_KEY);
      const cachedTime = localStorage.getItem(`${CACHE_KEY}_time`);

      if (cached && cachedTime && Date.now() - cachedTime < CACHE_TTL) {
        const cachedData = JSON.parse(cached);
        setServices(cachedData);
        setLoadingServices(false);
        return;
      }

      const { data, error } = await supabase
        .from("layanan")
        .select("*")
        .eq("is_archived", false)
        .order("id_layanan", { ascending: true });

      if (!error && data) {
        const formatted = formatServiceData(data);
        setServices(formatted);

        localStorage.setItem(CACHE_KEY, JSON.stringify(formatted));
        localStorage.setItem(`${CACHE_KEY}_time`, Date.now());
      }
      setLoadingServices(false);
    };

    fetchServices();
  }, [selectedServiceId]);

  return { services, loadingServices };
};

const useUserAddress = (user) => {
  const [alamatUser, setAlamatUser] = useState(null);

  useEffect(() => {
    if (!user) return;

    const fetchPelanggan = async () => {
      const { data, error } = await supabase
        .from("pelanggan")
        .select("alamat")
        .eq("id_pelanggan", user.id)
        .single();

      if (!error && data) {
        setAlamatUser(data.alamat || "");
      }
    };

    fetchPelanggan();
  }, [user]);

  return alamatUser;
};

// =========================================================
// ORDER CREATION
// =========================================================
const createOrderInDatabase = async (orderData) => {
  const { data, error } = await supabase
    .from("pesanan")
    .insert([orderData])
    .select();

  if (error) {
    console.error("❌ Gagal buat pesanan:", error);
    throw new Error("Terjadi kesalahan saat membuat pesanan");
  }

  return data[0];
};

const createOrderHistory = async (orderId) => {
  await supabase.from("riwayat_status_pesanan").insert({
    id_pesanan: orderId,
    status: "Pesanan Dibuat",
    deskripsi: "Order berhasil dibuat dan masuk sistem.",
    waktu: new Date().toISOString(),
  });
};

const createOrderNotification = async (userId, orderId) => {
  await supabase.from("notifikasi").insert({
    id_user: userId,
    id_pesanan: orderId,
    tipe: "ORDER_CREATED",
    konten:
      "Pesanan Anda berhasil dibuat! Kami akan segera menjemput pakaian Anda.",
  });
};

// =========================================================
// COMPONENTS
// =========================================================
const StepperInput = ({ label, value, onChange, unit }) => {
  const handleIncrement = () => onChange(value + 1);
  const handleDecrement = () => {
    if (value > 1) onChange(value - 1);
  };

  return (
    <div className="flex flex-col">
      <label className="text-blue-700 font-medium mb-1">{label}</label>
      <div className="flex items-center border border-blue-200 rounded-lg w-full overflow-hidden shadow-sm">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={value <= 1}
          className={`p-3 bg-blue-100 transition-colors duration-150 ${
            value <= 1 ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-200"
          }`}
        >
          <Minus size={18} />
        </button>
        <input
          type="number"
          value={value}
          onChange={(e) => {
            const val = parseInt(e.target.value);
            if (!isNaN(val) && val >= 1) {
              onChange(val);
            } else if (e.target.value === "") {
              onChange(1);
            }
          }}
          className="flex-grow text-center font-semibold text-xl focus:outline-none focus:ring-0 appearance-none border-x border-blue-200 py-3"
          required
          min={1}
        />
        <button
          type="button"
          onClick={handleIncrement}
          className="p-3 bg-blue-100 hover:bg-blue-200 transition-colors duration-150"
        >
          <Plus size={18} />
        </button>
        {unit && <span className="p-3 text-sm text-gray-500">{unit}</span>}
      </div>
    </div>
  );
};

const ServiceCard = ({ service, isSelected, onSelect }) => (
  <div
    onClick={() => onSelect(service.id)}
    className={`bg-white rounded-2xl p-5 flex flex-col items-center text-center transition-all duration-200 cursor-pointer border-4 ${
      isSelected
        ? "border-blue-500 shadow-xl scale-[1.02]"
        : "border-gray-200 hover:border-blue-300 hover:shadow-lg"
    }`}
  >
    <img
      src={getServiceIcon(service.title)}
      alt={service.title}
      className="w-20 h-20 object-contain mb-3"
    />
    <h2 className="text-xl font-bold text-blue-700 mb-2">{service.title}</h2>
    <ul className="text-blue-600 text-sm space-y-1 mb-4 text-left">
      {service.features.map((f, idx) => (
        <li key={idx} className="before:content-['✅'] before:mr-1">
          &nbsp;{f}
        </li>
      ))}
    </ul>
    <span className="font-bold text-blue-700 text-lg">
      {service.priceDisplay}
    </span>
  </div>
);

const AddressField = ({
  formData,
  setFormData,
  useMyAddress,
  setUseMyAddress,
  alamatUser,
}) => {
  const handleCheckboxChange = (isChecked) => {
    if (isChecked && (!alamatUser || alamatUser.trim() === "")) {
      alert(
        "⚠️ Alamat Anda di profil (alamatUser) masih kosong. Mohon isi dulu di halaman Settings jika ingin menggunakan fitur 'Pake alamat saya'.",
      );
      setUseMyAddress(false);
      return;
    }

    setUseMyAddress(isChecked);
    setFormData({
      ...formData,
      address: isChecked ? alamatUser : "",
    });
  };

  const isAddressEmpty = !alamatUser || alamatUser.trim() === "";

  return (
    <div className="flex flex-col">
      <div className="flex items-center mb-3">
        <input
          type="checkbox"
          id="useMyAddressCheckbox"
          checked={useMyAddress}
          onChange={(e) => handleCheckboxChange(e.target.checked)}
          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
        />
        <label
          htmlFor="useMyAddressCheckbox"
          className="ml-2 text-blue-700 font-medium cursor-pointer"
        >
          Pake alamat saya
        </label>
      </div>

      <label className="text-blue-700 font-medium mb-1">
        Alamat Lengkap 🏠
      </label>
      <textarea
        placeholder="Contoh: Jl. Sudirman No. 123, Jakarta"
        value={formData.address}
        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
        className={`border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 w-full shadow-sm resize-none ${
          useMyAddress
            ? "border-gray-300 bg-gray-50 text-gray-500"
            : "border-blue-200 focus:ring-blue-400"
        }`}
        rows={3}
        disabled={useMyAddress}
        required
      />

      {useMyAddress && (
        <p className="text-xs text-green-600 mt-1 italic">
          Alamat diambil dari profil (`alamatUser`). Lepas centang untuk input
          alamat lain.
        </p>
      )}
      {isAddressEmpty && (
        <p className="text-xs text-orange-500 mt-1 font-semibold">
          💡 Alamat profil Anda masih kosong. Isi alamat manual atau update di
          Settings.
        </p>
      )}
    </div>
  );
};

const PaymentMethodSelector = ({ selectedMethod, onChange }) => {
  const methods = [
    {
      value: "QRIS",
      icon: "📱",
      title: "QRIS",
      description: "Pembayaran di awal (via Midtrans)",
    },
    {
      value: "COD",
      icon: "💰",
      title: "COD (Bayar Tunai)",
      description: "Bayar saat pakaian diantar",
    },
  ];

  return (
    <div className="flex flex-col mt-2">
      <label className="text-blue-700 font-bold mb-3 text-lg">
        Metode Pembayaran 💳
      </label>
      <div className="flex flex-wrap gap-4">
        {methods.map((method) => (
          <div
            key={method.value}
            className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-colors duration-200 ${
              selectedMethod === method.value
                ? "border-blue-500 bg-blue-50 shadow-md"
                : "border-gray-300 hover:bg-gray-50"
            }`}
            onClick={() => onChange(method.value)}
          >
            <input
              type="radio"
              name="paymentMethod"
              value={method.value}
              checked={selectedMethod === method.value}
              onChange={() => {}}
              className="hidden"
            />
            <span className="text-2xl mr-2">{method.icon}</span>
            <div>
              <span className="font-semibold text-blue-800 block">
                {method.title}
              </span>
              <span className="text-sm text-gray-600">
                {method.description}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// =========================================================
// MAIN COMPONENT
// =========================================================
export default function ServicesPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();

  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const [formData, setFormData] = useState({
    weight: 1,
    quantity: 1,
    address: "",
    estimatedDate: "",
    paymentMethod: "QRIS",
  });
  const [loading, setLoading] = useState(false);
  const [useMyAddress, setUseMyAddress] = useState(false);

  const { services, loadingServices } = useServices(selectedServiceId);
  const alamatUser = useUserAddress(user);

  const selectedService = useMemo(() => {
    return services.find((s) => s.id === selectedServiceId);
  }, [services, selectedServiceId]);

  useEffect(() => {
    if (services.length > 0 && selectedServiceId === null) {
      setSelectedServiceId(services[0].id);
    }
  }, [services, selectedServiceId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validation = validateOrderSubmission(
      userLoading,
      user,
      selectedService,
    );
    if (!validation.valid) {
      alert(validation.message);
      return;
    }

    const dateValidation = validateDateRange(formData.estimatedDate);
    if (!dateValidation.valid) {
      alert(dateValidation.message);
      return;
    }

    setLoading(true);

    try {
      const berat = parseFloat(formData.weight);
      const totalBiaya = berat * selectedService.harga_per_kg;

      const newOrder = {
        id_pelanggan: user.id,
        id_layanan: selectedService.id,
        estimasi_berat: berat,
        total_biaya_final: totalBiaya,
        jadwal_selesai: new Date(formData.estimatedDate).toISOString(),
        metode_pembayaran: formData.paymentMethod,
        status_pembayaran: "Pending",
      };

      const createdOrder = await createOrderInDatabase(newOrder);
      await createOrderHistory(createdOrder.id_pesanan);
      await createOrderNotification(user.id, createdOrder.id_pesanan);

      router.push(`/orders/${createdOrder.id_pesanan}`);
    } catch (error) {
      alert(error.message || "Terjadi kesalahan saat membuat pesanan 😭");
    } finally {
      setLoading(false);
    }
  };

  if (loadingServices) {
    return (
      <DashboardLayout>
        <div className="p-10 flex flex-col items-center justify-center">
          <Loader2 className="h-16 w-16 text-blue-500 animate-spin mb-4" />
          <p className="text-blue-700 font-medium">Memuat layanan...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-blue-600 mb-6">
          Pilih Layanan & Buat Pesanan
        </h1>

        <div className="mb-8">
          <h2 className="text-xl font-semibold text-blue-700 mb-4">
            1. Pilih Jenis Layanan Anda
          </h2>
          {services.length === 0 ? (
            <p className="text-blue-500">Belum ada layanan tersedia 😢</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  isSelected={selectedServiceId === service.id}
                  onSelect={setSelectedServiceId}
                />
              ))}
            </div>
          )}
        </div>

        {selectedService && (
          <div className="bg-white p-6 md:p-10 rounded-2xl shadow-2xl border border-blue-100">
            <h2 className="text-2xl font-bold text-blue-700 mb-6 border-b pb-4">
              2. Detail Pesanan untuk {selectedService.title} 🧺
            </h2>

            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-6 w-full"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <StepperInput
                  label="Estimasi Berat (kg) ⚖️"
                  value={formData.weight}
                  onChange={(val) => setFormData({ ...formData, weight: val })}
                  unit="kg"
                />
                <StepperInput
                  label="Jumlah Pakaian (helai) 👕"
                  value={formData.quantity}
                  onChange={(val) =>
                    setFormData({ ...formData, quantity: val })
                  }
                  unit="helai"
                />
              </div>

              <AddressField
                formData={formData}
                setFormData={setFormData}
                useMyAddress={useMyAddress}
                setUseMyAddress={setUseMyAddress}
                alamatUser={alamatUser}
              />

              <div className="flex flex-col">
                <label className="text-blue-700 font-medium mb-1">
                  Estimasi Selesai 📅
                </label>
                <input
                  type="date"
                  value={formData.estimatedDate}
                  onChange={(e) =>
                    setFormData({ ...formData, estimatedDate: e.target.value })
                  }
                  min={getTodayDate()}
                  max={getMaxDate()}
                  className="border border-blue-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 w-full shadow-sm"
                  required
                />
              </div>

              <PaymentMethodSelector
                selectedMethod={formData.paymentMethod}
                onChange={(method) =>
                  setFormData({ ...formData, paymentMethod: method })
                }
              />

              <div className="flex justify-end mt-6">
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 text-white hover:bg-blue-700 rounded-lg px-8 py-3 text-lg font-semibold shadow-xl transition-all duration-200 min-w-[200px]"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Memproses...
                    </div>
                  ) : (
                    "Buat Pesanan Sekarang!"
                  )}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
