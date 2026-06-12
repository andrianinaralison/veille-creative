import { describe, it, expect, beforeAll, vi } from 'vitest'
import request from 'supertest'

// Garde-fous des routes v0.6/v0.7 — pas de BDD : prisma mocké au minimum
vi.mock('../lib/prisma.js', () => ({
  prisma: {
    $queryRaw: vi.fn().mockResolvedValue([{ '?column?': 1 }]),
    project: { findUnique: vi.fn().mockResolvedValue(null) },
  },
}))

const { createApp } = await import('../app.js')

let app

beforeAll(() => {
  app = createApp()
})

describe('Digests — 401 sans token', () => {
  it('GET /api/v1/digests → 401', async () => {
    const res = await request(app).get('/api/v1/digests')
    expect(res.status).toBe(401)
  })

  it('GET /api/v1/digests/latest → 401', async () => {
    const res = await request(app).get('/api/v1/digests/latest')
    expect(res.status).toBe(401)
  })

  it('GET /api/v1/admin/digests sans token admin → 401', async () => {
    const res = await request(app).get('/api/v1/admin/digests')
    expect(res.status).toBe(401)
  })

  it('POST /api/v1/admin/digests/x/send sans token → 401', async () => {
    const res = await request(app).post('/api/v1/admin/digests/x/send')
    expect(res.status).toBe(401)
  })
})

describe('Projets — 401 sans token', () => {
  it('GET /api/v1/projects → 401', async () => {
    const res = await request(app).get('/api/v1/projects')
    expect(res.status).toBe(401)
  })

  it('POST /api/v1/projects → 401', async () => {
    const res = await request(app).post('/api/v1/projects').send({ title: 'x' })
    expect(res.status).toBe(401)
  })

  it('POST /api/v1/projects/x/share → 401', async () => {
    const res = await request(app).post('/api/v1/projects/x/share')
    expect(res.status).toBe(401)
  })
})

describe('Treatment partagé — public', () => {
  it('GET /api/v1/shared/:token inconnu → 404 (pas 401 : route publique)', async () => {
    const res = await request(app).get('/api/v1/shared/token-inexistant')
    expect(res.status).toBe(404)
  })
})

describe('Préférences — 401 sans token', () => {
  it('PATCH /api/v1/auth/me → 401', async () => {
    const res = await request(app).patch('/api/v1/auth/me').send({ digestOptIn: false })
    expect(res.status).toBe(401)
  })
})
