import type { CategoryName } from '../shared/types'
import { CATEGORY_COLORS } from '../shared/types'

const APP_NAME_MAP: Record<string, string> = {
  'code.exe': 'Visual Studio Code',
  'code - insiders.exe': 'VS Code Insiders',
  'devenv.exe': 'Visual Studio',
  'idea64.exe': 'IntelliJ IDEA',
  'pycharm64.exe': 'PyCharm',
  'webstorm64.exe': 'WebStorm',
  'phpstorm64.exe': 'PhpStorm',
  'rider64.exe': 'Rider',
  'clion64.exe': 'CLion',
  'goland64.exe': 'GoLand',
  'datagrip64.exe': 'DataGrip',
  'cursor.exe': 'Cursor',
  'sublime_text.exe': 'Sublime Text',
  'notepad++.exe': 'Notepad++',
  'atom.exe': 'Atom',
  'vim.exe': 'Vim',
  'nvim.exe': 'Neovim',
  'chrome.exe': 'Google Chrome',
  'firefox.exe': 'Firefox',
  'msedge.exe': 'Microsoft Edge',
  'opera.exe': 'Opera',
  'brave.exe': 'Brave',
  'vivaldi.exe': 'Vivaldi',
  'iexplore.exe': 'Internet Explorer',
  'slack.exe': 'Slack',
  'discord.exe': 'Discord',
  'teams.exe': 'Microsoft Teams',
  'zoom.exe': 'Zoom',
  'skype.exe': 'Skype',
  'telegram.exe': 'Telegram',
  'whatsapp.exe': 'WhatsApp',
  'signal.exe': 'Signal',
  'mattermost.exe': 'Mattermost',
  'outlook.exe': 'Microsoft Outlook',
  'thunderbird.exe': 'Thunderbird',
  'winword.exe': 'Microsoft Word',
  'excel.exe': 'Microsoft Excel',
  'powerpnt.exe': 'PowerPoint',
  'onenote.exe': 'OneNote',
  'notion.exe': 'Notion',
  'obsidian.exe': 'Obsidian',
  'roamresearch.exe': 'Roam Research',
  'logseq.exe': 'Logseq',
  'todoist.exe': 'Todoist',
  'trello.exe': 'Trello',
  'asana.exe': 'Asana',
  'linear.exe': 'Linear',
  'photoshop.exe': 'Photoshop',
  'illustrator.exe': 'Illustrator',
  'figma.exe': 'Figma',
  'sketch.exe': 'Sketch',
  'xd.exe': 'Adobe XD',
  'afterfx.exe': 'After Effects',
  'premiere.exe': 'Premiere Pro',
  'lightroom.exe': 'Lightroom',
  'gimp-2.10.exe': 'GIMP',
  'blender.exe': 'Blender',
  'spotify.exe': 'Spotify',
  'steam.exe': 'Steam',
  'epicgameslauncher.exe': 'Epic Games',
  'vlc.exe': 'VLC',
  'mpv.exe': 'mpv',
  'explorer.exe': 'File Explorer',
  'cmd.exe': 'Command Prompt',
  'powershell.exe': 'PowerShell',
  'windowsterminal.exe': 'Windows Terminal',
  'taskmgr.exe': 'Task Manager',
  'regedit.exe': 'Registry Editor',
  'notepad.exe': 'Notepad',
  'mspaint.exe': 'Paint',
  'calc.exe': 'Calculator',
  'winrar.exe': 'WinRAR',
  '7zfm.exe': '7-Zip'
}

