import { ThemeSwitcher } from '@/components/theme-switcher'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useLanguage } from '@/i18n/language-provider'
import { SettingsSection } from '@/pages/settings/section'

export function SettingsAppearancePage() {
  const { t } = useLanguage()

  return (
    <SettingsSection title={t('settings.appearance')}>
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.appearance')}</CardTitle>
          <CardDescription>{t('settings.appearanceDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <ThemeSwitcher />
        </CardContent>
      </Card>
    </SettingsSection>
  )
}
