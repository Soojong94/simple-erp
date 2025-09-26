interface SortOption {
  value: string
  label: string
  icon?: string
}

interface SortDropdownProps {
  options: SortOption[]
  value: string
  onChange: (value: string) => void
  order: 'asc' | 'desc'
  onOrderChange: (order: 'asc' | 'desc') => void
  className?: string
}

export default function SortDropdown({
  options,
  value,
  onChange,
  order,
  onOrderChange,
  className = ''
}: SortDropdownProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* 정렬 기준 선택 */}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="block px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.icon && `${option.icon} `}{option.label}
          </option>
        ))}
      </select>

      {/* 오름차순/내림차순 토글 */}
      <button
        type="button"
        onClick={() => onOrderChange(order === 'asc' ? 'desc' : 'asc')}
        className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        title={order === 'asc' ? '오름차순' : '내림차순'}
      >
        {order === 'asc' ? (
          <>
            <span className="mr-1">↑</span>
            <span className="hidden sm:inline">오름차순</span>
          </>
        ) : (
          <>
            <span className="mr-1">↓</span>
            <span className="hidden sm:inline">내림차순</span>
          </>
        )}
      </button>
    </div>
  )
}
