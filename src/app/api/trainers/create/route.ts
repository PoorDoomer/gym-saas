'use server'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { gymDataService } from '@/lib/services/gymDataService'

// Create admin client with service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Generate a secure random password
function generateTemporaryPassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*'
  let password = ''
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

export async function POST(request: NextRequest) {
  try {
    const trainerData = await request.json()
    
    // Validate that gym_id is provided
    if (!trainerData.gym_id) {
      return NextResponse.json({
        success: false,
        error: 'Gym ID is required'
      }, { status: 400 })
    }
    
    // Generate temporary password
    const temporaryPassword = generateTemporaryPassword()
    
    // Step 1: Create user account in Supabase Auth using admin client
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: trainerData.email,
      password: temporaryPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        role: 'trainer',
        first_name: trainerData.first_name,
        last_name: trainerData.last_name,
        full_name: `${trainerData.first_name} ${trainerData.last_name}`
      }
    })

    if (authError) {
      console.error('Error creating trainer user account:', authError)
      return NextResponse.json({
        success: false,
        error: `Failed to create user account: ${authError.message}`
      }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json({
        success: false,
        error: 'Failed to create user account: No user returned'
      }, { status: 400 })
    }

    // Step 2: Create trainer record directly with gym_id from request
    const { data: trainerRecord, error: trainerError } = await supabaseAdmin
      .from('trainers')
      .insert({
        user_id: authData.user.id,
        first_name: trainerData.first_name,
        last_name: trainerData.last_name,
        email: trainerData.email,
        phone: trainerData.phone,
        specializations: trainerData.specializations,
        bio: trainerData.bio,
        hourly_rate: trainerData.hourly_rate,
        profile_image_url: trainerData.profile_image_url,
        is_active: true,
        gym_id: trainerData.gym_id // Use gym_id from request
      })
      .select()

    if (trainerError || !trainerRecord || !trainerRecord[0]) {
      console.error('Error creating trainer record:', trainerError)
      // Cleanup: Delete the auth user if trainer creation failed
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      
      return NextResponse.json({
        success: false,
        error: `Failed to create trainer record: ${trainerError?.message || 'Unknown error'}`
      }, { status: 400 })
    }

    // Step 3: Create user_roles entry
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert([{
        user_id: authData.user.id,
        role: 'trainer'
      }])

    if (roleError) {
      console.error('Error creating trainer role:', roleError)
      // Continue anyway, role can be added later
    }

    // Step 4: Create trainer_accounts entry
    const { error: accountError } = await supabaseAdmin
      .from('trainer_accounts')
      .insert([{
        user_id: authData.user.id,
        trainer_id: trainerRecord[0].id
      }])

    if (accountError) {
      console.error('Error creating trainer account link:', accountError)
      // Continue anyway, link can be added later
    }

    // Step 5: Assign sports if any
    if (trainerData.selected_sports && trainerData.selected_sports.length > 0) {
      const sportsData = trainerData.selected_sports.map((sport: any) => ({
        trainer_id: trainerRecord[0].id,
        sport_id: sport.sport_id,
        skill_level: sport.skill_level
      }))

      const { error: sportsError } = await supabaseAdmin
        .from('trainer_sports')
        .insert(sportsData)

      if (sportsError) {
        console.error('Error assigning sports to trainer:', sportsError)
        // Don't throw here, trainer is already created
      }
    }

    return NextResponse.json({
      success: true,
      trainer: trainerRecord[0],
      user_account: {
        email: trainerData.email,
        temporary_password: temporaryPassword,
        user_id: authData.user.id
      }
    })

  } catch (error) {
    console.error('Failed to create trainer:', error)
    return NextResponse.json({
      success: false,
      error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 })
  }
} 