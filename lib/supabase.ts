import { createClient } from '@supabase/supabase-js';

// Supabase configuration
// These should be set in environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  // Only warn in development/runtime, not during build
  if (process.env.NODE_ENV !== 'production' || typeof window !== 'undefined') {
    console.warn('Supabase URL or Anon Key is missing. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env file');
  }
}

// Create Supabase client for client-side usage
// Use dummy values during build if env vars are missing to prevent build errors
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

// Create Supabase client for server-side usage (with service role key if needed)
// For server-side operations that require elevated permissions
export const createServerClient = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (serviceRoleKey) {
    return createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }
  return supabase;
};

