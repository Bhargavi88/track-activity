import { formatDate, getTodayStr } from '../utils/format'

interface DatePickerProps {
  date: string
  onChange: (date: string) => void
}

export default function DatePicker({ date, onChange }: DatePickerProps): JSX.Element {
  const today = getTodayStr()

  const prev = (): void => {
    const d = new Date(date + 'T12:00:00')
    d.setDate(d.getDate() - 1)
    onChange(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    )
  }

  const next = (): void => {
    const d = new Date(date + 'T12:00:00')
    d.setDate(d.getDate() + 1)
    const newDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    if (newDate <= today) onChange(newDate)
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={prev}
        className="w-8 h-8 flex items-center justify-center rounded-lg bg-bg-card border border-border text-text-secondary hover:text-text-primary hover:border-border-light transition-colors"
      >
        ‹
      </button>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-text-primary min-w-24 text-center">
          {formatDate(date)}
        </span>
        {date !== today && (
          <button
            onClick={() => onChange(today)}
            className="text-xs text-accent-purple hover:underline"
          >
            Today
          </button>
        )}
      </div>
      <button
        onClick={next}
        disabled={date >= today}
        className="w-8 h-8 flex items-center justify-center rounded-lg bg-bg-card border border-border text-text-secondary hover:text-text-primary hover:border-border-light transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        ›
      </button>
    </div>
  )
}
