'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Sidebar } from './Sidebar'
import { TrainerSidebar } from './TrainerSidebar'
import { MemberSidebar } from './MemberSidebar'
import { PageLoader } from '@/components/ui/loading-spinner'

type UserRole = 'admin' | 'trainer' | 'member'

interface RoleBasedLayoutProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
  fallbackRole?: UserRole
}

export function RoleBasedLayout({ 
  children, 
  allowedRoles = ['admin', 'trainer', 'member'],
  fallbackRole = 'admin'
}: RoleBasedLayoutProps) {
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkUserRole()
  }, [])

  const checkUserRole = async () => {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        router.push('/login')
        return
      }

      setUser(user)

      // Get user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)

      if (rolesError) {
        console.error('Error fetching user roles:', rolesError)
        router.push('/error')
        return
      }

      // Determine primary role (prioritize admin > trainer > member)
      let primaryRole: UserRole = fallbackRole

      if (roles && roles.length > 0) {
        if (roles.some(r => r.role === 'admin')) {
          primaryRole = 'admin'
        } else if (roles.some(r => r.role === 'trainer')) {
          primaryRole = 'trainer'
        } else if (roles.some(r => r.role === 'member')) {
          primaryRole = 'member'
        }
      }

      // Check if user is allowed to access this page
      if (!allowedRoles.includes(primaryRole)) {
        // Redirect to appropriate dashboard based on role
        switch (primaryRole) {
          case 'admin':
            router.push('/gym-management')
            break
          case 'trainer':
            router.push('/trainer-dashboard')
            break
          case 'member':
            router.push('/member-dashboard')
            break
          default:
            router.push('/login')
        }
        return
      }

      setUserRole(primaryRole)

    } catch (error) {
      console.error('Error checking user role:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const renderSidebar = () => {
    switch (userRole) {
      case 'admin':
        return <Sidebar />
      case 'trainer':
        return <TrainerSidebar />
      case 'member':
        return <MemberSidebar />
      default:
        return <Sidebar /> // Fallback to admin sidebar
    }
  }

  if (loading) {
    return <PageLoader />
  }

  if (!userRole) {
    return null // Will redirect via useEffect
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
      {renderSidebar()}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}

// Specific layout components for different roles
export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleBasedLayout allowedRoles={['admin']} fallbackRole="admin">
      {children}
    </RoleBasedLayout>
  )
}

export function TrainerLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleBasedLayout allowedRoles={['trainer', 'admin']} fallbackRole="trainer">
      {children}
    </RoleBasedLayout>
  )
}

export function MemberLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleBasedLayout allowedRoles={['member', 'admin']} fallbackRole="member">
      {children}
    </RoleBasedLayout>
  )
}

// Multi-role layout for pages that multiple roles can access
export function MultiRoleLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleBasedLayout allowedRoles={['admin', 'trainer', 'member']} fallbackRole="admin">
      {children}
    </RoleBasedLayout>
  )
} 