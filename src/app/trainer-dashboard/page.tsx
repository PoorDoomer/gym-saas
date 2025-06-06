'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getTrainerDashboardData, TrainerDashboardData } from '@/lib/services/trainerDashboard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Calendar, 
  Users, 
  Clock, 
  MapPin, 
  Star, 
  TrendingUp,
  LogOut,
  Settings,
  QrCode,
  CheckCircle
} from 'lucide-react'

export default function TrainerDashboard() {
  const [dashboardData, setDashboardData] = useState<TrainerDashboardData | null>(null)
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

      // Check if user has trainer role
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)

      const hasTrainerRole = roles?.some(r => r.role === 'trainer')
      if (!hasTrainerRole) {
        // Redirect to appropriate dashboard based on role
        const isAdmin = roles?.some(r => r.role === 'admin')
        if (isAdmin) {
          router.push('/gym-management')
        } else {
          router.push('/member-dashboard')
        }
        return
      }

      // Load real dashboard data
      const dashboardData = await getTrainerDashboardData(user.id)
      setDashboardData(dashboardData)

    } catch (error) {
      console.error('Error loading trainer dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleStartCheckIn = () => {
    router.push('/trainer/checkins')
  }

  const handleMyClassMembers = () => {
    router.push('/trainer/class-members')
  }

  const handleMySchedule = () => {
    router.push('/trainer/schedule')
  }

  const handleSettings = () => {
    router.push('/trainer/profile')
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading trainer dashboard...</p>
        </div>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p>Unable to load trainer dashboard.</p>
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
                  {getInitials(dashboardData.trainer.first_name, dashboardData.trainer.last_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Welcome, {dashboardData.trainer.first_name}!
                </h1>
                <p className="text-sm text-gray-500">Trainer Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm" onClick={handleSettings}>
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
              <CardTitle className="text-sm font-medium">Classes This Week</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.stats.classesThisWeek}</div>
              <p className="text-xs text-muted-foreground">
                +2 from last week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.stats.totalMembers}</div>
              <p className="text-xs text-muted-foreground">
                Across all classes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Attendance</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.stats.averageAttendance}%</div>
              <p className="text-xs text-muted-foreground">
                +5% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center">
                {dashboardData.stats.rating}
                <Star className="h-5 w-5 text-yellow-400 ml-1 fill-current" />
              </div>
              <p className="text-xs text-muted-foreground">
                From member reviews
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Today's Classes */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Today's Classes</CardTitle>
                <CardDescription>
                  Your scheduled classes for today
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.todayClasses.map((classItem) => (
                    <div
                      key={classItem.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold">{classItem.name}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {classItem.start_time} - {classItem.end_time}
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {classItem.location}
                          </div>
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {classItem.bookings}/{classItem.capacity}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant={classItem.bookings >= classItem.capacity * 0.8 ? "default" : "outline"}
                        >
                          {Math.round((classItem.bookings / classItem.capacity) * 100)}% Full
                        </Badge>
                        <Button size="sm" variant="outline" onClick={() => handleStartCheckIn()}>
                          <QrCode className="h-4 w-4 mr-2" />
                          Check-in
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Classes */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Upcoming Classes</CardTitle>
                <CardDescription>
                  Your next scheduled classes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardData.upcomingClasses.map((classItem) => (
                    <div
                      key={classItem.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <h4 className="font-medium">{classItem.name}</h4>
                        <p className="text-sm text-gray-500">
                          {classItem.date} • {classItem.start_time} - {classItem.end_time}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">
                          {classItem.bookings}/{classItem.capacity}
                        </span>
                        <Badge variant="outline">
                          {Math.round((classItem.bookings / classItem.capacity) * 100)}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Your Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Specializations</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {dashboardData.trainer.specializations.map((spec, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {spec}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Hourly Rate</p>
                    <p className="text-lg font-semibold">${dashboardData.trainer.hourly_rate}/hr</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p className="text-sm">{dashboardData.trainer.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Check-ins */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Check-ins</CardTitle>
                <CardDescription>
                  Latest member check-ins
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardData.recentCheckIns.map((checkin) => (
                    <div key={checkin.id} className="flex items-center space-x-3">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{checkin.member_name}</p>
                        <p className="text-xs text-gray-500">
                          {checkin.class_name} • {checkin.check_in_time}
                        </p>
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
                <Button className="w-full" variant="outline" onClick={handleStartCheckIn}>
                  <QrCode className="h-4 w-4 mr-2" />
                  Start Class Check-in
                </Button>
                <Button className="w-full" variant="outline" onClick={handleMyClassMembers}>
                  <Users className="h-4 w-4 mr-2" />
                  My Class Members
                </Button>
                <Button className="w-full" variant="outline" onClick={handleMySchedule}>
                  <Calendar className="h-4 w-4 mr-2" />
                  My Schedule
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 