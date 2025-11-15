export default function OrdersTable({ orders }) {
  // Helper untuk badge style
  const statusColor = (status) => {
    switch ((status || "").toLowerCase()) {
      case "in progress":
      case "proses":
        return "bg-blue-100 text-blue-800";
      case "done":
      case "selesai":
        return "bg-green-100 text-green-800";
      default:
        return "bg-yellow-100 text-yellow-800"; // pending / baru
    }
  };

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-purple-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-purple-700">ID</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-purple-700">Pelanggan</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-purple-700">Jenis</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-purple-700">Estimasi</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-purple-700">Berat</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-purple-700">Total (Rp)</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-purple-700">Status Pesanan</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-purple-700">Status Bayar</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-purple-700">Jadwal Selesai</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-purple-700">Aksi</th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-100">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-6 text-center text-gray-500">
                  Tidak ada pesanan.
                </td>
              </tr>
            ) : (
              orders.map((o) => (
                <tr key={o.id_pesanan} className="hover:bg-purple-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">
                    #{o.id_pesanan}
                  </td>

                  <td className="px-4 py-3 text-sm text-gray-600 truncate max-w-xs">
                    {o.id_pelanggan}
                  </td>

                  <td className="px-4 py-3 text-sm text-gray-700">
                    {o.jenis_layanan}
                  </td>

                  <td className="px-4 py-3 text-sm text-right text-gray-600">
                    {o.estimasi_berat ?? "-"}
                  </td>

                  <td className="px-4 py-3 text-sm text-right text-gray-600">
                    {o.berat_aktual ?? "-"}
                  </td>

                  <td className="px-4 py-3 text-sm text-right text-gray-800">
                    {o.total_biaya_final != null
                      ? Number(o.total_biaya_final).toLocaleString("id-ID")
                      : "-"}
                  </td>

                  {/* STATUS PESANAN */}
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(
                        o.status_pesanan
                      )}`}
                    >
                      {o.status_pesanan ?? "-"}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-sm text-gray-700">
                    {o.status_pembayaran}
                  </td>

                  <td className="px-4 py-3 text-sm text-gray-600">
                    {o.jadwal_selesai
                      ? new Date(o.jadwal_selesai).toLocaleString()
                      : "-"}
                  </td>

                  {/* ACTION BUTTONS */}
                  <td className="px-4 py-3 text-sm text-center space-x-2">
                    <button className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded hover:bg-blue-200 transition">
                      View
                    </button>
                    <button className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded hover:bg-green-200 transition">
                      Edit
                    </button>
                    <button className="px-3 py-1 bg-red-100 text-red-700 text-xs font-medium rounded hover:bg-red-200 transition">
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden mt-4 space-y-3">
        {orders.length === 0 && (
          <div className="p-4 bg-white rounded-lg border border-gray-200 text-center text-gray-500">
            Tidak ada pesanan.
          </div>
        )}

        {orders.map((o) => (
          <div key={o.id_pesanan} className="bg-white p-4 rounded-xl shadow border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-purple-600">#{o.id_pesanan}</div>
                <div className="text-xs text-gray-500 truncate">{o.id_pelanggan}</div>
              </div>

              <div className="text-right">
                <div className="text-sm font-medium text-gray-800">
                  {o.total_biaya_final != null
                    ? Number(o.total_biaya_final).toLocaleString("id-ID")
                    : "-"}
                </div>
                <div className="text-xs text-gray-400">Total</div>
              </div>
            </div>

            {/* Status */}
            <div className="mt-3">
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${statusColor(
                  o.status_pesanan
                )}`}
              >
                {o.status_pesanan}
              </span>
            </div>

            {/* Actions */}
            <div className="mt-3 flex gap-2">
              <button className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 text-xs rounded-lg">
                View
              </button>
              <button className="flex-1 px-3 py-2 bg-green-100 text-green-700 text-xs rounded-lg">
                Edit
              </button>
              <button className="flex-1 px-3 py-2 bg-red-100 text-red-700 text-xs rounded-lg">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}