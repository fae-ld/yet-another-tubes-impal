'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Button } from "@/components/ui/button"
import { FcGoogle } from "react-icons/fc"
import { LogOut } from "lucide-react"

export default function Home() {
  const [user, setUser] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoginForm, setIsLoginForm] = useState(true)
  const [fullName, setFullName] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // 🔄 Cek session & handle perubahan Auth
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)

      // 🧠 Kalau user login (termasuk via Google)
      if (currentUser) {
        // 🔍 Cek apakah user sudah ada di tabel pelanggan
        const { data: existing, error: checkError } = await supabase
          .from('pelanggan')
          .select('id_pelanggan')
          .eq('id_pelanggan', currentUser.id)
          .maybeSingle()

        if (checkError) {
          console.error('❌ Gagal cek pelanggan:', checkError.message)
          return
        }

        // 🪄 Kalau belum ada → buat record baru
        if (!existing) {
          const { error: insertError } = await supabase
            .from('pelanggan')
            .insert([{ id_pelanggan: currentUser.id, alamat: '' }])

          if (insertError) {
            console.error('❌ Gagal tambah pelanggan:', insertError.message)
          } else {
            console.log('✅ Pelanggan baru ditambahkan untuk user:', currentUser.email)
          }
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const snapScript = document.createElement("script");
    snapScript.src = "https://app.sandbox.midtrans.com/snap/snap.js";
    snapScript.setAttribute(
      "data-client-key",
      process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY
    );
    snapScript.async = true;

    document.body.appendChild(snapScript);

    return () => {
      document.body.removeChild(snapScript);
    };
  }, []);

  const loginWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      })
      if (error) throw error
    } catch (error) {
      alert('Login Google gagal: ' + error.message)
    }
  }

  // 🚪 Logout
  const logout = async () => {
    await supabase.auth.signOut()
    setEmail('')
    setPassword('')
    setFullName('')
    setConfirmPassword('')
    setIsLoginForm(true)
  }

  // 🔐 Login / Registrasi manual
  const handleAuthAction = async (e) => {
    e.preventDefault()

    if (isLoginForm) {
      // === LOGIN ===
      try {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } catch (error) {
        alert(error.error_description || error.message)
      }
    } else {
      // === REGISTRASI ===
      if (fullName.trim() === '') return alert('Nama lengkap tidak boleh kosong.')
      if (password !== confirmPassword) return alert('Password dan konfirmasi password tidak cocok!')

      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        })

        if (error) throw error

        const user = data.user
        if (user) {
          const { error: insertError } = await supabase
            .from('pelanggan')
            .insert([{ id_pelanggan: user.id, alamat: '' }])

          if (insertError) {
            console.error('❌ Gagal tambah pelanggan:', insertError.message)
          } else {
            console.log('✅ Data pelanggan berhasil ditambahkan.')
          }
        }

        alert('Registrasi berhasil! Silakan cek email Anda untuk verifikasi.')
      } catch (error) {
        alert(error.error_description || error.message)
      }
    }
  }

  const toggleFormMode = () => {
    setIsLoginForm(!isLoginForm)
    setEmail('')
    setPassword('')
    setFullName('')
    setConfirmPassword('')
  }

  // 🖥️ UI
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-4 bg-gray-50">
      {user ? (
        <div className="text-center flex flex-col gap-4 items-center">
          <h1 className="text-2xl font-bold">
            Halo, {user.user_metadata?.full_name || user.email} 👋
          </h1>
          <p className="text-gray-600">Email: {user.email}</p>
          <Button
            onClick={async () => {
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
              window.snap.pay(data.token);
            }}
          >
            Bayar Sekarang
          </Button>

          <Button variant="destructive" onClick={logout} className="flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      ) : (
        <div className="w-full max-w-sm flex flex-col items-center gap-4 p-8 bg-white shadow-md rounded-lg">
          <h1 className="text-2xl font-bold text-center">
            {isLoginForm ? 'Selamat Datang Kembali' : 'Buat Akun Baru'}
          </h1>
          <p className="text-sm text-gray-500 text-center">
            {isLoginForm ? 'Silakan login untuk melanjutkan' : 'Isi form di bawah untuk mendaftar'}
          </p>

          <form onSubmit={handleAuthAction} className="w-full flex flex-col gap-3 mt-4">
            {!isLoginForm && (
              <input
                type="text"
                placeholder="Nama Lengkap"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {!isLoginForm && (
              <input
                type="password"
                placeholder="Konfirmasi Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
            <Button type="submit" className="w-full mt-2">
              {isLoginForm ? 'Login' : 'Daftar'}
            </Button>
          </form>

          <p className="text-sm text-center text-gray-600 mt-2">
            {isLoginForm ? "Belum punya akun?" : "Sudah punya akun?"}
            <button
              onClick={toggleFormMode}
              className="font-semibold text-blue-600 hover:underline ml-1"
            >
              {isLoginForm ? 'Daftar di sini' : 'Login di sini'}
            </button>
          </p>

          <div className="relative w-full my-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-muted-foreground">Atau</span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full flex items-center gap-2"
            onClick={loginWithGoogle}
          >
            <FcGoogle className="text-xl" />
            Lanjutkan dengan Google
          </Button>
        </div>
      )}
    </main>
  )
}