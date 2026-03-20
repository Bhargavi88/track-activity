import { useState, useEffect, useCallback } from 'react'
import type { AppStat } from '../types'
import type { CategoryName } from '../types'
import { CATEGORY_COLORS } from '../types'
import AppBar from '../components/AppBar'
import CategoryModal from '../components/CategoryModal'
import DatePicker from '../components/DatePicker'
import { formatDuration, getTodayStr } from '../utils/format'

const ALL = 'All'
const CATEGORIES: string[] = [ALL, 'Development', 'Browser', 'Communication', 'Design', 'Productivity', 'Entertainment', 'System', 'Other']

export default function AppsPage(): JSX.Element {
  const [date, setDate] = useState(getTodayStr())
  const [appStats, setAppStats] = useState<AppStat[]>([])
  const [filter, setFilter] = useState<string>(ALL)
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

  const filtered = filter === ALL ? appStats : appStats.filter((a) => a.category === filter)
  const maxDuration = filtered[0]?.totalDuration ?? 1

  // Category totals
  const categoryTotals = new Map<string, number>()
  for (const s of appStats) {
    categoryTotals.set(s.category, (categoryTotals.get(s.category) ?? 0) + s.totalDuration)
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-text-primary">Apps</h1>
            <p className="text-sm text-text-secondary mt-0.5">Time spent per application</p>
          </div>
          <DatePicker date={date} onChange={setDate} />
        </div>

        {/* Category chips */}
        <div className="flex gap-2 flex-wrap mb-5">
          {CATEGORIES.map((cat) => {
            const color = cat === ALL ? '#7c6cf5' : CATEGORY_COLORS[cat as CategoryName]
            const total = cat === ALL
              ? appStats.reduce((s, a) => s + a.totalDuration, 0)
              : categoryTotals.get(cat)
            return (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  filter === cat
                    ? 'text-white'
                    : 'bg-bg-card border border-border text-text-secondary hover:text-text-primary'
                }`}
                style={filter === cat ? { backgroundColor: color } : {}}
              >
                {cat !== ALL && (
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: filter === cat ? 'white' : color }} />
                )}
                {cat}
                {total !== undefined && total > 0 && (
                  <span className={filter === cat ? 'opacity-80' : 'text-text-muted'}>
                    · {formatDuration(total)}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="text-text-muted text-sm">Loading...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <p className="text-text-secondary">No apps for this filter</p>
          </div>
        ) : (
          <div className="bg-bg-card border border-border rounded-xl p-4">
            <div className="space-y-0.5">
              {filtered.map((stat) => (
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
