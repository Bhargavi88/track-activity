import { useState, useEffect } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts'
import { formatDuration, formatDate, getTodayStr, getDatesInRange } from '../utils/format'

type Range = '7d' | '30d' | '90d'

function getStartDate(range: Range): string {
  const d = new Date()
  if (range === '7d') d.setDate(d.getDate() - 6)
  else if (range === '30d') d.setDate(d.getDate() - 29)
  else d.setDate(d.getDate() - 89)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function History(): JSX.Element {
  const [range, setRange] = useState<Range>('7d')
  const [data, setData] = useState<{ date: string; totalTime: number; label: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async (): Promise<void> => {
      setLoading(true)
      const start = getStartDate(range)
      const end = getTodayStr()
      const raw = await window.api.getStatsRange(start, end)
      const rawMap = new Map(raw.map((r) => [r.date, r.totalTime]))

      // Fill all dates in range
      const dates = getDatesInRange(start, end)
      const filled = dates.map((d) => ({
        date: d,
        totalTime: rawMap.get(d) ?? 0,
        label: formatDate(d)
      }))
      setData(filled)
      setLoading(false)
    }
    load()
  }, [range])

  const totalTime = data.reduce((s, d) => s + d.totalTime, 0)
  const avgTime = data.length > 0 ? Math.round(totalTime / data.filter((d) => d.totalTime > 0).length || 1) : 0
  const maxDay = data.reduce((m, d) => (d.totalTime > m.totalTime ? d : m), data[0] ?? { date: '', totalTime: 0, label: '' })
  const activeDays = data.filter((d) => d.totalTime > 0).length

  const barData = data.map((d) => ({
    ...d,
    displayTime: Math.round(d.totalTime / 60) // minutes
  }))

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-text-primary">History</h1>
            <p className="text-sm text-text-secondary mt-0.5">Your activity over time</p>
          </div>
          {/* Range selector */}
          <div className="flex gap-1 bg-bg-card border border-border rounded-lg p-1">
            {(['7d', '30d', '90d'] as Range[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  range === r
                    ? 'bg-accent-purple text-white'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {r === '7d' ? '7 days' : r === '30d' ? '30 days' : '90 days'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="text-text-muted text-sm">Loading...</div>
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-bg-card border border-border rounded-xl p-4">
                <p className="text-xs text-text-muted uppercase tracking-wide mb-2">Total</p>
                <p className="text-2xl font-bold text-text-primary">{formatDuration(totalTime)}</p>
                <p className="text-xs text-text-secondary mt-1">all time tracked</p>
              </div>
              <div className="bg-bg-card border border-border rounded-xl p-4">
                <p className="text-xs text-text-muted uppercase tracking-wide mb-2">Daily Avg</p>
                <p className="text-2xl font-bold text-accent-purple">{formatDuration(avgTime)}</p>
                <p className="text-xs text-text-secondary mt-1">on active days</p>
              </div>
              <div className="bg-bg-card border border-border rounded-xl p-4">
                <p className="text-xs text-text-muted uppercase tracking-wide mb-2">Best Day</p>
                <p className="text-2xl font-bold text-accent-green">
                  {maxDay?.totalTime ? formatDuration(maxDay.totalTime) : '—'}
                </p>
                <p className="text-xs text-text-secondary mt-1">{maxDay?.label ?? '—'}</p>
              </div>
              <div className="bg-bg-card border border-border rounded-xl p-4">
                <p className="text-xs text-text-muted uppercase tracking-wide mb-2">Active Days</p>
                <p className="text-2xl font-bold text-accent-blue">{activeDays}</p>
                <p className="text-xs text-text-secondary mt-1">out of {data.length} days</p>
              </div>
            </div>

            {/* Bar chart */}
            <div className="bg-bg-card border border-border rounded-xl p-4 mb-4">
              <h3 className="text-sm font-semibold text-text-primary mb-4">Daily Activity</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#252840" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={false}
                    interval={range === '7d' ? 0 : range === '30d' ? 6 : 14}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${v}m`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const d = payload[0].payload
                      return (
                        <div className="bg-bg-card border border-border rounded-lg px-3 py-2 shadow-xl">
                          <p className="text-xs text-text-primary font-medium">{d.label}</p>
                          <p className="text-xs text-accent-purple">{formatDuration(d.totalTime)}</p>
                        </div>
                      )
                    }}
                  />
                  <Bar
                    dataKey="displayTime"
                    fill="#7c6cf5"
                    radius={[3, 3, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Day list */}
            <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <h3 className="text-sm font-semibold text-text-primary">Daily Breakdown</h3>
              </div>
              <div className="divide-y divide-border max-h-64 overflow-y-auto">
                {[...data].reverse().map((d) => (
                  <div key={d.date} className="flex items-center gap-3 px-4 py-3">
                    <span className="text-sm text-text-secondary w-32 shrink-0">{d.label}</span>
                    <div className="flex-1 h-1.5 bg-bg-primary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent-purple rounded-full"
                        style={{
                          width: maxDay?.totalTime
                            ? `${(d.totalTime / maxDay.totalTime) * 100}%`
                            : '0%'
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-text-primary w-20 text-right shrink-0">
                      {d.totalTime > 0 ? formatDuration(d.totalTime) : <span className="text-text-muted">—</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
