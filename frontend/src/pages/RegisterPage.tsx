// src/pages/RegisterPage.tsx  — image 2
import { useState} from 'react'
import type { FormEvent, ChangeEventHandler } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../services/api'

interface RegisterForm {
  name:     string
  email:    string
  password: string
  role:     'admin' | 'manager' | 'cashier'
}

const FEATURES = [
  'Real-time inventory tracking',
  'Advanced multi-channel sales sync',
  'Enterprise-grade security & support',
]

export default function RegisterPage() {
  const [form, setForm]     = useState<RegisterForm>({ name: '', email: '', password: '', role: 'cashier' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()

  const set = (k: keyof RegisterForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (form.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }

    setLoading(true)
    try {
      await api.post('/auth/register', form)
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2000)
    } catch (err: unknown) {
  if (err && typeof err === 'object' && 'response' in err) {
    const axErr = err as {
      response?: {
        data?: {
          message?: string
        }
      }
    }

    setError(axErr.response?.data?.message ?? 'Erreur')
  } else {
    setError('Erreur')
  }
} finally {
      setLoading(false)
    }
  }

  const inp = (
  placeholder: string,
  value: string,
  onChange: ChangeEventHandler<HTMLInputElement>,
  type = 'text'
) => (
  <input
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    required
    style={{
      width: '100%',
      padding: '11px 14px',
      border: '1.5px solid #e4e9f0',
      borderRadius: 8,
      fontSize: 14,
      outline: 'none',
      color: '#1a2e4a'
    }}
  />
)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'var(--font)' }}>

      {/* ── Left panel — dark branding ───────────────── */}
      <div style={{
        width: '42%', background: '#1a2e4a', display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between', padding: '40px 48px', color: '#fff',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', bottom: -80, right: -80, width: 320, height: 320, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
        <div style={{ position: 'absolute', bottom: 60, right: 20, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, background: 'var(--blue-main)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, color: '#fff' }}>⊟</div>
          <span style={{ fontWeight: 700, fontSize: 18 }}>SmartStock</span>
        </div>

        {/* Headline */}
        <div>
          <h2 style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.35, marginBottom: 16 }}>
            Streamline your enterprise operations with precision.
          </h2>
          <p style={{ color: '#8fa3bc', fontSize: 14, lineHeight: 1.7, marginBottom: 32 }}>
            Join over 5,000 businesses managing their inventory, sales, and analytics in one unified ecosystem.
          </p>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {FEATURES.map((f) => (
              <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#c8d8ea' }}>
                <span style={{ width: 20, height: 20, borderRadius: '50%', border: '1.5px solid #8fa3bc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, flexShrink: 0 }}>✓</span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Mock dashboard image placeholder */}
        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: '20px', border: '1px solid rgba(255,255,255,0.1)', marginTop: 24 }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            {['#f97316','#facc15','#4ade80'].map((c) => (
              <div key={c} style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />
            ))}
          </div>
          {/* Mini chart bars */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 60 }}>
            {[30,50,40,70,55,80,65,90,75,85].map((h, i) => (
              <div key={i} style={{ flex: 1, height: `${h}%`, background: i >= 7 ? '#1e4db7' : 'rgba(255,255,255,0.15)', borderRadius: '3px 3px 0 0' }} />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 24 }}>
          <p style={{ fontSize: 10, color: '#4a6580', letterSpacing: '0.1em', marginBottom: 4 }}>TRUST & RELIABILITY</p>
          <p style={{ fontSize: 12, color: '#8fa3bc' }}>© 2024 SmartStock ERP. All rights reserved.</p>
        </div>
      </div>

      {/* ── Right panel — register form ─────────────── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 60px', background: '#fff' }}>
        <div style={{ width: '100%', maxWidth: 460 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1a2e4a', marginBottom: 6 }}>Create your account</h1>
          <p style={{ fontSize: 14, color: '#6b7a99', marginBottom: 32 }}>Get started with your 14-day free trial today.</p>

          {success ? (
            <div style={{ background: '#dcfce7', color: '#16a34a', padding: '16px 20px', borderRadius: 10, fontSize: 14, fontWeight: 500, textAlign: 'center' }}>
              ✅ Compte créé avec succès ! Redirection vers login...
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && (
                <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, marginBottom: 18, fontSize: 13 }}>{error}</div>
              )}

              {/* Full Name + Role */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#1a2e4a', display: 'block', marginBottom: 6 }}>Full Name</label>
                  {inp('John Doe', form.name, set('name'))}
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#1a2e4a', display: 'block', marginBottom: 6 }}>Role</label>
                  <select value={form.role} onChange={set('role')}
                    style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #e4e9f0', borderRadius: 8, fontSize: 14, background: '#fff', color: '#1a2e4a', outline: 'none' }}>
                    <option value="cashier">Cashier</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              {/* Work Email */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#1a2e4a', display: 'block', marginBottom: 6 }}>Work Email</label>
                {inp('john@company.com', form.email, set('email'), 'email')}
              </div>

              {/* Password */}
              <div style={{ marginBottom: 8 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#1a2e4a', display: 'block', marginBottom: 6 }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPw ? 'text' : 'password'}
                    placeholder="••••••••" value={form.password}
                    onChange={set('password')} required
                    style={{ width: '100%', padding: '11px 44px 11px 14px', border: '1.5px solid #e4e9f0', borderRadius: 8, fontSize: 14, outline: 'none' }}
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9aa5bf', fontSize: 16 }}>
                    {showPw ? '🙈' : '👁'}
                  </button>
                </div>
                <p style={{ fontSize: 12, color: '#9aa5bf', marginTop: 5 }}>Must be at least 8 characters.</p>
              </div>

              {/* Submit */}
              <button type="submit" disabled={loading}
                style={{
                  width: '100%', height: 48, background: loading ? '#93aee0' : 'var(--blue-main)',
                  color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer', marginTop: 10,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}>
                {loading ? 'Création...' : 'Create Account →'}
              </button>

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
                <div style={{ flex: 1, height: 1, background: '#e4e9f0' }} />
                <span style={{ fontSize: 11, color: '#9aa5bf', letterSpacing: '0.06em' }}>OR CONTINUE WITH</span>
                <div style={{ flex: 1, height: 1, background: '#e4e9f0' }} />
              </div>

              {/* Google */}
              <button type="button"
                style={{ width: '100%', height: 46, border: '1.5px solid #e4e9f0', borderRadius: 8, background: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: '#1a2e4a' }}>
                <span style={{ fontSize: 18 }}>G</span> Sign in with Google
              </button>

              {/* Login link */}
              <p style={{ textAlign: 'center', marginTop: 22, fontSize: 13, color: '#6b7a99' }}>
                Already have an account?{' '}
                <Link to="/login" style={{ color: 'var(--blue-main)', fontWeight: 600 }}>Log in</Link>
              </p>

              {/* Footer links */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 16 }}>
                {['Privacy Policy', 'Terms of Service'].map((l) => (
                  <a key={l} href="#" style={{ fontSize: 12, color: '#9aa5bf' }}>{l}</a>
                ))}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
