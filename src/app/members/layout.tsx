'use client'

import { AdminLayout } from "@/components/layout/RoleBasedLayout"

export default function MembersLayout({
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