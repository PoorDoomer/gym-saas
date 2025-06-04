import { createClient } from '@/lib/supabase/client'
import { Member, MembershipPlan } from '@/lib/types'
import { gymDataService } from './gymDataService'

const supabase = createClient()

export interface CreateMemberData {
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
  notes?: string
}

export interface UpdateMemberData extends Partial<CreateMemberData> {
  is_active?: boolean
}

export interface CreateMemberResult {
  member: Member | null
  user_account: {
    email: string
    temporary_password: string
    user_id: string
  } | null
  success: boolean
  error?: string
}

export interface MembersFilters {
  search?: string
  membership_plan_id?: string
  is_active?: boolean
  page?: number
  limit?: number
}

export interface MembersResponse {
  data: Member[]
  count: number
  page: number
  totalPages: number
}

// Generate a secure random password
function generateTemporaryPassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*'
  let password = ''
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

// Get all members with pagination and filters - now uses gymDataService
export async function getMembers(filters: MembersFilters = {}): Promise<MembersResponse> {
  try {
    // For now, use gymDataService to get all members with gym isolation
    const members = await gymDataService.getMembers()
    
    // Apply client-side filtering since gymDataService returns all members for the gym
    let filteredMembers = members
    
    // Apply search filter
    if (filters.search) {
      const search = filters.search.toLowerCase()
      filteredMembers = filteredMembers.filter(member => 
        member.first_name.toLowerCase().includes(search) ||
        member.last_name.toLowerCase().includes(search) ||
        member.email.toLowerCase().includes(search)
      )
    }
    
    // Apply membership plan filter
    if (filters.membership_plan_id) {
      filteredMembers = filteredMembers.filter(member => 
        member.membership_plan_id === filters.membership_plan_id
      )
    }
    
    // Apply active status filter
    if (filters.is_active !== undefined) {
      filteredMembers = filteredMembers.filter(member => 
        member.is_active === filters.is_active
      )
    }
    
    // Apply pagination
    const page = filters.page || 1
    const limit = filters.limit || 10
    const from = (page - 1) * limit
    const to = from + limit
    const paginatedMembers = filteredMembers.slice(from, to)
    
    const totalPages = Math.ceil(filteredMembers.length / limit)
    
    return {
      data: paginatedMembers,
      count: filteredMembers.length,
      page,
      totalPages
    }
  } catch (error) {
    console.error('Failed to fetch members:', error)
    return {
      data: [],
      count: 0,
      page: 1,
      totalPages: 0
    }
  }
}

// Get member by ID
export async function getMemberById(id: string): Promise<Member | null> {
  try {
    const members = await gymDataService.getMembers()
    return members.find(m => m.id === id) || null
  } catch (error) {
    console.error('Failed to fetch member:', error)
    return null
  }
}

