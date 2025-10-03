import { useState, useEffect } from 'react'
import { getCurrentSession, logout, createDemoData } from '../lib/auth/index'
import { initializeCurrentCompanyData } from '../lib/tauri'
import type { UserSession } from '../types'
import LoginPage from '../pages/auth/LoginPage'
import RegisterPage from '../pages/auth/RegisterPage'
import { useQueryClient } from '@tanstack/react-query'

interface AuthWrapperProps {
  children: React.ReactNode
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const [session, setSession] = useState<UserSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const queryClient = useQueryClient()

  useEffect(() => {
    // 데모 데이터 생성
    createDemoData()
    
    // 세션 확인
    const currentSession = getCurrentSession()
    if (currentSession) {
      // 회사별 데이터 초기화
      initializeCurrentCompanyData()
    }
    setSession(currentSession)
    setIsLoading(false)
  }, [])

  const handleLoginSuccess = () => {
    const currentSession = getCurrentSession()
    if (currentSession) {
      // 회사별 데이터 초기화
      initializeCurrentCompanyData()
      // React Query 캐시 초기화 (회사별 데이터 분리)
      queryClient.clear()
    }
    setSession(currentSession)
    // 로그인 후 페이지 새로고침하여 세션 완전히 적용
    window.location.reload()
  }

  const handleRegisterSuccess = () => {
    setAuthMode('login')
  }

  const handleLogout = () => {
    logout()
    queryClient.clear() // 로그아웃 시 캐시 클리어
    setSession(null)
  }

  // 로딩 중
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  // 로그인되지 않은 경우
  if (!session) {
    if (authMode === 'register') {
      return (
        <RegisterPage
          onRegisterSuccess={handleRegisterSuccess}
          onBack={() => setAuthMode('login')}
        />
      )
    }
    
    return (
      <LoginPage 
        onLoginSuccess={handleLoginSuccess}
        onShowRegister={() => setAuthMode('register')}
      />
    )
  }

  // 로그인된 경우 - 메인 앱 렌더링
  return (
    <div>
      {/* 사용자 세션 정보를 context로 제공 */}
      <SessionContext.Provider value={{ session, logout: handleLogout }}>
        {children}
      </SessionContext.Provider>
    </div>
  )
}

// 세션 컨텍스트
import { createContext, useContext } from 'react'

const SessionContext = createContext<{
  session: UserSession | null
  logout: () => void
}>({
  session: null,
  logout: () => {}
})

export const useSession = () => {
  return useContext(SessionContext)
}