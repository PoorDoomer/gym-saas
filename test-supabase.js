const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('Supabase URL:', supabaseUrl)
console.log('Supabase Key:', supabaseKey ? 'Present' : 'Missing')

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  try {
    console.log('Testing Supabase connection...')
    
    // Test basic query
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .limit(5)
    
    if (error) {
      console.error('Error:', error)
    } else {
      console.log('Success! Found', data.length, 'members')
      console.log('Sample data:', data[0])
    }
  } catch (err) {
    console.error('Connection failed:', err)
  }
}

testConnection() 