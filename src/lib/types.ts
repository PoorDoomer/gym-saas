export type UserRole = 'admin' | 'trainer' | 'member' | 'front_desk'

export interface UserProfile {
  id: string
  user_id: string
  role: UserRole
  gym_id?: string
  created_at: string
  updated_at: string
}

export interface MembershipPlan {
  id: string
  name: string
  description?: string
  price: number
  duration_months: number
  max_access_per_month?: number
  features: string[]
  is_active: boolean
  stripe_price_id?: string
  created_at: string
  updated_at: string
}

export interface Member {
  id: string
  user_id?: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  date_of_birth?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  membership_plan_id?: string
  membership_start_date?: string
  membership_end_date?: string
  is_active: boolean
  stripe_customer_id?: string
  profile_image_url?: string
  notes?: string
  created_at: string
  updated_at: string
  membership_plan?: MembershipPlan
}

export interface Trainer {
  id: string
  user_id?: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  specializations?: string[]
  bio?: string
  hourly_rate?: number
  is_active: boolean
  profile_image_url?: string
  created_at: string
  updated_at: string
}

export interface Class {
  id: string
  name: string
  description?: string
  trainer_id?: string
  capacity: number
  duration_minutes: number
  price: number
  is_recurring: boolean
  recurrence_pattern?: any
  is_active: boolean
  created_at: string
  updated_at: string
  trainer?: Trainer
  location?: string
}

export interface ClassSchedule {
  id: string
  class_id: string
  date: string
  scheduled_time: string
  end_time: string
  actual_capacity: number
  is_cancelled: boolean
  cancellation_reason?: string
  created_at: string
  updated_at: string
  class?: Class
  enrolled_members?: number
  trainer?: Trainer
  status?: string
  location?: string
}

export interface ClassBooking {
  id: string
  member_id: string
  class_schedule_id: string
  booking_status: 'confirmed' | 'cancelled' | 'no_show'
  booking_date: string
  cancellation_date?: string
  created_at: string
  updated_at: string
  member?: Member
  class_schedule?: ClassSchedule
}

export interface CheckIn {
  id: string
  member_id: string
  check_in_time: string
  check_out_time?: string
  check_in_method: 'manual' | 'qr_code' | 'card'
  notes?: string
  created_at: string
  member?: Member
}

export interface Subscription {
  id: string
  member_id: string
  plan_id: string
  start_date: string
  end_date: string
  payment_status: 'pending' | 'active' | 'past_due' | 'cancelled' | 'unpaid'
  stripe_subscription_id?: string
  amount: number
  currency: string
  created_at: string
  updated_at: string
  member?: Member
  plan?: MembershipPlan
}

export interface Payment {
  id: string
  member_id: string
  subscription_id?: string
  amount: number
  currency: string
  payment_method?: string
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded'
  stripe_payment_intent_id?: string
  payment_date: string
  description?: string
  created_at: string
  member?: Member
}

export interface GymSettings {
  id: string
  gym_name: string
  logo_url?: string
  address?: string
  phone?: string
  email?: string
  website?: string
  business_hours?: any
  timezone: string
  currency: string
  tax_rate: number
  created_at: string
  updated_at: string
}

export interface Notification {
  id: string
  member_id: string
  title: string
  message: string
  type: 'general' | 'payment' | 'class' | 'membership'
  is_read: boolean
  sent_at: string
  created_at: string
  member?: Member
}

export interface DashboardStats {
  activeMembers: number
  revenueThisMonth: number
  classesToday: number
  checkInsToday: number
} 