'use client'

import { MultiRoleLayout } from "@/components/layout/RoleBasedLayout"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <MultiRoleLayout>
      {children}
    </MultiRoleLayout>
  )
} 