'use client'

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { 
  LayoutDashboard, 
  Calendar, 
  CreditCard, 
  User,
  Dumbbell,
  LogOut,
  Clock,
  BookOpen,
  History,
  QrCode
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/lib/i18n"
import { LanguageSelector } from "@/components/LanguageSelector"
import { createClient } from "@/lib/supabase/client"

export function MemberSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { t } = useTranslation()
  const supabase = createClient()

  // Member-specific navigation - only what members need
  const navigation = [
    { name: 'Dashboard', href: '/member-dashboard', icon: LayoutDashboard },
    { name: 'Book Classes', href: '/member/book-classes', icon: BookOpen },
    { name: 'My Schedule', href: '/member/schedule', icon: Calendar },
    { name: 'Activity History', href: '/member/history', icon: History },
    { name: 'My QR Code', href: '/member/qr-code', icon: QrCode },
    { name: 'Billing', href: '/member/billing', icon: CreditCard },
    { name: 'Profile', href: '/member/profile', icon: User },
  ]

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="flex flex-col w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700">
      {/* Header */}
      <div className="flex items-center h-16 px-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center space-x-2">
          <Dumbbell className="h-8 w-8 text-blue-600" />
          <div className="flex flex-col">
            <span className="text-lg font-bold text-slate-900 dark:text-white">GymFlow</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Member Portal</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Member Status */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
            <Clock className="h-4 w-4" />
            <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div className="mt-1">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              ● Active Member
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-2 text-sm rounded-lg transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                    : "text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700"
                )}
              >
                <Icon className="h-5 w-5 mr-3" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* Quick Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
            Quick Actions
          </h3>
          <div className="space-y-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start"
              onClick={() => router.push('/member/book-classes')}
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Book a Class
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start"
              onClick={() => router.push('/member/qr-code')}
            >
              <QrCode className="h-4 w-4 mr-2" />
              Show QR Code
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 space-y-4">
          <LanguageSelector />
          
          <Button 
            variant="outline" 
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-3" />
            {t('auth.logout')}
          </Button>
        </div>
      </div>
    </div>
  )
} 