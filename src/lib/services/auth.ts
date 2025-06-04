import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export type UserRole = 'admin' | 'trainer' | 'member' | 'none'

export interface UserRoleInfo {
  id: string
  user_id: string
  role: UserRole
  entity_id?: string
  entity_type?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface TrainerAccount {
  id: string
  trainer_id: string
  user_id: string
  auto_generated_password?: string
  has_logged_in: boolean
  password_changed: boolean
  last_login?: string
  created_at: string
}

export interface MemberAccount {
  id: string
  member_id: string
  user_id: string
  auto_generated_password?: string
  has_logged_in: boolean
  password_changed: boolean
  last_login?: string
  created_at: string
}

// Get current user's role
export async function getCurrentUserRole(): Promise<UserRole> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return 'none'

    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (error) {
      console.error('Error fetching user role:', error)
      return 'none'
    }

    return (data?.role as UserRole) || 'none'
  } catch (error) {
    console.error('Failed to get current user role:', error)
    return 'none'
  }
}

// Get current user's full role info
export async function getCurrentUserRoleInfo(): Promise<UserRoleInfo | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (error) {
      console.error('Error fetching user role info:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Failed to get current user role info:', error)
    return null
  }
}

// Check if current user has specific role
export async function hasRole(role: UserRole): Promise<boolean> {
  const currentRole = await getCurrentUserRole()
  return currentRole === role
}

// Check if current user is admin
export async function isAdmin(): Promise<boolean> {
  return await hasRole('admin')
}

// Check if current user is trainer
export async function isTrainer(): Promise<boolean> {
  return await hasRole('trainer')
}

// Check if current user is member
export async function isMember(): Promise<boolean> {
  return await hasRole('member')
}

// Create trainer account with auto-generated password
export async function createTrainerAccount(trainerId: string, email: string): Promise<{
  success: boolean
  password?: string
  error?: string
}> {
  try {
    // Generate secure password
    const { data: passwordData, error: passwordError } = await supabase
      .rpc('generate_secure_password')

    if (passwordError) {
      throw passwordError
    }

    const password = passwordData as string

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })

    if (authError) {
      throw authError
    }

    const userId = authData.user.id

    // Create trainer account record
    const { error: accountError } = await supabase
      .from('trainer_accounts')
      .insert([{
        trainer_id: trainerId,
        user_id: userId,
        auto_generated_password: password // In production, this should be hashed
      }])

    if (accountError) {
      throw accountError
    }

    // Assign trainer role
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert([{
        user_id: userId,
        role: 'trainer',
        entity_id: trainerId,
        entity_type: 'trainer'
      }])

    if (roleError) {
      throw roleError
    }

    return {
      success: true,
      password
    }
  } catch (error: any) {
    console.error('Failed to create trainer account:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// Create member account with auto-generated password
export async function createMemberAccount(memberId: string, email: string): Promise<{
  success: boolean
  password?: string
  error?: string
}> {
  try {
    // Generate secure password
    const { data: passwordData, error: passwordError } = await supabase
      .rpc('generate_secure_password')

    if (passwordError) {
      throw passwordError
    }

    const password = passwordData as string

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })

    if (authError) {
      throw authError
    }

    const userId = authData.user.id

    // Create member account record
    const { error: accountError } = await supabase
      .from('member_accounts')
      .insert([{
        member_id: memberId,
        user_id: userId,
        auto_generated_password: password // In production, this should be hashed
      }])

    if (accountError) {
      throw accountError
    }

    // Assign member role
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert([{
        user_id: userId,
        role: 'member',
        entity_id: memberId,
        entity_type: 'member'
      }])

    if (roleError) {
      throw roleError
    }

    return {
      success: true,
      password
    }
  } catch (error: any) {
    console.error('Failed to create member account:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// Update login status for trainer
export async function updateTrainerLoginStatus(userId: string): Promise<void> {
  try {
    await supabase
      .from('trainer_accounts')
      .update({
        has_logged_in: true,
        last_login: new Date().toISOString()
      })
      .eq('user_id', userId)
  } catch (error) {
    console.error('Failed to update trainer login status:', error)
  }
}

// Update login status for member
export async function updateMemberLoginStatus(userId: string): Promise<void> {
  try {
    await supabase
      .from('member_accounts')
      .update({
        has_logged_in: true,
        last_login: new Date().toISOString()
      })
      .eq('user_id', userId)
  } catch (error) {
    console.error('Failed to update member login status:', error)
  }
}

// Get trainer account by user ID
export async function getTrainerAccount(userId: string): Promise<TrainerAccount | null> {
  try {
    const { data, error } = await supabase
      .from('trainer_accounts')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Error fetching trainer account:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Failed to get trainer account:', error)
    return null
  }
}

// Get member account by user ID
export async function getMemberAccount(userId: string): Promise<MemberAccount | null> {
  try {
    const { data, error } = await supabase
      .from('member_accounts')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Error fetching member account:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Failed to get member account:', error)
    return null
  }
} 