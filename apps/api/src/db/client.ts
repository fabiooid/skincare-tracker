import { drizzle } from 'drizzle-orm/libsql'
import { createClient } from '@libsql/client'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as schema from './schema.js'

const apiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

function sqliteFileUrl(raw: string | undefined) {
  const fallback = path.join(apiRoot, 'data/app.db')
  const value = raw?.trim() || fallback
  const withoutScheme = value.replace(/^file:/, '')
  const absolute = path.isAbsolute(withoutScheme)
    ? withoutScheme
    : path.resolve(apiRoot, withoutScheme)
  return `file:${absolute}`
}

export const libsql = createClient({ url: sqliteFileUrl(process.env.DATABASE_URL) })
export const db = drizzle(libsql, { schema })
