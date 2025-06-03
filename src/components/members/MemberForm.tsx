"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Member, MembershipPlan } from "@/lib/types"
import { CreateMemberData, UpdateMemberData, getMembershipPlans } from "@/lib/services/members"

interface MemberFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateMemberData | UpdateMemberData) => Promise<void>
  member?: Member | null
  isLoading?: boolean
}

export function MemberForm({ isOpen, onClose, onSubmit, member, isLoading = false }: MemberFormProps) {
  const [formData, setFormData] = useState<CreateMemberData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    membership_plan_id: '',
    membership_start_date: '',
    membership_end_date: '',
    notes: ''
  })
  const [membershipPlans, setMembershipPlans] = useState<MembershipPlan[]>([])
  const [isLoadingPlans, setIsLoadingPlans] = useState(false)

  // Load membership plans
  useEffect(() => {
    const loadPlans = async () => {
      setIsLoadingPlans(true)
      try {
        const plans = await getMembershipPlans()
        setMembershipPlans(plans)
      } catch (error) {
        console.error('Error loading membership plans:', error)
      } finally {
        setIsLoadingPlans(false)
      }
    }

    if (isOpen) {
      loadPlans()
    }
  }, [isOpen])

  // Populate form when editing
  useEffect(() => {
    if (member) {
      setFormData({
        first_name: member.first_name || '',
        last_name: member.last_name || '',
        email: member.email || '',
        phone: member.phone || '',
        date_of_birth: member.date_of_birth || '',
        emergency_contact_name: member.emergency_contact_name || '',
        emergency_contact_phone: member.emergency_contact_phone || '',
        membership_plan_id: member.membership_plan_id || '',
        membership_start_date: member.membership_start_date || '',
        membership_end_date: member.membership_end_date || '',
        notes: member.notes || ''
      })
    } else {
      // Reset form for new member
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        date_of_birth: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        membership_plan_id: '',
        membership_start_date: '',
        membership_end_date: '',
        notes: ''
      })
    }
  }, [member, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
  }

  const handleInputChange = (field: keyof CreateMemberData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const calculateEndDate = (startDate: string, planId: string) => {
    if (!startDate || !planId) return ''
    
    const plan = membershipPlans.find(p => p.id === planId)
    if (!plan) return ''

    const start = new Date(startDate)
    const end = new Date(start)
    end.setMonth(end.getMonth() + plan.duration_months)
    
    return end.toISOString().split('T')[0]
  }

  // Auto-calculate end date when start date or plan changes
  useEffect(() => {
    if (formData.membership_start_date && formData.membership_plan_id) {
      const endDate = calculateEndDate(formData.membership_start_date, formData.membership_plan_id)
      if (endDate) {
        setFormData(prev => ({ ...prev, membership_end_date: endDate }))
      }
    }
  }, [formData.membership_start_date, formData.membership_plan_id, membershipPlans])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {member ? 'Edit Member' : 'Add New Member'}
          </DialogTitle>
          <DialogDescription>
            {member ? 'Update member information' : 'Fill in the details to add a new member to your gym'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Personal Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => handleInputChange('first_name', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name *</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => handleInputChange('last_name', e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date_of_birth">Date of Birth</Label>
              <Input
                id="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
              />
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Emergency Contact</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergency_contact_name">Contact Name</Label>
                <Input
                  id="emergency_contact_name"
                  value={formData.emergency_contact_name}
                  onChange={(e) => handleInputChange('emergency_contact_name', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergency_contact_phone">Contact Phone</Label>
                <Input
                  id="emergency_contact_phone"
                  type="tel"
                  value={formData.emergency_contact_phone}
                  onChange={(e) => handleInputChange('emergency_contact_phone', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Membership Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Membership Information</h3>
            <div className="space-y-2">
              <Label htmlFor="membership_plan_id">Membership Plan</Label>
              <Select
                value={formData.membership_plan_id}
                onValueChange={(value) => handleInputChange('membership_plan_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a membership plan" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingPlans ? (
                    <SelectItem value="loading" disabled>Loading plans...</SelectItem>
                  ) : (
                    membershipPlans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name} - ${plan.price}/{plan.duration_months} month{plan.duration_months > 1 ? 's' : ''}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="membership_start_date">Start Date</Label>
                <Input
                  id="membership_start_date"
                  type="date"
                  value={formData.membership_start_date}
                  onChange={(e) => handleInputChange('membership_start_date', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="membership_end_date">End Date</Label>
                <Input
                  id="membership_end_date"
                  type="date"
                  value={formData.membership_end_date}
                  onChange={(e) => handleInputChange('membership_end_date', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Any additional notes about the member..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : member ? 'Update Member' : 'Add Member'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 