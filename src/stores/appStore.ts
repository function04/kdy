import { create } from 'zustand'
import type { ActivityType } from '@/types/activity'

interface AppStore {
  // 진행 중인 활동 (study / exercise만 타이머)
  activeActivityId: string | null
  activeActivityType: ActivityType | null
  activeActivityStartedAt: string | null

  setActiveActivity: (id: string, type: ActivityType, startedAt: string) => void
  clearActiveActivity: () => void
}

export const useAppStore = create<AppStore>((set) => ({
  activeActivityId: null,
  activeActivityType: null,
  activeActivityStartedAt: null,

  setActiveActivity: (id, type, startedAt) =>
    set({ activeActivityId: id, activeActivityType: type, activeActivityStartedAt: startedAt }),

  clearActiveActivity: () =>
    set({ activeActivityId: null, activeActivityType: null, activeActivityStartedAt: null }),
}))
