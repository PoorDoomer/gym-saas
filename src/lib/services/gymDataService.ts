import { createClient } from '@/lib/supabase/client'
import { getCurrentGymId } from '@/lib/contexts/GymContext'

const supabase = createClient()

// Base service class that enforces gym isolation
export class GymDataService {
  private getCurrentGym(): string {
    const gymId = getCurrentGymId()
    if (!gymId) {
      throw new Error('No gym selected. Please select a gym first.')
    }
    return gymId
  }

  // Generic error handler to prevent SQL exposure
  private handleError(error: any, operation: string): never {
    // Log error server-side only, never expose SQL details to client
    if (process.env.NODE_ENV === 'development') {
      console.error(`Gym data service error in ${operation}:`, error.message)
    }
    
    // Always throw generic error message to client
    throw new Error(`Failed to ${operation}. Please try again.`)
  }

  // Members with gym isolation
  async getMembers() {
    try {
      const gymId = this.getCurrentGym()
      const { data, error } = await supabase
        .from('members')
        .select(`
          *,
          membership_plans (
            name,
            price,
            duration_months
          )
        `)
        .eq('gym_id', gymId)
        .order('created_at', { ascending: false })

      if (error) this.handleError(error, 'fetch members')
      return data || []
    } catch (error) {
      if (error instanceof Error && error.message.includes('Failed to')) {
        throw error
      }
      this.handleError(error, 'fetch members')
    }
  }

  async createMember(memberData: any) {
    try {
      const gymId = this.getCurrentGym()
      const { data, error } = await supabase
        .from('members')
        .insert({
          ...memberData,
          gym_id: gymId
        })
        .select()

      if (error) this.handleError(error, 'create member')
      return data
    } catch (error) {
      if (error instanceof Error && error.message.includes('Failed to')) {
        throw error
      }
      this.handleError(error, 'create member')
    }
  }

  // Trainers with gym isolation
  async getTrainers() {
    try {
      const gymId = this.getCurrentGym()
      const { data, error } = await supabase
        .from('trainers')
        .select(`
          *,
          trainer_sports (
            skill_level,
            sports (
              name,
              category
            )
          )
        `)
        .eq('gym_id', gymId)
        .order('created_at', { ascending: false })

      if (error) this.handleError(error, 'fetch trainers')
      return data || []
    } catch (error) {
      if (error instanceof Error && error.message.includes('Failed to')) {
        throw error
      }
      this.handleError(error, 'fetch trainers')
    }
  }

  async createTrainer(trainerData: any) {
    try {
      const gymId = this.getCurrentGym()
      const { data, error } = await supabase
        .from('trainers')
        .insert({
          ...trainerData,
          gym_id: gymId
        })
        .select()

      if (error) this.handleError(error, 'create trainer')
      return data
    } catch (error) {
      if (error instanceof Error && error.message.includes('Failed to')) {
        throw error
      }
      this.handleError(error, 'create trainer')
    }
  }

