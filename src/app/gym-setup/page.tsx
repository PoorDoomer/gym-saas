'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Building2, Users, MapPin } from 'lucide-react'

export default function GymSetupPage() {
  const [gymData, setGymData] = useState({
    name: '',
    slug: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    timezone: 'UTC',
    description: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleInputChange = (field: string, value: string) => {
    setGymData(prev => ({
      ...prev,
      [field]: value,
      // Auto-generate slug from name
      ...(field === 'name' && {
        slug: value.toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim()
      })
    }))
  }

  const createGym = async () => {
    if (!gymData.name.trim()) {
      setError('Please enter a gym name')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        router.push('/login')
        return
      }

      // Get user's subscription tier to apply gym limits
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('subscription_tier')
        .eq('user_id', user.id)
        .single()

      // Default to 'solo' tier if no profile found
      const userTier = userProfile?.subscription_tier || 'solo'

      // Check existing gyms count for user
      const { data: existingGyms, error: gymsError } = await supabase
        .from('gyms')
        .select('id')
        .eq('owner_user_id', user.id)
        .eq('is_active', true)

      if (gymsError) {
        setError('Error checking existing gyms')
        return
      }

      // Validate tier limits
      const gymLimits = {
        solo: 1,
        multi: 999
      }

      const currentGymCount = existingGyms?.length || 0
      const maxGyms = gymLimits[userTier as keyof typeof gymLimits] || 1

      if (currentGymCount >= maxGyms) {
        setError(`Your subscription plan allows only ${maxGyms} gym${maxGyms > 1 ? 's' : ''}. Please upgrade to add more gyms.`)
        return
      }

      // Create the gym
      const gymInsertData = {
        name: gymData.name.trim(),
        slug: gymData.slug || gymData.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'),
        owner_user_id: user.id,
        address: gymData.address.trim() || null,
        phone: gymData.phone.trim() || null,
        email: gymData.email.trim() || null,
        website: gymData.website.trim() || null,
        timezone: gymData.timezone,
        description: gymData.description.trim() || null,
        is_active: true
      }

      const { data: gymResult, error: gymError } = await supabase
        .from('gyms')
        .insert(gymInsertData)
        .select()
        .single()

      if (gymError) {
        setError('Error creating gym. Please try again.')
        return
      }

      // Store selected gym and redirect to dashboard
      localStorage.setItem('selectedGymId', gymResult.id)
      router.push('/gym-selection')

    } catch (error) {
      setError('Unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Add New Gym</h1>
          <p className="text-lg text-gray-600">Create a new gym location for your business</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Gym Information</CardTitle>
            <CardDescription>
              Fill in the details for your new gym location
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-sm font-medium">Gym Name *</Label>
                <Input
                  id="name"
                  value={gymData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., FitLife Gym Downtown"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="slug" className="text-sm font-medium">URL Slug</Label>
                <Input
                  id="slug"
                  value={gymData.slug}
                  onChange={(e) => handleInputChange('slug', e.target.value)}
                  placeholder="fitlife-downtown"
                  className="font-mono text-sm mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This will be used in your gym's URL
                </p>
              </div>

              <div>
                <Label htmlFor="address" className="text-sm font-medium">Address</Label>
                <Textarea
                  id="address"
                  value={gymData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="123 Fitness Street, Healthy City, HC 12345"
                  rows={2}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone" className="text-sm font-medium">Phone</Label>
                  <Input
                    id="phone"
                    value={gymData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={gymData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="info@fitlifegym.com"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="website" className="text-sm font-medium">Website (optional)</Label>
                <Input
                  id="website"
                  value={gymData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="https://www.fitlifegym.com"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-sm font-medium">Description (optional)</Label>
                <Textarea
                  id="description"
                  value={gymData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Brief description of your gym..."
                  rows={3}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button 
                variant="outline"
                onClick={() => router.back()}
                className="flex-1 cursor-pointer"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button 
                onClick={createGym}
                disabled={loading || !gymData.name.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 cursor-pointer"
              >
                {loading ? 'Creating Gym...' : 'Create Gym'}
              </Button>
            </div>

            <p className="text-xs text-gray-500 text-center">
              Your gym will be created under your current subscription plan
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 