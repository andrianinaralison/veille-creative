import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import { createApp } from '../app.js'

let app

beforeAll(() => {
  app = createApp()
})

describe('Health check', () => {
  it('GET /health → 200 ok', async () => {
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
  })
})

describe('Routes admin protégées — 401 sans token', () => {
  it('GET /api/v1/admin/references sans token → 401', async () => {
    const res = await request(app).get('/api/v1/admin/references')
    expect(res.status).toBe(401)
  })

  it('PATCH /api/v1/admin/references/fake-id/status sans token → 401', async () => {
    const res = await request(app)
      .patch('/api/v1/admin/references/fake-id/status')
      .send({ status: 'PUBLISHED' })
    expect(res.status).toBe(401)
  })

  it('GET /api/v1/admin/creators sans token → 401', async () => {
    const res = await request(app).get('/api/v1/admin/creators')
    expect(res.status).toBe(401)
  })
})

describe('Routes ingestion protégées — 401 sans token', () => {
  it('POST /api/v1/ingestion/sessions sans token → 401', async () => {
    const res = await request(app)
      .post('/api/v1/ingestion/sessions')
      .send({ brief: 'test' })
    expect(res.status).toBe(401)
  })
})

describe('Login admin', () => {
  it('POST /api/v1/admin/login avec mauvais mot de passe → 401', async () => {
    const res = await request(app)
      .post('/api/v1/admin/login')
      .send({ password: 'mauvais-mot-de-passe' })
    expect(res.status).toBe(401)
  })

  it('POST /api/v1/admin/login sans body → 400', async () => {
    const res = await request(app)
      .post('/api/v1/admin/login')
      .send({})
    expect(res.status).toBe(400)
  })

  it('POST /api/v1/admin/login avec bon mot de passe → 200 + token', async () => {
    const res = await request(app)
      .post('/api/v1/admin/login')
      .send({ password: 'admin180' })
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('token')
    expect(typeof res.body.token).toBe('string')
  })
})
