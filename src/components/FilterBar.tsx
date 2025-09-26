import { ReactNode } from 'react'

interface FilterBarProps {
  children: ReactNode
  className?: string
}

export default function FilterBar({ children, className = '' }: FilterBarProps) {
  return (
    <div className={`bg-gray-50 px-6 py-4 rounded-lg ${className}`}>
      <div className="flex flex-wrap gap-4 items-center">
        {children}
      </div>
    </div>
  )
}

// 검색 입력 컴포넌트
interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function SearchInput({ 
  value, 
  onChange, 
  placeholder = "검색...",
  className = '' 
}: SearchInputProps) {
  return (
    <div className={`flex-1 min-w-0 ${className}`}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
      />
    </div>
  )
}

// 필터 선택 컴포넌트
interface FilterSelectProps {
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  className?: string
}

export function FilterSelect({ 
  value, 
  onChange, 
  options,
  className = '' 
}: FilterSelectProps) {
  return (
    <div className={`flex-shrink-0 ${className}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}

// 체크박스 필터 컴포넌트
interface FilterCheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  className?: string
}

export function FilterCheckbox({ 
  checked, 
  onChange, 
  label,
  className = '' 
}: FilterCheckboxProps) {
  return (
    <div className={`flex items-center ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
      />
      <label className="ml-2 text-sm text-gray-700">
        {label}
      </label>
    </div>
  )
}
