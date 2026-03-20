import { formatDuration } from '../utils/format'
import type { AppStat } from '../types'

interface AppBarProps {
  stat: AppStat
  maxDuration: number
  onCategoryClick?: (appName: string) => void
}

export default function AppBar({ stat, maxDuration, onCategoryClick }: AppBarProps): JSX.Element {
  const pct = maxDuration > 0 ? (stat.totalDuration / maxDuration) * 100 : 0

  return (
    <div className="flex items-center gap-3 py-2.5 px-1 hover:bg-bg-hover/50 rounded-lg transition-colors group">
      {/* Color dot */}
      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: stat.color }} />

      {/* App name + category */}
      <div className="w-36 shrink-0">
        <p className="text-sm text-text-primary font-medium truncate">{stat.appName}</p>
        <button
          className="text-xs text-text-muted hover:text-accent-purple transition-colors"
          onClick={() => onCategoryClick?.(stat.appName)}
        >
          {stat.category}
        </button>
      </div>

      {/* Bar */}
      <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: stat.color }}
        />
      </div>

      {/* Time */}
      <div className="w-20 text-right shrink-0">
        <span className="text-sm font-medium text-text-primary">
          {formatDuration(stat.totalDuration)}
        </span>
        <span className="text-xs text-text-muted ml-1">({stat.percentage}%)</span>
      </div>
    </div>
  )
}
