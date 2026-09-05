import { useEffect, useState } from 'react'
import { SparklesIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Textarea } from '@/components/ui/textarea'
import { WorkspaceSection } from '@/components/workspace-section'
import { useLanguage } from '@/i18n/language-provider'

export function WorkspaceBrief({
  brief,
  saving,
  generating,
  onSave,
  onGenerate,
}: {
  brief: string
  saving?: boolean
  generating?: boolean
  onSave: (brief: string) => void
  onGenerate: (brief: string) => void
}) {
  const { t } = useLanguage()
  const [value, setValue] = useState(brief)

  useEffect(() => {
    setValue(brief)
  }, [brief])

  function commit() {
    const next = value.trim()
    if (!next) {
      setValue(brief)
      return
    }
    if (next !== brief) onSave(next)
  }

  return (
    <WorkspaceSection
      title={t('workspace.brief.title')}
      description={t('workspace.brief.description')}
    >
      <FieldGroup className="gap-3">
        <Field>
          <FieldLabel htmlFor="product-brief" className="sr-only">
            {t('workspace.brief.title')}
          </FieldLabel>
          <Textarea
            id="product-brief"
            value={value}
            rows={4}
            disabled={saving || generating}
            placeholder={t('workspace.brief.placeholder')}
            onChange={(event) => setValue(event.target.value)}
            onBlur={commit}
          />
        </Field>
        <div className="flex">
          <Button
            type="button"
            disabled={!value.trim() || saving || generating}
            onClick={() => {
              const next = value.trim()
              if (!next) return
              if (next !== brief) onSave(next)
              onGenerate(next)
            }}
          >
            <SparklesIcon data-icon="inline-start" />
            {generating ? t('workspace.brief.generating') : t('workspace.brief.generate')}
          </Button>
        </div>
      </FieldGroup>
    </WorkspaceSection>
  )
}
