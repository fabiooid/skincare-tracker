import { db } from '../db/client.js'
import { feedback } from '../db/schema.js'
import { getActiveOrganizationId } from './organizations.js'

export async function createFeedback(userId: string, message: string) {
  const trimmed = message.trim()
  if (!trimmed) throw new Error('Message is required')

  const organizationId = await getActiveOrganizationId(userId)
  const now = new Date().toISOString()
  const id = crypto.randomUUID()

  await db.insert(feedback).values({
    id,
    userId,
    organizationId,
    message: trimmed,
    createdAt: now,
  })

  return { id, createdAt: now }
}