const APP_CATEGORY_MAP: Record<string, CategoryName> = {
  'code.exe': 'Development',
  'code - insiders.exe': 'Development',
  'devenv.exe': 'Development',
  'idea64.exe': 'Development',
  'pycharm64.exe': 'Development',
  'webstorm64.exe': 'Development',
  'phpstorm64.exe': 'Development',
  'rider64.exe': 'Development',
  'clion64.exe': 'Development',
  'goland64.exe': 'Development',
  'datagrip64.exe': 'Development',
  'cursor.exe': 'Development',
  'sublime_text.exe': 'Development',
  'notepad++.exe': 'Development',
  'atom.exe': 'Development',
  'vim.exe': 'Development',
  'nvim.exe': 'Development',
  'chrome.exe': 'Browser',
  'firefox.exe': 'Browser',
  'msedge.exe': 'Browser',
  'opera.exe': 'Browser',
  'brave.exe': 'Browser',
  'vivaldi.exe': 'Browser',
  'iexplore.exe': 'Browser',
  'slack.exe': 'Communication',
  'discord.exe': 'Communication',
  'teams.exe': 'Communication',
  'zoom.exe': 'Communication',
  'skype.exe': 'Communication',
  'telegram.exe': 'Communication',
  'whatsapp.exe': 'Communication',
  'signal.exe': 'Communication',
  'mattermost.exe': 'Communication',
  'outlook.exe': 'Communication',
  'thunderbird.exe': 'Communication',
  'winword.exe': 'Productivity',
  'excel.exe': 'Productivity',
  'powerpnt.exe': 'Productivity',
  'onenote.exe': 'Productivity',
  'notion.exe': 'Productivity',
  'obsidian.exe': 'Productivity',
  'todoist.exe': 'Productivity',
  'trello.exe': 'Productivity',
  'asana.exe': 'Productivity',
  'linear.exe': 'Productivity',
  'photoshop.exe': 'Design',
  'illustrator.exe': 'Design',
  'figma.exe': 'Design',
  'sketch.exe': 'Design',
  'xd.exe': 'Design',
  'afterfx.exe': 'Design',
  'premiere.exe': 'Design',
  'lightroom.exe': 'Design',
  'gimp-2.10.exe': 'Design',
  'blender.exe': 'Design',
  'spotify.exe': 'Entertainment',
  'steam.exe': 'Entertainment',
  'epicgameslauncher.exe': 'Entertainment',
  'vlc.exe': 'Entertainment',
  'mpv.exe': 'Entertainment',
  'explorer.exe': 'System',
  'cmd.exe': 'System',
  'powershell.exe': 'System',
  'windowsterminal.exe': 'System',
  'taskmgr.exe': 'System',
  'regedit.exe': 'System',
  'notepad.exe': 'Productivity',
  'calc.exe': 'System'
}

// Browser executables — we'll try to extract the site from the window title
const BROWSER_EXES = new Set([
  'chrome.exe', 'firefox.exe', 'msedge.exe',
  'opera.exe', 'brave.exe', 'vivaldi.exe', 'iexplore.exe'
])

