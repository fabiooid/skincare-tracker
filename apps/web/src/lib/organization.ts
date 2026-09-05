import type { OrganizationSummary } from '@/lib/api'
import type { MessageKey } from '@/i18n/catalogs'

export function organizationLabel(
  organization: OrganizationSummary,
  t: (key: MessageKey) => string,
) {
  if (organization.kind === 'personal' && organization.name === 'Personal') {
    return t('org.personal')
  }
  return organization.name
}
