"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useUser } from "@/contexts/UserContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import DeleteAccountButton from "@/components/settings/DeleteAccountButton";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";

export default function SettingsPage() {
  const { user, loading } = useUser();

  const [nama, setNama] = useState("");
  const [alamat, setAlamat] = useState("");
  const [saving, setSaving] = useState(false);

  // Ambil data pelanggan
  useEffect(() => {
    if (!user) return;

    async function fetchPelanggan() {
      const { data, error } = await supabase
        .from("pelanggan")
        .select("nama, alamat")
        .eq("id_pelanggan", user.id)
        .single();

      if (!error && data) {
        setNama(data.nama || "");
        setAlamat(data.alamat || "");
      }
    }

    fetchPelanggan();
  }, [user, supabase]);

  // Update pelanggan
  async function handleSave() {
    setSaving(true);

    const { error } = await supabase
      .from("pelanggan")
      .update({
        nama,
        alamat,
      })
      .eq("id_pelanggan", user.id);

    setSaving(false);

    if (error) {
      alert("Gagal menyimpan perubahan");
    } else {
      alert("Berhasil disimpan!");
      window.location.reload();
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen text-gray-500">
          Loading...
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-gray-500">User tidak ditemukan</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-md mx-auto">
        <h1 className="text-3xl font-bold text-blue-600 mb-6">Settings</h1>

        <Card className="shadow-md border-blue-100">
          <CardHeader>
            <CardTitle>Informasi Akun</CardTitle>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* Profile Picture */}
            <div className="flex flex-col items-center gap-3">
              <img
                src={`/images/user.jpg`}
                className="w-24 h-24 rounded-full border shadow"
              />
              <p className="text-xs text-gray-500">Foto profil (read-only)</p>
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1">
              <Label>Email</Label>
              <Input value={user.email} readOnly className="bg-gray-100" />
            </div>

            {/* Nama */}
            <div className="flex flex-col gap-1">
              <Label>Nama</Label>
              <Input
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Nama lengkap"
              />
            </div>

            {/* Alamat */}
            <div className="flex flex-col gap-1">
              <Label>Alamat</Label>
              <Input
                value={alamat}
                onChange={(e) => setAlamat(e.target.value)}
                placeholder="Alamat rumah"
              />
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>

            <div className="pt-4 border-t mt-6">
              <h2 className="text-lg font-semibold text-red-600 mb-2">
                Danger Zone
              </h2>
              <DeleteAccountButton />
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
