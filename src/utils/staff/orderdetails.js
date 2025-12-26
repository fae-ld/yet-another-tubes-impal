export const ORDER_SUBSTEPS_QRIS = [
  { step: 1, label: "Pesanan Dibuat", icon: "🧾", desc: "Order berhasil dibuat dan masuk sistem." },
  { step: 2, label: "Penjemputan", icon: "🚗", desc: "Kurir sedang menjemput pakaian ke alamat pelanggan." },
  { step: 3, label: "Verifikasi Berat", icon: "⚖️", desc: "Pakaian sudah diterima di laundry dan sedang ditimbang/diverifikasi." },
  { step: 4, label: "Menunggu Pembayaran", icon: "💳", desc: "Berat/harga akhir sudah dikonfirmasi, menunggu pembayaran dari pelanggan." },
  { step: 5, label: "Sedang Dicuci", icon: "💧", desc: "Pakaian sedang dicuci (dimulai setelah pembayaran lunas)." },
  { step: 6, label: "Sedang Disetrika", icon: "🔥", desc: "Proses setrika / finishing." },
  { step: 7, label: "Selesai Dicuci", icon: "📦", desc: "Pakaian selesai dicuci, siap dikirim." },
  { step: 8, label: "Sedang Diantar", icon: "🛵", desc: "Kurir mengantar pakaian ke pelanggan." },
  { step: 9, label: "Selesai", icon: "✅", desc: "Pesanan diterima pelanggan, transaksi selesai." },
];

export const ORDER_SUBSTEPS_COD = [
  { step: 1, label: "Pesanan Dibuat", icon: "🧾", desc: "Order berhasil dibuat dan masuk sistem." },
  { step: 2, label: "Penjemputan", icon: "🚗", desc: "Kurir sedang menjemput pakaian ke alamat pelanggan." },
  { step: 3, label: "Verifikasi Berat", icon: "⚖️", desc: "Pakaian sudah diterima di laundry dan sedang ditimbang/diverifikasi." },
  { step: 4, label: "Sedang Dicuci", icon: "💧", desc: "Pakaian sedang dicuci (dimulai setelah pembayaran lunas)." },
  { step: 5, label: "Sedang Disetrika", icon: "🔥", desc: "Proses setrika / finishing." },
  { step: 6, label: "Selesai Dicuci", icon: "📦", desc: "Pakaian selesai dicuci, siap dikirim." },
  { step: 7, label: "Sedang Diantar", icon: "🛵", desc: "Kurir mengantar pakaian ke pelanggan." },
  { step: 8, label: "Selesai", icon: "✅", desc: "Pesanan diterima pelanggan, transaksi selesai." },
];

// Mapping sub-status ke super status
export const getSuperStatus = (subStatus) => {
  if (subStatus === "Selesai") return "Done";
  if (subStatus === "Dibatalkan") return "Cancelled";

  if (
    [
      "Penjemputan",
      "Verifikasi Berat",
      "Sedang Dicuci",
      "Sedang Disetrika",
      "Selesai Dicuci",
      "Sedang Diantar",
    ].includes(subStatus)
  ) {
    return "In Progress";
  }

  if (["Pesanan Dibuat", "Menunggu Pembayaran"].includes(subStatus)) {
    return "Pending";
  }

  return "Unknown Status";
};

export const getStepColor = (subStatus) => {
  const superStatus = getSuperStatus(subStatus);
  switch (superStatus) {
    case "Pending":
      return "bg-yellow-50 border-yellow-200";
    case "In Progress":
      return "bg-purple-50 border-purple-200";
    case "Done":
      return "bg-green-50 border-green-200";
    case "Cancelled":
      return "bg-red-50 border-red-200";
    default:
      return "bg-gray-50 border-gray-200";
  }
};