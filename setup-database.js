const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://drlcdzmwyspdxqqclthc.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRybGNkem13eXNwZHhxcWNsdGhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNjA0MDcsImV4cCI6MjA2MzkzNjQwN30.UvZrKvbfEF9BB0bBGH32NZQVleeaXPB1ITthEK0Yhyg'

const supabase = createClient(supabaseUrl, supabaseKey)

async function setupDatabase() {
  console.log('Setting up database...')
  
  try {
    // Test connection
    const { data, error } = await supabase.from('membership_plans').select('*').limit(1)
    
    if (error) {
      console.log('Database tables may not exist yet. Error:', error.message)
      console.log('Please run the database-schema.sql file in your Supabase dashboard first.')
      return
    }
    
    console.log('Database connection successful!')
    
    // Check if sample data exists
    const { data: plans } = await supabase.from('membership_plans').select('*')
    
    if (plans && plans.length > 0) {
      console.log('Sample data already exists!')
      console.log('Membership plans:', plans.length)
    } else {
      console.log('No sample data found. Please run the database-schema.sql file.')
    }
    
    // Create a test admin user (this would normally be done through Supabase Auth)
    console.log('To test the application, please:')
    console.log('1. Go to your Supabase dashboard')
    console.log('2. Run the database-schema.sql file in the SQL editor')
    console.log('3. Create a test user through the Auth section')
    console.log('4. Or use the signup form in the application')
    
  } catch (error) {
    console.error('Error setting up database:', error)
  }
}

setupDatabase() 