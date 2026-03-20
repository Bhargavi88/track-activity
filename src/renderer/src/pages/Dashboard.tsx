import { useState, useEffect, useCallback } from 'react'
import {
  PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'
import type { DayStats } from '../types'
import StatCard from '../components/StatCard'
import AppBar from '../components/AppBar'
import DatePicker from '../components/DatePicker'
import CategoryModal from '../components/CategoryModal'
import ProductivityGauge from '../components/ProductivityGauge'
import AppIcon from '../components/AppIcon'
import { formatDuration, formatDurationShort, getTodayStr } from '../utils/format'

export default function Dashboard(): JSX.Element {
  const [date, setDate] = useState(getTodayStr())
  const [stats, setStats] = useState<DayStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [categoryModal, setCategoryModal] = useState<{ appName: string; category: string } | null>(null)
  const [activeTab, setActiveTab] = useState<'apps' | 'categories'>('apps')

  const load = useCallback(async () => {
    setLoading(true)
    const data = await window.api.getStatsDate(date)
    setStats(data)
    setLoading(false)
  }, [date])

  useEffect(() => {
    load()
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

  const pieData = (activeTab === 'apps' ? stats?.appStats.slice(0, 8) : stats?.categoryStats)?.map((s) => ({
    name: s.category === undefined ? (s as any).appName : s.category,
    value: s.totalDuration,
    color: s.color
  })) ?? []

  const barData = stats?.hourlyActivity
    .filter((h) => h.duration > 0)
    .map((h) => ({ label: h.label.replace(':00', 'h'), duration: h.duration, mins: Math.round(h.duration / 60) })) ?? []

  const maxDuration = stats?.appStats[0]?.totalDuration ?? 1

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-text-primary">Dashboard</h1>
            <p className="text-sm text-text-secondary mt-0.5">Your activity for {date === getTodayStr() ? 'today' : date}</p>
          </div>
          <DatePicker date={date} onChange={setDate} />
        </div>

        {loading ? (
          <LoadingState />
        ) : !stats || stats.totalTime === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-4 gap-3 mb-5">
              <StatCard label="Total Time" value={formatDuration(stats.totalTime)} sub="tracked today" icon="⏱" />
              <StatCard label="Top App" value={stats.topApp} sub={formatDuration(stats.appStats[0]?.totalDuration ?? 0)} icon="🏆" />
              <StatCard label="Top Category" value={stats.topCategory} sub={`${stats.appStats.filter((a) => a.category === stats.topCategory).length} apps`} icon="📊" />
              <StatCard
                label="Focus Score"
                value={`${stats.productivity.score}%`}
                sub={stats.productivity.score >= 70 ? 'Great focus!' : stats.productivity.score >= 45 ? 'Balanced day' : 'Stay focused'}
                color={stats.productivity.score >= 70 ? '#34d399' : stats.productivity.score >= 45 ? '#fbbf24' : '#f87171'}
                icon={stats.productivity.score >= 70 ? '🟢' : stats.productivity.score >= 45 ? '🟡' : '🔴'}
              />
            </div>

            {/* Row: Gauge + Charts */}
            <div className="grid grid-cols-5 gap-4 mb-4">
              {/* Productivity Gauge */}
              <div className="col-span-2">
                <ProductivityGauge score={stats.productivity} />
              </div>

              {/* Hourly Activity */}
              <div className="col-span-3 bg-bg-card border border-border rounded-xl p-4">
                <h3 className="text-sm font-semibold text-text-primary mb-3">Activity by Hour</h3>
                <ResponsiveContainer width="100%" height={130}>
                  <BarChart data={barData} margin={{ top: 0, right: 0, bottom: 0, left: -25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#252840" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}m`} />
                    <Tooltip content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      return (
                        <div className="bg-bg-card border border-border rounded-lg px-3 py-2 shadow-xl text-xs">
                          <p className="text-text-primary">{formatDuration(payload[0].payload.duration)}</p>
                        </div>
                      )
                    }} />
                    <Bar dataKey="mins" fill="#7c6cf5" radius={[3, 3, 0, 0]} maxBarSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Apps / Categories with pie chart */}
            <div className="bg-bg-card border border-border rounded-xl p-4">
              {/* Tab switcher */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-1 bg-bg-primary rounded-lg p-1">
                  {(['apps', 'categories'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setActiveTab(t)}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-colors capitalize ${
                        activeTab === t ? 'bg-accent-purple text-white' : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <span className="text-xs text-text-muted">{stats.appStats.length} apps tracked</span>
              </div>

              <div className="flex gap-6">
                {/* Pie */}
                <div className="shrink-0">
                  <ResponsiveContainer width={160} height={160}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={72} dataKey="value" strokeWidth={0}>
                        {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                      </Pie>
                      <Tooltip content={({ active, payload }) => {
                        if (!active || !payload?.length) return null
                        const d = payload[0]
                        return (
                          <div className="bg-bg-card border border-border rounded-lg px-3 py-2 shadow-xl text-xs">
                            <p className="font-medium" style={{ color: d.payload.color }}>{d.name}</p>
                            <p className="text-text-secondary">{formatDuration(d.value as number)}</p>
                          </div>
                        )
                      }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* List */}
                <div className="flex-1 min-w-0">
                  {activeTab === 'apps' ? (
                    <div className="space-y-0.5">
                      {stats.appStats.slice(0, 8).map((stat, i) => (
                        <AppBar
                          key={stat.appName}
                          stat={stat}
                          maxDuration={maxDuration}
                          rank={i + 1}
                          onCategoryClick={(name) => setCategoryModal({ appName: name, category: stat.category })}
                        />
                      ))}
                      {stats.appStats.length > 8 && (
                        <p className="text-xs text-text-muted pl-2 pt-1">+{stats.appStats.length - 8} more apps…</p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {stats.categoryStats.map((cat) => (
                        <div key={cat.category} className="flex items-center gap-3">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                          <span className="text-sm text-text-secondary w-28 shrink-0">{cat.category}</span>
                          <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }} />
                          </div>
                          <span className="text-sm font-medium text-text-primary w-20 text-right shrink-0">
                            {formatDurationShort(cat.totalDuration)}
                          </span>
                          <span className="text-xs text-text-muted w-8 text-right">{cat.percentage}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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

function LoadingState(): JSX.Element {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-accent-purple border-t-transparent rounded-full animate-spin" />
        <p className="text-text-muted text-sm">Loading...</p>
      </div>
    </div>
  )
}

function EmptyState(): JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <div className="text-5xl mb-4">⏱</div>
      <p className="text-text-secondary font-medium">No activity recorded</p>
      <p className="text-text-muted text-sm mt-1">Start using your computer to track time</p>
    </div>
  )
}
