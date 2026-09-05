import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">{t('workspace.maceration.title')}</CardTitle>
          <Badge variant="secondary">{t(statusKey)}</Badge>
        </div>
        <CardDescription>{t('workspace.maceration.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor={`mac-start-${variant.id}`}>{t('workspace.maceration.startDate')}</FieldLabel>
            <Input
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
              disabled={saving}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor={`mac-target-${variant.id}`}>{t('workspace.maceration.targetDate')}</FieldLabel>
            <Input
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
              disabled={saving}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor={`mac-notes-${variant.id}`}>{t('workspace.maceration.notes')}</FieldLabel>
            <Textarea
              id={`mac-notes-${variant.id}`}
              rows={2}
              defaultValue={variant.macerationNotes ?? ''}
              placeholder={t('workspace.maceration.notesPlaceholder')}
              onBlur={(e) =>
                onSave({
                  macerationStartedAt: variant.macerationStartedAt,
                  macerationTargetAt: variant.macerationTargetAt,
                  macerationNotes: e.target.value || null,
                })
              }
              disabled={saving}
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
