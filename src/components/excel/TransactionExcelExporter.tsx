import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { customerAPI } from '../../lib/tauri'
import { generateTransactionExcel } from '../../lib/excel'
import { formatCurrency } from '../../lib/utils'
import type { TransactionWithItems } from '../../types'

interface TransactionExcelExporterProps {
  transactions: TransactionWithItems[]
}

interface FilterOptions {
  dateFrom: string
  dateTo: string
  customerId: string
  transactionType: 'all' | 'sales' | 'purchase'
  searchQuery: string
}

export default function TransactionExcelExporter({ transactions }: TransactionExcelExporterProps) {
  // 필터 상태
  const [filters, setFilters] = useState<FilterOptions>({
    dateFrom: '',
    dateTo: '',
    customerId: 'all',
    transactionType: 'all',
    searchQuery: ''
  })

  const [isExporting, setIsExporting] = useState(false)

  // 거래처 목록 조회
  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customerAPI.getAll()
  })

  // 필터링된 거래 데이터
  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      // 날짜 필터
      if (filters.dateFrom && transaction.transaction_date < filters.dateFrom) return false
      if (filters.dateTo && transaction.transaction_date > filters.dateTo) return false
      
      // 거래처 필터
      if (filters.customerId !== 'all' && transaction.customer_id !== parseInt(filters.customerId)) return false
      
      // 거래 유형 필터
      if (filters.transactionType !== 'all' && transaction.transaction_type !== filters.transactionType) return false
      
      // 검색어 필터
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase()
        if (!transaction.customer_name.toLowerCase().includes(query)) {
          const hasProduct = transaction.items?.some(item => 
            item.product_name.toLowerCase().includes(query)
          )
          if (!hasProduct) return false
        }
      }
      
      return true
    })
  }, [transactions, filters])

  // 통계 계산
  const stats = useMemo(() => {
    const salesTransactions = filteredTransactions.filter(t => t.transaction_type === 'sales')
    const purchaseTransactions = filteredTransactions.filter(t => t.transaction_type === 'purchase')
    
    const totalSales = salesTransactions.reduce((sum, t) => sum + t.total_amount, 0)
    const totalPurchases = purchaseTransactions.reduce((sum, t) => sum + t.total_amount, 0)
    const profit = totalSales - totalPurchases

    return {
      total: filteredTransactions.length,
      sales: salesTransactions.length,
      purchases: purchaseTransactions.length,
      totalSales,
      totalPurchases,
      profit
    }
  }, [filteredTransactions])

  // 필터 변경 핸들러
  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  // 필터 초기화
  const handleResetFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      customerId: 'all',
      transactionType: 'all',
      searchQuery: ''
    })
  }

  // Excel 내보내기
  const handleExport = async () => {
    if (filteredTransactions.length === 0) {
      alert('내보낼 거래 데이터가 없습니다')
      return
    }

    setIsExporting(true)
    
    try {
      generateTransactionExcel(filteredTransactions, filters)
    } catch (error) {
      console.error('Excel 내보내기 오류:', error)
      alert('Excel 내보내기 중 오류가 발생했습니다.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 거래 내역 Excel 다운로드</h3>
      
      {/* 필터 섹션 */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-3">🔍 필터 조건</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 시작 날짜 */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              시작 날짜
            </label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 종료 날짜 */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              종료 날짜
            </label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 거래처 선택 */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              거래처
            </label>
            <select
              value={filters.customerId}
              onChange={(e) => handleFilterChange('customerId', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">전체 거래처</option>
              {customers?.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} ({customer.type === 'customer' ? '고객' : '공급업체'})
                </option>
              ))}
            </select>
          </div>

          {/* 거래 유형 */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              거래 유형
            </label>
            <select
              value={filters.transactionType}
              onChange={(e) => handleFilterChange('transactionType', e.target.value as any)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">전체</option>
              <option value="sales">매출</option>
              <option value="purchase">매입</option>
            </select>
          </div>

          {/* 검색어 */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              검색어 (거래처/상품)
            </label>
            <input
              type="text"
              value={filters.searchQuery}
              onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
              placeholder="거래처명 또는 상품명"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 초기화 버튼 */}
          <div className="flex items-end">
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              필터 초기화
            </button>
          </div>
        </div>
      </div>

      {/* 통계 정보 */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-900 mb-3">📈 필터링된 데이터 통계</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="text-lg font-bold text-blue-600">{stats.total}</div>
            <div className="text-xs text-blue-800">총 거래</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-3">
            <div className="text-lg font-bold text-purple-600">{stats.sales}</div>
            <div className="text-xs text-purple-800">매출 거래</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-3">
            <div className="text-lg font-bold text-orange-600">{stats.purchases}</div>
            <div className="text-xs text-orange-800">매입 거래</div>
          </div>
        </div>

        {/* 금액 통계 */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-emerald-50 rounded-lg p-3">
            <div className="text-sm font-semibold text-emerald-600">총 매출</div>
            <div className="text-lg font-bold text-emerald-800">{formatCurrency(stats.totalSales)}</div>
          </div>
          <div className="bg-red-50 rounded-lg p-3">
            <div className="text-sm font-semibold text-red-600">총 매입</div>
            <div className="text-lg font-bold text-red-800">{formatCurrency(stats.totalPurchases)}</div>
          </div>
          <div className={`rounded-lg p-3 ${stats.profit >= 0 ? 'bg-blue-50' : 'bg-yellow-50'}`}>
            <div className={`text-sm font-semibold ${stats.profit >= 0 ? 'text-blue-600' : 'text-yellow-600'}`}>
              수익
            </div>
            <div className={`text-lg font-bold ${stats.profit >= 0 ? 'text-blue-800' : 'text-yellow-800'}`}>
              {formatCurrency(stats.profit)}
            </div>
          </div>
        </div>
      </div>

      {/* 내보내기 버튼 */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          {filteredTransactions.length > 0 ? (
            <>
              <span className="font-medium">{filteredTransactions.length}개</span>의 거래를 Excel로 내보냅니다
            </>
          ) : (
            '조건에 맞는 거래 데이터가 없습니다'
          )}
        </div>
        <button
          onClick={handleExport}
          disabled={filteredTransactions.length === 0 || isExporting}
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
        <h5 className="text-sm font-medium text-blue-900 mb-2">💡 Excel 다운로드 기능</h5>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• 5개 시트: 통계 요약, 거래 요약(등록일시 순), 거래 상세(상품별), 거래처별 집계, 상품별 집계</li>
          <li>• '거래 요약' 시트: 한 건당 한 줄로 표시 (등록일시 포함)</li>
          <li>• '거래 상세' 시트: 상품별로 상세 내역 표시 (이력번호 + 등록일시 포함)</li>
          <li>• 날짜, 거래처, 거래유형, 검색어로 세밀한 필터링 가능</li>
          <li>• 파일명에 필터 조건이 자동으로 반영됩니다</li>
          <li>• ₩ 통화 형식, 날짜 형식 자동 적용</li>
          <li>• 이력번호 포함, 한글 깨짐 없음</li>
        </ul>
      </div>
    </div>
  )
}
