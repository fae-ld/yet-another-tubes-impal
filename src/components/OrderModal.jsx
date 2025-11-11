'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { Button } from '@/components/ui/button'
import { Clock, Loader2, CheckCircle } from 'lucide-react'
import { useEffect } from 'react'
import { useUser } from '@/context/UserContext'
import Script from 'next/script'

// TODO:
// QR Regenerate tiap close atau tetep keep sampe expired?

export default function OrderModal({ order, open, onClose }) {
  if (!order) return null

  const { user, loading } = useUser()

  if (!user) {
      return (
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-screen">
            <p className="text-gray-500">User tidak ditemukan</p>
          </div>
        </DashboardLayout>
      )
    }
  

  const getStatusStyles = (status) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800'
      case 'In Progress': return 'bg-blue-100 text-blue-800'
      case 'Done': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const deadline = new Date(new Date(order.date).getTime() + 24 * 60 * 60 * 1000)

  // Load Snap.js once
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
      const res = await fetch("/api/create-transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gross_amount: 25000,
          name: user.user_metadata?.full_name, // sesuaikan user
          email: user.email,
        }),
      })

      const data = await res.json()

      if (data.token) {
        window.snap.pay(data.token, {
          onSuccess: (result) => console.log("success", result),
          onPending: (result) => console.log("pending", result),
          onError: (result) => console.log("error", result),
          onClose: () => console.log("customer closed popup"),
        })
      }
    } catch (err) {
      console.error("Snap pay error:", err)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-lg w-full bg-white p-6 rounded-xl shadow-2xl border border-blue-100 flex flex-col gap-4">
          
          <Dialog.Title className="text-2xl font-bold text-blue-700">Order #{order.id}</Dialog.Title>
          <p><strong>Service:</strong> {order.service}</p>
          <p><strong>Date:</strong> {order.date}</p>
          <p>
            <strong>Status:</strong>{' '}
            <span className={`px-2 py-1 rounded ${getStatusStyles(order.status)}`}>
              {order.status}
            </span>
          </p>

          {order.status === 'Pending' && (
            <div className="mt-4 p-4 border rounded-lg border-yellow-200 bg-yellow-50 flex flex-col items-center gap-4">
              <h3 className="font-semibold text-yellow-800 text-lg">Bayar Sekarang 🧾</h3>

              <Button
                onClick={handleSnapPay}
                className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
              >
                Bayar Sekarang
              </Button>

              <p className="text-yellow-700 text-sm">Total bayar: <span className="font-semibold">Rp25.000</span></p>
            </div>
          )}

          <div className="flex justify-end gap-2 mt-4">
            <Dialog.Close asChild>
              <Button className="bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg px-4 py-2">
                Close
              </Button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
