'use client'

import DashboardLayout from '@/components/DashboardLayout'
import * as Dialog from '@radix-ui/react-dialog'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

const servicesData = [
  { id: 1, title: 'Cuci Kering Cepat', image: '/images/ic-ironwash.png', features: ['Cuci 1kg', 'Pakaian dijemur', 'Waktu 24 jam'], price: 'Rp25.000' },
  { id: 2, title: 'Setrika Saja', image: '/images/ic-ironwash.png', features: ['Hanya setrika', 'Pakaian dijemur', 'Waktu 12 jam'], price: 'Rp15.000' },
  { id: 3, title: 'Cuci & Setrika', image: '/images/ic-ironwash.png', features: ['Cuci 1kg', 'Setrika', 'Waktu 24 jam'], price: 'Rp35.000' },
]

// TODO:
// - Date estimation handling
// - Responsive ngestuck waktu scroll paling bawah (item dan form paling bawah kepotong)

export default function ServicesPage() {
  const [selectedService, setSelectedService] = useState(null)
  const [formData, setFormData] = useState({ weight: '', quantity: '', address: '', estimatedDate: '' })
  const [loading, setLoading] = useState(false) // loading during fake request
  const [loadingRedirect, setLoadingRedirect] = useState(false) // loading during router.push
  const router = useRouter()

  const handleSubmit = (e, close) => {
    e.preventDefault()
    setLoading(true)

    // Simulate request delay
    setTimeout(() => {
      setLoading(false)
      setLoadingRedirect(true)

      // Show loading during redirect (1.5s)
      setTimeout(() => {
        close()
        router.push('/#')
      }, 5000)
    }, 2000) // 2 detik loading sebelum redirect
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-3xl font-bold text-blue-600 mb-6">Services</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {servicesData.map(service => (
            <Dialog.Root key={service.id}>
              <Dialog.Trigger asChild>
                <div
                  onClick={() => setSelectedService(service)}
                  className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-5 flex flex-col items-center text-center hover:scale-98 hover:shadow-lg transition-transform duration-200 cursor-pointer border border-blue-200"
                >
                  <img src={service.image} alt={service.title} className="w-24 h-24 object-contain mb-4" />
                  <h2 className="text-xl font-bold text-blue-700 mb-2">{service.title}</h2>
                  <ul className="text-blue-600 text-sm space-y-1 mb-4">
                    {service.features.map((f, idx) => (
                      <li key={idx} className="before:content-['⭐'] before:mr-1">{f}</li>
                    ))}
                  </ul>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-blue-700 text-lg">{service.price}</span>
                    <Button className="bg-blue-500 text-white hover:bg-blue-600 rounded-full px-4 py-1 shadow-md">
                      Pilih
                    </Button>
                  </div>
                </div>
              </Dialog.Trigger>

              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
                <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-3xl w-full bg-white p-8 rounded-xl shadow-2xl border border-blue-100 flex flex-col items-center justify-center min-h-[400px]">
                  
                  {/* Loading during fake request */}
                  {loading && (
                    <div className="flex flex-col items-center justify-center">
                      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-b-4 border-blue-200 mb-4"></div>
                      <p className="text-blue-700 font-medium">Processing ...</p>
                    </div>
                  )}

                  {/* Loading during router.push */}
                  {loadingRedirect && (
                    <div className="flex flex-col items-center justify-center">
                      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-green-500 border-b-4 border-green-200 mb-4"></div>
                      <p className="text-green-700 font-medium">Pesanan sudah dibuat! Tunggu yahh ... kita bawa kamu ke halaman pembayaran~</p>
                    </div>
                  )}

                  {/* Form */}
                  {!loading && !loadingRedirect && (
                    <>
                      <h2 className="text-2xl font-bold text-blue-700 mb-2 text-center">{selectedService?.title} 🧺</h2>
                      <p className="text-blue-600 mb-6 text-center">Isi form laundry berikut</p>
                      <form onSubmit={(e) => handleSubmit(e, () => setSelectedService(null))} className="flex flex-col gap-4 w-full">
                        <div className="flex flex-col">
                          <label className="text-blue-700 font-medium mb-1">Estimasi Berat (kg) ⚖️</label>
                          <input
                            type="number"
                            placeholder="Contoh: 5"
                            value={formData.weight}
                            onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                            className="border border-blue-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 w-full shadow-sm"
                            required
                            min={0}
                          />
                        </div>
                        <div className="flex flex-col">
                          <label className="text-blue-700 font-medium mb-1">Jumlah Pakaian (helai) 👕</label>
                          <input
                            type="number"
                            placeholder="Contoh: 10"
                            value={formData.quantity}
                            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                            className="border border-blue-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 w-full shadow-sm"
                            required
                            min={0}
                          />
                        </div>
                        <div className="flex flex-col">
                          <label className="text-blue-700 font-medium mb-1">Alamat Lengkap 🏠</label>
                          <textarea
                            placeholder="Contoh: Jl. Sudirman No. 123, Jakarta"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            className="border border-blue-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 w-full shadow-sm resize-none"
                            rows={3}
                            required
                          />
                        </div>
                        <div className="flex flex-col">
                          <label className="text-blue-700 font-medium mb-1">Estimasi Selesai 📅</label>
                          <input
                            type="date"
                            value={formData.estimatedDate}
                            onChange={(e) => setFormData({ ...formData, estimatedDate: e.target.value })}
                            className="border border-blue-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 w-full shadow-sm"
                            required
                          />
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                          <Dialog.Close asChild>
                            <Button type="button" className="bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg px-5 py-2">Cancel</Button>
                          </Dialog.Close>
                          <Button type="submit" className="bg-blue-500 text-white hover:bg-blue-600 rounded-lg px-5 py-2">Submit</Button>
                        </div>
                      </form>
                    </>
                  )}

                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
