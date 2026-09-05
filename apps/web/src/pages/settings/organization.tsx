import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { organizationLabel } from '@/lib/organization'
import { useLanguage } from '@/i18n/language-provider'
import type { MessageKey } from '@/i18n/catalogs'
import { SettingsSection } from '@/pages/settings/section'

export function SettingsOrganizationPage() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const queryClient = useQueryClient()
  const [orgName, setOrgName] = useState('')

  const { data: orgs } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => api.listOrganizations(),
    enabled: !!user,
  })

  const currentOrg =
    orgs?.organizations.find((org) => org.id === (user?.activeOrganizationId ?? orgs.currentOrganizationId)) ??
    orgs?.organizations[0]

  useEffect(() => {
    if (currentOrg) setOrgName(currentOrg.name)
  }, [currentOrg])

  const renameOrgMutation = useMutation({
    mutationFn: () => api.renameOrganization(currentOrg!.id, orgName.trim()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] })
    },
  })

  return (
    <SettingsSection title={t('org.settings')}>
      {currentOrg ? (
        <Card>
          <CardHeader>
            <CardTitle>{t('org.settings')}</CardTitle>
            <CardDescription>{organizationLabel(currentOrg, t)}</CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel>{t('org.name')}</FieldLabel>
                <Input
                  value={orgName}
                  maxLength={80}
                  onChange={(event) => setOrgName(event.target.value)}
                />
              </Field>
              <p className="text-sm text-muted-foreground">
                {t('org.roleLine', { role: t(`org.role.${currentOrg.role}` as MessageKey) })}
              </p>
              <p className="text-sm text-muted-foreground">{t('org.membersSoon')}</p>
              <Button
                onClick={() => renameOrgMutation.mutate()}
                disabled={!orgName.trim() || orgName.trim() === currentOrg.name || renameOrgMutation.isPending}
              >
                {t('org.saveName')}
              </Button>
            </FieldGroup>
          </CardContent>
        </Card>
      ) : null}
    </SettingsSection>
  )
}
