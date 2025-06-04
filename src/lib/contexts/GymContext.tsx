'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Gym {
  id: string
  name: string
  slug: string
  subscription_tier: string
  subscription_status: string
  monthly_price: number
  max_members: number
  max_trainers: number
  max_locations: number
  is_active: boolean
  address?: string
  phone?: string
  email?: string
  website?: string
  timezone?: string
  logo_url?: string
  primary_color?: string
}

interface GymContextType {
  currentGym: Gym | null
  userGyms: Gym[]
  loading: boolean
  selectGym: (gymId: string) => Promise<void>
  refreshGyms: () => Promise<void>
  hasMultipleGyms: boolean
}

const GymContext = createContext<GymContextType | undefined>(undefined)

export function GymProvider({ children }: { children: React.ReactNode }) {
  const [currentGym, setCurrentGym] = useState<Gym | null>(null)
  const [userGyms, setUserGyms] = useState<Gym[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const loadUserGyms = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        setUserGyms([])
        setCurrentGym(null)
        return
      }

      // Get all gyms for this user
      const { data: gymsData, error: gymsError } = await supabase
        .from('gyms')
        .select('*')
        .eq('owner_user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (gymsError) {
        console.error('Error loading gyms:', gymsError)
        return
      }

      const gyms = gymsData || []
      setUserGyms(gyms)

      // Set current gym from localStorage or first gym
      const selectedGymId = localStorage.getItem('selectedGymId')
      let gymToSelect = null

      if (selectedGymId) {
        gymToSelect = gyms.find(g => g.id === selectedGymId)
      }
      
      if (!gymToSelect && gyms.length > 0) {
        gymToSelect = gyms[0]
        localStorage.setItem('selectedGymId', gymToSelect.id)
      }

      setCurrentGym(gymToSelect)

    } catch (error) {
      console.error('Error in loadUserGyms:', error)
    } finally {
      setLoading(false)
    }
  }

  const selectGym = async (gymId: string) => {
    const gym = userGyms.find(g => g.id === gymId)
    if (gym) {
      setCurrentGym(gym)
      localStorage.setItem('selectedGymId', gymId)
    }
  }

  const refreshGyms = async () => {
    setLoading(true)
    await loadUserGyms()
  }

  useEffect(() => {
    loadUserGyms()
  }, [])

  const value: GymContextType = {
    currentGym,
    userGyms,
    loading,
    selectGym,
    refreshGyms,
    hasMultipleGyms: userGyms.length > 1
  }

  return <GymContext.Provider value={value}>{children}</GymContext.Provider>
}

export function useGym() {
  const context = useContext(GymContext)
  if (context === undefined) {
    throw new Error('useGym must be used within a GymProvider')
  }
  return context
}

// Utility function to get current gym ID for API calls
export function getCurrentGymId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('selectedGymId')
} 