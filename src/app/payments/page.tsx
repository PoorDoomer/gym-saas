'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Search, DollarSign, CreditCard, TrendingUp, AlertCircle, Download, Eye, Loader2 } from 'lucide-react'
import { Payment, Subscription, Member, MembershipPlan } from '@/lib/types'
import { getPayments, getSubscriptions, getPaymentStats, PaymentStats } from '@/lib/services/payments'

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [stats, setStats] = useState<PaymentStats>({
    totalRevenue: 0,
    monthlyRevenue: 0,
    pendingPayments: 0,
    activeSubscriptions: 0,
    revenueGrowth: 0
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Fetch data on component mount
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [paymentsData, subscriptionsData, statsData] = await Promise.all([
        getPayments(),
        getSubscriptions(),
        getPaymentStats()
      ])
      setPayments(paymentsData)
      setSubscriptions(subscriptionsData)
      setStats(statsData)
    } catch (error) {
      console.error('Failed to load payment data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredPayments = payments.filter(payment =>
    payment.member?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.member?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.member?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredSubscriptions = subscriptions.filter(subscription =>
    subscription.member?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subscription.member?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subscription.member?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subscription.plan?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Calculate statistics
  const totalRevenue = payments.filter(p => p.payment_status === 'completed').reduce((sum, p) => sum + p.amount, 0)
  const monthlyRecurring = subscriptions.filter(s => s.payment_status === 'active').reduce((sum, s) => sum + s.amount, 0)
  const failedPayments = payments.filter(p => p.payment_status === 'failed').length
  const pastDueSubscriptions = subscriptions.filter(s => s.payment_status === 'past_due').length

  const handleSubmit = async (formData: FormData) => {
    // Mock form submission for now - would integrate with Stripe in production
    console.log('Payment form submitted:', Object.fromEntries(formData))
    setIsDialogOpen(false)
  }

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>
      case 'failed':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Failed</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getSubscriptionStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
      case 'past_due':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Past Due</Badge>
      case 'canceled':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Canceled</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Payments & Billing</h2>
          <p className="text-muted-foreground">
            Manage payments, subscriptions, and billing for your gym
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" className="cursor-pointer">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="cursor-pointer">
                <Plus className="mr-2 h-4 w-4" />
                Record Payment
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Record Manual Payment</DialogTitle>
                <DialogDescription>
                  Record a cash or manual payment for a member
                </DialogDescription>
              </DialogHeader>
              <form action={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="member_id">Member</Label>
                  <Select name="member_id" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a member" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">John Smith</SelectItem>
                      <SelectItem value="2">Sarah Johnson</SelectItem>
                      <SelectItem value="3">Mike Davis</SelectItem>
                      <SelectItem value="4">Emma Wilson</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount ($)</Label>
                    <Input
                      id="amount"
                      name="amount"
                      type="number"
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payment_method">Payment Method</Label>
                    <Select name="payment_method" required>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="check">Check</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    name="description"
                    placeholder="e.g., Monthly membership, Day pass, Personal training"
                    required
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="cursor-pointer">
                    Cancel
                  </Button>
                  <Button type="submit" className="cursor-pointer">
                    Record Payment
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              From completed payments
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.monthlyRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              <span className={stats.revenueGrowth >= 0 ? "text-green-600" : "text-red-600"}>
                {stats.revenueGrowth >= 0 ? '+' : ''}{stats.revenueGrowth}%
              </span> from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingPayments}</div>
            <p className="text-xs text-muted-foreground">
              Require attention
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
            <p className="text-xs text-muted-foreground">
              Currently active
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search payments and subscriptions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Tabs for Payments and Subscriptions */}
      <Tabs defaultValue="payments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>
                All payment transactions and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredPayments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold">
                            {payment.member?.first_name} {payment.member?.last_name}
                          </h3>
                          {getPaymentStatusBadge(payment.payment_status)}
                        </div>
                        <p className="text-sm text-muted-foreground">{payment.member?.email}</p>
                        <p className="text-sm text-muted-foreground">{payment.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(payment.payment_date).toLocaleDateString()} • {payment.payment_method}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="font-semibold">${payment.amount.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">{payment.currency}</p>
                      </div>
                      <Button variant="outline" size="sm" className="cursor-pointer">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                {filteredPayments.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No payments found matching your search.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="subscriptions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Subscriptions</CardTitle>
              <CardDescription>
                Manage member subscriptions and billing cycles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredSubscriptions.map((subscription) => (
                  <div key={subscription.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold">
                            {subscription.member?.first_name} {subscription.member?.last_name}
                          </h3>
                          {getSubscriptionStatusBadge(subscription.payment_status)}
                        </div>
                        <p className="text-sm text-muted-foreground">{subscription.member?.email}</p>
                        <p className="text-sm text-muted-foreground">{subscription.plan?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(subscription.start_date).toLocaleDateString()} - {new Date(subscription.end_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="font-semibold">${subscription.amount.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">per {subscription.plan?.duration_months === 1 ? 'month' : 'year'}</p>
                      </div>
                      <Button variant="outline" size="sm" className="cursor-pointer">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                {filteredSubscriptions.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No subscriptions found matching your search.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 