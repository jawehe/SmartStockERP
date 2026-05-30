import { useState } from 'react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // API CALL HERE
    console.log('Reset password for:', email)

    setSuccess(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#dce6f5]">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold mb-2 text-[#1a2e4a]">
          Forgot Password
        </h1>

        <p className="text-sm text-[#6b7a99] mb-6">
          Enter your email to receive a reset link.
        </p>

        {success && (
          <div className="bg-green-50 text-green-600 p-3 rounded-lg mb-4 text-sm">
            Reset link sent successfully.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            required
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-11 border border-[#e4e9f0] rounded-lg px-3 outline-none"
          />

          <button
            type="submit"
            className="w-full h-11 bg-[#1e4db7] text-white rounded-lg font-semibold hover:bg-[#1a3fa0]"
          >
            Send Reset Link
          </button>
        </form>
      </div>
    </div>
  )
}