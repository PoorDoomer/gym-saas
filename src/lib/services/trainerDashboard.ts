import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export interface TrainerStats {
  classesThisWeek: number
  totalMembers: number
  averageAttendance: number
  rating: number
}

export interface TodayClass {
  id: string
  name: string
  start_time: string
  end_time: string
  capacity: number
  bookings: number
  location: string
}

export interface UpcomingClass {
  id: string
  name: string
  date: string
  start_time: string
  end_time: string
  capacity: number
  bookings: number
}

export interface RecentCheckIn {
  id: string
  member_name: string
  class_name: string
  check_in_time: string
}

export interface TrainerDashboardData {
  trainer: {
    id: string
    first_name: string
    last_name: string
    email: string
    specializations: string[]
    hourly_rate: number
    bio: string
  }
  todayClasses: TodayClass[]
  upcomingClasses: UpcomingClass[]
  stats: TrainerStats
  recentCheckIns: RecentCheckIn[]
}

export async function getTrainerDashboardData(userId: string): Promise<TrainerDashboardData | null> {
  try {
    // Get trainer profile
    const { data: trainerData, error: trainerError } = await supabase
      .from('trainers')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (trainerError || !trainerData) {
      console.error('Error fetching trainer data:', trainerError)
      return null
    }

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0]

    // Get today's classes for this trainer
    const { data: todayClassesData, error: todayClassesError } = await supabase
      .from('class_schedules')
      .select(`
        id,
        scheduled_date,
        start_time,
        end_time,
        capacity,
        enrolled_members,
        location,
        classes (
          name,
          description
        )
      `)
      .eq('trainer_id', trainerData.id)
      .eq('scheduled_date', today)
      .order('start_time', { ascending: true })

    // Get upcoming classes (next 7 days)
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)
    const nextWeekStr = nextWeek.toISOString().split('T')[0]

    const { data: upcomingClassesData, error: upcomingClassesError } = await supabase
      .from('class_schedules')
      .select(`
        id,
        scheduled_date,
        start_time,
        end_time,
        capacity,
        enrolled_members,
        classes (
          name,
          description
        )
      `)
      .eq('trainer_id', trainerData.id)
      .gt('scheduled_date', today)
      .lte('scheduled_date', nextWeekStr)
      .order('scheduled_date', { ascending: true })
      .order('start_time', { ascending: true })
      .limit(5)

    // Get trainer stats for this week
    const startOfWeek = new Date()
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
    const startOfWeekStr = startOfWeek.toISOString().split('T')[0]

    const { data: weeklyClassesData, error: weeklyClassesError } = await supabase
      .from('class_schedules')
      .select('id, enrolled_members, capacity')
      .eq('trainer_id', trainerData.id)
      .gte('scheduled_date', startOfWeekStr)
      .lte('scheduled_date', today)

    // Get recent check-ins (last 10)
    const { data: recentCheckInsData, error: checkInsError } = await supabase
      .from('class_qr_scans')
      .select(`
        id,
        scanned_at,
        members (
          first_name,
          last_name
        ),
        classes (
          name
        )
      `)
      .eq('verified_by_trainer_id', trainerData.id)
      .order('scanned_at', { ascending: false })
      .limit(10)

    // Process the data
    const todayClasses: TodayClass[] = (todayClassesData || []).map(cls => ({
      id: cls.id,
      name: (cls.classes as any)?.name || 'Unknown Class',
      start_time: cls.start_time || '00:00',
      end_time: cls.end_time || '01:00',
      capacity: cls.capacity || 0,
      bookings: cls.enrolled_members || 0,
      location: cls.location || 'TBD'
    }))

    const upcomingClasses: UpcomingClass[] = (upcomingClassesData || []).map(cls => {
      const date = new Date(cls.scheduled_date)
      const dateStr = date.toLocaleDateString('en-US', { 
        weekday: 'long',
        month: 'short', 
        day: 'numeric' 
      })
      
      return {
        id: cls.id,
        name: (cls.classes as any)?.name || 'Unknown Class',
        date: dateStr,
        start_time: cls.start_time || '00:00',
        end_time: cls.end_time || '01:00',
        capacity: cls.capacity || 0,
        bookings: cls.enrolled_members || 0
      }
    })

    // Calculate stats
    const classesThisWeek = weeklyClassesData?.length || 0
    const totalBookings = weeklyClassesData?.reduce((sum, cls) => sum + (cls.enrolled_members || 0), 0) || 0
    const totalCapacity = weeklyClassesData?.reduce((sum, cls) => sum + (cls.capacity || 0), 0) || 1
    const averageAttendance = totalCapacity > 0 ? Math.round((totalBookings / totalCapacity) * 100) : 0

    const stats: TrainerStats = {
      classesThisWeek,
      totalMembers: totalBookings, // Total bookings this week
      averageAttendance,
      rating: 4.8 // TODO: Implement actual rating system
    }

    const recentCheckIns: RecentCheckIn[] = (recentCheckInsData || []).map(scan => ({
      id: scan.id,
      member_name: (scan.members as any) ? 
        `${(scan.members as any).first_name} ${(scan.members as any).last_name}` : 
        'Unknown Member',
      class_name: (scan.classes as any)?.name || 'Unknown Class',
      check_in_time: new Date(scan.scanned_at).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    }))

    return {
      trainer: {
        id: trainerData.id,
        first_name: trainerData.first_name,
        last_name: trainerData.last_name,
        email: trainerData.email,
        specializations: trainerData.specializations || [],
        hourly_rate: trainerData.hourly_rate || 0,
        bio: trainerData.bio || ''
      },
      todayClasses,
      upcomingClasses,
      stats,
      recentCheckIns
    }

  } catch (error) {
    console.error('Error fetching trainer dashboard data:', error)
    return null
  }
} 