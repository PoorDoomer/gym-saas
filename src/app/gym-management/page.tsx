'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Building2, Users, CreditCard, Settings, MoreVertical, Crown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Gym {
  id: string
  name: string
  slug: string
  subscription_tier: string
  subscription_status: string
  subscription_end_date: string
  address: string
  phone: string
  email: string
  is_active: boolean
  created_at: string
  member_count?: number
}

export default function GymManagementPage() {
  const [gyms, setGyms] = useState<Gym[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadUserAndGyms()
  }, [])

  const loadUserAndGyms = async () => {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        console.error('User error:', userError)
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

      // Get member count for each gym
      const gymsWithCounts = await Promise.all(
        (gymsData || []).map(async (gym) => {
          const { data: members, error } = await supabase
            .from('members')
            .select('id')
            .eq('gym_id', gym.id)
            .eq('is_active', true)

          return {
            ...gym,
            member_count: members?.length || 0
          }
        })
      )

      setGyms(gymsWithCounts)
    } catch (error) {
      console.error('Error in loadUserAndGyms:', error)
    } finally {
      setLoading(false)
    }
  }

  const createNewGym = () => {
    router.push('/gym-setup')
  }

  const manageGym = (gymId: string) => {
    localStorage.setItem('selectedGymId', gymId)
    router.push('/dashboard')
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>
      case 'trial':
        return <Badge className="bg-blue-500">Trial</Badge>
      case 'expired':
        return <Badge className="bg-red-500">Expired</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'solo':
        return <Badge variant="outline">Solo Plan</Badge>
      case 'multi':
        return <Badge className="bg-purple-500">Multi Plan</Badge>
      default:
        return <Badge variant="outline">{tier}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Building2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading your gyms...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-sm border-r min-h-screen">
          <div className="p-6">
            <div className="flex items-center space-x-2 mb-8">
              <Building2 className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">Gym Manager</span>
            </div>
            
            <nav className="space-y-2">
              <Button variant="ghost" className="w-full justify-start bg-blue-50 text-blue-700">
                <Building2 className="h-4 w-4 mr-3" />
                My Gyms
              </Button>
              <Button variant="ghost" className="w-full justify-start" onClick={() => router.push('/subscription')}>
                <Crown className="h-4 w-4 mr-3" />
                Subscription
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <CreditCard className="h-4 w-4 mr-3" />
                Billing
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <Settings className="h-4 w-4 mr-3" />
                Account Settings
              </Button>
            </nav>
          </div>

          {/* User Info */}
          <div className="absolute bottom-0 w-64 p-6 border-t bg-white">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.email}
                </p>
                <p className="text-xs text-gray-500">Gym Owner</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">My Gyms</h1>
                <p className="text-gray-600 mt-1">
                  Manage your gym locations and subscriptions
                </p>
              </div>
              <Button onClick={createNewGym} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add New Gym
              </Button>
            </div>

            {/* Gyms List */}
            {gyms.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No gyms yet
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Get started by creating your first gym location
                  </p>
                  <Button onClick={createNewGym} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Gym
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <div className="text-sm text-gray-600 mb-4">
                  {gyms.length} gym{gyms.length !== 1 ? 's' : ''} total
                </div>
                {gyms.map((gym) => (
                  <Card key={gym.id} className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{gym.name}</h3>
                            <p className="text-sm text-gray-500">{gym.address}</p>
                          </div>
                          <div className="flex space-x-2">
                            {getTierBadge(gym.subscription_tier)}
                            {getStatusBadge(gym.subscription_status)}
                          </div>
                        </div>
                        <div className="mt-2 flex items-center space-x-6 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {gym.member_count} members
                          </div>
                          <div>
                            Created {formatDate(gym.created_at)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button 
                          onClick={() => manageGym(gym.id)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Building2 className="h-4 w-4 mr-2" />
                          Manage
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Settings className="h-4 w-4 mr-2" />
                              Settings
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Crown className="h-4 w-4 mr-2" />
                              Change Plan
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 