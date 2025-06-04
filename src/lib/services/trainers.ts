import { createClient } from '@/lib/supabase/client'
import { Trainer } from '@/lib/types'
import { Sport, TrainerSport } from './sports'
import { gymDataService } from './gymDataService'

const supabase = createClient()

export interface CreateTrainerData {
  first_name: string
  last_name: string
  email: string
  phone?: string
  specializations?: string[]
  bio?: string
  hourly_rate?: number
  profile_image_url?: string
  // Sports assignment
  selected_sports?: Array<{
    sport_id: string
    skill_level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  }>
}

export interface UpdateTrainerData extends Partial<CreateTrainerData> {
  is_active?: boolean
}

export interface TrainerStats {
  totalTrainers: number
  activeTrainers: number
  avgHourlyRate: number
  specializations: string[]
  mostCommonSports: string[]
}

export interface TrainerWithSports extends Trainer {
  trainer_sports?: Array<{
    id: string
    sport_id: string
    skill_level: string
    sport: Sport
  }>
}

export interface CreateTrainerResult {
  trainer: Trainer | null
  user_account: {
    email: string
    temporary_password: string
    user_id: string
  } | null
  success: boolean
  error?: string
}

// Generate a secure random password
function generateTemporaryPassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*'
  let password = ''
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

// Get all trainers with their sports - now uses gymDataService
export async function getTrainers(): Promise<TrainerWithSports[]> {
  try {
    const trainers = await gymDataService.getTrainers()
    return trainers as TrainerWithSports[]
  } catch (error) {
    console.error('Failed to fetch trainers:', error)
    return []
  }
}

// Get trainer by ID with sports
export async function getTrainerById(id: string): Promise<TrainerWithSports | null> {
  try {
    const trainers = await getTrainers()
    return trainers.find(t => t.id === id) || null
  } catch (error) {
    console.error('Failed to fetch trainer:', error)
    return null
  }
}

