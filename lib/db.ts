/**
 * Database client helpers.
 * Each function creates a fresh Neon client — suitable for serverless/edge contexts
 * where connection pooling is handled by Neon's infrastructure.
 */
import { neon } from '@neondatabase/serverless'

export function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set')
  }
  return neon(process.env.DATABASE_URL)
}
