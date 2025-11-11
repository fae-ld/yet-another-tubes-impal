'use client'

import DashboardLayout from '@/components/DashboardLayout'
import { Button } from '@/components/ui/button'

const servicesData = [
  {
    id: 1,
    title: 'Cuci Kering Cepat',
    image: '/images/ic-ironwash.png',
    features: ['Cuci 1kg', 'Pakaian dijemur', 'Waktu 24 jam'],
    price: 'Rp25.000',
  },
  {
    id: 2,
    title: 'Setrika Saja',
    image: '/images/ic-ironwash.png',
    features: ['Hanya setrika', 'Pakaian dijemur', 'Waktu 12 jam'],
    price: 'Rp15.000',
  },
  {
    id: 3,
    title: 'Cuci & Setrika',
    image: '/images/ic-ironwash.png',
    features: ['Cuci 1kg', 'Setrika', 'Waktu 24 jam'],
    price: 'Rp35.000',
  },
]

export default function ServicesPage() {
  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-3xl font-bold text-blue-600 mb-6">Services</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {servicesData.map((service) => (
            <div
              key={service.id}
              className="bg-white rounded-lg shadow p-4 flex flex-col md:flex-row gap-4 hover:shadow-lg transition"
            >
              {/* Image */}
              <img
                src={service.image}
                alt={service.title}
                className="w-full md:w-24 h-24 object-cover rounded"
              />

              {/* Content */}
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-blue-800">{service.title}</h2>
                  <ul className="list-disc list-inside text-blue-600 mt-2 space-y-1">
                    {service.features.map((feature, idx) => (
                      <li key={idx}>{feature}</li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <span className="font-bold text-blue-600">{service.price}</span>
                  <Button className="bg-blue-500 text-white hover:bg-blue-600 transition-colors">
                    Pilih
                    </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}