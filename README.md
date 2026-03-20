# Track Activity

A Windows desktop app to track how you spend your time on your computer — similar to Rize. Built with Electron, React, and TypeScript.

## Features

- **Auto-tracking** — Detects active window every 2 seconds and records sessions to a local SQLite database
- **Dashboard** — Today's stats with pie chart, hourly activity bar chart, and per-app breakdown
- **Apps** — Filter by category (Development, Browser, Communication, Design, etc.)
- **Timeline** — Visual timeline of your day showing when you used each app
- **History** — 7/30/90 day trends with daily averages and streaks
- **Category editor** — Reassign any app to a different category
- **System tray** — Runs in the background, always tracking
- **Live updates** — Shows what you're working on right now

## Tech Stack

- [Electron](https://electronjs.org) + [electron-vite](https://electron-vite.org)
- [React 18](https://react.dev) + [TypeScript](https://typescriptlang.org)
- [Tailwind CSS](https://tailwindcss.com)
- [Recharts](https://recharts.org) for visualizations
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) for local storage
- [active-win](https://github.com/sindresorhus/active-win) for window detection

## Development

```bash
npm install
npm run dev
```

## Build (Windows)

```bash
npm run package
```

This will produce a Windows installer in the `dist/` folder.

## Data

All data is stored locally in SQLite at:
```
%APPDATA%\track-activity\activity.db
```

No data leaves your machine.
