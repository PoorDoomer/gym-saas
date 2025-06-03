const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createTestUser() {
  console.log('Creating test user account...')
  
  const testEmail = 'testuser@fitlifegym.com'
  const testPassword = 'TestGym123!'
  
  // Create the account
  const { data: signupData, error: signupError } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
    options: {
      data: {
        gym_name: 'FitLife Test Gym',
        full_name: 'Test User'
      }
    }
  })
  
  if (signupError) {
    console.error('Signup error:', signupError.message)
    return
  }
  
  console.log('✅ Test account created successfully!')
  console.log('📧 Email:', testEmail)
  console.log('🔑 Password:', testPassword)
  console.log('👤 User ID:', signupData.user?.id)
  console.log('📋 Email confirmed:', signupData.user?.email_confirmed_at ? 'Yes' : 'No')
  
  // Try to login immediately
  console.log('\nTesting login...')
  const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword
  })
  
  if (loginError) {
    console.log('❌ Login failed:', loginError.message)
    console.log('💡 This is expected - email confirmation required')
  } else {
    console.log('✅ Login successful!')
  }
  
  console.log('\n🎯 TO USE THIS ACCOUNT:')
  console.log('1. Go to http://localhost:3000/login')
  console.log('2. Email:', testEmail)
  console.log('3. Password:', testPassword)
  console.log('4. If login fails, check email for confirmation link first')
}

createTestUser().catch(console.error) 