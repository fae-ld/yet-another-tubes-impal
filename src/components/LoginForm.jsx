'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Button } from "@/components/ui/button"
import { FcGoogle } from "react-icons/fc"

export default function LoginForm() {
  const [isLoginForm, setIsLoginForm] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // --- login / signup handler ---
  const handleAuthAction = async (e) => {
    e.preventDefault()

    if (isLoginForm) {
      try {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } catch (error) {
        alert(error.message)
      }
    } else {
      if (fullName.trim() === '') return alert('Nama lengkap tidak boleh kosong.')
      if (password !== confirmPassword) return alert('Password tidak cocok.')

      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        })
        if (error) throw error

        alert('Registrasi berhasil! Silakan cek email Anda untuk verifikasi.')
      } catch (error) {
        alert(error.message)
      }
    }
  }

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

  const toggleFormMode = () => {
    setIsLoginForm(!isLoginForm)
    setEmail('')
    setPassword('')
    setFullName('')
    setConfirmPassword('')
  }

  // --- UI ---
  return (
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
  )
}