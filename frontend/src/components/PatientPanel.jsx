import { useState } from 'react'
import axios from 'axios'

const PATIENTS = [
  { name: 'Priya M.', week: 32, risk: 'HIGH', area: 'rural', income: 'low', transport: 'none', bp: '158/102', hb: 8.2, missed: 4, age: 28, complications: 'preeclampsia', lastVisit: 21 },
  { name: 'Aisha K.', week: 36, risk: 'HIGH', area: 'rural', income: 'low', transport: 'none', bp: '155/100', hb: 8.5, missed: 3, age: 34, complications: 'anaemia', lastVisit: 18 },
  { name: 'Sunita D.', week: 38, risk: 'HIGH', area: 'rural', income: 'low', transport: 'limited', bp: '152/98', hb: 8.8, missed: 3, age: 31, complications: 'gestational_diabetes', lastVisit: 15 },
  { name: 'Meena R.', week: 34, risk: 'HIGH', area: 'semi-urban', income: 'low', transport: 'none', bp: '148/96', hb: 9.0, missed: 3, age: 29, complications: 'preeclampsia', lastVisit: 14 },
  { name: 'Kavitha S.', week: 28, risk: 'MEDIUM', area: 'semi-urban', income: 'medium', transport: 'limited', bp: '135/88', hb: 10.2, missed: 2, age: 26, complications: 'anaemia', lastVisit: 10 },
  { name: 'Nisha T.', week: 12, risk: 'LOW', area: 'urban', income: 'high', transport: 'good', bp: '110/70', hb: 12.5, missed: 0, age: 22, complications: 'none', lastVisit: 3 },
]

const riskColors = {
  HIGH: 'bg-red-100 text-red-700 border-red-200',
  MEDIUM: 'bg-amber-100 text-amber-700 border-amber-200',
  LOW: 'bg-green-100 text-green-700 border-green-200',
}

export default function PatientPanel({ apiUrl }) {
  const [selected, setSelected] = useState(null)
  const [result, setResult] = useState(null)
  const [resultType, setResultType] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [showCorrection, setShowCorrection] = useState(false)
  const [correction, setCorrection] = useState('')
  const [pdfText, setPdfText] = useState('')

  const callApi = async (endpoint, patientName) => {
    setLoading(true)
    setError(null)
    setResult(null)
    setFeedback(null)
    setShowCorrection(false)
    try {
      const res = await axios.post(`${apiUrl}${endpoint}`, { patient_name: patientName })
      setResult(res.data.result)
      setResultType(endpoint === '/api/score' ? 'risk_score' : 'care_plan')
    } catch (e) {
      setError(e.response?.data?.detail || 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  const submitFeedback = async (rating) => {
    setFeedback(rating)
    if (rating === 'thumbs_up') setShowCorrection(false)
    try {
      await axios.post(`${apiUrl}/api/feedback`, {
        patient_name: selected.name,
        action: resultType,
        rating,
        correction: rating === 'thumbs_down' ? '' : '',
      })
    } catch {}
  }

  const submitCorrection = async () => {
    try {
      await axios.post(`${apiUrl}/api/feedback`, {
        patient_name: selected.name,
        action: resultType,
        rating: 'thumbs_down',
        correction,
      })
      setShowCorrection(false)
      setCorrection('')
    } catch {}
  }

  const handlePdf = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const text = await file.text()
    setPdfText(text.slice(0, 3000))
  }

  return (
    <div className="p-4 space-y-4">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-blue-700">15</div>
          <div className="text-xs text-blue-600">Total Patients</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-red-700">4</div>
          <div className="text-xs text-red-600">High Risk</div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-amber-700">6</div>
          <div className="text-xs text-amber-600">Missed Appts</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-green-700">3</div>
          <div className="text-xs text-green-600">Plans Today</div>
        </div>
      </div>

      {/* Patient Selector */}
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Select Patient</label>
        <select
          className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f6e56]"
          value={selected?.name || ''}
          onChange={e => {
            const p = PATIENTS.find(p => p.name === e.target.value)
            setSelected(p || null)
            setResult(null)
            setFeedback(null)
            setError(null)
          }}
        >
          <option value="">-- choose patient --</option>
          {PATIENTS.map(p => (
            <option key={p.name} value={p.name}>
              {p.name} · Wk {p.week} · {p.risk}
            </option>
          ))}
        </select>
      </div>

      {/* Patient Detail */}
      {selected && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-1 text-sm">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-800">{selected.name}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${riskColors[selected.risk]}`}>
              {selected.risk}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-gray-600 mt-1">
            <span>Age: {selected.age}</span>
            <span>Week: {selected.week}</span>
            <span>BP: {selected.bp}</span>
            <span>Hb: {selected.hb} g/dL</span>
            <span>Missed: {selected.missed}</span>
            <span>Last visit: {selected.lastVisit}d ago</span>
            <span>Area: {selected.area}</span>
            <span>Income: {selected.income}</span>
            <span>Transport: {selected.transport}</span>
            <span className="col-span-2">Complications: {selected.complications}</span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => callApi('/api/score', selected.name)}
              disabled={loading}
              className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-medium py-1.5 rounded-lg transition-colors"
            >
              {loading && resultType !== 'care_plan' ? '...' : 'Score Risk'}
            </button>
            <button
              onClick={() => callApi('/api/plan', selected.name)}
              disabled={loading}
              className="flex-1 bg-[#0f6e56] hover:bg-[#0d5e49] disabled:opacity-50 text-white text-sm font-medium py-1.5 rounded-lg transition-colors"
            >
              {loading && resultType === 'care_plan' ? '...' : 'Care Plan'}
            </button>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <div className="w-4 h-4 border-2 border-[#0f6e56] border-t-transparent rounded-full animate-spin" />
          AI is thinking...
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">{error}</div>
      )}

      {/* Result */}
      {result && (
        <div className="bg-white border border-gray-200 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2">
            <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full font-medium">
              {resultType === 'risk_score' ? 'risk_score_tool' : 'care_playbook_tool'}
            </span>
          </div>
          <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">{result}</pre>

          {/* Feedback */}
          {!feedback && (
            <div className="flex gap-2 pt-1">
              <button onClick={() => submitFeedback('thumbs_up')} className="text-lg hover:scale-110 transition-transform">👍</button>
              <button onClick={() => { submitFeedback('thumbs_down'); setShowCorrection(true) }} className="text-lg hover:scale-110 transition-transform">👎</button>
            </div>
          )}
          {feedback === 'thumbs_up' && <p className="text-xs text-green-600">Feedback logged!</p>}
          {showCorrection && (
            <div className="space-y-2">
              <textarea
                value={correction}
                onChange={e => setCorrection(e.target.value)}
                placeholder="What should the AI have said?"
                className="w-full text-sm border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#0f6e56]"
                rows={3}
              />
              <button
                onClick={submitCorrection}
                className="bg-[#0f6e56] text-white text-sm px-3 py-1.5 rounded-lg hover:bg-[#0d5e49]"
              >
                Submit Correction
              </button>
            </div>
          )}
        </div>
      )}

      {/* PDF Upload */}
      <div className="border-t border-gray-200 pt-3">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Upload PDF</label>
        <input type="file" accept=".pdf,.txt" onChange={handlePdf} className="mt-1 w-full text-sm text-gray-600" />
        {pdfText && <p className="text-xs text-green-600 mt-1">PDF loaded — ask about it in the chat!</p>}
      </div>
    </div>
  )
}
