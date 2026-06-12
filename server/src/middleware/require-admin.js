import { jwtVerify } from 'jose'

const secret = new TextEncoder().encode(process.env.JWT_SECRET)

export async function requireAdmin(req, res, next) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing token' })
  }
  try {
    await jwtVerify(header.slice(7), secret)
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid token' })
  }
}
