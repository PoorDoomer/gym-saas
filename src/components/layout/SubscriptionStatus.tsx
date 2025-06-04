'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Crown, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { useGym } from '@/lib/contexts/GymContext'
import { createClient } from '@/lib/supabase/client'

interface SubscriptionInfo {
  tier: 'solo' | 'multi'
  status: 'active' | 'trial' | 'expired' | 'cancelled'
  current_period_end: string
  gyms_count: number
  gyms_limit: number
  members_count: number
  members_limit: number
}

export function SubscriptionStatus() {
  const { currentGym } = useGym()
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (currentGym) {
      loadSubscriptionInfo()
    }
  }, [currentGym])

  const loadSubscriptionInfo = async () => {
    if (!currentGym) return

    try {
      const supabase = createClient()
      
      // Get subscription info for the current gym
      const { data: gymData, error: gymError } = await supabase
        .from('gyms')
        .select(`
          subscription_tier,
          subscription_status,
          subscription_end_date,
          owner_user_id
        `)
        .eq('id', currentGym.id)
        .single()

      if (gymError) {
        console.error('Error loading gym subscription:', gymError)
        return
      }

      // Count user's total gyms
      const { data: gymsData, error: gymsError } = await supabase
        .from('gyms')
        .select('id')
        .eq('owner_user_id', gymData.owner_user_id)
        .eq('is_active', true)

      // Count current gym's members
      const { data: membersData, error: membersError } = await supabase
        .from('members')
        .select('id')
        .eq('gym_id', currentGym.id)

      // Get tier limits
      const { data: tierData, error: tierError } = await supabase
        .from('subscription_tiers')
        .select('*')
        .eq('tier_name', gymData.subscription_tier)
        .single()

      if (!tierError && tierData) {
        setSubscription({
          tier: gymData.subscription_tier,
          status: gymData.subscription_status || 'trial',
          current_period_end: gymData.subscription_end_date,
          gyms_count: gymsData?.length || 0,
          gyms_limit: tierData.max_gyms,
          members_count: membersData?.length || 0,
          members_limit: tierData.max_members
        })
      }
    } catch (error) {
      console.error('Error loading subscription info:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !subscription) {
    return null
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />
      case 'trial': return <Clock className="h-4 w-4" />
      case 'expired': return <AlertTriangle className="h-4 w-4" />
      default: return <AlertTriangle className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500'
      case 'trial': return 'bg-blue-500'
      case 'expired': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getTierPrice = (tier: string) => {
    switch (tier) {
      case 'solo': return '$20'
      case 'multi': return '$100'
      default: return 'N/A'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const isNearLimit = (current: number, limit: number) => {
    return current / limit > 0.8 // 80% threshold
  }

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Crown className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">
              {subscription.tier === 'solo' ? 'Solo Plan' : 'Multi Plan'}
            </CardTitle>
          </div>
          <Badge 
            variant="outline" 
            className={`${getStatusColor(subscription.status)} text-white border-none`}
          >
            {getStatusIcon(subscription.status)}
            <span className="ml-1 capitalize">{subscription.status}</span>
          </Badge>
        </div>
        <CardDescription>
          {getTierPrice(subscription.tier)}/month • 
          {subscription.status === 'trial' ? ' Trial' : ' Active'} until {formatDate(subscription.current_period_end)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Usage Stats */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Gyms</span>
            <span className={isNearLimit(subscription.gyms_count, subscription.gyms_limit) ? 'text-orange-500 font-medium' : ''}>
              {subscription.gyms_count} / {subscription.gyms_limit === 999 ? '∞' : subscription.gyms_limit}
            </span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span>Members</span>
            <span className={isNearLimit(subscription.members_count, subscription.members_limit) ? 'text-orange-500 font-medium' : ''}>
              {subscription.members_count} / {subscription.members_limit === 999999 ? '∞' : subscription.members_limit}
            </span>
          </div>
        </div>

        {/* Upgrade prompt if near limits */}
        {(subscription.tier === 'solo' && (
          isNearLimit(subscription.gyms_count, subscription.gyms_limit) ||
          isNearLimit(subscription.members_count, subscription.members_limit)
        )) && (
          <div className="pt-2 border-t">
            <div className="flex items-center space-x-2 text-sm text-orange-600 mb-2">
              <AlertTriangle className="h-4 w-4" />
              <span>Approaching plan limits</span>
            </div>
            <Button size="sm" className="w-full">
              Upgrade to Multi Plan
            </Button>
          </div>
        )}

        {/* Trial expiration warning */}
        {subscription.status === 'trial' && (
          <div className="pt-2 border-t">
            <div className="flex items-center space-x-2 text-sm text-blue-600 mb-2">
              <Clock className="h-4 w-4" />
              <span>Trial expires {formatDate(subscription.current_period_end)}</span>
            </div>
            <Button size="sm" variant="outline" className="w-full">
              Choose Plan
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 