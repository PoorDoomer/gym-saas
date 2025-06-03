'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar, Download, TrendingUp, TrendingDown, Users, DollarSign, Activity, Clock, BarChart3, PieChart } from 'lucide-react'

export default function ReportsPage() {
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('30')

  // Mock data for demonstration
  const [reportData, setReportData] = useState({
    membershipStats: {
      totalMembers: 156,
      activeMembers: 142,
      newMembersThisMonth: 23,
      churnRate: 8.9,
      retentionRate: 91.1,
      membershipGrowth: 12.5
    },
    revenueStats: {
      totalRevenue: 12450.00,
      monthlyRecurring: 8900.00,
      averageRevenuePerMember: 87.68,
      revenueGrowth: 15.2,
      outstandingPayments: 1250.00
    },
    classStats: {
      totalClasses: 89,
      averageAttendance: 12.4,
      mostPopularClass: 'HIIT Training',
      classUtilization: 78.5,
      totalBookings: 1104
    },
    checkInStats: {
      totalCheckIns: 2847,
      averageSessionDuration: 85,
      peakHours: '6:00 PM - 8:00 PM',
      weekdayVsWeekend: { weekday: 68, weekend: 32 },
      averageCheckInsPerDay: 94.9
    },
    trainerStats: {
      totalTrainers: 8,
      activeTrainers: 6,
      averageHourlyRate: 72.50,
      totalTrainingHours: 156,
      mostBookedTrainer: 'Mike Johnson'
    }
  })

  useEffect(() => {
    setTimeout(() => {
      setLoading(false)
    }, 1000)
  }, [])

  const membershipTrends = [
    { month: 'Jan', members: 120, revenue: 8400 },
    { month: 'Feb', members: 128, revenue: 8960 },
    { month: 'Mar', members: 135, revenue: 9450 },
    { month: 'Apr', members: 142, revenue: 9940 },
    { month: 'May', members: 148, revenue: 10360 },
    { month: 'Jun', members: 156, revenue: 10920 }
  ]

  const classAttendance = [
    { class: 'HIIT Training', attendance: 85, capacity: 100 },
    { class: 'Yoga Flow', attendance: 72, capacity: 80 },
    { class: 'Strength Training', attendance: 68, capacity: 90 },
    { class: 'Cardio Blast', attendance: 45, capacity: 60 },
    { class: 'Pilates', attendance: 38, capacity: 50 }
  ]

  const revenueBreakdown = [
    { source: 'Monthly Memberships', amount: 7200, percentage: 58 },
    { source: 'Annual Memberships', amount: 2400, percentage: 19 },
    { source: 'Personal Training', amount: 1800, percentage: 14 },
    { source: 'Day Passes', amount: 750, percentage: 6 },
    { source: 'Merchandise', amount: 300, percentage: 3 }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Reports & Analytics</h2>
          <p className="text-muted-foreground">
            Comprehensive insights into your gym's performance
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 3 months</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${reportData.revenueStats.totalRevenue.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              +{reportData.revenueStats.revenueGrowth}% from last month
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.membershipStats.activeMembers}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              +{reportData.membershipStats.membershipGrowth}% growth
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Class Utilization</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.classStats.classUtilization}%</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              Above target (75%)
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Session Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.checkInStats.averageSessionDuration}min</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              +5min from last month
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Reports Tabs */}
      <Tabs defaultValue="membership" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="membership">Membership</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="classes">Classes</TabsTrigger>
          <TabsTrigger value="checkins">Check-ins</TabsTrigger>
          <TabsTrigger value="trainers">Trainers</TabsTrigger>
        </TabsList>
        
        <TabsContent value="membership" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="mr-2 h-5 w-5" />
                  Membership Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Total Members</p>
                    <p className="text-2xl font-bold">{reportData.membershipStats.totalMembers}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Active Members</p>
                    <p className="text-2xl font-bold text-green-600">{reportData.membershipStats.activeMembers}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">New This Month</p>
                    <p className="text-2xl font-bold text-blue-600">{reportData.membershipStats.newMembersThisMonth}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Retention Rate</p>
                    <p className="text-2xl font-bold text-green-600">{reportData.membershipStats.retentionRate}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5" />
                  Growth Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {membershipTrends.slice(-3).map((trend, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{trend.month}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">{trend.members} members</span>
                        <Badge variant="outline">${trend.revenue}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="revenue" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="mr-2 h-5 w-5" />
                  Revenue Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {revenueBreakdown.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{item.source}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">${item.amount}</span>
                        <Badge variant="outline">{item.percentage}%</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="mr-2 h-5 w-5" />
                  Revenue Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Monthly Recurring</p>
                    <p className="text-2xl font-bold">${reportData.revenueStats.monthlyRecurring}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Avg per Member</p>
                    <p className="text-2xl font-bold">${reportData.revenueStats.averageRevenuePerMember}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Outstanding</p>
                    <p className="text-2xl font-bold text-red-600">${reportData.revenueStats.outstandingPayments}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Growth Rate</p>
                    <p className="text-2xl font-bold text-green-600">+{reportData.revenueStats.revenueGrowth}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="classes" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="mr-2 h-5 w-5" />
                  Class Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {classAttendance.map((classItem, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{classItem.class}</span>
                        <span className="text-sm">{classItem.attendance}/{classItem.capacity}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(classItem.attendance / classItem.capacity) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChart className="mr-2 h-5 w-5" />
                  Class Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Total Classes</p>
                    <p className="text-2xl font-bold">{reportData.classStats.totalClasses}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Avg Attendance</p>
                    <p className="text-2xl font-bold">{reportData.classStats.averageAttendance}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Most Popular</p>
                    <p className="text-lg font-bold text-blue-600">{reportData.classStats.mostPopularClass}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Utilization</p>
                    <p className="text-2xl font-bold text-green-600">{reportData.classStats.classUtilization}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="checkins" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="mr-2 h-5 w-5" />
                  Check-in Analytics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Total Check-ins</p>
                    <p className="text-2xl font-bold">{reportData.checkInStats.totalCheckIns}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Daily Average</p>
                    <p className="text-2xl font-bold">{reportData.checkInStats.averageCheckInsPerDay}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Avg Session</p>
                    <p className="text-2xl font-bold">{reportData.checkInStats.averageSessionDuration}min</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Peak Hours</p>
                    <p className="text-sm font-bold text-blue-600">{reportData.checkInStats.peakHours}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="mr-2 h-5 w-5" />
                  Usage Patterns
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Weekday vs Weekend</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Weekdays</span>
                      <span className="text-sm font-bold">{reportData.checkInStats.weekdayVsWeekend.weekday}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${reportData.checkInStats.weekdayVsWeekend.weekday}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Weekends</span>
                      <span className="text-sm font-bold">{reportData.checkInStats.weekdayVsWeekend.weekend}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${reportData.checkInStats.weekdayVsWeekend.weekend}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="trainers" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="mr-2 h-5 w-5" />
                  Trainer Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Total Trainers</p>
                    <p className="text-2xl font-bold">{reportData.trainerStats.totalTrainers}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Active Trainers</p>
                    <p className="text-2xl font-bold text-green-600">{reportData.trainerStats.activeTrainers}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Avg Hourly Rate</p>
                    <p className="text-2xl font-bold">${reportData.trainerStats.averageHourlyRate}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Training Hours</p>
                    <p className="text-2xl font-bold">{reportData.trainerStats.totalTrainingHours}h</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium">Most Booked Trainer</p>
                  <p className="text-lg font-bold text-blue-600">{reportData.trainerStats.mostBookedTrainer}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Trainer Utilization</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">75% capacity</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 