import { useEffect, useRef, useState } from 'react'
import type { Page } from '../App'
import type { CurrentActivity } from '../types'
import { formatDurationShort } from '../utils/format'
import AppIcon from './AppIcon'

interface SidebarProps {
  page: Page
  onNavigate: (page: Page) => void
  currentActivity: CurrentActivity | null
}

const navItems: { id: Page; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '⊞' },
  { id: 'apps', label: 'Apps', icon: '⊟' },
  { id: 'timeline', label: 'Timeline', icon: '◫' },
  { id: 'history', label: 'History', icon: '◷' },
  { id: 'settings', label: 'Settings', icon: '⚙' }
]

export default function Sidebar({ page, onNavigate, currentActivity }: SidebarProps): JSX.Element {
  // Live duration counter — ticks every second using startTime
  const [liveDuration, setLiveDuration] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (!currentActivity) { setLiveDuration(0); return }

    const tick = (): void =>
      setLiveDuration(Math.round((Date.now() - currentActivity.startTime) / 1000))
    tick()
    timerRef.current = setInterval(tick, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [currentActivity?.startTime])

  return (
    <aside className="w-56 bg-bg-secondary border-r border-border flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-accent-purple flex items-center justify-center text-white text-sm font-bold shadow-lg">
            T
          </div>
          <span className="font-semibold text-text-primary text-sm tracking-tight">Track Activity</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all text-left ${
              page === item.id
                ? 'bg-accent-purple/15 text-accent-purple font-medium border border-accent-purple/20'
                : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary border border-transparent'
            }`}
          >
            <span className="text-base w-5 text-center opacity-80">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      {/* Current Activity */}
      <div className="px-3 pb-4">
        {currentActivity ? (
          <div className="bg-bg-card rounded-xl p-3 border border-border">
            <div className="flex items-center gap-1.5 mb-2">
              <div
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ backgroundColor: currentActivity.color }}
              />
              <p className="text-xs text-text-muted uppercase tracking-wide font-medium">Now</p>
            </div>
            <div className="flex items-center gap-2 mb-0.5">
              <AppIcon appName={currentActivity.appName} category={currentActivity.category} size="sm" />
              <span className="text-sm font-medium text-text-primary truncate">
                {currentActivity.appName}
              </span>
            </div>
            <p className="text-xs text-text-secondary truncate pl-5 mb-1">
              {currentActivity.windowTitle}
            </p>
            <div className="flex items-center justify-between pl-5">
              <span className="text-xs text-text-muted">{currentActivity.category}</span>
              <span
                className="text-xs font-mono font-medium tabular-nums"
                style={{ color: currentActivity.color }}
              >
                {formatDurationShort(liveDuration)}
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-bg-card rounded-xl p-3 border border-border text-center">
            <p className="text-xs text-text-muted">Not tracking</p>
          </div>
        )}
      </div>
    </aside>
  )
}
