// src/pages/shared/SettingsPage.tsx
import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../../components/UI/Button'

export default function SettingsPage() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState(true)
  const [darkMode, setDarkMode] = useState(false)
  const [language, setLanguage] = useState('en')
  const [emailAlerts, setEmailAlerts] = useState(true)

  return (
    <div>
      {/* Header comme dashboard */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1a2e4a]">Settings</h1>
          <p className="text-[#6b7a99] text-sm mt-0.5">Manage your account preferences and system configuration</p>
        </div>
        <div className="flex gap-2.5">
          <Button variant="secondary" icon="↺">Reset</Button>
          <Button icon="💾">Save Changes</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Profile Settings */}
        <div className="bg-white border border-[#e4e9f0] rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-[#f0f4ff] flex items-center justify-center text-lg">👤</div>
            <div>
              <div className="font-semibold text-base text-[#1a2e4a]">Profile Information</div>
              <div className="text-xs text-[#6b7a99]">Update your personal details</div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1a2e4a] mb-1.5">Full Name</label>
              <input
                type="text"
                defaultValue={user?.name || ''}
                placeholder="Enter your full name"
                className="w-full border border-[#e4e9f0] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#1e4db7] transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1a2e4a] mb-1.5">Email Address</label>
              <input
                type="email"
                defaultValue={user?.email || ''}
                className="w-full border border-[#e4e9f0] rounded-lg px-3 py-2.5 text-sm bg-gray-50 text-gray-500"
                disabled
              />
              <p className="text-xs text-[#6b7a99] mt-1">Email cannot be changed. Contact admin for assistance.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1a2e4a] mb-1.5">Role</label>
              <input
                type="text"
                defaultValue={user?.role?.toUpperCase() || ''}
                className="w-full border border-[#e4e9f0] rounded-lg px-3 py-2.5 text-sm bg-gray-50 text-gray-500"
                disabled
              />
            </div>
            <button className="w-full py-2.5 bg-[#1e4db7] hover:bg-[#1a3fa0] text-white rounded-lg text-sm font-medium transition-colors">
              Update Profile
            </button>
          </div>
        </div>

        {/* Password Settings */}
        <div className="bg-white border border-[#e4e9f0] rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-[#f0f4ff] flex items-center justify-center text-lg">🔒</div>
            <div>
              <div className="font-semibold text-base text-[#1a2e4a]">Security</div>
              <div className="text-xs text-[#6b7a99]">Change your password and security settings</div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1a2e4a] mb-1.5">Current Password</label>
              <input type="password" className="w-full border border-[#e4e9f0] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#1e4db7] transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1a2e4a] mb-1.5">New Password</label>
              <input type="password" className="w-full border border-[#e4e9f0] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#1e4db7] transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1a2e4a] mb-1.5">Confirm Password</label>
              <input type="password" className="w-full border border-[#e4e9f0] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#1e4db7] transition-colors" />
            </div>
            <button className="w-full py-2.5 bg-[#1e4db7] hover:bg-[#1a3fa0] text-white rounded-lg text-sm font-medium transition-colors">
              Update Password
            </button>
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-white border border-[#e4e9f0] rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-[#f0f4ff] flex items-center justify-center text-lg">⚙</div>
            <div>
              <div className="font-semibold text-base text-[#1a2e4a]">Preferences</div>
              <div className="text-xs text-[#6b7a99]">Customize your experience</div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <div className="font-medium text-sm text-[#1a2e4a]">Email Notifications</div>
                <div className="text-xs text-[#6b7a99]">Receive updates about sales and inventory</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications}
                  onChange={(e) => setNotifications(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1e4db7]"></div>
              </label>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <div className="font-medium text-sm text-[#1a2e4a]">Dark Mode</div>
                <div className="text-xs text-[#6b7a99]">Switch between light and dark theme</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={darkMode}
                  onChange={(e) => setDarkMode(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1e4db7]"></div>
              </label>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <div className="font-medium text-sm text-[#1a2e4a]">Low Stock Alerts</div>
                <div className="text-xs text-[#6b7a99]">Get notified when stock is low</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={(e) => setEmailAlerts(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1e4db7]"></div>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1a2e4a] mb-1.5">Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full border border-[#e4e9f0] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#1e4db7] transition-colors"
              >
                <option value="en">English (US)</option>
                <option value="fr">Français</option>
                <option value="es">Español</option>
                <option value="ar">العربية</option>
              </select>
            </div>
          </div>
        </div>

        {/* Danger Zone - Admin only */}
        {user?.role === 'admin' && (
          <div className="bg-white border-2 border-red-100 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-lg">⚠️</div>
              <div>
                <div className="font-semibold text-base text-red-600">Danger Zone</div>
                <div className="text-xs text-[#6b7a99]">Irreversible actions - proceed with caution</div>
              </div>
            </div>
            
            <div className="space-y-3">
              <button className="w-full text-left px-4 py-3 border border-red-200 rounded-lg text-red-600 hover:bg-red-50 transition-colors flex items-center justify-between">
                <span>🗑️ Clear All System Data</span>
                <span className="text-xs">⚠️ Permanent</span>
              </button>
              <button className="w-full text-left px-4 py-3 border border-red-200 rounded-lg text-red-600 hover:bg-red-50 transition-colors flex items-center justify-between">
                <span>👥 Reset All User Permissions</span>
                <span className="text-xs">⚠️ Requires setup</span>
              </button>
              <button className="w-full text-left px-4 py-3 border border-red-200 rounded-lg text-red-600 hover:bg-red-50 transition-colors flex items-center justify-between">
                <span>🚫 Deactivate Account</span>
                <span className="text-xs">⚠️ Cannot undo</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}