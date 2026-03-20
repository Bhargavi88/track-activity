import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

async function main(): Promise<void> {
  // Inject mock API when running in a plain browser (no Electron)
  if (!window.api) {
    const { mockApi } = await import('./mock/api')
    window.api = mockApi
  }
  ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
}

main()

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
