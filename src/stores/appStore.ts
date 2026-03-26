import { create } from 'zustand'
import type { ActivityType } from '@/types/activity'

interface AppStore {
  activeActivityId: string | null
  activeActivityType: ActivityType | null
  activeActivityStartedAt: string | null
  activeActivityNote: string | null

  setActiveActivity: (id: string, type: ActivityType, startedAt: string, note?: string) => void
  clearActiveActivity: () => void

  flashMessage: string | null
  flashKey: number
  showFlash: (msg: string) => void
}

export const useAppStore = create<AppStore>((set) => ({
  activeActivityId: null,
  activeActivityType: null,
  activeActivityStartedAt: null,
  activeActivityNote: null,

  setActiveActivity: (id, type, startedAt, note) =>
    set({ activeActivityId: id, activeActivityType: type, activeActivityStartedAt: startedAt, activeActivityNote: note ?? null }),

  clearActiveActivity: () =>
    set({ activeActivityId: null, activeActivityType: null, activeActivityStartedAt: null, activeActivityNote: null }),

  flashMessage: null,
  flashKey: 0,
  showFlash: (msg) =>
    set((s) => ({ flashMessage: msg, flashKey: s.flashKey + 1 })),
}))
