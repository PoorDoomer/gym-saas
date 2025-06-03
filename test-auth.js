const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('Supabase URL:', supabaseUrl)
console.log('Service Key present:', !!supabaseServiceKey)

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testAuth() {
  console.log('\n=== Testing Supabase Auth ===')
  
  // Test 1: Try to login with existing account
  console.log('\n1. Testing login with existing account:')
  const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
    email: 'sidnamomo@gmail.com',
    password: 'TestPassword123!'
  })
  
  if (loginError) {
    console.log('Login error:', loginError.message)
    console.log('Error code:', loginError.status)
  } else {
    console.log('Login successful!')
    console.log('User ID:', loginData.user?.id)
    console.log('Email confirmed:', loginData.user?.email_confirmed_at)
  }
  
  // Test 2: Create a new test account with valid email domain
  console.log('\n2. Creating new test account:')
  const testEmail = `testgym${Date.now()}@gmail.com`
  console.log('Test email:', testEmail)
  
  const { data: signupData, error: signupError } = await supabase.auth.signUp({
    email: testEmail,
    password: 'TestPassword123!',
    options: {
      data: {
        gym_name: 'Test Gym',
        full_name: 'Test User'
      }
    }
  })
  
  if (signupError) {
    console.log('Signup error:', signupError.message)
  } else {
    console.log('Signup successful!')
    console.log('User ID:', signupData.user?.id)
    console.log('Email confirmed:', signupData.user?.email_confirmed_at)
    console.log('Confirmation required:', !signupData.user?.email_confirmed_at)
    
    // Test 3: Try to login immediately with new account
    console.log('\n3. Testing immediate login with new account:')
    const { data: newLoginData, error: newLoginError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: 'TestPassword123!'
    })
    
    if (newLoginError) {
      console.log('New account login error:', newLoginError.message)
      console.log('This is expected if email confirmation is required')
    } else {
      console.log('New account login successful!')
    }
  }
  
  // Test 4: Check if the original account exists but with different password
  console.log('\n4. Testing if account exists with different password:')
  const { data: resetData, error: resetError } = await supabase.auth.resetPasswordForEmail(
    'sidnamomo@gmail.com',
    { redirectTo: 'http://localhost:3000/reset-password' }
  )
  
  if (resetError) {
    console.log('Password reset error:', resetError.message)
  } else {
    console.log('Password reset email sent successfully')
  }
}

testAuth().catch(console.error) 