import { useState, useEffect, useCallback } from 'react'
import type { AppStat, CategoryName } from '../types'
import { CATEGORY_COLORS, CATEGORY_ICONS } from '../types'
import AppBar from '../components/AppBar'
import CategoryModal from '../components/CategoryModal'
import DatePicker from '../components/DatePicker'
import { formatDuration, getTodayStr } from '../utils/format'

const ALL = 'All'
const CATEGORIES = [ALL, 'Development', 'Browser', 'Communication', 'Design', 'Productivity', 'Entertainment', 'Social', 'System', 'Other']

export default function AppsPage(): JSX.Element {
  const [date, setDate] = useState(getTodayStr())
  const [appStats, setAppStats] = useState<AppStat[]>([])
  const [filter, setFilter] = useState(ALL)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [categoryModal, setCategoryModal] = useState<{ appName: string; category: string } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const data = await window.api.getStatsDate(date)
    setAppStats(data.appStats)
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

  const catTotals = new Map<string, number>()
  for (const s of appStats) catTotals.set(s.category, (catTotals.get(s.category) ?? 0) + s.totalDuration)

  const filtered = appStats
    .filter((a) => filter === ALL || a.category === filter)
    .filter((a) => !search || a.appName.toLowerCase().includes(search.toLowerCase()))

  const maxDuration = filtered[0]?.totalDuration ?? 1
  const totalFiltered = filtered.reduce((s, a) => s + a.totalDuration, 0)

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-text-primary">Apps</h1>
            <p className="text-sm text-text-secondary mt-0.5">Time spent per application</p>
          </div>
          <DatePicker date={date} onChange={setDate} />
        </div>

        {/* Search + Category chips */}
        <div className="mb-4 space-y-3">
          <input
            type="text"
            placeholder="Search apps..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-bg-card border border-border rounded-lg px-4 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-purple/50 transition-colors"
          />
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((cat) => {
              const color = cat === ALL ? '#7c6cf5' : CATEGORY_COLORS[cat as CategoryName]
              const icon = cat === ALL ? '✦' : CATEGORY_ICONS[cat as CategoryName]
              const total = cat === ALL ? appStats.reduce((s, a) => s + a.totalDuration, 0) : catTotals.get(cat)
              if (cat !== ALL && !catTotals.has(cat)) return null
              return (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    filter === cat ? 'text-white shadow-md' : 'bg-bg-card border border-border text-text-secondary hover:text-text-primary'
                  }`}
                  style={filter === cat ? { backgroundColor: color } : {}}
                >
                  <span>{icon}</span>
                  {cat}
                  {total !== undefined && total > 0 && (
                    <span className={filter === cat ? 'opacity-75' : 'text-text-muted'}>
                      {formatDuration(total)}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-6 h-6 border-2 border-accent-purple border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <p className="text-text-secondary">{search ? `No apps matching "${search}"` : 'No apps for this filter'}</p>
          </div>
        ) : (
          <div className="bg-bg-card border border-border rounded-xl p-4">
            <div className="flex justify-between items-center mb-3">
              <p className="text-xs text-text-muted">{filtered.length} apps · {formatDuration(totalFiltered)} total</p>
            </div>
            <div className="space-y-0.5">
              {filtered.map((stat, i) => (
                <AppBar
                  key={stat.appName}
                  stat={stat}
                  maxDuration={maxDuration}
                  rank={i + 1}
                  onCategoryClick={(name) => setCategoryModal({ appName: name, category: stat.category })}
                />
              ))}
            </div>
          </div>
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
