import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { isSettingsPath } from '@/lib/settings'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'sidebar-collapsed'

type SidebarContextValue = {
  collapsed: boolean
  setCollapsed: (value: boolean) => void
  toggleCollapsed: () => void
  mobileOpen: boolean
  setMobileOpen: (value: boolean) => void
}

const SidebarContext = createContext<SidebarContextValue | null>(null)

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const inSettings = isSettingsPath(useLocation().pathname)
  const [collapsedState, setCollapsedState] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(STORAGE_KEY) === 'true'
  })
  const collapsed = inSettings ? false : collapsedState
  const [mobileOpen, setMobileOpen] = useState(false)

  function setCollapsed(value: boolean) {
    if (inSettings) return
    setCollapsedState(value)
    localStorage.setItem(STORAGE_KEY, String(value))
  }

  function toggleCollapsed() {
    setCollapsed(!collapsedState)
  }

  useEffect(() => {
    if (!mobileOpen) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setMobileOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [mobileOpen])

  return (
    <SidebarContext.Provider
      value={{ collapsed, setCollapsed, toggleCollapsed, mobileOpen, setMobileOpen }}
    >
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebar must be used within SidebarProvider')
  }
  return context
}

export function SidebarReveal({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  const { collapsed } = useSidebar()

  return (
    <span
      className={cn(
        'min-w-0 overflow-hidden whitespace-nowrap transition-[max-width,opacity,flex-basis] duration-200 ease-out motion-reduce:transition-none',
        collapsed
          ? 'pointer-events-none max-w-0 flex-none basis-0 opacity-0'
          : 'max-w-[12rem] flex-1 opacity-100',
        className,
      )}
      aria-hidden={collapsed}
    >
      {children}
    </span>
  )
}
