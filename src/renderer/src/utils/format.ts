export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return s > 0 ? `${m}m ${s}s` : `${m}m`
  }
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export function formatDurationShort(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  const today = getTodayStr()
  const yesterday = getYesterdayStr()
  if (dateStr === today) return 'Today'
  if (dateStr === yesterday) return 'Yesterday'
  return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
}

export function getTodayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function getYesterdayStr(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function getDatesInRange(startDate: string, endDate: string): string[] {
  const dates: string[] = []
  const start = new Date(startDate + 'T12:00:00')
  const end = new Date(endDate + 'T12:00:00')
  const current = new Date(start)
  while (current <= end) {
    const y = current.getFullYear()
    const m = String(current.getMonth() + 1).padStart(2, '0')
    const d = String(current.getDate()).padStart(2, '0')
    dates.push(`${y}-${m}-${d}`)
    current.setDate(current.getDate() + 1)
  }
  return dates
}
