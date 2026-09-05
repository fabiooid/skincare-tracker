import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { LayoutGridIcon, ListIcon, PlusIcon } from 'lucide-react'
import { AppShell, PageHeader } from '@/components/layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { EmptyState } from '@/components/empty-state'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { api } from '@/lib/api'
import { FREE_MARKETS } from '@atelier/domain'
import { useAuth } from '@/lib/auth'
import { useLanguage } from '@/i18n/language-provider'
import type { Language } from '@/i18n/languages'
import type { MessageKey } from '@/i18n/catalogs'
import type { ProductStage, ProductSummary } from '@/lib/api'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { PinButton, isProductPinned, usePinProduct } from '@/components/pin-button'
import { ClaimPicker } from '@/components/claim-picker'
import type { ProductClaim } from '@atelier/domain'

type ProductView = 'cards' | 'list'

const VIEW_STORAGE_KEY = 'products-view'

function readStoredView(): ProductView {
  const stored = localStorage.getItem(VIEW_STORAGE_KEY)
  return stored === 'list' ? 'list' : 'cards'
}

function stageLabelKey(stage?: ProductStage): MessageKey {
  if (stage === 'formula') return 'products.stageFormula'
  if (stage === 'final') return 'products.stageFinal'
  return 'products.stageIdea'
}

