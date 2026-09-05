import { CopyIcon, PlusIcon } from 'lucide-react'
import type { ProductClaim } from '@atelier/domain'
import { ClaimPicker } from '@/components/claim-picker'
import { FormulaBuilder } from '@/components/formula-builder'
import { InciPreview } from '@/components/inci-preview'
import { MacerationCard } from '@/components/maceration-card'
import { OlfactoryPyramidGenerator } from '@/components/olfactory-pyramid'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { FormulaPatch, FormulaRow, OlfactoryPyramid, ProductSummary, VariantWorkspace } from '@/lib/api'
import { useLanguage } from '@/i18n/language-provider'

function variantOptionLabel(label: string, isFinal: boolean, finalBadge: string) {
  return isFinal ? `${label} · ${finalBadge}` : label
}

export function WorkspaceFormula({
  product,
  variants,
  selectedVariantId,
  onSelectVariant,
  rows,
  onRowsChange,
  onSave,
  saving,
  pendingPatches,
  onAcceptPatch,
  onRejectPatch,
  onCreateVariant,
  onDuplicateVariant,
  onSetFinal,
  setFinalSaving,
  onMacerationSave,
  macerationSaving,
  onSaveClaims,
  claimsSaving,
  onSavePyramid,
  pyramidSaving,
}: {
  product: ProductSummary
  variants: VariantWorkspace[]
  selectedVariantId: string
  onSelectVariant: (variantId: string) => void
  rows: FormulaRow[]
  onRowsChange: (rows: FormulaRow[]) => void
  onSave: () => void
  saving?: boolean
  pendingPatches: FormulaPatch[]
  onAcceptPatch: (patchId: string) => void
  onRejectPatch: (patchId: string) => void
  onCreateVariant: () => void
  onDuplicateVariant: () => void
  onSetFinal: () => void
  setFinalSaving?: boolean
  onMacerationSave: (input: {
    macerationStartedAt?: string | null
    macerationTargetAt?: string | null
    macerationNotes?: string | null
  }) => void
  macerationSaving?: boolean
  onSaveClaims: (claims: ProductClaim[]) => void
  claimsSaving?: boolean
  onSavePyramid: (pyramid: OlfactoryPyramid) => void
  pyramidSaving?: boolean
}) {
  const { t } = useLanguage()
  const isPerfume = product.type === 'perfume'
  const selected = variants.find((v) => v.variant.id === selectedVariantId)
  const hasCommittedFormula = rows.some((r) => r.inci.trim())

  return (
    <div className="flex min-w-0 flex-col gap-6">
      {isPerfume ? (
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={selectedVariantId}
            onValueChange={(value) => value && onSelectVariant(value)}
          >
            <SelectTrigger aria-label={t('workspace.variants.select')} className="w-full bg-card sm:w-auto sm:min-w-56">
              <SelectValue>
                {selected
                  ? variantOptionLabel(
                      selected.variant.label,
                      selected.variant.isSelectedFinal,
                      t('workspace.variants.finalBadge'),
                    )
                  : t('workspace.variants.select')}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {variants.map(({ variant }) => (
                  <SelectItem key={variant.id} value={variant.id}>
                    {variantOptionLabel(
                      variant.label,
                      variant.isSelectedFinal,
                      t('workspace.variants.finalBadge'),
                    )}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={onCreateVariant}>
            <PlusIcon data-icon="inline-start" />
            {t('workspace.variants.new')}
          </Button>
          <Button variant="outline" size="sm" onClick={onDuplicateVariant}>
            <CopyIcon data-icon="inline-start" />
            {t('workspace.variants.duplicate')}
          </Button>
        </div>
      ) : null}

      <FormulaBuilder
        rows={rows}
        onChange={onRowsChange}
        onSave={onSave}
        saving={saving}
        claims={product.claims ?? []}
      />

      <FieldGroup>
        <Field>
          <FieldLabel>{t('products.claims')}</FieldLabel>
          <ClaimPicker
            value={product.claims ?? []}
            onChange={onSaveClaims}
            disabled={claimsSaving}
          />
          <FieldDescription>{t('claims.hint')}</FieldDescription>
        </Field>
      </FieldGroup>

      {pendingPatches.length > 0 ? (
        <div className="flex flex-col gap-4">
          <h3 className="text-base font-medium">{t('workspace.pendingPatches')}</h3>
          {pendingPatches.map((patch, index) => (
            <div key={patch.id} className="flex flex-col gap-2">
              {index > 0 ? <Separator /> : null}
              <p className="text-sm">{patch.summary}</p>
              <p className="text-xs text-muted-foreground">
                {t('workspace.operations', { count: patch.operations.length })}
              </p>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => onAcceptPatch(patch.id)}>
                  {t('workspace.accept')}
                </Button>
                <Button size="sm" variant="outline" onClick={() => onRejectPatch(patch.id)}>
                  {t('workspace.reject')}
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <Separator />

      <InciPreview rows={rows} preview />

      {isPerfume ? (
        <OlfactoryPyramidGenerator
          initialValue={product.olfactoryPyramid}
          brief={product.brief}
          onSave={onSavePyramid}
          saving={pyramidSaving}
        />
      ) : null}

      {isPerfume && selected ? (
        <MacerationCard
          variant={selected.variant}
          onSave={onMacerationSave}
          saving={macerationSaving}
        />
      ) : null}

      <div className="flex">
        <Button
          variant="outline"
          size="sm"
          onClick={onSetFinal}
          disabled={!hasCommittedFormula || setFinalSaving}
        >
          {setFinalSaving ? t('workspace.final.generating') : t('workspace.variants.setFinal')}
        </Button>
      </div>
    </div>
  )
}
