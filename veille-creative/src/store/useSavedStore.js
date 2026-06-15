import { create } from 'zustand'
import { api } from '../lib/api'
import { getUserToken } from '../lib/user-auth'

/**
 * État des références sauvegardées — source de vérité unique du geste « Save » (180-67).
 * Toutes les surfaces (carte, modale, page créateur, résultats, Bibliothèque) lisent
 * `ids.has(refId)` → un toggle se reflète instantanément partout.
 */

// File d'attente par référence : sérialise les requêtes save/unsave d'un même id pour
// qu'elles n'arrivent jamais dans le désordre côté serveur (anti-race). Hors du store
// car c'est de l'état runtime transitoire, non réactif.
const inflight = new Map()

export const useSavedStore = create((set, get) => ({
  ids: new Set(),
  hydrated: false,

  // Baseline globale : charge le vivier de l'utilisateur (login + hydratation auth).
  async hydrate() {
    if (!getUserToken()) return set({ ids: new Set(), hydrated: true })
    try {
      const { references } = await api.library.list()
      set({ ids: new Set(references.map(r => r.id)), hydrated: true })
    } catch {
      set({ hydrated: true })
    }
  },

  // Aligne le store sur le flag `saved` autoritatif renvoyé par les listes
  // (/references, /sections) → supprime le flash au chargement. On ne touche pas aux
  // refs dont un toggle est en vol pour ne pas écraser l'état optimiste.
  mergeFlags(refs) {
    if (!refs?.length) return
    set(state => {
      const ids = new Set(state.ids)
      for (const r of refs) {
        if (inflight.has(r.id)) continue
        if (r.saved) ids.add(r.id)
        else ids.delete(r.id)
      }
      return { ids }
    })
  },

  // Optimiste + sérialisé par id : la cible (save/unsave) est figée au clic, donc des
  // clics rapides partent dans l'ordre et l'état final reste cohérent avec le serveur.
  toggle(id) {
    const target = !get().ids.has(id) // état voulu après ce clic
    // Optimiste immédiat
    set(state => {
      const ids = new Set(state.ids)
      if (target) ids.add(id); else ids.delete(id)
      return { ids }
    })

    const prev = inflight.get(id) ?? Promise.resolve()
    const op = prev.then(async () => {
      try {
        if (target) await api.references.save(id)
        else await api.references.unsave(id)
      } catch (err) {
        // Rollback de ce clic
        set(state => {
          const ids = new Set(state.ids)
          if (target) ids.delete(id); else ids.add(id)
          return { ids }
        })
        throw err
      }
    })

    // Garde la chaîne vivante même si une étape échoue, et nettoie la map en fin de file.
    const chained = op.catch(() => {})
    inflight.set(id, chained)
    chained.finally(() => { if (inflight.get(id) === chained) inflight.delete(id) })

    return op
  },

  reset() {
    inflight.clear()
    set({ ids: new Set(), hydrated: false })
  },
}))
