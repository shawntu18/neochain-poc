// utils/supabase/server.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
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

  const cookieStore = await cookies()

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // 备注: 当在 Server Actions 中设置 cookie 时
            // Next.js 会抛出一个错误，但这可以安全地忽略
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // 同上
          }
        },
      },
    }
  )
}

