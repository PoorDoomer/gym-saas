'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Users, 
  Calendar, 
  DollarSign, 
  Activity,
  Plus,
  TrendingUp,
  Clock,
  UserCheck
} from "lucide-react"
import { useEffect, useState } from "react"
import { gymDataService } from "@/lib/services/gymDataService"
import { useGym } from "@/lib/contexts/GymContext"

interface DashboardStats {
  active_members: number
  total_members: number
  monthly_revenue: string
  classes_today: number
  checkins_today: number
  total_trainers: number
  active_trainers: number
  total_classes: number
  active_classes: number
}

interface RecentActivity {
  activity_type: string
  member_name: string
  created_at: string
  description: string
}

export default function DashboardPage() {
  const { currentGym } = useGym()
  const [stats, setStats] = useState<DashboardStats>({
    active_members: 0,
    total_members: 0,
    monthly_revenue: "0",
    classes_today: 0,
    checkins_today: 0,
    total_trainers: 0,
    active_trainers: 0,
    total_classes: 0,
    active_classes: 0
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (currentGym) {
      fetchDashboardData()
    }
  }, [currentGym])

    async function fetchDashboardData() {
    if (!currentGym) {
      console.error('No gym selected')
      setLoading(false)
      return
    }

    try {
      console.log(`Loading dashboard for gym: ${currentGym.name} (${currentGym.id})`)
      
      // Get gym-isolated analytics
      const analytics = await gymDataService.getGymAnalytics()
      
      // Calculate monthly revenue from current month
          const currentMonth = new Date().getMonth() + 1
          const currentYear = new Date().getFullYear()
      const monthlyRevenue = analytics.revenue?.filter(r => {
        const paymentDate = new Date(r.created_at)
        return paymentDate.getMonth() + 1 === currentMonth && 
               paymentDate.getFullYear() === currentYear &&
               r.status === 'completed'
      }).reduce((sum, r) => sum + (r.amount || 0), 0) || 0

      // Calculate today's classes and checkins
      const today = new Date().toISOString().split('T')[0]
      const classesToday = 0 // TODO: Implement today's classes from analytics
      const checkinsToday = 0 // TODO: Implement today's checkins from analytics

          setStats({
        active_members: analytics.activeMembers,
        total_members: analytics.totalMembers,
            monthly_revenue: monthlyRevenue.toString(),
        classes_today: classesToday,
        checkins_today: checkinsToday,
        total_trainers: analytics.totalTrainers,
        active_trainers: analytics.activeTrainers,
        total_classes: analytics.totalClasses,
        active_classes: analytics.activeClasses
      })

      // Create sample recent activity from gym data
      const recentActivities: RecentActivity[] = []
      
      // Add recent member registrations
      analytics.members?.slice(-3).forEach(member => {
        recentActivities.push({
          activity_type: 'registration',
          member_name: `Member ID: ${member.id}`,
          created_at: member.created_at,
          description: 'joined the gym'
        })
      })

      setRecentActivity(recentActivities)
      
      console.log('Dashboard data loaded successfully:', {
        gym: currentGym.name,
        members: analytics.totalMembers,
        trainers: analytics.totalTrainers,
        revenue: monthlyRevenue
      })

      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minutes ago`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`
    return `${Math.floor(diffMins / 1440)} days ago`
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'checkin': return 'bg-green-500'
      case 'payment': return 'bg-purple-500'
      case 'registration': return 'bg-blue-500'
      case 'class': return 'bg-orange-500'
      default: return 'bg-gray-500'
    }
  }

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading dashboard for {currentGym?.name || 'your gym'}...</p>
        </div>
      </div>
    )
  }

  if (!currentGym) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="text-center">
          <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">No Gym Selected</h2>
          <p className="text-slate-600 mb-4">Please select a gym to view the dashboard.</p>
          <Button onClick={() => window.location.href = '/gym-selection'}>
            Select Gym
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                {currentGym.name} Dashboard
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Welcome back! Here's what's happening at your gym today.
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Quick Actions
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active_members}</div>
              <p className="text-xs text-muted-foreground">
                {stats.total_members} total members
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${parseFloat(stats.monthly_revenue).toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 inline mr-1" />
                Current month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Trainers</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active_trainers}</div>
              <p className="text-xs text-muted-foreground">
                {stats.total_trainers} total trainers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Classes</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active_classes}</div>
              <p className="text-xs text-muted-foreground">
                {stats.total_classes} total classes
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest updates from your gym</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${getActivityColor(activity.activity_type)}`} />
                  <div className="flex-1">
                        <p className="text-sm font-medium">
                          {activity.member_name} {activity.description}
                        </p>
                        <p className="text-xs text-slate-500">{formatTimeAgo(activity.created_at)}</p>
                  </div>
                </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Activity className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-slate-500">No recent activity</p>
                    <p className="text-xs text-slate-400">Activity will appear here as members interact with your gym</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks you can perform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                      <Plus className="h-4 w-4 mr-2" />
                  Add New Member
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Class
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Record Payment
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  Check-in Member
                    </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 