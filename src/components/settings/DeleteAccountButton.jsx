"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/contexts/UserContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function DeleteAccountButton() {
  const { user } = useUser();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (confirmText !== "SAYA YAKIN") {
      alert("Ketik 'SAYA YAKIN' dulu ya!");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/delete-account", {
        method: "POST",
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      // Logout session user
      await supabase.auth.signOut();

      // Clear storage
      localStorage.clear();

      router.replace("/");
    } catch (err) {
      console.error(err);
      alert("Gagal menghapus akun.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button variant="destructive" onClick={() => setOpen(true)}>
        Hapus Akun
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">
              Hapus Akun Permanen
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <p className="text-sm text-gray-600 leading-relaxed">
              Tindakan ini <b>tidak bisa dibatalkan</b>. Semua pesanan, ulasan,
              dan data kamu akan terhapus selamanya. Jika kamu yakin, ketik{" "}
              <b>SAYA YAKIN</b> di bawah:
            </p>

            <Input
              placeholder="SAYA YAKIN"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button onClick={() => setOpen(false)} variant="outline">
              Batal
            </Button>

            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? "Menghapus..." : "Hapus Akun"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
