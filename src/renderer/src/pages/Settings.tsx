import { useState, useEffect } from 'react'
import { getTodayStr, getYesterdayStr } from '../utils/format'

const isElectron = !!window.electron

export default function Settings(): JSX.Element {
  const [dataPath, setDataPath] = useState<string>('')
  const [exportRange, setExportRange] = useState<'today' | '7d' | '30d' | 'all'>('7d')
  const [exporting, setExporting] = useState(false)
  const [exportResult, setExportResult] = useState<string | null>(null)
  const [clearing, setClearing] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [cleared, setCleared] = useState(false)

  useEffect(() => {
    if (isElectron) {
      window.api.getDataPath().then(setDataPath).catch(() => {})
    }
  }, [])

  const handleExport = async (): Promise<void> => {
    if (!isElectron) { alert('Export only works in the desktop app.'); return }
    setExporting(true)
    setExportResult(null)
    const today = getTodayStr()
    let start = today
    if (exportRange === '7d') { const d = new Date(); d.setDate(d.getDate() - 6); start = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
    if (exportRange === '30d') { const d = new Date(); d.setDate(d.getDate() - 29); start = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
    if (exportRange === 'all') start = '2020-01-01'
    const result = await window.api.exportCsv(start, today)
    setExporting(false)
    setExportResult(result.success ? `Saved to ${result.filePath}` : 'Export cancelled.')
  }

  const handleClear = async (): Promise<void> => {
    if (!isElectron) { alert('Clear data only works in the desktop app.'); return }
    setClearing(true)
    const d = new Date()
    d.setDate(d.getDate() - 30)
    const cutoff = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    await window.api.clearData(cutoff)
    setClearing(false)
    setShowClearConfirm(false)
    setCleared(true)
    setTimeout(() => setCleared(false), 3000)
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 max-w-2xl">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-text-primary">Settings</h1>
          <p className="text-sm text-text-secondary mt-0.5">Configure and manage your data</p>
        </div>

        {/* Data Export */}
        <Section title="Export Data" icon="📤">
          <p className="text-sm text-text-secondary mb-4">
            Export your activity history as a CSV file you can open in Excel or Google Sheets.
          </p>
          <div className="flex gap-3 items-center mb-4">
            <select
              value={exportRange}
              onChange={(e) => setExportRange(e.target.value as typeof exportRange)}
              className="bg-bg-card border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-purple/50"
            >
              <option value="today">Today only</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="all">All time</option>
            </select>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="px-4 py-2 bg-accent-purple text-white text-sm font-medium rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50"
            >
              {exporting ? 'Exporting...' : 'Export CSV'}
            </button>
          </div>
          {exportResult && (
            <p className={`text-xs px-3 py-2 rounded-lg ${exportResult.startsWith('Saved') ? 'bg-green-900/20 text-green-400' : 'bg-bg-card text-text-muted'}`}>
              {exportResult}
            </p>
          )}
          {!isElectron && (
            <p className="text-xs text-text-muted bg-bg-card border border-border rounded-lg px-3 py-2">
              💡 Export is available in the Windows desktop app.
            </p>
          )}
        </Section>

        {/* Storage */}
        <Section title="Storage" icon="💾">
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm text-text-primary">Data Location</p>
                <p className="text-xs text-text-muted mt-0.5 font-mono">
                  {dataPath ? `${dataPath}\\activity.db` : 'Available in desktop app'}
                </p>
              </div>
            </div>
            <div className="border-t border-border pt-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-primary">Clear old data</p>
                  <p className="text-xs text-text-muted mt-0.5">Delete activity older than 30 days</p>
                </div>
                {!showClearConfirm ? (
                  <button
                    onClick={() => setShowClearConfirm(true)}
                    className="px-4 py-2 bg-bg-card border border-border text-text-secondary text-sm rounded-lg hover:border-red-500/50 hover:text-red-400 transition-colors"
                  >
                    Clear Old Data
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowClearConfirm(false)}
                      className="px-3 py-1.5 bg-bg-card border border-border text-text-secondary text-xs rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleClear}
                      disabled={clearing}
                      className="px-3 py-1.5 bg-red-500/20 border border-red-500/50 text-red-400 text-xs rounded-lg hover:bg-red-500/30"
                    >
                      {clearing ? 'Clearing...' : 'Confirm'}
                    </button>
                  </div>
                )}
              </div>
              {cleared && <p className="text-xs text-green-400 mt-2">Old data cleared successfully.</p>}
            </div>
          </div>
        </Section>

        {/* About */}
        <Section title="About" icon="ℹ️">
          <div className="space-y-2 text-sm">
            <Row label="App" value="Track Activity v0.1.0" />
            <Row label="Built with" value="Electron · React · TypeScript" />
            <Row label="Storage" value="Local SQLite (no cloud, no telemetry)" />
            <Row label="Tracking interval" value="Every 2 seconds" />
            <Row label="Data privacy" value="100% local — nothing leaves your machine" />
          </div>
        </Section>
      </div>
    </div>
  )
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }): JSX.Element {
  return (
    <div className="bg-bg-card border border-border rounded-xl p-5 mb-4">
      <h2 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
        <span>{icon}</span>{title}
      </h2>
      {children}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
      <span className="text-text-secondary">{label}</span>
      <span className="text-text-muted text-right">{value}</span>
    </div>
  )
}
