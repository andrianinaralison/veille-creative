import { Router } from 'express'
import { z } from 'zod'
import { SignJWT } from 'jose'
import bcrypt from 'bcrypt'
import { prisma } from '../lib/prisma.js'
import { validate, asyncHandler } from '../middleware/validate.js'
import { requireUser } from '../middleware/require-user.js'

const router = Router()

// min(8) au signup seulement — au login, toute longueur passe en bcrypt.compare
// et échoue en 401 uniforme (pas d'oracle sur la politique de mot de passe)
const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Email invalide'),
  password: z.string().min(1).max(128),
})

const signupSchema = z.object({
  email: z.string().trim().toLowerCase().email('Email invalide'),
  password: z.string().min(8, 'Le mot de passe doit faire au moins 8 caractères').max(128),
  firstName: z.string().trim().max(80).optional().default(''),
})

const publicUser = ({ id, email, firstName, digestOptIn, createdAt }) => ({ id, email, firstName, digestOptIn, createdAt })

const profilePatchSchema = z.object({
  firstName: z.string().trim().max(80).optional(),
  digestOptIn: z.boolean().optional(),
})

async function signUserToken(userId) {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET)
  return new SignJWT({ role: 'user' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setExpirationTime(process.env.JWT_EXPIRES_IN || '7d')
    .sign(secret)
}

/**
 * POST /api/v1/auth/signup
 * Body : { email, password, firstName? }
 */
router.post('/signup', validate({ body: signupSchema }), asyncHandler(async (req, res) => {
  const { email, password, firstName } = req.body

  const passwordHash = await bcrypt.hash(password, 10)
  try {
    const user = await prisma.user.create({ data: { email, passwordHash, firstName } })
    const token = await signUserToken(user.id)
    res.status(201).json({ token, user: publicUser(user) })
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Un compte existe déjà avec cet email' })
    }
    throw err
  }
}))

/**
 * POST /api/v1/auth/login
 * Body : { email, password }
 */
router.post('/login', validate({ body: loginSchema }), asyncHandler(async (req, res) => {
  const { email, password } = req.body

  const user = await prisma.user.findUnique({ where: { email } })
  // bcrypt.compare même si user absent — timing constant, pas d'oracle d'existence
  const valid = await bcrypt.compare(password, user?.passwordHash ?? '$2b$10$invalidinvalidinvalidinvalidinvalidinvalid')
  if (!user || !valid) {
    return res.status(401).json({ error: 'Email ou mot de passe incorrect' })
  }

  const token = await signUserToken(user.id)
  res.json({ token, user: publicUser(user) })
}))

/**
 * GET /api/v1/auth/me — profil de l'utilisateur connecté
 */
router.get('/me', requireUser, asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } })
  if (!user) return res.status(401).json({ error: 'Compte introuvable' })
  res.json({ user: publicUser(user) })
}))

/**
 * PATCH /api/v1/auth/me — préférences (prénom, abonnement digest) (180-20)
 */
router.patch('/me', requireUser, validate({ body: profilePatchSchema }), asyncHandler(async (req, res) => {
  const { firstName, digestOptIn } = req.body
  const data = {}
  if (firstName !== undefined) data.firstName = firstName
  if (digestOptIn !== undefined) data.digestOptIn = digestOptIn
  if (Object.keys(data).length === 0) {
    return res.status(400).json({ error: 'Aucun champ à mettre à jour' })
  }
  const user = await prisma.user.update({ where: { id: req.userId }, data })
  res.json({ user: publicUser(user) })
}))

export default router
