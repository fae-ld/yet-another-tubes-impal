"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { FcGoogle } from "react-icons/fc";

export default function LoginForm() {
  const [isLoginForm, setIsLoginForm] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const toggleFormMode = () => {
    setIsLoginForm(!isLoginForm);
    setEmail("");
    setPassword("");
    setFullName("");
    setConfirmPassword("");
  };

  const handleAuthAction = async (e) => {
    e.preventDefault();
    if (isLoginForm) {
      // LOGIN
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) alert(error.message);
    } else {
      // REGISTER
      if (password !== confirmPassword) return alert("Passwords do not match.");
      if (!fullName.trim()) return alert("Full name cannot be empty.");

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });

      if (error) return alert(error.message);
      alert("Registration successful! Please check your email to verify.");
    }
  };

  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) alert("Google login failed: " + error.message);
  };

  const isLogin = isLoginForm;

  return (
    <div
      className={`flex flex-col md:flex-row w-full max-w-4xl bg-white rounded-xl shadow-lg overflow-hidden transition-all`}
    >
      {/* Sisi Gambar */}
      <div
        className={`hidden md:flex md:w-1/2 items-center justify-center bg-gray-100 p-6 ${
          isLogin ? "order-1" : "order-2"
        }`}
      >
        <div className="relative w-full h-[400px]">
          <img
            src="images/Pexels Photo by Mike Cho.jpg"
            alt="Laundry"
            className="object-cover w-full h-full rounded-lg"
          />
          {/* Overlay transparan biru */}
          <div className="absolute inset-0 bg-blue-500/40 rounded-lg" />
        </div>
      </div>

      {/* Sisi Form */}
      <div
        className={`flex flex-col justify-center w-full md:w-1/2 p-8 ${
          isLogin ? "order-2" : "order-1"
        }`}
      >
        <h2 className="text-2xl font-bold text-center mb-2">
          {isLogin ? "Selamat Datang Kembali!" : "Buat Akun Baru"}
        </h2>
        <p className="text-sm text-gray-500 text-center mb-6">
          {isLogin
            ? "Masuk untuk melanjutkan ke akun Anda"
            : "Isi data di bawah untuk mendaftar"}
        </p>

        <form onSubmit={handleAuthAction} className="flex flex-col gap-3">
          {!isLogin && (
            <input
              type="text"
              placeholder="Nama Lengkap"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <input
            type="password"
            placeholder="Kata Sandi"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
          />
          {!isLogin && (
            <input
              type="password"
              placeholder="Konfirmasi Kata Sandi"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
            />
          )}
          <Button
            type="submit"
            className="mt-2 w-full bg-blue-500 hover:bg-blue-600 text-white transition-colors"
          >
            {isLogin ? "Masuk" : "Daftar"}
          </Button>
        </form>

        <p className="text-sm text-center text-gray-600 mt-3">
          {isLogin ? "Belum punya akun?" : "Sudah punya akun?"}{" "}
          <button
            onClick={toggleFormMode}
            className="font-semibold text-blue-600 hover:underline"
          >
            {isLogin ? "Daftar di sini" : "Masuk di sini"}
          </button>
        </p>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-500">Atau</span>
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full flex items-center justify-center gap-2"
          onClick={loginWithGoogle}
        >
          <FcGoogle className="text-xl" />
          Lanjutkan dengan Google
        </Button>
      </div>
    </div>
  );
}
