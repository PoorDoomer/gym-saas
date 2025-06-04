"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { 
  Calendar, 
  Plus, 
  Search, 
  Filter,
  Clock,
  Users,
  MapPin,
  Edit,
  Trash2,
  Eye,
  CalendarPlus,
  Loader2
} from "lucide-react"
import { useTranslation } from "@/lib/i18n"
import { getTodaysClassSchedules, getUpcomingClassSchedules, getClassStats, createClass, updateClass, deleteClass, updateClassSchedule, createClassSchedule, getClasses, CreateClassData, CreateClassScheduleData } from "@/lib/services/classes"
import { ClassSchedule, Class } from "@/lib/types"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"


interface ClassFormData {
  name: string
  description?: string
  trainer_id?: string
  capacity: number
  duration_minutes: number
  location?: string
}

interface ClassScheduleFormData {
  class_id: string
  scheduled_time: string
  date: string
  trainer_id?: string
  location?: string
}

export default function ClassesPage() {
  const { t } = useTranslation()
  const [todaysClasses, setTodaysClasses] = useState<ClassSchedule[]>([])
  const [upcomingClasses, setUpcomingClasses] = useState<ClassSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isClassDialogOpen, setIsClassDialogOpen] = useState(false)
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false)
  const [editingClass, setEditingClass] = useState<Class | null>(null)
  const [editingSchedule, setEditingSchedule] = useState<ClassSchedule | null>(null)
  const [classFormData, setClassFormData] = useState<ClassFormData>({
    name: '',
    description: '',
    capacity: 0,
    duration_minutes: 0,
    location: '',
    trainer_id: '',
  })
  const [scheduleFormData, setScheduleFormData] = useState<ClassScheduleFormData>({
    class_id: '',
    scheduled_time: '',
    date: '',
    trainer_id: '',
    location: '',
  })
  const [stats, setStats] = useState({
    totalClasses: 0,
    classesToday: 0,
    totalBookings: 0,
    classesInProgress: 0,
    capacityUtilization: 0,
    activeTrainers: 0,
  })

  // Fetch data on component mount
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [todaysData, upcomingData, statsData] = await Promise.all([
        getTodaysClassSchedules(),
        getUpcomingClassSchedules(),
        getClassStats(),
      ])
      setTodaysClasses(todaysData)
      setUpcomingClasses(upcomingData)
      setStats(statsData)
    } catch (error) {
      console.error('Failed to load class data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClassSubmit = async () => {
    try {
      const classData: CreateClassData = {
        name: classFormData.name,
        description: classFormData.description,
        trainer_id: classFormData.trainer_id || undefined, // Convert empty string to undefined
        capacity: classFormData.capacity,
        duration_minutes: classFormData.duration_minutes,
        location: classFormData.location
      }

      if (editingClass) {
        await updateClass(editingClass.id, classData)
      } else {
        const result = await createClass(classData)
        if (!result) {
          alert('Failed to create class')
          return
        }
      }
      await loadData() // Refresh data
      handleCloseClassDialog()
    } catch (error) {
      console.error('Failed to save class:', error)
      alert('Failed to save class')
    }
  }

  const handleScheduleSubmit = async () => {
    try {
      if (editingSchedule) {
        await updateClassSchedule(editingSchedule.id, scheduleFormData)
      } else {
        await createClassSchedule(scheduleFormData)
      }
      await loadData() // Refresh data
      handleCloseScheduleDialog()
    } catch (error) {
      console.error('Failed to save class schedule:', error)
    }
  }

  const handleEditClass = (classItem: Class) => {
    setEditingClass(classItem)
    setClassFormData({
      name: classItem.name,
      description: classItem.description || '',
      capacity: classItem.capacity,
      duration_minutes: classItem.duration_minutes,
      location: classItem.location || '',
      trainer_id: classItem.trainer_id || '',
    })
    setIsClassDialogOpen(true)
  }

  const handleDeleteClass = async (id: string) => {
    if (confirm('Are you sure you want to delete this class?')) {
      try {
        await deleteClass(id)
        await loadData() // Refresh data
      } catch (error) {
        console.error('Failed to delete class:', error)
      }
    }
  }

  const handleCloseClassDialog = () => {
    setIsClassDialogOpen(false)
    setEditingClass(null)
    setClassFormData({
      name: '',
      description: '',
      capacity: 0,
      duration_minutes: 0,
      location: '',
      trainer_id: '',
    })
  }

  const handleCloseScheduleDialog = () => {
    setIsScheduleDialogOpen(false)
    setEditingSchedule(null)
    setScheduleFormData({
      class_id: '',
      scheduled_time: '',
      date: '',
      trainer_id: '',
      location: '',
    })
  }

  const filteredClasses = todaysClasses.filter(schedule => {
    const search = searchTerm.toLowerCase()
    return schedule.class?.name.toLowerCase().includes(search) ||
           schedule.trainer?.first_name.toLowerCase().includes(search) ||
           schedule.trainer?.last_name.toLowerCase().includes(search)
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-full">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('classes.title')}</h1>
              <p className="text-slate-600 dark:text-slate-400">{t('classes.subtitle')}</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" className="cursor-pointer">
                <Calendar className="h-4 w-4 mr-2" />
                {t('classes.calendarView')}
              </Button>
              <Dialog open={isClassDialogOpen} onOpenChange={setIsClassDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setEditingClass(null)} className="cursor-pointer">
                    <Plus className="h-4 w-4 mr-2" />
                    {t('classes.addClass')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>{editingClass ? t('classes.editClass') : t('classes.addClass')}</DialogTitle>
                    <DialogDescription>
                      {editingClass ? 'Update class information' : 'Enter class details to add a new class'}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">{t('classes.className')}</Label>
                      <Input
                        id="name"
                        value={classFormData.name}
                        onChange={(e) => setClassFormData({ ...classFormData, name: e.target.value })}
                        placeholder="Yoga Flow"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">{t('common.description')}</Label>
                      <Textarea
                        id="description"
                        value={classFormData.description}
                        onChange={(e) => setClassFormData({ ...classFormData, description: e.target.value })}
                        placeholder="Relaxing yoga session for flexibility and mindfulness"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="capacity">{t('classes.capacity')}</Label>
                        <Input
                          id="capacity"
                          type="number"
                          value={classFormData.capacity}
                          onChange={(e) => setClassFormData({ ...classFormData, capacity: parseInt(e.target.value) })}
                          placeholder="15"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="duration">{t('classes.duration')}</Label>
                        <Input
                          id="duration"
                          type="number"
                          value={classFormData.duration_minutes}
                          onChange={(e) => setClassFormData({ ...classFormData, duration_minutes: parseInt(e.target.value) })}
                          placeholder="60" // minutes
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">{t('classes.location')}</Label>
                      <Input
                        id="location"
                        value={classFormData.location}
                        onChange={(e) => setClassFormData({ ...classFormData, location: e.target.value })}
                        placeholder="Studio B"
                      />
                    </div>
                    {/* Add Trainer selection here, fetch from trainers table */}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={handleCloseClassDialog} className="cursor-pointer">
                      {t('common.cancel')}
                    </Button>
                    <Button onClick={handleClassSubmit} className="cursor-pointer">
                      {editingClass ? t('common.saveChanges') : t('common.add')}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setEditingSchedule(null)} className="cursor-pointer">
                    <CalendarPlus className="h-4 w-4 mr-2" />
                    {t('classes.scheduleClass')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>{editingSchedule ? t('classes.editSchedule') : t('classes.scheduleClass')}</DialogTitle>
                    <DialogDescription>
                      {editingSchedule ? 'Update class schedule' : 'Enter schedule details to create a new class slot'}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="class_id">{t('classes.selectClass')}</Label>
                      <Select
                        value={scheduleFormData.class_id}
                        onValueChange={(value) => setScheduleFormData({ ...scheduleFormData, class_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('classes.selectClassPlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                          {/* Populate with actual classes from DB */}
                          <SelectItem value="mock-class-1">HIIT Training</SelectItem>
                          <SelectItem value="mock-class-2">Yoga Flow</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="date">{t('common.date')}</Label>
                        <Input
                          id="date"
                          type="date"
                          value={scheduleFormData.date}
                          onChange={(e) => setScheduleFormData({ ...scheduleFormData, date: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="time">{t('common.time')}</Label>
                        <Input
                          id="time"
                          type="time"
                          value={scheduleFormData.scheduled_time}
                          onChange={(e) => setScheduleFormData({ ...scheduleFormData, scheduled_time: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="schedule-location">{t('classes.location')}</Label>
                      <Input
                        id="schedule-location"
                        value={scheduleFormData.location}
                        onChange={(e) => setScheduleFormData({ ...scheduleFormData, location: e.target.value })}
                        placeholder="Studio A"
                      />
                    </div>
                    {/* Add Trainer selection here, fetch from trainers table */}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={handleCloseScheduleDialog} className="cursor-pointer">
                      {t('common.cancel')}
                    </Button>
                    <Button onClick={handleScheduleSubmit} className="cursor-pointer">
                      {editingSchedule ? t('common.saveChanges') : t('common.schedule')}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('classes.classesToday')}</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.classesToday}</div>
              <p className="text-xs text-muted-foreground">
                {stats.classesInProgress} {t('classes.currentlyInProgress')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('classes.totalBookings')}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBookings}</div>
              <p className="text-xs text-muted-foreground">
                {t('classes.bookingsDescription')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('classes.capacityUtilization')}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.capacityUtilization}%</div>
              <p className="text-xs text-muted-foreground">
                {t('classes.capacityDescription')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('classes.activeTrainers')}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeTrainers}</div>
              <p className="text-xs text-muted-foreground">
                {t('classes.trainersTeachingToday')}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Today's Schedule */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t('classes.todaysSchedule')}</CardTitle>
                  <CardDescription>{t('classes.currentDate')}</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder={t('classes.searchClassesPlaceholder')}
                      className="pl-10 w-48"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button variant="outline" size="sm" className="cursor-pointer">
                    <Filter className="h-4 w-4 mr-2" />
                    {t('common.filter')}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredClasses.length === 0 ? (
                  <p>{t('classes.noClassesToday')}</p>
                ) : (
                  filteredClasses.map((schedule) => (
                    <div key={schedule.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div className="flex-1">
                              <h3 className="font-semibold text-slate-900 dark:text-slate-100">{schedule.class?.name}</h3>
                              <p className="text-sm text-slate-600 dark:text-slate-400">{schedule.class?.description}</p>
                          </div>
                          <div className="text-right">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                schedule.status === 'In Progress' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            }`}>
                                {schedule.status || 'Scheduled'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-6 mt-3 text-sm text-slate-600 dark:text-slate-400">
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                              <span>{new Date(`2000-01-01T${schedule.scheduled_time}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({schedule.class?.duration_minutes}min)</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Users className="h-4 w-4" />
                              <span>{schedule.enrolled_members}/{schedule.class?.capacity} {t('classes.enrolled')}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-4 w-4" />
                              <span>{schedule.class?.location}</span>
                          </div>
                          <div>
                              <span>{t('classes.trainer')}: {schedule.trainer?.first_name} {schedule.trainer?.last_name}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <Button variant="ghost" size="sm" className="cursor-pointer">
                          <Eye className="h-4 w-4" />
                        </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleEditClass(schedule.class as Class)} className="cursor-pointer">
                          <Edit className="h-4 w-4" />
                        </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteClass(schedule.class?.id as string)} className="cursor-pointer">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Classes */}
          <Card>
            <CardHeader>
              <CardTitle>{t('classes.upcomingClasses')}</CardTitle>
              <CardDescription>{t('classes.tomorrowDate')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingClasses.length === 0 ? (
                  <p>{t('classes.noUpcomingClasses')}</p>
                ) : (
                  upcomingClasses.map((classItem) => (
                    <div key={classItem.id} className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3 last:border-b-0">
                    <div>
                        <p className="font-medium text-slate-900 dark:text-slate-100">{classItem.class?.name}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {new Date(`2000-01-01T${classItem.scheduled_time}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {classItem.trainer?.first_name} {classItem.trainer?.last_name}
                        </p>
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        {classItem.enrolled_members}/{classItem.class?.capacity}
                    </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 