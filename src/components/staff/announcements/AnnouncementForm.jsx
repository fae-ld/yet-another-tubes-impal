"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";

const TYPING_OPTIONS = ["INFO", "PROMO", "DISKON", "WARNING"];

export default function AnnouncementForm({
  initialData = null,
  onSuccess,
  onCancel,
}) {
  const [judul, setJudul] = useState("");
  const [konten, setKonten] = useState("");
  const [tipe, setTipe] = useState("INFO");
  const [tglMulai, setTglMulai] = useState("");
  const [tglSelesai, setTglSelesai] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setJudul(initialData.judul || "");
      setKonten(initialData.konten || "");
      setTipe(initialData.tipe || "INFO");
      setTglMulai(
        initialData.tgl_mulai
          ? format(new Date(initialData.tgl_mulai), "yyyy-MM-dd")
          : "",
      );
      setTglSelesai(
        initialData.tgl_selesai
          ? format(new Date(initialData.tgl_selesai), "yyyy-MM-dd")
          : "",
      );
    } else {
      setJudul("");
      setKonten("");
      setTipe("INFO");
      setTglMulai("");
      setTglSelesai("");
    }
  }, [initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!judul || !konten || !tglMulai || !tglSelesai) {
      alert("Semua field wajib diisi!");
      return;
    }

    if (new Date(tglSelesai) < new Date(tglMulai)) {
      alert("Tanggal selesai harus setelah tanggal mulai!");
      return;
    }

    setLoading(true);

    const payload = {
      judul,
      konten,
      tipe,
      tgl_mulai: new Date(tglMulai),
      tgl_selesai: new Date(tglSelesai),
      updated_at: new Date(),
      status: true,
    };

    try {
      if (initialData) {
        // Edit
        const { error } = await supabase
          .from("pengumuman")
          .update(payload)
          .eq("id_pengumuman", initialData.id_pengumuman);

        if (error) throw error;
      } else {
        // Create
        const { error } = await supabase.from("pengumuman").insert([payload]);
        if (error) throw error;
      }

      onSuccess && onSuccess();
    } catch (err) {
      console.error("Gagal submit pengumuman:", err);
      alert("Gagal menyimpan pengumuman.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl shadow-lg p-6 space-y-4"
    >
      <h2 className="text-xl font-bold text-purple-600">
        {initialData ? "Edit Pengumuman" : "Buat Pengumuman Baru"}
      </h2>

      <div>
        <Label>Judul</Label>
        <Input
          value={judul}
          onChange={(e) => setJudul(e.target.value)}
          required
        />
      </div>

      <div>
        <Label>Konten</Label>
        <Textarea
          value={konten}
          onChange={(e) => setKonten(e.target.value)}
          required
        />
      </div>

      <div>
        <Label>Tipe</Label>
        <Select value={tipe} onValueChange={setTipe}>
          <SelectTrigger>
            <SelectValue placeholder="Pilih tipe" />
          </SelectTrigger>
          <SelectContent>
            {TYPING_OPTIONS.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-4">
        <div>
          <Label>Tanggal Mulai</Label>
          <Input
            type="date"
            value={tglMulai}
            onChange={(e) => setTglMulai(e.target.value)}
            required
          />
        </div>
        <div>
          <Label>Tanggal Selesai</Label>
          <Input
            type="date"
            value={tglSelesai}
            onChange={(e) => setTglSelesai(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="flex space-x-2 mt-4">
        <Button type="submit" disabled={loading}>
          {initialData ? "Update" : "Buat"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Batal
        </Button>
      </div>
    </form>
  );
}
