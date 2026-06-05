import { z } from 'zod';

/**
 * Middleware de validation Zod.
 * Usage : router.get('/foo', validate({ query: mySchema }), handler)
 * Valide body, query et/ou params selon les schémas fournis.
 * Retourne 400 avec les erreurs de validation si invalide.
 */
export function validate({ body, query, params } = {}) {
  return (req, res, next) => {
    try {
      if (body)   req.body   = body.parse(req.body);
      if (query)  req.query  = query.parse(req.query);
      if (params) req.params = params.parse(req.params);
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Paramètres invalides',
          details: err.errors.map(e => ({ path: e.path.join('.'), message: e.message })),
        });
      }
      next(err);
    }
  };
}

/**
 * Wrapper pour les handlers async — évite les try/catch répétés.
 * Usage : router.get('/foo', asyncHandler(async (req, res) => { ... }))
 */
export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

// Schémas réutilisables
export const paginationSchema = z.object({
  limit:  z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export const refStatusSchema = z.enum(['TRIAGE', 'DRAFT', 'PUBLISHED', 'REJECTED']);
