// src/components/layout/AppLayout.tsx
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './Topbar'
import AIAssistant from '../UI/AIAssistant'

export default function AppLayout() {
  return (
    <div className="flex h-screen bg-[#dce6f5] dark:bg-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
      <AIAssistant />
    </div>
  )
}