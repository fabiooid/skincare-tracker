import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/lib/auth'
import { useLanguage } from '@/i18n/language-provider'
import type { MessageKey } from '@/i18n/catalogs'
import { SettingsSection } from '@/pages/settings/section'

export function SettingsAccountPage() {
  const { user } = useAuth()
  const { t } = useLanguage()

  return (
    <SettingsSection title={t('settings.account')}>
      {user ? (
        <Card>
          <CardHeader>
            <CardTitle>{t('settings.account')}</CardTitle>
            <CardDescription>{user.email}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              {t('settings.currentPlan', { plan: t(`plan.${user.plan}` as MessageKey) })}
            </p>
          </CardContent>
        </Card>
      ) : null}
    </SettingsSection>
  )
}
