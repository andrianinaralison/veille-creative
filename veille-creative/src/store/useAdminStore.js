import { create } from 'zustand'

export const useAdminStore = create((set) => ({
  isDirty: false,
  markDirty: () => set({ isDirty: true }),
  reset: () => set({ isDirty: false }),
}))
