import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://latwktpjjaxtojchkmvl.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhdHdrdHBqamF4dG9qY2hrbXZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5NTQ0ODUsImV4cCI6MjA2NDUzMDQ4NX0.t1rH5eDaLpb4jBZ8f97nVYKm2zUzRxGtVpWOAUdDg90'

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false
  },
  db: {
    schema: 'public'
  }
})

// Test connection and log detailed information
export const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('contact_requests')
      .select('count')
      .single()
    
    if (error) {
      console.error('Greška prilikom testiranja konekcije:', error)
      return false
    }
    
    return true
  } catch (error) {
    console.error('Greška prilikom testiranja konekcije:', error)
    return false
  }
}

// Run the test
testConnection() 