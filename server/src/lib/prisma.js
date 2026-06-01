/**
 * Client Prisma — singleton partagé dans tout le serveur.
 * Évite de créer une nouvelle connexion à chaque import.
 */

import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();
