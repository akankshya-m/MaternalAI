import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from 'recharts'

const riskData = [
  { level: 'HIGH', count: 4, color: '#ef4444' },
  { level: 'MEDIUM', count: 6, color: '#f59e0b' },
  { level: 'LOW', count: 5, color: '#22c55e' },
]

export default function ImpactPanel() {
  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-red-600">4</div>
          <div className="text-xs text-red-500 mt-1">High-Risk Flagged</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-green-600">2</div>
          <div className="text-xs text-green-500 mt-1">Prevented Admissions</div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-blue-600">15</div>
          <div className="text-xs text-blue-500 mt-1">Care Plans Generated</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-purple-600">73%</div>
          <div className="text-xs text-purple-500 mt-1">Equity Coverage</div>
        </div>
      </div>

      {/* Risk Distribution Chart */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Risk Distribution</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={riskData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="level" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(value) => [value, 'Patients']}
              contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
            />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
              {riskData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Equity Grid */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Equity Coverage</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Rural Patients', value: 7, color: 'text-orange-600 bg-orange-50 border-orange-200' },
            { label: 'Low Income', value: 6, color: 'text-red-600 bg-red-50 border-red-200' },
            { label: 'No Transport Access', value: 4, color: 'text-purple-600 bg-purple-50 border-purple-200' },
            { label: 'Missed 2+ Appts', value: 6, color: 'text-amber-600 bg-amber-50 border-amber-200' },
          ].map(item => (
            <div key={item.label} className={`border rounded-lg p-3 flex items-center gap-3 ${item.color}`}>
              <span className="text-2xl font-bold">{item.value}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Info Footer */}
      <div className="bg-[#0f6e56]/5 border border-[#0f6e56]/20 rounded-xl p-4 text-sm text-[#0f6e56]">
        <strong>Impact:</strong> MaternaWatch AI flagged 4 high-risk patients for immediate intervention,
        potentially preventing 2 hospital admissions. 73% of marginalized patients (rural, low-income,
        no transport) are now covered by AI-generated care plans.
      </div>
    </div>
  )
}
