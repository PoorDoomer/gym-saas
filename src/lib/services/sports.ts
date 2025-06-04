import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export interface Sport {
  id: string
  name: string
  description?: string
  category: string
  equipment_needed?: string[]
  difficulty_level: 'beginner' | 'intermediate' | 'advanced' | 'all'
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateSportData {
  name: string
  description?: string
  category: string
  equipment_needed?: string[]
  difficulty_level: 'beginner' | 'intermediate' | 'advanced' | 'all'
  is_active?: boolean
}

export interface UpdateSportData extends Partial<CreateSportData> {}

export interface TrainerSport {
  id: string
  trainer_id: string
  sport_id: string
  skill_level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  created_at: string
  sport?: Sport
  trainer?: {
    first_name: string
    last_name: string
  }
}

export interface SportsStats {
  totalSports: number
  activeSports: number
  categories: string[]
  mostPopularSport: string | null
}

// Get all sports
export async function getSports(): Promise<Sport[]> {
  try {
    const { data, error } = await supabase
      .from('sports')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching sports:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Failed to fetch sports:', error)
    return []
  }
}

// Get active sports only
export async function getActiveSports(): Promise<Sport[]> {
  try {
    const { data, error } = await supabase
      .from('sports')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching active sports:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Failed to fetch active sports:', error)
    return []
  }
}

// Get sport by ID
export async function getSportById(id: string): Promise<Sport | null> {
  try {
    const { data, error } = await supabase
      .from('sports')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching sport:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Failed to fetch sport:', error)
    return null
  }
}

// Create new sport
export async function createSport(sportData: CreateSportData): Promise<Sport | null> {
  try {
    const { data, error } = await supabase
      .from('sports')
      .insert([sportData])
      .select()
      .single()

    if (error) {
      console.error('Error creating sport:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Failed to create sport:', error)
    return null
  }
}

// Update sport
export async function updateSport(id: string, sportData: UpdateSportData): Promise<Sport | null> {
  try {
    const { data, error } = await supabase
      .from('sports')
      .update(sportData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating sport:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Failed to update sport:', error)
    return null
  }
}

// Delete sport
export async function deleteSport(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('sports')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting sport:', error)
      throw error
    }

    return true
  } catch (error) {
    console.error('Failed to delete sport:', error)
    return false
  }
}

// Get trainer sports (sports a trainer specializes in)
export async function getTrainerSports(trainerId?: string): Promise<TrainerSport[]> {
  try {
    let query = supabase
      .from('trainer_sports')
      .select(`
        *,
        sport:sports(*),
        trainer:trainers(first_name, last_name)
      `)

    if (trainerId) {
      query = query.eq('trainer_id', trainerId)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching trainer sports:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Failed to fetch trainer sports:', error)
    return []
  }
}

// Add sport to trainer
export async function addSportToTrainer(
  trainerId: string, 
  sportId: string, 
  skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert'
): Promise<TrainerSport | null> {
  try {
    const { data, error } = await supabase
      .from('trainer_sports')
      .insert([{
        trainer_id: trainerId,
        sport_id: sportId,
        skill_level: skillLevel
      }])
      .select(`
        *,
        sport:sports(*),
        trainer:trainers(first_name, last_name)
      `)
      .single()

    if (error) {
      console.error('Error adding sport to trainer:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Failed to add sport to trainer:', error)
    return null
  }
}

// Remove sport from trainer
export async function removeSportFromTrainer(trainerId: string, sportId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('trainer_sports')
      .delete()
      .eq('trainer_id', trainerId)
      .eq('sport_id', sportId)

    if (error) {
      console.error('Error removing sport from trainer:', error)
      throw error
    }

    return true
  } catch (error) {
    console.error('Failed to remove sport from trainer:', error)
    return false
  }
}

// Get sports statistics
export async function getSportsStats(): Promise<SportsStats> {
  try {
    // Total sports
    const { count: totalSports, error: totalError } = await supabase
      .from('sports')
      .select('*', { count: 'exact', head: true })
    if (totalError) throw totalError

    // Active sports
    const { count: activeSports, error: activeError } = await supabase
      .from('sports')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
    if (activeError) throw activeError

    // Categories
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('sports')
      .select('category')
      .eq('is_active', true)
    if (categoriesError) throw categoriesError

    const categories = [...new Set(categoriesData?.map(s => s.category).filter(Boolean) || [])]

    // Most popular sport (based on trainer count)
    const { data: popularData, error: popularError } = await supabase
      .from('trainer_sports')
      .select(`
        sport_id,
        sport:sports(name)
      `)
    if (popularError) throw popularError

    const sportCounts = popularData?.reduce((acc, ts: any) => {
      const sportName = ts.sport?.name
      if (sportName) {
        acc[sportName] = (acc[sportName] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>) || {}

    const mostPopularSport = Object.entries(sportCounts).length > 0 
      ? Object.entries(sportCounts).sort(([,a], [,b]) => b - a)[0][0]
      : null

    return {
      totalSports: totalSports || 0,
      activeSports: activeSports || 0,
      categories,
      mostPopularSport
    }
  } catch (error) {
    console.error('Error fetching sports statistics:', error)
    return {
      totalSports: 0,
      activeSports: 0,
      categories: [],
      mostPopularSport: null
    }
  }
} 