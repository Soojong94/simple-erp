import { useState, useMemo } from 'react'
import { generateCustomerExcel } from '../../lib/excel/customerExcel'
import type { Customer } from '../../types'

interface CustomerExcelExporterProps {
  customers: Customer[]
}

interface FilterOptions {
  customerType: 'all' | 'customer' | 'supplier'
  isActive: 'all' | 'true' | 'false'
  searchQuery: string
}

export default function CustomerExcelExporter({ customers }: CustomerExcelExporterProps) {
  const [filters, setFilters] = useState<FilterOptions>({
    customerType: 'all',
    isActive: 'all',
    searchQuery: ''
  })

  const [isExporting, setIsExporting] = useState(false)

  // 필터링된 거래처
  const filteredCustomers = useMemo(() => {
    return customers.filter(customer => {
      if (filters.customerType !== 'all' && customer.type !== filters.customerType) 
        return false
      
      if (filters.isActive === 'true' && !customer.is_active) 
        return false
      
      if (filters.isActive === 'false' && customer.is_active) 
        return false
      
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase()
        return (
          customer.name.toLowerCase().includes(query) ||
          customer.business_number?.toLowerCase().includes(query) ||
          customer.contact_person?.toLowerCase().includes(query)
        )
      }
      
      return true
    })
  }, [customers, filters])

  // 통계
  const stats = useMemo(() => {
    return {
      total: filteredCustomers.length,
      customers: filteredCustomers.filter(c => c.type === 'customer').length,
      suppliers: filteredCustomers.filter(c => c.type === 'supplier').length,
      active: filteredCustomers.filter(c => c.is_active).length
    }
  }, [filteredCustomers])

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleResetFilters = () => {
    setFilters({
      customerType: 'all',
      isActive: 'all',
      searchQuery: ''
    })
  }

  const handleExport = async () => {
    if (filteredCustomers.length === 0) {
      alert('내보낼 거래처 데이터가 없습니다')
      return
    }

    setIsExporting(true)
    
    try {
      generateCustomerExcel(filteredCustomers, filters)
    } catch (error) {
      console.error('Excel 내보내기 오류:', error)
      alert('Excel 내보내기 중 오류가 발생했습니다.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">🏢 거래처 목록 Excel 다운로드</h3>
      
      {/* 필터 섹션 */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-3">🔍 필터 조건</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 거래처 타입 */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              거래처 구분
            </label>
            <select
              value={filters.customerType}
              onChange={(e) => handleFilterChange('customerType', e.target.value as any)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">전체</option>
              <option value="customer">고객</option>
              <option value="supplier">공급업체</option>
            </select>
          </div>

          {/* 활성 상태 */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              활성 상태
            </label>
            <select
              value={filters.isActive}
              onChange={(e) => handleFilterChange('isActive', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">전체</option>
              <option value="true">활성</option>
              <option value="false">비활성</option>
            </select>
          </div>

          {/* 검색어 */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              검색어
            </label>
            <input
              type="text"
              value={filters.searchQuery}
              onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
              placeholder="거래처명, 사업자번호, 담당자"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-3">
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            필터 초기화
          </button>
        </div>
      </div>

      {/* 통계 */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-900 mb-3">📈 필터링된 데이터 통계</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="text-lg font-bold text-blue-600">{stats.total}</div>
            <div className="text-xs text-blue-800">총 거래처</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-3">
            <div className="text-lg font-bold text-purple-600">{stats.customers}</div>
            <div className="text-xs text-purple-800">고객</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-3">
            <div className="text-lg font-bold text-orange-600">{stats.suppliers}</div>
            <div className="text-xs text-orange-800">공급업체</div>
          </div>
          <div className="bg-emerald-50 rounded-lg p-3">
            <div className="text-lg font-bold text-emerald-600">{stats.active}</div>
            <div className="text-xs text-emerald-800">활성</div>
          </div>
        </div>
      </div>

      {/* 내보내기 버튼 */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          {filteredCustomers.length > 0 ? (
            <>
              <span className="font-medium">{filteredCustomers.length}개</span>의 거래처를 Excel로 내보냅니다
            </>
          ) : (
            '조건에 맞는 거래처 데이터가 없습니다'
          )}
        </div>
        <button
          onClick={handleExport}
          disabled={filteredCustomers.length === 0 || isExporting}
          className="px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExporting ? (
            <>
              <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              내보내는 중...
            </>
          ) : (
            <>
              📥 Excel 다운로드
            </>
          )}
        </button>
      </div>

      {/* 안내 정보 */}
      <div className="mt-6 p-3 bg-blue-50 rounded-md">
        <h5 className="text-sm font-medium text-blue-900 mb-2">💡 거래처 Excel 기능</h5>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• 4개 시트: 거래처 요약, 전체 거래처, 고객 목록, 공급업체 목록</li>
          <li>• 거래처 구분, 활성 상태, 검색어로 필터링 가능</li>
          <li>• 사업자번호, 대표자, 연락처 등 모든 정보 포함</li>
          <li>• 파일명에 필터 조건이 자동으로 반영됩니다</li>
        </ul>
      </div>
    </div>
  )
}
