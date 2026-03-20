import { useState, useEffect, useRef, useCallback } from 'react'
import type { DayStats, ChatMessage as AppChatMessage } from '../types'
import {
  fetchModels, streamChat, buildSystemPrompt, checkOllama,
  type OllamaModel, type ChatMessage
} from '../utils/ollama'
import { formatDuration, getTodayStr } from '../utils/format'

const QUICK_PROMPTS = [
  { icon: '📊', label: 'Summarize today', prompt: 'Give me a brief summary of my activity today.' },
  { icon: '🎯', label: 'Improve focus', prompt: 'Based on my data, what are 3 specific ways I can improve my productivity tomorrow?' },
  { icon: '⚖️', label: 'Work-life balance', prompt: 'How is my work-life balance looking? Am I spending too much time on entertainment or social media?' },
  { icon: '🏆', label: "What I'm best at", prompt: 'Which category am I spending the most productive time on? What does that say about my work habits?' },
  { icon: '⏰', label: 'Time wasters', prompt: 'What are my biggest time wasters today and how can I reduce them?' },
  { icon: '📅', label: 'Weekly goal', prompt: 'Suggest a realistic weekly productivity goal for me based on my current patterns.' },
]

interface Msg {
  role: 'user' | 'assistant'
  content: string
  streaming?: boolean
}

