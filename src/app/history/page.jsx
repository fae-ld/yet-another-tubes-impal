'use client'

import DashboardLayout from '@/components/DashboardLayout'
import { Clock, Loader2, CheckCircle } from 'lucide-react'

const historyData = [
  {
    id: 1,
    service: 'Cuci Kering Cepat',
    date: '2025-11-10',
    status: 'Pending',
  },
  {
    id: 2,
    service: 'Setrika Saja',
    date: '2025-11-09',
    status: 'In Progress',
  },
  {
    id: 3,
    service: 'Cuci & Setrika',
    date: '2025-11-08',
    status: 'Done',
  },
]

export default function HistoryPage() {
  // Sort by latest date descending
  const sortedHistory = historyData.sort((a, b) => new Date(b.date) - new Date(a.date))

  const getStatusStyles = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'In Progress':
        return 'bg-blue-100 text-blue-800'
      case 'Done':
        return 'bg-green-100 text-green-800'
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
      default:
        return null
    }
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-3xl font-bold text-blue-600">History & Status</h1>
        <p className="mt-2 text-gray-700 mb-6">Cek status laundry kamu sebelumnya.</p>

        <div className="flex flex-col gap-4">
          {sortedHistory.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl shadow-md p-5 flex items-center justify-between
                         hover:shadow-lg transition cursor-pointer border border-blue-50"
            >
              <div className="flex items-center gap-4">
                {getStatusIcon(item.status)}
                <div className="flex flex-col">
                  <span className="text-blue-700 font-semibold">{item.service}</span>
                  <span className="text-gray-500 text-sm">{item.date}</span>
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusStyles(item.status)}`}
              >
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
