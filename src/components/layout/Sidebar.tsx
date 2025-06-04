'use client'

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
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
  LogOut,
  ChevronDown,
  Building2,
  Crown
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/lib/i18n"
import { LanguageSelector } from "@/components/LanguageSelector"
import { SubscriptionStatus } from "@/components/layout/SubscriptionStatus"
import { createClient } from "@/lib/supabase/client"
import { useGym } from "@/lib/contexts/GymContext"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { t } = useTranslation()
  const { currentGym, userGyms, selectGym } = useGym()
  const supabase = createClient()
  const [showSubscription, setShowSubscription] = useState(true)

  const navigation = [
    { name: t('nav.dashboard'), href: '/dashboard', icon: LayoutDashboard },
    { name: t('nav.members'), href: '/members', icon: Users },
    { name: t('nav.subscriptionPlans'), href: '/subscription-plans', icon: CreditCard },
    { name: t('nav.classes'), href: '/classes', icon: Calendar },
    { name: 'Sports', href: '/sports', icon: Dumbbell },
    { name: t('nav.trainers'), href: '/trainers', icon: Users },
    { name: t('nav.checkins'), href: '/checkins', icon: UserCheck },
    { name: t('nav.payments'), href: '/payments', icon: CreditCard },
    { name: t('nav.reports'), href: '/reports', icon: BarChart3 },
    { name: t('nav.settings'), href: '/settings', icon: Settings },
  ]

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleGymSwitch = (gymId: string) => {
    selectGym(gymId)
    // Refresh the current page to load new gym data
    window.location.reload()
  }

  const handleManageGyms = () => {
    router.push('/gym-selection')
  }

  return (
    <div className="flex flex-col w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700">
      {/* Header */}
      <div className="flex items-center h-16 px-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center space-x-2">
          <Dumbbell className="h-8 w-8 text-blue-600" />
          <span className="text-xl font-bold text-slate-900 dark:text-white">GymFlow</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Gym Selector */}
        {currentGym && (
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full justify-between text-left"
                >
                  <div className="flex items-center space-x-2">
                    <Building2 className="h-4 w-4" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {currentGym.name}
                      </p>
                      <p className="text-xs text-slate-500 capitalize">
                        {currentGym.subscription_tier} Plan
                      </p>
                    </div>
                  </div>
                  <ChevronDown className="h-4 w-4 flex-shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="start">
                <div className="px-2 py-1.5">
                  <p className="text-xs text-slate-500 uppercase tracking-wider">
                    Switch Gym
                  </p>
                </div>
                {userGyms.map((gym) => (
                  <DropdownMenuItem
                    key={gym.id}
                    onClick={() => handleGymSwitch(gym.id)}
                    className={cn(
                      "flex items-center space-x-2",
                      currentGym?.id === gym.id && "bg-blue-50 dark:bg-blue-900/20"
                    )}
                  >
                    <Building2 className="h-4 w-4" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{gym.name}</p>
                      <p className="text-xs text-slate-500 capitalize">
                        {gym.subscription_tier} Plan
                      </p>
                    </div>
                    {currentGym?.id === gym.id && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                    )}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleManageGyms}>
                  <Crown className="h-4 w-4 mr-2" />
                  Manage Gyms
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

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

        {/* Subscription Status */}
        {currentGym && showSubscription && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-700">
            <SubscriptionStatus />
          </div>
        )}

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