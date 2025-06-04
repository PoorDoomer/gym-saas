'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Crown, Check, Building2, Users, CreditCard, ArrowLeft, Star } from 'lucide-react'

interface UserSubscription {
  id: string
  user_id: string
  subscription_tier: string
  subscription_status: string
  current_period_start: string
  current_period_end: string
  trial_ends_at: string | null
  gyms_count: number
  gyms_limit: number
  members_count: number
  members_limit: number
}

export default function SubscriptionPage() {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadSubscriptionData()
  }, [])

  const loadSubscriptionData = async () => {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        router.push('/login')
        return
      }
      setUser(user)

      // Get user's subscription
      const { data: userSub, error: subError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (subError) {
        console.error('Error loading subscription:', subError)
        // Create default subscription if none exists
        const { data: newSub, error: createError } = await supabase
          .from('user_subscriptions')
          .insert({
            user_id: user.id,
            subscription_tier: 'solo',
            subscription_status: 'trial',
            trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
          })
          .select()
          .single()

        if (createError) {
          console.error('Error creating subscription:', createError)
          return
        }
        
        // Use the newly created subscription
        setUserSubscription(newSub, user.id)
        return
      }

      setUserSubscription(userSub, user.id)
    } catch (error) {
      console.error('Error in loadSubscriptionData:', error)
    } finally {
      setLoading(false)
    }
  }

  const setUserSubscription = async (userSub: any, userId: string) => {
    // Get user's gyms count
    const { data: gyms, error: gymsError } = await supabase
      .from('gyms')
      .select('id')
      .eq('owner_user_id', userId)
      .eq('is_active', true)

    // Get total members count across all gyms
    let totalMembers = 0
    if (gyms && gyms.length > 0) {
      const { data: members, error: membersError } = await supabase
        .from('members')
        .select('id')
        .in('gym_id', gyms.map(g => g.id))
        .eq('is_active', true)

      if (!membersError && members) {
        totalMembers = members.length
      }
    }

    // Set subscription with usage data
    setSubscription({
      ...userSub,
      gyms_count: gyms?.length || 0,
      gyms_limit: userSub.subscription_tier === 'solo' ? 1 : 99,
      members_count: totalMembers,
      members_limit: userSub.subscription_tier === 'solo' ? 200 : 999999
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>
      case 'trial':
        return <Badge className="bg-blue-500">Free Trial</Badge>
      case 'expired':
        return <Badge className="bg-red-500">Expired</Badge>
      case 'cancelled':
        return <Badge className="bg-gray-500">Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getTierInfo = (tier: string) => {
    if (tier === 'solo') {
      return {
        name: 'Solo Plan',
        price: '$20',
        period: 'month',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        icon: <Building2 className="h-6 w-6" />
      }
    } else {
      return {
        name: 'Multi Plan',
        price: '$100',
        period: 'month',
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        icon: <Crown className="h-6 w-6" />
      }
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleUpgrade = async (newTier: string) => {
    if (!subscription) return

    try {
      const { error } = await supabase
        .from('user_subscriptions')
        .update({ 
          subscription_tier: newTier,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', subscription.user_id)

      if (error) {
        console.error('Error updating subscription:', error)
        alert('Failed to update subscription. Please try again.')
        return
      }

      // Refresh subscription data
      loadSubscriptionData()
      alert('Subscription updated successfully!')
    } catch (error) {
      console.error('Error in handleUpgrade:', error)
      alert('An error occurred. Please try again.')
    }
  }

  const isNearLimit = (current: number, limit: number, threshold = 0.8) => {
    return current >= limit * threshold
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Crown className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading subscription details...</p>
        </div>
      </div>
    )
  }

  if (!subscription) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p>Unable to load subscription information.</p>
          <Button onClick={() => router.push('/gym-management')} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  const tierInfo = getTierInfo(subscription.subscription_tier)

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/gym-management')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Account Subscription</h1>
              <p className="text-gray-600 mt-1">
                Manage your plan and billing for all gyms
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Current Plan */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span className={tierInfo.color}>{tierInfo.icon}</span>
                  <span>Current Plan</span>
                </CardTitle>
                <CardDescription>
                  Your account subscription (applies to all gyms)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`p-6 rounded-lg ${tierInfo.bgColor} mb-6`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className={`text-2xl font-bold ${tierInfo.color}`}>
                        {tierInfo.name}
                      </h3>
                      <div className="flex items-center space-x-2 mt-2">
                        {getStatusBadge(subscription.subscription_status)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-3xl font-bold ${tierInfo.color}`}>
                        {tierInfo.price}
                      </div>
                      <div className="text-sm text-gray-600">
                        per {tierInfo.period}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Usage Statistics */}
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Gym Locations
                      </span>
                      <span className={`text-sm ${isNearLimit(subscription.gyms_count, subscription.gyms_limit) ? 'text-orange-600 font-medium' : 'text-gray-600'}`}>
                        {subscription.gyms_count} / {subscription.gyms_limit === 999999 ? '∞' : subscription.gyms_limit}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${isNearLimit(subscription.gyms_count, subscription.gyms_limit) ? 'bg-orange-500' : 'bg-blue-600'}`}
                        style={{
                          width: `${Math.min((subscription.gyms_count / subscription.gyms_limit) * 100, 100)}%`
                        }}
                      ></div>
                    </div>
                    {isNearLimit(subscription.gyms_count, subscription.gyms_limit) && (
                      <p className="text-xs text-orange-600 mt-1">
                        ⚠️ Approaching limit. Consider upgrading to Multi Plan.
                      </p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Total Members (All Gyms)
                      </span>
                      <span className={`text-sm ${isNearLimit(subscription.members_count, subscription.members_limit) ? 'text-orange-600 font-medium' : 'text-gray-600'}`}>
                        {subscription.members_count} / {subscription.members_limit === 999999 ? '∞' : subscription.members_limit}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${isNearLimit(subscription.members_count, subscription.members_limit) ? 'bg-orange-500' : 'bg-green-600'}`}
                        style={{
                          width: `${Math.min((subscription.members_count / subscription.members_limit) * 100, 100)}%`
                        }}
                      ></div>
                    </div>
                    {isNearLimit(subscription.members_count, subscription.members_limit) && (
                      <p className="text-xs text-orange-600 mt-1">
                        ⚠️ Approaching limit. Consider upgrading to Multi Plan.
                      </p>
                    )}
                  </div>
                </div>

                {/* Billing Period */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Billing Period</h4>
                  <div className="text-sm text-gray-600">
                    <p>
                      Current period: {formatDate(subscription.current_period_start)} - {formatDate(subscription.current_period_end)}
                    </p>
                    <p className="mt-1">
                      {subscription.subscription_status === 'trial' 
                        ? `Trial expires: ${formatDate(subscription.trial_ends_at || subscription.current_period_end)}` 
                        : `Next billing date: ${formatDate(subscription.current_period_end)}`}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Plan Options */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Available Plans</CardTitle>
                <CardDescription>
                  Upgrade or change your account plan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Solo Plan */}
                  <div className={`p-4 border rounded-lg ${subscription.subscription_tier === 'solo' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">Solo Plan</h4>
                      <span className="text-lg font-bold">$20</span>
                    </div>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li className="flex items-center">
                        <Check className="h-3 w-3 mr-2 text-green-500" />
                        1 gym location
                      </li>
                      <li className="flex items-center">
                        <Check className="h-3 w-3 mr-2 text-green-500" />
                        Up to 200 members
                      </li>
                      <li className="flex items-center">
                        <Check className="h-3 w-3 mr-2 text-green-500" />
                        Up to 10 trainers
                      </li>
                    </ul>
                    {subscription.subscription_tier === 'solo' ? (
                      <div className="mt-3 text-center text-sm text-gray-500">
                        Current Plan
                      </div>
                    ) : (
                      <Button 
                        size="sm" 
                        className="w-full mt-3"
                        onClick={() => handleUpgrade('solo')}
                      >
                        Downgrade
                      </Button>
                    )}
                  </div>

                  {/* Multi Plan */}
                  <div className={`p-4 border rounded-lg ${subscription.subscription_tier === 'multi' ? 'border-purple-500 bg-purple-50' : 'border-gray-200'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold flex items-center">
                        Multi Plan
                        <Star className="h-3 w-3 ml-1 text-orange-500" />
                      </h4>
                      <span className="text-lg font-bold">$100</span>
                    </div>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li className="flex items-center">
                        <Check className="h-3 w-3 mr-2 text-green-500" />
                        Up to 99 locations
                      </li>
                      <li className="flex items-center">
                        <Check className="h-3 w-3 mr-2 text-green-500" />
                        Unlimited members
                      </li>
                      <li className="flex items-center">
                        <Check className="h-3 w-3 mr-2 text-green-500" />
                        Unlimited trainers
                      </li>
                    </ul>
                    {subscription.subscription_tier === 'multi' ? (
                      <div className="mt-3 text-center text-sm text-gray-500">
                        Current Plan
                      </div>
                    ) : (
                      <Button 
                        size="sm" 
                        className="w-full mt-3 bg-purple-600 hover:bg-purple-700"
                        onClick={() => handleUpgrade('multi')}
                      >
                        Upgrade
                      </Button>
                    )}
                  </div>
                </div>

                {/* Billing Management */}
                <div className="mt-6 pt-6 border-t">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push('/billing')}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Manage Billing
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 