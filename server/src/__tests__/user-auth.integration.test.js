import { describe, it, expect, beforeAll, vi } from 'vitest'
import request from 'supertest'
import { SignJWT } from 'jose'

// BDD mockée : un store in-memory suffit pour tester signup/login/me
const users = new Map()
vi.mock('../lib/prisma.js', () => ({
  prisma: {
    $queryRaw: vi.fn().mockResolvedValue([{ '?column?': 1 }]),
    user: {
      create: vi.fn(async ({ data }) => {
        if ([...users.values()].some(u => u.email === data.email)) {
          const err = new Error('Unique constraint'); err.code = 'P2002'; throw err
        }
        const user = { id: `u${users.size + 1}`, createdAt: new Date(), firstName: '', ...data }
        users.set(user.id, user)
        return user
      }),
      findUnique: vi.fn(async ({ where }) => {
        if (where.id) return users.get(where.id) ?? null
        return [...users.values()].find(u => u.email === where.email) ?? null
      }),
    },
  },
}))

const { createApp } = await import('../app.js')

let app

beforeAll(() => {
  app = createApp()
})

describe('Signup', () => {
  it('POST /api/v1/auth/signup → 201 + token + user sans passwordHash', async () => {
    const res = await request(app)
      .post('/api/v1/auth/signup')
      .send({ email: 'lea@example.com', password: 'motdepasse8', firstName: 'Léa' })
    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('token')
    expect(res.body.user.email).toBe('lea@example.com')
    expect(res.body.user).not.toHaveProperty('passwordHash')
  })

  it('signup même email → 409', async () => {
    const res = await request(app)
      .post('/api/v1/auth/signup')
      .send({ email: 'lea@example.com', password: 'motdepasse8' })
    expect(res.status).toBe(409)
  })

  it('mot de passe < 8 caractères → 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/signup')
      .send({ email: 'court@example.com', password: 'court' })
    expect(res.status).toBe(400)
  })

  it('email invalide → 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/signup')
      .send({ email: 'pas-un-email', password: 'motdepasse8' })
    expect(res.status).toBe(400)
  })
})

describe('Login', () => {
  it('bon mot de passe → 200 + token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'lea@example.com', password: 'motdepasse8' })
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('token')
  })

  it('mauvais mot de passe → 401', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'lea@example.com', password: 'mauvais-mdp' })
    expect(res.status).toBe(401)
  })

  it('email inconnu → 401 (pas d oracle d existence)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'inconnu@example.com', password: 'motdepasse8' })
    expect(res.status).toBe(401)
  })
})

describe('Me + protection des routes contenu', () => {
  async function loginToken() {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'lea@example.com', password: 'motdepasse8' })
    return res.body.token
  }

  it('GET /api/v1/auth/me avec token → 200 + profil', async () => {
    const token = await loginToken()
    const res = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.user.email).toBe('lea@example.com')
  })

  it('GET /api/v1/auth/me sans token → 401', async () => {
    const res = await request(app).get('/api/v1/auth/me')
    expect(res.status).toBe(401)
  })

  it('GET /api/v1/references sans token → 401 (DoD 180-16)', async () => {
    const res = await request(app).get('/api/v1/references')
    expect(res.status).toBe(401)
  })

  it('POST /api/v1/search sans token → 401', async () => {
    const res = await request(app).post('/api/v1/search').send({ query: 'mariage' })
    expect(res.status).toBe(401)
  })
})

describe('Séparation des rôles admin / user', () => {
  it('un token user ne passe pas requireAdmin → 401', async () => {
    const token = await (async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'lea@example.com', password: 'motdepasse8' })
      return res.body.token
    })()
    const res = await request(app).get('/api/v1/admin/references').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(401)
  })

  it('un token admin (role admin) ne passe pas requireUser → 401', async () => {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET)
    const adminToken = await new SignJWT({ role: 'admin' })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('1h')
      .sign(secret)
    const res = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(401)
  })
})
