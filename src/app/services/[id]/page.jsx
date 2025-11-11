'use client'

import { useParams } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

export default function ServiceFormPage() {
  const params = useParams()
  const { id } = params

  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [weight, setWeight] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    alert(`Submitting laundry form for service ${id}:\nName: ${name}\nAddress: ${address}\nWeight: ${weight}kg`)
    // nanti bisa connect ke DB/API
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-blue-50">
      <h1 className="text-2xl font-bold text-blue-700 mb-4">Laundry Form - Service {id}</h1>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-md w-full max-w-md flex flex-col gap-4">
        <input
          type="text"
          placeholder="Nama"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border border-blue-200 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          required
        />
        <input
          type="text"
          placeholder="Alamat"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="border border-blue-200 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          required
        />
        <input
          type="number"
          placeholder="Berat (kg)"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          className="border border-blue-200 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          required
        />
        <Button type="submit" className="bg-blue-500 text-white hover:bg-blue-600 rounded-full px-4 py-2">
          Submit
        </Button>
      </form>
    </div>
  )
}