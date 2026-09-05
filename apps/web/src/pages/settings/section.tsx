import { Navigate } from 'react-router-dom'
import { AppShell, PageHeader } from '@/components/layout'
import { useAuth } from '@/lib/auth'

export function SettingsSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />

  return (
    <AppShell title={title}>
      <PageHeader title={title} />
      <div className="flex max-w-lg flex-col gap-4">{children}</div>
    </AppShell>
  )
}
