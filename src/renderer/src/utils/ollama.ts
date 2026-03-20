export const OLLAMA_BASE = 'http://localhost:11434'

export interface OllamaModel {
  name: string
  size: number
  modified_at: string
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

/** Returns null if Ollama is not reachable */
export async function fetchModels(): Promise<OllamaModel[] | null> {
  try {
    const res = await fetch(`${OLLAMA_BASE}/api/tags`, { signal: AbortSignal.timeout(3000) })
    if (!res.ok) return null
    const json = await res.json()
    return (json.models ?? []) as OllamaModel[]
  } catch {
    return null
  }
}

export async function checkOllama(): Promise<boolean> {
  const models = await fetchModels()
  return models !== null
}

/**
 * Stream a chat completion from Ollama.
 * Calls `onToken` for each text chunk, resolves when done.
 */
export async function streamChat(
  model: string,
  messages: ChatMessage[],
  onToken: (token: string) => void,
  signal?: AbortSignal
): Promise<void> {
  const res = await fetch(`${OLLAMA_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, stream: true }),
    signal,
  })

  if (!res.ok || !res.body) {
    const err = await res.text().catch(() => 'Unknown error')
    throw new Error(`Ollama error ${res.status}: ${err}`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const chunk = decoder.decode(value, { stream: true })
    for (const line of chunk.split('\n')) {
      if (!line.trim()) continue
      try {
        const parsed = JSON.parse(line)
        const token: string = parsed?.message?.content ?? ''
        if (token) onToken(token)
      } catch {
        // skip malformed lines
      }
    }
  }
}

/** Format activity stats into a concise system prompt */
export function buildSystemPrompt(stats: {
  date: string
  totalTime: number
  topApp: string
  topCategory: string
  score: number
  appStats: { appName: string; totalDuration: number; percentage: number; category: string }[]
  categoryStats: { category: string; totalDuration: number; percentage: number }[]
  weekTotal?: number
}): string {
  const fmt = (s: number): string => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    return h > 0 ? `${h}h ${m}m` : `${m}m`
  }

  const appLines = stats.appStats
    .slice(0, 10)
    .map((a) => `  - ${a.appName} (${a.category}): ${fmt(a.totalDuration)} (${a.percentage}%)`)
    .join('\n')

  const catLines = stats.categoryStats
    .map((c) => `  - ${c.category}: ${fmt(c.totalDuration)} (${c.percentage}%)`)
    .join('\n')

  const scoreLabel = stats.score >= 70 ? 'Focused' : stats.score >= 45 ? 'Balanced' : 'Distracted'

  return `You are a personal productivity coach inside the "Track Activity" desktop app.
The user's computer activity data for ${stats.date}:

SUMMARY:
  Total tracked time: ${fmt(stats.totalTime)}
  Productivity score: ${stats.score}/100 (${scoreLabel})
  Top app: ${stats.topApp}
  Top category: ${stats.topCategory}${stats.weekTotal ? `\n  This week total: ${fmt(stats.weekTotal)}` : ''}

TOP APPS:
${appLines}

BY CATEGORY:
${catLines}

Answer concisely and helpfully. Be encouraging but honest. Give specific, actionable advice when asked for improvements. When asked to summarize, produce a short paragraph. Avoid bullet walls — prefer 2–4 focused points.`
}
