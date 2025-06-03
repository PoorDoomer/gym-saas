'use client'

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  UserCheck, 
  CreditCard, 
  BarChart3, 
  Settings,
  Dumbbell,
  LogOut
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/lib/i18n"
import { LanguageSelector } from "@/components/LanguageSelector"
import { createClient } from "@/lib/supabase/client"

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { t } = useTranslation()
  const supabase = createClient()

  const navigation = [
    { name: t('nav.dashboard'), href: '/dashboard', icon: LayoutDashboard },
    { name: t('nav.members'), href: '/members', icon: Users },
    { name: 'Subscription Plans', href: '/subscription-plans', icon: CreditCard },
    { name: t('nav.classes'), href: '/classes', icon: Calendar },
    { name: t('nav.checkins'), href: '/checkins', icon: UserCheck },
    { name: t('nav.payments'), href: '/payments', icon: CreditCard },
    { name: t('nav.reports'), href: '/reports', icon: BarChart3 },
    { name: t('nav.settings'), href: '/settings', icon: Settings },
  ]

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="flex h-full w-64 flex-col bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b border-slate-200 dark:border-slate-700">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <Dumbbell className="h-8 w-8 text-blue-600" />
          <span className="text-xl font-bold text-slate-900 dark:text-white">GymFlow</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-700"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Language Selector */}
      <div className="px-4 pb-4">
        <LanguageSelector />
      </div>

      {/* User section */}
      <div className="border-t border-slate-200 dark:border-slate-700 p-4">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
            GM
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
              Gym Manager
            </p>
            <p className="text-xs text-slate-500 truncate">
              Administrator
            </p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full justify-start"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          {t('auth.logout')}
        </Button>
      </div>
    </div>
  )
} 