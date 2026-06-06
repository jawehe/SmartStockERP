// src/components/UI/AIAssistant.tsx
import { useState, useRef, useEffect } from 'react'
import api from '../../services/api'

interface Message {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      type: 'assistant',
      content: "👋 Hello! I'm your SmartStock AI Assistant. Ask me anything about your business!\n\n💡 Try: 'What are my top selling products?' or 'Low stock alert'",
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await api.post('/ai/ask', { question: input })
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response.data.answer,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: "❌ Sorry, I'm having trouble connecting. Please try again later.",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#1e4db7] dark:bg-primary hover:bg-[#1a3fa0] dark:hover:bg-primary/80 text-white rounded-full shadow-lg flex items-center justify-center text-2xl transition-all z-50"
      >
        {isOpen ? '✕' : '🤖'}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50 border border-[#e4e9f0] dark:border-slate-700">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#1e4db7] to-[#1a3fa0] dark:from-primary dark:to-primary/80 text-white p-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🤖</span>
              <div>
                <div className="font-semibold">SmartStock AI Assistant</div>
                <div className="text-xs opacity-80">Powered by AI</div>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 dark:bg-slate-800">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-2xl ${
                    msg.type === 'user'
                      ? 'bg-[#1e4db7] dark:bg-primary text-white rounded-br-none'
                      : 'bg-gray-100 dark:bg-slate-700 text-[#1a2e4a] dark:text-white rounded-bl-none'
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                  <div className={`text-[10px] mt-1 ${
                    msg.type === 'user' 
                      ? 'text-blue-200' 
                      : 'text-gray-400 dark:text-slate-500'
                  }`}>
                    {msg.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-slate-700 p-3 rounded-2xl rounded-bl-none">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gray-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-[#e4e9f0] dark:border-slate-700 p-4 dark:bg-slate-800">
            <div className="flex gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything..."
                rows={1}
                className="flex-1 p-2 border border-[#e4e9f0] dark:border-slate-700 rounded-lg resize-none focus:outline-none focus:border-[#1e4db7] dark:focus:border-primary text-sm bg-white dark:bg-slate-900 text-[#1a2e4a] dark:text-white placeholder:text-[#9aa5bf] dark:placeholder:text-slate-500"
                style={{ minHeight: '40px', maxHeight: '100px' }}
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="px-4 py-2 bg-[#1e4db7] dark:bg-primary text-white rounded-lg hover:bg-[#1a3fa0] dark:hover:bg-primary/80 disabled:opacity-50 transition-colors"
              >
                Send
              </button>
            </div>
            <div className="text-xs text-[#9aa5bf] dark:text-slate-500 mt-2 text-center">
              Try: "Top selling products" or "Low stock alert"
            </div>
          </div>
        </div>
      )}
    </>
  )
}