'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import LoginForm from '@/components/LoginForm'
import DashboardLayout from '@/components/DashboardLayout'
import { useUser } from '@/context/UserContext'

export default function Page() {
  const { user } = useUser()

  return user ? (
    <DashboardLayout>
      <div>
        <h1 className="text-3xl font-bold text-blue-600">Home</h1>
        <p className="mt-4 text-gray-700">Welcome, {user.email}</p>
      </div>
    </DashboardLayout>
  ) : (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <LoginForm />
    </div>
  )
}
