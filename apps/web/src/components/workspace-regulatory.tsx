import { InciPreview } from '@/components/inci-preview'
import { StatusBadge } from '@/components/layout'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/empty-state'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { OFFICIAL_LINKS, type RegulatoryCheck, type VariantWorkspace } from '@/lib/api'
import { useLanguage } from '@/i18n/language-provider'

export function WorkspaceRegulatory({
  variant,
  checks,
  pif,
}: {
  variant: VariantWorkspace
  checks: RegulatoryCheck[]
  pif: { markdown: string; generatedAt: string } | null
}) {
  const { t } = useLanguage()

  return (
    <div className="flex flex-col gap-8">
      <InciPreview
        rows={variant.rows}
        preview={false}
        trailing={<Badge variant="secondary">{variant.variant.label}</Badge>}
      />

      <Tabs defaultValue="markets">
        <TabsList variant="line">
          <TabsTrigger value="markets">{t('workspace.tabMarkets')}</TabsTrigger>
          <TabsTrigger value="pif">{t('workspace.tabPif')}</TabsTrigger>
          <TabsTrigger value="refs">{t('workspace.tabRefs')}</TabsTrigger>
        </TabsList>
        <TabsContent value="markets" className="pt-4">
          <div className="flex flex-col">
            {checks.map((check, index) => (
              <div key={check.market}>
                {index > 0 ? <Separator /> : null}
                <div className="flex flex-col gap-2 py-4 first:pt-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-medium">{check.market}</h3>
                    <StatusBadge status={check.status} />
                  </div>
                  {check.hits.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t('workspace.noHits')}</p>
                  ) : (
                    check.hits.map((hit, i) => (
                      <div key={i} className="flex flex-col gap-1">
                        <p className="text-sm">{hit.message}</p>
                        <a
                          href={hit.citationUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-primary underline"
                        >
                          {hit.instrument}
                        </a>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="pif" className="pt-4">
          {pif ? (
            <ScrollArea className="h-[420px]">
              <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                {pif.markdown}
              </div>
            </ScrollArea>
          ) : (
            <EmptyState title={t('workspace.noPifTitle')} description={t('workspace.noPifDescription')} />
          )}
        </TabsContent>
        <TabsContent value="refs" className="pt-4">
          <div className="flex flex-col gap-2">
            {OFFICIAL_LINKS.map((link) => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-primary underline"
              >
                {link.label}
              </a>
            ))}
            <Separator className="my-2" />
            <p className="text-xs text-muted-foreground">{t('workspace.refsNote')}</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
