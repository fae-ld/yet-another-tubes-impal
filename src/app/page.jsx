'use client'

import { supabase } from '@/lib/supabase'

export default function Home() {
  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    })
    if (error) console.error(error)
  }

  const logout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-bold">Laundry App</h1>
      <button
        onClick={loginWithGoogle}
        className="rounded bg-blue-600 px-4 py-2 text-white"
      >
        Login with Google
      </button>
      <button
        onClick={logout}
        className="rounded bg-gray-600 px-4 py-2 text-white"
      >
        Logout
      </button>
    </main>
  )
}
