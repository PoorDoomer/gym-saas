import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export interface CheckIn {
  id: string
  member_id: string
  check_in_time: string
  check_out_time?: string
  check_in_method: 'manual' | 'qr_code' | 'card'
  notes?: string
  created_at: string
  member?: {
    id: string
    first_name: string
    last_name: string
    email: string
  }
}

export interface CheckInStats {
  currentOccupancy: number
  todayCheckIns: number
  peakHours: string
  avgSessionDuration: string
  growthFromYesterday: number
}

// Get recent check-ins with member information
export async function getRecentCheckIns(limit: number = 10): Promise<CheckIn[]> {
  try {
    const { data, error } = await supabase
      .from('check_ins')
      .select(`
        *,
        member:members(
          id,
          first_name,
          last_name,
          email
        )
      `)
      .order('check_in_time', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching check-ins:', error)
      throw new Error('Failed to fetch check-ins')
    }

    return data || []
  } catch (error) {
    console.error('Failed to fetch recent check-ins:', error)
    return []
  }
}

// Get check-in statistics
export async function getCheckInStats(): Promise<CheckInStats> {
  try {
    // Get current occupancy (members checked in but not checked out)
    const { count: currentOccupancy } = await supabase
      .from('check_ins')
      .select('id', { count: 'exact', head: true })
      .is('check_out_time', null)

    // Get today's check-ins
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const { count: todayCheckIns } = await supabase
      .from('check_ins')
      .select('id', { count: 'exact', head: true })
      .gte('check_in_time', today.toISOString())

    // Get yesterday's check-ins for growth calculation
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const { count: yesterdayCheckIns } = await supabase
      .from('check_ins')
      .select('id', { count: 'exact', head: true })
      .gte('check_in_time', yesterday.toISOString())
      .lt('check_in_time', today.toISOString())

    // Calculate growth percentage
    const growthFromYesterday = (yesterdayCheckIns || 0) > 0 
      ? (((todayCheckIns || 0) - (yesterdayCheckIns || 0)) / (yesterdayCheckIns || 0)) * 100 
      : 0

    return {
      currentOccupancy: currentOccupancy || 0,
      todayCheckIns: todayCheckIns || 0,
      peakHours: '6-8 PM', // This would need more complex analysis
      avgSessionDuration: '1.5h', // This would need duration calculation
      growthFromYesterday: Math.round(growthFromYesterday)
    }
  } catch (error) {
    console.error('Failed to fetch check-in stats:', error)
    return {
      currentOccupancy: 0,
      todayCheckIns: 0,
      peakHours: '6-8 PM',
      avgSessionDuration: '1.5h',
      growthFromYesterday: 0
    }
  }
}

// Create a new check-in
export async function createCheckIn(memberId: string, method: 'manual' | 'qr_code' | 'card' = 'manual'): Promise<CheckIn | null> {
  try {
    const { data, error } = await supabase
      .from('check_ins')
      .insert([{
        member_id: memberId,
        check_in_time: new Date().toISOString(),
        check_in_method: method
      }])
      .select(`
        *,
        member:members(
          id,
          first_name,
          last_name,
          email
        )
      `)
      .single()

    if (error) {
      console.error('Error creating check-in:', error)
      throw new Error('Failed to create check-in')
    }

    return data
  } catch (error) {
    console.error('Failed to create check-in:', error)
    return null
  }
}

// Check out a member
export async function checkOutMember(checkInId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('check_ins')
      .update({
        check_out_time: new Date().toISOString()
      })
      .eq('id', checkInId)
      .is('check_out_time', null)

    if (error) {
      console.error('Error checking out member:', error)
      throw new Error('Failed to check out member')
    }

    return true
  } catch (error) {
    console.error('Failed to check out member:', error)
    return false
  }
}

// Search members for check-in
export async function searchMembersForCheckIn(searchTerm: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('members')
      .select('id, first_name, last_name, email')
      .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
      .eq('is_active', true)
      .limit(10)

    if (error) {
      console.error('Error searching members:', error)
      throw new Error('Failed to search members')
    }

    return data || []
  } catch (error) {
    console.error('Failed to search members:', error)
    return []
  }
} 