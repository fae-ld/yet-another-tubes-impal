import { supabase } from "@/lib/supabase";

// Fungsi Helper untuk Notifikasi
export const insertNotification = async (order, statusLabel) => {
  if (!order || !order.id_pelanggan || !order.id_pesanan) {
    console.warn(
      "Skip notifikasi: Order, ID pelanggan, atau ID pesanan tidak tersedia.",
    );
    return;
  }

  const orderId = `#${order.id_pesanan}`;
  let notificationData = null;
  let finalTotal = order.total_biaya_final || 0;

  switch (statusLabel) {
    case "Penjemputan":
      notificationData = {
        tipe: "PICKUP",
        konten: `Pesanan ${orderId}: Kurir kami sedang dalam perjalanan menuju lokasi Anda untuk penjemputan.`,
      };
      break;
    case "Menunggu Pembayaran":
      notificationData = {
        tipe: "PAYMENT_DUE",
        konten: `Tagihan Baru untuk Pesanan ${orderId}! Pesanan sudah diverifikasi, mohon segera lakukan pembayaran sebesar Rp${finalTotal.toLocaleString(
          "id-ID",
        )},-`,
      };
      break;
    case "Selesai Dicuci":
      notificationData = {
        tipe: "READY_FOR_DELIVERY",
        konten: `Pesanan ${orderId}: Pakaian Anda sudah selesai! Siap diantar kembali ke lokasi Anda.`,
      };
      break;
    case "Sedang Diantar":
      notificationData = {
        tipe: "DELIVERY",
        konten: `Pesanan ${orderId}: Kurir sedang mengantar pesanan Anda. Mohon bersiap menerima.`,
      };
      break;
    case "Selesai":
      notificationData = {
        tipe: "ORDER_COMPLETE",
        konten: `Pesanan ${orderId}: Selesai! Terima kasih telah menggunakan jasa kami.`,
      };
      break;
    case "Dibatalkan":
      notificationData = {
        tipe: "CANCELLED",
        konten: `Pesanan ${orderId}: Dibatalkan oleh Admin. Mohon hubungi layanan pelanggan untuk info lebih lanjut.`,
      };
      break;
    default:
      return;
  }

  if (notificationData) {
    const { error: notifErr } = await supabase.from("notifikasi").insert({
      id_user: order.id_pelanggan,
      id_pesanan: order.id_pesanan,
      tipe: notificationData.tipe,
      konten: notificationData.konten,
    });
    if (notifErr) console.error("⚠️ Gagal insert notifikasi:", notifErr);
  }
};