  // Classes with gym isolation
  async getClasses() {
    try {
      const gymId = this.getCurrentGym()
      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          trainers (
            first_name,
            last_name
          ),
          sports (
            name,
            category
          )
        `)
        .eq('gym_id', gymId)
        .order('created_at', { ascending: false })

      if (error) this.handleError(error, 'fetch classes')
      return data || []
    } catch (error) {
      if (error instanceof Error && error.message.includes('Failed to')) {
        throw error
      }
      this.handleError(error, 'fetch classes')
    }
  }

  async createClass(classData: any) {
    try {
      const gymId = this.getCurrentGym()
      const { data, error } = await supabase
        .from('classes')
        .insert({
          ...classData,
          gym_id: gymId
        })
        .select()

      if (error) this.handleError(error, 'create class')
      return data
    } catch (error) {
      if (error instanceof Error && error.message.includes('Failed to')) {
        throw error
      }
      this.handleError(error, 'create class')
    }
  }

  // Class schedules with gym isolation
  async getClassSchedules() {
    try {
      const gymId = this.getCurrentGym()
      const { data, error } = await supabase
        .from('class_schedules')
        .select(`
          *,
          classes (
            name,
            description,
            capacity
          ),
          trainers (
            first_name,
            last_name
          )
        `)
        .eq('gym_id', gymId)
        .order('scheduled_date', { ascending: true })

      if (error) this.handleError(error, 'fetch class schedules')
      return data || []
    } catch (error) {
      if (error instanceof Error && error.message.includes('Failed to')) {
        throw error
      }
      this.handleError(error, 'fetch class schedules')
    }
  }

  // Sports with gym isolation (or global if no gym_id)
  async getSports() {
    try {
      const gymId = this.getCurrentGym()
      const { data, error } = await supabase
        .from('sports')
        .select('*')
        .or(`gym_id.is.null,gym_id.eq.${gymId}`)
        .order('name', { ascending: true })

      if (error) this.handleError(error, 'fetch sports')
      return data || []
    } catch (error) {
      if (error instanceof Error && error.message.includes('Failed to')) {
        throw error
      }
      this.handleError(error, 'fetch sports')
    }
  }

  async createSport(sportData: any) {
    try {
      const gymId = this.getCurrentGym()
      const { data, error } = await supabase
        .from('sports')
        .insert({
          ...sportData,
          gym_id: gymId
        })
        .select()

      if (error) this.handleError(error, 'create sport')
      return data
    } catch (error) {
      if (error instanceof Error && error.message.includes('Failed to')) {
        throw error
      }
      this.handleError(error, 'create sport')
    }
  }

  // Membership plans with gym isolation
  async getMembershipPlans() {
    try {
      const gymId = this.getCurrentGym()
      const { data, error } = await supabase
        .from('membership_plans')
        .select('*')
        .eq('gym_id', gymId)
        .order('price', { ascending: true })

      if (error) this.handleError(error, 'fetch membership plans')
      return data || []
    } catch (error) {
      if (error instanceof Error && error.message.includes('Failed to')) {
        throw error
      }
      this.handleError(error, 'fetch membership plans')
    }
  }

  async createMembershipPlan(planData: any) {
    try {
      const gymId = this.getCurrentGym()
      const { data, error } = await supabase
        .from('membership_plans')
        .insert({
          ...planData,
          gym_id: gymId
        })
        .select()

      if (error) this.handleError(error, 'create membership plan')
      return data
    } catch (error) {
      if (error instanceof Error && error.message.includes('Failed to')) {
        throw error
      }
      this.handleError(error, 'create membership plan')
    }
  }

  // Analytics with gym isolation - simplified and secure
  async getGymAnalytics() {
    try {
      const gymId = this.getCurrentGym()
      
      // Get multiple analytics in parallel with proper error handling
      const [
        membersResult,
        trainersResult,
        classesResult,
        enrollmentsResult,
        revenueResult
      ] = await Promise.allSettled([
        supabase
          .from('members')
          .select('id, is_active, created_at')
          .eq('gym_id', gymId),
        
        supabase
          .from('trainers')
          .select('id, is_active')
          .eq('gym_id', gymId),
        
        supabase
          .from('classes')
          .select('id, is_active')
          .eq('gym_id', gymId),
        
        supabase
          .from('class_enrollments')
          .select('id, enrollment_status')
          .eq('gym_id', gymId),
        
        supabase
          .from('payments')
          .select('amount, status, created_at')
          .eq('gym_id', gymId)
      ])

      // Process results safely
      const members = membersResult.status === 'fulfilled' && !membersResult.value.error ? 
        membersResult.value.data || [] : []
      const trainers = trainersResult.status === 'fulfilled' && !trainersResult.value.error ? 
        trainersResult.value.data || [] : []
      const classes = classesResult.status === 'fulfilled' && !classesResult.value.error ? 
        classesResult.value.data || [] : []
      const enrollments = enrollmentsResult.status === 'fulfilled' && !enrollmentsResult.value.error ? 
        enrollmentsResult.value.data || [] : []
      const revenue = revenueResult.status === 'fulfilled' && !revenueResult.value.error ? 
        revenueResult.value.data || [] : []

      return {
        totalMembers: members.length,
        activeMembers: members.filter(m => m.is_active).length,
        totalTrainers: trainers.length,
        activeTrainers: trainers.filter(t => t.is_active).length,
        totalClasses: classes.length,
        activeClasses: classes.filter(c => c.is_active).length,
        totalEnrollments: enrollments.length,
        totalRevenue: revenue.reduce((sum, r) => sum + (r.amount || 0), 0),
        members,
        trainers,
        classes,
        enrollments,
        revenue
      }
    } catch (error) {
      this.handleError(error, 'fetch analytics')
    }
  }

  // Validate user access to gym - secure implementation
  async validateGymAccess(gymId: string): Promise<boolean> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) return false

      const { data, error } = await supabase
        .from('gym_user_permissions')
        .select('role')
        .eq('gym_id', gymId)
        .eq('user_id', user.id)
        .single()

      return !error && !!data
    } catch {
      return false
    }
  }
}

// Create singleton instance
export const gymDataService = new GymDataService()

// Utility functions for gym-aware queries
export function addGymFilter(query: any, tableName: string = '') {
  const gymId = getCurrentGymId()
  if (!gymId) {
    throw new Error('No gym selected. Please select a gym first.')
  }
  
  const filterColumn = tableName ? `${tableName}.gym_id` : 'gym_id'
  return query.eq(filterColumn, gymId)
}

export function createGymAwareRecord(data: any) {
  const gymId = getCurrentGymId()
  if (!gymId) {
    throw new Error('No gym selected. Please select a gym first.')
  }
  
  return {
    ...data,
    gym_id: gymId
  }
} 