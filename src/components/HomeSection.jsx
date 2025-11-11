'use client'

import { useState } from 'react'
import { LogOut, Home, Clock, Bell, Settings, Menu } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function HomeSection({ user }) {
  const router = useRouter()
  const [active, setActive] = useState('home')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const menuItems = [
    { name: 'Home', icon: <Home size={24} />, key: 'home', href: '#home' },
    { name: 'Layanan', icon: <Clock size={24} />, key: 'layanan', href: '#layanan' },
    { name: 'History & Status', icon: <Clock size={24} />, key: 'history', href: '#history' },
    { name: 'Notifikasi', icon: <Bell size={24} />, key: 'notifikasi', href: '#notifikasi' },
    { name: 'Settings', icon: <Settings size={24} />, key: 'settings', href: '#settings' },
    { name: 'Logout', icon: <LogOut size={24} />, key: 'logout', href: '#logout', isLogout: true },
  ]

  const handleMenuClick = async (item) => {
    if (item.key === 'logout') {
      await supabase.auth.signOut()
    } else {
      setActive(item.key)
      router.push(item.href)
      setSidebarOpen(false)
    }
  }

  return (
    <div className="flex w-full h-screen bg-gray-50 relative">
      {/* Hamburger fixed mobile */}
      <button 
        className="fixed top-4 left-4 z-50 p-2 rounded-md bg-white shadow-md md:hidden"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        <Menu size={24} />
      </button>

      {/* Sidebar */}
      <aside className={`fixed md:static top-0 left-0 z-40 h-screen w-20 bg-white rounded-tr-xl rounded-br-xl shadow-md border-r border-gray-200 transform
                        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out md:translate-x-0`}>
        {/* Mobile offset mt-20 untuk hamburger, desktop center vertikal */}
        <div className="flex flex-col items-center gap-6 h-full mt-20 md:mt-0 md:justify-center">
          {menuItems.map((item) => {
            const isActive = active === item.key
            return (
              <div
                key={item.key}
                className={`group relative flex items-center justify-center w-12 h-12 rounded-lg cursor-pointer transition-all
                  ${isActive ? 'bg-blue-600 text-white' : item.isLogout ? 'text-red-600 hover:bg-red-600 hover:text-white' : 'text-blue-600 hover:bg-blue-600 hover:text-white'}
                `}
                onClick={() => handleMenuClick(item)}
              >
                {item.icon}
                {/* Tooltip desktop */}
                <span className="hidden md:block absolute left-14 top-1/2 -translate-y-1/2 bg-black text-white text-sm px-2 py-1 rounded opacity-0 group-hover:opacity-100 translate-x-[-10px] group-hover:translate-x-0 transition-all whitespace-nowrap pointer-events-none z-50">
                  {item.name}
                </span>
              </div>
            )
          })}
        </div>
      </aside>

      {/* Konten utama */}
      <div className="flex-1 overflow-auto md:pl-20 pt-20 relative">
        {/* Floating profile fixed */}
        <div className="fixed top-4 right-4 flex items-center gap-3 bg-white rounded-xl shadow-md px-4 py-2 z-50">
          <img 
            src="https://avatar.iran.liara.run/public" 
            alt="Profile" 
            className="w-10 h-10 rounded-full object-cover"
          />
          <span className="font-medium text-gray-800">
            {user?.user_metadata?.full_name || 'Nama User'}
          </span>
        </div>

        {/* Konten berdasarkan active menu */}
        {active === 'home' && (
          <>
            <h1 className="text-3xl font-bold text-blue-600">Welcome, {user?.email || 'User'}!</h1>
            <p className="mt-4 text-gray-700">Ini halaman utama kamu.</p>
          </>
        )}
        {active === 'layanan' && <p className="text-gray-700">Ini halaman Layanan</p>}
        {active === 'history' && <p className="text-gray-700">Ini halaman History & Status</p>}
        {active === 'notifikasi' && <p className="text-gray-700">Ini halaman Notifikasi</p>}
        {active === 'settings' && <p className="text-gray-700">Ini halaman Settings</p>}
      </div>
    </div>
  )
}