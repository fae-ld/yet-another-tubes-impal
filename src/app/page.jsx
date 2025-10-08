'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Button } from "@/components/ui/button"
import { FcGoogle } from "react-icons/fc"
import { LogOut } from "lucide-react"

export default function Home() {
  const [user, setUser] = useState(null)

  // cek user waktu pertama render + listen perubahan login/logout
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
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6">
      {user ? (
        <>
          <h1 className="text-2xl font-bold">
            Halo, {user.user_metadata.full_name || user.email} 👋
          </h1>
          <p className="text-gray-600">Email: {user.email}</p>
          <Button variant="destructive" onClick={logout} className="flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold">Laundry Go</h1>
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={loginWithGoogle}
          >
            <FcGoogle className="text-xl" />
            Sign in with Google
          </Button>
        </>
      )}
    </main>
  )
}