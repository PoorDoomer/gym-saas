'use client'

import { MemberLayout } from "@/components/layout/RoleBasedLayout"

export default function MemberPagesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <MemberLayout>
      {children}
    </MemberLayout>
  )
} 