function formatProductDate(value: string | undefined, language: Language) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(language, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function ProductDates({ product, className }: { product: ProductSummary; className?: string }) {
  const { t, language } = useLanguage()
  const created = formatProductDate(product.createdAt, language)
  const edited = formatProductDate(product.updatedAt, language)
  if (!created && !edited) return null

  return (
    <p className={cn('text-xs text-muted-foreground', className)}>
      {created ? t('products.created', { date: created }) : null}
      {created && edited ? <span className="mx-1.5 text-border">·</span> : null}
      {edited ? t('products.edited', { date: edited }) : null}
    </p>
  )
}

function ProductMeta({ product }: { product: ProductSummary }) {
  const { t } = useLanguage()

  return (
    <>
      <Badge variant="outline">{t(`productType.${product.type}` as MessageKey)}</Badge>
      <Badge variant="secondary">{t(stageLabelKey(product.stage))}</Badge>
      {(product.claims ?? []).map((claim) => (
        <Badge key={claim} variant="outline">
          {t(`claims.${claim}` as MessageKey)}
        </Badge>
      ))}
      <span className="text-muted-foreground">{product.markets.join(' · ')}</span>
    </>
  )
}

function ProductViewSwitcher({
  view,
  onViewChange,
}: {
  view: ProductView
  onViewChange: (view: ProductView) => void
}) {
  const { t } = useLanguage()

  return (
    <ToggleGroup
      variant="outline"
      size="sm"
      spacing={0}
      value={[view]}
      onValueChange={(next) => {
        const value = next[0]
        if (value === 'cards' || value === 'list') onViewChange(value)
      }}
      aria-label={t('products.viewGroup')}
    >
      <ToggleGroupItem value="list" aria-label={t('products.viewList')} title={t('products.viewList')}>
        <ListIcon data-icon="inline-start" />
        <span className="hidden sm:inline">{t('products.viewList')}</span>
      </ToggleGroupItem>
      <ToggleGroupItem value="cards" aria-label={t('products.viewCards')} title={t('products.viewCards')}>
        <LayoutGridIcon data-icon="inline-start" />
        <span className="hidden sm:inline">{t('products.viewCards')}</span>
      </ToggleGroupItem>
    </ToggleGroup>
  )
}

export function ProductsPage() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [type, setType] = useState('skincare')
  const [brief, setBrief] = useState('')
  const [claims, setClaims] = useState<ProductClaim[]>([])
  const [view, setView] = useState<ProductView>(readStoredView)
  const pinMutation = usePinProduct()

  function handleViewChange(next: ProductView) {
    setView(next)
    localStorage.setItem(VIEW_STORAGE_KEY, next)
  }

  const { data, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.listProducts(),
    enabled: !!user,
  })

  const createMutation = useMutation({
    mutationFn: () =>
      api.createProduct({
        name: name || t('products.untitled'),
        type,
        markets: [...FREE_MARKETS],
        brief,
        claims,
      }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setOpen(false)
      setName('')
      setBrief('')
      setClaims([])
      navigate(`/products/${result.product.id}`)
    },
  })

  if (!user) return <Navigate to="/login" replace />

  return (
    <AppShell title={t('nav.products')}>
      <PageHeader
        title={t('products.title')}
        description={t('products.subtitle')}
        actions={
          <>
            <ProductViewSwitcher view={view} onViewChange={handleViewChange} />
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger render={<Button><PlusIcon data-icon="inline-start" />{t('products.newFromBrief')}</Button>} />
              <DialogContent className="border-border/80 bg-background">
                <DialogHeader>
                  <DialogTitle>{t('products.dialogTitle')}</DialogTitle>
                </DialogHeader>
                <FieldGroup>
                  <Field>
                    <FieldLabel>{t('products.name')}</FieldLabel>
                    <Input
                      value={name}
                      maxLength={120}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t('products.namePlaceholder')}
                    />
                  </Field>
                  <Field>
                    <FieldLabel>{t('products.type')}</FieldLabel>
                    <Select value={type} onValueChange={(v) => v && setType(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="skincare">{t('productType.skincare')}</SelectItem>
                        <SelectItem value="perfume">{t('productType.perfume')}</SelectItem>
                        <SelectItem value="hybrid">{t('productType.hybrid')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel>{t('products.claims')}</FieldLabel>
                    <ClaimPicker value={claims} onChange={setClaims} />
                    <FieldDescription>{t('claims.hint')}</FieldDescription>
                  </Field>
                  <Field>
                    <FieldLabel>{t('products.brief')}</FieldLabel>
                    <Textarea
                      value={brief}
                      onChange={(e) => setBrief(e.target.value)}
                      placeholder={t('products.briefPlaceholder')}
                      rows={4}
                    />
                  </Field>
                  <Button
                    onClick={() => createMutation.mutate()}
                    disabled={!brief.trim() || createMutation.isPending}
                  >
                    {t('products.create')}
                  </Button>
                </FieldGroup>
              </DialogContent>
            </Dialog>
          </>
        }
      />

      <div className="flex flex-col gap-6">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">{t('products.loading')}</p>
        ) : !data?.products.length ? (
          <EmptyState
            title={t('products.emptyTitle')}
            description={t('products.emptyDescription')}
          />
        ) : (
          view === 'list' ? (
            <div className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-soft">
              {data.products.map((product) => {
                const pinned = isProductPinned(product)
                return (
                  <div
                    key={product.id}
                    className="group/pin flex items-stretch border-b border-border/70 last:border-b-0"
                  >
                    <Link
                      to={`/products/${product.id}`}
                      className={cn(
                        'group flex min-w-0 flex-1 flex-col gap-2 px-4 py-3',
                        'transition-colors hover:bg-muted/50 lg:flex-row lg:items-center lg:justify-between lg:gap-4',
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium tracking-tight group-hover:text-foreground">{product.name}</p>
                        <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">{product.brief}</p>
                      </div>
                      <ProductDates product={product} className="shrink-0 sm:min-w-40" />
                      <div className="flex flex-wrap items-center gap-2 text-xs sm:justify-end">
                        <ProductMeta product={product} />
                      </div>
                    </Link>
                    <div className="flex shrink-0 items-center pr-2">
                      <PinButton
                        pinned={pinned}
                        revealOnHover
                        onToggle={() =>
                          pinMutation.mutate({ productId: product.id, pinned: !pinned })
                        }
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.products.map((product) => {
                const pinned = isProductPinned(product)
                return (
                  <div key={product.id} className="group/pin relative">
                    <Link to={`/products/${product.id}`} className="group block">
                      <Card className="h-full transition-all duration-200 hover:border-border hover:shadow-soft-hover">
                        <CardHeader className="pb-3 pr-10">
                          <CardTitle className="text-base font-medium tracking-tight group-hover:text-foreground">
                            {product.name}
                          </CardTitle>
                          <CardDescription className="line-clamp-2 text-sm leading-relaxed">
                            {product.brief}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-3">
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <ProductMeta product={product} />
                          </div>
                          <ProductDates product={product} />
                        </CardContent>
                      </Card>
                    </Link>
                    <PinButton
                      pinned={pinned}
                      revealOnHover
                      className="absolute top-3 right-3"
                      onToggle={() =>
                        pinMutation.mutate({ productId: product.id, pinned: !pinned })
                      }
                    />
                  </div>
                )
              })}
            </div>
          )
        )}
      </div>
    </AppShell>
  )
}
