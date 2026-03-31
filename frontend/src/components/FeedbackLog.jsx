import { useState, useEffect } from 'react'
import axios from 'axios'

export default function FeedbackLog({ apiUrl }) {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchFeedback = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await axios.get(`${apiUrl}/api/feedback`)
      setRecords(res.data)
    } catch (e) {
      setError('Failed to load feedback')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchFeedback() }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">Human-in-the-Loop Feedback</h3>
        <button
          onClick={fetchFeedback}
          disabled={loading}
          className="text-sm text-[#0f6e56] hover:underline disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">{error}</div>
      )}

      {!loading && records.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-2">📋</div>
          <p className="text-sm">No feedback yet</p>
          <p className="text-xs mt-1">Use thumbs up/down buttons after scoring a patient</p>
        </div>
      )}

      <div className="space-y-2">
        {records.map(r => (
          <div key={r.id} className="bg-white border border-gray-200 rounded-xl p-4 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm text-gray-800">{r.patient_name}</span>
              <span className={`text-lg ${r.rating === 'thumbs_up' ? '' : ''}`}>
                {r.rating === 'thumbs_up' ? '👍' : '👎'}
              </span>
            </div>
            <div className="flex gap-2 text-xs text-gray-500">
              <span className="bg-gray-100 px-2 py-0.5 rounded-full">{r.action}</span>
              <span>{new Date(r.timestamp).toLocaleString()}</span>
            </div>
            {r.correction && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-lg p-2 mt-1">
                <span className="font-medium">Correction: </span>{r.correction}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
