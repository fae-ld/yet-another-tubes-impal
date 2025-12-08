"use client";

import DashboardLayout from "@/components/DashboardLayout";
import { useEffect, useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/contexts/UserContext";
import { Minus, Plus, Loader2 } from "lucide-react"; // Import ikon

// Komponen Reusable untuk input stepper (Tombol +/-)
const StepperInput = ({ label, value, onChange, unit }) => {
  const handleIncrement = () => {
    onChange(value + 1);
  };

  const handleDecrement = () => {
    if (value > 1) {
      onChange(value - 1);
    }
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
              // Memungkinkan input kosong sesaat, tapi setidaknya 1
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

export default function ServicesPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();

  const [services, setServices] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const [formData, setFormData] = useState({
    weight: 1, // Default min 1
    quantity: 1, // Default min 1
    address: "",
    estimatedDate: "",
    paymentMethod: "QRIS", // Default ke Prepaid
  });
  const [loading, setLoading] = useState(false);
  const [loadingServices, setLoadingServices] = useState(true);

  const CACHE_KEY = "services_cache";
  const CACHE_TTL = 6000 * 60 * 60; // 6 jam

  // **Memoized: Layanan yang dipilih**
  const selectedService = useMemo(() => {
    return services.find((s) => s.id === selectedServiceId);
  }, [services, selectedServiceId]);

  // **Fungsi Fetch Services**
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
        .order("id_layanan", { ascending: true }); // Pastikan order konsisten

      if (!error && data) {
        const formatted = data.map((item) => ({
          id: item.id_layanan,
          title: item.jenis_layanan,
          harga_per_kg: item.harga_per_kg, // Tambahkan harga asli
          features: item.deskripsi
            ? item.deskripsi.split("|").map((d) => d.trim())
            : [],
          priceDisplay: `Rp${item.harga_per_kg.toLocaleString("id-ID")} / kg`,
        }));

        setServices(formatted);
        if (formatted.length > 0 && selectedServiceId === null) {
          setSelectedServiceId(formatted[0].id); // Set default
        }

        localStorage.setItem(CACHE_KEY, JSON.stringify(formatted));
        localStorage.setItem(`${CACHE_KEY}_time`, Date.now());
      }
      setLoadingServices(false);
    };
    fetchServices();
  }, [selectedServiceId]);

  // **Handler Form Submission**
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (userLoading) {
      alert("Tunggu sebentar... sedang memeriksa status login 🕐");
      return;
    }

    if (!user) {
      alert("Kamu harus login dulu sebelum membuat pesanan!");
      return;
    }

    if (!selectedService) {
      alert("Pilih jenis layanan terlebih dahulu.");
      return;
    }

    // --- Validasi Tanggal ---
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(formData.estimatedDate);
    selected.setHours(0, 0, 0, 0);

    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 7);

    if (selected < today) {
      alert("Tanggal estimasi tidak boleh sebelum hari ini 😅");
      return;
    }

    if (selected > maxDate) {
      alert("Tanggal estimasi maksimal 7 hari dari sekarang ⏰");
      return;
    }

    setLoading(true);

    // --- Perhitungan Biaya ---
    const berat = parseFloat(formData.weight);
    // Kita gunakan harga_per_kg dari selectedService (harga asli numerik)
    const hargaPerKg = selectedService.harga_per_kg;
    const totalBiaya = berat * hargaPerKg;

    // --- Data Pesanan ---
    const newOrder = {
      id_pelanggan: user.id,
      jenis_layanan: selectedService.title,
      estimasi_berat: berat,
      // Total biaya diisi di awal, tapi akan diverifikasi staff
      total_biaya_final: totalBiaya, // Sementara disamakan
      // jumlah_pakaian: parseInt(formData.quantity), // Tambahkan jumlah pakaian
      // alamat_penjemputan: formData.address, // Tambahkan alamat
      jadwal_selesai: formData.estimatedDate
        ? new Date(formData.estimatedDate).toISOString()
        : null,
      // ⚠️ SIMPAN METODE PEMBAYARAN DI SINI
      metode_pembayaran: formData.paymentMethod,
      // Set status pembayaran awal (untuk COD, statusnya tetap Unpaid)
      status_pembayaran: "Pending",
    };

    const { data, error } = await supabase
      .from("pesanan")
      .insert([newOrder])
      .select();

    if (error) {
      console.log(newOrder);
      console.error("❌ Gagal buat pesanan:", error);
      alert("Terjadi kesalahan saat membuat pesanan 😭");
      setLoading(false);
      return;
    }

    const orderId = data[0].id_pesanan;
    if (data.length > 0) {
      // Tambahkan riwayat status 'Pesanan Dibuat' (Step 1)
      const { error: statusErr } = await supabase
        .from("riwayat_status_pesanan")
        .insert({
          id_pesanan: orderId,
          status: "Pesanan Dibuat",
          deskripsi: "Order berhasil dibuat dan masuk sistem.",
          waktu: new Date().toISOString(),
        });
      if (statusErr) console.error("⚠️ Gagal insert riwayat status:", statusErr);

      // Notifikasi
      const { error: notifErr } = await supabase.from("notifikasi").insert({
        id_user: user.id,
        id_pesanan: orderId,
        tipe: "ORDER_CREATED",
        konten:
          "Pesanan Anda berhasil dibuat! Kami akan segera menjemput pakaian Anda.",
      });
      if (notifErr)
        console.error("⚠️ Gagal insert notifikasi (CREATED):", notifErr);
    }

    setLoading(false);

    // Redirect ke halaman detail pesanan
    router.push(`/orders/${orderId}`);
  };

  const getServiceIcon = (title = "") => {
    const lower = title.toLowerCase();
    if (lower.includes("setrika") && lower.includes("cuci")) {
      return "/images/ic-ironwash.png";
    } else if (lower.includes("setrika")) {
      return "/images/ic-ironing.png";
    } else if (lower.includes("cuci")) {
      return "/images/ic-wash.png";
    }
    return "/images/ic-wash.png"; // Fallback
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

        {/* --- Bagian Pemilihan Layanan --- */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-blue-700 mb-4">
            1. Pilih Jenis Layanan Anda
          </h2>
          {services.length === 0 ? (
            <p className="text-blue-500">Belum ada layanan tersedia 😢</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => (
                <div
                  key={service.id}
                  onClick={() => setSelectedServiceId(service.id)}
                  className={`bg-white rounded-2xl p-5 flex flex-col items-center text-center transition-all duration-200 cursor-pointer border-4 ${
                    selectedServiceId === service.id
                      ? "border-blue-500 shadow-xl scale-[1.02]"
                      : "border-gray-200 hover:border-blue-300 hover:shadow-lg"
                  }`}
                >
                  <img
                    src={getServiceIcon(service.title)}
                    alt={service.title}
                    className="w-20 h-20 object-contain mb-3"
                  />
                  <h2 className="text-xl font-bold text-blue-700 mb-2">
                    {service.title}
                  </h2>
                  <ul className="text-blue-600 text-sm space-y-1 mb-4 text-left">
                    {service.features.map((f, idx) => (
                      <li
                        key={idx}
                        className="before:content-['✅'] before:mr-1"
                      >
                        &nbsp;{f}
                      </li>
                    ))}
                  </ul>
                  <span className="font-bold text-blue-700 text-lg">
                    {service.priceDisplay}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* --- Bagian Form Pemesanan (Hanya Tampil jika layanan dipilih) --- */}
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
                {/* Estimasi Berat (Stepper) */}
                <StepperInput
                  label="Estimasi Berat (kg) ⚖️"
                  value={formData.weight}
                  onChange={(val) => setFormData({ ...formData, weight: val })}
                  unit="kg"
                />

                {/* Jumlah Pakaian (Stepper) */}
                <StepperInput
                  label="Jumlah Pakaian (helai) 👕"
                  value={formData.quantity}
                  onChange={(val) =>
                    setFormData({ ...formData, quantity: val })
                  }
                  unit="helai"
                />
              </div>

              {/* Alamat Lengkap */}
              <div className="flex flex-col">
                <label className="text-blue-700 font-medium mb-1">
                  Alamat Lengkap 🏠
                </label>
                <textarea
                  placeholder="Contoh: Jl. Sudirman No. 123, Jakarta"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="border border-blue-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 w-full shadow-sm resize-none"
                  rows={3}
                  required
                />
              </div>

              {/* Estimasi Selesai */}
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
                  min={new Date().toISOString().split("T")[0]}
                  max={(() => {
                    const max = new Date();
                    max.setDate(max.getDate() + 7);
                    return max.toISOString().split("T")[0];
                  })()}
                  className="border border-blue-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 w-full shadow-sm"
                  required
                />
              </div>

              {/* Pilihan Metode Pembayaran */}
              <div className="flex flex-col mt-2">
                <label className="text-blue-700 font-bold mb-3 text-lg">
                  Metode Pembayaran 💳
                </label>
                <div className="flex flex-wrap gap-4">
                  {/* Opsi QRIS (Prepaid) */}
                  <div
                    className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-colors duration-200 ${
                      formData.paymentMethod === "QRIS"
                        ? "border-blue-500 bg-blue-50 shadow-md"
                        : "border-gray-300 hover:bg-gray-50"
                    }`}
                    onClick={() =>
                      setFormData({ ...formData, paymentMethod: "QRIS" })
                    }
                  >
                    <input
                      type="radio"
                      id="payment-prepaid"
                      name="paymentMethod"
                      value="QRIS"
                      checked={formData.paymentMethod === "QRIS"}
                      onChange={() => {}} // Controlled by onClick
                      className="hidden"
                    />
                    <span className="text-2xl mr-2">📱</span>
                    <div>
                      <span className="font-semibold text-blue-800 block">
                        QRIS
                      </span>
                      <span className="text-sm text-gray-600">
                        Pembayaran di awal (via Midtrans)
                      </span>
                    </div>
                  </div>

                  {/* Opsi COD (Cash On Delivery) */}
                  <div
                    className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-colors duration-200 ${
                      formData.paymentMethod === "COD"
                        ? "border-blue-500 bg-blue-50 shadow-md"
                        : "border-gray-300 hover:bg-gray-50"
                    }`}
                    onClick={() =>
                      setFormData({ ...formData, paymentMethod: "COD" })
                    }
                  >
                    <input
                      type="radio"
                      id="payment-cod"
                      name="paymentMethod"
                      value="COD"
                      checked={formData.paymentMethod === "COD"}
                      onChange={() => {}} // Controlled by onClick
                      className="hidden"
                    />
                    <span className="text-2xl mr-2">💰</span>
                    <div>
                      <span className="font-semibold text-blue-800 block">
                        COD (Bayar Tunai)
                      </span>
                      <span className="text-sm text-gray-600">
                        Bayar saat pakaian diantar
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tombol Submit */}
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
