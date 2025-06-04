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
import { useGym } from '@/lib/contexts/GymContext'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export default function SettingsPage() {
  const { currentGym } = useGym()
  const [settings, setSettings] = useState<GymSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (currentGym) {
      // Use actual gym data with default values for missing fields
      const gymSettings: GymSettings = {
        id: currentGym.id,
        gym_name: currentGym.name,
        logo_url: currentGym.logo_url || undefined,
        address: currentGym.address || '',
        phone: currentGym.phone || '',
        email: currentGym.email || '',
        website: currentGym.website || '',
      business_hours: {
        monday: '6:00 AM - 10:00 PM',
        tuesday: '6:00 AM - 10:00 PM',
        wednesday: '6:00 AM - 10:00 PM',
        thursday: '6:00 AM - 10:00 PM',
        friday: '6:00 AM - 9:00 PM',
        saturday: '8:00 AM - 6:00 PM',
        sunday: '8:00 AM - 4:00 PM',
      },
        timezone: currentGym.timezone || 'America/Los_Angeles',
        currency: 'USD', // Default value
        tax_rate: 8.5, // Default value
        created_at: new Date().toISOString(), // Default value
        updated_at: new Date().toISOString(), // Default value
      }
      setSettings(gymSettings)
      setLoading(false)
    }
  }, [currentGym])

  const handleSave = async (formData: FormData) => {
    if (!currentGym) return

    setIsSaving(true)
    try {
      // Convert FormData to object
      const formObject = Object.fromEntries(formData)
      
      // Update gym in database - only update fields that exist in the gyms table
      const { error } = await supabase
        .from('gyms')
        .update({
          name: formObject.gym_name,
          logo_url: formObject.logo_url || null,
          address: formObject.address || null,
          phone: formObject.phone || null,
          email: formObject.email || null,
          website: formObject.website || null,
          timezone: formObject.timezone,
        })
        .eq('id', currentGym.id)
      
      if (error) {
        console.error('Error updating gym settings:', error)
        alert('Failed to save settings. Please try again.')
      } else {
        alert('Settings saved successfully!')
        // Refresh the gym data
        window.location.reload()
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Failed to save settings. Please try again.')
    } finally {
    setIsSaving(false)
    }
  }

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading settings...</p>
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
        <Button type="submit" form="settings-form" disabled={isSaving} className="cursor-pointer">
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
                  <SelectItem value="Europe/Paris">Europe/Paris</SelectItem>
                  <SelectItem value="Australia/Sydney">Australia/Sydney</SelectItem>
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
                  <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                  <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
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
                placeholder="e.g., 8.5"
              />
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
} 