export const STATUS_INFO = {
  "Pesanan Dibuat": {
    emoji: "🧾",
    desc: "Order berhasil dibuat, menunggu penjemputan.",
  },
  Penjemputan: {
    emoji: "🚗",
    desc: "Kurir sedang menjemput pakaian ke alamat pelanggan.",
  },
  "Verifikasi Berat": {
    emoji: "⚖️",
    desc: "Pakaian sudah diterima dan sedang ditimbang/diverifikasi.",
  },
  "Menunggu Pembayaran": {
    emoji: "💳",
    desc: "Harga final telah dikonfirmasi, menunggu pembayaran pelanggan.",
  },
  "Sedang Dicuci": {
    emoji: "💧",
    desc: "Proses pencucian dimulai (setelah pembayaran lunas).",
  },
  "Sedang Disetrika": {
    emoji: "🔥",
    desc: "Proses setrika / finishing sedang berlangsung.",
  },
  "Selesai Dicuci": {
    emoji: "📦",
    desc: "Semua pakaian selesai dicuci dan disetrika, siap dikirim.",
  },
  "Sedang Diantar": {
    emoji: "🛵",
    desc: "Kurir mengantar pakaian kembali ke pelanggan.",
  },
  Selesai: {
    emoji: "✅",
    desc: "Pesanan diterima pelanggan, transaksi selesai.",
  },
  Dibatalkan: {
    emoji: "❌",
    desc: "Pesanan dibatalkan (oleh pelanggan/admin).",
  },
};

export const getSuperStatus = (subStatus) => {
  if (subStatus === "Selesai") return "Done";
  if (subStatus === "Dibatalkan") return "Batal";

  if (
    [
      "Penjemputan",
      "Verifikasi Berat",
      "Sedang Dicuci",
      "Sedang Disetrika",
      "Selesai Dicuci",
      "Sedang Diantar",
      "In Progress",
    ].includes(subStatus)
  ) {
    return "In Progress";
  }

  if (["Pesanan Dibuat", "Menunggu Pembayaran"].includes(subStatus)) {
    return "Pending";
  }
  return "Pending";
};

export const getStatusColor = (superStatus) => {
  const colors = {
    Pending: "text-yellow-600 bg-yellow-100",
    "In Progress": "text-blue-600 bg-blue-100",
    Done: "text-green-600 bg-green-100",
    Batal: "text-red-600 bg-red-100",
  };
  return colors[superStatus] || "text-gray-600 bg-gray-100";
};
