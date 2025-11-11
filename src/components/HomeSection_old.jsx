'use client'

import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { useEffect } from "react"
import { supabase } from "../lib/supabase"

export default function HomeSection({ user }) {

  // 🧾 Load Midtrans Snap script (sekali aja)
  // Kalau dimuat ulang bisa bikin error atau tombol bayar gak jalan.
  useEffect(() => {
    const snapScript = document.createElement("script");
    snapScript.src = "https://app.sandbox.midtrans.com/snap/snap.js";
    snapScript.setAttribute("data-client-key", process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY);
    snapScript.async = true;

    document.body.appendChild(snapScript);

    return () => {
      document.body.removeChild(snapScript);
    };
  }, []);

  // Logout
  const logout = async () => {
    await supabase.auth.signOut()
  }

  // Handle pembayaran
  const handlePayment = async () => {
    const res = await fetch("/api/create-transaction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gross_amount: 50000,
        name: user.user_metadata?.full_name || "Pengguna",
        email: user.email,
      }),
    });

    const data = await res.json();
    if (!window.snap) {
      alert("Midtrans belum siap, coba lagi sebentar ya!");
      return;
    }

    // panggil Snap popup
    window.snap.pay(data.token, {
      onClose: () => {
        const snapFrame = document.querySelector('iframe[src*="midtrans"]');
        if (snapFrame) snapFrame.remove();
      },
    });
  };

  return (
    <div className="text-center flex flex-col gap-4 items-center">
      <h1 className="text-2xl font-bold">
        Halo, {user.user_metadata?.full_name || user.email} 👋
      </h1>
      <p className="text-gray-600">Email: {user.email}</p>

      <Button onClick={handlePayment}>
        Bayar Sekarang
      </Button>

      <Button
        variant="destructive"
        onClick={logout}
        className="flex items-center gap-2"
      >
        <LogOut className="h-4 w-4" />
        Logout
      </Button>
    </div>
  )
}