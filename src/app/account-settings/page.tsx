'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { User, Mail, Lock, ArrowLeft, Save, Trash2, Shield, Bell } from 'lucide-react'

interface UserProfile {
  id: string
  email: string
  created_at: string
  user_metadata: {
    full_name?: string
    gym_name?: string
  }
}

export default function AccountSettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [notifications, setNotifications] = useState({
    emailUpdates: true,
    billingAlerts: true,
    securityAlerts: true,
    marketingEmails: false
  })
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadUserProfile()
  }, [])

  const loadUserProfile = async () => {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        router.push('/login')
        return
      }
      
      setUser(user)
      setProfile(user as UserProfile)
      
      // Set form data from user metadata
      setFormData({
        fullName: user.user_metadata?.full_name || '',
        email: user.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      
    } catch (error) {
      console.error('Error in loadUserProfile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleNotificationChange = (setting: string, value: boolean) => {
    setNotifications(prev => ({
      ...prev,
      [setting]: value
    }))
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      // Update user metadata
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: formData.fullName
        }
      })

      if (error) {
        console.error('Error updating profile:', error)
        alert('Failed to update profile. Please try again.')
        return
      }

      alert('Profile updated successfully!')
      loadUserProfile()
    } catch (error) {
      console.error('Error in handleSaveProfile:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      alert('New passwords do not match.')
      return
    }

    if (formData.newPassword.length < 8) {
      alert('New password must be at least 8 characters long.')
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: formData.newPassword
      })

      if (error) {
        console.error('Error changing password:', error)
        alert('Failed to change password. Please try again.')
        return
      }

      alert('Password changed successfully!')
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }))
    } catch (error) {
      console.error('Error in handleChangePassword:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    const confirmation = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your gyms, members, and data.'
    )
    
    if (!confirmation) return

    const secondConfirmation = window.prompt(
      'Type "DELETE" to confirm account deletion:'
    )
    
    if (secondConfirmation !== 'DELETE') {
      alert('Account deletion cancelled.')
      return
    }

    setSaving(true)
    try {
      // In a real app, you'd call a server function to handle account deletion
      // This would delete all user data, cancel subscriptions, etc.
      alert('Account deletion requested. You will receive an email confirmation.')
    } catch (error) {
      console.error('Error in handleDeleteAccount:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <User className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading account settings...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p>Unable to load account information.</p>
          <Button onClick={() => router.push('/gym-management')} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/gym-management')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
              <p className="text-gray-600 mt-1">
                Manage your account information and preferences
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5 text-blue-600" />
                <span>Profile Information</span>
              </CardTitle>
              <CardDescription>
                Update your personal information and account details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    placeholder="Enter your full name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    disabled
                    className="bg-gray-100"
                  />
                  <p className="text-xs text-gray-500">
                    Contact support to change your email address
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Account Created</Label>
                  <div className="p-2 bg-gray-50 rounded text-sm text-gray-600">
                    {formatDate(profile.created_at)}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Account Status</Label>
                  <div>
                    <Badge className="bg-green-500">Active</Badge>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <Button onClick={handleSaveProfile} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Profile'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Password & Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lock className="h-5 w-5 text-red-600" />
                <span>Password & Security</span>
              </CardTitle>
              <CardDescription>
                Change your password and manage security settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={formData.newPassword}
                    onChange={(e) => handleInputChange('newPassword', e.target.value)}
                    placeholder="Enter new password"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    placeholder="Confirm new password"
                  />
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start space-x-2">
                  <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">Security Requirements</h4>
                    <ul className="text-sm text-blue-800 mt-1 space-y-1">
                      <li>• At least 8 characters long</li>
                      <li>• Include uppercase and lowercase letters</li>
                      <li>• Include at least one number</li>
                      <li>• Use special characters for added security</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <Button 
                  onClick={handleChangePassword} 
                  disabled={saving || !formData.newPassword || !formData.confirmPassword}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  {saving ? 'Changing...' : 'Change Password'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Notification Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5 text-yellow-600" />
                <span>Notification Preferences</span>
              </CardTitle>
              <CardDescription>
                Choose what notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { key: 'emailUpdates', label: 'Email Updates', description: 'Receive updates about new features and improvements' },
                  { key: 'billingAlerts', label: 'Billing Alerts', description: 'Get notified about payment issues and billing changes' },
                  { key: 'securityAlerts', label: 'Security Alerts', description: 'Important security notifications and login alerts' },
                  { key: 'marketingEmails', label: 'Marketing Emails', description: 'Promotional content and special offers' }
                ].map((setting) => (
                  <div key={setting.key} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">{setting.label}</h4>
                      <p className="text-sm text-gray-500">{setting.description}</p>
                    </div>
                    <Button
                      variant={notifications[setting.key as keyof typeof notifications] ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleNotificationChange(setting.key, !notifications[setting.key as keyof typeof notifications])}
                    >
                      {notifications[setting.key as keyof typeof notifications] ? 'Enabled' : 'Disabled'}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-red-700">
                <Trash2 className="h-5 w-5" />
                <span>Danger Zone</span>
              </CardTitle>
              <CardDescription>
                Irreversible actions that will permanently affect your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-red-50 rounded-lg">
                <h4 className="font-medium text-red-900 mb-2">Delete Account</h4>
                <p className="text-sm text-red-800 mb-4">
                  Permanently delete your account and all associated data. This action cannot be undone.
                  All your gyms, members, payments, and subscription data will be permanently deleted.
                </p>
                <Button 
                  variant="outline" 
                  className="text-red-600 border-red-200 hover:bg-red-100"
                  onClick={handleDeleteAccount}
                  disabled={saving}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 