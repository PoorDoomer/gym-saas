import { createContext, useContext } from 'react'

export type Locale = 'en' | 'fr' | 'ar' | 'es'

export interface TranslationKeys {
  // Navigation
  nav: {
    dashboard: string
    members: string
    classes: string
    trainers: string
    checkins: string
    payments: string
    reports: string
    settings: string
  }
  
  // Common
  common: {
    add: string
    edit: string
    delete: string
    save: string
    cancel: string
    search: string
    loading: string
    error: string
    success: string
    name: string
    email: string
    phone: string
    status: string
    active: string
    inactive: string
    actions: string
    description: string
    filter: string
  }

  // Members
  members: {
    title: string
    subtitle: string
    addMember: string
    editMember: string
    firstName: string
    lastName: string
    emergencyContact: string
    emergencyPhone: string
    notes: string
    joinedDate: string
    totalMembers: string
    activeMembers: string
    newThisMonth: string
    monthlyRevenue: string
    noMembersFound: string
    searchPlaceholder: string
  }

  // Classes
  classes: {
    title: string
    subtitle: string
    calendarView: string
    addClass: string
    scheduleClass: string
    classesToday: string
    currentlyInProgress: string
    totalBookings: string
    bookingsDescription: string
    capacityUtilization: string
    capacityDescription: string
    activeTrainers: string
    trainersTeachingToday: string
    todaysSchedule: string
    currentDate: string
    noClassesToday: string
    upcomingClasses: string
    tomorrowDate: string
    noUpcomingClasses: string
    className: string
    trainer: string
    enrolled: string
  }

  // Dashboard
  dashboard: {
    title: string
    subtitle: string
    welcomeBack: string
    todayOverview: string
    quickActions: string
  }

  // Auth
  auth: {
    login: string
    signup: string
    logout: string
    password: string
    confirmPassword: string
    forgotPassword: string
    resetPassword: string
  }
}

const TranslationContext = createContext<{
  locale: Locale
  t: (key: keyof TranslationKeys | string) => string
  setLocale: (locale: Locale) => void
} | null>(null)

export const useTranslation = () => {
  const context = useContext(TranslationContext)
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider')
  }
  return context
}

export { TranslationContext } 