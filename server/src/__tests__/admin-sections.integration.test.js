import { describe, it, expect, beforeAll, vi } from 'vitest'
import request from 'supertest'
import { SignJWT } from 'jose'

// 180-71 — backoffice sections Explorer : reorder + garde suppression AUTO.
// BDD mockée : on observe les appels prisma, pas de vraie base.
const updateCalls = []
const deleteCalls = []

vi.mock('../lib/prisma.js', () => ({
  prisma: {
    $queryRaw: vi.fn().mockResolvedValue([{ '?column?': 1 }]),
    $transaction: vi.fn(ops => Promise.all(ops)),
    section: {
      findUnique: vi.fn(async ({ where }) =>
        where.id === 'missing' ? null : { type: where.id === 'auto-1' ? 'AUTO' : 'MANUAL' }
      ),
      update: vi.fn(async args => { updateCalls.push(args); return { id: args.where.id, ...args.data } }),
      delete: vi.fn(async ({ where }) => { deleteCalls.push(where.id); return { id: where.id } }),
    },
  },
}))

const { createApp } = await import('../app.js')

async function adminToken() {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET)
  return new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject('admin')
    .setExpirationTime('1h')
    .sign(secret)
}

let app
let token

beforeAll(async () => {
  app = createApp()
  token = await adminToken()
})

const auth = req => req.set('Authorization', `Bearer ${token}`)

describe('POST /api/v1/admin/sections/reorder', () => {
  it('persiste position = index pour chaque id fourni', async () => {
    updateCalls.length = 0
    const res = await auth(request(app).post('/api/v1/admin/sections/reorder'))
      .send({ orderedIds: ['c', 'a', 'b'] })
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ ok: true })
    expect(updateCalls).toEqual([
      { where: { id: 'c' }, data: { position: 0 } },
      { where: { id: 'a' }, data: { position: 1 } },
      { where: { id: 'b' }, data: { position: 2 } },
    ])
  })

  it('400 si orderedIds manquant ou vide', async () => {
    const res = await auth(request(app).post('/api/v1/admin/sections/reorder')).send({})
    expect(res.status).toBe(400)
  })

  it('401 sans token admin', async () => {
    const res = await request(app).post('/api/v1/admin/sections/reorder').send({ orderedIds: ['a'] })
    expect(res.status).toBe(401)
  })
})

describe('DELETE /api/v1/admin/sections/:id — garde AUTO', () => {
  it('409 et ne supprime pas une section AUTO', async () => {
    deleteCalls.length = 0
    const res = await auth(request(app).delete('/api/v1/admin/sections/auto-1'))
    expect(res.status).toBe(409)
    expect(deleteCalls).toEqual([])
  })

  it('200 et supprime une section MANUAL', async () => {
    deleteCalls.length = 0
    const res = await auth(request(app).delete('/api/v1/admin/sections/manual-1'))
    expect(res.status).toBe(200)
    expect(deleteCalls).toEqual(['manual-1'])
  })

  it('404 si la section est introuvable', async () => {
    const res = await auth(request(app).delete('/api/v1/admin/sections/missing'))
    expect(res.status).toBe(404)
  })
})
