'use client'

import { AdminLayout } from "@/components/layout/RoleBasedLayout"

export default function PaymentsLayout({
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