// src/pages/shared/ProfilePage.tsx
import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../../components/UI/Button'

export default function ProfilePage() {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [phone, setPhone] = useState('+216 99 999 999')
  const [address, setAddress] = useState('Tunis, Tunisia')

  const handleSave = () => {
    console.log('Saving profile:', { name, email, phone, address })
    setIsEditing(false)
    // Ici tu feras l'appel API pour sauvegarder
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1a2e4a]">My Profile</h1>
          <p className="text-[#6b7a99] text-sm mt-0.5">Manage your personal information and preferences</p>
        </div>
        <div className="flex gap-2.5">
          {!isEditing ? (
            <Button icon="✏️" onClick={() => setIsEditing(true)}>Edit Profile</Button>
          ) : (
            <>
              <Button variant="secondary" onClick={() => setIsEditing(false)}>Cancel</Button>
              <Button icon="💾" onClick={handleSave}>Save Changes</Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="col-span-1">
          <div className="bg-white border border-[#e4e9f0] rounded-2xl p-6 text-center">
            <div className="w-24 h-24 mx-auto bg-[#1e4db7] rounded-full flex items-center justify-center text-white text-3xl font-bold mb-4">
              {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
            </div>
            <h2 className="text-lg font-semibold text-[#1a2e4a]">{user?.name || 'User'}</h2>
            <p className="text-sm text-[#6b7a99] capitalize">{user?.role}</p>
            <div className="mt-4 pt-4 border-t border-[#e4e9f0]">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-[#6b7a99]">Member since:</span>
                <span className="text-[#1a2e4a]">Jan 2024</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#6b7a99]">Last login:</span>
                <span className="text-[#1a2e4a]">Today at 10:30 AM</span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <div className="col-span-2">
          <div className="bg-white border border-[#e4e9f0] rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-[#1a2e4a] mb-4">Personal Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1a2e4a] mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!isEditing}
                  className={`w-full border border-[#e4e9f0] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#1e4db7] transition-colors ${!isEditing ? 'bg-gray-50' : ''}`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1a2e4a] mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!isEditing}
                  className={`w-full border border-[#e4e9f0] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#1e4db7] transition-colors ${!isEditing ? 'bg-gray-50' : ''}`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1a2e4a] mb-1.5">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={!isEditing}
                  className={`w-full border border-[#e4e9f0] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#1e4db7] transition-colors ${!isEditing ? 'bg-gray-50' : ''}`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1a2e4a] mb-1.5">Address</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  disabled={!isEditing}
                  rows={3}
                  className={`w-full border border-[#e4e9f0] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#1e4db7] transition-colors resize-none ${!isEditing ? 'bg-gray-50' : ''}`}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}