import type { Page } from '../App'
import type { CurrentActivity } from '../types'
import { formatDurationShort } from '../utils/format'

interface SidebarProps {
  page: Page
  onNavigate: (page: Page) => void
  currentActivity: CurrentActivity | null
}

const navItems: { id: Page; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '⊞' },
  { id: 'apps', label: 'Apps', icon: '⊟' },
  { id: 'timeline', label: 'Timeline', icon: '◫' },
  { id: 'history', label: 'History', icon: '◷' }
]

export default function Sidebar({ page, onNavigate, currentActivity }: SidebarProps): JSX.Element {
  return (
    <aside className="w-56 bg-bg-secondary border-r border-border flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-accent-purple flex items-center justify-center text-sm font-bold">
            T
          </div>
          <span className="font-semibold text-text-primary text-sm">Track Activity</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
              page === item.id
                ? 'bg-accent-purple/20 text-accent-purple font-medium'
                : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
            }`}
          >
            <span className="text-base w-5 text-center">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      {/* Current Activity */}
      {currentActivity && (
        <div className="px-3 pb-4">
          <div className="bg-bg-card rounded-xl p-3 border border-border">
            <p className="text-xs text-text-muted mb-2 uppercase tracking-wide font-medium">
              Now tracking
            </p>
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-2 h-2 rounded-full animate-pulse shrink-0"
                style={{ backgroundColor: currentActivity.color }}
              />
              <span className="text-sm font-medium text-text-primary truncate">
                {currentActivity.appName}
              </span>
            </div>
            <p className="text-xs text-text-secondary truncate pl-4">
              {currentActivity.windowTitle}
            </p>
            <p className="text-xs text-text-muted mt-1 pl-4">
              {formatDurationShort(currentActivity.duration)}
            </p>
          </div>
        </div>
      )}
    </aside>
  )
}
