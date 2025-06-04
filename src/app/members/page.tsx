"use client"

import { useState, useEffect } from 'react'
import DOMPurify from 'dompurify'
import { memberSchema, MemberSchema } from '@/lib/validation/memberSchema'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  UserPlus, 
  Search, 
  Edit, 
  Trash2, 
  Mail, 
  Phone,
  Calendar,
  DollarSign,
  TrendingUp,
  Activity,
  Loader2,
  QrCode,
  Download
} from 'lucide-react'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Member } from '@/lib/types'
import { getMembers, getMemberStats, createMember, updateMember, deleteMember, getMembershipPlans } from '@/lib/services/members'
import { useTranslation } from '@/lib/i18n'

type MemberFormData = MemberSchema

interface MembershipPlan {
  id: string
  name: string
  price: number
  duration_months: number
}

export default function MembersPage() {
  const { t } = useTranslation()
  const [members, setMembers] = useState<Member[]>([])
  const [membershipPlans, setMembershipPlans] = useState<MembershipPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const [qrDialogOpen, setQrDialogOpen] = useState(false)
  const [selectedMemberForQr, setSelectedMemberForQr] = useState<Member | null>(null)
  const [formData, setFormData] = useState<MemberFormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    membership_plan_id: '',
    notes: ''
  })
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    newThisMonth: 0,
    revenue: 0
  })

  // Fetch data on component mount
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [membersResponse, statsData, plansData] = await Promise.all([
        getMembers({ limit: 1000 }), // Get all members by setting a high limit
        getMemberStats(),
        getMembershipPlans()
      ])
      
      console.log('Members loaded:', membersResponse.data.length, membersResponse.data)
      console.log('Stats loaded:', statsData)
      console.log('Plans loaded:', plansData.length, plansData)
      
      setMembers(membersResponse.data)
      setStats(statsData)
      setMembershipPlans(plansData)
    } catch (error) {
      console.error('Failed to load data:', error)
      // Set empty arrays on error to prevent undefined issues
      setMembers([])
      setMembershipPlans([])
    } finally {
      setLoading(false)
    }
  }

  const filteredMembers = members.filter(member => {
    const fullName = `${member.first_name} ${member.last_name}`.toLowerCase()
    const email = member.email.toLowerCase()
    const search = searchTerm.toLowerCase()
    return fullName.includes(search) || email.includes(search)
  })

  const handleSubmit = async () => {
    try {
      const parsed = memberSchema.safeParse(formData)
      if (!parsed.success) {
        alert(parsed.error.errors[0].message)
        return
      }

      const sanitized: MemberSchema = {
        ...parsed.data,
        notes: DOMPurify.sanitize(parsed.data.notes || ''),
        // Convert empty string to null for UUID fields to prevent database errors
        membership_plan_id: parsed.data.membership_plan_id || undefined
      }

      if (editingMember) {
        await updateMember(editingMember.id, sanitized)
      } else {
        // Create member record (user account creation requires admin setup)
        const result = await createMember(sanitized)
        if (!result) {
          alert('Failed to create member. Please try again.')
          return
        }
        
        alert(`Member "${sanitized.first_name} ${sanitized.last_name}" created successfully!\n\nNote: User account creation requires admin configuration. The member record has been created and can be used for gym management.`)
      }
      await loadData() // Refresh data
      handleCloseDialog()
    } catch (error) {
      console.error('Failed to save member:', error)
      alert('Failed to save member. Please try again.')
    }
  }

  const handleEdit = (member: Member) => {
    setEditingMember(member)
    setFormData({
      first_name: member.first_name,
      last_name: member.last_name,
      email: member.email,
      phone: member.phone || '',
      date_of_birth: member.date_of_birth || '',
      emergency_contact_name: member.emergency_contact_name || '',
      emergency_contact_phone: member.emergency_contact_phone || '',
      membership_plan_id: member.membership_plan_id || '',
      notes: member.notes || ''
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this member?')) {
      try {
        await deleteMember(id)
        await loadData() // Refresh data
      } catch (error) {
        console.error('Failed to delete member:', error)
      }
    }
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingMember(null)
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      date_of_birth: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      membership_plan_id: '',
      notes: ''
    })
  }

  const generateQRCode = (member: Member) => {
    setSelectedMemberForQr(member)
    setQrDialogOpen(true)
  }

  const downloadQRCode = () => {
    if (!selectedMemberForQr) return
    
    // Create a simple QR code using a free API (or implement your own)
    const qrData = `MEMBER:${selectedMemberForQr.id}:${selectedMemberForQr.first_name} ${selectedMemberForQr.last_name}`
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`
    
    // Create download link
    const link = document.createElement('a')
    link.href = qrCodeUrl
    link.download = `${selectedMemberForQr.first_name}_${selectedMemberForQr.last_name}_QR.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getPlanName = (planId: string) => {
    const plan = membershipPlans.find(p => p.id === planId)
    return plan ? plan.name : 'No Plan'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('members.title')}</h1>
          <p className="text-muted-foreground">{t('members.subtitle')}</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingMember(null)} className="cursor-pointer">
              <UserPlus className="mr-2 h-4 w-4" />
              {t('members.addMember')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingMember ? t('members.editMember') : t('members.addMember')}
              </DialogTitle>
              <DialogDescription>
                {editingMember ? 'Update member information' : 'Enter member details to add them to your gym'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">{t('members.firstName')}</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                    placeholder="John"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">{t('members.lastName')}</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                    placeholder="Doe"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t('common.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="john@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{t('common.phone')}</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="+1 234 567 8900"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date_of_birth">Date of Birth</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="membership_plan_id">Membership Plan</Label>
                <Select
                  value={formData.membership_plan_id}
                  onValueChange={(value) => setFormData({...formData, membership_plan_id: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a membership plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {membershipPlans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name} - ${plan.price}/{plan.duration_months}mo
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergency_contact_name">{t('members.emergencyContact')}</Label>
                <Input
                  id="emergency_contact_name"
                  value={formData.emergency_contact_name}
                  onChange={(e) => setFormData({...formData, emergency_contact_name: e.target.value})}
                  placeholder="Contact Name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergency_contact_phone">{t('members.emergencyPhone')}</Label>
                <Input
                  id="emergency_contact_phone"
                  value={formData.emergency_contact_phone}
                  onChange={(e) => setFormData({...formData, emergency_contact_phone: e.target.value})}
                  placeholder="+1 234 567 8900"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">{t('members.notes')}</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Additional notes..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCloseDialog} className="cursor-pointer">
                {t('common.cancel')}
              </Button>
              <Button onClick={handleSubmit} className="cursor-pointer">
                {editingMember ? t('common.edit') : t('common.add')} {t('nav.members')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* QR Code Dialog */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Member QR Code</DialogTitle>
            <DialogDescription>
              QR Code for {selectedMemberForQr?.first_name} {selectedMemberForQr?.last_name}
            </DialogDescription>
          </DialogHeader>
          {selectedMemberForQr && (
            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 border rounded-lg bg-white">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`MEMBER:${selectedMemberForQr.id}:${selectedMemberForQr.first_name} ${selectedMemberForQr.last_name}`)}`}
                  alt="Member QR Code"
                  className="w-48 h-48"
                />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Scan this QR code for quick check-in
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setQrDialogOpen(false)} className="cursor-pointer">
              Close
            </Button>
            <Button onClick={downloadQRCode} className="cursor-pointer">
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('members.totalMembers')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMembers}</div>
            <p className="text-xs text-muted-foreground">
              All registered members
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('members.activeMembers')}</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeMembers}</div>
            <p className="text-xs text-muted-foreground">
              Currently active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('members.newThisMonth')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.newThisMonth}</div>
            <p className="text-xs text-muted-foreground">
              New registrations
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('members.monthlyRevenue')}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.revenue}</div>
            <p className="text-xs text-muted-foreground">
              Estimated monthly
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Members List</CardTitle>
          <CardDescription>
            View and manage all gym members
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('members.searchPlaceholder')}
              aria-label="Search members"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>

          {/* Members Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMembers.map((member) => (
              <Card key={member.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {member.first_name} {member.last_name}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={member.is_active ? "default" : "secondary"}>
                          {member.is_active ? t('common.active') : t('common.inactive')}
                        </Badge>
                        {member.membership_plan_id && (
                          <Badge variant="outline">
                            {getPlanName(member.membership_plan_id)}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => generateQRCode(member)}
                        title="Generate QR Code"
                        className="cursor-pointer"
                      >
                        <QrCode className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEdit(member)}
                        className="cursor-pointer"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDelete(member.id)}
                        className="cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">{member.email}</span>
                    </div>
                    {member.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">{member.phone}</span>
                      </div>
                    )}
                    {member.date_of_birth && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          Born: {new Date(member.date_of_birth).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {t('members.joinedDate')} {new Date(member.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredMembers.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">{t('members.noMembersFound')}</h3>
              <p className="text-muted-foreground">
                {searchTerm ? 'Try adjusting your search criteria' : 'Add your first member to get started'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}