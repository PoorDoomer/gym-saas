'use client'

import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  text?: string
}

export function LoadingSpinner({ size = 'md', className, text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  }

  return (
    <div className={cn('flex items-center justify-center gap-2', className)}>
      <Loader2 className={cn('animate-spin', sizeClasses[size])} />
      {text && <span className="text-sm text-muted-foreground">{text}</span>}
    </div>
  )
}

// Full page loading component
export function PageLoader({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <LoadingSpinner size="lg" text={text} />
    </div>
  )
}

// Card skeleton for tables/lists
export function CardSkeleton() {
  return (
    <div className="p-6 space-y-4">
      <div className="h-4 bg-muted rounded animate-pulse w-3/4"></div>
      <div className="h-3 bg-muted rounded animate-pulse w-1/2"></div>
      <div className="h-3 bg-muted rounded animate-pulse w-2/3"></div>
    </div>
  )
}

// Table row skeleton
export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <tr>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="p-4">
          <div className="h-4 bg-muted rounded animate-pulse"></div>
        </td>
      ))}
    </tr>
  )
} 