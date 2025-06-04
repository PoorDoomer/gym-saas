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
    subscriptionPlans: string
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
    total: string
    close: string
    confirm: string
    yes: string
    no: string
    back: string
    next: string
    previous: string
    view: string
    download: string
    export: string
    import: string
    required: string
    optional: string
    saveChanges: string
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
    dateOfBirth: string
    membershipPlan: string
    generateQR: string
    qrCode: string
    memberDetails: string
    deleteConfirm: string
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
    editSchedule: string
    selectClass: string
    selectClassPlaceholder: string
    capacity: string
    duration: string
    location: string
    scheduledTime: string
    date: string
  }

  // Trainers
  trainers: {
    title: string
    subtitle: string
    addTrainer: string
    editTrainer: string
    firstName: string
    lastName: string
    email: string
    phone: string
    specializations: string
    bio: string
    hourlyRate: string
    totalTrainers: string
    activeTrainers: string
    avgHourlyRate: string
    specializationsCount: string
    noTrainersFound: string
    searchPlaceholder: string
    deleteConfirm: string
    specializationsPlaceholder: string
    bioPlaceholder: string
  }

  // Check-ins
  checkins: {
    title: string
    subtitle: string
    manualCheckin: string
    qrScanner: string
    currentOccupancy: string
    checkinsToday: string
    recentCheckins: string
    noCheckinsToday: string
    checkInMember: string
    searchMember: string
    scanQR: string
    checkedIn: string
    checkedOut: string
    duration: string
    occupancyLimit: string
  }

  // Payments
  payments: {
    title: string
    subtitle: string
    totalRevenue: string
    pendingPayments: string
    paymentHistory: string
    subscriptions: string
    recordPayment: string
    amount: string
    paymentMethod: string
    paymentDate: string
    member: string
    plan: string
    dueDate: string
    paid: string
    pending: string
    overdue: string
    failed: string
    noPayments: string
    cash: string
    card: string
    transfer: string
  }

  // Reports
  reports: {
    title: string
    subtitle: string
    analytics: string
    membership: string
    revenue: string
    classes: string
    overview: string
    memberGrowth: string
    revenueGrowth: string
    popularClasses: string
    trainerPerformance: string
    exportReport: string
    dateRange: string
    lastMonth: string
    last3Months: string
    lastYear: string
    custom: string
  }

  // Settings
  settings: {
    title: string
    subtitle: string
    gymSettings: string
    general: string
    contact: string
    business: string
    financial: string
    notifications: string
    gymName: string
    address: string
    city: string
    country: string
    website: string
    contactEmail: string
    contactPhone: string
    openingHours: string
    closingHours: string
    timezone: string
    currency: string
    taxRate: string
    membershipTypes: string
    saveSettings: string
  }

  // Subscription Plans
  subscriptionPlans: {
    title: string
    subtitle: string
    addPlan: string
    editPlan: string
    planName: string
    price: string
    duration: string
    features: string
    totalPlans: string
    monthlyRevenue: string
    totalSubscribers: string
    popularPlan: string
    noPlanssFound: string
    monthly: string
    yearly: string
    subscribers: string
    perMonth: string
    months: string
    unlimited: string
    limited: string
  }

  // Dashboard
  dashboard: {
    title: string
    subtitle: string
    welcomeBack: string
    todayOverview: string
    quickActions: string
    recentActivity: string
    todaysSchedule: string
    memberStats: string
    revenueStats: string
    classStats: string
    checkInStats: string
    viewAll: string
    addMember: string
    scheduleClass: string
    recordPayment: string
    generateReport: string
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
    welcomeBack: string
    signInToContinue: string
    dontHaveAccount: string
    alreadyHaveAccount: string
    createAccount: string
    fullName: string
    gymName: string
    agreeToTerms: string
    termsAndConditions: string
    privacyPolicy: string
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