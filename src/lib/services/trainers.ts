import { createClient } from '@/lib/supabase/client'
import { Trainer } from '@/lib/types'

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
}

export interface UpdateTrainerData extends Partial<CreateTrainerData> {
  is_active?: boolean
}

export interface TrainerStats {
  totalTrainers: number
  activeTrainers: number
  avgHourlyRate: number
  specializations: string[]
}

// Get all trainers
export async function getTrainers(): Promise<Trainer[]> {
  try {
    const { data, error } = await supabase
      .from('trainers')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching trainers:', error)
      throw new Error('Failed to fetch trainers')
    }

    return data || []
  } catch (error) {
    console.error('Failed to fetch trainers:', error)
    return []
  }
}

// Get trainer by ID
export async function getTrainerById(id: string): Promise<Trainer | null> {
  try {
    const { data, error } = await supabase
      .from('trainers')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching trainer:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Failed to fetch trainer:', error)
    return null
  }
}

// Create new trainer
export async function createTrainer(trainerData: CreateTrainerData): Promise<Trainer | null> {
  try {
    const { data, error } = await supabase
      .from('trainers')
      .insert([{
        first_name: trainerData.first_name,
        last_name: trainerData.last_name,
        email: trainerData.email,
        phone: trainerData.phone,
        specializations: trainerData.specializations,
        bio: trainerData.bio,
        hourly_rate: trainerData.hourly_rate,
        profile_image_url: trainerData.profile_image_url,
        is_active: true
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating trainer:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Failed to create trainer:', error)
    return null
  }
}

// Update trainer
export async function updateTrainer(id: string, trainerData: UpdateTrainerData): Promise<Trainer | null> {
  try {
    const { data, error } = await supabase
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

    if (error) {
      console.error('Error updating trainer:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Failed to update trainer:', error)
    return null
  }
}

// Delete trainer (soft delete by setting is_active to false)
export async function deleteTrainer(id: string): Promise<boolean> {
  try {
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

// Get trainer statistics
export async function getTrainerStats(): Promise<TrainerStats> {
  try {
    const { data: trainers, error } = await supabase
      .from('trainers')
      .select('*')

    if (error) {
      console.error('Error fetching trainer stats:', error)
      throw error
    }

    const totalTrainers = trainers?.length || 0
    const activeTrainers = trainers?.filter(t => t.is_active).length || 0
    const avgHourlyRate = totalTrainers > 0 
      ? trainers.reduce((sum, t) => sum + (t.hourly_rate || 0), 0) / totalTrainers 
      : 0

    // Get all unique specializations
    const allSpecializations = trainers?.flatMap(t => t.specializations || []) || []
    const uniqueSpecializations = [...new Set(allSpecializations)]

    return {
      totalTrainers,
      activeTrainers,
      avgHourlyRate: Math.round(avgHourlyRate),
      specializations: uniqueSpecializations
    }
  } catch (error) {
    console.error('Failed to fetch trainer stats:', error)
    return {
      totalTrainers: 0,
      activeTrainers: 0,
      avgHourlyRate: 0,
      specializations: []
    }
  }
} 