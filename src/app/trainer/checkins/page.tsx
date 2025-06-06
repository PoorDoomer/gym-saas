'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Users, 
  Search, 
  CheckCircle, 
  XCircle, 
  Clock, 
  MapPin,
  Calendar,
  ArrowLeft,
  QrCode,
  UserCheck,
  User,
  Scan
} from 'lucide-react'
import { PageLoader } from '@/components/ui/loading-spinner'

interface ClassMember {
  id: string
  member_id: string
  member_name: string
  member_email: string
  enrollment_status: 'approved' | 'checked_in' | 'no_show'
  enrolled_at: string
  check_in_time?: string
}

interface TrainerClass {
  id: string
  class_name: string
  scheduled_date: string
  start_time: string
  end_time: string
  location: string
  capacity: number
  enrolled_members: ClassMember[]
  checked_in_count: number
  status: 'upcoming' | 'ongoing' | 'completed'
}

export default function TrainerCheckInsPage() {
  const [classes, setClasses] = useState<TrainerClass[]>([])
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showQRScanner, setShowQRScanner] = useState(false)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  // Get class parameter from URL if provided
  const urlClassId = searchParams.get('class')

  useEffect(() => {
    loadTrainerClasses()
  }, [])

  useEffect(() => {
    if (urlClassId && classes.length > 0) {
      setSelectedClass(urlClassId)
    }
  }, [urlClassId, classes])

  const loadTrainerClasses = async () => {
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

      // Get trainer's classes for today and tomorrow
      const today = new Date().toISOString().split('T')[0]
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const tomorrowStr = tomorrow.toISOString().split('T')[0]

      const { data: classSchedules, error: classError } = await supabase
        .from('class_schedules')
        .select(`
          id,
          scheduled_date,
          start_time,
          end_time,
          location,
          capacity,
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
              email
            )
          )
        `)
        .eq('trainer_id', trainer.id)
        .gte('scheduled_date', today)
        .lte('scheduled_date', tomorrowStr)
        .order('scheduled_date', { ascending: true })
        .order('start_time', { ascending: true })

      if (classError) {
        console.error('Error loading classes:', classError)
        return
      }

      // Get existing check-ins
      const classIds = (classSchedules || []).map(c => c.id)
      let existingCheckIns: Record<string, any[]> = {}

      if (classIds.length > 0) {
        const { data: checkIns, error: checkInError } = await supabase
          .from('class_qr_scans')
          .select('class_schedule_id, member_id, scanned_at')
          .in('class_schedule_id', classIds)

        if (!checkInError && checkIns) {
          existingCheckIns = checkIns.reduce((acc, checkIn) => {
            if (!acc[checkIn.class_schedule_id]) {
              acc[checkIn.class_schedule_id] = []
            }
            acc[checkIn.class_schedule_id].push(checkIn)
            return acc
          }, {} as Record<string, any[]>)
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

        const classCheckIns = existingCheckIns[schedule.id] || []
        
        const classMembers: ClassMember[] = (schedule.class_enrollments || [])
          .filter(enrollment => enrollment.enrollment_status === 'approved')
          .map(enrollment => {
            const member = enrollment.members as any
            const memberCheckIn = classCheckIns.find(ci => ci.member_id === enrollment.member_id)
            
            return {
              id: enrollment.id,
              member_id: enrollment.member_id,
              member_name: member ? `${member.first_name} ${member.last_name}` : 'Unknown Member',
              member_email: member?.email || '',
              enrollment_status: memberCheckIn ? 'checked_in' : 'approved',
              enrolled_at: enrollment.enrolled_at,
              check_in_time: memberCheckIn?.scanned_at || undefined
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
          enrolled_members: classMembers,
          checked_in_count: classMembers.filter(m => m.enrollment_status === 'checked_in').length,
          status
        }
      })

      setClasses(processedClasses)

      // Auto-select first ongoing or upcoming class
      if (!urlClassId && processedClasses.length > 0) {
        const ongoingClass = processedClasses.find(c => c.status === 'ongoing')
        const upcomingClass = processedClasses.find(c => c.status === 'upcoming')
        setSelectedClass((ongoingClass || upcomingClass || processedClasses[0]).id)
      }

    } catch (error) {
      console.error('Error loading trainer classes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleManualCheckIn = async (memberId: string) => {
    if (!selectedClass) return

    try {
      // Record the check-in
      const { error } = await supabase
        .from('class_qr_scans')
        .insert({
          class_schedule_id: selectedClass,
          member_id: memberId,
          scanned_at: new Date().toISOString(),
          location: 'Manual Check-in by Trainer',
          verified_by_trainer_id: user?.id
        })

      if (error) {
        console.error('Error recording check-in:', error)
        return
      }

      // Refresh the data
      await loadTrainerClasses()

    } catch (error) {
      console.error('Error during manual check-in:', error)
    }
  }

  const handleUndoCheckIn = async (memberId: string) => {
    if (!selectedClass) return

    try {
      // Remove the check-in record
      const { error } = await supabase
        .from('class_qr_scans')
        .delete()
        .eq('class_schedule_id', selectedClass)
        .eq('member_id', memberId)

      if (error) {
        console.error('Error removing check-in:', error)
        return
      }

      // Refresh the data
      await loadTrainerClasses()

    } catch (error) {
      console.error('Error during undo check-in:', error)
    }
  }

  const selectedClassData = classes.find(c => c.id === selectedClass)
  const filteredMembers = selectedClassData?.enrolled_members.filter(member =>
    member.member_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.member_email.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  const getStatusBadge = (status: ClassMember['enrollment_status']) => {
    switch (status) {
      case 'checked_in':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Checked In</Badge>
      case 'approved':
        return <Badge className="bg-blue-100 text-blue-800"><User className="h-3 w-3 mr-1" />Enrolled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
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

  if (loading) {
    return <PageLoader />
  }

  const totalMembers = selectedClassData?.enrolled_members.length || 0
  const checkedInCount = selectedClassData?.checked_in_count || 0
  const attendanceRate = totalMembers > 0 ? Math.round((checkedInCount / totalMembers) * 100) : 0

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
            <h1 className="text-2xl font-bold text-gray-900">Class Check-ins</h1>
            <p className="text-gray-500">Manage attendance for your classes</p>
          </div>
        </div>
        <Button 
          onClick={() => setShowQRScanner(!showQRScanner)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <QrCode className="h-4 w-4 mr-2" />
          {showQRScanner ? 'Close' : 'Open'} QR Scanner
        </Button>
      </div>

      {/* Class Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Class</CardTitle>
          <CardDescription>Choose a class to manage check-ins</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a class..." />
            </SelectTrigger>
            <SelectContent>
              {classes.map(cls => (
                <SelectItem key={cls.id} value={cls.id}>
                  <div className="flex items-center space-x-2">
                    <span>{cls.class_name}</span>
                    <Badge variant={cls.status === 'ongoing' ? 'default' : 'outline'}>
                      {cls.status}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {formatDate(cls.scheduled_date)} • {formatTime(cls.start_time)}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedClassData && (
        <>
          {/* Class Info & Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Enrolled</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalMembers}</div>
                <p className="text-xs text-muted-foreground">Members in class</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Checked In</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{checkedInCount}</div>
                <p className="text-xs text-muted-foreground">Present today</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{attendanceRate}%</div>
                <p className="text-xs text-muted-foreground">Of enrolled members</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Class Status</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold capitalize">{selectedClassData.status}</div>
                <p className="text-xs text-muted-foreground">
                  {selectedClassData.location}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* QR Scanner */}
          {showQRScanner && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Scan className="h-5 w-5 mr-2" />
                  QR Code Scanner
                </CardTitle>
                <CardDescription>
                  Members can scan their QR codes here for quick check-in
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-8 bg-gray-50 rounded-lg">
                  <QrCode className="h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">QR Scanner Ready</h3>
                  <p className="text-gray-500 text-center mb-4">
                    Point camera at member's QR code to check them in automatically
                  </p>
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Scan className="h-4 w-4 mr-2" />
                    Start Camera Scanner
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Member Roster */}
          <Card>
            <CardHeader>
              <CardTitle>Member Roster</CardTitle>
              <CardDescription>
                Manage check-ins for {selectedClassData.class_name}
              </CardDescription>
              <div className="flex items-center space-x-4 pt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search members..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Badge variant="outline">
                  {filteredMembers.length} members
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {filteredMembers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No members found</h3>
                  <p className="text-gray-500">
                    {searchTerm ? 'Try adjusting your search.' : 'No members enrolled in this class.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredMembers.map(member => (
                    <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {member.member_name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-medium">{member.member_name}</h4>
                          <p className="text-sm text-gray-500">{member.member_email}</p>
                          {member.check_in_time && (
                            <p className="text-xs text-green-600">
                              Checked in at {new Date(member.check_in_time).toLocaleTimeString()}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        {getStatusBadge(member.enrollment_status)}
                        
                        {member.enrollment_status === 'approved' ? (
                          <Button 
                            size="sm"
                            onClick={() => handleManualCheckIn(member.member_id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Check In
                          </Button>
                        ) : (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleUndoCheckIn(member.member_id)}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Undo
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
} 