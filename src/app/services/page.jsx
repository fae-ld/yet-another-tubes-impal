"use client";

import DashboardLayout from "@/components/DashboardLayout";
import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/contexts/UserContext";

export default function ServicesPage() {
  const { user, loading: userLoading } = useUser();

  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [formData, setFormData] = useState({
    weight: "",
    quantity: "",
    address: "",
    estimatedDate: "",
  });
  const [loading, setLoading] = useState(false);
  const [loadingRedirect, setLoadingRedirect] = useState(false);
  const [loadingServices, setLoadingServices] = useState(true);
  const router = useRouter();

  const CACHE_KEY = "services_cache";
  const CACHE_TTL = 6000 * 60 * 60; // 6 jam

  useEffect(() => {
    const fetchServices = async () => {
      setLoadingServices(true);

      const cached = localStorage.getItem(CACHE_KEY);
      const cachedTime = localStorage.getItem(`${CACHE_KEY}_time`);

      if (cached && cachedTime && Date.now() - cachedTime < CACHE_TTL) {
        setServices(JSON.parse(cached));
        setLoadingServices(false);
        return;
      }

      const { data, error } = await supabase.from("layanan").select("*");

      if (!error && data) {
        const formatted = data.map((item) => ({
          id: item.id,
          title: item.jenis_layanan,
          features: item.deskripsi
            ? item.deskripsi.split("|").map((d) => d.trim())
            : [],
          price: `Rp${item.harga_per_kg.toLocaleString("id-ID")} / kg`,
        }));

        setServices(formatted);
        localStorage.setItem(CACHE_KEY, JSON.stringify(formatted));
        localStorage.setItem(`${CACHE_KEY}_time`, Date.now());
        console.log("Cached services data");
      }

      setLoadingServices(false);
    };

    fetchServices();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Kalau context user masih loading, tahan dulu
    if (userLoading) {
      alert("Tunggu sebentar... sedang memeriksa status login 🕐");
      return;
    }

    // Kalau user belum login
    if (!user) {
      alert("Kamu harus login dulu sebelum membuat pesanan!");
      return;
    }

    // Validasiii tanggal
    const today = new Date();
    today.setHours(0, 0, 0, 0); // hapus jam
    const selected = new Date(formData.estimatedDate);
    selected.setHours(0, 0, 0, 0);

    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 7); // TODO: maksimum 7 hari ke depan?

    if (selected < today) {
      alert("Tanggal estimasi tidak boleh sebelum hari ini 😅");
      return;
    }

    if (selected > maxDate) {
      alert("Tanggal estimasi maksimal 7 hari dari sekarang ⏰");
      return;
    }

    setLoading(true);

    // Ambil harga dari service
    const berat = parseFloat(formData.weight);
    const hargaPerKg = parseFloat(selectedService.price.replace(/[^\d]/g, ""));
    const totalBiaya = berat * hargaPerKg;

    const newOrder = {
      id_pelanggan: user.id, // user.id dari Supabase auth
      jenis_layanan: selectedService.title,
      estimasi_berat: berat,
      total_biaya_final: totalBiaya,
      jadwal_selesai: formData.estimatedDate
        ? new Date(formData.estimatedDate).toISOString()
        : null,
    };

    const { data, error } = await supabase
      .from("pesanan")
      .insert([newOrder])
      .select();

    if (error) {
      console.error("❌ Gagal buat pesanan:", error);
      alert("Terjadi kesalahan saat membuat pesanan 😭");
      setLoading(false);
      return;
    }

    setLoading(false);
    setLoadingRedirect(true);

    setTimeout(() => {
      setSelectedService(null);
      setFormData({
        weight: "",
        quantity: "",
        address: "",
        estimatedDate: "",
      });
      router.push(`/orders/${data[0].id_pesanan}`);
    }, 2000);
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
    // TODO: Default fallback?
  };

  if (loadingServices) {
    return (
      <DashboardLayout>
        <div className="p-10 flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-b-4 border-blue-200 mb-4"></div>
          <p className="text-blue-700 font-medium">Memuat layanan...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-3xl font-bold text-blue-600 mb-6">Services</h1>

        {services.length === 0 ? (
          <p className="text-blue-500">Belum ada layanan tersedia 😢</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <Dialog.Root key={service.id}>
                <Dialog.Trigger asChild>
                  <div
                    onClick={() => setSelectedService(service)}
                    className="bg-white rounded-2xl p-5 flex flex-col items-center text-center hover:scale-[0.98] hover:shadow-lg transition-transform duration-200 cursor-pointer border-2 hover:border-blue-500"
                  >
                    <img
                      src={getServiceIcon(service.title)}
                      alt={service.title}
                      className="w-24 h-24 object-contain mb-4"
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
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-blue-700 text-lg">
                        {service.price}
                      </span>
                      <Button className="bg-blue-500 text-white hover:bg-blue-600 rounded-full px-4 py-1 shadow-md">
                        Pilih
                      </Button>
                    </div>
                  </div>
                </Dialog.Trigger>

                {/* Dialog Content */}
                <Dialog.Portal>
                  <Dialog.Overlay className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
                  <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-3xl w-full bg-white p-8 rounded-xl shadow-2xl border border-blue-100 flex flex-col items-center justify-center min-h-[400px] max-h-[90vh] overflow-y-auto">
                    {/* Loading states */}
                    {loading && (
                      <div className="flex flex-col items-center justify-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-b-4 border-blue-200 mb-4"></div>
                        <p className="text-blue-700 font-medium">
                          Processing ...
                        </p>
                      </div>
                    )}
                    {loadingRedirect && (
                      <div className="flex flex-col items-center justify-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-green-500 border-b-4 border-green-200 mb-4"></div>
                        <p className="text-green-700 font-medium">
                          Pesanan sudah dibuat! Tunggu yahh ... kita bawa kamu
                          ke halaman pembayaran~
                        </p>
                      </div>
                    )}

                    {/* Form */}
                    {!loading && !loadingRedirect && (
                      <>
                        <h2 className="text-2xl font-bold text-blue-700 mb-2 text-center">
                          {selectedService?.title} 🧺
                        </h2>
                        <p className="text-blue-600 mb-6 text-center">
                          Isi form laundry berikut
                        </p>
                        <form
                          onSubmit={handleSubmit}
                          className="flex flex-col gap-4 w-full"
                        >
                          <div className="flex flex-col">
                            <label className="text-blue-700 font-medium mb-1">
                              Estimasi Berat (kg) ⚖️
                            </label>
                            <input
                              type="number"
                              placeholder="Contoh: 5"
                              value={formData.weight}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  weight: e.target.value,
                                })
                              }
                              className="border border-blue-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 w-full shadow-sm"
                              required
                              min={0}
                            />
                          </div>
                          <div className="flex flex-col">
                            <label className="text-blue-700 font-medium mb-1">
                              Jumlah Pakaian (helai) 👕
                            </label>
                            <input
                              type="number"
                              placeholder="Contoh: 10"
                              value={formData.quantity}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  quantity: e.target.value,
                                })
                              }
                              className="border border-blue-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 w-full shadow-sm"
                              required
                              min={0}
                            />
                          </div>
                          <div className="flex flex-col">
                            <label className="text-blue-700 font-medium mb-1">
                              Alamat Lengkap 🏠
                            </label>
                            <textarea
                              placeholder="Contoh: Jl. Sudirman No. 123, Jakarta"
                              value={formData.address}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  address: e.target.value,
                                })
                              }
                              className="border border-blue-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 w-full shadow-sm resize-none"
                              rows={3}
                              required
                            />
                          </div>
                          <div className="flex flex-col">
                            <label className="text-blue-700 font-medium mb-1">
                              Estimasi Selesai 📅
                            </label>
                            <input
                              type="date"
                              value={formData.estimatedDate}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  estimatedDate: e.target.value,
                                })
                              }
                              min={new Date().toISOString().split("T")[0]} // hari ini
                              max={(() => {
                                const max = new Date();
                                max.setDate(max.getDate() + 7);
                                return max.toISOString().split("T")[0];
                              })()}
                              className="border border-blue-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 w-full shadow-sm"
                              required
                            />
                          </div>
                          <div className="flex justify-end gap-2 mt-4">
                            <Dialog.Close asChild>
                              <Button
                                type="button"
                                className="bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg px-5 py-2"
                              >
                                Cancel
                              </Button>
                            </Dialog.Close>
                            <Button
                              type="submit"
                              className="bg-blue-500 text-white hover:bg-blue-600 rounded-lg px-5 py-2"
                            >
                              Buat pesanan!
                            </Button>
                          </div>
                        </form>
                      </>
                    )}
                  </Dialog.Content>
                </Dialog.Portal>
              </Dialog.Root>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
