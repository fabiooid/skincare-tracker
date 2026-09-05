import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

export function SimpleBarChart({
  items,
  emptyLabel,
  formatValue,
}: {
  items: Array<{ label: string; value: number; hint?: string; href?: string }>
  emptyLabel: string
  formatValue?: (value: number) => string
}) {
  const max = Math.max(...items.map((item) => item.value), 0)

  if (!items.length) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>
  }

  return (
    <div className="-mx-1 flex flex-col">
      {items.map((item) => {
        const inner = (
          <>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="min-w-0 truncate font-medium tracking-tight">{item.label}</span>
              <span className="shrink-0 font-mono tabular-nums">
                {formatValue ? formatValue(item.value) : item.value}
              </span>
            </div>
            {item.hint ? <p className="mt-0.5 text-xs text-muted-foreground">{item.hint}</p> : null}
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-foreground/70"
                style={{
                  width: `${max > 0 && item.value > 0 ? Math.max((item.value / max) * 100, 6) : 0}%`,
                }}
              />
            </div>
          </>
        )

        if (item.href) {
          return (
            <Link
              key={item.href}
              to={item.href}
              className="rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/50"
            >
              {inner}
            </Link>
          )
        }

        return (
          <div key={item.label} className={cn('px-2 py-2.5')}>
            {inner}
          </div>
        )
      })}
    </div>
  )
}
