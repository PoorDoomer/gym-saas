'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Calendar, 
  CreditCard, 
  Clock, 
  MapPin, 
  Star, 
  TrendingUp,
  LogOut,
  Settings,
  QrCode,
  CheckCircle,
  Plus,
  Activity,
  Target
} from 'lucide-react'

interface MemberDashboardData {
  member: {
    id: string
    first_name: string
    last_name: string
    email: string
    membership_plan: string
    membership_status: string
    credits_remaining: number
    membership_expires: string
  }
  upcomingClasses: Array<{
    id: string
    name: string
    date: string
    start_time: string
    end_time: string
    trainer: string
    location: string
    status: 'booked' | 'waitlist' | 'confirmed'
  }>
  recentActivity: Array<{
    id: string
    type: 'check_in' | 'class_booking' | 'credit_usage'
    description: string
    date: string
    credits_used?: number
  }>
  stats: {
    classesThisMonth: number
    totalCheckins: number
    creditsUsed: number
    favoriteClass: string
  }
  availableClasses: Array<{
    id: string
    name: string
    date: string
    start_time: string
    trainer: string
    capacity: number
    booked: number
    credits_required: number
  }>
}

export default function MemberDashboard() {
  const [dashboardData, setDashboardData] = useState<MemberDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        router.push('/login')
        return
      }

      setUser(user)

      // Check if user has member role
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)

      const hasMemberRole = roles?.some(r => r.role === 'member')
      if (!hasMemberRole) {
        // Redirect to appropriate dashboard based on role
        const isAdmin = roles?.some(r => r.role === 'admin')
        const isTrainer = roles?.some(r => r.role === 'trainer')
        if (isAdmin) {
          router.push('/gym-management')
        } else if (isTrainer) {
          router.push('/trainer-dashboard')
        } else {
          router.push('/login')
        }
        return
      }

      // Get member profile
      const { data: memberData } = await supabase
        .from('members')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (!memberData) {
        console.error('No member profile found for user')
        return
      }

      // Mock data for now - in real implementation, these would be proper queries
      const mockDashboardData: MemberDashboardData = {
        member: {
          id: memberData.id,
          first_name: memberData.first_name,
          last_name: memberData.last_name,
          email: memberData.email,
          membership_plan: 'Premium Plan',
          membership_status: 'active',
          credits_remaining: 8,
          membership_expires: '2025-08-15'
        },
        upcomingClasses: [
          {
            id: '1',
            name: 'Morning Yoga',
            date: 'Today',
            start_time: '09:00',
            end_time: '10:00',
            trainer: 'Sarah Johnson',
            location: 'Studio A',
            status: 'confirmed'
          },
          {
            id: '2',
            name: 'HIIT Training',
            date: 'Tomorrow',
            start_time: '18:00',
            end_time: '19:00',
            trainer: 'Mike Wilson',
            location: 'Main Gym',
            status: 'booked'
          },
          {
            id: '3',
            name: 'Pilates',
            date: 'Wednesday',
            start_time: '19:30',
            end_time: '20:30',
            trainer: 'Emma Davis',
            location: 'Studio B',
            status: 'waitlist'
          }
        ],
        recentActivity: [
          {
            id: '1',
            type: 'check_in',
            description: 'Checked in to HIIT Training',
            date: '2 hours ago',
            credits_used: 1
          },
          {
            id: '2',
            type: 'class_booking',
            description: 'Booked Morning Yoga class',
            date: 'Yesterday',
            credits_used: 1
          },
          {
            id: '3',
            type: 'check_in',
            description: 'Checked in to Strength Training',
            date: '3 days ago',
            credits_used: 1
          }
        ],
        stats: {
          classesThisMonth: 12,
          totalCheckins: 45,
          creditsUsed: 22,
          favoriteClass: 'HIIT Training'
        },
        availableClasses: [
          {
            id: '4',
            name: 'Evening Yoga',
            date: 'Today',
            start_time: '19:00',
            trainer: 'Sarah Johnson',
            capacity: 20,
            booked: 12,
            credits_required: 1
          },
          {
            id: '5',
            name: 'CrossFit',
            date: 'Tomorrow',
            start_time: '07:00',
            trainer: 'John Smith',
            capacity: 15,
            booked: 8,
            credits_required: 2
          },
          {
            id: '6',
            name: 'Spin Class',
            date: 'Friday',
            start_time: '18:30',
            trainer: 'Lisa Brown',
            capacity: 25,
            booked: 20,
            credits_required: 1
          }
        ]
      }

      setDashboardData(mockDashboardData)
    } catch (error) {
      console.error('Error loading member dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleBookClass = (classId: string) => {
    // In real implementation, this would make an API call to book the class
    console.log('Booking class:', classId)
    alert('Class booked successfully!')
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-500">Confirmed</Badge>
      case 'booked':
        return <Badge className="bg-blue-500">Booked</Badge>
      case 'waitlist':
        return <Badge className="bg-yellow-500">Waitlist</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'check_in':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'class_booking':
        return <Calendar className="h-4 w-4 text-blue-500" />
      case 'credit_usage':
        return <CreditCard className="h-4 w-4 text-purple-500" />
      default:
        return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading member dashboard...</p>
        </div>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p>Unable to load member dashboard.</p>
          <Button onClick={() => router.push('/login')} className="mt-4">
            Back to Login
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Avatar className="h-10 w-10">
                <AvatarFallback>
                  {getInitials(dashboardData.member.first_name, dashboardData.member.last_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Welcome back, {dashboardData.member.first_name}!
                </h1>
                <p className="text-sm text-gray-500">Member Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Classes This Month</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.stats.classesThisMonth}</div>
              <p className="text-xs text-muted-foreground">
                +3 from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Credits Remaining</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.member.credits_remaining}</div>
              <p className="text-xs text-muted-foreground">
                {dashboardData.stats.creditsUsed} used this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Check-ins</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.stats.totalCheckins}</div>
              <p className="text-xs text-muted-foreground">
                All time
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Favorite Class</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">{dashboardData.stats.favoriteClass}</div>
              <p className="text-xs text-muted-foreground">
                Most attended
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* My Classes & Bookings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upcoming Classes */}
            <Card>
              <CardHeader>
                <CardTitle>My Upcoming Classes</CardTitle>
                <CardDescription>
                  Your scheduled and booked classes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.upcomingClasses.map((classItem) => (
                    <div
                      key={classItem.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold">{classItem.name}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {classItem.date}
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {classItem.start_time} - {classItem.end_time}
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {classItem.location}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Trainer: {classItem.trainer}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(classItem.status)}
                        <Button size="sm" variant="outline">
                          <QrCode className="h-4 w-4 mr-2" />
                          QR Code
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Available Classes */}
            <Card>
              <CardHeader>
                <CardTitle>Available Classes</CardTitle>
                <CardDescription>
                  Book new classes with your credits
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardData.availableClasses.map((classItem) => (
                    <div
                      key={classItem.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium">{classItem.name}</h4>
                        <div className="flex items-center space-x-3 text-sm text-gray-500 mt-1">
                          <span>{classItem.date} • {classItem.start_time}</span>
                          <span>Trainer: {classItem.trainer}</span>
                          <span>{classItem.booked}/{classItem.capacity} spots</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">
                          {classItem.credits_required} credit{classItem.credits_required > 1 ? 's' : ''}
                        </Badge>
                        <Button 
                          size="sm" 
                          onClick={() => handleBookClass(classItem.id)}
                          disabled={classItem.booked >= classItem.capacity}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          {classItem.booked >= classItem.capacity ? 'Full' : 'Book'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Membership Status */}
            <Card>
              <CardHeader>
                <CardTitle>Membership Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Current Plan</p>
                    <p className="text-lg font-semibold">{dashboardData.member.membership_plan}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Status</p>
                    <Badge className="bg-green-500 capitalize">
                      {dashboardData.member.membership_status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Credits Remaining</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {dashboardData.member.credits_remaining}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Expires</p>
                    <p className="text-sm">{dashboardData.member.membership_expires}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Your latest gym activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardData.recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center space-x-3">
                      {getActivityIcon(activity.type)}
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.description}</p>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-500">{activity.date}</p>
                          {activity.credits_used && (
                            <Badge variant="outline" className="text-xs">
                              -{activity.credits_used} credit{activity.credits_used > 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full" variant="outline">
                  <QrCode className="h-4 w-4 mr-2" />
                  Generate QR Code
                </Button>
                <Button className="w-full" variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  View Schedule
                </Button>
                <Button className="w-full" variant="outline">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Buy More Credits
                </Button>
                <Button className="w-full" variant="outline">
                  <Target className="h-4 w-4 mr-2" />
                  Set Goals
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 