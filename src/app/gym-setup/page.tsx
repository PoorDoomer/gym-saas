'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Building2, Users, MapPin, CreditCard, Star } from 'lucide-react'

const subscriptionTiers = [
  {
    id: 'solo',
    name: 'Solo Gym Owner',
    price: 20,
    description: 'Perfect for single gym location owners',
    features: [
      'Up to 200 members',
      'Up to 10 trainers',
      '1 gym location',
      'Member management',
      'Class scheduling',
      'Payment processing',
      'Basic reports',
      'Email support'
    ],
    maxGyms: 1,
    maxMembers: 200,
    maxTrainers: 10,
    maxLocations: 1
  },
  {
    id: 'multi',
    name: 'Multi Gym Owner',
    price: 100,
    description: 'Ideal for gym chains and franchises',
    features: [
      'Unlimited members',
      'Unlimited trainers', 
      'Up to 99 gym locations',
      'All Solo features',
      'Multi-location management',
      'Franchise management',
      'Advanced analytics',
      'Priority support',
      'Custom branding'
    ],
    maxGyms: 999,
    maxMembers: 9999,
    maxTrainers: 999,
    maxLocations: 99,
    popular: true
  }
]

export default function GymSetupPage() {
  const [selectedTier, setSelectedTier] = useState('solo')
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
      alert('Please enter a gym name')
      return
    }

    setLoading(true)
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        console.error('User error:', userError)
        router.push('/login')
        return
      }

      console.log('Creating gym for user:', user.id)

      // Check if user already has gyms and validate tier limits
      const { data: existingGyms, error: gymsError } = await supabase
        .from('gyms')
        .select('*')
        .eq('owner_user_id', user.id)
        .eq('is_active', true)

      if (gymsError) {
        console.error('Error checking existing gyms:', gymsError)
        alert('Error checking existing gyms: ' + (gymsError.message || 'Unknown error'))
        return
      }

      const tier = subscriptionTiers.find(t => t.id === selectedTier)!
      
      if (existingGyms && existingGyms.length >= tier.maxGyms) {
        alert(`Your ${tier.name} plan allows only ${tier.maxGyms} gym${tier.maxGyms > 1 ? 's' : ''}. Please upgrade to add more gyms.`)
        return
      }

      // Calculate subscription end date (14 days from now)
      const subscriptionEndDate = new Date()
      subscriptionEndDate.setDate(subscriptionEndDate.getDate() + 14)

      // Create the gym with simplified schema
      const gymInsertData = {
        name: gymData.name.trim(),
        slug: gymData.slug || gymData.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'),
        owner_user_id: user.id,
        subscription_tier: selectedTier,
        subscription_status: 'trial',
        subscription_end_date: subscriptionEndDate.toISOString(),
        address: gymData.address.trim() || null,
        phone: gymData.phone.trim() || null,
        email: gymData.email.trim() || null,
        website: gymData.website.trim() || null,
        is_active: true
      }

      console.log('Inserting gym data:', gymInsertData)

      const { data: gymResult, error: gymError } = await supabase
        .from('gyms')
        .insert(gymInsertData)
        .select()
        .single()

      if (gymError) {
        console.error('Error creating gym:', gymError)
        console.error('Gym error details:', JSON.stringify(gymError, null, 2))
        alert('Error creating gym: ' + (gymError.message || gymError.details || 'Unknown database error'))
        return
      }

      console.log('Gym created successfully:', gymResult)

      // Store selected gym and redirect to dashboard
      localStorage.setItem('selectedGymId', gymResult.id)
      router.push('/gym-selection')

    } catch (error) {
      console.error('Error in createGym:', error)
      alert('Unexpected error: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Setup Your Gym</h1>
          <p className="text-lg text-gray-600">Get started with your gym management system</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Subscription Tier Selection */}
          <div>
            <h2 className="text-2xl font-semibold mb-4">Choose Your Plan</h2>
            <div className="space-y-4">
              {subscriptionTiers.map((tier) => (
                <Card 
                  key={tier.id}
                  className={`cursor-pointer transition-all ${
                    selectedTier === tier.id 
                      ? 'ring-2 ring-blue-500 border-blue-500' 
                      : 'hover:border-blue-300'
                  }`}
                  onClick={() => setSelectedTier(tier.id)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {tier.name}
                          {tier.popular && (
                            <Badge className="bg-orange-500">
                              <Star className="w-3 h-3 mr-1" />
                              Popular
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription>{tier.description}</CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">${tier.price}</div>
                        <div className="text-sm text-gray-500">/month</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-1 text-gray-500" />
                        {tier.maxMembers === 9999 ? 'Unlimited' : `${tier.maxMembers}`} members
                      </div>
                      <div className="flex items-center">
                        <Building2 className="w-4 h-4 mr-1 text-gray-500" />
                        {tier.maxLocations} location{tier.maxLocations > 1 ? 's' : ''}
                      </div>
                    </div>
                    <ul className="space-y-1 text-sm">
                      {tier.features.slice(0, 4).map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Gym Information Form */}
          <div>
            <h2 className="text-2xl font-semibold mb-4">Gym Information</h2>
            <Card>
              <CardContent className="space-y-4 pt-6">
                <div>
                  <Label htmlFor="name">Gym Name *</Label>
                  <Input
                    id="name"
                    value={gymData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="e.g., FitLife Gym Downtown"
                  />
                </div>

                <div>
                  <Label htmlFor="slug">URL Slug</Label>
                  <Input
                    id="slug"
                    value={gymData.slug}
                    onChange={(e) => handleInputChange('slug', e.target.value)}
                    placeholder="fitlife-downtown"
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This will be used in your gym's URL
                  </p>
                </div>

                <div>
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={gymData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="123 Fitness Street, Healthy City, HC 12345"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={gymData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={gymData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="info@fitlifegym.com"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="website">Website (optional)</Label>
                  <Input
                    id="website"
                    value={gymData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    placeholder="https://www.fitlifegym.com"
                  />
                </div>

                <Button 
                  onClick={createGym}
                  disabled={loading || !gymData.name.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? 'Creating Gym...' : 'Create Gym & Start'}
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  Get started with your gym management system
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 