export default function AIInsights(): JSX.Element {
  const [status, setStatus] = useState<'checking' | 'ready' | 'offline'>('checking')
  const [models, setModels] = useState<OllamaModel[]>([])
  const [selectedModel, setSelectedModel] = useState('')
  const [stats, setStats] = useState<DayStats | null>(null)
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Load Ollama status + today's stats
  useEffect(() => {
    const init = async (): Promise<void> => {
      const [ollamaModels, todayStats] = await Promise.all([
        fetchModels(),
        window.api.getStatsToday()
      ])
      setStats(todayStats)
      if (!ollamaModels) {
        setStatus('offline')
        return
      }
      setModels(ollamaModels)
      setStatus(ollamaModels.length > 0 ? 'ready' : 'offline')
      // Pick a sensible default
      const preferred = ollamaModels.find((m) =>
        /llama|mistral|gemma|phi|qwen|deepseek/i.test(m.name)
      )
      setSelectedModel(preferred?.name ?? ollamaModels[0]?.name ?? '')
    }
    init()
  }, [])

  const buildContext = useCallback((): ChatMessage[] => {
    if (!stats) return []
    const system = buildSystemPrompt({
      date: stats.date,
      totalTime: stats.totalTime,
      topApp: stats.topApp,
      topCategory: stats.topCategory,
      score: stats.productivity.score,
      appStats: stats.appStats,
      categoryStats: stats.categoryStats,
    })
    const history: ChatMessage[] = messages
      .filter((m) => !m.streaming)
      .map((m) => ({ role: m.role, content: m.content }))
    return [{ role: 'system', content: system }, ...history]
  }, [stats, messages])

  const send = useCallback(async (text: string): Promise<void> => {
    if (!text.trim() || loading || !selectedModel) return

    const userMsg: Msg = { role: 'user', content: text.trim() }
    setMessages((prev) => [...prev, userMsg, { role: 'assistant', content: '', streaming: true }])
    setInput('')
    setLoading(true)

    const context = buildContext()
    context.push({ role: 'user', content: text.trim() })

    abortRef.current = new AbortController()
    let fullContent = ''

    try {
      await streamChat(
        selectedModel,
        context,
        (token) => {
          fullContent += token
          setMessages((prev) => {
            const next = [...prev]
            next[next.length - 1] = { role: 'assistant', content: fullContent, streaming: true }
            return next
          })
        },
        abortRef.current.signal
      )
      // Finalise — remove streaming flag
      setMessages((prev) => {
        const next = [...prev]
        next[next.length - 1] = { role: 'assistant', content: fullContent }
        return next
      })
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        setMessages((prev) => {
          const next = [...prev]
          next[next.length - 1] = { role: 'assistant', content: fullContent || '*(stopped)*' }
          return next
        })
      } else {
        setMessages((prev) => {
          const next = [...prev]
          next[next.length - 1] = { role: 'assistant', content: `⚠️ Error: ${err?.message ?? 'Unknown error'}` }
          return next
        })
      }
    } finally {
      setLoading(false)
      abortRef.current = null
      inputRef.current?.focus()
    }
  }, [loading, selectedModel, buildContext])

  const stopStreaming = (): void => {
    abortRef.current?.abort()
  }

  const clearChat = (): void => {
    if (loading) abortRef.current?.abort()
    setMessages([])
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send(input)
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center text-white text-lg">
              🧠
            </div>
            <div>
              <h1 className="text-lg font-bold text-text-primary leading-tight">AI Insights</h1>
              <p className="text-xs text-text-muted">Powered by Ollama · 100% local</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Status badge */}
            <StatusBadge status={status} />

            {/* Model picker */}
            {status === 'ready' && models.length > 0 && (
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="bg-bg-card border border-border rounded-lg px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent-purple/50 max-w-48 truncate"
              >
                {models.map((m) => (
                  <option key={m.name} value={m.name}>{m.name}</option>
                ))}
              </select>
            )}

            {messages.length > 0 && (
              <button
                onClick={clearChat}
                className="px-3 py-1.5 text-xs text-text-muted hover:text-text-secondary bg-bg-card border border-border rounded-lg transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Today's context pill */}
        {stats && stats.totalTime > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            <ContextPill icon="⏱" label={`${formatDuration(stats.totalTime)} tracked`} />
            <ContextPill icon="🏆" label={stats.topApp} />
            <ContextPill
              icon={stats.productivity.score >= 70 ? '🟢' : stats.productivity.score >= 45 ? '🟡' : '🔴'}
              label={`Score ${stats.productivity.score}/100`}
            />
            <ContextPill icon="📊" label={`${stats.appStats.length} apps`} />
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {status === 'checking' && (
          <div className="flex items-center justify-center h-32">
            <div className="flex items-center gap-3 text-text-muted">
              <div className="w-5 h-5 border-2 border-accent-purple border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Connecting to Ollama…</span>
            </div>
          </div>
        )}

        {status === 'offline' && (
          <OfflineCard />
        )}

        {status === 'ready' && messages.length === 0 && (
          <WelcomeScreen
            stats={stats}
            onQuickPrompt={(p) => send(p)}
          />
        )}

        {messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} />
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      {status === 'ready' && (
        <div className="px-6 py-4 border-t border-border shrink-0">
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Ask about your activity… (Enter to send, Shift+Enter for newline)"
                rows={1}
                disabled={loading}
                className="w-full bg-bg-card border border-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-purple/60 resize-none transition-colors disabled:opacity-60"
                style={{ maxHeight: '120px', overflowY: 'auto' }}
                onInput={(e) => {
                  const el = e.currentTarget
                  el.style.height = 'auto'
                  el.style.height = `${Math.min(el.scrollHeight, 120)}px`
                }}
              />
            </div>
            {loading ? (
              <button
                onClick={stopStreaming}
                className="px-4 py-3 bg-red-500/20 border border-red-500/50 text-red-400 text-sm font-medium rounded-xl hover:bg-red-500/30 transition-colors shrink-0"
              >
                ⏹ Stop
              </button>
            ) : (
              <button
                onClick={() => send(input)}
                disabled={!input.trim() || !selectedModel}
                className="px-4 py-3 bg-accent-purple text-white text-sm font-medium rounded-xl hover:bg-opacity-90 transition-colors disabled:opacity-40 shrink-0"
              >
                Send
              </button>
            )}
          </div>
          <p className="text-xs text-text-muted mt-2 text-center">
            Your activity data stays on your machine — Ollama runs fully locally.
          </p>
        </div>
      )}
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: 'checking' | 'ready' | 'offline' }): JSX.Element {
  if (status === 'checking')
    return <span className="flex items-center gap-1.5 text-xs text-text-muted"><span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />Connecting</span>
  if (status === 'ready')
    return <span className="flex items-center gap-1.5 text-xs text-green-400"><span className="w-2 h-2 rounded-full bg-green-400" />Ollama ready</span>
  return <span className="flex items-center gap-1.5 text-xs text-red-400"><span className="w-2 h-2 rounded-full bg-red-400" />Ollama offline</span>
}

function ContextPill({ icon, label }: { icon: string; label: string }): JSX.Element {
  return (
    <span className="flex items-center gap-1 bg-bg-card border border-border rounded-full px-2.5 py-1 text-xs text-text-secondary">
      <span>{icon}</span>{label}
    </span>
  )
}

function MessageBubble({ msg }: { msg: Msg }): JSX.Element {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} gap-3`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center text-sm shrink-0 mt-0.5">
          🧠
        </div>
      )}
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'bg-accent-purple text-white rounded-br-sm'
            : 'bg-bg-card border border-border text-text-primary rounded-bl-sm'
        }`}
      >
        {msg.content || (msg.streaming ? <ThinkingDots /> : '')}
        {msg.streaming && msg.content && (
          <span className="inline-block w-1.5 h-4 bg-current ml-0.5 animate-pulse align-text-bottom rounded-sm" />
        )}
      </div>
      {isUser && (
        <div className="w-7 h-7 rounded-full bg-bg-card border border-border flex items-center justify-center text-sm shrink-0 mt-0.5">
          👤
        </div>
      )}
    </div>
  )
}

