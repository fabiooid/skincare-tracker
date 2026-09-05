import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useLanguage } from '@/i18n/language-provider'
import { isLanguage, languageCodes, languages } from '@/i18n/languages'

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage()

  return (
    <Select
      value={language}
      onValueChange={(value) => {
        const next = Array.isArray(value) ? value[0] : value
        if (typeof next === 'string' && isLanguage(next)) setLanguage(next)
      }}
    >
      <SelectTrigger size="sm" aria-label={t('language.label')} className="h-7 border-0 bg-transparent shadow-none">
        <SelectValue>{languages[language].nativeLabel}</SelectValue>
      </SelectTrigger>
      <SelectContent align="end">
        <SelectGroup>
          {languageCodes.map((code) => (
            <SelectItem key={code} value={code}>
              {languages[code].nativeLabel}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
