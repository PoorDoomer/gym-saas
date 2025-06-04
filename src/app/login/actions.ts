'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  // Type-casting here for convenience
  // In practice, you should validate your inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  console.log('Login attempt for:', data.email)

  const { data: authData, error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    console.error('Login error:', error.message)
    console.error('Error details:', error)
    
    // Provide specific error types for better user feedback
    if (error.message.includes('Invalid login credentials')) {
      redirect('/error?type=invalid_credentials')
    } else if (error.message.includes('Email not confirmed')) {
      redirect('/error?type=email_not_confirmed')
    } else {
      redirect('/error?type=general')
    }
  }

  console.log('Login successful for:', data.email)
  console.log('User data:', authData.user?.email)

  // Check if user has any gyms
  const { data: userGyms, error: gymsError } = await supabase
    .from('gyms')
    .select('id')
    .eq('owner_user_id', authData.user!.id)
    .eq('is_active', true)

  if (gymsError) {
    console.error('Error checking user gyms:', gymsError)
    // Fallback to gym management if we can't check
    revalidatePath('/', 'layout')
    redirect('/gym-management')
  }

  // Always redirect to gym management page - it will handle the flow
  revalidatePath('/', 'layout')
  redirect('/gym-management')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  // Get all form data
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirm-password') as string
  const gymName = formData.get('gym-name') as string
  const fullName = formData.get('full-name') as string
  const terms = formData.get('terms') as string

  console.log('Signup attempt for:', email)
  console.log('Gym name:', gymName)
  console.log('Full name:', fullName)
  console.log('Terms accepted:', !!terms)

  // Basic validation
  if (!email || !password || !gymName || !fullName) {
    console.error('Signup error: Missing required fields')
    redirect('/error?type=validation_error')
  }

  if (password !== confirmPassword) {
    console.error('Signup error: Passwords do not match')
    redirect('/error?type=validation_error')
  }

  if (!terms) {
    console.error('Signup error: Terms not accepted')
    redirect('/error?type=validation_error')
  }

  const { data: authData, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        gym_name: gymName,
        full_name: fullName,
      }
    }
  })

  if (error) {
    console.error('Signup error:', error.message)
    console.error('Error details:', error)
    redirect('/error?type=general')
  }

  console.log('Signup successful for:', email)
  console.log('User data:', authData.user?.email)
  console.log('Confirmation required:', !authData.user?.email_confirmed_at)

  // Redirect new users to gym management page
  revalidatePath('/', 'layout')
  redirect('/gym-management')
} 