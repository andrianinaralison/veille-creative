import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import request from 'supertest'
import { SignJWT } from 'jose'

// BDD mockée : store in-memory des saves, clé `${userId}|${refId}`.
const saves = new Set()

vi.mock('../lib/prisma.js', () => ({
  prisma: {
    $queryRaw: vi.fn().mockResolvedValue([{ '?column?': 1 }]),
    reference: {
      // 'missing' simule une réf absente / non PUBLISHED → 404
      findFirst: vi.fn(async ({ where }) => (where.id === 'missing' ? null : { id: where.id })),
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
    },
    savedReference: {
      upsert: vi.fn(async ({ where }) => {
        const { userId, referenceId } = where.userId_referenceId
        saves.add(`${userId}|${referenceId}`)
        return { userId, referenceId }
      }),
      deleteMany: vi.fn(async ({ where }) => {
        const key = `${where.userId}|${where.referenceId}`
        const had = saves.has(key)
        saves.delete(key)
        return { count: had ? 1 : 0 }
      }),
      findMany: vi.fn(async ({ where }) =>
        [...saves]
          .filter(k => k.startsWith(`${where.userId}|`))
          .map(k => {
            const referenceId = k.split('|')[1]
            return {
              referenceId,
              savedAt: new Date(),
              userTags: [],
              note: '',
              reference: { id: referenceId, status: 'PUBLISHED', tags: [], title: 'Ref' },
            }
          }),
      ),
    },
  },
}))

const { createApp } = await import('../app.js')

async function userToken(sub) {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET)
  return new SignJWT({ role: 'user' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(sub)
    .setExpirationTime('1h')
    .sign(secret)
}

let app
let tokenA
let tokenB

beforeAll(async () => {
  app = createApp()
  tokenA = await userToken('userA')
  tokenB = await userToken('userB')
})

beforeEach(() => saves.clear())

describe('Save — protection (401 sans token)', () => {
  it('PUT /api/v1/references/:id/save → 401', async () => {
    const res = await request(app).put('/api/v1/references/r1/save')
    expect(res.status).toBe(401)
  })

  it('DELETE /api/v1/references/:id/save → 401', async () => {
    const res = await request(app).delete('/api/v1/references/r1/save')
    expect(res.status).toBe(401)
  })

  it('GET /api/v1/library → 401', async () => {
    const res = await request(app).get('/api/v1/library')
    expect(res.status).toBe(401)
  })
})

describe('Save / unsave', () => {
  it('PUT save → 200 { saved: true } et apparaît dans la Bibliothèque', async () => {
    const save = await request(app).put('/api/v1/references/r1/save').set('Authorization', `Bearer ${tokenA}`)
    expect(save.status).toBe(200)
    expect(save.body).toEqual({ saved: true })

    const lib = await request(app).get('/api/v1/library').set('Authorization', `Bearer ${tokenA}`)
    expect(lib.body.total).toBe(1)
    expect(lib.body.references[0].id).toBe('r1')
    expect(lib.body.references[0].saved).toBe(true)
  })

  it('PUT save deux fois → idempotent (une seule entrée)', async () => {
    await request(app).put('/api/v1/references/r1/save').set('Authorization', `Bearer ${tokenA}`)
    await request(app).put('/api/v1/references/r1/save').set('Authorization', `Bearer ${tokenA}`)
    const lib = await request(app).get('/api/v1/library').set('Authorization', `Bearer ${tokenA}`)
    expect(lib.body.total).toBe(1)
  })

  it('DELETE unsave → 200 { saved: false } et retire de la Bibliothèque', async () => {
    await request(app).put('/api/v1/references/r1/save').set('Authorization', `Bearer ${tokenA}`)
    const del = await request(app).delete('/api/v1/references/r1/save').set('Authorization', `Bearer ${tokenA}`)
    expect(del.status).toBe(200)
    expect(del.body).toEqual({ saved: false })

    const lib = await request(app).get('/api/v1/library').set('Authorization', `Bearer ${tokenA}`)
    expect(lib.body.total).toBe(0)
  })

  it('DELETE unsave sur une réf non sauvegardée → 200 (idempotent)', async () => {
    const del = await request(app).delete('/api/v1/references/r1/save').set('Authorization', `Bearer ${tokenA}`)
    expect(del.status).toBe(200)
    expect(del.body).toEqual({ saved: false })
  })

  it('PUT save sur réf inexistante → 404', async () => {
    const res = await request(app).put('/api/v1/references/missing/save').set('Authorization', `Bearer ${tokenA}`)
    expect(res.status).toBe(404)
  })
})

describe('Scopage utilisateur', () => {
  it('le save de userA est invisible chez userB', async () => {
    await request(app).put('/api/v1/references/r1/save').set('Authorization', `Bearer ${tokenA}`)

    const libA = await request(app).get('/api/v1/library').set('Authorization', `Bearer ${tokenA}`)
    const libB = await request(app).get('/api/v1/library').set('Authorization', `Bearer ${tokenB}`)

    expect(libA.body.total).toBe(1)
    expect(libB.body.total).toBe(0)
  })
})
