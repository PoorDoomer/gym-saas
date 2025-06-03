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
import { createClient } from "@/lib/supabase/client"

interface DashboardStats {
  active_members: number
  total_members: number
  monthly_revenue: string
  classes_today: number
  checkins_today: number
}

interface RecentActivity {
  activity_type: string
  member_name: string
  created_at: string
  description: string
}

interface Payment {
  amount: string
  payment_status: string
  created_at: string
}

interface Member {
  id: string
  is_active: boolean
}

interface CheckIn {
  created_at: string
  members: {
    first_name: string
    last_name: string
  } | null
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    active_members: 0,
    total_members: 0,
    monthly_revenue: "0",
    classes_today: 0,
    checkins_today: 0
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDashboardData() {
      const supabase = createClient()
      
      try {
        // Fetch dashboard statistics
        const { data: statsData, error: statsError } = await supabase.rpc('get_dashboard_stats')
        
        if (statsError) {
          console.error('Error fetching dashboard stats:', statsError)
          // Fallback to individual queries
          const [membersResult, paymentsResult, classesResult, checkinsResult] = await Promise.all([
            supabase.from('members').select('id, is_active'),
            supabase.from('payments').select('amount, payment_status, created_at').eq('payment_status', 'completed'),
            supabase.from('class_schedules').select('id').eq('scheduled_date', new Date().toISOString().split('T')[0]),
            supabase.from('check_ins').select('id').gte('created_at', new Date().toISOString().split('T')[0])
          ])

          const currentMonth = new Date().getMonth() + 1
          const currentYear = new Date().getFullYear()
          const monthlyRevenue = (paymentsResult.data as Payment[])?.filter((p: Payment) => {
            const paymentDate = new Date(p.created_at)
            return paymentDate.getMonth() + 1 === currentMonth && paymentDate.getFullYear() === currentYear
          }).reduce((sum: number, p: Payment) => sum + parseFloat(p.amount), 0) || 0

          setStats({
            active_members: (membersResult.data as Member[])?.filter((m: Member) => m.is_active).length || 0,
            total_members: membersResult.data?.length || 0,
            monthly_revenue: monthlyRevenue.toString(),
            classes_today: classesResult.data?.length || 0,
            checkins_today: checkinsResult.data?.length || 0
          })
        } else {
          setStats(statsData[0])
        }

        // Fetch recent activity
        const { data: activityData, error: activityError } = await supabase.rpc('get_recent_activity')
        
        if (activityError) {
          console.error('Error fetching recent activity:', activityError)
          // Fallback query
          const { data: checkinsData } = await supabase
            .from('check_ins')
            .select(`
              created_at,
              members (first_name, last_name)
            `)
            .order('created_at', { ascending: false })
            .limit(5)

          const formattedActivity = checkinsData?.map((ci: any) => ({
            activity_type: 'checkin',
            member_name: `${ci.members?.first_name || 'Unknown'} ${ci.members?.last_name || 'Member'}`,
            created_at: ci.created_at,
            description: 'checked in'
          })) || []

          setRecentActivity(formattedActivity)
        } else {
          setRecentActivity(activityData || [])
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

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
          <p>Loading dashboard...</p>
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
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
              <p className="text-slate-600 dark:text-slate-400">Welcome back! Here's what's happening at your gym today.</p>
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
              <CardTitle className="text-sm font-medium">Revenue This Month</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${parseFloat(stats.monthly_revenue).toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                From completed payments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Classes Today</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.classes_today}</div>
              <p className="text-xs text-muted-foreground">
                Scheduled for today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Check-ins Today</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.checkins_today}</div>
              <p className="text-xs text-muted-foreground">
                Members checked in
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest member activities and updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No recent activity</p>
                ) : (
                  recentActivity.slice(0, 5).map((activity, index) => (
                    <div key={index} className="flex items-center space-x-4">
                      <div className={`w-2 h-2 rounded-full ${getActivityColor(activity.activity_type)}`}></div>
                  <div className="flex-1">
                        <p className="text-sm font-medium">
                          {activity.member_name} {activity.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatTimeAgo(activity.created_at)}
                        </p>
                  </div>
                </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Today's Schedule */}
          <Card>
            <CardHeader>
              <CardTitle>Today's Schedule</CardTitle>
              <CardDescription>Classes and activities scheduled for today</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.classes_today === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground">No classes scheduled for today</p>
                    <Button variant="outline" size="sm" className="mt-2">
                      <Plus className="h-4 w-4 mr-2" />
                      Schedule a Class
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {stats.classes_today} classes scheduled
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="h-20 flex-col">
                <Users className="h-6 w-6 mb-2" />
                Add Member
              </Button>
              <Button variant="outline" className="h-20 flex-col">
                <Calendar className="h-6 w-6 mb-2" />
                Schedule Class
              </Button>
              <Button variant="outline" className="h-20 flex-col">
                <UserCheck className="h-6 w-6 mb-2" />
                Check-in Member
              </Button>
              <Button variant="outline" className="h-20 flex-col">
                <TrendingUp className="h-6 w-6 mb-2" />
                View Reports
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 