import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { ProductVariant } from '@/lib/api'
import { useLanguage } from '@/i18n/language-provider'
import type { MessageKey } from '@/i18n/catalogs'

export function MacerationCard({
  variant,
  onSave,
  saving,
}: {
  variant: ProductVariant
  onSave: (input: {
    macerationStartedAt?: string | null
    macerationTargetAt?: string | null
    macerationNotes?: string | null
  }) => void
  saving?: boolean
}) {
  const { t } = useLanguage()
  const status = variant.macerationStatus ?? 'fresh'
  const statusKey = `workspace.maceration.status.${status}` as MessageKey

  function toDateInput(value?: string | null) {
    if (!value) return ''
    return value.slice(0, 10)
  }

  function fromDateInput(value: string) {
    return value ? `${value}T00:00:00.000Z` : null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('workspace.maceration.title')}</CardTitle>
        <CardAction>
          <Badge variant="secondary">{t(statusKey)}</Badge>
        </CardAction>
        <CardDescription>{t('workspace.maceration.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor={`mac-start-${variant.id}`}>{t('workspace.maceration.startDate')}</FieldLabel>
            {/* Keyed on the saved value so the field refreshes after "Start today" or a variant switch,
                without fighting the person while they type. */}
            <Input
              key={`${variant.id}:${variant.macerationStartedAt ?? ''}`}
              id={`mac-start-${variant.id}`}
              type="date"
              defaultValue={toDateInput(variant.macerationStartedAt)}
              onChange={(e) =>
                onSave({
                  macerationStartedAt: fromDateInput(e.target.value),
                  macerationTargetAt: variant.macerationTargetAt,
                  macerationNotes: variant.macerationNotes,
                })
              }
            />
          </Field>
          <Field>
            <FieldLabel htmlFor={`mac-target-${variant.id}`}>{t('workspace.maceration.targetDate')}</FieldLabel>
            <Input
              key={`${variant.id}:${variant.macerationTargetAt ?? ''}`}
              id={`mac-target-${variant.id}`}
              type="date"
              defaultValue={toDateInput(variant.macerationTargetAt)}
              onChange={(e) =>
                onSave({
                  macerationStartedAt: variant.macerationStartedAt,
                  macerationTargetAt: fromDateInput(e.target.value),
                  macerationNotes: variant.macerationNotes,
                })
              }
            />
          </Field>
          <Field>
            <FieldLabel htmlFor={`mac-notes-${variant.id}`}>{t('workspace.maceration.notes')}</FieldLabel>
            <Textarea
              key={`${variant.id}:${variant.macerationNotes ?? ''}`}
              id={`mac-notes-${variant.id}`}
              rows={2}
              defaultValue={variant.macerationNotes ?? ''}
              placeholder={t('workspace.maceration.notesPlaceholder')}
              onBlur={(e) => {
                const next = e.target.value.trim() || null
                if (next === (variant.macerationNotes ?? null)) return
                onSave({
                  macerationStartedAt: variant.macerationStartedAt,
                  macerationTargetAt: variant.macerationTargetAt,
                  macerationNotes: next,
                })
              }}
            />
          </Field>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={saving}
            onClick={() => {
              const today = new Date().toISOString().slice(0, 10)
              onSave({
                macerationStartedAt: `${today}T00:00:00.000Z`,
                macerationTargetAt: variant.macerationTargetAt,
                macerationNotes: variant.macerationNotes,
              })
            }}
          >
            {t('workspace.maceration.startToday')}
          </Button>
        </FieldGroup>
      </CardContent>
    </Card>
  )
}
