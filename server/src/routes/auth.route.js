import { Router } from 'express'
import { SignJWT } from 'jose'
import bcrypt from 'bcrypt'

const router = Router()

router.post('/', async (req, res) => {
  const { password } = req.body ?? {}
  if (!password) return res.status(400).json({ error: 'Missing password' })

  const hash = process.env.ADMIN_PASSWORD_HASH
  if (!hash) return res.status(500).json({ error: 'Admin not configured' })

  const valid = await bcrypt.compare(password, hash)
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' })

  const secret = new TextEncoder().encode(process.env.JWT_SECRET)
  const token = await new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(process.env.JWT_EXPIRES_IN || '7d')
    .sign(secret)

  res.json({ token })
})

export default router
