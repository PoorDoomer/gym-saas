'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Building2, Users, MapPin, CreditCard } from 'lucide-react'
import { PageLoader } from '@/components/ui/loading-spinner'

interface Gym {
  id: string
  name: string
  slug: string
  subscription_tier: string
  subscription_status: string
  monthly_price: number
  max_members: number
  max_locations: number
  is_active: boolean
  address?: string
  phone?: string
  email?: string
}

export default function GymSelectionPage() {
  const [gyms, setGyms] = useState<Gym[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadUserGyms()
  }, [])

  const loadUserGyms = async () => {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        router.push('/login')
        return
      }
      setUser(user)

      // Get user's gyms
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

      setGyms(gymsData || [])
    } catch (error) {
      console.error('Error in loadUserGyms:', error)
    } finally {
      setLoading(false)
    }
  }

  const selectGym = (gymId: string) => {
    // Store selected gym in localStorage and redirect to dashboard
    localStorage.setItem('selectedGymId', gymId)
    router.push('/dashboard')
  }

  const createNewGym = () => {
    router.push('/gym-setup')
  }

  if (loading) {
    return <PageLoader />
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500'
      case 'trial': return 'bg-blue-500'
      case 'expired': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'solo': return 'bg-blue-100 text-blue-800'
      case 'multi': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Select Your Gym</h1>
          <p className="text-lg text-gray-600">Choose which gym you want to manage today</p>
        </div>

        {gyms.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Gyms Found</h3>
            <p className="text-gray-500 mb-6">Get started by creating your first gym</p>
            <Button onClick={createNewGym} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Gym
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gyms.map((gym) => (
              <Card key={gym.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">{gym.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {gym.address || 'No address provided'}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Badge className={getStatusColor(gym.subscription_status)}>
                        {gym.subscription_status}
                      </Badge>
                      <Badge variant="outline" className={getTierColor(gym.subscription_tier)}>
                        {gym.subscription_tier}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-gray-600">
                        <Users className="w-4 h-4 mr-1" />
                        Max Members
                      </div>
                      <span className="font-medium">{gym.max_members.toLocaleString()}</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-gray-600">
                        <MapPin className="w-4 h-4 mr-1" />
                        Max Locations
                      </div>
                      <span className="font-medium">{gym.max_locations}</span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-gray-600">
                        <CreditCard className="w-4 h-4 mr-1" />
                        Monthly Price
                      </div>
                      <span className="font-medium">${gym.monthly_price}/mo</span>
                    </div>

                    <div className="pt-3 border-t">
                      <Button 
                        onClick={() => selectGym(gym.id)}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        Manage This Gym
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Add New Gym Card */}
            <Card 
              className="border-dashed border-2 hover:border-blue-400 hover:bg-blue-50/50 transition-colors cursor-pointer"
              onClick={createNewGym}
            >
              <CardContent className="flex flex-col items-center justify-center h-full py-12">
                <Plus className="w-8 h-8 text-blue-600 mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">Add New Gym</h3>
                <p className="text-sm text-gray-500 text-center">
                  Create another gym location to manage
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Need help? <a href="/support" className="text-blue-600 hover:underline">Contact Support</a>
          </p>
        </div>
      </div>
    </div>
  )
} 