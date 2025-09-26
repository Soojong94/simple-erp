import { useState, useMemo } from 'react'
import PageSidebar, { 
  SidebarSection, 
  SidebarCard,
  SidebarEmptyState 
} from './PageSidebar'
import type { Customer } from '../../types'

interface TransactionsSidebarContentProps {
  customers?: Customer[]
  searchTerm: string  // 🆕 부모로부터 받음
  onSearchChange: (term: string) => void  // 🆕 부모에게 알림
  onCustomerClick: (customerId: number) => void
  onAddTransactionWithCustomer: (customerId: number) => void
  onFilterChange: (filters: {
    searchTerm: string
    customerFilter: 'all' | 'customer' | 'supplier'
    transactionTypeFilter: 'all' | 'sales' | 'purchase'
  }) => void
}

export default function TransactionsSidebarContent({
  customers,
  searchTerm,  // 🆕 props로 받음
  onSearchChange,  // 🆕 props로 받음
  onCustomerClick,
  onAddTransactionWithCustomer,
  onFilterChange
}: TransactionsSidebarContentProps) {
  // const [searchTerm, setSearchTerm] = useState('')  // ❌ 삭제
  const [customerFilter, setCustomerFilter] = useState<'all' | 'customer' | 'supplier'>('all')
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<'all' | 'sales' | 'purchase'>('all')

  // 필터링된 거래처 목록
  const filteredCustomers = useMemo(() => {
    if (!customers) return []

    return customers.filter(customer => {
      // 검색어 필터링
      const matchesSearch = searchTerm === '' || 
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.business_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.contact_person?.toLowerCase().includes(searchTerm.toLowerCase())

      // 거래처 타입 필터링
      const matchesCustomerFilter = customerFilter === 'all' || customer.type === customerFilter

      // 거래 목적별 스마트 필터링
      let matchesTransactionType = true
      if (transactionTypeFilter === 'sales') {
        // 매출 거래 → 고객만
        matchesTransactionType = customer.type === 'customer'
      } else if (transactionTypeFilter === 'purchase') {
        // 매입 거래 → 공급업체만  
        matchesTransactionType = customer.type === 'supplier'
      }

      return matchesSearch && matchesCustomerFilter && matchesTransactionType
    }).sort((a, b) => a.name.localeCompare(b.name))
  }, [customers, searchTerm, customerFilter, transactionTypeFilter])

  // 필터 변경 시 부모에게 알림
  const handleFilterChange = (newFilters: Partial<typeof transactionTypeFilter>) => {
    const filters = {
      searchTerm,
      customerFilter,
      transactionTypeFilter,
      ...newFilters
    }
    
    onFilterChange(filters)
  }

  const handleSearchChange = (value: string) => {
    // setSearchTerm(value)  // ❌ 삭제
    onSearchChange(value)  // 🆕 부모에게 알림
    handleFilterChange({ searchTerm: value } as any)
  }

  const handleCustomerFilterChange = (value: typeof customerFilter) => {
    setCustomerFilter(value)
    handleFilterChange({ customerFilter: value } as any)
  }

  const handleTransactionTypeFilterChange = (value: typeof transactionTypeFilter) => {
    setTransactionTypeFilter(value)
    handleFilterChange({ transactionTypeFilter: value } as any)
  }

  return (
    <>
      <SidebarSection title="🏢 전체 거래처">
        {/* 검색 및 필터 컨트롤 */}
        <div className="space-y-3 mb-4">
          {/* 검색창 */}
          <div className="relative">
            <input
              type="text"
              placeholder="거래처 검색..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="absolute right-3 top-2.5 text-gray-400">🔍</div>
          </div>

          {/* 거래 목적 필터 */}
          <select
            value={transactionTypeFilter}
            onChange={(e) => handleTransactionTypeFilterChange(e.target.value as typeof transactionTypeFilter)}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">🔄 전체 거래처</option>
            <option value="sales">💰 매출용 (고객)</option>
            <option value="purchase">📦 매입용 (공급업체)</option>
          </select>

          {/* 거래처 타입 필터 (추가 옵션) */}
          {transactionTypeFilter === 'all' && (
            <select
              value={customerFilter}
              onChange={(e) => handleCustomerFilterChange(e.target.value as typeof customerFilter)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
            >
              <option value="all">📋 모든 타입</option>
              <option value="customer">🛒 고객만</option>
              <option value="supplier">🏭 공급업체만</option>
            </select>
          )}
        </div>

        {/* 필터링 결과 정보 */}
        <div className="flex justify-between items-center mb-3 text-xs text-gray-500">
          <span>총 {filteredCustomers.length}개 거래처</span>
          {searchTerm && (
            <button 
              onClick={() => handleSearchChange('')}
              className="text-blue-600 hover:text-blue-800"
            >
              검색 초기화
            </button>
          )}
        </div>

        {/* 거래처 목록 (스크롤 가능) */}
        {filteredCustomers.length > 0 ? (
          <div className="max-h-[600px] overflow-y-auto space-y-2 pr-2">
            {filteredCustomers.map(customer => (
              <SidebarCard
                key={customer.id}
                onClick={() => onCustomerClick(customer.id!)}
                icon={customer.type === 'customer' ? '🛒' : '🏭'}
                title={customer.name}
                badge={{
                  text: customer.type === 'customer' ? '고객' : '공급업체',
                  className: customer.type === 'customer' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-blue-100 text-blue-800'
                }}
                subtitle={customer.phone ? customer.phone.slice(-4) : customer.business_number?.slice(-4)}
                extra={customer.contact_person}
                action={
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onAddTransactionWithCustomer(customer.id!)
                    }}
                    className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                    title="이 거래처로 바로 거래 추가"
                  >
                    ✚ 거래
                  </button>
                }
              />
            ))}
          </div>
        ) : (
          <SidebarEmptyState 
            icon="🔍" 
            message={searchTerm ? "검색 결과가 없습니다" : "거래처가 없습니다"} 
          />
        )}
      </SidebarSection>
    </>
  )
}
