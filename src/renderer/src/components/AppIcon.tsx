import { CATEGORY_ICONS } from '../types'

const APP_EMOJIS: Record<string, string> = {
  'Visual Studio Code': '💻',
  'VS Code Insiders': '💻',
  'Cursor': '💻',
  'Visual Studio': '🖥',
  'IntelliJ IDEA': '💡',
  'PyCharm': '🐍',
  'WebStorm': '🌐',
  'Sublime Text': '✏️',
  'Notepad++': '📝',
  'Neovim': '📝',
  'Vim': '📝',
  'GitHub': '🐙',
  'GitLab': '🦊',
  'Stack Overflow': '📚',
  'Vercel': '▲',
  'Netlify': '🚀',
  'AWS': '☁️',
  'npm': '📦',
  'Google Chrome': '🌐',
  'Microsoft Edge': '🌀',
  'Firefox': '🦊',
  'Brave': '🦁',
  'Slack': '💬',
  'Discord': '🎮',
  'Microsoft Teams': '👥',
  'Zoom': '📹',
  'Telegram': '✈️',
  'WhatsApp': '💚',
  'Gmail': '📧',
  'Microsoft Outlook': '📧',
  'Google Meet': '📹',
  'LinkedIn': '💼',
  'Twitter / X': '🐦',
  'Reddit': '🤖',
  'Facebook': '📘',
  'Instagram': '📸',
  'Hacker News': '🔶',
  'YouTube': '▶️',
  'Netflix': '🎬',
  'Twitch': '🎮',
  'Spotify': '🎵',
  'Spotify Web': '🎵',
  'ChatGPT': '🤖',
  'Claude': '🧠',
  'Gemini': '✨',
  'Microsoft Word': '📄',
  'Microsoft Excel': '📊',
  'PowerPoint': '📊',
  'Notion': '📋',
  'Obsidian': '💎',
  'Google Docs': '📄',
  'Google Sheets': '📊',
  'Google Slides': '📊',
  'Figma': '🎨',
  'Photoshop': '🎨',
  'Canva': '🎨',
  'Jira': '🗂',
  'Confluence': '📚',
  'Linear': '📐',
  'Windows Terminal': '⌨️',
  'PowerShell': '⚡',
  'Command Prompt': '⌨️',
  'File Explorer': '📁',
  'Task Manager': '⚙️',
  'Notepad': '📝',
  'Calculator': '🧮',
}

interface AppIconProps {
  appName: string
  category: string
  size?: 'sm' | 'md' | 'lg'
}

export default function AppIcon({ appName, category, size = 'md' }: AppIconProps): JSX.Element {
  const emoji = APP_EMOJIS[appName] ?? CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS] ?? '📦'
  const sizes = { sm: 'text-sm', md: 'text-lg', lg: 'text-2xl' }
  return <span className={sizes[size]} role="img" aria-label={appName}>{emoji}</span>
}
