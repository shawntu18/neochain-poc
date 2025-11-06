// app/page.tsx
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function RootPage() {
  const supabase = createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    // 已登录，去 PDA
    redirect('/dashboard/pda')
  } else {
    // 未登录，去登录
    redirect('/login')
  }
}
