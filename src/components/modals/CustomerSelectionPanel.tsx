import { useState, useMemo } from 'react'
import { formatCurrency } from '../../lib/utils'
import type { Customer } from '../../types'

interface CustomerSelectionPanelProps {
  customers?: Customer[]
  selectedCustomerId: number
  onSelectCustomer: (customerId: number) => void
  transactionType: 'sales' | 'purchase'
}

export default function CustomerSelectionPanel({
  customers,
  selectedCustomerId,
  onSelectCustomer,
  transactionType
}: CustomerSelectionPanelProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'customer' | 'supplier'>('all')

  // 거래 유형에 따른 스마트 필터링
  const relevantCustomers = useMemo(() => {
    if (!customers) return []
    
    const baseFilter = customers.filter(customer => {
      // 거래 유형에 따른 필터링
      const typeMatch = transactionType === 'sales' 
        ? customer.type === 'customer'  // 매출은 고객만
        : customer.type === 'supplier'  // 매입은 공급업체만
      
      // 추가 타입 필터가 있다면 적용
      const additionalTypeMatch = filterType === 'all' || customer.type === filterType
      
      // 검색어 필터링
      const searchMatch = !searchQuery || 
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.business_number?.includes(searchQuery) ||
        customer.contact_person?.toLowerCase().includes(searchQuery.toLowerCase())
      
      return typeMatch && additionalTypeMatch && searchMatch
    })
    
    // 활성 거래처 먼저, 이름순 정렬
    return baseFilter.sort((a, b) => {
      if (a.is_active && !b.is_active) return -1
      if (!a.is_active && b.is_active) return 1
      return a.name.localeCompare(b.name)
    })
  }, [customers, transactionType, filterType, searchQuery])

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">
          {transactionType === 'sales' ? '🛒 고객 선택' : '🏭 공급업체 선택'}
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          {transactionType === 'sales' ? '매출' : '매입'} 거래할 {transactionType === 'sales' ? '고객' : '공급업체'}를 선택하세요
        </p>
      </div>

      {/* 검색 및 필터 */}
      <div className="px-4 py-3 border-b border-gray-200 space-y-3">
        {/* 검색창 */}
        <div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="거래처명, 사업자번호, 담당자로 검색..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* 타입 필터 탭 */}
        <div className="flex space-x-1 bg-gray-100 rounded-md p-1">
          <button
            onClick={() => setFilterType('all')}
            className={`flex-1 text-xs font-medium py-2 px-3 rounded transition-colors ${
              filterType === 'all'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            전체
          </button>
          <button
            onClick={() => setFilterType('customer')}
            className={`flex-1 text-xs font-medium py-2 px-3 rounded transition-colors ${
              filterType === 'customer'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🛒 고객
          </button>
          <button
            onClick={() => setFilterType('supplier')}
            className={`flex-1 text-xs font-medium py-2 px-3 rounded transition-colors ${
              filterType === 'supplier'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🏭 공급업체
          </button>
        </div>
      </div>

      {/* 거래처 목록 */}
      <div className="flex-1 overflow-y-auto">
        {relevantCustomers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-sm">
              {searchQuery ? '검색 조건에 맞는 거래처가 없습니다' : `${transactionType === 'sales' ? '고객이' : '공급업체가'} 없습니다`}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-2 text-xs text-blue-600 hover:text-blue-800"
              >
                검색어 지우기
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {relevantCustomers.map((customer) => (
              <div
                key={customer.id}
                onClick={() => onSelectCustomer(customer.id!)}
                className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedCustomerId === customer.id 
                    ? 'bg-blue-50 border-r-4 border-blue-500' 
                    : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  {/* 아이콘 */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                    customer.type === 'customer' 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-blue-100 text-blue-600'
                  }`}>
                    {customer.type === 'customer' ? '🛒' : '🏭'}
                  </div>

                  {/* 정보 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className={`text-sm font-medium truncate ${
                        selectedCustomerId === customer.id 
                          ? 'text-blue-900' 
                          : 'text-gray-900'
                      }`}>
                        {customer.name}
                      </h4>
                      {!customer.is_active && (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          비활성
                        </span>
                      )}
                    </div>

                    {/* 세부 정보 */}
                    <div className="mt-1 space-y-1">
                      {customer.business_number && (
                        <p className="text-xs text-gray-500">
                          사업자: {customer.business_number}
                        </p>
                      )}
                      {customer.contact_person && (
                        <p className="text-xs text-gray-500">
                          담당자: {customer.contact_person}
                        </p>
                      )}
                      {customer.phone && (
                        <p className="text-xs text-gray-500">
                          📞 {customer.phone}
                        </p>
                      )}
                    </div>

                    {/* 선택 표시 */}
                    {selectedCustomerId === customer.id && (
                      <div className="mt-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          ✓ 선택됨
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 푸터 통계 */}
      <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>
            총 {relevantCustomers.length}개 {transactionType === 'sales' ? '고객' : '공급업체'}
          </span>
          {selectedCustomerId > 0 && (
            <span className="text-blue-600 font-medium">
              거래처 선택 완료
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
