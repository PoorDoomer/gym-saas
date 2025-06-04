'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CreditCard, Download, ArrowLeft, Calendar, DollarSign, Receipt } from 'lucide-react'

interface BillingHistory {
  id: string
  date: string
  amount: number
  status: string
  description: string
  invoice_url?: string
}

interface PaymentMethod {
  id: string
  type: string
  last4: string
  brand: string
  exp_month: number
  exp_year: number
  is_default: boolean
}

export default function BillingPage() {
  const [subscription, setSubscription] = useState<any>(null)
  const [billingHistory, setBillingHistory] = useState<BillingHistory[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadBillingData()
  }, [])

  const loadBillingData = async () => {
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

      if (!subError && userSub) {
        setSubscription(userSub)
      }

      // Mock billing history - in real app, this would come from Stripe
      setBillingHistory([
        {
          id: 'inv_001',
          date: '2025-05-04',
          amount: 20.00,
          status: 'paid',
          description: 'Solo Plan - May 2025',
          invoice_url: '#'
        },
        {
          id: 'inv_002',
          date: '2025-04-04',
          amount: 20.00,
          status: 'paid',
          description: 'Solo Plan - April 2025',
          invoice_url: '#'
        },
        {
          id: 'inv_003',
          date: '2025-03-04',
          amount: 0.00,
          status: 'paid',
          description: 'Free Trial - March 2025',
          invoice_url: '#'
        }
      ])

      // Mock payment methods - in real app, this would come from Stripe
      setPaymentMethods([
        {
          id: 'pm_001',
          type: 'card',
          last4: '4242',
          brand: 'visa',
          exp_month: 12,
          exp_year: 2027,
          is_default: true
        }
      ])

    } catch (error) {
      console.error('Error in loadBillingData:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500">Paid</Badge>
      case 'pending':
        return <Badge className="bg-yellow-500">Pending</Badge>
      case 'failed':
        return <Badge className="bg-red-500">Failed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <CreditCard className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading billing information...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/subscription')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Subscription
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Billing & Invoices</h1>
              <p className="text-gray-600 mt-1">
                Manage your payment methods and billing history
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Current Subscription Summary */}
          <div className="lg:col-span-2 space-y-8">
            {/* Current Plan Summary */}
            {subscription && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <span>Current Subscription</span>
                  </CardTitle>
                  <CardDescription>
                    Your active plan and next billing date
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {subscription.subscription_tier === 'solo' ? 'Solo Plan' : 'Multi Plan'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {subscription.subscription_status === 'trial' ? 'Free Trial' : 'Active Subscription'}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">
                        {subscription.subscription_tier === 'solo' ? '$20' : '$100'}
                      </div>
                      <div className="text-sm text-gray-500">per month</div>
                    </div>
                  </div>
                  
                  {subscription.subscription_status === 'trial' ? (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <Calendar className="h-4 w-4 inline mr-1" />
                        Trial expires: {formatDate(subscription.trial_ends_at || subscription.current_period_end)}
                      </p>
                    </div>
                  ) : (
                    <div className="mt-4 p-3 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-800">
                        <Calendar className="h-4 w-4 inline mr-1" />
                        Next billing date: {formatDate(subscription.current_period_end)}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Billing History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Receipt className="h-5 w-5 text-blue-600" />
                  <span>Billing History</span>
                </CardTitle>
                <CardDescription>
                  Your past invoices and payments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {billingHistory.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {invoice.description}
                            </h4>
                            <p className="text-sm text-gray-500">
                              {formatDate(invoice.date)}
                            </p>
                          </div>
                          {getStatusBadge(invoice.status)}
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="font-semibold text-gray-900">
                            {formatAmount(invoice.amount)}
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Methods */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5 text-purple-600" />
                  <span>Payment Methods</span>
                </CardTitle>
                <CardDescription>
                  Manage your payment methods
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      className={`p-4 border rounded-lg ${method.is_default ? 'border-purple-500 bg-purple-50' : 'border-gray-200'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <CreditCard className="h-6 w-6 text-gray-400" />
                          <div>
                            <p className="font-medium text-gray-900">
                              •••• •••• •••• {method.last4}
                            </p>
                            <p className="text-sm text-gray-500">
                              {method.brand.toUpperCase()} • Expires {method.exp_month}/{method.exp_year}
                            </p>
                          </div>
                        </div>
                        {method.is_default && (
                          <Badge variant="outline" className="text-purple-600 border-purple-600">
                            Default
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}

                  <Button variant="outline" className="w-full">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Add Payment Method
                  </Button>
                </div>

                {/* Billing Actions */}
                <div className="mt-6 pt-6 border-t space-y-3">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push('/subscription')}
                  >
                    Change Plan
                  </Button>
                  
                  <Button variant="outline" className="w-full text-red-600 border-red-200 hover:bg-red-50">
                    Cancel Subscription
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