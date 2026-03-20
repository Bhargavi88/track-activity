import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import AppsPage from './pages/AppsPage'
import Timeline from './pages/Timeline'
import History from './pages/History'
import type { CurrentActivity } from './types'

export type Page = 'dashboard' | 'apps' | 'timeline' | 'history'

export default function App(): JSX.Element {
  const [page, setPage] = useState<Page>('dashboard')
  const [currentActivity, setCurrentActivity] = useState<CurrentActivity | null>(null)

  useEffect(() => {
    // Get initial activity
    window.api.getCurrentActivity().then(setCurrentActivity).catch(console.error)

    // Subscribe to changes
    const unsubscribe = window.api.onActivityChanged((activity) => {
      setCurrentActivity(activity)
    })

    return unsubscribe
  }, [])

  return (
    <div className="flex h-screen bg-bg-primary text-text-primary overflow-hidden">
      <Sidebar page={page} onNavigate={setPage} currentActivity={currentActivity} />
      <main className="flex-1 overflow-hidden">
        {page === 'dashboard' && <Dashboard />}
        {page === 'apps' && <AppsPage />}
        {page === 'timeline' && <Timeline />}
        {page === 'history' && <History />}
      </main>
    </div>
  )
}
