import type { ReactNode } from 'react'

export function WorkspaceSection({
  title,
  description,
  children,
  sectionRef,
}: {
  title: string
  description?: string
  children?: ReactNode
  sectionRef?: React.RefObject<HTMLElement | null>
}) {
  return (
    <section ref={sectionRef} className="min-w-0">
      <header className="mb-4 flex flex-col gap-1">
        <h2 className="text-lg font-semibold tracking-normal">{title}</h2>
        {description ? (
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>
        ) : null}
      </header>
      {children}
    </section>
  )
}
