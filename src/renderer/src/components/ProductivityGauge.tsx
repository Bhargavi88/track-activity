import type { ProductivityScore } from '../types'
import { formatDuration } from '../utils/format'

interface ProductivityGaugeProps {
  score: ProductivityScore
}

export default function ProductivityGauge({ score }: ProductivityGaugeProps): JSX.Element {
  const pct = score.score
  const color = pct >= 70 ? '#34d399' : pct >= 45 ? '#fbbf24' : '#f87171'
  const label = pct >= 70 ? 'Focused' : pct >= 45 ? 'Balanced' : 'Distracted'

  // SVG arc parameters
  const r = 54
  const cx = 70
  const cy = 70
  const startAngle = 210  // degrees, measured from 3-o'clock, going clockwise
  const sweepAngle = 240  // total arc span
  const toRad = (deg: number): number => (deg * Math.PI) / 180

  const arcPath = (start: number, sweep: number): string => {
    const s = toRad(start)
    const e = toRad(start + sweep)
    const x1 = cx + r * Math.cos(s)
    const y1 = cy + r * Math.sin(s)
    const x2 = cx + r * Math.cos(e)
    const y2 = cy + r * Math.sin(e)
    const large = sweep > 180 ? 1 : 0
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`
  }

  const filledSweep = (pct / 100) * sweepAngle

  return (
    <div className="bg-bg-card border border-border rounded-xl p-4">
      <h3 className="text-sm font-semibold text-text-primary mb-3">Productivity Score</h3>
      <div className="flex items-center gap-4">
        {/* Arc gauge */}
        <div className="relative shrink-0">
          <svg width="140" height="100" viewBox="0 0 140 110">
            {/* Track */}
            <path
              d={arcPath(startAngle, sweepAngle)}
              fill="none"
              stroke="#252840"
              strokeWidth="10"
              strokeLinecap="round"
            />
            {/* Fill */}
            {pct > 0 && (
              <path
                d={arcPath(startAngle, filledSweep)}
                fill="none"
                stroke={color}
                strokeWidth="10"
                strokeLinecap="round"
                style={{ filter: `drop-shadow(0 0 6px ${color}88)` }}
              />
            )}
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center mt-2">
            <span className="text-2xl font-bold" style={{ color }}>{pct}</span>
            <span className="text-xs font-medium" style={{ color }}>{label}</span>
          </div>
        </div>

        {/* Breakdown bars */}
        <div className="flex-1 space-y-2.5">
          <BreakdownRow
            label="Focused"
            duration={score.productiveTime}
            total={score.totalTime}
            color="#34d399"
          />
          <BreakdownRow
            label="Neutral"
            duration={score.neutralTime}
            total={score.totalTime}
            color="#94a3b8"
          />
          <BreakdownRow
            label="Distracting"
            duration={score.distractingTime}
            total={score.totalTime}
            color="#f87171"
          />
        </div>
      </div>
    </div>
  )
}

function BreakdownRow({
  label, duration, total, color
}: { label: string; duration: number; total: number; color: string }): JSX.Element {
  const pct = total > 0 ? Math.round((duration / total) * 100) : 0
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-text-secondary">{label}</span>
        <span className="text-text-muted">{formatDuration(duration)} · {pct}%</span>
      </div>
      <div className="h-1.5 bg-border rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}
