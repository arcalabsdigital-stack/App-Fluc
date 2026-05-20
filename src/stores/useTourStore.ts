import { create } from 'zustand'

interface TourStore {
  isActive: boolean
  step: number
  startTour: () => void
  nextStep: () => void
  prevStep: () => void
  endTour: () => void
}

export const useTourStore = create<TourStore>((set) => ({
  isActive: false,
  step: 0,
  startTour: () => set({ isActive: true, step: 0 }),
  nextStep: () => set((state) => ({ step: state.step + 1 })),
  prevStep: () => set((state) => ({ step: state.step - 1 })),
  endTour: () => set({ isActive: false }),
}))
