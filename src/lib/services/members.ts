import { createClient } from '@/lib/supabase/client'
import { Member, MembershipPlan } from '@/lib/types'

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

// Get all members with pagination and filters
export async function getMembers(filters: MembersFilters = {}): Promise<MembersResponse> {
  const { 
    search = '', 
    membership_plan_id, 
    is_active, 
    page = 1, 
    limit = 10 
  } = filters

  let query = supabase
    .from('members')
    .select(`
      *,
      membership_plan:membership_plans(*)
    `, { count: 'exact' })

  // Apply search filter
  if (search) {
    query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`)
  }

  // Apply membership plan filter
  if (membership_plan_id) {
    query = query.eq('membership_plan_id', membership_plan_id)
  }

  // Apply active status filter
  if (is_active !== undefined) {
    query = query.eq('is_active', is_active)
  }

  // Apply pagination
  const from = (page - 1) * limit
  const to = from + limit - 1
  query = query.range(from, to)

  // Order by created_at desc
  query = query.order('created_at', { ascending: false })

  const { data, error, count } = await query

  if (error) {
    console.error('Error fetching members:', error)
    throw new Error('Failed to fetch members')
  }

  const totalPages = Math.ceil((count || 0) / limit)

  return {
    data: data || [],
    count: count || 0,
    page,
    totalPages
  }
}

// Get member by ID
export async function getMemberById(id: string): Promise<Member | null> {
  try {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching member:', error)
      throw error
    }

    return data
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

    // Step 2: Create member record in database
    const { data: member, error: memberError } = await supabase
      .from('members')
      .insert([{
        user_id: authData.user.id, // Link to auth user
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
      }])
      .select()
      .single()

    if (memberError) {
      console.error('Error creating member record:', memberError)
      
      // Cleanup: Delete the auth user if member creation failed
      await supabase.auth.admin.deleteUser(authData.user.id)
      
      return {
        member: null,
        user_account: null,
        success: false,
        error: `Failed to create member record: ${memberError.message}`
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
        member_id: member.id
      }])

    if (accountError) {
      console.error('Error creating member account link:', accountError)
      // Continue anyway, link can be added later
    }

    return {
      member,
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
    const { data, error } = await supabase
      .from('members')
      .insert([{
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
        is_active: memberData.is_active !== undefined ? memberData.is_active : true,
        notes: memberData.notes
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating member:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Failed to create member:', error)
    return null
  }
}

// Update member
export async function updateMember(id: string, memberData: Partial<Member>): Promise<Member | null> {
  try {
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

// Get membership plans for dropdowns
export async function getMembershipPlans(): Promise<MembershipPlan[]> {
  const { data, error } = await supabase
    .from('membership_plans')
    .select('*')
    .eq('is_active', true)
    .order('price', { ascending: true })

  if (error) {
    console.error('Error fetching membership plans:', error)
    throw new Error('Failed to fetch membership plans')
  }

  return data || []
}

// Get member statistics
export async function getMemberStats() {
  try {
    // Get total members count
    const { count: totalMembers, error: totalError } = await supabase
      .from('members')
      .select('*', { count: 'exact', head: true })

    if (totalError) throw totalError

    // Get active members count
    const { count: activeMembers, error: activeError } = await supabase
      .from('members')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    if (activeError) throw activeError

    // Get new members this month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { count: newThisMonth, error: newError } = await supabase
      .from('members')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfMonth.toISOString())

    if (newError) throw newError

    // Calculate revenue from active memberships
    // This is a simplified calculation - in real app, you'd have pricing data
    const basePrice = 50 // Base monthly membership price
    const estimatedRevenue = (activeMembers || 0) * basePrice

    return {
      totalMembers: totalMembers || 0,
      activeMembers: activeMembers || 0,
      newThisMonth: newThisMonth || 0,
      revenue: estimatedRevenue
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