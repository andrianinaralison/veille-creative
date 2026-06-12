import { create } from 'zustand'
import { api } from '../lib/api'
import { getUserToken, setUserToken, clearUserToken } from '../lib/user-auth'

export const useAuthStore = create((set) => ({
  user: null,
  // 'idle' tant que /me n'a pas répondu — évite le flash de redirection au refresh
  status: getUserToken() ? 'idle' : 'anonymous',

  async hydrate() {
    if (!getUserToken()) return set({ status: 'anonymous', user: null })
    try {
      const { user } = await api.auth.me()
      set({ user, status: 'authenticated' })
    } catch {
      clearUserToken()
      set({ user: null, status: 'anonymous' })
    }
  },

  async login(credentials) {
    const { token, user } = await api.auth.login(credentials)
    setUserToken(token)
    set({ user, status: 'authenticated' })
  },

  async signup(data) {
    const { token, user } = await api.auth.signup(data)
    setUserToken(token)
    set({ user, status: 'authenticated' })
  },

  logout() {
    clearUserToken()
    set({ user: null, status: 'anonymous' })
  },
}))
