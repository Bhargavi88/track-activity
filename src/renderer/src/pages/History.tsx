import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, LineChart, Line
} from 'recharts'
import { formatDuration, formatDate, getTodayStr, getDatesInRange } from '../utils/format'

type Range = '7d' | '30d' | '90d'
type ChartType = 'bar' | 'line'

function getStartDate(range: Range): string {
  const d = new Date()
  const n = range === '7d' ? 6 : range === '30d' ? 29 : 89
  d.setDate(d.getDate() - n)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function History(): JSX.Element {
  const [range, setRange] = useState<Range>('7d')
  const [chartType, setChartType] = useState<ChartType>('bar')
  const [data, setData] = useState<{ date: string; totalTime: number; label: string; mins: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async (): Promise<void> => {
      setLoading(true)
      const start = getStartDate(range)
      const end = getTodayStr()
      const raw = await window.api.getStatsRange(start, end)
      const rawMap = new Map(raw.map((r) => [r.date, r.totalTime]))
      const dates = getDatesInRange(start, end)
      setData(dates.map((d) => ({
        date: d,
        totalTime: rawMap.get(d) ?? 0,
        label: formatDate(d),
        mins: Math.round((rawMap.get(d) ?? 0) / 60)
      })))
      setLoading(false)
    }
    load()
  }, [range])

  const totalTime = data.reduce((s, d) => s + d.totalTime, 0)
  const activeDays = data.filter((d) => d.totalTime > 0)
  const avgTime = activeDays.length > 0 ? Math.round(totalTime / activeDays.length) : 0
  const maxDay = [...data].sort((a, b) => b.totalTime - a.totalTime)[0]
  const streak = calcStreak(data)

  const tickInterval = range === '7d' ? 0 : range === '30d' ? 6 : 14

  const tooltipContent = ({ active, payload }: any): JSX.Element | null => {
    if (!active || !payload?.length) return null
    const d = payload[0].payload
    return (
      <div className="bg-bg-card border border-border rounded-lg px-3 py-2 shadow-xl">
        <p className="text-xs text-text-secondary mb-1">{d.label}</p>
        <p className="text-sm font-semibold text-accent-purple">{formatDuration(d.totalTime)}</p>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-text-primary">History</h1>
            <p className="text-sm text-text-secondary mt-0.5">Activity over time</p>
          </div>
          <div className="flex gap-2">
            {/* Chart type toggle */}
            <div className="flex gap-1 bg-bg-card border border-border rounded-lg p-1">
              <button onClick={() => setChartType('bar')} className={`px-2 py-1 rounded text-xs transition-colors ${chartType === 'bar' ? 'bg-accent-purple text-white' : 'text-text-muted hover:text-text-primary'}`}>Bar</button>
              <button onClick={() => setChartType('line')} className={`px-2 py-1 rounded text-xs transition-colors ${chartType === 'line' ? 'bg-accent-purple text-white' : 'text-text-muted hover:text-text-primary'}`}>Line</button>
            </div>
            {/* Range */}
            <div className="flex gap-1 bg-bg-card border border-border rounded-lg p-1">
              {(['7d', '30d', '90d'] as Range[]).map((r) => (
                <button key={r} onClick={() => setRange(r)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${range === r ? 'bg-accent-purple text-white' : 'text-text-secondary hover:text-text-primary'}`}>
                  {r === '7d' ? '7 days' : r === '30d' ? '30 days' : '90 days'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-6 h-6 border-2 border-accent-purple border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-4 gap-4 mb-5">
              <SummaryCard label="Total" value={formatDuration(totalTime)} sub="all tracked time" color="#7c6cf5" />
              <SummaryCard label="Daily Avg" value={formatDuration(avgTime)} sub="on active days" color="#4f8ef7" />
              <SummaryCard label="Best Day" value={maxDay?.totalTime ? formatDuration(maxDay.totalTime) : '—'} sub={maxDay?.label ?? '—'} color="#34d399" />
              <SummaryCard label="Streak" value={`${streak}d`} sub={streak > 0 ? 'consecutive days' : 'no streak'} color="#fbbf24" />
            </div>

            {/* Chart */}
            <div className="bg-bg-card border border-border rounded-xl p-4 mb-4">
              <h3 className="text-sm font-semibold text-text-primary mb-4">Daily Activity</h3>
              <ResponsiveContainer width="100%" height={200}>
                {chartType === 'bar' ? (
                  <BarChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#252840" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} interval={tickInterval} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}m`} />
                    <Tooltip content={tooltipContent} />
                    <Bar dataKey="mins" fill="#7c6cf5" radius={[3, 3, 0, 0]} maxBarSize={32} />
                  </BarChart>
                ) : (
                  <LineChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#252840" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} interval={tickInterval} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}m`} />
                    <Tooltip content={tooltipContent} />
                    <Line type="monotone" dataKey="mins" stroke="#7c6cf5" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#7c6cf5' }} />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>

            {/* Daily list */}
            <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex justify-between items-center">
                <h3 className="text-sm font-semibold text-text-primary">Daily Breakdown</h3>
                <span className="text-xs text-text-muted">{activeDays.length} active days</span>
              </div>
              <div className="divide-y divide-border max-h-72 overflow-y-auto">
                {[...data].reverse().map((d) => (
                  <div key={d.date} className="flex items-center gap-3 px-4 py-2.5 hover:bg-bg-hover transition-colors">
                    <span className="text-xs text-text-muted w-24 shrink-0">{d.label}</span>
                    <div className="flex-1 h-1.5 bg-bg-primary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent-purple rounded-full transition-all"
                        style={{ width: maxDay?.totalTime ? `${(d.totalTime / maxDay.totalTime) * 100}%` : '0%' }}
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

function SummaryCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }): JSX.Element {
  return (
    <div className="bg-bg-card border border-border rounded-xl p-4">
      <p className="text-xs text-text-muted uppercase tracking-wide mb-2">{label}</p>
      <p className="text-2xl font-bold" style={{ color }}>{value}</p>
      <p className="text-xs text-text-secondary mt-1">{sub}</p>
    </div>
  )
}

function calcStreak(data: { date: string; totalTime: number }[]): number {
  const sorted = [...data].sort((a, b) => b.date.localeCompare(a.date))
  let streak = 0
  for (const d of sorted) {
    if (d.totalTime > 0) streak++
    else break
  }
  return streak
}
