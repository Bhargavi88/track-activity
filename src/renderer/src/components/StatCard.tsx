interface StatCardProps {
  label: string
  value: string
  sub?: string
  color?: string
  icon?: string
}

export default function StatCard({ label, value, sub, color, icon }: StatCardProps): JSX.Element {
  return (
    <div className="bg-bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-text-muted uppercase tracking-wide font-medium">{label}</span>
        {icon && <span className="text-lg">{icon}</span>}
      </div>
      <p className="text-2xl font-bold text-text-primary" style={color ? { color } : {}}>
        {value}
      </p>
      {sub && <p className="text-xs text-text-secondary mt-1">{sub}</p>}
    </div>
  )
}
