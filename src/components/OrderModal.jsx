'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { useState } from 'react'
import { useUser } from '@/context/UserContext'

export default function OrderModal({ order, open, onClose }) {
  const { user } = useUser()
  const [qrUrl, setQrUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  if (!order) return null

  const handlePayQRIS = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/create-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gross_amount: 25000,
          name: user.user_metadata?.full_name,
          email: user.email,
        }),
      })

      const data = await res.json()

      if (data.actions) {
        // cari URL QR dari response
        const qrAction = data.actions.find(
          (a) => a.name === 'generate-qr-code' || a.name === 'generate-qr-code-v2'
        )
        if (qrAction) {
          setQrUrl(qrAction.url)
        } else {
          setError('Gagal menemukan QR Code dari Midtrans.')
        }
      } else {
        setError('Respons Midtrans tidak valid.')
      }
    } catch (err) {
      console.error('QRIS error:', err)
      setError('Gagal membuat transaksi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-lg w-full bg-white p-6 rounded-xl shadow-2xl border border-blue-100 flex flex-col gap-4">
          <Dialog.Title className="text-2xl font-bold text-blue-700">
            Order #{order.id}
          </Dialog.Title>

          <p><strong>Service:</strong> {order.service}</p>
          <p><strong>Date:</strong> {order.date}</p>
          <p><strong>Status:</strong> {order.status}</p>

          {order.status === 'Pending' && (
            <div className="mt-4 p-4 border rounded-lg border-blue-200 bg-blue-50 flex flex-col items-center gap-4">
              <h3 className="font-semibold text-blue-800 text-lg">Bayar dengan QRIS 📱</h3>

              {!qrUrl ? (
                <Button
                  onClick={handlePayQRIS}
                  disabled={loading}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  {loading ? 'Membuat QR...' : 'Buat QRIS'}
                </Button>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <Image
                    src={qrUrl}
                    alt="QRIS Payment"
                    width={220}
                    height={220}
                    className="rounded-lg border"
                  />
                  <p className="text-sm text-gray-500">Scan pakai aplikasi e-wallet kamu</p>
                </div>
              )}

              {error && <p className="text-red-600 text-sm">{error}</p>}
            </div>
          )}

          <div className="flex justify-end gap-2 mt-4">
            <Dialog.Close asChild>
              <Button className="bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg px-4 py-2">
                Tutup
              </Button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}