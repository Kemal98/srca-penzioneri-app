import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://latwktpjjaxtojchkmvl.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhdHdrdHBqamF4dG9qY2hrbXZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5NTQ0ODUsImV4cCI6MjA2NDUzMDQ4NX0.t1rH5eDaLpb4jBZ8f97nVYKm2zUzRxGtVpWOAUdDg90'

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  db: {
    schema: 'public'
  }
})

// Test connection and log detailed information
const testConnection = async () => {
  try {
    console.log('Testing Supabase connection...');
    console.log('Supabase URL:', supabaseUrl);
    console.log('Supabase Key:', supabaseKey.substring(0, 10) + '...');
    
    const { data, error } = await supabase
      .from('reservations')
      .select('count')
      .single();
    
    if (error) {
      console.error('Supabase connection test failed:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
    } else {
      console.log('Supabase connected successfully. Current reservations count:', data?.count);
    }
  } catch (err) {
    console.error('Unexpected error testing Supabase connection:', err);
  }
}

// Run the test
testConnection(); 