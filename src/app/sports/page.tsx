'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Search, Edit, Trash2, Trophy, Activity, Target, TrendingUp } from 'lucide-react'
import { PageLoader, CardSkeleton } from '@/components/ui/loading-spinner'
import { Sport, SportsStats, CreateSportData, UpdateSportData, getSports, getSportsStats, createSport, updateSport, deleteSport } from '@/lib/services/sports'

export default function SportsPage() {
  const [sports, setSports] = useState<Sport[]>([])
  const [stats, setStats] = useState<SportsStats>({
    totalSports: 0,
    activeSports: 0,
    categories: [],
    mostPopularSport: null
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSport, setEditingSport] = useState<Sport | null>(null)

  // Fetch data on component mount
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [sportsData, statsData] = await Promise.all([
        getSports(),
        getSportsStats()
      ])
      setSports(sportsData)
      setStats(statsData)
    } catch (error) {
      console.error('Failed to load sports data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredSports = sports.filter(sport =>
    sport.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sport.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (sport.description && sport.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleSubmit = async (formData: FormData) => {
    try {
      const equipmentList = (formData.get('equipment_needed') as string)?.split(',').map(e => e.trim()).filter(e => e) || []
      
      const sportData: CreateSportData | UpdateSportData = {
        name: formData.get('name') as string,
        description: formData.get('description') as string || undefined,
        category: formData.get('category') as string,
        equipment_needed: equipmentList.length > 0 ? equipmentList : undefined,
        difficulty_level: formData.get('difficulty_level') as 'beginner' | 'intermediate' | 'advanced' | 'all',
        is_active: formData.get('is_active') === 'true'
      }

      if (editingSport) {
        await updateSport(editingSport.id, sportData as UpdateSportData)
      } else {
        await createSport(sportData as CreateSportData)
      }

      await loadData() // Refresh data
      setIsDialogOpen(false)
      setEditingSport(null)
    } catch (error) {
      console.error('Failed to save sport:', error)
    }
  }

  const handleEdit = (sport: Sport) => {
    setEditingSport(sport)
    setIsDialogOpen(true)
  }

  const handleDelete = async (sportId: string) => {
    if (confirm('Are you sure you want to delete this sport?')) {
      try {
        await deleteSport(sportId)
        await loadData() // Refresh data
      } catch (error) {
        console.error('Failed to delete sport:', error)
      }
    }
  }

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800'
      case 'advanced': return 'bg-red-100 text-red-800'
      case 'all': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'cardio': return 'bg-red-100 text-red-800'
      case 'strength': return 'bg-orange-100 text-orange-800'
      case 'flexibility': return 'bg-green-100 text-green-800'
      case 'martial-arts': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return <PageLoader text="Loading sports..." />
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Sports Management</h2>
          <p className="text-muted-foreground">
            Manage sports activities and trainer specializations
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingSport(null)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Sport
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>
                  {editingSport ? 'Edit Sport' : 'Add Sport'}
                </DialogTitle>
                <DialogDescription>
                  Create and manage sports activities for your gym
                </DialogDescription>
              </DialogHeader>
              <form action={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Sport Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      defaultValue={editingSport?.name}
                      required
                      placeholder="e.g., Yoga, HIIT, Boxing"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select name="category" defaultValue={editingSport?.category}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cardio">Cardio</SelectItem>
                        <SelectItem value="strength">Strength</SelectItem>
                        <SelectItem value="flexibility">Flexibility</SelectItem>
                        <SelectItem value="martial-arts">Martial Arts</SelectItem>
                        <SelectItem value="aquatic">Aquatic</SelectItem>
                        <SelectItem value="dance">Dance</SelectItem>
                        <SelectItem value="outdoor">Outdoor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="difficulty_level">Difficulty Level *</Label>
                    <Select name="difficulty_level" defaultValue={editingSport?.difficulty_level}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select difficulty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Levels</SelectItem>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="is_active">Status</Label>
                    <Select name="is_active" defaultValue={editingSport?.is_active ? 'true' : 'false'}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Active</SelectItem>
                        <SelectItem value="false">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="equipment_needed">Equipment Needed</Label>
                  <Input
                    id="equipment_needed"
                    name="equipment_needed"
                    placeholder="e.g., Yoga mat, Dumbbells, Gloves (comma separated)"
                    defaultValue={editingSport?.equipment_needed?.join(', ') || ''}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Describe this sport and its benefits..."
                    defaultValue={editingSport?.description || ''}
                    rows={3}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingSport ? 'Save Changes' : 'Add Sport'}
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
            <CardTitle className="text-sm font-medium">Total Sports</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSports}</div>
            <p className="text-xs text-muted-foreground">
              Available sports activities
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sports</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeSports}</div>
            <p className="text-xs text-muted-foreground">
              Currently offered
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.categories.length}</div>
            <p className="text-xs text-muted-foreground">
              Sport categories
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Popular</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.mostPopularSport || 'N/A'}</div>
            <p className="text-xs text-muted-foreground">
              By trainer count
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sports List */}
      <Card>
        <CardHeader>
          <CardTitle>Sports Activities</CardTitle>
          <CardDescription>
            Manage all sports and activities offered at your gym
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-6">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search sports by name, category or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>

          {/* Sports Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
            ) : filteredSports.length === 0 ? (
              <div className="col-span-full text-center py-8">
                <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No sports found</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? 'Try adjusting your search terms' : 'Add your first sport to get started'}
                </p>
              </div>
            ) : (
              filteredSports.map((sport) => (
                <Card key={sport.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <CardTitle className="text-lg">{sport.name}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge className={getCategoryColor(sport.category)}>
                            {sport.category.replace('-', ' ')}
                          </Badge>
                          <Badge className={getDifficultyColor(sport.difficulty_level)}>
                            {sport.difficulty_level}
                          </Badge>
                          <Badge variant={sport.is_active ? "default" : "secondary"}>
                            {sport.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(sport)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(sport.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2 text-sm">
                      {sport.description && (
                        <p className="text-muted-foreground line-clamp-2">
                          {sport.description}
                        </p>
                      )}
                      {sport.equipment_needed && sport.equipment_needed.length > 0 && (
                        <div>
                          <p className="font-medium text-xs mb-1">Equipment needed:</p>
                          <div className="flex flex-wrap gap-1">
                            {sport.equipment_needed.slice(0, 3).map((equipment, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {equipment}
                              </Badge>
                            ))}
                            {sport.equipment_needed.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{sport.equipment_needed.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 