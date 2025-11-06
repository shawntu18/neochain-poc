// app/login/page.tsx
'use client' // 这是一个客户端组件，因为它需要处理表单和状态

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client' // 导入我们刚创建的客户端

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    // 我们将同时尝试登录和注册 (PoC 简化)
    // 首先尝试登录
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      // 如果登录失败 (e.g., 用户不存在)，尝试注册
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      })
      
      if (signUpError) {
        // 如果注册也失败 (e.g., 密码太短)
        setError(signUpError.message)
      } else {
        // 注册成功，Supabase 会自动处理登录
        router.push('/dashboard/pda') // 注册并登录成功
      }
    } else {
      // 登录成功
      router.push('/dashboard/pda')
    }
  }

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto' }}>
      <h1>NeoChain PoC 登录</h1>
      <p>输入任意邮箱/密码。如果用户不存在，将自动注册。</p>
      <form onSubmit={handleLogin}>
        <label>
          邮箱:
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
          />
        </label>
        <label>
          密码: (Supabase 默认需要至少6位)
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
          />
        </label>
        <button type="submit" style={{ padding: '10px 20px' }}>
          登录 / 注册
        </button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </form>
    </div>
  )
}