// Create new trainer with user account and sports
export async function createTrainer(trainerData: CreateTrainerData): Promise<CreateTrainerResult> {
  try {
    // Generate temporary password
    const temporaryPassword = generateTemporaryPassword()
    
    // Step 1: Create user account in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: trainerData.email,
      password: temporaryPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        role: 'trainer',
        first_name: trainerData.first_name,
        last_name: trainerData.last_name,
        full_name: `${trainerData.first_name} ${trainerData.last_name}`
      }
    })

    if (authError) {
      console.error('Error creating trainer user account:', authError)
      return {
        trainer: null,
        user_account: null,
        success: false,
        error: `Failed to create user account: ${authError.message}`
      }
    }

    if (!authData.user) {
      return {
        trainer: null,
        user_account: null,
        success: false,
        error: 'Failed to create user account: No user returned'
      }
    }

    // Step 2: Create trainer record using gymDataService (includes gym_id)
    const trainer = await gymDataService.createTrainer({
      user_id: authData.user.id,
        first_name: trainerData.first_name,
        last_name: trainerData.last_name,
        email: trainerData.email,
        phone: trainerData.phone,
        specializations: trainerData.specializations,
        bio: trainerData.bio,
        hourly_rate: trainerData.hourly_rate,
        profile_image_url: trainerData.profile_image_url,
        is_active: true
    })

    if (!trainer || !trainer[0]) {
      // Cleanup: Delete the auth user if trainer creation failed
      await supabase.auth.admin.deleteUser(authData.user.id)
      
      return {
        trainer: null,
        user_account: null,
        success: false,
        error: 'Failed to create trainer record'
      }
    }

    // Step 3: Create user_roles entry
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert([{
        user_id: authData.user.id,
        role: 'trainer'
      }])

    if (roleError) {
      console.error('Error creating trainer role:', roleError)
      // Continue anyway, role can be added later
    }

    // Step 4: Create trainer_accounts entry
    const { error: accountError } = await supabase
      .from('trainer_accounts')
      .insert([{
        user_id: authData.user.id,
        trainer_id: trainer[0].id
      }])

    if (accountError) {
      console.error('Error creating trainer account link:', accountError)
      // Continue anyway, link can be added later
    }

    // Step 5: Assign sports if any
    if (trainerData.selected_sports && trainerData.selected_sports.length > 0) {
      const sportsData = trainerData.selected_sports.map(sport => ({
        trainer_id: trainer[0].id,
        sport_id: sport.sport_id,
        skill_level: sport.skill_level
      }))

      const { error: sportsError } = await supabase
        .from('trainer_sports')
        .insert(sportsData)

      if (sportsError) {
        console.error('Error assigning sports to trainer:', sportsError)
        // Don't throw here, trainer is already created
      }
    }

    return {
      trainer: trainer[0],
      user_account: {
        email: trainerData.email,
        temporary_password: temporaryPassword,
        user_id: authData.user.id
      },
      success: true
    }
  } catch (error) {
    console.error('Failed to create trainer:', error)
    return {
      trainer: null,
      user_account: null,
      success: false,
      error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

// Update trainer with sports
export async function updateTrainer(id: string, trainerData: UpdateTrainerData): Promise<Trainer | null> {
  try {
    // First verify the trainer belongs to the current gym
    const existingTrainer = await getTrainerById(id)
    if (!existingTrainer) {
      throw new Error('Trainer not found or does not belong to your gym')
    }
    
    // Update trainer details
    const { data: trainer, error: trainerError } = await supabase
      .from('trainers')
      .update({
        first_name: trainerData.first_name,
        last_name: trainerData.last_name,
        email: trainerData.email,
        phone: trainerData.phone,
        specializations: trainerData.specializations,
        bio: trainerData.bio,
        hourly_rate: trainerData.hourly_rate,
        profile_image_url: trainerData.profile_image_url,
        is_active: trainerData.is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (trainerError) {
      console.error('Error updating trainer:', trainerError)
      throw trainerError
    }

    // Update sports if provided
    if (trainerData.selected_sports !== undefined) {
      // Remove existing sports
      await supabase
        .from('trainer_sports')
        .delete()
        .eq('trainer_id', id)

      // Add new sports
      if (trainerData.selected_sports.length > 0) {
        const sportsData = trainerData.selected_sports.map(sport => ({
          trainer_id: id,
          sport_id: sport.sport_id,
          skill_level: sport.skill_level
        }))

        const { error: sportsError } = await supabase
          .from('trainer_sports')
          .insert(sportsData)

        if (sportsError) {
          console.error('Error updating trainer sports:', sportsError)
        }
      }
    }

    return trainer
  } catch (error) {
    console.error('Failed to update trainer:', error)
    return null
  }
}

// Delete trainer (soft delete by setting is_active to false)
export async function deleteTrainer(id: string): Promise<boolean> {
  try {
    // First verify the trainer belongs to the current gym
    const existingTrainer = await getTrainerById(id)
    if (!existingTrainer) {
      throw new Error('Trainer not found or does not belong to your gym')
    }
    
    const { error } = await supabase
      .from('trainers')
      .update({ is_active: false })
      .eq('id', id)

    if (error) {
      console.error('Error deleting trainer:', error)
      throw error
    }

    return true
  } catch (error) {
    console.error('Failed to delete trainer:', error)
    return false
  }
}

// Get trainer statistics with sports data - now properly filtered by gym
export async function getTrainerStats(): Promise<TrainerStats> {
  try {
    const analytics = await gymDataService.getGymAnalytics()
    const trainers = await getTrainers()

    const totalTrainers = analytics.totalTrainers
    const activeTrainers = analytics.activeTrainers
    const avgHourlyRate = totalTrainers > 0 
      ? trainers.reduce((sum, t) => sum + (t.hourly_rate || 0), 0) / totalTrainers 
      : 0

    // Get all unique specializations
    const allSpecializations = trainers.flatMap(t => t.specializations || [])
    const uniqueSpecializations = [...new Set(allSpecializations)]

    // Get most common sports
    const allSports = trainers.flatMap((t: any) => 
      (t.trainer_sports || []).map((ts: any) => ts.sport?.name).filter(Boolean)
    )
    const sportCounts = allSports.reduce((acc: Record<string, number>, sport: string) => {
      acc[sport] = (acc[sport] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    const mostCommonSports = Object.entries(sportCounts)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([sport]) => sport)

    return {
      totalTrainers,
      activeTrainers,
      avgHourlyRate: Math.round(avgHourlyRate),
      specializations: uniqueSpecializations,
      mostCommonSports
    }
  } catch (error) {
    console.error('Failed to fetch trainer stats:', error)
    return {
      totalTrainers: 0,
      activeTrainers: 0,
      avgHourlyRate: 0,
      specializations: [],
      mostCommonSports: []
    }
  }
} 