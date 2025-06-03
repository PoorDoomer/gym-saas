'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Save, Building, Phone, Mail, Globe, Clock, DollarSign, Percent } from 'lucide-react'
import { GymSettings } from '@/lib/types'

export default function SettingsPage() {
  const [settings, setSettings] = useState<GymSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Mock data for demonstration
  useEffect(() => {
    const mockSettings: GymSettings = {
      id: 'gym_settings_id',
      gym_name: 'FitLife Gym',
      logo_url: undefined,
      address: '123 Fitness Ave, Suite 100, Sportsville, CA 90210',
      phone: '+1 (123) 456-7890',
      email: 'info@fitlife.com',
      website: 'https://www.fitlife.com',
      business_hours: {
        monday: '6:00 AM - 10:00 PM',
        tuesday: '6:00 AM - 10:00 PM',
        wednesday: '6:00 AM - 10:00 PM',
        thursday: '6:00 AM - 10:00 PM',
        friday: '6:00 AM - 9:00 PM',
        saturday: '8:00 AM - 6:00 PM',
        sunday: '8:00 AM - 4:00 PM',
      },
      timezone: 'America/Los_Angeles',
      currency: 'USD',
      tax_rate: 8.5,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    }

    setTimeout(() => {
      setSettings(mockSettings)
      setLoading(false)
    }, 1000)
  }, [])

  const handleSave = async (formData: FormData) => {
    setIsSaving(true)
    // Mock save operation
    console.log('Saving settings:', Object.fromEntries(formData))
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIsSaving(false)
    alert('Settings saved successfully!')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">No settings found. Please contact support.</p>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gym Settings</h2>
          <p className="text-muted-foreground">
            Manage your gym's general information, contact details, and preferences.
          </p>
        </div>
        <Button type="submit" form="settings-form" disabled={isSaving}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <Separator />

      <form id="settings-form" action={handleSave} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><Building className="mr-2 h-5 w-5" /> General Information</CardTitle>
            <CardDescription>Update your gym's name, logo, and address.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="gym_name">Gym Name *</Label>
              <Input
                id="gym_name"
                name="gym_name"
                defaultValue={settings.gym_name}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="logo_url">Logo URL</Label>
              <Input
                id="logo_url"
                name="logo_url"
                defaultValue={settings.logo_url || ''}
                placeholder="URL to your gym's logo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                name="address"
                defaultValue={settings.address || ''}
                placeholder="Full address of your gym"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><Phone className="mr-2 h-5 w-5" /> Contact Information</CardTitle>
            <CardDescription>Manage how members and staff can contact your gym.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                defaultValue={settings.phone || ''}
                placeholder="e.g., +1 (123) 456-7890"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={settings.email || ''}
                placeholder="e.g., info@yourgym.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                name="website"
                defaultValue={settings.website || ''}
                placeholder="e.g., https://www.yourgym.com"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><Clock className="mr-2 h-5 w-5" /> Business Hours</CardTitle>
            <CardDescription>Set your gym's daily operating hours.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(settings.business_hours || {}).map(([day, hours]) => (
              <div key={day} className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor={day} className="capitalize">
                  {day}
                </Label>
                <Input
                  id={day}
                  name={`business_hours.${day}`}
                  defaultValue={hours as string}
                  className="col-span-2"
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><DollarSign className="mr-2 h-5 w-5" /> Financial Settings</CardTitle>
            <CardDescription>Configure currency and tax rates for your gym.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone *</Label>
              <Select name="timezone" defaultValue={settings.timezone} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a timezone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/Los_Angeles">America/Los_Angeles</SelectItem>
                  <SelectItem value="America/New_York">America/New_York</SelectItem>
                  <SelectItem value="Europe/London">Europe/London</SelectItem>
                  <SelectItem value="Asia/Tokyo">Asia/Tokyo</SelectItem>
                  {/* Add more timezones as needed */}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency *</Label>
              <Select name="currency" defaultValue={settings.currency} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD - United States Dollar</SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                  <SelectItem value="GBP">GBP - British Pound</SelectItem>
                  {/* Add more currencies as needed */}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tax_rate">Tax Rate (%)</Label>
              <Input
                id="tax_rate"
                name="tax_rate"
                type="number"
                step="0.01"
                defaultValue={settings.tax_rate}
              />
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
} 