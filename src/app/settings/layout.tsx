'use client'

import { AdminLayout } from "@/components/layout/RoleBasedLayout"

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AdminLayout>
      {children}
    </AdminLayout>
  )
} 