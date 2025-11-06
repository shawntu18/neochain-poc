// utils/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // 注意：我们使用 .env.local 中的环境变量
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

