import { useState } from 'react'
import { login } from '../../lib/auth'
import type { LoginCredentials } from '../../types'

interface LoginPageProps {
  onLoginSuccess: () => void
  onShowRegister?: () => void
}

export default function LoginPage({ onLoginSuccess, onShowRegister }: LoginPageProps) {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    username: '',
    password: '',
    remember_me: false
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showRegister, setShowRegister] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const result = await login(credentials)
      if (result.success) {
        onLoginSuccess()
      } else {
        setError(result.error || '로그인에 실패했습니다.')
      }
    } catch (err) {
      setError('로그인 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* 헤더 */}
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
            <span className="text-2xl">🥩</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            고기 유통업 ERP
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {showRegister ? '새 회사 계정 생성' : '로그인하여 시작하세요'}
          </p>
        </div>

        {/* 로그인 폼 */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="username" className="sr-only">
                사용자명
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="사용자명"
                value={credentials.username}
                onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                disabled={isLoading}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                비밀번호
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="비밀번호"
                value={credentials.password}
                onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          {/* 로그인 유지 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                checked={credentials.remember_me}
                onChange={(e) => setCredentials(prev => ({ ...prev, remember_me: e.target.checked }))}
                disabled={isLoading}
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                로그인 상태 유지
              </label>
            </div>
          </div>

          {/* 로그인 버튼 */}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '로그인 중...' : '로그인'}
            </button>
          </div>

          {/* 회원가입 링크 */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => onShowRegister ? onShowRegister() : setShowRegister(!showRegister)}
              className="text-blue-600 hover:text-blue-500 text-sm"
              disabled={isLoading}
            >
              {showRegister ? '로그인으로 돌아가기' : '새 회사 계정 만들기'}
            </button>
          </div>
        </form>

        {/* 데모 계정 안내 */}
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-green-900 mb-2">💡 데모 계정</h3>
          <div className="text-sm text-green-800 space-y-1">
            <p>• 사용자명: <code className="bg-green-100 px-1 rounded">admin</code> / 비밀번호: <code className="bg-green-100 px-1 rounded">1234</code></p>
            <p>• 사용자명: <code className="bg-green-100 px-1 rounded">demo</code> / 비밀번호: <code className="bg-green-100 px-1 rounded">1234</code></p>
            <p className="text-xs mt-2 text-green-600">각각 다른 회사 데이터를 사용합니다.</p>
          </div>
        </div>
      </div>
    </div>
  )
}