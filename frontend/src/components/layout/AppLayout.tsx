// src/components/layout/AppLayout.tsx
import type { ReactNode } from 'react'
import Sidebar from './Sidebar'
import Topbar  from './Topbar'

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#f4f6f9]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
