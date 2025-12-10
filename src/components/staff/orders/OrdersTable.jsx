"use client";

import Link from "next/link";
import { Eye, Trash2 } from "lucide-react";
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

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <Table>
          <TableHeader className="bg-purple-50">
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Pelanggan</TableHead>
              <TableHead>Jenis</TableHead>
              <TableHead className="text-right">Estimasi (kg)</TableHead>
              <TableHead className="text-right">Aktual (kg)</TableHead>
              <TableHead className="text-right">Metode</TableHead>
              <TableHead className="text-right">Total (Rp)</TableHead>
              <TableHead>Status Pesanan</TableHead>
              <TableHead>Status Bayar</TableHead>
              <TableHead>Jadwal Selesai</TableHead>
              <TableHead className="text-center">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-6 text-gray-500">
                  Tidak ada pesanan.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((o) => (
                <TableRow key={o.id_pesanan} className="hover:bg-purple-50 transition-colors">
                  <TableCell>#{o.id_pesanan}</TableCell>
                  <TableCell className="truncate max-w-xs">{o.id_pelanggan}</TableCell>
                  <TableCell>{o.layanan?.jenis_layanan}</TableCell>
                  <TableCell className="text-right">{o.estimasi_berat ?? "-"}</TableCell>
                  <TableCell className="text-right">{o.berat_aktual ?? "-"}</TableCell>
                  <TableCell className="text-right">{o.metode_pembayaran ?? "-"}</TableCell>
                  <TableCell className="text-right">
                    {o.total_biaya_final != null
                      ? Number(o.total_biaya_final).toLocaleString("id-ID")
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusColor(o.status_pesanan)}>
                      {o.status_pesanan ?? "-"}
                    </Badge>
                  </TableCell>
                  <TableCell>{o.status_pembayaran ?? "-"}</TableCell>
                  <TableCell>
                    {o.jadwal_selesai
                      ? new Date(o.jadwal_selesai).toLocaleString()
                      : "-"}
                  </TableCell>
                  <TableCell className="flex justify-center gap-2">
                    {/* View */}
                    <Link href={`/staff/orders/${o.id_pesanan}`}>
                      <Button variant="outline" size="sm" className="p-2">
                        <Eye size={18} />
                      </Button>
                    </Link>

                    {/* Delete */}
                    {/* <Button
                      variant="destructive"
                      size="sm"
                      className="p-2"
                      onClick={() => alert(`Hapus Order ID: ${o.id_pesanan}`)}
                    >
                      <Trash2 size={18} />
                    </Button> */}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
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

            <div className="mt-3">
              <Badge variant={statusColor(o.status_pesanan)}>
                {o.status_pesanan ?? "-"}
              </Badge>
            </div>

            <div className="mt-3 flex justify-start gap-3">
              <Link href={`/staff/orders/${o.id_pesanan}`}>
                <Button variant="outline" size="sm" className="p-2">
                  <Eye size={18} />
                </Button>
              </Link>

              {/* <Button
                variant="destructive"
                size="sm"
                className="p-2"
                onClick={() => alert(`Hapus Order ID: ${o.id_pesanan}`)}
              >
                <Trash2 size={18} />
              </Button> */}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}