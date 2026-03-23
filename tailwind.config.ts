import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--color-background)',
        card: 'var(--color-card)',
        border: 'var(--color-border)',
        muted: 'var(--color-muted)',
        primary: 'var(--color-text)',
        secondary: 'var(--color-text-sub)',
        activity: {
          wake: '#EAB308',
          sleep: '#A855F7',
          study: '#3B82F6',
          exercise: '#22C55E',
        },
      },
      borderRadius: {
        lg: '0.75rem',
        md: '0.5rem',
        sm: '0.375rem',
      },
    },
  },
  plugins: [],
}

export default config
