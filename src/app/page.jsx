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

  // --- STATE BARU ---
  const [fullName, setFullName] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const loginWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google' })
  }

  const logout = async () => {
    await supabase.auth.signOut()
    // Reset form setelah logout
    setEmail(''); setPassword(''); setFullName(''); setConfirmPassword('');
    setIsLoginForm(true)
  }

  // --- FUNGSI Diperbarui ---
  const handleAuthAction = async (e) => {
    e.preventDefault()

    if (isLoginForm) {
      // Logika untuk LOGIN
      try {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } catch (error) {
        alert(error.error_description || error.message)
      }
    } else {
      // Logika untuk REGISTRASI
      if (fullName.trim() === '') {
        alert('Nama lengkap tidak boleh kosong.')
        return
      }
      if (password !== confirmPassword) {
        alert('Password dan konfirmasi password tidak cocok!')
        return
      }

      try {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName, // Menyimpan nama lengkap ke metadata user
            },
          },
        })
        if (error) throw error
        alert('Registrasi berhasil! Silakan cek email Anda untuk verifikasi.')
      } catch (error) {
        alert(error.error_description || error.message)
      }
    }
  }

  // --- FUNGSI BARU untuk membersihkan form saat beralih mode ---
  const toggleFormMode = () => {
    setIsLoginForm(!isLoginForm)
    // Kosongkan semua input saat beralih
    setEmail('')
    setPassword('')
    setFullName('')
    setConfirmPassword('')
  }


  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-4 bg-gray-50">
      {user ? (
        <div className="text-center flex flex-col gap-4 items-center">
          <h1 className="text-2xl font-bold">
            Halo, {user.user_metadata?.full_name || user.email} 👋
          </h1>
          <p className="text-gray-600">Email: {user.email}</p>
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
            {/* --- INPUT BARU: Nama Lengkap (hanya muncul saat registrasi) --- */}
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
            {/* --- INPUT BARU: Konfirmasi Password (hanya muncul saat registrasi) --- */}
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
              onClick={toggleFormMode} // --- Menggunakan fungsi baru
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
              <span className="bg-white px-2 text-muted-foreground">
                Atau
              </span>
            </div>
          </div>
          
          <Button variant="outline" className="w-full flex items-center gap-2" onClick={loginWithGoogle}>
            <FcGoogle className="text-xl" />
            Lanjutkan dengan Google
          </Button>
        </div>
      )}
    </main>
  )
}