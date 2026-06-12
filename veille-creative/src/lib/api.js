import { getUserToken, clearUserToken } from './user-auth'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export async function apiFetch(path, opts = {}) {
  const token = getUserToken()
  const r = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...opts,
  })
  if (r.status === 401 && !path.startsWith('/api/v1/auth/')) {
    clearUserToken()
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }
  if (!r.ok) throw new Error(await r.text())
  return r.json()
}

export const api = {
  auth: {
    signup: (data) => apiFetch('/api/v1/auth/signup', { method: 'POST', body: JSON.stringify(data) }),
    login: (data) => apiFetch('/api/v1/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    me: () => apiFetch('/api/v1/auth/me'),
    updateMe: (data) => apiFetch('/api/v1/auth/me', { method: 'PATCH', body: JSON.stringify(data) }),
  },
  references: {
    list: (params = {}) => {
      const q = new URLSearchParams(params).toString()
      return apiFetch(`/api/v1/references${q ? '?' + q : ''}`)
    },
    sections: () => apiFetch('/api/v1/references/sections'),
  },
  projects: {
    list: () => apiFetch('/api/v1/projects'),
    get: (id) => apiFetch(`/api/v1/projects/${id}`),
    create: (data) => apiFetch('/api/v1/projects', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => apiFetch(`/api/v1/projects/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    setItems: (id, items) => apiFetch(`/api/v1/projects/${id}/items`, { method: 'PUT', body: JSON.stringify({ items }) }),
    remove: (id) => apiFetch(`/api/v1/projects/${id}`, { method: 'DELETE' }),
  },
  search: {
    query: (q) => apiFetch('/api/v1/search', {
      method: 'POST',
      body: JSON.stringify({ query: q }),
    }),
  },
}
