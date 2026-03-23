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
        background: '#0F172A',
        card: '#1E293B',
        border: '#334155',
        muted: '#475569',
        activity: {
          wake: '#EAB308',    // 기상 - 노란
          sleep: '#A855F7',   // 취침 - 보라
          study: '#3B82F6',   // 공부 - 파랑
          exercise: '#22C55E',// 운동 - 초록
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
