// utils/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables!\n\n' +
      'Please create a .env.local file in the project root with:\n' +
      'NEXT_PUBLIC_SUPABASE_URL=your-project-url\n' +
      'NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key\n\n' +
      'Get these values from: https://supabase.com/dashboard/project/_/settings/api'
    )
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

