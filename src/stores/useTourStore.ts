import { create } from 'zustand'

interface TourStore {
  isActive: boolean
  step: number
  startTour: (force?: boolean) => void
  nextStep: () => void
  prevStep: () => void
  endTour: () => void
}

export const useTourStore = create<TourStore>((set) => ({
  isActive: false,
  step: 0,
  startTour: (force = false) => {
    const hasSeen = localStorage.getItem('fluc_tour_completed')
    if (!hasSeen || force) {
      set({ isActive: true, step: 0 })
    }
  },
  nextStep: () => set((state) => ({ step: state.step + 1 })),
  prevStep: () => set((state) => ({ step: state.step - 1 })),
  endTour: () => {
    localStorage.setItem('fluc_tour_completed', 'true')
    set({ isActive: false })
  },
}))
