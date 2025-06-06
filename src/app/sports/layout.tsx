'use client'

import { AdminLayout } from "@/components/layout/RoleBasedLayout"

export default function SportsLayout({
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