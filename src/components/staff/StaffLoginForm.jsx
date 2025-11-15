"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

export default function StaffLoginForm({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleStaffLogin = async (e) => {
    e.preventDefault();

    const {
      data: { session },
      error,
    } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) return alert("Login gagal: " + error.message);

    await fetch("/api/set-role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: session.user.id }),
    });

    if (onLogin) onLogin();
  };

  return (
    <div className="flex flex-col w-full max-w-md bg-white rounded-xl shadow-lg p-8">
      <h2 className="text-2xl font-bold text-center mb-2">Login Staff</h2>

      <form onSubmit={handleStaffLogin} className="flex flex-col gap-3">
        <input
          type="email"
          placeholder="Email"
          className="px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Kata Sandi"
          className="px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <Button
          type="submit"
          className="mt-2 w-full bg-blue-500 hover:bg-blue-600 text-white transition-colors"
        >
          Masuk
        </Button>
      </form>

      <p className="text-sm text-center mt-4 text-gray-600">
        Bukan staff?{" "}
        <a
          href="/"
          className="underline font-semibold text-blue-600 hover:text-blue-800"
        >
          Kembali ke halaman utama
        </a>
      </p>
    </div>
  );
}
