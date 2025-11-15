"use client";

export default function StaffDashboard() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-blue-600">
        Heyyy, selamat datang di Dashboard Staff~
      </h1>
      <p className="mt-4 text-gray-700">
        Kamu punya akses spesial di sini... jangan macam-macam ya 😳
      </p>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-white shadow rounded-lg">
          <h2 className="font-semibold mb-2">Manajemen Laundry</h2>
          <p className="text-sm text-gray-600">
            Lihat pesanan yang masuk, update status, dan lain-lain~
          </p>
        </div>

        <div className="p-4 bg-white shadow rounded-lg">
          <h2 className="font-semibold mb-2">Riwayat Transaksi</h2>
          <p className="text-sm text-gray-600">
            Catatan lengkap transaksi laundry pelanggan.
          </p>
        </div>
      </div>
    </div>
  );
}
