import { CheckIcon, ChevronsUpDownIcon, PlusIcon } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useLanguage } from '@/i18n/language-provider'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { organizationLabel } from '@/lib/organization'
import { cn } from '@/lib/utils'
import { useSidebar, SidebarReveal } from '@/components/sidebar-provider'

function initials(name: string) {
  return (name.trim()[0] ?? '?').toUpperCase()
}

export function OrganizationSwitcher({ onCreate }: { onCreate: () => void }) {
  const { t } = useLanguage()
  const { user, refreshUser } = useAuth()
  const { collapsed } = useSidebar()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()

  const { data } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => api.listOrganizations(),
    enabled: !!user,
  })

  const switchMutation = useMutation({
    mutationFn: (organizationId: string) => api.setActiveOrganization(organizationId),
    onSuccess: async () => {
      await refreshUser()
      queryClient.invalidateQueries({ queryKey: ['organizations'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['ingredients'] })
      queryClient.invalidateQueries({ queryKey: ['home'] })
      if (location.pathname.startsWith('/products/')) {
        navigate('/')
      }
    },
  })

  const current =
    data?.organizations.find((org) => org.id === (user?.activeOrganizationId ?? data.currentOrganizationId)) ??
    data?.organizations[0]
  if (!current) return null

  const label = organizationLabel(current, t)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t('org.switcher')}
        title={collapsed ? label : undefined}
        className={cn(
          'flex w-full items-center rounded-lg py-2 text-left text-sm text-foreground outline-none transition-[color,background-color,padding,gap] duration-200 ease-out motion-reduce:transition-none hover:bg-sidebar-accent/70 focus-visible:ring-2 focus-visible:ring-sidebar-ring data-popup-open:bg-sidebar-accent',
          collapsed ? 'justify-center gap-0 px-2' : 'gap-2.5 px-2.5',
        )}
      >
        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-card text-xs font-medium">
          {initials(label)}
        </span>
        <SidebarReveal className="flex min-w-0 items-center gap-2.5">
          <span className="min-w-0 flex-1 truncate font-medium">{label}</span>
          <ChevronsUpDownIcon className="size-3.5 shrink-0 text-muted-foreground" />
        </SidebarReveal>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side={collapsed ? 'right' : 'bottom'}
        align="start"
        sideOffset={8}
        className="w-56 min-w-56"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel>{t('org.switcher')}</DropdownMenuLabel>
          {data?.organizations.map((org) => {
            const orgLabel = organizationLabel(org, t)
            const active = org.id === current.id
            return (
              <DropdownMenuItem
                key={org.id}
                onClick={() => {
                  if (!active) switchMutation.mutate(org.id)
                }}
              >
                <span className="min-w-0 flex-1 truncate">{orgLabel}</span>
                {active ? <CheckIcon /> : null}
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onCreate}>
          <PlusIcon />
          {t('org.create')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
