import { useState, useRef, useEffect } from 'react'
import axios from 'axios'

const QUICK_PROMPTS = [
  'Who is at highest risk?',
  'Missed 2+ appointments?',
  'Rural low-income patients',
  'Score Priya M.',
  'Care plan for Aisha K.',
  'High BP patients',
]

export default function ChatPanel({ apiUrl }) {
  const [messages, setMessages] = useState([
    {
      role: 'agent',
      content: 'Hello! I am MaternaWatch AI. Ask me about your patients — I can assess risk, generate care plans, and search patient records.',
      tool: null,
      citations: [],
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = async (text) => {
    const msg = text || input.trim()
    if (!msg) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: msg }])
    setLoading(true)

    try {
      const res = await axios.post(`${apiUrl}/api/chat`, { message: msg })
      const { answer, tool_used } = res.data

      const citations = []
      const citationMatch = answer.match(/\[Sources?: ([^\]]+)\]/)
      if (citationMatch) {
        citations.push(...citationMatch[1].split(',').map(s => s.trim()))
      }

      setMessages(prev => [...prev, {
        role: 'agent',
        content: answer.replace(/\[Sources?: [^\]]+\]/, '').trim(),
        tool: tool_used,
        citations,
      }])
    } catch (e) {
      setMessages(prev => [...prev, {
        role: 'agent',
        content: 'Error: ' + (e.response?.data?.detail || 'Request failed'),
        tool: null,
        citations: [],
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-140px)]">
      {/* Quick Prompts */}
      <div className="flex flex-wrap gap-2 mb-3">
        {QUICK_PROMPTS.map(p => (
          <button
            key={p}
            onClick={() => sendMessage(p)}
            disabled={loading}
            className="bg-white border border-gray-300 hover:border-[#0f6e56] hover:text-[#0f6e56] text-gray-600 text-xs px-3 py-1.5 rounded-full transition-colors disabled:opacity-50"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-3 max-h-[400px] pr-1">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
              msg.role === 'user'
                ? 'bg-blue-600 text-white rounded-br-sm'
                : 'bg-gray-100 text-gray-800 rounded-bl-sm'
            }`}>
              {msg.tool && (
                <span className="inline-block bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full font-medium mb-1 mr-1">
                  {msg.tool}
                </span>
              )}
              <div className="whitespace-pre-wrap">{msg.content}</div>
              {msg.citations?.length > 0 && (
                <div className="mt-1.5 text-xs text-blue-500 border-t border-gray-200 pt-1">
                  Sources: {msg.citations.join(', ')}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          placeholder="Ask about patients..."
          disabled={loading}
          className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f6e56] disabled:opacity-50"
        />
        <button
          onClick={() => sendMessage()}
          disabled={loading || !input.trim()}
          className="bg-[#0f6e56] hover:bg-[#0d5e49] disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  )
}
