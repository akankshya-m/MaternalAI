import { useState } from 'react'
import PatientPanel from './components/PatientPanel'
import ChatPanel from './components/ChatPanel'
import ImpactPanel from './components/ImpactPanel'
import FeedbackLog from './components/FeedbackLog'

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function App() {
  const [activeTab, setActiveTab] = useState('chat')

  const tabs = [
    { id: 'chat', label: 'Agent Chat' },
    { id: 'impact', label: 'Impact Panel' },
    { id: 'feedback', label: 'Feedback Log' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#0f6e56] text-white px-4 py-3 flex items-center gap-3 shadow-md">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold tracking-tight">MaternaWatch AI</span>
          <span className="bg-green-400 text-green-900 text-xs font-semibold px-2 py-0.5 rounded-full animate-pulse">
            Live
          </span>
        </div>
        <span className="ml-auto text-sm text-green-200">Maternal Health Equity ·</span>
      </header>

      {/* Main Layout */}
      <div className="flex flex-col md:flex-row min-h-[calc(100vh-56px)]">
        {/* Left: Patient Panel */}
        <div className="w-full md:w-80 bg-white border-r border-gray-200 shrink-0">
          <PatientPanel apiUrl={apiUrl} />
        </div>

        {/* Right: Tabbed Content */}
        <div className="flex-1 flex flex-col">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 bg-white">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-b-2 border-[#0f6e56] text-[#0f6e56]'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-auto p-4">
            {activeTab === 'chat' && <ChatPanel apiUrl={apiUrl} />}
            {activeTab === 'impact' && <ImpactPanel />}
            {activeTab === 'feedback' && <FeedbackLog apiUrl={apiUrl} />}
          </div>
        </div>
      </div>
    </div>
  )
}
