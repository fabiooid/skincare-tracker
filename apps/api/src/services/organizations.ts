import { and, eq, isNull } from 'drizzle-orm'
import { db } from '../db/client.js'
import { organizationMembers, organizations, products, users } from '../db/schema.js'

export type OrganizationKind = 'personal' | 'team'
export type OrganizationRole = 'owner' | 'editor' | 'viewer'

export type OrganizationSummary = {
  id: string
  name: string
  kind: OrganizationKind
  role: OrganizationRole
  createdAt: string
}

function toSummary(
  org: typeof organizations.$inferSelect,
  role: OrganizationRole,
): OrganizationSummary {
  return {
    id: org.id,
    name: org.name,
    kind: org.kind,
    role,
    createdAt: org.createdAt,
  }
}

export async function getMembership(organizationId: string, userId: string) {
  const [member] = await db
    .select()
    .from(organizationMembers)
    .where(
      and(eq(organizationMembers.organizationId, organizationId), eq(organizationMembers.userId, userId)),
    )
    .limit(1)
  return member ?? null
}

export async function listOrganizations(userId: string): Promise<OrganizationSummary[]> {
  const rows = await db
    .select({
      organization: organizations,
      role: organizationMembers.role,
    })
    .from(organizationMembers)
    .innerJoin(organizations, eq(organizationMembers.organizationId, organizations.id))
    .where(eq(organizationMembers.userId, userId))

  return rows
    .map((row) => toSummary(row.organization, row.role))
    .sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === 'personal' ? -1 : 1
      return a.name.localeCompare(b.name)
    })
}

export async function getActiveOrganizationId(userId: string): Promise<string | null> {
  const [user] = await db
    .select({ activeOrganizationId: users.activeOrganizationId })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
  if (user?.activeOrganizationId) {
    const member = await getMembership(user.activeOrganizationId, userId)
    if (member) return user.activeOrganizationId
  }

  const orgs = await listOrganizations(userId)
  if (orgs[0]) {
    await setActiveOrganization(userId, orgs[0].id)
    return orgs[0].id
  }
  return null
}

export async function ensurePersonalOrganization(userId: string): Promise<OrganizationSummary> {
  const existing = (await listOrganizations(userId)).find((org) => org.kind === 'personal')
  if (existing) {
    const [user] = await db
      .select({ activeOrganizationId: users.activeOrganizationId })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
    if (!user?.activeOrganizationId) {
      await setActiveOrganization(userId, existing.id)
    }
    return existing
  }

  const now = new Date().toISOString()
  const organizationId = crypto.randomUUID()
  await db.insert(organizations).values({
    id: organizationId,
    name: 'Personal',
    kind: 'personal',
    createdAt: now,
  })
  await db.insert(organizationMembers).values({
    id: crypto.randomUUID(),
    organizationId,
    userId,
    role: 'owner',
    createdAt: now,
  })
  await setActiveOrganization(userId, organizationId)

  await db
    .update(products)
    .set({ organizationId })
    .where(and(eq(products.userId, userId), isNull(products.organizationId)))

  return {
    id: organizationId,
    name: 'Personal',
    kind: 'personal',
    role: 'owner',
    createdAt: now,
  }
}

export async function createOrganization(userId: string, name: string): Promise<OrganizationSummary> {
  const now = new Date().toISOString()
  const organizationId = crypto.randomUUID()
  await db.insert(organizations).values({
    id: organizationId,
    name,
    kind: 'team',
    createdAt: now,
  })
  await db.insert(organizationMembers).values({
    id: crypto.randomUUID(),
    organizationId,
    userId,
    role: 'owner',
    createdAt: now,
  })
  await setActiveOrganization(userId, organizationId)
  return {
    id: organizationId,
    name,
    kind: 'team',
    role: 'owner',
    createdAt: now,
  }
}

export async function renameOrganization(organizationId: string, userId: string, name: string) {
  const member = await getMembership(organizationId, userId)
  if (!member || member.role !== 'owner') return null

  await db.update(organizations).set({ name }).where(eq(organizations.id, organizationId))
  const [org] = await db.select().from(organizations).where(eq(organizations.id, organizationId)).limit(1)
  if (!org) return null
  return toSummary(org, member.role)
}

export async function setActiveOrganization(userId: string, organizationId: string) {
  const member = await getMembership(organizationId, userId)
  if (!member) return null
  await db.update(users).set({ activeOrganizationId: organizationId }).where(eq(users.id, userId))
  return organizationId
}

export async function getOrganizationForUser(organizationId: string, userId: string) {
  const member = await getMembership(organizationId, userId)
  if (!member) return null
  const [org] = await db.select().from(organizations).where(eq(organizations.id, organizationId)).limit(1)
  if (!org) return null
  return toSummary(org, member.role)
}
