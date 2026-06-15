import { create } from 'zustand'
import { api } from '../lib/api'
import { getUserToken } from '../lib/user-auth'

/**
 * État des références sauvegardées — source de vérité unique du geste « Save » (180-67).
 * Toutes les surfaces (carte, modale, page créateur, résultats, Bibliothèque) lisent
 * `ids.has(refId)` → un toggle se reflète instantanément partout.
 * Optimiste : on met à jour l'UI tout de suite, rollback si l'API échoue.
 */
export const useSavedStore = create((set, get) => ({
  ids: new Set(),
  hydrated: false,

  // Charge le vivier de l'utilisateur connecté (appelé au login + à l'hydratation auth).
  async hydrate() {
    if (!getUserToken()) return set({ ids: new Set(), hydrated: true })
    try {
      const { references } = await api.library.list()
      set({ ids: new Set(references.map(r => r.id)), hydrated: true })
    } catch {
      set({ hydrated: true })
    }
  },

  async toggle(id) {
    const wasSaved = get().ids.has(id)
    // Optimiste
    set(state => {
      const ids = new Set(state.ids)
      if (wasSaved) ids.delete(id); else ids.add(id)
      return { ids }
    })
    try {
      if (wasSaved) await api.references.unsave(id)
      else await api.references.save(id)
    } catch (err) {
      // Rollback
      set(state => {
        const ids = new Set(state.ids)
        if (wasSaved) ids.add(id); else ids.delete(id)
        return { ids }
      })
      throw err
    }
    return !wasSaved
  },

  reset() {
    set({ ids: new Set(), hydrated: false })
  },
}))
