// src/pages/auth/RegisterPage.tsx
import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authService } from '../../services/auth.service'
import type { Role } from '../../types/permissions'

interface RegisterForm {
  name: string; email: string; password: string; role: Role
}

const FEATURES = [
  'Real-time inventory tracking',
  'Advanced multi-channel sales sync',
  'Enterprise-grade security & support',
]

export default function RegisterPage() {
  const [form, setForm]       = useState<RegisterForm>({ name: '', email: '', password: '', role: 'seller' })
  const [showPw, setShowPw]   = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState(false)
  const navigate              = useNavigate()

  const set = (k: keyof RegisterForm) =>
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [k]: e.target.value }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); setError('')
    if (form.password.length < 8) { setError('Le mot de passe doit contenir au moins 8 caractères.'); return }
    setLoading(true)
    try {
      await authService.register(form)
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2000)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        .response?.data?.message ?? 'Erreur lors de la création du compte.'
      setError(msg)
    } finally { setLoading(false) }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left — branding */}
      <div className="w-[42%] bg-[#1a2e4a] flex flex-col justify-between p-10 text-white relative overflow-hidden">
        <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-white/[0.04]" />
        <div className="absolute bottom-16 right-8 w-44 h-44 rounded-full bg-white/[0.04]" />

        <div className="flex items-center gap-3 relative z-10">
          <div className="w-9 h-9 bg-[#1e4db7] rounded-lg flex items-center justify-center text-white font-bold">⊟</div>
          <span className="font-bold text-lg">SmartStock</span>
        </div>

        <div className="relative z-10">
          <h2 className="text-2xl font-bold leading-tight mb-4">
            Streamline your enterprise<br />operations with precision.
          </h2>
          <p className="text-[#8fa3bc] text-sm leading-relaxed mb-8">
            Join over 5,000 businesses managing their inventory, sales, and analytics in one unified ecosystem.
          </p>
          <ul className="flex flex-col gap-4">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-3 text-sm text-[#c8d8ea]">
                <span className="w-5 h-5 rounded-full border border-[#8fa3bc] flex items-center justify-center text-[10px] shrink-0">✓</span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Mini chart */}
        <div className="bg-white/[0.06] border border-white/10 rounded-xl p-5 relative z-10">
          <div className="flex gap-1.5 mb-3">
            {['#f97316','#facc15','#4ade80'].map((c) => (
              <div key={c} className="w-2 h-2 rounded-full" style={{ background: c }} />
            ))}
          </div>
          <div className="flex items-end gap-1 h-14">
            {[30,50,40,70,55,80,65,90,75,85].map((h, i) => (
              <div key={i} className="flex-1 rounded-t"
                style={{ height: `${h}%`, background: i >= 7 ? '#1e4db7' : 'rgba(255,255,255,0.15)' }} />
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-[10px] text-[#4a6580] tracking-widest mb-1">TRUST & RELIABILITY</p>
          <p className="text-xs text-[#8fa3bc]">© 2024 SmartStock ERP. All rights reserved.</p>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center px-16 py-12 bg-white">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold text-[#1a2e4a] mb-1">Create your account</h1>
          <p className="text-sm text-[#6b7a99] mb-8">Get started with your 14-day free trial today.</p>

          {success ? (
            <div className="bg-green-50 text-green-700 px-5 py-4 rounded-xl text-sm font-medium text-center">
              ✅ Compte créé avec succès ! Redirection vers login...
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">{error}</div>}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-[#1a2e4a] block mb-1.5">Full Name</label>
                  <input value={form.name} onChange={set('name')} placeholder="John Doe" required
                    className="w-full px-3 py-2.5 border border-[#e4e9f0] rounded-lg text-sm outline-none focus:border-[#1e4db7] transition-colors" />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#1a2e4a] block mb-1.5">Role</label>
                  <select value={form.role} onChange={set('role')}
                    className="w-full px-3 py-2.5 border border-[#e4e9f0] rounded-lg text-sm outline-none focus:border-[#1e4db7] transition-colors bg-white">
                    <option value="seller">Seller (Vendeur)</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-[#1a2e4a] block mb-1.5">Work Email</label>
                <input type="email" value={form.email} onChange={set('email')} placeholder="john@company.com" required
                  className="w-full px-3 py-2.5 border border-[#e4e9f0] rounded-lg text-sm outline-none focus:border-[#1e4db7] transition-colors" />
              </div>

              <div>
                <label className="text-sm font-medium text-[#1a2e4a] block mb-1.5">Password</label>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} value={form.password} onChange={set('password')}
                    placeholder="••••••••" required
                    className="w-full px-3 py-2.5 pr-10 border border-[#e4e9f0] rounded-lg text-sm outline-none focus:border-[#1e4db7] transition-colors" />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9aa5bf] text-base">
                    {showPw ? '🙈' : '👁'}
                  </button>
                </div>
                <p className="text-xs text-[#9aa5bf] mt-1">Must be at least 8 characters.</p>
              </div>

              <button type="submit" disabled={loading}
                className={`w-full h-12 rounded-lg text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 mt-2
                  ${loading ? 'bg-blue-300 cursor-not-allowed' : 'bg-[#1e4db7] hover:bg-[#1a3fa0]'}`}>
                {loading
                  ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Création...</>
                  : 'Create Account →'}
              </button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-[#e4e9f0]" />
                <span className="text-[11px] text-[#9aa5bf] tracking-wide">OR CONTINUE WITH</span>
                <div className="flex-1 h-px bg-[#e4e9f0]" />
              </div>

              <button type="button"
                className="w-full h-12 border border-[#e4e9f0] rounded-lg text-sm font-medium text-[#1a2e4a] hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                <span className="font-bold text-blue-500 text-lg">G</span>Sign in with Google
              </button>

              <p className="text-center text-sm text-[#6b7a99]">
                Already have an account?{' '}
                <Link to="/login" className="text-[#1e4db7] font-semibold hover:underline">Log in</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
