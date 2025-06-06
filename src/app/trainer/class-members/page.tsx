'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Users, 
  Search, 
  CheckCircle, 
  XCircle, 
  Clock, 
  MapPin,
  Calendar,
  Phone,
  Mail,
  ArrowLeft,
  UserCheck
} from 'lucide-react'
import { PageLoader } from '@/components/ui/loading-spinner'

interface ClassMember {
  id: string
  member_id: string
  member_name: string
  member_email: string
  member_phone?: string
  enrollment_status: 'approved' | 'pending' | 'waitlist' | 'checked_in' | 'no_show'
  enrolled_at: string
  check_in_time?: string
  membership_plan?: string
}

interface TrainerClass {
  id: string
  class_name: string
  scheduled_date: string
  start_time: string
  end_time: string
  location: string
  capacity: number
  enrolled_count: number
  members: ClassMember[]
}

export default function TrainerClassMembersPage() {
  const [classes, setClasses] = useState<TrainerClass[]>([])
  const [filteredClasses, setFilteredClasses] = useState<TrainerClass[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClass, setSelectedClass] = useState<string>('all')
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadTrainerClassMembers()
  }, [])

  useEffect(() => {
    filterClasses()
  }, [searchTerm, selectedClass, classes])

  const loadTrainerClassMembers = async () => {
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
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (trainerError || !trainer) {
        console.error('Trainer not found:', trainerError)
        router.push('/trainer-dashboard')
        return
      }

      // Get trainer's classes with enrolled members (last 30 days and upcoming)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0]

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
          classes (
            name
          ),
          class_enrollments (
            id,
            member_id,
            enrollment_status,
            enrolled_at,
            members (
              id,
              first_name,
              last_name,
              email,
              phone,
              membership_plan
            )
          )
        `)
        .eq('trainer_id', trainer.id)
        .gte('scheduled_date', thirtyDaysAgoStr)
        .order('scheduled_date', { ascending: false })
        .order('start_time', { ascending: false })

      if (classError) {
        console.error('Error loading classes:', classError)
        return
      }

      // Process the data
      const processedClasses: TrainerClass[] = (classSchedules || []).map(schedule => {
        const classMembers: ClassMember[] = (schedule.class_enrollments || []).map(enrollment => {
          const member = enrollment.members as any
          return {
            id: enrollment.id,
            member_id: enrollment.member_id,
            member_name: member ? `${member.first_name} ${member.last_name}` : 'Unknown Member',
            member_email: member?.email || '',
            member_phone: member?.phone || '',
            enrollment_status: enrollment.enrollment_status,
            enrolled_at: enrollment.enrolled_at,
            membership_plan: member?.membership_plan || 'Standard'
          }
        })

        return {
          id: schedule.id,
          class_name: (schedule.classes as any)?.name || 'Unknown Class',
          scheduled_date: schedule.scheduled_date,
          start_time: schedule.start_time,
          end_time: schedule.end_time,
          location: schedule.location || 'TBD',
          capacity: schedule.capacity || 0,
          enrolled_count: schedule.enrolled_members || 0,
          members: classMembers
        }
      })

      setClasses(processedClasses)

    } catch (error) {
      console.error('Error loading trainer class members:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterClasses = () => {
    let filtered = classes

    // Filter by selected class
    if (selectedClass !== 'all') {
      filtered = filtered.filter(cls => cls.id === selectedClass)
    }

    // Filter by search term (search in member names and emails)
    if (searchTerm) {
      filtered = filtered.map(cls => ({
        ...cls,
        members: cls.members.filter(member => 
          member.member_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.member_email.toLowerCase().includes(searchTerm.toLowerCase())
        )
      })).filter(cls => cls.members.length > 0)
    }

    setFilteredClasses(filtered)
  }

  const getStatusBadge = (status: ClassMember['enrollment_status']) => {
    switch (status) {
      case 'checked_in':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Checked In</Badge>
      case 'approved':
        return <Badge className="bg-blue-100 text-blue-800"><UserCheck className="h-3 w-3 mr-1" />Enrolled</Badge>
      case 'no_show':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />No Show</Badge>
      case 'waitlist':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Waitlist</Badge>
      case 'pending':
        return <Badge className="bg-gray-100 text-gray-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'short', 
      day: 'numeric' 
    })
  }

  const isToday = (dateString: string) => {
    const today = new Date().toISOString().split('T')[0]
    return dateString === today
  }

  const isUpcoming = (dateString: string) => {
    const today = new Date().toISOString().split('T')[0]
    return dateString > today
  }

  if (loading) {
    return <PageLoader />
  }

  const totalMembers = classes.reduce((sum, cls) => sum + cls.members.length, 0)
  const checkedInMembers = classes.reduce((sum, cls) => 
    sum + cls.members.filter(m => m.enrollment_status === 'checked_in').length, 0
  )
  const todayClasses = classes.filter(cls => isToday(cls.scheduled_date))
  const upcomingClasses = classes.filter(cls => isUpcoming(cls.scheduled_date))

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
            <h1 className="text-2xl font-bold text-gray-900">My Class Members</h1>
            <p className="text-gray-500">Manage members enrolled in your classes</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMembers}</div>
            <p className="text-xs text-muted-foreground">Across all classes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Checked In Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{checkedInMembers}</div>
            <p className="text-xs text-muted-foreground">Today's attendance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Classes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayClasses.length}</div>
            <p className="text-xs text-muted-foreground">Classes scheduled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Classes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingClasses.length}</div>
            <p className="text-xs text-muted-foreground">Future classes</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search members by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md bg-white"
        >
          <option value="all">All Classes</option>
          {classes.map(cls => (
            <option key={cls.id} value={cls.id}>
              {cls.class_name} - {formatDate(cls.scheduled_date)}
            </option>
          ))}
        </select>
      </div>

      {/* Class Members List */}
      <div className="space-y-6">
        {filteredClasses.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Users className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No members found</h3>
              <p className="text-gray-500 text-center">
                {searchTerm ? 'Try adjusting your search criteria.' : 'You don\'t have any classes with enrolled members yet.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredClasses.map(classItem => (
            <Card key={classItem.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <span>{classItem.class_name}</span>
                      {isToday(classItem.scheduled_date) && (
                        <Badge className="bg-blue-100 text-blue-800">Today</Badge>
                      )}
                      {isUpcoming(classItem.scheduled_date) && (
                        <Badge variant="outline">Upcoming</Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="flex items-center space-x-4 mt-1">
                      <span className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(classItem.scheduled_date)}
                      </span>
                      <span className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {classItem.start_time} - {classItem.end_time}
                      </span>
                      <span className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {classItem.location}
                      </span>
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {classItem.enrolled_count}/{classItem.capacity} enrolled
                    </div>
                    <div className="text-xs text-gray-500">
                      {classItem.members.filter(m => m.enrollment_status === 'checked_in').length} checked in
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {classItem.members.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No members enrolled in this class</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {classItem.members.map(member => (
                      <div key={member.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback>
                                {member.member_name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-medium">{member.member_name}</h4>
                              <p className="text-sm text-gray-500">{member.membership_plan}</p>
                            </div>
                          </div>
                          {getStatusBadge(member.enrollment_status)}
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center text-gray-600">
                            <Mail className="h-3 w-3 mr-2" />
                            {member.member_email}
                          </div>
                          {member.member_phone && (
                            <div className="flex items-center text-gray-600">
                              <Phone className="h-3 w-3 mr-2" />
                              {member.member_phone}
                            </div>
                          )}
                          <div className="flex items-center text-gray-600">
                            <Clock className="h-3 w-3 mr-2" />
                            Enrolled: {new Date(member.enrolled_at).toLocaleDateString()}
                          </div>
                          {member.check_in_time && (
                            <div className="flex items-center text-green-600">
                              <CheckCircle className="h-3 w-3 mr-2" />
                              Checked in: {new Date(member.check_in_time).toLocaleTimeString()}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
} 