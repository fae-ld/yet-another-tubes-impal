"use client";

import Link from "next/link";
import { Eye } from "lucide-react";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function OrdersTable({ orders }) {
  const statusColor = (status) => {
    switch ((status || "").toLowerCase()) {
      case "in progress":
      case "proses":
        return "blue";
      case "done":
      case "selesai":
        return "green";
      default:
        return "yellow";
    }
  };

  const payBadge = (payStatus) => {
    const s = (payStatus || "").toLowerCase();
    if (s === "paid" || s === "lunas")
      return <Badge variant="green">Paid</Badge>;
    if (s === "unpaid" || s === "belum lunas")
      return <Badge variant="red">Unpaid</Badge>;
    return <Badge variant="outline">{payStatus ?? "-"}</Badge>;
  };

  const formatRp = (n) => (n != null ? Number(n).toLocaleString("id-ID") : "-");

  const formatDateTime = (d) => (d ? new Date(d).toLocaleString() : "-");

  return (
    <>
      {/* Desktop Table (NO horizontal scroll) */}
      <div className="hidden md:block">
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Daftar Pesanan
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Total:{" "}
                <span className="font-semibold">{orders?.length ?? 0}</span>{" "}
                pesanan
              </p>
            </div>
          </div>

          {/* IMPORTANT: remove overflow-x-auto to avoid side scroll */}
          <div className="w-full">
            <Table>
              <TableHeader className="bg-purple-50/70">
                <TableRow className="border-b border-purple-100">
                  <TableHead className="w-[80px]">ID</TableHead>
                  <TableHead className="w-[260px]">Pelanggan</TableHead>

                  {/* Jenis: sembunyikan kalau layar sempit */}
                  <TableHead className="hidden lg:table-cell">Jenis</TableHead>

                  {/* Berat digabung jadi 1 kolom (Estimasi/Aktual) */}
                  <TableHead className="text-right w-[160px]">Berat</TableHead>

                  {/* Metode: tampil dari md */}
                  <TableHead className="text-right w-[110px]">Metode</TableHead>

                  {/* Total: selalu tampil */}
                  <TableHead className="text-right w-[140px]">Total</TableHead>

                  {/* Status: selalu tampil */}
                  <TableHead className="w-[140px]">Status</TableHead>

                  {/* Pembayaran: sembunyikan di md kecil, tampil lg */}
                  <TableHead className="hidden lg:table-cell w-[140px]">
                    Bayar
                  </TableHead>

                  {/* Jadwal: hanya xl (biar gak maksa lebar) */}
                  <TableHead className="hidden xl:table-cell w-[210px]">
                    Jadwal
                  </TableHead>

                  <TableHead className="text-center w-[80px]">Aksi</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {orders.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center py-10 text-gray-500"
                    >
                      Tidak ada pesanan.
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((o, idx) => (
                    <TableRow
                      key={o.id_pesanan}
                      className={[
                        "transition-colors",
                        idx % 2 === 0 ? "bg-white" : "bg-gray-50/40",
                        "hover:bg-purple-50/60",
                      ].join(" ")}
                    >
                      <TableCell className="font-semibold text-gray-900">
                        #{o.id_pesanan}
                      </TableCell>

                      {/* Pelanggan (ringkas + jangan kepanjangan) */}
                      <TableCell className="max-w-[260px]">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-gray-900 truncate">
                            {o.id_pelanggan}
                          </div>
                          {/* tampilkan jenis sebagai secondary text saat kolom jenis disembunyikan */}
                          <div className="text-xs text-gray-500 truncate lg:hidden">
                            {o.layanan?.jenis_layanan ?? "-"}
                          </div>
                        </div>
                      </TableCell>

                      {/* Jenis (desktop besar saja) */}
                      <TableCell className="hidden lg:table-cell text-gray-900">
                        {o.layanan?.jenis_layanan ?? "-"}
                      </TableCell>

                      {/* Berat gabung */}
                      <TableCell className="text-right font-medium tabular-nums">
                        <div className="flex flex-col items-end leading-tight">
                          <span>
                            {o.estimasi_berat ?? "-"}
                            {o.estimasi_berat != null ? (
                              <span className="text-xs text-gray-500 ml-1">
                                kg
                              </span>
                            ) : null}
                            <span className="text-xs text-gray-400 ml-2">
                              est
                            </span>
                          </span>
                          <span className="text-xs text-gray-600">
                            {o.berat_aktual ?? "-"}
                            {o.berat_aktual != null ? (
                              <span className="text-xs text-gray-500 ml-1">
                                kg
                              </span>
                            ) : null}
                            <span className="text-xs text-gray-400 ml-2">
                              akt
                            </span>
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="text-right">
                        <Badge variant="outline">
                          {o.metode_pembayaran ?? "-"}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right font-semibold tabular-nums text-gray-900">
                        {formatRp(o.total_biaya_final)}
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge variant={statusColor(o.status_pesanan)}>
                            {o.status_pesanan ?? "-"}
                          </Badge>

                          {/* kalau kolom bayar disembunyikan, tampilkan kecil di bawah status */}
                          <div className="lg:hidden">
                            {payBadge(o.status_pembayaran)}
                          </div>
                        </div>
                      </TableCell>

                      {/* Bayar (lg+) */}
                      <TableCell className="hidden lg:table-cell">
                        {payBadge(o.status_pembayaran)}
                      </TableCell>

                      {/* Jadwal (xl+) */}
                      <TableCell className="hidden xl:table-cell text-sm text-gray-700">
                        {formatDateTime(o.jadwal_selesai)}
                      </TableCell>

                      <TableCell className="text-center">
                        <Link href={`/staff/orders/${o.id_pesanan}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 w-9 p-0 rounded-xl hover:bg-purple-50"
                            aria-label={`Lihat pesanan ${o.id_pesanan}`}
                          >
                            <Eye size={18} />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {orders.length > 0 && (
            <div className="px-5 py-4 border-t border-gray-100 text-xs text-gray-500">
              Tip: Klik ikon 👁️ untuk melihat detail & update status pesanan.
            </div>
          )}
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden mt-4 space-y-3">
        {orders.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-6 text-center">
            <p className="text-gray-700 font-semibold">Tidak ada pesanan</p>
            <p className="text-sm text-gray-500 mt-1">
              Pesanan akan muncul di sini.
            </p>
          </div>
        )}

        {orders.map((o) => (
          <div
            key={o.id_pesanan}
            className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 overflow-hidden"
          >
            <div className="p-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-extrabold text-gray-900">
                  #{o.id_pesanan}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  Pelanggan:{" "}
                  <span className="font-medium">{o.id_pelanggan}</span>
                </div>
              </div>

              <div className="text-right">
                <div className="text-sm font-extrabold text-gray-900 tabular-nums">
                  {formatRp(o.total_biaya_final)}
                </div>
                <div className="text-[11px] text-gray-500">Total (Rp)</div>
              </div>
            </div>

            <div className="px-4 pb-4 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={statusColor(o.status_pesanan)}>
                  {o.status_pesanan ?? "-"}
                </Badge>
                {payBadge(o.status_pembayaran)}
                <Badge variant="outline">{o.metode_pembayaran ?? "-"}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-gray-50 ring-1 ring-gray-200 p-3">
                  <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wide">
                    Estimasi
                  </p>
                  <p className="mt-1 text-sm font-bold text-gray-900 tabular-nums">
                    {o.estimasi_berat ?? "-"}{" "}
                    {o.estimasi_berat != null ? (
                      <span className="text-xs text-gray-500 font-semibold">
                        kg
                      </span>
                    ) : null}
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 ring-1 ring-gray-200 p-3">
                  <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wide">
                    Aktual
                  </p>
                  <p className="mt-1 text-sm font-bold text-gray-900 tabular-nums">
                    {o.berat_aktual ?? "-"}{" "}
                    {o.berat_aktual != null ? (
                      <span className="text-xs text-gray-500 font-semibold">
                        kg
                      </span>
                    ) : null}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-700">
                <span className="text-xs text-gray-500">Jadwal Selesai</span>
                <span className="font-medium text-right">
                  {formatDateTime(o.jadwal_selesai)}
                </span>
              </div>

              <div className="pt-2 flex justify-end">
                <Link href={`/staff/orders/${o.id_pesanan}`} className="w-full">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full rounded-xl hover:bg-purple-50"
                  >
                    <Eye size={18} className="mr-2" />
                    Lihat Detail
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
