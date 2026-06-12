import { jwtVerify } from 'jose'

const secret = new TextEncoder().encode(process.env.JWT_SECRET)

/**
 * Auth utilisateur (Léa) — exige un JWT avec role 'user' et un sub (userId).
 * Distinct de requireAdmin : un token admin ne passe pas ici, et inversement.
 */
export async function requireUser(req, res, next) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing token' })
  }
  try {
    const { payload } = await jwtVerify(header.slice(7), secret)
    if (payload.role !== 'user' || !payload.sub) {
      return res.status(401).json({ error: 'Invalid token' })
    }
    req.userId = payload.sub
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid token' })
  }
}
