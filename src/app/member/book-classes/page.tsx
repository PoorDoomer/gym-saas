'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Star,
  CreditCard,
  Search,
  Filter,
  ArrowLeft,
  BookOpen,
  User,
  CheckCircle
} from 'lucide-react'
import { PageLoader } from '@/components/ui/loading-spinner'

interface AvailableClass {
  id: string
  class_name: string
  description: string
  scheduled_date: string
  start_time: string
  end_time: string
  location: string
  capacity: number
  enrolled_members: number
  credits_required: number
  trainer_name: string
  trainer_rating?: number
  difficulty_level: 'Beginner' | 'Intermediate' | 'Advanced'
  is_enrolled: boolean
  can_book: boolean
  waitlist_available: boolean
}

interface MemberCredits {
  total_credits: number
  used_credits: number
  remaining_credits: number
  next_renewal: string
}

export default function MemberBookClassesPage() {
  const [classes, setClasses] = useState<AvailableClass[]>([])
  const [filteredClasses, setFilteredClasses] = useState<AvailableClass[]>([])
  const [credits, setCredits] = useState<MemberCredits | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDate, setSelectedDate] = useState('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState('all')
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadMemberData()
  }, [])

  useEffect(() => {
    filterClasses()
  }, [searchTerm, selectedDate, selectedDifficulty, classes])

  const loadMemberData = async () => {
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
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (memberError || !member) {
        console.error('Member not found:', memberError)
        router.push('/member-dashboard')
        return
      }

      // Get member credits
      const { data: memberCredits, error: creditsError } = await supabase
        .from('member_credits')
        .select('total_credits, used_credits, remaining_credits, next_renewal_date')
        .eq('member_id', member.id)
        .single()

      if (!creditsError && memberCredits) {
        setCredits({
          total_credits: memberCredits.total_credits || 0,
          used_credits: memberCredits.used_credits || 0,
          remaining_credits: memberCredits.remaining_credits || 0,
          next_renewal: memberCredits.next_renewal_date || ''
        })
      }

      // Get available classes (next 14 days)
      const today = new Date()
      const twoWeeksLater = new Date()
      twoWeeksLater.setDate(today.getDate() + 14)

      const todayStr = today.toISOString().split('T')[0]
      const twoWeeksStr = twoWeeksLater.toISOString().split('T')[0]

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
            name,
            description,
            credits_required,
            difficulty_level
          ),
          trainers (
            first_name,
            last_name,
            rating
          )
        `)
        .gte('scheduled_date', todayStr)
        .lte('scheduled_date', twoWeeksStr)
        .eq('status', 'active')
        .order('scheduled_date', { ascending: true })
        .order('start_time', { ascending: true })

      if (classError) {
        console.error('Error loading classes:', classError)
        return
      }

      // Get member's existing enrollments
      const { data: enrollments, error: enrollmentError } = await supabase
        .from('class_enrollments')
        .select('class_schedule_id, enrollment_status')
        .eq('member_id', member.id)
        .in('enrollment_status', ['approved', 'pending', 'waitlist'])

      const memberEnrollments = new Set(
        (enrollments || []).map(e => e.class_schedule_id)
      )

      // Process the data
      const processedClasses: AvailableClass[] = (classSchedules || []).map(schedule => {
        const classData = schedule.classes as any
        const trainerData = schedule.trainers as any
        const isEnrolled = memberEnrollments.has(schedule.id)
        const spotsAvailable = schedule.capacity - (schedule.enrolled_members || 0)
        const canBook = !isEnrolled && spotsAvailable > 0 && (credits?.remaining_credits || 0) >= (classData?.credits_required || 1)

        return {
          id: schedule.id,
          class_name: classData?.name || 'Unknown Class',
          description: classData?.description || '',
          scheduled_date: schedule.scheduled_date,
          start_time: schedule.start_time,
          end_time: schedule.end_time,
          location: schedule.location || 'TBD',
          capacity: schedule.capacity || 0,
          enrolled_members: schedule.enrolled_members || 0,
          credits_required: classData?.credits_required || 1,
          trainer_name: trainerData ? `${trainerData.first_name} ${trainerData.last_name}` : 'TBD',
          trainer_rating: trainerData?.rating || 4.5,
          difficulty_level: classData?.difficulty_level || 'Beginner',
          is_enrolled: isEnrolled,
          can_book: canBook,
          waitlist_available: !isEnrolled && spotsAvailable <= 0
        }
      })

      setClasses(processedClasses)

    } catch (error) {
      console.error('Error loading member data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterClasses = () => {
    let filtered = classes

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(cls => 
        cls.class_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cls.trainer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cls.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by date
    if (selectedDate !== 'all') {
      filtered = filtered.filter(cls => cls.scheduled_date === selectedDate)
    }

    // Filter by difficulty
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(cls => cls.difficulty_level === selectedDifficulty)
    }

    setFilteredClasses(filtered)
  }

  const handleBookClass = async (classId: string) => {
    if (!user || !credits) return

    try {
      // Get member ID
      const { data: member } = await supabase
        .from('members')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!member) return

      // Create enrollment
      const { error: enrollmentError } = await supabase
        .from('class_enrollments')
        .insert({
          class_schedule_id: classId,
          member_id: member.id,
          enrollment_status: 'approved',
          enrolled_at: new Date().toISOString()
        })

      if (enrollmentError) {
        console.error('Error booking class:', enrollmentError)
        return
      }

      // Deduct credits
      const classData = classes.find(c => c.id === classId)
      if (classData) {
        const { error: creditError } = await supabase
          .from('member_credits')
          .update({
            used_credits: credits.used_credits + classData.credits_required,
            remaining_credits: credits.remaining_credits - classData.credits_required
          })
          .eq('member_id', member.id)

        if (creditError) {
          console.error('Error updating credits:', creditError)
        }
      }

      // Refresh data
      await loadMemberData()

    } catch (error) {
      console.error('Error during booking:', error)
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

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'Beginner': return 'bg-green-100 text-green-800'
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800'
      case 'Advanced': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getNextDates = () => {
    const dates = []
    const today = new Date()
    for (let i = 0; i < 7; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() + i)
      dates.push({
        value: date.toISOString().split('T')[0],
        label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : formatDate(date.toISOString().split('T')[0])
      })
    }
    return dates
  }

  if (loading) {
    return <PageLoader />
  }

  const availableClasses = filteredClasses.filter(c => c.can_book)
  const enrolledClasses = filteredClasses.filter(c => c.is_enrolled)

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
            <h1 className="text-2xl font-bold text-gray-900">Book Classes</h1>
            <p className="text-gray-500">Browse and book available fitness classes</p>
          </div>
        </div>
      </div>

      {/* Credits & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining Credits</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{credits?.remaining_credits || 0}</div>
            <p className="text-xs text-muted-foreground">
              of {credits?.total_credits || 0} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Classes</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableClasses.length}</div>
            <p className="text-xs text-muted-foreground">You can book</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enrolled Classes</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{enrolledClasses.length}</div>
            <p className="text-xs text-muted-foreground">Already booked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Renewal</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {credits?.next_renewal ? 
                new Date(credits.next_renewal).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 
                'TBD'
              }
            </div>
            <p className="text-xs text-muted-foreground">Credits reset</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search classes, trainers, or descriptions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Select value={selectedDate} onValueChange={setSelectedDate}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select date" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Dates</SelectItem>
            {getNextDates().map(date => (
              <SelectItem key={date.value} value={date.value}>
                {date.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="Beginner">Beginner</SelectItem>
            <SelectItem value="Intermediate">Intermediate</SelectItem>
            <SelectItem value="Advanced">Advanced</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Classes Grid */}
      <div className="space-y-4">
        {filteredClasses.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No classes found</h3>
              <p className="text-gray-500 text-center">
                {searchTerm ? 'Try adjusting your search criteria.' : 'No classes available for the selected filters.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredClasses.map(classItem => (
              <Card key={classItem.id} className={`hover:shadow-md transition-shadow ${
                classItem.is_enrolled ? 'ring-2 ring-blue-500' : ''
              }`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center space-x-2">
                        <span>{classItem.class_name}</span>
                        {classItem.is_enrolled && (
                          <Badge className="bg-blue-100 text-blue-800">Enrolled</Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {classItem.description}
                      </CardDescription>
                    </div>
                    <Badge className={getDifficultyColor(classItem.difficulty_level)}>
                      {classItem.difficulty_level}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Class Info */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        {formatDate(classItem.scheduled_date)}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Clock className="h-4 w-4 mr-2" />
                        {formatTime(classItem.start_time)} - {formatTime(classItem.end_time)}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <MapPin className="h-4 w-4 mr-2" />
                        {classItem.location}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Users className="h-4 w-4 mr-2" />
                        {classItem.enrolled_members}/{classItem.capacity} spots
                      </div>
                    </div>

                    {/* Trainer Info */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {classItem.trainer_name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{classItem.trainer_name}</p>
                          <div className="flex items-center">
                            <Star className="h-3 w-3 text-yellow-400 fill-current mr-1" />
                            <span className="text-xs text-gray-500">{classItem.trainer_rating}</span>
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline">
                        {classItem.credits_required} credit{classItem.credits_required !== 1 ? 's' : ''}
                      </Badge>
                    </div>

                    {/* Action Button */}
                    <div className="pt-2">
                      {classItem.is_enrolled ? (
                        <Button className="w-full" disabled>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Already Enrolled
                        </Button>
                      ) : classItem.can_book ? (
                        <Button 
                          className="w-full"
                          onClick={() => handleBookClass(classItem.id)}
                        >
                          <BookOpen className="h-4 w-4 mr-2" />
                          Book Class ({classItem.credits_required} credit{classItem.credits_required !== 1 ? 's' : ''})
                        </Button>
                      ) : classItem.waitlist_available ? (
                        <Button className="w-full" variant="outline">
                          <Clock className="h-4 w-4 mr-2" />
                          Join Waitlist
                        </Button>
                      ) : (
                        <Button className="w-full" disabled>
                          {(credits?.remaining_credits || 0) < classItem.credits_required ? 
                            'Insufficient Credits' : 
                            'Class Full'
                          }
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