// Ordered list of site patterns: first match wins
const BROWSER_SITES: { pattern: RegExp; name: string; category: CategoryName }[] = [
  // Development
  { pattern: /\bgithub\b/i, name: 'GitHub', category: 'Development' },
  { pattern: /\bgitlab\b/i, name: 'GitLab', category: 'Development' },
  { pattern: /\bbitbucket\b/i, name: 'Bitbucket', category: 'Development' },
  { pattern: /stack overflow/i, name: 'Stack Overflow', category: 'Development' },
  { pattern: /\bvercel\b/i, name: 'Vercel', category: 'Development' },
  { pattern: /\bnetlify\b/i, name: 'Netlify', category: 'Development' },
  { pattern: /amazon web services|\baws\b/i, name: 'AWS', category: 'Development' },
  { pattern: /\bnpm\b/i, name: 'npm', category: 'Development' },
  { pattern: /\bheroku\b/i, name: 'Heroku', category: 'Development' },
  { pattern: /codepen/i, name: 'CodePen', category: 'Development' },
  { pattern: /codesandbox/i, name: 'CodeSandbox', category: 'Development' },
  { pattern: /replit/i, name: 'Replit', category: 'Development' },
  { pattern: /\bjira\b/i, name: 'Jira', category: 'Productivity' },
  { pattern: /confluence/i, name: 'Confluence', category: 'Productivity' },
  { pattern: /\blinear\b/i, name: 'Linear', category: 'Productivity' },
  // AI tools
  { pattern: /chatgpt|chat\.openai/i, name: 'ChatGPT', category: 'Productivity' },
  { pattern: /claude\.ai/i, name: 'Claude', category: 'Productivity' },
  { pattern: /\bgemini\b/i, name: 'Gemini', category: 'Productivity' },
  { pattern: /perplexity/i, name: 'Perplexity', category: 'Productivity' },
  // Communication
  { pattern: /\bgmail\b/i, name: 'Gmail', category: 'Communication' },
  { pattern: /google meet/i, name: 'Google Meet', category: 'Communication' },
  { pattern: /outlook\.live|outlook\.office/i, name: 'Outlook Web', category: 'Communication' },
  // Productivity / Docs
  { pattern: /google docs/i, name: 'Google Docs', category: 'Productivity' },
  { pattern: /google sheets/i, name: 'Google Sheets', category: 'Productivity' },
  { pattern: /google slides/i, name: 'Google Slides', category: 'Productivity' },
  { pattern: /\bnotion\b/i, name: 'Notion', category: 'Productivity' },
  { pattern: /\btrello\b/i, name: 'Trello', category: 'Productivity' },
  { pattern: /\basana\b/i, name: 'Asana', category: 'Productivity' },
  // Design
  { pattern: /\bfigma\b/i, name: 'Figma', category: 'Design' },
  { pattern: /canva/i, name: 'Canva', category: 'Design' },
  // Social
  { pattern: /\blinkedin\b/i, name: 'LinkedIn', category: 'Social' },
  { pattern: /\btwitter\b|x\.com/i, name: 'Twitter / X', category: 'Social' },
  { pattern: /\breddit\b/i, name: 'Reddit', category: 'Social' },
  { pattern: /\bfacebook\b/i, name: 'Facebook', category: 'Social' },
  { pattern: /\binstagram\b/i, name: 'Instagram', category: 'Social' },
  { pattern: /\bhackernews\b|hacker news/i, name: 'Hacker News', category: 'Social' },
  // Entertainment
  { pattern: /\byoutube\b/i, name: 'YouTube', category: 'Entertainment' },
  { pattern: /\bnetflix\b/i, name: 'Netflix', category: 'Entertainment' },
  { pattern: /\btwitch\b/i, name: 'Twitch', category: 'Entertainment' },
  { pattern: /\bdisney\b|\bdisney\+/i, name: 'Disney+', category: 'Entertainment' },
  { pattern: /\bspotify\b/i, name: 'Spotify Web', category: 'Entertainment' },
]

export interface AppClassification {
  appName: string
  category: CategoryName
  color: string
  isBrowserSite: boolean
}

export function classifyWindow(exeName: string, windowTitle: string): AppClassification {
  const exeKey = exeName.toLowerCase()

  // Check if it's a browser and try to identify the site
  if (BROWSER_EXES.has(exeKey)) {
    for (const site of BROWSER_SITES) {
      if (site.pattern.test(windowTitle)) {
        return {
          appName: site.name,
          category: site.category,
          color: CATEGORY_COLORS[site.category],
          isBrowserSite: true
        }
      }
    }
  }

  const friendlyName = getFriendlyName(exeName)
  const category: CategoryName = APP_CATEGORY_MAP[exeKey] ?? 'Other'
  return {
    appName: friendlyName,
    category,
    color: CATEGORY_COLORS[category],
    isBrowserSite: false
  }
}

export function getFriendlyName(exeName: string): string {
  const key = exeName.toLowerCase()
  if (APP_NAME_MAP[key]) return APP_NAME_MAP[key]
  return exeName.replace(/\.exe$/i, '').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function classifyApp(exeName: string): { category: CategoryName; color: string } {
  const key = exeName.toLowerCase()
  const category: CategoryName = APP_CATEGORY_MAP[key] ?? 'Other'
  return { category, color: CATEGORY_COLORS[category] }
}
