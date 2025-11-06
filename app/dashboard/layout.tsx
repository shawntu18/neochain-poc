// app/dashboard/layout.tsx
import { createClient } from '@/utils/supabase/server' // 导入服务端客户端
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // 检查用户是否登录
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    // 如果没登录，重定向回登录页
    redirect('/login')
  }

  // 导航栏样式
  const navStyle: React.CSSProperties = {
    display: 'flex',
    gap: '20px',
    padding: '20px',
    backgroundColor: '#f4f4f4',
    borderBottom: '1px solid #ddd',
  }
  const linkStyle: React.CSSProperties = {
    textDecoration: 'none',
    color: 'blue',
    fontWeight: 'bold',
  }

  return (
    <div>
      <nav style={navStyle}>
        <Link href="/dashboard/pda" style={linkStyle}>
          PDA 操作
        </Link>
        <Link href="/dashboard/status" style={linkStyle}>
          实时看板
        </Link>
        {/* 你可以稍后在这里添加一个"登出"按钮 */}
      </nav>
      <main style={{ padding: '20px' }}>
        {children} {/* 这是 /pda 或 /status 页面会渲染的地方 */}
      </main>
    </div>
  )
}

