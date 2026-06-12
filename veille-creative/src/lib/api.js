const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export async function apiFetch(path, opts = {}) {
  const r = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  })
  if (!r.ok) throw new Error(await r.text())
  return r.json()
}

export const api = {
  references: {
    list: (params = {}) => {
      const q = new URLSearchParams(params).toString()
      return apiFetch(`/api/v1/references${q ? '?' + q : ''}`)
    },
    sections: () => apiFetch('/api/v1/references/sections'),
  },
  search: {
    query: (q) => apiFetch('/api/v1/search', {
      method: 'POST',
      body: JSON.stringify({ query: q }),
    }),
  },
}
