"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ArrowLeft } from "lucide-react";
import StaffDashboardLayout from "@/components/staff/StaffDashboardLayout";
import ReviewCard from "@/components/ReviewCard";
import { insertNotification } from '@/utils/notifications';
import StaffDashboardLoading from "@/components/staff/loadings/StaffDashboardLoading";
import { ORDER_SUBSTEPS_COD, ORDER_SUBSTEPS_QRIS, getStepColor, getSuperStatus } from "@/utils/staff/orderdetails";
import { Badge, SectionCard, InfoRow, StatPill, renderStatusBadge } from "@/components/staff/orders/OrderDetails";

export default function OrderDetailPage() {
  const router = useRouter();

  const { id: orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [existingReview, setExistingReview] = useState(null);
  const [service, setService] = useState(null);

  // ✅ hanya untuk UI (buka/tutup proses), TIDAK mengubah logic pesanan
  const [showProcess, setShowProcess] = useState(false);

  const [ORDER_SUBSTEPS, setORDER_SUBSTEPS] = useState(ORDER_SUBSTEPS_COD);

  useEffect(() => {
    if (!orderId) return;

    const fetchOrder = async () => {
      setLoading(true);
      try {
        const { data: orderData, error: orderError } = await supabase
          .from("pesanan")
          .select("*")
          .eq("id_pesanan", orderId)
          .single();
        if (orderError) throw orderError;

        if (orderData) {
          if(orderData.metode_pembayaran == "QRIS") setORDER_SUBSTEPS(ORDER_SUBSTEPS_QRIS);

          const { data: serviceData, error: serviceError } = await supabase
            .from("layanan")
            .select("*")
            .eq("id_layanan", orderData.id_layanan)
            .single();
          if (serviceError) throw serviceError;

          setService(serviceData);
        }

        const { data: pelangganData, error: pelangganError } = await supabase
          .from("pelanggan")
          .select("nama")
          .eq("id_pelanggan", orderData.id_pelanggan)
          .single();
        if (pelangganError) throw pelangganError;

        const { data: statusData, error: statusError } = await supabase
          .from("riwayat_status_pesanan")
          .select("*")
          .eq("id_pesanan", orderId)
          .order("waktu", { ascending: false });
        if (statusError) throw statusError;

        setOrder({
          ...orderData,
          pelanggan: pelangganData,
          riwayat_status_pesanan: statusData,
          latestStatus: statusData?.[0] || null,
        });

        const { data: ulasan, error: ulasanError } = await supabase
          .from("ulasan")
          .select("*")
          .eq("id_pesanan", orderId)
          .single();

        if (ulasanError && ulasanError.code !== "PGRST116") throw ulasanError;
        setExistingReview(ulasan);
      } catch (err) {
        console.error(err);
        setError("Gagal mengambil data");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const handleStepClick = async (clickedStep) => {
    if (!order) {
      console.error("Order data is not loaded.");
      return;
    }

    if (order.cancelled_at) {
      alert("Pesanan ini sudah dibatalkan dan tidak dapat diubah lagi.");
      return;
    }

    const existingStatuses =
      order.riwayat_status_pesanan?.map((s) => s.status) || [];
    const clickedIndex = ORDER_SUBSTEPS.findIndex(
      (s) => s.label === clickedStep.label,
    );

    const currentIndexInDB = Math.max(
      ...existingStatuses.map((s) =>
        ORDER_SUBSTEPS.findIndex((step) => step.label === s),
      ),
      -1,
    );

    const isCOD = order.metode_pembayaran === "COD";

    try {
      let finalUpdatedStatus = null;

      if (clickedIndex > currentIndexInDB) {
        let stepsToInsert = ORDER_SUBSTEPS.slice(
          currentIndexInDB + 1,
          clickedIndex + 1,
        ).filter((step) => !existingStatuses.includes(step.label));

        // Kalau berat aktual belum ada dan mau pass verifikasi berat maka deny
        if(order.berat_aktual === null && clickedIndex > 2) {
          alert("Set berat aktual dulu lah 😡😡💢💢💢");
          return;
        }

        // Kalau belum lunas dan mau pass menunggu pembayaran maka deny
        if(!isCOD && clickedIndex > 3 && order.status_pembayaran !== "Paid" && order.status_pesanan === "Menunggu Pembayaran") {
          alert("Bro pelanggan nya belum bayar 🤬💢")
          return;
        }

        // Prepaid/QRIS: harus lunas sebelum "Sedang Dicuci"
        if (!isCOD && order.status_pembayaran !== "Paid") {
          const waitingForPaymentIndex = ORDER_SUBSTEPS.findIndex(
            (s) => s.label === "Menunggu Pembayaran",
          );

          if (
            clickedIndex > waitingForPaymentIndex &&
            currentIndexInDB < waitingForPaymentIndex
          ) {
            alert(
              "Pembayaran belum lunas. Status tidak dapat dimajukan melewati 'Menunggu Pembayaran'.",
            );
            return;
          }
        }

        // Kalau mau update ke selesai tapi belum konfirmasi pembayaran maka deny
        if(clickedIndex == 8 && order.status_pembayaran !== "Paid") {
          alert("Konfirmasi pembayaran dulu yah");
          return;
        }

        // COD: skip "Menunggu Pembayaran"
        // Deprecated karena udah pake setORDER_SUBSTEPS
        if (isCOD) {
          stepsToInsert = stepsToInsert.filter(
            (step) => step.label !== "Menunggu Pembayaran",
          );
        }

        if (stepsToInsert.length > 0) {
          const inserts = stepsToInsert.map((step) => ({
            id_pesanan: order.id_pesanan,
            status: step.label,
            deskripsi: step.desc,
            waktu: new Date(),
          }));
          const { error: insertError } = await supabase
            .from("riwayat_status_pesanan")
            .insert(inserts);
          if (insertError) throw insertError;

          finalUpdatedStatus = stepsToInsert[stepsToInsert.length - 1].label;
        }
      } else if (clickedIndex < currentIndexInDB) {
        const stepsToDelete = ORDER_SUBSTEPS.slice(clickedIndex + 1).map(
          (s) => s.label,
        );

        if (stepsToDelete.length > 0) {
          const { error: deleteError } = await supabase
            .from("riwayat_status_pesanan")
            .delete()
            .in("status", stepsToDelete)
            .eq("id_pesanan", order.id_pesanan);
          if (deleteError) throw deleteError;
        }

        finalUpdatedStatus = clickedStep.label;
      } else if (clickedIndex === currentIndexInDB) {
        finalUpdatedStatus = clickedStep.label;
      }

      const updatePayload = {
        status_pesanan: clickedStep.label,
      };

      if (isCOD && clickedStep.label === "Selesai") {
        updatePayload.status_pembayaran = "Paid";
        updatePayload.tgl_pembayaran_lunas = new Date().toISOString();
        updatePayload.jumlah_dibayar = order.total_biaya_final;
        updatePayload.metode_pembayaran = "COD";
      }

      const { error: pesananError } = await supabase
        .from("pesanan")
        .update(updatePayload)
        .eq("id_pesanan", order.id_pesanan);
      if (pesananError) throw pesananError;

      if (finalUpdatedStatus) {
        await insertNotification(order, finalUpdatedStatus);
      }

      const { data: updatedStatuses, error: fetchError } = await supabase
        .from("riwayat_status_pesanan")
        .select("*")
        .eq("id_pesanan", order.id_pesanan)
        .order("waktu", { ascending: true });

      if (fetchError) throw fetchError;

      setOrder({
        ...order,
        status_pesanan: clickedStep.label,
        riwayat_status_pesanan: updatedStatuses || [],
        latestStatus: updatedStatuses?.[updatedStatuses.length - 1] || null,
      });

      alert(`Status pesanan berhasil diupdate ke: ${clickedStep.label}!`);
    } catch (err) {
      console.error("Gagal memproses status pesanan:", err);
      alert("Gagal update status pesanan. Lihat console untuk detail.");
    }
  };

  const handleCancelOrder = async () => {
  // 1. Konfirmasi agar tidak sengaja terpencet
  const confirmCancel = confirm("Apakah Anda yakin ingin membatalkan pesanan ini? Aksi ini tidak dapat dibatalkan.");
  if (!confirmCancel) return;

  const cancelTime = new Date().toISOString();

  try {
    setLoading(true);

    // 2. Update tabel pesanan
    const { error: updateError } = await supabase
      .from("pesanan")
      .update({ 
        cancelled_at: cancelTime,
        status_pesanan: "Dibatalkan" 
      })
      .eq("id_pesanan", orderId);

    if (updateError) throw updateError;

    // 3. Masukkan ke riwayat status agar muncul di timeline
    const { error: historyError } = await supabase
      .from("riwayat_status_pesanan")
      .insert([{
        id_pesanan: orderId,
        status: "Dibatalkan",
        deskripsi: "Pesanan telah dibatalkan oleh pihak laundry/pelanggan.",
        waktu: cancelTime
      }]);

    if (historyError) throw historyError;

    // 4. Update State lokal agar UI langsung berubah
    setOrder((prev) => ({
      ...prev,
      cancelled_at: cancelTime,
      status_pesanan: "Dibatalkan",
      riwayat_status_pesanan: [
        { status: "Dibatalkan", waktu: cancelTime, deskripsi: "Pesanan telah dibatalkan." },
        ...prev.riwayat_status_pesanan,
      ]
    }));

    alert("Pesanan berhasil dibatalkan.");
  } catch (err) {
    console.error("Gagal membatalkan pesanan:", err);
    alert("Terjadi kesalahan saat membatalkan pesanan.");
  } finally {
    setLoading(false);
  }
};

  // ====== EARLY RETURNS ======
  if (loading) {
    return (
      <StaffDashboardLayout>
        
      </StaffDashboardLayout>
    );
  }

  if (error) {
    return (
      <StaffDashboardLayout>
        <StaffDashboardLoading></StaffDashboardLoading>
      </StaffDashboardLayout>
    );
  }

  if (!order) {
    return (
      <StaffDashboardLayout>
        <div className="p-6 text-center text-gray-600">Order tidak ditemukan</div>
      </StaffDashboardLayout>
    );
  }

  // ====== UI derivations ======
  const currentSubIndex =
    order.riwayat_status_pesanan.length === 0
      ? 0
      : order.riwayat_status_pesanan.length - 1;

  const currentStatusLabel = order.latestStatus?.status ?? order.status_pesanan;
  const superStatus = getSuperStatus(currentStatusLabel);

  const paidBadge =
    order.status_pembayaran === "Paid" ? (
      <Badge variant="green">Paid</Badge>
    ) : (
      <Badge variant="red">Unpaid</Badge>
    );

  const hargaPerKgText =
    service?.harga_per_kg != null
      ? `Rp ${Number(service.harga_per_kg).toLocaleString("id-ID")} / kg`
      : "-";

  const totalText =
    order.total_biaya_final != null
      ? `Rp ${Number(order.total_biaya_final).toLocaleString("id-ID")}`
      : "-";

  const jadwalText = order.jadwal_selesai
    ? new Date(order.jadwal_selesai).toLocaleString()
    : "-";

  const progressPercent = Math.min(
    100,
    Math.max(0, ((currentSubIndex + 1) / ORDER_SUBSTEPS.length) * 100),
  );

  return (
    <StaffDashboardLayout>
      <div className="px-4 md:px-8 py-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 overflow-hidden">
            <div className="px-5 md:px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center justify-between md:justify-start gap-3">
                <button
                  onClick={() => router.push("/staff/orders")}
                  className="inline-flex items-center gap-2 rounded-xl px-3 py-2 bg-white ring-1 ring-gray-200
                             hover:bg-gray-50 active:scale-[0.98] transition"
                >
                  <ArrowLeft size={18} />
                  <span className="text-sm font-semibold">Kembali</span>
                </button>

                <div className="md:hidden">{renderStatusBadge(superStatus)}</div>
              </div>

              <div className="flex-1">
                <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-gray-900">
                  Detail Pesanan{" "}
                  <span className="text-purple-700">#{order.id_pesanan}</span>
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Status saat ini:{" "}
                  <span className="font-semibold text-gray-800">
                    {order.cancelled_at ? 'Dibatalkan' : currentStatusLabel}
                  </span>
                </p>
              </div>

              <div className="hidden md:flex items-center gap-2">
                {renderStatusBadge(superStatus)}
                {paidBadge}
              </div>
            </div>

            {/* Progress bar */}
            <div className="px-5 md:px-6 pb-5">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                <span>Progress</span>
                <span className="font-semibold text-gray-700">
                  {Math.round(progressPercent)}%
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-gray-100 ring-1 ring-gray-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-purple-600 transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                <StatPill label="Status Pesanan" value={currentStatusLabel || "-"} />
                <StatPill label="Pembayaran" value={order.status_pembayaran ?? "-"} />
                <StatPill label="Total" value={totalText} />
              </div>

            {!order.cancelled_at && order.status_pesanan !== "Selesai" && (
              <button
                onClick={handleCancelOrder}
                className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-md transition duration-200 flex items-center justify-center gap-2"
              >
                <span>❌</span> Batalkan Pesanan
              </button>
            )}

            {/* indikator jika sudah dibatalkan */}
            {order.cancelled_at && (
              <div className="mt-4 p-4 bg-gray-100 border-l-4 border-red-500 text-red-700 italic">
                Pesanan ini telah dibatalkan pada: {new Date(order.cancelled_at).toLocaleString('id-ID')}
              </div>
            )}
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 space-y-6">
              <SectionCard
                title="Informasi Pelanggan"
                subtitle="Data identitas pelanggan terkait pesanan."
              >
                <div className="space-y-3">
                  <InfoRow label="Nama" value={order.pelanggan?.nama ?? "-"} emphasize />
                  <InfoRow label="ID Pelanggan" value={order.id_pelanggan} />
                  <InfoRow label="Email" value={order.pelanggan?.email ?? "-"} />
                  <InfoRow label="Telepon" value={order.pelanggan?.telepon ?? "-"} />
                </div>
              </SectionCard>

              <SectionCard
                title="Ulasan"
              >
                {existingReview ? (
                  <ReviewCard
                    review={{
                      ...existingReview,
                      pelanggan_nama: order.pelanggan?.nama,
                    }}
                    variant="default"
                  />
                ) : (
                  <div className="rounded-2xl bg-gray-50 ring-1 ring-gray-200 p-5 text-center">
                    <p className="font-semibold text-gray-800">Belum ada ulasan</p>
                    <p className="text-sm text-gray-500 mt-1">╰(*°▽°*)╯</p>
                  </div>
                )}
              </SectionCard>
            </div>

            <div className="lg:col-span-7 space-y-6">
              <SectionCard
                title="Informasi Pesanan"
                subtitle="Detail layanan, berat, biaya, pembayaran, dan jadwal."
                rightSlot={
                  <div className="flex items-center gap-2">
                    {paidBadge}
                    <Badge variant="blue">{order.metode_pembayaran ?? "-"}</Badge>
                  </div>
                }
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-4">
                  <InfoRow label="Jenis Layanan" value={order.jenis_layanan ?? "-"} />
                  <InfoRow label="Harga" value={hargaPerKgText} />
                  <InfoRow
                    label="Estimasi Berat"
                    value={order.estimasi_berat != null ? `${order.estimasi_berat} kg` : "-"}
                  />

                  <div className="flex items-start justify-between gap-6">
                    <span className="text-sm text-gray-500">Berat Aktual</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        placeholder={order.estimasi_berat ?? ""}
                        value={order.berat_aktual ?? ""}
                        onChange={(e) => {
                          const berat = parseFloat(e.target.value);
                          if (berat <= 0) return;

                          const hargaPerKg = service?.harga_per_kg;
                          setOrder({
                            ...order,
                            berat_aktual: berat,
                            total_biaya_final: berat
                              ? berat * hargaPerKg
                              : order.total_biaya_final,
                          });
                        }}
                        className="w-28 rounded-xl px-3 py-2 text-right text-sm font-semibold
                                   bg-white ring-1 ring-gray-200 shadow-sm
                                   focus:outline-none focus:ring-2 focus:ring-purple-200"
                                   disabled={order.cancelled_at !== null}
                      />
                      <span className="text-sm text-gray-500">kg</span>
                    </div>
                  </div>

                  <InfoRow label="Total Biaya" value={totalText} emphasize />
                  <InfoRow label="Status Pesanan" value={currentStatusLabel || "-"} />
                  <InfoRow label="Jadwal Selesai" value={jadwalText} />
                  <div className="hidden md:block" />
                </div>

                <div className="mt-5 space-y-3">
                  {order.status_pembayaran !== "Paid" &&
                    order.total_biaya_final > 0 && (
                      <div className="rounded-2xl bg-red-50 ring-1 ring-inset ring-red-200 p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-red-700">
                              Pesanan belum lunas
                            </p>
                            <p className="text-xs text-red-600 mt-1">
                              Konfirmasi manual hanya jika pembayaran sudah diterima.
                            </p>
                          </div>
                          <Badge variant="red">Action Required</Badge>
                        </div>

                        <button
                          className="mt-3 w-full inline-flex justify-center items-center rounded-xl px-4 py-2.5
                                     bg-green-600 text-white text-sm font-semibold
                                     hover:bg-green-700 active:scale-[0.99] transition"
                          onClick={async () => {
                            if (
                              !confirm(
                                `Yakin konfirmasi pembayaran LUNAS sebesar Rp ${Number(
                                  order.total_biaya_final,
                                ).toLocaleString("id-ID")},-?`,
                              )
                            )
                              return;

                            try {
                              const { error } = await supabase
                                .from("pesanan")
                                .update({
                                  status_pembayaran: "Paid",
                                  tgl_pembayaran_lunas: new Date().toISOString(),
                                  metode_pembayaran:
                                    order.metode_pembayaran === "COD" ? "COD" : "QRIS",
                                  jumlah_dibayar: order.total_biaya_final,
                                })
                                .eq("id_pesanan", order.id_pesanan);
                              if (error) throw error;
                              alert("Pembayaran berhasil dikonfirmasi LUNAS!");
                              window.location.reload();
                            } catch (err) {
                              console.error(err);
                              alert("Gagal konfirmasi pembayaran");
                            }
                          }}
                        >
                          Konfirmasi Pembayaran LUNAS
                        </button>
                      </div>
                    )}

                  <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                    <button
                      className="inline-flex justify-center items-center rounded-xl px-4 py-2.5
                                 bg-purple-600 text-white text-sm font-semibold
                                 hover:bg-purple-700 active:scale-[0.99] transition"
                      onClick={async () => {
                        try {
                          const { error } = await supabase
                            .from("pesanan")
                            .update({
                              berat_aktual: order.berat_aktual,
                              total_biaya_final: order.total_biaya_final,
                            })
                            .eq("id_pesanan", order.id_pesanan);
                          if (error) throw error;
                          alert("Berat aktual & total biaya berhasil diupdate!");
                        } catch (err) {
                          console.error(err);
                          alert("Gagal update berat aktual");
                        }
                      }}
                    >
                      Simpan Perubahan
                    </button>
                  </div>
                </div>
              </SectionCard>

              {/*Progress collapsible */}
              <SectionCard
                title="Progress Pesanan"
                rightSlot={
                  <button
                    type="button"
                    onClick={() => setShowProcess((v) => !v)}
                    className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold
                               bg-purple-50 text-purple-700 ring-1 ring-purple-100
                               hover:bg-purple-100 active:scale-[0.98] transition"
                  >
                    {showProcess ? "Tutup Proses ▲" : "Ubah Status ▼"}
                  </button>
                }
              >
                {/* Ringkasan status sekarang */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="gray">
                      Step {Math.min(ORDER_SUBSTEPS.length, currentSubIndex + 1)} /{" "}
                      {ORDER_SUBSTEPS.length}
                    </Badge>
                    <Badge variant="blue">{currentStatusLabel || "-"}</Badge>
                  </div>

                  <div className="text-sm text-gray-500">
                    Klik <span className="font-semibold text-purple-700">Ubah Status</span>{" "}
                    untuk melihat semua step.
                  </div>
                </div>

                {/* List step ditampilkan hanya saat dibuka */}
                {showProcess && (
                  <div className="mt-4 space-y-3">
                    {ORDER_SUBSTEPS.map((step, idx) => {
                      const completed = idx <= currentSubIndex;
                      const isCurrent = idx === currentSubIndex;

                      const stepHistory = order.riwayat_status_pesanan?.find(
                        (s) => s.status === step.label,
                      );

                      return (
                        <button
                          key={step.step}
                          type="button"
                          onClick={() => handleStepClick(step)}
                          className={[
                            "w-full text-left rounded-2xl border p-4 transition",
                            "hover:shadow-md active:scale-[0.995]",
                            getStepColor(step.label),
                            isCurrent ? "ring-2 ring-purple-300" : "ring-0",
                          ].join(" ")}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3">
                              <div className="text-2xl leading-none">{step.icon}</div>
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="font-extrabold text-gray-900">
                                    {step.label}
                                  </p>
                                  {isCurrent ? (
                                    <Badge variant="purple">Current</Badge>
                                  ) : completed ? (
                                    <Badge variant="green">Completed</Badge>
                                  ) : (
                                    <Badge variant="gray">Upcoming</Badge>
                                  )}
                                </div>

                                <p className="text-sm text-gray-600 mt-1">
                                  {step.desc}
                                </p>

                                {completed && stepHistory?.waktu && (
                                  <p className="text-xs text-gray-500 mt-2">
                                    {new Date(stepHistory.waktu).toLocaleString()}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="pt-1">
                              <input
                                type="checkbox"
                                checked={completed}
                                readOnly
                                className="h-5 w-5 accent-green-600"
                              />
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </SectionCard>
            </div>
          </div>
        </div>
      </div>
    </StaffDashboardLayout>
  );
}
