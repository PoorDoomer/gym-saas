import { create } from 'zustand'

interface AppState {
  lastUpdated: number
  setUpdated: () => void
}

export const useAppStore = create<AppState>(set => ({
  lastUpdated: Date.now(),
  setUpdated: () => set({ lastUpdated: Date.now() })
}))
