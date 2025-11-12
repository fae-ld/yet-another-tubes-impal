'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ArrowLeft, Clock, Loader2, CheckCircle, XCircle } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import { Button } from '@/components/ui/button'
import { useUser } from '@/context/UserContext'

const ordersData = [
  { id: 1, service: 'Cuci Kering Cepat', date: '2025-11-10', status: 'Pending' },
  { id: 2, service: 'Setrika Saja', date: '2025-11-09', status: 'In Progress' },
  { id: 3, service: 'Cuci & Setrika', date: '2025-11-08', status: 'Done' },
  { id: 4, service: 'Cuci Cepat', date: '2025-11-07', status: 'Batal' },
]

export default function OrderDetailsPage() {
  const { id } = useParams()
  const router = useRouter()
  const [order, setOrder] = useState(null)
  
  const { user, loading } = useUser()
  
    // TODO: Skeleton
    if (loading) {
        return (
        <DashboardLayout>
            <div className="flex items-center justify-center min-h-screen">
            <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 animate-pulse">
                <div className="h-6 bg-gray-300 rounded mb-4"></div>
                <div className="h-4 bg-gray-300 rounded mb-2"></div>
                <div className="h-4 bg-gray-300 rounded mb-2"></div>
            </div>
            </div>
        </DashboardLayout>
        )
    }

    if (!user) {
        return (
          <DashboardLayout>
            <div className="flex items-center justify-center min-h-screen">
              <p className="text-gray-500">User tidak ditemukan</p>
            </div>
          </DashboardLayout>
        )
      }

  useEffect(() => {
    const data = ordersData.find(o => o.id === parseInt(id))
    setOrder(data)
  }, [id])

  // load Snap.js
  useEffect(() => {
    if (!window.snap) {
      const script = document.createElement('script')
      script.src = 'https://app.sandbox.midtrans.com/snap/snap.js'
      script.setAttribute('data-client-key', process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY)
      script.async = true
      document.body.appendChild(script)
    }
  }, [])

  const handleSnapPay = async () => {
    try {
      const res = await fetch("/api/create-snap-transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            gross_amount: 25000,
            name: user.user_metadata?.full_name || "User name",
            email: user.email,
        }),
    });

      const data = await res.json()

      if (data.token) {
        window.snap.pay(data.token, {
          onSuccess: (result) => console.log("✅ success:", result),
          onPending: (result) => console.log("🕒 pending:", result),
          onError: (result) => console.log("❌ error:", result),
          onClose: () => console.log("popup closed by user"),
        })
      } else {
        console.error("no token from backend:", data)
      }
    } catch (err) {
      console.error("snap pay error:", err)
    }
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-600">
        Loading...
      </div>
    )
  }

  const renderTracker = (status) => {
    const steps = [
      { label: 'Pesanan diterima 🧾', done: true },
      { label: 'Sedang dicuci 💧', done: status === 'In Progress' || status === 'Done' },
      { label: 'Disetrika 🔥', done: status === 'Done' },
      { label: 'Selesai 📦', done: status === 'Done' },
    ]

    if (status === 'Pending') {
      return (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-yellow-700 text-center mt-4">
          💰 Pesanan belum dibayar.
          <div className="mt-3">
            <Button
              onClick={handleSnapPay}
              className="bg-yellow-600 text-white hover:bg-yellow-700 rounded-lg px-4 py-2"
            >
              Bayar Sekarang
            </Button>
          </div>
        </div>
      )
    }

    if (status === 'Batal') {
      return (
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg text-red-600 text-center mt-4">
          ❌ Pesanan dibatalkan karena keterlambatan pembayaran.
        </div>
      )
    }

    return (
      <div className="mt-6 space-y-4">
        {steps.map((step, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 p-3 rounded-xl shadow-sm ${
              step.done ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-gray-200'
            }`}
          >
            {step.done ? (
              <CheckCircle size={20} className="text-blue-500" />
            ) : (
              <Clock size={20} className="text-gray-400" />
            )}
            <span
              className={`${step.done ? 'text-blue-700 font-medium' : 'text-gray-500'}`}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>
    )
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'text-yellow-600 bg-yellow-100'
      case 'In Progress':
        return 'text-blue-600 bg-blue-100'
      case 'Done':
        return 'text-green-600 bg-green-100'
      case 'Batal':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pending':
        return <Clock size={22} className="text-yellow-500" />
      case 'In Progress':
        return <Loader2 size={22} className="text-blue-500 animate-spin" />
      case 'Done':
        return <CheckCircle size={22} className="text-green-500" />
      case 'Batal':
        return <XCircle size={22} className="text-red-500" />
      default:
        return null
    }
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen p-6 flex flex-col items-center">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-6 relative">
          <button
            onClick={() => router.push('/orders')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition mb-4"
          >
            <ArrowLeft size={20} /> <span>Kembali</span>
          </button>

          <div className="text-center">
            <h1 className="text-2xl font-bold text-blue-700 mb-2">{order.service}</h1>
            <p className="text-gray-500">{order.date}</p>

            <div
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full mt-3 text-sm font-medium ${getStatusColor(order.status)}`}
            >
              {getStatusIcon(order.status)}
              {order.status}
            </div>
          </div>

          {renderTracker(order.status)}
        </div>
      </div>
    </DashboardLayout>
  )
}
