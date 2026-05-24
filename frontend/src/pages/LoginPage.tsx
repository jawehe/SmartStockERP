// src/pages/LoginPage.tsx
import { useState} from 'react'
import type { FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import type { ApiResponse, User } from '../types'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [remember, setRemember] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const { login }  = useAuth()
  const navigate   = useNavigate()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post<ApiResponse<{ access_token: string; refresh_token: string; user: User }>>('/auth/login', { email, password })
      login(res.data.data.access_token, res.data.data.user)
      navigate('/dashboard')
    } catch (err: unknown) {
  if (err && typeof err === 'object' && 'response' in err) {
    const axErr = err as {
      response?: {
        data?: {
          message?: string
        }
      }
    }

    setError(
      axErr.response?.data?.message ??
      'Email ou mot de passe incorrect.'
    )
  } else {
    setError('Email ou mot de passe incorrect.')
  }
} finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#dce6f5',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
        <div style={{ width: 42, height: 42, background: 'var(--blue-main)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: '#fff' }}>⊟</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 18, color: '#1a2e4a' }}>SmartStock</div>
          <div style={{ fontSize: 10, letterSpacing: '0.12em', color: '#6b7a99' }}>ENTERPRISE SUITE</div>
        </div>
      </div>

      {/* Card */}
      <div style={{ background: '#fff', borderRadius: 16, padding: '36px 40px', width: '100%', maxWidth: 400, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6, color: '#1a2e4a' }}>Welcome back</h1>
        <p style={{ color: '#6b7a99', fontSize: 14, marginBottom: 28 }}>Please enter your credentials to access your dashboard.</p>

        {error && (
          <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Email */}
          <label style={{ fontSize: 13, fontWeight: 500, color: '#1a2e4a', display: 'block', marginBottom: 6 }}>Email Address</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1.5px solid #e4e9f0', borderRadius: 8, padding: '0 14px', marginBottom: 18, height: 44 }}>
            <span style={{ color: '#9aa5bf' }}>✉</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com" required
              style={{ border: 'none', outline: 'none', flex: 1, fontSize: 14, color: '#1a2e4a' }} />
          </div>

          {/* Password */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#1a2e4a' }}>Password</label>
            <button type="button" style={{ background: 'none', border: 'none', color: 'var(--blue-main)', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
              Forgot password?
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1.5px solid #e4e9f0', borderRadius: 8, padding: '0 14px', marginBottom: 18, height: 44 }}>
            <span style={{ color: '#9aa5bf' }}>🔒</span>
            <input type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" required
              style={{ border: 'none', outline: 'none', flex: 1, fontSize: 14 }} />
            <button type="button" onClick={() => setShowPw(!showPw)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9aa5bf', fontSize: 16 }}>
              {showPw ? '🙈' : '👁'}
            </button>
          </div>

          {/* Remember */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, fontSize: 13, color: '#6b7a99', cursor: 'pointer' }}>
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)}
              style={{ accentColor: 'var(--blue-main)', width: 15, height: 15 }} />
            Keep me logged in for 30 days
          </label>

          <button type="submit" disabled={loading}
            style={{
              width: '100%', height: 46, background: loading ? '#93aee0' : 'var(--blue-main)',
              color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
            {loading ? 'Connexion...' : 'Sign In to SmartStock →'}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
          <div style={{ flex: 1, height: 1, background: '#e4e9f0' }} />
          <span style={{ fontSize: 12, color: '#9aa5bf' }}>Or continue with</span>
          <div style={{ flex: 1, height: 1, background: '#e4e9f0' }} />
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          {['Google Workspace', 'Azure AD'].map((p) => (
            <button key={p} style={{ flex: 1, height: 40, border: '1.5px solid #e4e9f0', borderRadius: 8, background: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer', color: '#1a2e4a' }}>
              {p}
            </button>
          ))}
        </div>

        {/* Link to register */}
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#6b7a99' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--blue-main)', fontWeight: 500 }}>Create account</Link>
        </p>
      </div>

      {/* Footer */}
      <div style={{ marginTop: 28, fontSize: 12, color: '#6b7a99', textAlign: 'center' }}>
        <div style={{ marginBottom: 8 }}>© 2024 SmartStock ERP. All rights reserved.</div>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
          {['Privacy Policy', 'Terms of Service', 'Contact Support'].map((l) => (
            <a key={l} href="#" style={{ color: 'var(--blue-main)', fontSize: 12 }}>{l}</a>
          ))}
        </div>
      </div>
    </div>
  )
}
