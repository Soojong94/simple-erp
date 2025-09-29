import { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  Home, 
  Users, 
  Package, 
  ShoppingCart, 
  FileText, 
  BarChart3, 
  Settings,
  Archive,
  LogOut
} from 'lucide-react'
import { clsx } from 'clsx'
import { useSession } from './AuthWrapper'

interface LayoutProps {
  children: ReactNode
}

const navigation = [
  { name: '대시보드', href: '/', icon: Home },
  { name: '거래처 관리', href: '/customers', icon: Users },
  { name: '상품 관리', href: '/products', icon: Package },
  { name: '재고 관리', href: '/inventory', icon: Archive },
  { name: '거래 관리', href: '/transactions', icon: ShoppingCart },
  { name: '보고서', href: '/reports', icon: BarChart3 },
  { name: '설정', href: '/settings', icon: Settings },
]

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const { session, logout: handleLogout } = useSession()

  const onLogout = () => {
    if (confirm('로그아웃 하시겠습니까?')) {
      handleLogout()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
        <div className="flex h-16 shrink-0 items-center px-6 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-900">Simple ERP</h1>
        </div>
        
        <nav className="mt-6 px-3">
          <ul className="space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={clsx(
                      'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                      isActive
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                    )}
                  >
                    <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                    {item.name}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
        
        {/* 사용자 정보 및 로그아웃 */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 text-sm font-medium">
                    {(session?.display_name || 'U').charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {session?.display_name || '사용자'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {session?.role === 'admin' ? '관리자' : '사용자'} • ID: {session?.company_id || 1}
                </p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="ml-2 p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              title="로그아웃"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="pl-64">
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1"></div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <div className="text-sm text-gray-700">
                중소기업용 무료 ERP 시스템
              </div>
            </div>
          </div>
        </div>

        <main className="py-6">
          <div className="px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}