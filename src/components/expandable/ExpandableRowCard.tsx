import { ReactNode } from 'react'

interface ExpandableRowCardProps {
  children: ReactNode
  className?: string
}

/**
 * 확장된 행에서 사용하는 공통 카드 컴포넌트
 */
export default function ExpandableRowCard({ children, className = '' }: ExpandableRowCardProps) {
  return (
    <div className={`bg-gray-50 border-l-4 border-blue-500 ${className}`}>
      <div className="px-6 py-4">
        {children}
      </div>
    </div>
  )
}

interface CardSectionProps {
  title: string
  icon: string
  children: ReactNode
  className?: string
}

/**
 * 카드 내부 섹션 컴포넌트
 */
export function CardSection({ title, icon, children, className = '' }: CardSectionProps) {
  return (
    <div className={`${className}`}>
      <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
        <span className="mr-2">{icon}</span>
        {title}
      </h4>
      <div className="space-y-2">
        {children}
      </div>
    </div>
  )
}

interface InfoItemProps {
  label: string
  value: string | number
  className?: string
}

/**
 * 정보 항목 표시 컴포넌트
 */
export function InfoItem({ label, value, className = '' }: InfoItemProps) {
  return (
    <div className={`flex justify-between text-sm ${className}`}>
      <span className="text-gray-600">{label}:</span>
      <span className="text-gray-900 font-medium">{value}</span>
    </div>
  )
}
