import { useState, useEffect, useCallback } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts'
import type { DayStats } from '../types'
import StatCard from '../components/StatCard'
import AppBar from '../components/AppBar'
import DatePicker from '../components/DatePicker'
import CategoryModal from '../components/CategoryModal'
import { formatDuration, formatDurationShort, getTodayStr } from '../utils/format'

const CustomTooltip = ({
  active,
  payload
}: {
  active?: boolean
  payload?: { name: string; value: number; payload: { color: string } }[]
}): JSX.Element | null => {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div className="bg-bg-card border border-border rounded-lg px-3 py-2 shadow-xl">
      <p className="text-sm font-medium" style={{ color: d.payload.color }}>
        {d.name}
      </p>
      <p className="text-xs text-text-secondary">{formatDuration(d.value)}</p>
    </div>
  )
}

export default function Dashboard(): JSX.Element {
  const [date, setDate] = useState(getTodayStr())
  const [stats, setStats] = useState<DayStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [categoryModal, setCategoryModal] = useState<{
    appName: string
    category: string
  } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const data = await window.api.getStatsDate(date)
    setStats(data)
    setLoading(false)
  }, [date])

  useEffect(() => {
    load()
    // Auto refresh every 30s for today
    if (date === getTodayStr()) {
      const t = setInterval(load, 30000)
      return () => clearInterval(t)
    }
    return undefined
  }, [load, date])

  const handleCategorySave = async (category: string): Promise<void> => {
    if (!categoryModal) return
    await window.api.setCategory(categoryModal.appName, category)
    setCategoryModal(null)
    load()
  }

  const pieData =
    stats?.appStats.slice(0, 8).map((s) => ({
      name: s.appName,
      value: s.totalDuration,
      color: s.color
    })) ?? []

  const barData = stats?.hourlyActivity
    .filter((h) => h.duration > 0)
    .map((h) => ({
      label: h.label,
      duration: h.duration,
      displayDuration: Math.round(h.duration / 60) // minutes for display
    })) ?? []

  const maxDuration = stats?.appStats[0]?.totalDuration ?? 1

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-text-primary">Dashboard</h1>
            <p className="text-sm text-text-secondary mt-0.5">Your activity overview</p>
          </div>
          <DatePicker date={date} onChange={setDate} />
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-text-muted text-sm">Loading...</div>
          </div>
        ) : !stats || stats.totalTime === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="text-4xl mb-3">⏱</div>
            <p className="text-text-secondary">No activity recorded for this day</p>
            <p className="text-text-muted text-sm mt-1">Start using your computer to track time</p>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <StatCard
                label="Total Time"
                value={formatDuration(stats.totalTime)}
                sub="tracked today"
                icon="⏱"
              />
              <StatCard
                label="Top App"
                value={stats.topApp}
                sub={formatDuration(stats.appStats[0]?.totalDuration ?? 0)}
                icon="🏆"
              />
              <StatCard
                label="Top Category"
                value={stats.topCategory}
                sub={`${stats.appStats.filter((a) => a.category === stats.topCategory).length} apps`}
                icon="📊"
              />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-5 gap-4 mb-6">
              {/* Pie Chart */}
              <div className="col-span-2 bg-bg-card border border-border rounded-xl p-4">
                <h3 className="text-sm font-semibold text-text-primary mb-3">By App</h3>
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width={130} height={130}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={35}
                        outerRadius={60}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {pieData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-1.5">
                    {pieData.slice(0, 5).map((d) => (
                      <div key={d.name} className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: d.color }}
                        />
                        <span className="text-xs text-text-secondary truncate flex-1">
                          {d.name}
                        </span>
                        <span className="text-xs text-text-muted">
                          {formatDurationShort(d.value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Hourly Bar Chart */}
              <div className="col-span-3 bg-bg-card border border-border rounded-xl p-4">
                <h3 className="text-sm font-semibold text-text-primary mb-3">Activity by Hour</h3>
                <ResponsiveContainer width="100%" height={130}>
                  <BarChart data={barData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#252840" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      tickLine={false}
                      axisLine={false}
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
                        return (
                          <div className="bg-bg-card border border-border rounded-lg px-3 py-2 shadow-xl">
                            <p className="text-xs text-text-primary">
                              {formatDuration(payload[0].payload.duration)}
                            </p>
                          </div>
                        )
                      }}
                    />
                    <Bar dataKey="displayDuration" fill="#7c6cf5" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* App List */}
            <div className="bg-bg-card border border-border rounded-xl p-4">
              <h3 className="text-sm font-semibold text-text-primary mb-3">
                All Apps ({stats.appStats.length})
              </h3>
              <div className="space-y-0.5">
                {stats.appStats.map((stat) => (
                  <AppBar
                    key={stat.appName}
                    stat={stat}
                    maxDuration={maxDuration}
                    onCategoryClick={(name) =>
                      setCategoryModal({ appName: name, category: stat.category })
                    }
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {categoryModal && (
        <CategoryModal
          appName={categoryModal.appName}
          currentCategory={categoryModal.category}
          onSave={handleCategorySave}
          onClose={() => setCategoryModal(null)}
        />
      )}
    </div>
  )
}