function ThinkingDots(): JSX.Element {
  return (
    <span className="flex gap-1 items-center py-1">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </span>
  )
}

function WelcomeScreen({ stats, onQuickPrompt }: { stats: DayStats | null; onQuickPrompt: (p: string) => void }): JSX.Element {
  return (
    <div className="flex flex-col items-center py-6 text-center">
      <div className="text-5xl mb-3">🧠</div>
      <h2 className="text-lg font-semibold text-text-primary mb-1">Ask about your day</h2>
      <p className="text-sm text-text-secondary mb-6 max-w-md">
        Your AI coach has full context of today's activity. Ask anything — it's powered by Ollama, running entirely on your machine.
      </p>

      <div className="grid grid-cols-2 gap-2.5 w-full max-w-lg">
        {QUICK_PROMPTS.map((qp) => (
          <button
            key={qp.label}
            onClick={() => onQuickPrompt(qp.prompt)}
            className="flex items-center gap-2.5 bg-bg-card border border-border rounded-xl px-4 py-3 text-sm text-left hover:border-accent-purple/40 hover:bg-bg-hover transition-all group"
          >
            <span className="text-xl shrink-0">{qp.icon}</span>
            <span className="text-text-secondary group-hover:text-text-primary transition-colors">{qp.label}</span>
          </button>
        ))}
      </div>

      {stats && stats.totalTime === 0 && (
        <p className="mt-5 text-xs text-text-muted bg-bg-card border border-border rounded-lg px-4 py-2">
          No activity recorded today yet — start using your computer and check back!
        </p>
      )}
    </div>
  )
}

function OfflineCard(): JSX.Element {
  return (
    <div className="flex flex-col items-center py-10 text-center max-w-md mx-auto">
      <div className="text-5xl mb-4">🦙</div>
      <h2 className="text-lg font-semibold text-text-primary mb-2">Ollama not detected</h2>
      <p className="text-sm text-text-secondary mb-5">
        AI Insights uses <strong className="text-text-primary">Ollama</strong> to run language models 100% locally on your machine — no API keys, no cloud, no data leaving your computer.
      </p>
      <div className="bg-bg-card border border-border rounded-xl p-5 text-left w-full space-y-4">
        <Step n={1} text='Install Ollama from ollama.com' />
        <Step n={2} text='Pull a model — e.g. run in terminal:' code='ollama pull llama3.2' />
        <Step n={3} text='Start Ollama (it runs as a background service)' />
        <Step n={4} text='Reload this page — your model will appear above' />
      </div>
      <div className="mt-4 flex flex-wrap gap-2 justify-center">
        {['llama3.2', 'mistral', 'gemma3', 'phi4', 'qwen2.5'].map((m) => (
          <span key={m} className="bg-bg-card border border-border rounded-full px-3 py-1 text-xs font-mono text-text-muted">{m}</span>
        ))}
      </div>
      <p className="mt-2 text-xs text-text-muted">Recommended models — pick any that fits your RAM</p>
    </div>
  )
}

function Step({ n, text, code }: { n: number; text: string; code?: string }): JSX.Element {
  return (
    <div className="flex gap-3">
      <span className="w-6 h-6 rounded-full bg-accent-purple/20 text-accent-purple text-xs font-bold flex items-center justify-center shrink-0">
        {n}
      </span>
      <div>
        <p className="text-sm text-text-secondary">{text}</p>
        {code && (
          <code className="block mt-1 bg-bg-primary border border-border rounded px-3 py-1.5 text-xs font-mono text-green-400">
            {code}
          </code>
        )}
      </div>
    </div>
  )
}
