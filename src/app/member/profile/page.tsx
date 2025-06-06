'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  User, 
  Mail, 
  Phone, 
  Calendar,
  CreditCard,
  MapPin,
  ArrowLeft,
  Edit,
  Save,
  X,
  Check,
  History,
  Shield
} from 'lucide-react'
import { PageLoader } from '@/components/ui/loading-spinner'

interface MemberProfile {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  date_of_birth?: string
  address?: string
  emergency_contact?: string
  emergency_phone?: string
  membership_plan: string
  member_since: string
  status: 'active' | 'inactive' | 'suspended'
  notes?: string
}

interface MembershipInfo {
  plan_name: string
  plan_price: number
  plan_duration: number
  credits_per_month: number
  next_billing_date: string
  auto_renew: boolean
}

interface PaymentHistory {
  id: string
  amount: number
  payment_method: string
  payment_date: string
  description: string
  status: 'completed' | 'pending' | 'failed'
}

export default function MemberProfilePage() {
  const [profile, setProfile] = useState<MemberProfile | null>(null)
  const [membership, setMembership] = useState<MembershipInfo | null>(null)
  const [payments, setPayments] = useState<PaymentHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editedProfile, setEditedProfile] = useState<Partial<MemberProfile>>({})
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadMemberProfile()
  }, [])

  const loadMemberProfile = async () => {
    try {
      // Get current user and verify member role
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        router.push('/login')
        return
      }

      setUser(user)

      // Get member profile
      const { data: member, error: memberError } = await supabase
        .from('members')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (memberError || !member) {
        console.error('Member not found:', memberError)
        router.push('/member-dashboard')
        return
      }

      setProfile({
        id: member.id,
        first_name: member.first_name || '',
        last_name: member.last_name || '',
        email: member.email || '',
        phone: member.phone || '',
        date_of_birth: member.date_of_birth || '',
        address: member.address || '',
        emergency_contact: member.emergency_contact || '',
        emergency_phone: member.emergency_phone || '',
        membership_plan: member.membership_plan || 'Standard',
        member_since: member.created_at || '',
        status: member.status || 'active',
        notes: member.notes || ''
      })

      // Get membership plan details
      const { data: planDetails, error: planError } = await supabase
        .from('membership_plans')
        .select('name, price, duration_months, credits_per_month')
        .eq('name', member.membership_plan)
        .single()

      if (!planError && planDetails) {
        const nextBilling = new Date()
        nextBilling.setMonth(nextBilling.getMonth() + (planDetails.duration_months || 1))
        
        setMembership({
          plan_name: planDetails.name,
          plan_price: planDetails.price || 0,
          plan_duration: planDetails.duration_months || 1,
          credits_per_month: planDetails.credits_per_month || 0,
          next_billing_date: nextBilling.toISOString(),
          auto_renew: true
        })
      }

      // Get payment history
      const { data: paymentHistory, error: paymentError } = await supabase
        .from('payments')
        .select('id, amount, payment_method, payment_date, description, status')
        .eq('member_id', member.id)
        .order('payment_date', { ascending: false })
        .limit(10)

      if (!paymentError && paymentHistory) {
        setPayments(paymentHistory)
      }

    } catch (error) {
      console.error('Error loading member profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = () => {
    setEditing(true)
    setEditedProfile({ ...profile })
  }

  const handleCancelEdit = () => {
    setEditing(false)
    setEditedProfile({})
  }

  const handleSaveProfile = async () => {
    if (!profile || !editedProfile) return

    try {
      const { error } = await supabase
        .from('members')
        .update({
          first_name: editedProfile.first_name,
          last_name: editedProfile.last_name,
          phone: editedProfile.phone,
          address: editedProfile.address,
          emergency_contact: editedProfile.emergency_contact,
          emergency_phone: editedProfile.emergency_phone,
          notes: editedProfile.notes
        })
        .eq('id', profile.id)

      if (error) {
        console.error('Error updating profile:', error)
        return
      }

      // Update local state
      setProfile({ ...profile, ...editedProfile })
      setEditing(false)
      setEditedProfile({})

    } catch (error) {
      console.error('Error saving profile:', error)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not set'
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'long', 
      day: 'numeric' 
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
      case 'suspended':
        return <Badge className="bg-red-100 text-red-800">Suspended</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800"><Check className="h-3 w-3 mr-1" />Paid</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case 'failed':
        return <Badge className="bg-red-100 text-red-800"><X className="h-3 w-3 mr-1" />Failed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return <PageLoader />
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p>Unable to load member profile.</p>
          <Button onClick={() => router.push('/member-dashboard')} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => router.push('/member-dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
            <p className="text-gray-500">Manage your personal information and membership</p>
          </div>
        </div>
        {!editing && (
          <Button onClick={handleEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        )}
      </div>

      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-6">
            <Avatar className="h-24 w-24">
              <AvatarFallback className="text-xl">
                {profile.first_name.charAt(0)}{profile.last_name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">
                {profile.first_name} {profile.last_name}
              </h2>
              <div className="flex items-center space-x-4 mt-2">
                <div className="flex items-center text-gray-600">
                  <Mail className="h-4 w-4 mr-2" />
                  {profile.email}
                </div>
                <div className="flex items-center text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  Member since {formatDate(profile.member_since)}
                </div>
                {getStatusBadge(profile.status)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="personal" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
          <TabsTrigger value="membership">Membership</TabsTrigger>
          <TabsTrigger value="payments">Payment History</TabsTrigger>
        </TabsList>

        {/* Personal Information */}
        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Update your personal details and emergency contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={editing ? editedProfile.first_name || '' : profile.first_name}
                    onChange={(e) => setEditedProfile({ ...editedProfile, first_name: e.target.value })}
                    disabled={!editing}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={editing ? editedProfile.last_name || '' : profile.last_name}
                    onChange={(e) => setEditedProfile({ ...editedProfile, last_name: e.target.value })}
                    disabled={!editing}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    disabled={true}
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed from this page</p>
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={editing ? editedProfile.phone || '' : profile.phone || ''}
                    onChange={(e) => setEditedProfile({ ...editedProfile, phone: e.target.value })}
                    disabled={!editing}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={editing ? editedProfile.address || '' : profile.address || ''}
                  onChange={(e) => setEditedProfile({ ...editedProfile, address: e.target.value })}
                  disabled={!editing}
                  rows={3}
                />
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-4">Emergency Contact</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="emergencyContact">Emergency Contact Name</Label>
                    <Input
                      id="emergencyContact"
                      value={editing ? editedProfile.emergency_contact || '' : profile.emergency_contact || ''}
                      onChange={(e) => setEditedProfile({ ...editedProfile, emergency_contact: e.target.value })}
                      disabled={!editing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="emergencyPhone">Emergency Contact Phone</Label>
                    <Input
                      id="emergencyPhone"
                      value={editing ? editedProfile.emergency_phone || '' : profile.emergency_phone || ''}
                      onChange={(e) => setEditedProfile({ ...editedProfile, emergency_phone: e.target.value })}
                      disabled={!editing}
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={editing ? editedProfile.notes || '' : profile.notes || ''}
                  onChange={(e) => setEditedProfile({ ...editedProfile, notes: e.target.value })}
                  disabled={!editing}
                  rows={3}
                  placeholder="Any additional information or special requirements..."
                />
              </div>

              {editing && (
                <div className="flex space-x-2">
                  <Button onClick={handleSaveProfile}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button variant="outline" onClick={handleCancelEdit}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Membership Information */}
        <TabsContent value="membership">
          <div className="space-y-6">
            {membership && (
              <Card>
                <CardHeader>
                  <CardTitle>Current Membership Plan</CardTitle>
                  <CardDescription>
                    Your active membership plan and billing information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Plan Name</Label>
                        <p className="text-lg font-semibold">{membership.plan_name}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Monthly Price</Label>
                        <p className="text-lg font-semibold">{formatCurrency(membership.plan_price)}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Credits per Month</Label>
                        <p className="text-lg font-semibold">{membership.credits_per_month} credits</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Next Billing Date</Label>
                        <p className="text-lg font-semibold">{formatDate(membership.next_billing_date)}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Auto Renewal</Label>
                        <div className="flex items-center space-x-2">
                          <Badge className={membership.auto_renew ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                            {membership.auto_renew ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Member Status</Label>
                        <div>{getStatusBadge(profile.status)}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Membership Actions</CardTitle>
                <CardDescription>
                  Manage your membership plan and billing preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full justify-start">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Update Payment Method
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Shield className="h-4 w-4 mr-2" />
                  Change Plan
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  Pause Membership
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Payment History */}
        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>
                Your recent payments and transaction history
              </CardDescription>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <div className="text-center py-8">
                  <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No payment history</h3>
                  <p className="text-gray-500">Your payment transactions will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {payments.map(payment => (
                    <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div>
                            <h4 className="font-medium">{payment.description}</h4>
                            <p className="text-sm text-gray-500">
                              {formatDate(payment.payment_date)} • {payment.payment_method}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="font-semibold">{formatCurrency(payment.amount)}</span>
                        {getPaymentStatusBadge(payment.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 