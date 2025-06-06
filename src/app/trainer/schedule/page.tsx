'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Plus
} from 'lucide-react'
import { PageLoader } from '@/components/ui/loading-spinner'

interface TrainerClass {
  id: string
  class_name: string
  description: string
  scheduled_date: string
  start_time: string
  end_time: string
  location: string
  capacity: number
  enrolled_members: number
  checked_in_count: number
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
}

export default function TrainerSchedulePage() {
  const [classes, setClasses] = useState<TrainerClass[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week')
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadTrainerSchedule()
  }, [currentDate])

  const loadTrainerSchedule = async () => {
    try {
      // Get current user and verify trainer role
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        router.push('/login')
        return
      }

      setUser(user)

      // Get trainer profile
      const { data: trainer, error: trainerError } = await supabase
        .from('trainers')
        .select('id, first_name, last_name')
        .eq('user_id', user.id)
        .single()

      if (trainerError || !trainer) {
        console.error('Trainer not found:', trainerError)
        router.push('/trainer-dashboard')
        return
      }

      // Calculate date range based on view mode
      const startDate = new Date(currentDate)
      const endDate = new Date(currentDate)

      if (viewMode === 'week') {
        // Get week view (7 days starting from Monday)
        const dayOfWeek = startDate.getDay()
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
        startDate.setDate(startDate.getDate() - daysToMonday)
        endDate.setDate(startDate.getDate() + 6)
      } else {
        // Get month view
        startDate.setDate(1)
        endDate.setMonth(endDate.getMonth() + 1)
        endDate.setDate(0)
      }

      const startDateStr = startDate.toISOString().split('T')[0]
      const endDateStr = endDate.toISOString().split('T')[0]

      // Get trainer's classes with enrollment data
      const { data: classSchedules, error: classError } = await supabase
        .from('class_schedules')
        .select(`
          id,
          scheduled_date,
          start_time,
          end_time,
          location,
          capacity,
          enrolled_members,
          status,
          classes (
            name,
            description
          )
        `)
        .eq('trainer_id', trainer.id)
        .gte('scheduled_date', startDateStr)
        .lte('scheduled_date', endDateStr)
        .order('scheduled_date', { ascending: true })
        .order('start_time', { ascending: true })

      if (classError) {
        console.error('Error loading classes:', classError)
        return
      }

      // Get check-in counts for each class
      const classIds = (classSchedules || []).map(c => c.id)
      let checkInCounts: Record<string, number> = {}

      if (classIds.length > 0) {
        const { data: checkIns, error: checkInError } = await supabase
          .from('class_qr_scans')
          .select('class_schedule_id')
          .in('class_schedule_id', classIds)

        if (!checkInError && checkIns) {
          checkInCounts = checkIns.reduce((acc, checkIn) => {
            acc[checkIn.class_schedule_id] = (acc[checkIn.class_schedule_id] || 0) + 1
            return acc
          }, {} as Record<string, number>)
        }
      }

      // Process the data
      const processedClasses: TrainerClass[] = (classSchedules || []).map(schedule => {
        const now = new Date()
        const classDate = new Date(`${schedule.scheduled_date}T${schedule.start_time}`)
        const classEndDate = new Date(`${schedule.scheduled_date}T${schedule.end_time}`)
        
        let status: TrainerClass['status'] = 'upcoming'
        if (now > classEndDate) {
          status = 'completed'
        } else if (now >= classDate && now <= classEndDate) {
          status = 'ongoing'
        }

        return {
          id: schedule.id,
          class_name: (schedule.classes as any)?.name || 'Unknown Class',
          description: (schedule.classes as any)?.description || '',
          scheduled_date: schedule.scheduled_date,
          start_time: schedule.start_time,
          end_time: schedule.end_time,
          location: schedule.location || 'TBD',
          capacity: schedule.capacity || 0,
          enrolled_members: schedule.enrolled_members || 0,
          checked_in_count: checkInCounts[schedule.id] || 0,
          status: schedule.status === 'cancelled' ? 'cancelled' : status
        }
      })

      setClasses(processedClasses)

    } catch (error) {
      console.error('Error loading trainer schedule:', error)
    } finally {
      setLoading(false)
    }
  }

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7))
    } else {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1))
    }
    setCurrentDate(newDate)
  }

  const getStatusBadge = (status: TrainerClass['status']) => {
    switch (status) {
      case 'ongoing':
        return <Badge className="bg-green-100 text-green-800">Live Now</Badge>
      case 'upcoming':
        return <Badge className="bg-blue-100 text-blue-800">Upcoming</Badge>
      case 'completed':
        return <Badge className="bg-gray-100 text-gray-800">Completed</Badge>
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric' 
    })
  }

  const isToday = (dateString: string) => {
    const today = new Date().toISOString().split('T')[0]
    return dateString === today
  }

  const getCurrentDateRange = () => {
    if (viewMode === 'week') {
      const startOfWeek = new Date(currentDate)
      const dayOfWeek = startOfWeek.getDay()
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
      startOfWeek.setDate(startOfWeek.getDate() - daysToMonday)
      
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(endOfWeek.getDate() + 6)
      
      return `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    } else {
      return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    }
  }

  if (loading) {
    return <PageLoader />
  }

  const todayClasses = classes.filter(cls => isToday(cls.scheduled_date))
  const upcomingClasses = classes.filter(cls => cls.status === 'upcoming' && !isToday(cls.scheduled_date))
  const ongoingClasses = classes.filter(cls => cls.status === 'ongoing')

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => router.push('/trainer-dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Schedule</h1>
            <p className="text-gray-500">Manage your class schedule and attendance</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Classes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayClasses.length}</div>
            <p className="text-xs text-muted-foreground">Scheduled for today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ongoing Classes</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ongoingClasses.length}</div>
            <p className="text-xs text-muted-foreground">Live right now</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Classes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingClasses.length}</div>
            <p className="text-xs text-muted-foreground">This period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Enrolled</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {classes.reduce((sum, cls) => sum + cls.enrolled_members, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Across all classes</p>
          </CardContent>
        </Card>
      </div>

      {/* Schedule Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => navigateDate('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold">{getCurrentDateRange()}</h2>
          <Button variant="outline" onClick={() => navigateDate('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('week')}
          >
            Week
          </Button>
          <Button
            variant={viewMode === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('month')}
          >
            Month
          </Button>
        </div>
      </div>

      {/* Classes List */}
      <div className="space-y-4">
        {classes.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No classes scheduled</h3>
              <p className="text-gray-500 text-center">
                You don't have any classes scheduled for this {viewMode}.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {classes.map(classItem => (
              <Card key={classItem.id} className={`hover:shadow-md transition-shadow ${
                classItem.status === 'ongoing' ? 'ring-2 ring-green-500' : ''
              }`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center space-x-2">
                        <span>{classItem.class_name}</span>
                        {getStatusBadge(classItem.status)}
                        {isToday(classItem.scheduled_date) && (
                          <Badge variant="outline">Today</Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {classItem.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Class Details */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        {formatDate(classItem.scheduled_date)}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Clock className="h-4 w-4 mr-2" />
                        {classItem.start_time} - {classItem.end_time}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <MapPin className="h-4 w-4 mr-2" />
                        {classItem.location}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Users className="h-4 w-4 mr-2" />
                        {classItem.enrolled_members}/{classItem.capacity}
                      </div>
                    </div>

                    {/* Attendance Progress */}
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Attendance</span>
                        <span>{classItem.checked_in_count}/{classItem.enrolled_members}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full transition-all"
                          style={{ 
                            width: classItem.enrolled_members > 0 
                              ? `${(classItem.checked_in_count / classItem.enrolled_members) * 100}%` 
                              : '0%' 
                          }}
                        ></div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2 pt-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => router.push(`/trainer/class-members?class=${classItem.id}`)}
                      >
                        <Users className="h-4 w-4 mr-1" />
                        View Members
                      </Button>
                      {(classItem.status === 'ongoing' || isToday(classItem.scheduled_date)) && (
                        <Button 
                          size="sm"
                          onClick={() => router.push(`/trainer/checkins?class=${classItem.id}`)}
                        >
                          <UserCheck className="h-4 w-4 mr-1" />
                          Check-in
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 