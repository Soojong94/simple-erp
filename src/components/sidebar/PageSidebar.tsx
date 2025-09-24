import { ReactNode } from 'react'

interface PageSidebarProps {
  children: ReactNode
  className?: string
}

export default function PageSidebar({ children, className = '' }: PageSidebarProps) {
  return (
    <div className={`w-80 bg-gray-50 border-l border-gray-200 p-4 ${className}`}>
      <div className="sticky top-6 space-y-6">
        {children}
      </div>
    </div>
  )
}

// 사이드바 섹션 컴포넌트
export function SidebarSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-900 mb-3">{title}</h3>
      {children}
    </div>
  )
}

// 빠른 액션 버튼들 컴포넌트
export function QuickActionButtons({ children }: { children: ReactNode }) {
  return (
    <div className="pt-3 border-t border-gray-200">
      <div className="grid grid-cols-1 gap-2">
        {children}
      </div>
    </div>
  )
}

// 개별 빠른 액션 버튼
export function QuickActionButton({ 
  onClick, 
  className = '', 
  children 
}: { 
  onClick: () => void
  className?: string
  children: ReactNode 
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 text-xs rounded-md transition-colors ${className}`}
    >
      {children}
    </button>
  )
}

// 카드 아이템 (거래처, 상품 등에 사용)
export function SidebarCard({ 
  onClick, 
  icon, 
  title, 
  subtitle, 
  badge, 
  extra 
}: {
  onClick?: () => void
  icon: string
  title: string
  subtitle?: string
  badge?: { text: string; className: string }
  extra?: string
}) {
  return (
    <div 
      className={`bg-white rounded-lg p-2 shadow-sm border hover:shadow-md transition-shadow ${
        onClick ? 'cursor-pointer' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center space-x-2">
        <span className="text-sm">{icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {title}
          </p>
          <div className="flex items-center justify-between">
            {badge && (
              <span className={`inline-flex px-1.5 py-0.5 rounded text-xs font-medium ${badge.className}`}>
                {badge.text}
              </span>
            )}
            {subtitle && (
              <span className="text-xs text-gray-500 truncate ml-1">
                {subtitle}
              </span>
            )}
            {extra && (
              <span className="text-xs text-green-600 font-medium">
                {extra}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// 빈 상태 표시
export function SidebarEmptyState({ icon, message }: { icon: string; message: string }) {
  return (
    <div className="text-center py-4 text-gray-500">
      <div className="text-2xl mb-1">{icon}</div>
      <p className="text-xs">{message}</p>
    </div>
  )
}
