'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Search, Edit, Trash2, Users, DollarSign, Star, Clock, Loader2 } from 'lucide-react'
import { Trainer } from '@/lib/types'
import { getTrainers, getTrainerStats, createTrainer, updateTrainer, deleteTrainer, CreateTrainerData, UpdateTrainerData, TrainerStats } from '@/lib/services/trainers'

export default function TrainersPage() {
  const [trainers, setTrainers] = useState<Trainer[]>([])
  const [stats, setStats] = useState<TrainerStats>({
    totalTrainers: 0,
    activeTrainers: 0,
    avgHourlyRate: 0,
    specializations: []
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTrainer, setEditingTrainer] = useState<Trainer | null>(null)

  // Fetch data on component mount
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [trainersData, statsData] = await Promise.all([
        getTrainers(),
        getTrainerStats()
      ])
      setTrainers(trainersData)
      setStats(statsData)
    } catch (error) {
      console.error('Failed to load trainer data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredTrainers = trainers.filter(trainer =>
    `${trainer.first_name} ${trainer.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trainer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (trainer.specializations && trainer.specializations.some(spec => spec.toLowerCase().includes(searchTerm.toLowerCase())))
  )

  const handleSubmit = async (formData: FormData) => {
    try {
      const trainerData: CreateTrainerData | UpdateTrainerData = {
        first_name: formData.get('first_name') as string,
        last_name: formData.get('last_name') as string,
        email: formData.get('email') as string,
        phone: formData.get('phone') as string || undefined,
        specializations: (formData.get('specializations') as string)?.split(',').map(s => s.trim()).filter(s => s) || [],
        bio: formData.get('bio') as string || undefined,
        hourly_rate: formData.get('hourly_rate') ? parseFloat(formData.get('hourly_rate') as string) : undefined,
        is_active: formData.get('is_active') === 'true'
      }

      if (editingTrainer) {
        await updateTrainer(editingTrainer.id, trainerData as UpdateTrainerData)
      } else {
        await createTrainer(trainerData as CreateTrainerData)
      }

      await loadData() // Refresh data
      setIsDialogOpen(false)
      setEditingTrainer(null)
    } catch (error) {
      console.error('Failed to save trainer:', error)
    }
  }

  const handleEdit = (trainer: Trainer) => {
    setEditingTrainer(trainer)
    setIsDialogOpen(true)
  }

  const handleDelete = async (trainerId: string) => {
    if (confirm('Are you sure you want to delete this trainer?')) {
      try {
        await deleteTrainer(trainerId)
        await loadData() // Refresh data
      } catch (error) {
        console.error('Failed to delete trainer:', error)
      }
    }
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Trainers</h2>
          <p className="text-muted-foreground">
            Manage your gym trainers and their specializations
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingTrainer(null)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Trainer
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>
                  {editingTrainer ? 'Edit Trainer' : 'Add New Trainer'}
                </DialogTitle>
                <DialogDescription>
                  {editingTrainer ? 'Update trainer information' : 'Fill in the details to add a new trainer to your gym'}
                </DialogDescription>
              </DialogHeader>
              <form action={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name *</Label>
                    <Input
                      id="first_name"
                      name="first_name"
                      defaultValue={editingTrainer?.first_name}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name *</Label>
                    <Input
                      id="last_name"
                      name="last_name"
                      defaultValue={editingTrainer?.last_name}
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      defaultValue={editingTrainer?.email}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      name="phone"
                      defaultValue={editingTrainer?.phone || ''}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="specializations">Specializations</Label>
                  <Input
                    id="specializations"
                    name="specializations"
                    placeholder="e.g., HIIT, Yoga, Strength Training (comma separated)"
                    defaultValue={editingTrainer?.specializations?.join(', ') || ''}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hourly_rate">Hourly Rate ($)</Label>
                  <Input
                    id="hourly_rate"
                    name="hourly_rate"
                    type="number"
                    step="0.01"
                    defaultValue={editingTrainer?.hourly_rate}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    placeholder="Brief description of the trainer's background and expertise"
                    defaultValue={editingTrainer?.bio || ''}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="is_active">Status</Label>
                  <Select name="is_active" defaultValue={editingTrainer?.is_active ? 'true' : 'false'}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Active</SelectItem>
                      <SelectItem value="false">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingTrainer ? 'Update Trainer' : 'Add Trainer'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Trainers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTrainers}</div>
            <p className="text-xs text-muted-foreground">
              All registered trainers
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Trainers</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeTrainers}</div>
            <p className="text-xs text-muted-foreground">
              Currently active trainers
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Hourly Rate</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.avgHourlyRate.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">
              Average across all trainers
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Specializations</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.specializations.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Different specializations offered
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>All Trainers</CardTitle>
          <CardDescription>
            A list of all trainers in your gym
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search trainers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {/* Trainers Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTrainers.map((trainer) => (
              <Card key={trainer.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={trainer.profile_image_url || ''} />
                      <AvatarFallback>
                        {getInitials(trainer.first_name, trainer.last_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">
                          {trainer.first_name} {trainer.last_name}
                        </h3>
                        <Badge variant={trainer.is_active ? 'default' : 'secondary'}>
                          {trainer.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{trainer.email}</p>
                      <p className="text-sm text-muted-foreground">{trainer.phone}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-medium">Specializations:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {trainer.specializations?.map((spec, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {spec}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    {trainer.hourly_rate && (
                      <div>
                        <p className="text-sm font-medium">Hourly Rate: ${trainer.hourly_rate}</p>
                      </div>
                    )}
                    
                    {trainer.bio && (
                      <div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {trainer.bio}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-end space-x-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(trainer)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(trainer.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredTrainers.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No trainers found matching your search.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 