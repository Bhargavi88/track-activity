import { formatDuration } from '../utils/format'
import type { AppStat } from '../types'
import AppIcon from './AppIcon'

interface AppBarProps {
  stat: AppStat
  maxDuration: number
  rank?: number
  onCategoryClick?: (appName: string) => void
}

export default function AppBar({ stat, maxDuration, rank, onCategoryClick }: AppBarProps): JSX.Element {
  const pct = maxDuration > 0 ? (stat.totalDuration / maxDuration) * 100 : 0

  return (
    <div className="flex items-center gap-3 py-2.5 px-2 hover:bg-bg-hover/60 rounded-lg transition-colors group">
      {/* Rank */}
      {rank !== undefined && (
        <span className="text-xs text-text-muted w-4 text-center shrink-0">{rank}</span>
      )}

      {/* Icon */}
      <div className="w-6 text-center shrink-0">
        <AppIcon appName={stat.appName} category={stat.category} size="sm" />
      </div>

      {/* App name + category */}
      <div className="w-32 shrink-0">
        <p className="text-sm text-text-primary font-medium truncate leading-tight">{stat.appName}</p>
        <button
          className="text-xs text-text-muted hover:text-accent-purple transition-colors"
          onClick={() => onCategoryClick?.(stat.appName)}
          title="Change category"
        >
          {stat.category}
        </button>
      </div>

      {/* Bar */}
      <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: stat.color }}
        />
      </div>

      {/* Time + % */}
      <div className="w-24 text-right shrink-0">
        <span className="text-sm font-medium text-text-primary">{formatDuration(stat.totalDuration)}</span>
        <span className="text-xs text-text-muted ml-1.5">{stat.percentage}%</span>
      </div>
    </div>
  )
}
