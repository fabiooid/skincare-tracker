import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { api, type OrganizationSummary } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { organizationLabel } from '@/lib/organization'
import { useLanguage } from '@/i18n/language-provider'
import type { MessageKey } from '@/i18n/catalogs'
import { SettingsSection } from '@/pages/settings/section'

export function SettingsOrganizationPage() {
  const { user } = useAuth()
  const { t } = useLanguage()

  const { data: orgs } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => api.listOrganizations(),
    enabled: !!user,
  })

  const currentOrg =
    orgs?.organizations.find((org) => org.id === (user?.activeOrganizationId ?? orgs.currentOrganizationId)) ??
    orgs?.organizations[0]

  return (
    <SettingsSection title={t('org.settings')}>
      {currentOrg ? (
        // Keyed by id + name so the form resets when the org changes or a rename lands.
        <OrganizationCard key={`${currentOrg.id}:${currentOrg.name}`} organization={currentOrg} />
      ) : (
        <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
      )}
    </SettingsSection>
  )
}

function OrganizationCard({ organization }: { organization: OrganizationSummary }) {
  const { t } = useLanguage()
  const queryClient = useQueryClient()
  const [orgName, setOrgName] = useState(organization.name)
  const canRename = organization.role === 'owner'

  const renameOrgMutation = useMutation({
    mutationFn: () => api.renameOrganization(organization.id, orgName.trim()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] })
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('org.settings')}</CardTitle>
        <CardDescription>{organizationLabel(organization, t)}</CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="org-name">{t('org.name')}</FieldLabel>
            <Input
              id="org-name"
              value={orgName}
              maxLength={80}
              disabled={!canRename}
              onChange={(event) => setOrgName(event.target.value)}
            />
          </Field>
          <p className="text-sm text-muted-foreground">
            {t('org.roleLine', { role: t(`org.role.${organization.role}` as MessageKey) })}
          </p>
          <p className="text-sm text-muted-foreground">{t('org.membersSoon')}</p>
          {renameOrgMutation.isError ? (
            <p className="text-sm text-destructive">{t('common.saveFailed')}</p>
          ) : null}
          <Button
            onClick={() => renameOrgMutation.mutate()}
            disabled={
              !canRename ||
              !orgName.trim() ||
              orgName.trim() === organization.name ||
              renameOrgMutation.isPending
            }
          >
            {renameOrgMutation.isPending ? t('common.saving') : t('org.saveName')}
          </Button>
        </FieldGroup>
      </CardContent>
    </Card>
  )
}
