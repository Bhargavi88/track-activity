/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/src/**/*.{js,ts,jsx,tsx}', './src/renderer/index.html'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0d0f14',
          secondary: '#141720',
          card: '#1a1d2e',
          hover: '#1f2235'
        },
        border: {
          DEFAULT: '#252840',
          light: '#2d3155'
        },
        accent: {
          purple: '#7c6cf5',
          blue: '#4f8ef7',
          green: '#34d399',
          amber: '#fbbf24',
          pink: '#f472b6',
          red: '#f87171'
        },
        text: {
          primary: '#e2e8f0',
          secondary: '#94a3b8',
          muted: '#64748b'
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif']
      }
    }
  },
  plugins: []
}
