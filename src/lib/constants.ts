import type { ActivityType } from '@/types/activity'

export const ACTIVITY_CONFIG: Record<ActivityType, {
  label: string
  color: string
  bgColor: string
  borderColor: string
  icon: string
}> = {
  wake: {
    label: '기상',
    color: '#EAB308',
    bgColor: 'bg-yellow-500/20',
    borderColor: 'border-yellow-500',
    icon: '☀️',
  },
  sleep: {
    label: '취침',
    color: '#A855F7',
    bgColor: 'bg-purple-500/20',
    borderColor: 'border-purple-500',
    icon: '🌙',
  },
  study: {
    label: '공부',
    color: '#3B82F6',
    bgColor: 'bg-blue-500/20',
    borderColor: 'border-blue-500',
    icon: '📚',
  },
  exercise: {
    label: '운동',
    color: '#22C55E',
    bgColor: 'bg-green-500/20',
    borderColor: 'border-green-500',
    icon: '💪',
  },
}

export const KOREAN_CITIES = [
  { name: '서울', lat: 37.5665, lon: 126.9780 },
  { name: '인천', lat: 37.4563, lon: 126.7052 },
  { name: '경기 수원', lat: 37.2636, lon: 127.0286 },
  { name: '부산', lat: 35.1796, lon: 129.0756 },
  { name: '대구', lat: 35.8714, lon: 128.6014 },
  { name: '대전', lat: 36.3504, lon: 127.3845 },
  { name: '광주', lat: 35.1595, lon: 126.8526 },
  { name: '울산', lat: 35.5384, lon: 129.3114 },
  { name: '제주', lat: 33.4996, lon: 126.5312 },
]
