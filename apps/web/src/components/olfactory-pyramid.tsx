import { useEffect, useState } from 'react'
import { SparklesIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useLanguage } from '@/i18n/language-provider'
import type { OlfactoryPyramid } from '@/lib/api'

const NOTE_FAMILIES = {
  top: {
    citrus: ['Bergamot', 'Lemon', 'Mandarin'],
    fresh: ['Bergamot', 'Green leaves', 'Pink pepper'],
    fruity: ['Pear', 'Blackcurrant', 'Mandarin'],
    aromatic: ['Lavender', 'Bergamot', 'Juniper'],
    spicy: ['Pink pepper', 'Cardamom', 'Bergamot'],
  },
  heart: {
    floral: ['Jasmine', 'Rose', 'Orange blossom'],
    white: ['Jasmine', 'Tuberose', 'Orange blossom'],
    green: ['Violet leaf', 'Geranium', 'Tea'],
    spicy: ['Cardamom', 'Cinnamon', 'Geranium'],
    aromatic: ['Lavender', 'Clary sage', 'Geranium'],
    fruity: ['Fig', 'Peach', 'Jasmine'],
  },
  base: {
    woody: ['Cedarwood', 'Sandalwood', 'Vetiver'],
    amber: ['Amber', 'Labdanum', 'Benzoin'],
    musky: ['White musk', 'Ambrette', 'Cashmere wood'],
    gourmand: ['Vanilla', 'Tonka bean', 'Benzoin'],
    smoky: ['Incense', 'Guaiac wood', 'Vetiver'],
    earthy: ['Patchouli', 'Vetiver', 'Oakmoss'],
  },
} as const

function unique(values: string[]) {
  return [...new Set(values)].slice(0, 4)
}

function suggestNotes(direction: string): OlfactoryPyramid {
  const words = direction.toLowerCase()
  const pick = (level: keyof typeof NOTE_FAMILIES, fallback: string[]) => {
    const matches = Object.entries(NOTE_FAMILIES[level])
      .filter(([family]) => words.includes(family))
      .flatMap(([, notes]) => [...notes])
    return unique(matches.length ? matches : fallback)
  }

  return {
    direction,
    top: pick('top', ['Bergamot', 'Mandarin', 'Pink pepper']),
    heart: pick('heart', ['Jasmine', 'Geranium', 'Orange blossom']),
    base: pick('base', ['Cedarwood', 'White musk', 'Sandalwood']),
  }
}

function joinNotes(notes: string[]) {
  return notes.join(', ')
}

function splitNotes(value: string) {
  return value
    .split(',')
    .map((note) => note.trim())
    .filter(Boolean)
}

function emptyPyramid(direction: string): OlfactoryPyramid {
  return { direction, top: [], heart: [], base: [] }
}

export function OlfactoryPyramidGenerator({
  initialValue,
  brief,
  onSave,
  saving,
}: {
  initialValue?: OlfactoryPyramid | null
  brief: string
  onSave: (pyramid: OlfactoryPyramid) => void
  saving?: boolean
}) {
  const { t } = useLanguage()
  const [direction, setDirection] = useState(initialValue?.direction || brief)
  const [pyramid, setPyramid] = useState<OlfactoryPyramid>(
    initialValue ?? emptyPyramid(brief),
  )
  const hasNotes = pyramid.top.length + pyramid.heart.length + pyramid.base.length > 0

  useEffect(() => {
    setDirection(initialValue?.direction || brief)
    setPyramid(initialValue ?? emptyPyramid(brief))
  }, [initialValue, brief])

  function generate() {
    setPyramid(suggestNotes(direction))
  }

  function updateLevel(level: 'top' | 'heart' | 'base', value: string) {
    setPyramid((current) => ({
      ...current,
      direction,
      [level]: splitNotes(value),
    }))
  }

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SparklesIcon className="size-3.5 text-accent-brand" />
          {t('olfactory.title')}
        </CardTitle>
        <CardAction>
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={generate}
              disabled={!direction.trim()}
            >
              <SparklesIcon data-icon="inline-start" />
              {hasNotes ? t('olfactory.regenerate') : t('olfactory.generate')}
            </Button>
            <Button
              type="button"
              size="xs"
              onClick={() => onSave({ ...pyramid, direction })}
              disabled={saving || !hasNotes}
            >
              {saving ? t('olfactory.saving') : t('olfactory.save')}
            </Button>
          </div>
        </CardAction>
      </CardHeader>
      <CardContent className="gap-2">
        <Input
          value={direction}
          onChange={(event) => setDirection(event.target.value)}
          placeholder={t('olfactory.placeholder')}
          className="h-8"
        />
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
          <PyramidLevel
            label={t('olfactory.top')}
            value={joinNotes(pyramid.top)}
            onChange={(value) => updateLevel('top', value)}
          />
          <PyramidLevel
            label={t('olfactory.heart')}
            value={joinNotes(pyramid.heart)}
            onChange={(value) => updateLevel('heart', value)}
          />
          <PyramidLevel
            label={t('olfactory.base')}
            value={joinNotes(pyramid.base)}
            onChange={(value) => updateLevel('base', value)}
          />
        </div>
      </CardContent>
    </Card>
  )
}

function PyramidLevel({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1 rounded-md border border-border/60 bg-muted/40 px-2 py-1.5">
      <span className="text-[11px] font-medium leading-none text-muted-foreground">{label}</span>
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={label}
        placeholder="Note, note"
        className="h-7 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
      />
    </label>
  )
}