// Create new member with user account
export async function createMemberWithAccount(memberData: CreateMemberData): Promise<CreateMemberResult> {
  try {
    // Generate temporary password
    const temporaryPassword = generateTemporaryPassword()
    
    // Step 1: Create user account in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: memberData.email,
      password: temporaryPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        role: 'member',
        first_name: memberData.first_name,
        last_name: memberData.last_name,
        full_name: `${memberData.first_name} ${memberData.last_name}`
      }
    })

    if (authError) {
      console.error('Error creating member user account:', authError)
      return {
        member: null,
        user_account: null,
        success: false,
        error: `Failed to create user account: ${authError.message}`
      }
    }

    if (!authData.user) {
      return {
        member: null,
        user_account: null,
        success: false,
        error: 'Failed to create user account: No user returned'
      }
    }

    // Step 2: Create member record using gymDataService (includes gym_id)
    const member = await gymDataService.createMember({
      user_id: authData.user.id,
      first_name: memberData.first_name,
      last_name: memberData.last_name,
      email: memberData.email,
      phone: memberData.phone,
      date_of_birth: memberData.date_of_birth,
      emergency_contact_name: memberData.emergency_contact_name,
      emergency_contact_phone: memberData.emergency_contact_phone,
      membership_plan_id: memberData.membership_plan_id,
      membership_start_date: memberData.membership_start_date,
      membership_end_date: memberData.membership_end_date,
      is_active: true,
      notes: memberData.notes
    })

    if (!member || !member[0]) {
      // Cleanup: Delete the auth user if member creation failed
      await supabase.auth.admin.deleteUser(authData.user.id)
      
      return {
        member: null,
        user_account: null,
        success: false,
        error: 'Failed to create member record'
      }
    }

    // Step 3: Create user_roles entry
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert([{
        user_id: authData.user.id,
        role: 'member'
      }])

    if (roleError) {
      console.error('Error creating member role:', roleError)
      // Continue anyway, role can be added later
    }

    // Step 4: Create member_accounts entry
    const { error: accountError } = await supabase
      .from('member_accounts')
      .insert([{
        user_id: authData.user.id,
        member_id: member[0].id
      }])

    if (accountError) {
      console.error('Error creating member account link:', accountError)
      // Continue anyway, link can be added later
    }

    return {
      member: member[0],
      user_account: {
        email: memberData.email,
        temporary_password: temporaryPassword,
        user_id: authData.user.id
      },
      success: true
    }
  } catch (error) {
    console.error('Failed to create member with account:', error)
    return {
      member: null,
      user_account: null,
      success: false,
      error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

// Create new member (legacy function for backward compatibility)
export async function createMember(memberData: Partial<Member>): Promise<Member | null> {
  try {
    const result = await gymDataService.createMember(memberData)
    return result && result[0] ? result[0] : null
  } catch (error) {
    console.error('Failed to create member:', error)
    return null
  }
}

// Update member
export async function updateMember(id: string, memberData: Partial<Member>): Promise<Member | null> {
  try {
    // For now, use direct supabase call but add gym_id check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    
    // First verify the member belongs to the current gym
    const existingMember = await getMemberById(id)
    if (!existingMember) {
      throw new Error('Member not found or does not belong to your gym')
    }
    
    const { data, error } = await supabase
      .from('members')
      .update({
        first_name: memberData.first_name,
        last_name: memberData.last_name,
        email: memberData.email,
        phone: memberData.phone,
        date_of_birth: memberData.date_of_birth,
        emergency_contact_name: memberData.emergency_contact_name,
        emergency_contact_phone: memberData.emergency_contact_phone,
        membership_plan_id: memberData.membership_plan_id,
        membership_start_date: memberData.membership_start_date,
        membership_end_date: memberData.membership_end_date,
        is_active: memberData.is_active,
        notes: memberData.notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating member:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Failed to update member:', error)
    return null
  }
}

// Delete member (soft delete by setting is_active to false)
export async function deleteMember(id: string): Promise<boolean> {
  try {
    // First verify the member belongs to the current gym
    const existingMember = await getMemberById(id)
    if (!existingMember) {
      throw new Error('Member not found or does not belong to your gym')
    }
    
    const { error } = await supabase
      .from('members')
      .update({ is_active: false })
      .eq('id', id)

    if (error) {
      console.error('Error deleting member:', error)
      throw error
    }

    return true
  } catch (error) {
    console.error('Failed to delete member:', error)
    return false
  }
}

// Get membership plans for dropdowns - now uses gymDataService
export async function getMembershipPlans(): Promise<MembershipPlan[]> {
  try {
    const plans = await gymDataService.getMembershipPlans()
    return plans.filter(p => p.is_active)
  } catch (error) {
    console.error('Failed to fetch membership plans:', error)
    return []
  }
}

// Get member statistics - now properly filtered by gym
export async function getMemberStats() {
  try {
    const analytics = await gymDataService.getGymAnalytics()
    
    // Get new members this month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)
    
    const newThisMonth = analytics.members.filter(m => 
      new Date(m.created_at) >= startOfMonth
    ).length
    
    // Calculate revenue from active memberships
    // Use the actual revenue data from analytics
    const revenue = analytics.totalRevenue
    
    return {
      totalMembers: analytics.totalMembers,
      activeMembers: analytics.activeMembers,
      newThisMonth,
      revenue
    }
  } catch (error) {
    console.error('Failed to fetch member stats:', error)
    return {
      totalMembers: 0,
      activeMembers: 0,
      newThisMonth: 0,
      revenue: 0
    }
  }
} 