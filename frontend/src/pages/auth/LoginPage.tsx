// src/pages/auth/LoginPage.tsx
import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { authService } from '../../services/auth.service'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const { login, getDashboardPath } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const res = await authService.login(email, password)
      login(res.access_token, res.refresh_token, res.user)
      // Navigate based on role
    navigate(getDashboardPath(res.user.role), { replace: true })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        .response?.data?.message ?? 'Email ou mot de passe incorrect.'
      setError(msg)
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-[#dce6f5] flex flex-col items-center justify-center p-6">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-7">
        <div className="w-11 h-11 bg-[#1e4db7] rounded-xl flex items-center justify-center text-white text-xl font-bold">⊟</div>
        <div>
          <div className="font-bold text-lg text-[#1a2e4a]">SmartStock</div>
          <div className="text-[10px] tracking-widest text-[#6b7a99]">ENTERPRISE SUITE</div>
        </div>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl p-10 w-full max-w-md shadow-lg">
        <h1 className="text-2xl font-bold text-[#1a2e4a] mb-1">Welcome back</h1>
        <p className="text-[#6b7a99] text-sm mb-7">Please enter your credentials to access your dashboard.</p>

        {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-[#1a2e4a] block mb-1.5">Email Address</label>
            <div className="flex items-center gap-2 border border-[#e4e9f0] rounded-lg px-3 h-11 focus-within:border-[#1e4db7] transition-colors">
              
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com" required
                className="flex-1 border-none outline-none text-sm text-[#1a2e4a] bg-transparent" />
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1.5">
              <label className="text-sm font-medium text-[#1a2e4a]">Password</label>
              <Link to="/forgot-password" className="text-sm text-[#1e4db7] font-medium hover:underline">Forgot password?</Link>
            </div>
            <div className="flex items-center gap-2 border border-[#e4e9f0] rounded-lg px-3 h-11 focus-within:border-[#1e4db7] transition-colors">
              
              <input type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" required
                className="flex-1 border-none outline-none text-sm bg-transparent" />
              <button type="button" onClick={() => setShowPw(!showPw)} className="text-[#9aa5bf] text-base">
                {showPw ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className={`w-full h-12 rounded-lg text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2
              ${loading ? 'bg-blue-300 cursor-not-allowed' : 'bg-[#1e4db7] hover:bg-[#1a3fa0]'}`}>
            {loading
              ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Connexion...</>
              : 'Sign In to SmartStock →'}
          </button>
        </form>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-[#e4e9f0]" />
          <span className="text-xs text-[#9aa5bf]">Or continue with</span>
          <div className="flex-1 h-px bg-[#e4e9f0]" />
        </div>

        <div className="flex gap-3">
          {['Google Workspace', 'Azure AD'].map((p) => (
            <button key={p} className="flex-1 h-10 border border-[#e4e9f0] rounded-lg text-sm font-medium text-[#1a2e4a] hover:bg-gray-50 transition-colors">
              {p}
            </button>
          ))}
        </div>

        <p className="text-center mt-5 text-sm text-[#6b7a99]">
          Don't have an account?{' '}
          <Link to="/register" className="text-[#1e4db7] font-semibold hover:underline">Create account</Link>
        </p>
      </div>

      <div className="mt-7 text-xs text-[#6b7a99] text-center">
        <p className="mb-2">© 2024 SmartStock ERP. All rights reserved.</p>
        <div className="flex gap-4 justify-center">
          {['Privacy Policy', 'Terms of Service', 'Contact Support'].map((l) => (
            <a key={l} href="#" className="text-[#1e4db7] hover:underline">{l}</a>
          ))}
        </div>
      </div>
    </div>
  )
}
