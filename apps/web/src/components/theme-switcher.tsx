import { MonitorIcon, MoonIcon, SunIcon } from 'lucide-react'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useTheme } from '@/components/theme-provider'
import { useLanguage } from '@/i18n/language-provider'
import { cn } from '@/lib/utils'

const THEMES = [
  { value: 'light', key: 'theme.light', icon: SunIcon },
  { value: 'dark', key: 'theme.dark', icon: MoonIcon },
  { value: 'system', key: 'theme.system', icon: MonitorIcon },
] as const

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  const { t } = useLanguage()

  return (
    <ToggleGroup
      size="sm"
      spacing={0}
      value={[theme]}
      onValueChange={(next) => {
        const value = next[0]
        if (value === 'light' || value === 'dark' || value === 'system') {
          setTheme(value)
        }
      }}
      aria-label={t('theme.group')}
      className="rounded-md border border-border/70 bg-transparent p-0 shadow-none"
    >
      {THEMES.map(({ value, key, icon: Icon }) => (
        <ToggleGroupItem
          key={value}
          value={value}
          aria-label={t(key)}
          title={t(key)}
          className={cn(
            'size-7 rounded-md border-0 px-0 data-pressed:bg-foreground data-pressed:text-background',
          )}
        >
          <Icon className="size-3.5" />
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
