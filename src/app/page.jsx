'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import LoginForm from '@/components/LoginForm'
import HomeSection from '@/components/HomeSection'

export default function Page() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    getUser()

    // Supabase listener buat deteksi login/logout secara real-time
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      {loading ? (
        // skeleton kecil biar gak muncul flash login form
        <div className="flex flex-col items-center gap-3 animate-pulse text-gray-500">
          <div className="w-40 h-6 bg-gray-200 rounded-md" />
          <div className="w-60 h-6 bg-gray-200 rounded-md" />
        </div>
      ) : user ? (
        <HomeSection user={user} />
      ) : (
        <LoginForm />
      )}
    </main>
  )
}