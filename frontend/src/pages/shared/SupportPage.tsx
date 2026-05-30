// src/pages/shared/SupportPage.tsx
import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../../components/UI/Button'

export default function SupportPage() {
  const { user } = useAuth()
  const [message, setMessage] = useState('')
  const [subject, setSubject] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Support ticket:', { subject, message, user })
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 3000)
    setSubject('')
    setMessage('')
  }

  return (
    <div>
      {/* Header comme dashboard */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1a2e4a]">Support Center</h1>
          <p className="text-[#6b7a99] text-sm mt-0.5">Get help and technical support for SmartStock ERP</p>
        </div>
        <div className="flex gap-2.5">
          <Button variant="secondary" icon="📄">Documentation</Button>
          <Button icon="💬">Live Chat</Button>
        </div>
      </div>

      {/* Stats Cards comme dashboard */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 border border-[#e4e9f0]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#f0f4ff] flex items-center justify-center text-2xl">📧</div>
            <div>
              <div className="text-xs text-[#6b7a99] uppercase tracking-wide">Email Support</div>
              <div className="text-sm font-medium text-[#1a2e4a] mt-1">support@smartstock.com</div>
              <div className="text-xs text-green-600 mt-1">✓ 24h response time</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-[#e4e9f0]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#f0f4ff] flex items-center justify-center text-2xl">📞</div>
            <div>
              <div className="text-xs text-[#6b7a99] uppercase tracking-wide">Phone Support</div>
              <div className="text-sm font-medium text-[#1a2e4a] mt-1">+1 (555) 123-4567</div>
              <div className="text-xs text-[#6b7a99] mt-1">Mon-Fri, 9am-6pm</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-[#e4e9f0]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#f0f4ff] flex items-center justify-center text-2xl">💬</div>
            <div>
              <div className="text-xs text-[#6b7a99] uppercase tracking-wide">Live Chat</div>
              <div className="text-sm font-medium text-[#1a2e4a] mt-1">Available Now</div>
              <div className="text-xs text-green-600 mt-1">✓ Avg wait: 2min</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_320px] gap-6">
        {/* Ticket Form */}
        <div className="bg-white border border-[#e4e9f0] rounded-2xl p-6">
          <div className="mb-5">
            <div className="font-semibold text-base text-[#1a2e4a]">Open a Support Ticket</div>
            <div className="text-xs text-[#6b7a99] mt-0.5">Our team will respond within 24 hours</div>
          </div>

          {submitted && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
              ✅ Ticket submitted successfully! We'll get back to you soon.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1a2e4a] mb-1.5">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief description of your issue"
                className="w-full border border-[#e4e9f0] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#1e4db7] transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1a2e4a] mb-1.5">Category</label>
              <select className="w-full border border-[#e4e9f0] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#1e4db7] transition-colors">
                <option>Technical Issue</option>
                <option>Billing Question</option>
                <option>Feature Request</option>
                <option>Account Management</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1a2e4a] mb-1.5">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                placeholder="Describe your issue in detail..."
                className="w-full border border-[#e4e9f0] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#1e4db7] transition-colors resize-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1a2e4a] mb-1.5">Attachments (Optional)</label>
              <input
                type="file"
                className="w-full border border-[#e4e9f0] rounded-lg px-3 py-2 text-sm file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:bg-[#1e4db7] file:text-white hover:file:bg-[#1a3fa0]"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-[#1e4db7] hover:bg-[#1a3fa0] text-white rounded-lg text-sm font-medium transition-colors"
            >
              Submit Ticket →
            </button>
          </form>
        </div>

        {/* FAQ Section */}
        <div className="space-y-6">
          <div className="bg-white border border-[#e4e9f0] rounded-2xl p-6">
            <div className="font-semibold text-base text-[#1a2e4a] mb-4">Frequently Asked Questions</div>
            <div className="space-y-3">
              {[
                { q: "How to add new products?", a: "Go to Products page and click 'Add New Product' button" },
                { q: "How to generate sales report?", a: "Navigate to Analytics page and select desired date range" },
                { q: "How to manage user permissions?", a: "Admins can manage users from the Users page" },
              ].map((faq, i) => (
                <details key={i} className="group border-b border-[#e4e9f0] last:border-0 pb-3 last:pb-0">
                  <summary className="cursor-pointer py-2 text-sm font-medium text-[#1a2e4a] hover:text-[#1e4db7] transition-colors">
                    {faq.q}
                  </summary>
                  <p className="mt-2 pb-2 text-sm text-[#6b7a99] pl-2">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-6">
            <div className="text-center">
              <div className="text-3xl mb-3">📚</div>
              <div className="font-semibold text-[#1a2e4a] mb-2">Knowledge Base</div>
              <p className="text-sm text-[#6b7a99] mb-4">Browse our comprehensive documentation</p>
              <button className="text-[#1e4db7] text-sm font-medium hover:underline">
                View Documentation →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}