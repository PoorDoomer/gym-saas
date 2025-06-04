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
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Search, Edit, Trash2, Users, DollarSign, Star, Clock, Trophy, Activity, Key, Copy, Eye, EyeOff, X } from 'lucide-react'
import { PageLoader, CardSkeleton } from '@/components/ui/loading-spinner'
import { useTranslation } from '@/lib/i18n'
import { Trainer } from '@/lib/types'
import { getTrainers, getTrainerStats, createTrainer, updateTrainer, deleteTrainer, CreateTrainerData, UpdateTrainerData, TrainerStats, TrainerWithSports, CreateTrainerResult } from '@/lib/services/trainers'
import { getSports, Sport } from '@/lib/services/sports'

export default function TrainersPage() {
  const { t } = useTranslation()
  const [trainers, setTrainers] = useState<TrainerWithSports[]>([])
  const [sports, setSports] = useState<Sport[]>([])
  const [stats, setStats] = useState<TrainerStats>({
    totalTrainers: 0,
    activeTrainers: 0,
    avgHourlyRate: 0,
    specializations: [],
    mostCommonSports: []
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTrainer, setEditingTrainer] = useState<TrainerWithSports | null>(null)
  const [selectedSports, setSelectedSports] = useState<Array<{sport_id: string, skill_level: string}>>([])
  const [createdTrainerCredentials, setCreatedTrainerCredentials] = useState<{
    email: string
    password: string
    name: string
  } | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  // Fetch data on component mount
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [trainersData, statsData, sportsData] = await Promise.all([
        getTrainers(),
        getTrainerStats(),
        getSports()
      ])
      setTrainers(trainersData)
      setStats(statsData)
      setSports(sportsData.filter(s => s.is_active))
    } catch (error) {
      console.error('Failed to load trainer data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredTrainers = trainers.filter(trainer =>
    `${trainer.first_name} ${trainer.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trainer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (trainer.specializations && trainer.specializations.some(spec => spec.toLowerCase().includes(searchTerm.toLowerCase()))) ||
    (trainer.trainer_sports && trainer.trainer_sports.some(ts => ts.sport.name.toLowerCase().includes(searchTerm.toLowerCase())))
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
        is_active: formData.get('is_active') === 'true',
        selected_sports: selectedSports.map(s => ({
          sport_id: s.sport_id,
          skill_level: s.skill_level as 'beginner' | 'intermediate' | 'advanced' | 'expert'
        }))
      }

      if (editingTrainer) {
        await updateTrainer(editingTrainer.id, trainerData as UpdateTrainerData)
        setCreatedTrainerCredentials(null)
      } else {
        const result: CreateTrainerResult = await createTrainer(trainerData as CreateTrainerData)
        
        if (result.success && result.user_account) {
          // Show the generated credentials
          setCreatedTrainerCredentials({
            email: result.user_account.email,
            password: result.user_account.temporary_password,
            name: `${trainerData.first_name} ${trainerData.last_name}`
          })
        } else {
          alert(`Failed to create trainer: ${result.error || 'Unknown error'}`)
          return
        }
      }

      await loadData() // Refresh data
      setIsDialogOpen(false)
      setEditingTrainer(null)
      setSelectedSports([])
      
      // Don't close credentials dialog, let user close it manually
      if (!editingTrainer) {
        // Show success message for new trainer
        console.log('Trainer created successfully with credentials:', createdTrainerCredentials)
      }
    } catch (error) {
      console.error('Failed to save trainer:', error)
      alert('An error occurred while saving the trainer. Please try again.')
    }
  }

  const handleEdit = (trainer: TrainerWithSports) => {
    setEditingTrainer(trainer)
    // Set selected sports from trainer data
    const currentSports = trainer.trainer_sports?.map(ts => ({
      sport_id: ts.sport_id,
      skill_level: ts.skill_level
    })) || []
    setSelectedSports(currentSports)
    setIsDialogOpen(true)
  }

  const handleDelete = async (trainerId: string) => {
    if (confirm(t('trainers.deleteConfirm'))) {
      try {
        await deleteTrainer(trainerId)
        await loadData() // Refresh data
      } catch (error) {
        console.error('Failed to delete trainer:', error)
      }
    }
  }

  const handleSportToggle = (sportId: string, checked: boolean | string) => {
    const isChecked = checked === true || checked === 'true'
    if (isChecked) {
      setSelectedSports(prev => [...prev, { sport_id: sportId, skill_level: 'intermediate' }])
    } else {
      setSelectedSports(prev => prev.filter(s => s.sport_id !== sportId))
    }
  }

  const handleSkillLevelChange = (sportId: string, skillLevel: string) => {
    setSelectedSports(prev => prev.map(s => 
      s.sport_id === sportId ? { ...s, skill_level: skillLevel } : s
    ))
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // You could add a toast notification here
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`
  }

  const getSkillLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800'
      case 'advanced': return 'bg-orange-100 text-orange-800'
      case 'expert': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return <PageLoader text={t('common.loading')} />
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t('trainers.title')}</h2>
          <p className="text-muted-foreground">
            {t('trainers.subtitle')}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingTrainer(null)} className="cursor-pointer">
                <Plus className="mr-2 h-4 w-4" />
                {t('trainers.addTrainer')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>
                  {editingTrainer ? t('trainers.editTrainer') : t('trainers.addTrainer')}
                </DialogTitle>
                <DialogDescription>
                  {editingTrainer ? t('trainers.editTrainer') : t('trainers.bioPlaceholder')}
                </DialogDescription>
              </DialogHeader>
              <form action={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">{t('trainers.firstName')} *</Label>
                    <Input
                      id="first_name"
                      name="first_name"
                      defaultValue={editingTrainer?.first_name}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">{t('trainers.lastName')} *</Label>
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
                    <Label htmlFor="email">{t('trainers.email')} *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      defaultValue={editingTrainer?.email}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">{t('trainers.phone')}</Label>
                    <Input
                      id="phone"
                      name="phone"
                      defaultValue={editingTrainer?.phone || ''}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="specializations">{t('trainers.specializations')}</Label>
                  <Input
                    id="specializations"
                    name="specializations"
                    placeholder={t('trainers.specializationsPlaceholder')}
                    defaultValue={editingTrainer?.specializations?.join(', ') || ''}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hourly_rate">{t('trainers.hourlyRate')} ($)</Label>
                  <Input
                    id="hourly_rate"
                    name="hourly_rate"
                    type="number"
                    step="0.01"
                    defaultValue={editingTrainer?.hourly_rate}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">{t('trainers.bio')}</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    placeholder={t('trainers.bioPlaceholder')}
                    defaultValue={editingTrainer?.bio || ''}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="is_active">{t('common.status')}</Label>
                  <Select name="is_active" defaultValue={editingTrainer?.is_active ? 'true' : 'false'}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">{t('common.active')}</SelectItem>
                      <SelectItem value="false">{t('common.inactive')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="selected_sports">{t('trainers.selectedSports')}</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {sports.map((sport) => {
                      const isSelected = selectedSports.some(s => s.sport_id === sport.id)
                      const selectedSport = selectedSports.find(s => s.sport_id === sport.id)
                      
                      return (
                        <div key={sport.id} className="border rounded-lg p-3 space-y-2">
                          <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`sport_${sport.id}`}
                              checked={isSelected}
                        onCheckedChange={(checked) => handleSportToggle(sport.id, checked)}
                              className="cursor-pointer"
                            />
                            <Label 
                              htmlFor={`sport_${sport.id}`} 
                              className={`cursor-pointer font-medium ${isSelected ? 'text-blue-600' : 'text-gray-700'}`}
                      >
                        {sport.name}
                            </Label>
                            {isSelected && (
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600">
                                Selected
                              </Badge>
                            )}
                </div>

                          {isSelected && (
                            <div className="mt-2">
                      <Select
                                value={selectedSport?.skill_level || 'intermediate'}
                                onValueChange={(value) => handleSkillLevelChange(sport.id, value)}
                      >
                                <SelectTrigger className="h-8 text-sm">
                                  <SelectValue placeholder="Select skill level" />
                        </SelectTrigger>
                        <SelectContent>
                                  <SelectItem value="beginner">
                                    <div className="flex items-center space-x-2">
                                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                      <span>Beginner</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="intermediate">
                                    <div className="flex items-center space-x-2">
                                      <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                      <span>Intermediate</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="advanced">
                                    <div className="flex items-center space-x-2">
                                      <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                                      <span>Advanced</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="expert">
                                    <div className="flex items-center space-x-2">
                                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                      <span>Expert</span>
                                    </div>
                                  </SelectItem>
                        </SelectContent>
                      </Select>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                  
                  {selectedSports.length > 0 && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm font-medium text-blue-900 mb-2">Selected Sports Summary:</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedSports.map((selectedSport) => {
                          const sport = sports.find(s => s.id === selectedSport.sport_id)
                          return (
                            <Badge 
                              key={selectedSport.sport_id}
                              className={`${getSkillLevelColor(selectedSport.skill_level)} cursor-pointer`}
                              onClick={() => handleSportToggle(selectedSport.sport_id, false)}
                              title="Click to remove"
                            >
                              {sport?.name} ({selectedSport.skill_level})
                              <X className="ml-1 h-3 w-3" />
                            </Badge>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="cursor-pointer">
                    {t('common.cancel')}
                  </Button>
                  <Button type="submit" className="cursor-pointer">
                    {editingTrainer ? t('common.saveChanges') : t('common.add')}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('trainers.totalTrainers')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTrainers}</div>
            <p className="text-xs text-muted-foreground">
              Total trainers
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('trainers.activeTrainers')}</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeTrainers}</div>
            <p className="text-xs text-muted-foreground">
              Currently active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Hourly Rate</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.avgHourlyRate}</div>
            <p className="text-xs text-muted-foreground">
              Average rate
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Popular Sports</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.mostCommonSports.length}</div>
            <p className="text-xs text-muted-foreground">
              {stats.mostCommonSports.slice(0, 2).join(', ') || 'None yet'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Trainers List */}
      <Card>
        <CardHeader>
          <CardTitle>{t('trainers.title')}</CardTitle>
          <CardDescription>
            Manage trainer profiles and their sports specializations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-6">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search trainers by name, email, or sports..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>

          {/* Trainers Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
            ) : filteredTrainers.length === 0 ? (
              <div className="col-span-full text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No trainers found</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? 'Try adjusting your search terms' : 'Add your first trainer to get started'}
                </p>
              </div>
            ) : (
              filteredTrainers.map((trainer) => (
                <Card key={trainer.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={trainer.profile_image_url} />
                          <AvatarFallback>
                            {getInitials(trainer.first_name, trainer.last_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">
                            {trainer.first_name} {trainer.last_name}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">{trainer.email}</p>
                          {trainer.phone && (
                            <p className="text-sm text-muted-foreground">{trainer.phone}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(trainer)} className="cursor-pointer">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(trainer.id)} className="cursor-pointer">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Badge variant={trainer.is_active ? "default" : "secondary"}>
                          {trainer.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        {trainer.hourly_rate && (
                          <Badge variant="outline">
                            ${trainer.hourly_rate}/hr
                          </Badge>
                        )}
                      </div>

                      {trainer.trainer_sports && trainer.trainer_sports.length > 0 && (
                        <div>
                          <p className="font-medium text-sm mb-2">Sports & Skills:</p>
                          <div className="flex flex-wrap gap-1">
                            {trainer.trainer_sports.slice(0, 3).map((ts, idx) => (
                              <Badge 
                                key={idx} 
                                className={`text-xs ${getSkillLevelColor(ts.skill_level)}`}
                              >
                                {ts.sport.name} ({ts.skill_level})
                              </Badge>
                            ))}
                            {trainer.trainer_sports.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{trainer.trainer_sports.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {trainer.specializations && trainer.specializations.length > 0 && (
                        <div>
                          <p className="font-medium text-sm mb-1">Specializations:</p>
                          <div className="flex flex-wrap gap-1">
                            {trainer.specializations.slice(0, 3).map((spec, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {spec}
                              </Badge>
                            ))}
                            {trainer.specializations.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{trainer.specializations.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {trainer.bio && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {trainer.bio}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Trainer Credentials Dialog */}
      <Dialog open={!!createdTrainerCredentials} onOpenChange={(open) => !open && setCreatedTrainerCredentials(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-green-600">
              <Key className="h-6 w-6" />
              <span>Trainer Account Created!</span>
            </DialogTitle>
            <DialogDescription>
              A new trainer account has been created with the following login credentials.
              Please share these securely with the trainer.
            </DialogDescription>
          </DialogHeader>
          
          {createdTrainerCredentials && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-800 mb-3">
                  Account for: {createdTrainerCredentials.name}
                </h4>
                
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-green-700">Email Address</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Input 
                        value={createdTrainerCredentials.email} 
                        readOnly 
                        className="bg-white"
                      />
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => copyToClipboard(createdTrainerCredentials.email)}
                        className="cursor-pointer"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-green-700">Temporary Password</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Input 
                        type={showPassword ? "text" : "password"}
                        value={createdTrainerCredentials.password} 
                        readOnly 
                        className="bg-white font-mono"
                      />
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setShowPassword(!showPassword)}
                        className="cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => copyToClipboard(createdTrainerCredentials.password)}
                        className="cursor-pointer"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-800 mb-2">📋 Next Steps:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>1. Share these credentials securely with the trainer</li>
                  <li>2. Ask them to log in and change their password</li>
                  <li>3. Trainer can access their portal at: <code className="bg-blue-100 px-1 rounded">/trainer-dashboard</code></li>
                  <li>4. They can manage their classes, schedules, and member interactions</li>
                </ul>
              </div>

              <div className="flex justify-between">
                <Button 
                  variant="outline"
                  onClick={() => {
                    const credentials = `Email: ${createdTrainerCredentials.email}\nPassword: ${createdTrainerCredentials.password}`
                    copyToClipboard(credentials)
                  }}
                  className="cursor-pointer"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy All
                </Button>
                <Button onClick={() => setCreatedTrainerCredentials(null)} className="cursor-pointer">
                  Got it!
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 