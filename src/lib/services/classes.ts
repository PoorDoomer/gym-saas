import { createClient } from '@/lib/supabase/client'
import { Class, ClassSchedule } from '@/lib/types' // Assuming you have Class and ClassSchedule types defined

const supabase = createClient()

export interface CreateClassData {
  name: string
  description?: string
  trainer_id?: string
  capacity: number
  duration_minutes: number
  location?: string
}

export interface UpdateClassData extends Partial<CreateClassData> {}

export interface CreateClassScheduleData {
  class_id: string
  scheduled_time: string // ISO string
  date: string // YYYY-MM-DD
  trainer_id?: string
  location?: string
}

export interface UpdateClassScheduleData extends Partial<CreateClassScheduleData> {}

// Get all classes
export async function getClasses(): Promise<Class[]> {
  const { data, error } = await supabase
    .from('classes')
    .select('*, trainer:trainers(first_name, last_name)')
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching classes:', error)
    throw new Error('Failed to fetch classes')
  }

  return data || []
}

// Get class by ID
export async function getClassById(id: string): Promise<Class | null> {
  try {
    const { data, error } = await supabase
      .from('classes')
      .select('*, trainer:trainers(first_name, last_name)')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching class:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Failed to fetch class:', error)
    return null
  }
}

// Create new class
export async function createClass(classData: CreateClassData): Promise<Class | null> {
  try {
    const { data, error } = await supabase
      .from('classes')
      .insert([classData])
      .select()
      .single()

    if (error) {
      console.error('Error creating class:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Failed to create class:', error)
    return null
  }
}

// Update class
export async function updateClass(id: string, classData: UpdateClassData): Promise<Class | null> {
  try {
    const { data, error } = await supabase
      .from('classes')
      .update(classData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating class:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Failed to update class:', error)
    return null
  }
}

// Delete class
export async function deleteClass(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('classes')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting class:', error)
      throw error
    }

    return true
  } catch (error) {
    console.error('Failed to delete class:', error)
    return false
  }
}

// Get today's class schedules
export async function getTodaysClassSchedules(): Promise<ClassSchedule[]> {
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
  const { data, error } = await supabase
    .from('class_schedules')
    .select('*, class:classes(*, trainer:trainers(first_name, last_name)), trainer:trainers(first_name, last_name)')
    .eq('date', today)
    .order('scheduled_time', { ascending: true })

  if (error) {
    console.error('Error fetching today\'s class schedules:', error)
    throw new Error('Failed to fetch today\'s class schedules')
  }

  return data || []
}

// Get upcoming class schedules (e.g., tomorrow's)
export async function getUpcomingClassSchedules(): Promise<ClassSchedule[]> {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowISO = tomorrow.toISOString().split('T')[0] // YYYY-MM-DD

  const { data, error } = await supabase
    .from('class_schedules')
    .select('*, class:classes(*, trainer:trainers(first_name, last_name)), trainer:trainers(first_name, last_name)')
    .eq('date', tomorrowISO)
    .order('scheduled_time', { ascending: true })

  if (error) {
    console.error('Error fetching upcoming class schedules:', error)
    throw new Error('Failed to fetch upcoming class schedules')
  }

  return data || []
}

// Get class schedule by ID
export async function getClassScheduleById(id: string): Promise<ClassSchedule | null> {
  try {
    const { data, error } = await supabase
      .from('class_schedules')
      .select('*, class:classes(*), trainer:trainers(*)')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching class schedule:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Failed to fetch class schedule:', error)
    return null
  }
}

// Create new class schedule
export async function createClassSchedule(scheduleData: CreateClassScheduleData): Promise<ClassSchedule | null> {
  try {
    const { data, error } = await supabase
      .from('class_schedules')
      .insert([scheduleData])
      .select()
      .single()

    if (error) {
      console.error('Error creating class schedule:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Failed to create class schedule:', error)
    return null
  }
}

// Update class schedule
export async function updateClassSchedule(id: string, scheduleData: UpdateClassScheduleData): Promise<ClassSchedule | null> {
  try {
    const { data, error } = await supabase
      .from('class_schedules')
      .update(scheduleData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating class schedule:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Failed to update class schedule:', error)
    return null
  }
}

// Delete class schedule
export async function deleteClassSchedule(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('class_schedules')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting class schedule:', error)
      throw error
    }

    return true
  } catch (error) {
    console.error('Failed to delete class schedule:', error)
    return false
  }
}

export async function getClassStats() {
  try {
    // Total classes
    const { count: totalClasses, error: totalClassesError } = await supabase
      .from('classes')
      .select('*', { count: 'exact', head: true })
    if (totalClassesError) throw totalClassesError

    // Total bookings (sum of enrolled from class_schedules for today)
    const today = new Date().toISOString().split('T')[0]
    const { data: todaysSchedules, error: todaysSchedulesError } = await supabase
      .from('class_schedules')
      .select('enrolled_members') // Assuming 'enrolled_members' is a column in class_schedules
      .eq('date', today)
    if (todaysSchedulesError) throw todaysSchedulesError

    const totalBookingsToday = todaysSchedules?.reduce((sum, schedule) => sum + (schedule.enrolled_members || 0), 0) || 0

    // Classes currently in progress (this would require more complex logic involving current time and class duration)
    // For simplicity, let's just mock a value or omit for now
    const classesInProgress = 3; // Placeholder

    // Capacity utilization (this would require summing capacity and enrolled across all schedules)
    // For simplicity, let's just mock a value or calculate based on aggregated data
    const capacityUtilization = 78; // Placeholder

    return {
      totalClasses: totalClasses || 0,
      classesToday: todaysSchedules?.length || 0,
      totalBookings: totalBookingsToday,
      classesInProgress: classesInProgress,
      capacityUtilization: capacityUtilization,
      activeTrainers: 8 // Placeholder
    }
  } catch (error) {
    console.error('Error fetching class statistics:', error)
    return {
      totalClasses: 0,
      classesToday: 0,
      totalBookings: 0,
      classesInProgress: 0,
      capacityUtilization: 0,
      activeTrainers: 0
    }
  }
} 