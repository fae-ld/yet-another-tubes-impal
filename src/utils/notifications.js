import { supabase } from "@/lib/supabase";
const NOTIFICATION_MAP = {
  "Penjemputan": {
    tipe: "PICKUP",
    getKonten: (id) => `Pesanan ${id}: Kurir kami sedang dalam perjalanan menuju lokasi Anda untuk penjemputan.`
  },
  "Menunggu Pembayaran": {
    tipe: "PAYMENT_DUE",
    getKonten: (id, total) => `Tagihan Baru untuk Pesanan ${id}! Pesanan sudah diverifikasi, mohon segera lakukan pembayaran sebesar Rp${total.toLocaleString("id-ID")},-`
  },
  "Selesai Dicuci": {
    tipe: "READY_FOR_DELIVERY",
    getKonten: (id) => `Pesanan ${id}: Pakaian Anda sudah selesai! Siap diantar kembali ke lokasi Anda.`
  },
  "Sedang Diantar": {
    tipe: "DELIVERY",
    getKonten: (id) => `Pesanan ${id}: Kurir sedang mengantar pesanan Anda. Mohon bersiap menerima.`
  },
  "Selesai": {
    tipe: "ORDER_COMPLETE",
    getKonten: (id) => `Pesanan ${id}: Selesai! Terima kasih telah menggunakan jasa kami.`
  },
  "Dibatalkan": {
    tipe: "CANCELLED",
    getKonten: (id) => `Pesanan ${id}: Dibatalkan oleh Admin. Mohon hubungi layanan pelanggan untuk info lebih lanjut.`
  }
};

export const insertNotification = async (order, statusLabel) => {
  if (!order?.id_pelanggan || !order?.id_pesanan) {
    console.warn("Skip notifikasi: Data tidak lengkap.");
    return;
  }

  const config = NOTIFICATION_MAP[statusLabel];
  if (!config) return;

  const orderId = `#${order.id_pesanan}`;
  const finalTotal = order.total_biaya_final || 0;

  const { error: notifErr } = await supabase.from("notifikasi").insert({
    id_user: order.id_pelanggan,
    id_pesanan: order.id_pesanan,
    tipe: config.tipe,
    konten: config.getKonten(orderId, finalTotal),
  });

  if (notifErr) console.error("⚠️ Gagal insert notifikasi:", notifErr);
};