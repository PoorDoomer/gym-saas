'use client'

import { TrainerLayout } from "@/components/layout/RoleBasedLayout"

export default function TrainerPagesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <TrainerLayout>
      {children}
    </TrainerLayout>
  )
} 