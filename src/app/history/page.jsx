'use client'

import DashboardLayout from '@/components/DashboardLayout'
import { useState, useEffect } from 'react'
import OrderModal from '@/components/OrderModal'
import { Clock, Loader2, CheckCircle, XCircle } from 'lucide-react'

const historyData = [
  { id: 1, service: 'Cuci Kering Cepat', date: '2025-11-10', status: 'Pending' },
  { id: 2, service: 'Setrika Saja', date: '2025-11-09', status: 'In Progress' },
  { id: 3, service: 'Cuci & Setrika', date: '2025-11-08', status: 'Done' },
  { id: 4, service: 'Cuci Cepat', date: '2025-11-07', status: 'Batal' }
]

export default function HistoryPage() {
  const [selectedOrder, setSelectedOrder] = useState(null)

  useEffect(() => {
    const hash = window.location.hash
    if (hash.startsWith('#order-')) {
      const id = parseInt(hash.replace('#order-', ''), 10)
      const order = historyData.find(h => h.id === id)
      if (order) setSelectedOrder(order)
    }
  }, [])

  const getStatusStyles = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'In Progress':
        return 'bg-blue-100 text-blue-800'
      case 'Done':
        return 'bg-green-100 text-green-800'
      case 'Batal':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pending':
        return <Clock size={20} className="text-yellow-500" />
      case 'In Progress':
        return <Loader2 size={20} className="text-blue-500 animate-spin" />
      case 'Done':
        return <CheckCircle size={20} className="text-green-500" />
      case 'Batal':
        return <XCircle size={20} className="text-red-500" />
      default:
        return null
    }
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-3xl font-bold text-blue-600 mb-6">History & Status</h1>
        <div className="flex flex-col gap-4">
          {historyData.sort((a,b)=>new Date(b.date)-new Date(a.date)).map(item => (
            <div
              key={item.id}
              className="bg-white rounded-xl shadow-md p-5 flex items-center justify-between hover:shadow-lg transition cursor-pointer border border-blue-50"
              onClick={() => setSelectedOrder(item)}
            >
              <div className="flex items-center gap-4">
                {getStatusIcon(item.status)}
                <div className="flex flex-col">
                  <span className="text-blue-700 font-semibold">{item.service}</span>
                  <span className="text-gray-500 text-sm">{item.date}</span>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusStyles(item.status)}`}>
                {item.status}
                {/* TODO: Kalau batal masih abu, harusnya merah */}
              </span>
            </div>
          ))}
        </div>

        {/* Modal */}
        <OrderModal
          order={selectedOrder}
          open={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      </div>
    </DashboardLayout>
  )
}
