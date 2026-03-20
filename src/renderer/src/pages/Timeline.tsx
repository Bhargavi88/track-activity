import { useState, useEffect, useCallback } from 'react'
import type { ActivitySession } from '../types'
import DatePicker from '../components/DatePicker'
import { formatDuration, formatTime, getTodayStr } from '../utils/format'

// Build a timeline visual from sessions
function buildTimelineBlocks(
  sessions: ActivitySession[],
  startHour: number,
  endHour: number
): {
  session: ActivitySession
  leftPct: number
  widthPct: number
}[] {
  const startMs = new Date(
    sessions[0]?.date
      ? sessions[0].date + `T${String(startHour).padStart(2, '0')}:00:00`
      : new Date().toDateString()
  ).getTime()

  const totalMs = (endHour - startHour) * 3600 * 1000

  return sessions
    .filter((s) => s.endTime && s.duration && s.duration > 5)
    .map((s) => {
      const left = Math.max(0, ((s.startTime - startMs) / totalMs) * 100)
      const width = Math.min(100 - left, ((s.endTime! - s.startTime) / totalMs) * 100)
      return { session: s, leftPct: left, widthPct: Math.max(0.2, width) }
    })
}

export default function Timeline(): JSX.Element {
  const [date, setDate] = useState(getTodayStr())
  const [sessions, setSessions] = useState<ActivitySession[]>([])
  const [loading, setLoading] = useState(true)
  const [hovered, setHovered] = useState<ActivitySession | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const data = await window.api.getSessionsDate(date)
    setSessions(data)
    setLoading(false)
  }, [date])

  useEffect(() => {
    load()
    if (date === getTodayStr()) {
      const t = setInterval(load, 15000)
      return () => clearInterval(t)
    }
    return undefined
  }, [load, date])

  // Determine visible hour range
  const completedSessions = sessions.filter((s) => s.endTime && s.duration && s.duration > 5)
  const startHour = completedSessions.length
    ? Math.max(0, Math.floor(new Date(completedSessions[0].startTime).getHours()) - 0)
    : 8
  const endHour = completedSessions.length
    ? Math.min(24, Math.ceil(new Date(completedSessions[completedSessions.length - 1].endTime!).getHours()) + 1)
    : 20

  const blocks = completedSessions.length ? buildTimelineBlocks(completedSessions, startHour, endHour) : []

  // Group sessions by unique apps for the legend
  const appMap = new Map<string, { color: string; duration: number }>()
  for (const s of completedSessions) {
    const ex = appMap.get(s.appName) ?? { color: s.color, duration: 0 }
    ex.duration += s.duration ?? 0
    appMap.set(s.appName, ex)
  }
  const legend = [...appMap.entries()].sort((a, b) => b[1].duration - a[1].duration)

  // Hour markers
  const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i)

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-text-primary">Timeline</h1>
            <p className="text-sm text-text-secondary mt-0.5">Visualize your day</p>
          </div>
          <DatePicker date={date} onChange={setDate} />
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="text-text-muted text-sm">Loading...</div>
          </div>
        ) : completedSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <div className="text-4xl mb-3">📅</div>
            <p className="text-text-secondary">No activity recorded</p>
          </div>
        ) : (
          <>
            {/* Tooltip for hovered session */}
            {hovered && (
              <div className="bg-bg-card border border-border rounded-xl p-3 mb-4 flex items-center gap-3">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: hovered.color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary">{hovered.appName}</p>
                  <p className="text-xs text-text-secondary truncate">{hovered.windowTitle}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm text-text-primary">{formatDuration(hovered.duration ?? 0)}</p>
                  <p className="text-xs text-text-muted">
                    {formatTime(hovered.startTime)} – {hovered.endTime ? formatTime(hovered.endTime) : 'now'}
                  </p>
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="bg-bg-card border border-border rounded-xl p-4 mb-4">
              {/* Hour labels */}
              <div className="relative mb-2" style={{ marginLeft: 0 }}>
                <div className="flex">
                  {hours.map((h) => (
                    <div
                      key={h}
                      className="text-xs text-text-muted"
                      style={{ width: `${100 / hours.length}%` }}
                    >
                      {String(h).padStart(2, '0')}:00
                    </div>
                  ))}
                </div>
              </div>

              {/* Main timeline track */}
              <div className="relative h-14 bg-bg-primary rounded-lg overflow-hidden">
                {blocks.map(({ session, leftPct, widthPct }, i) => (
                  <div
                    key={i}
                    className="absolute top-1 bottom-1 rounded cursor-pointer opacity-90 hover:opacity-100 transition-opacity"
                    style={{
                      left: `${leftPct}%`,
                      width: `${widthPct}%`,
                      backgroundColor: session.color,
                      minWidth: 2
                    }}
                    onMouseEnter={() => setHovered(session)}
                    onMouseLeave={() => setHovered(null)}
                    title={`${session.appName} — ${formatDuration(session.duration ?? 0)}`}
                  />
                ))}

                {/* Grid lines */}
                {hours.map((h, i) => (
                  <div
                    key={h}
                    className="absolute top-0 bottom-0 border-l border-border/50"
                    style={{ left: `${(i / hours.length) * 100}%` }}
                  />
                ))}
              </div>
            </div>

            {/* Session list */}
            <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <h3 className="text-sm font-semibold text-text-primary">
                  Sessions ({completedSessions.length})
                </h3>
              </div>
              <div className="divide-y divide-border">
                {completedSessions.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-bg-hover transition-colors"
                    onMouseEnter={() => setHovered(s)}
                    onMouseLeave={() => setHovered(null)}
                  >
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary">{s.appName}</p>
                      <p className="text-xs text-text-secondary truncate">{s.windowTitle}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm text-text-primary">{formatDuration(s.duration ?? 0)}</p>
                      <p className="text-xs text-text-muted">
                        {formatTime(s.startTime)} – {s.endTime ? formatTime(s.endTime) : '…'}
                      </p>
                    </div>
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
