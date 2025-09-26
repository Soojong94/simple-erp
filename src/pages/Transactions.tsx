import { useState, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { transactionAPI, customerAPI, productAPI } from '../lib/tauri'
import { formatCurrency } from '../lib/utils'
import { useExpandableTable } from '../hooks/useExpandableTable'
import TransactionModal from '../components/modals/TransactionModal'
import TransactionExpandableRow from '../components/expandable/TransactionExpandableRow'
import PageSidebar from '../components/sidebar/PageSidebar'
import TransactionsSidebarContent from '../components/sidebar/TransactionsSidebarContent'
import SortDropdown from '../components/SortDropdown'
import InvoicePreviewModal from '../components/invoice/InvoicePreviewModal'  // 🆕 추가
import type { TransactionWithItems } from '../types'

export default function Transactions() {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<TransactionWithItems | undefined>(undefined)
  const [preSelectedCustomerId, setPreSelectedCustomerId] = useState(0)
  
  // 🆕 거래증 모달 상태
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionWithItems | undefined>(undefined)
  
  // 확장형 테이블 관리
  const { expandedId, toggleRow, isExpanded } = useExpandableTable()
  
  // 기본 필터
  const [filterType, setFilterType] = useState<'all' | 'sales' | 'purchase'>('all')
  
  // 정렬 상태
  const [sortBy, setSortBy] = useState<'date' | 'customer' | 'amount' | 'items'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc') // 기본: 최신순
  
  // 사이드바 검색어 상태 (부모에서 관리) 🆕
  const [sidebarSearchTerm, setSidebarSearchTerm] = useState('')
  
  // 고급 검색 필터
  const [advancedFilters, setAdvancedFilters] = useState({
    dateFrom: '',
    dateTo: '',
    customerId: 0,
    searchQuery: '',
    minAmount: '',
    maxAmount: ''
  })
  
  // advancedFilters 변경 감지 (디버그용)
  useEffect(() => {
    console.log('📄 advancedFilters 변경:', advancedFilters)
  }, [advancedFilters])
  
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false)

  // 데이터 조회
  const { data: transactions, isLoading, error } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => transactionAPI.getAll()
  })

  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customerAPI.getAll()
  })
  
  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: () => productAPI.getAll()
  })

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: transactionAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      alert('거래가 삭제되었습니다.')
    }
  })

  // Event handlers
  const handleAddTransaction = () => {
    console.log('🎯 거래 추가 버튼 클릭')
    setEditingTransaction(undefined)
    setPreSelectedCustomerId(0)
    setIsModalOpen(true)
  }

  const handleAddTransactionWithCustomer = (customerId: number) => {
    console.log('🎯 거래처로 거래 추가:', customerId)
    setEditingTransaction(undefined)
    setPreSelectedCustomerId(customerId)
    setIsModalOpen(true)
  }

  const handleEditTransaction = (transaction: TransactionWithItems) => {
    setEditingTransaction(transaction)
    setPreSelectedCustomerId(0)
    setIsModalOpen(true)
  }

  const handleDeleteTransaction = (id: number, customerName: string) => {
    if (confirm(`${customerName}과의 거래를 삭제하시겠습니까?`)) {
      deleteMutation.mutate(id)
    }
  }

  const handlePrintInvoice = (transaction: TransactionWithItems) => {
    console.log('📄 거래증 출력:', transaction.id)
    setSelectedTransaction(transaction)
    setIsInvoiceModalOpen(true)
  }

  // 사이드바 필터 변경 핸들러
  const handleSidebarFilterChange = (filters: {
    searchTerm: string
    customerFilter: 'all' | 'customer' | 'supplier'
    transactionTypeFilter: 'all' | 'sales' | 'purchase'
  }) => {
    console.log('🔄 사이드바 필터 변경:', filters)
    
    // 거래 타입 필터 적용
    if (filters.transactionTypeFilter !== 'all') {
      setFilterType(filters.transactionTypeFilter)
    } else {
      setFilterType('all')
    }
    
    // 검색어 적용
    if (filters.searchTerm !== advancedFilters.searchQuery) {
      setAdvancedFilters(prev => ({ ...prev, searchQuery: filters.searchTerm }))
    }
  }

  const handleResetFilters = () => {
    setFilterType('all')
    setAdvancedFilters({
      dateFrom: '',
      dateTo: '',
      customerId: 0,
      searchQuery: '',
      minAmount: '',
      maxAmount: ''
    })
  }

  // 필터링된 거래 목록
  const filteredTransactions = transactions?.filter(transaction => {
    const matchesType = filterType === 'all' || transaction.transaction_type === filterType
    const matchesDateFrom = !advancedFilters.dateFrom || transaction.transaction_date >= advancedFilters.dateFrom
    const matchesDateTo = !advancedFilters.dateTo || transaction.transaction_date <= advancedFilters.dateTo
    const matchesCustomer = advancedFilters.customerId === 0 || transaction.customer_id === advancedFilters.customerId
    const matchesSearch = !advancedFilters.searchQuery || 
      transaction.customer_name?.toLowerCase().includes(advancedFilters.searchQuery.toLowerCase()) ||
      transaction.notes?.toLowerCase().includes(advancedFilters.searchQuery.toLowerCase()) ||
      transaction.items?.some(item => item.product_name.toLowerCase().includes(advancedFilters.searchQuery.toLowerCase()))
    const matchesMinAmount = !advancedFilters.minAmount || transaction.total_amount >= Number(advancedFilters.minAmount)
    const matchesMaxAmount = !advancedFilters.maxAmount || transaction.total_amount <= Number(advancedFilters.maxAmount)
    
    // 디버그 로그
    if (advancedFilters.searchQuery) {
      console.log('🔍 검색 필터링:', {
        query: advancedFilters.searchQuery,
        transaction_id: transaction.id,
        customer_name: transaction.customer_name,
        matchesSearch
      })
    }
    
    if (advancedFilters.customerId > 0) {
      console.log('🎯 거래처 필터링:', {
        filter_customerId: advancedFilters.customerId,
        transaction_id: transaction.id,
        transaction_customerId: transaction.customer_id,
        customer_name: transaction.customer_name,
        matchesCustomer
      })
    }
    
    return matchesType && matchesDateFrom && matchesDateTo && 
           matchesCustomer && matchesSearch && matchesMinAmount && matchesMaxAmount
  })

  // 정렬된 거래 목록
  const sortedTransactions = useMemo(() => {
    if (!filteredTransactions) return []
    
    return [...filteredTransactions].sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()
          break
        case 'customer':
          comparison = a.customer_name.localeCompare(b.customer_name)
          break
        case 'amount':
          comparison = a.total_amount - b.total_amount
          break
        case 'items':
          comparison = (a.items?.length || 0) - (b.items?.length || 0)
          break
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })
  }, [filteredTransactions, sortBy, sortOrder])

  // 통계 계산 (필터링된 데이터 기준) 🎯
  const stats = {
    total: filteredTransactions?.length || 0,
    sales: filteredTransactions?.filter(t => t.transaction_type === 'sales').length || 0,
    purchase: filteredTransactions?.filter(t => t.transaction_type === 'purchase').length || 0,
    totalSalesAmount: filteredTransactions?.filter(t => t.transaction_type === 'sales')
      .reduce((sum, t) => sum + t.total_amount, 0) || 0,
    totalPurchaseAmount: filteredTransactions?.filter(t => t.transaction_type === 'purchase')
      .reduce((sum, t) => sum + t.total_amount, 0) || 0
  }

  if (error) {
    console.error('Transactions API error:', error)
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">오류가 발생했습니다</div>
        <p className="text-gray-500">거래 목록을 불러올 수 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="flex">
      {/* 메인 컨텐츠 영역 */}
      <div className="flex-1 pr-6">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900">거래 관리</h1>
            <p className="mt-2 text-sm text-gray-700">
              매출 및 매입 거래 내역을 관리합니다. 행을 클릭하면 상세 정보를 볼 수 있습니다.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <button
              type="button"
              onClick={() => handleAddTransaction()}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              거래 추가
            </button>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                    <span className="text-blue-600 text-sm font-medium">📊</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      총 거래
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.total}건
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                    <span className="text-green-600 text-sm font-medium">💰</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      총 매출
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {formatCurrency(stats.totalSalesAmount)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-100 rounded-md flex items-center justify-center">
                    <span className="text-yellow-600 text-sm font-medium">📦</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      총 매입
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {formatCurrency(stats.totalPurchaseAmount)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
                    <span className="text-purple-600 text-sm font-medium">📈</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      수익
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {formatCurrency(stats.totalSalesAmount - stats.totalPurchaseAmount)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 필터 영역 */}
        <div className="mt-6 bg-gray-50 px-6 py-4 rounded-lg">
          {/* 기본 필터 */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={advancedFilters.searchQuery}
                onChange={(e) => setAdvancedFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                placeholder="거래처명, 상품명, 메모로 검색..."
                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex-shrink-0">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as 'all' | 'sales' | 'purchase')}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">전체</option>
                <option value="sales">💰 매출</option>
                <option value="purchase">📦 매입</option>
              </select>
            </div>
            <SortDropdown
              options={[
                { value: 'date', label: '거래일순', icon: '📅' },
                { value: 'customer', label: '거래처명순', icon: '🏬' },
                { value: 'amount', label: '금액순', icon: '💰' },
                { value: 'items', label: '상품수순', icon: '📦' }
              ]}
              value={sortBy}
              onChange={(value) => setSortBy(value as 'date' | 'customer' | 'amount' | 'items')}
              order={sortOrder}
              onOrderChange={setSortOrder}
            />
            <div className="flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                className={`px-4 py-2 text-sm font-medium rounded-md border transition-colors ${
                  showAdvancedSearch 
                    ? 'bg-blue-600 text-white border-blue-600' 
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                고급 검색
              </button>
            </div>
          </div>

          {/* 고급 검색 영역 */}
          {showAdvancedSearch && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              {/* 날짜 빠른 선택 버튼 🎉 */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  빠른 기간 선택
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const today = new Date().toISOString().split('T')[0]
                      setAdvancedFilters(prev => ({ ...prev, dateFrom: today, dateTo: today }))
                    }}
                    className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
                  >
                    📅 오늘
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const today = new Date()
                      const dayOfWeek = today.getDay()
                      const monday = new Date(today)
                      monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
                      const sunday = new Date(monday)
                      sunday.setDate(monday.getDate() + 6)
                      setAdvancedFilters(prev => ({
                        ...prev,
                        dateFrom: monday.toISOString().split('T')[0],
                        dateTo: sunday.toISOString().split('T')[0]
                      }))
                    }}
                    className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
                  >
                    🗓️ 이번 주
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const today = new Date()
                      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
                      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)
                      setAdvancedFilters(prev => ({
                        ...prev,
                        dateFrom: firstDay.toISOString().split('T')[0],
                        dateTo: lastDay.toISOString().split('T')[0]
                      }))
                    }}
                    className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
                  >
                    📆 이번 달
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const today = new Date()
                      const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1)
                      const lastDay = new Date(today.getFullYear(), today.getMonth(), 0)
                      setAdvancedFilters(prev => ({
                        ...prev,
                        dateFrom: firstDay.toISOString().split('T')[0],
                        dateTo: lastDay.toISOString().split('T')[0]
                      }))
                    }}
                    className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
                  >
                    📅 지난 달
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAdvancedFilters(prev => ({ ...prev, dateFrom: '', dateTo: '' }))
                    }}
                    className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
                  >
                    ♻️ 전체 기간
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    시작일
                  </label>
                  <input
                    type="date"
                    value={advancedFilters.dateFrom}
                    onChange={(e) => setAdvancedFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    종료일
                  </label>
                  <input
                    type="date"
                    value={advancedFilters.dateTo}
                    onChange={(e) => setAdvancedFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    거래처
                  </label>
                  <select
                    value={advancedFilters.customerId}
                    onChange={(e) => setAdvancedFilters(prev => ({ ...prev, customerId: Number(e.target.value) }))}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={0}>전체 거래처</option>
                    {customers?.map(customer => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    최소 금액
                  </label>
                  <input
                    type="number"
                    value={advancedFilters.minAmount}
                    onChange={(e) => setAdvancedFilters(prev => ({ ...prev, minAmount: e.target.value }))}
                    placeholder="0"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50"
                >
                  필터 초기화
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 확장형 테이블 */}
        <div className="mt-8 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        거래번호
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        거래일
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        구분
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        거래처
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        상품수
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        총 금액
                      </th>
                      <th className="relative px-6 py-3">
                        <span className="sr-only">액션</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {isLoading ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 text-sm text-gray-500 text-center">
                          <div className="flex justify-center items-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                            <span className="ml-2">로딩 중...</span>
                          </div>
                        </td>
                      </tr>
                    ) : !sortedTransactions || sortedTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 text-sm text-gray-500 text-center">
                          {transactions?.length === 0 ? (
                            <div>
                              <p className="text-gray-900 font-medium">등록된 거래가 없습니다.</p>
                              <p className="text-gray-500 text-xs mt-1">거래 추가 버튼을 클릭하여 첫 거래를 등록해보세요.</p>
                            </div>
                          ) : (
                            '검색 조건에 맞는 거래가 없습니다.'
                          )}
                        </td>
                      </tr>
                    ) : (
                      sortedTransactions.map((transaction: TransactionWithItems, index: number) => (
                        <TransactionExpandableRow
                          key={transaction.id}
                          transaction={transaction}
                          displayNumber={index + 1}  // 🎯 필터링된 순번 표시
                          isExpanded={isExpanded(transaction.id!)}
                          onToggle={() => toggleRow(transaction.id!)}
                          onEdit={() => handleEditTransaction(transaction)}
                          onDelete={() => handleDeleteTransaction(transaction.id!, transaction.customer_name)}
                          onPrint={() => handlePrintInvoice(transaction)}  // 🆕 거래증 출력
                        />
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* 거래 추가/수정 모달 */}
        <TransactionModal 
          isOpen={isModalOpen}
          onClose={() => {
            console.log('🚪 모달 닫기')
            setIsModalOpen(false)
            setPreSelectedCustomerId(0)
          }}
          transaction={editingTransaction}
          preSelectedCustomerId={preSelectedCustomerId}
        />

        {/* 🆕 거래증 미리보기 모달 */}
        {selectedTransaction && (
          <InvoicePreviewModal
            isOpen={isInvoiceModalOpen}
            onClose={() => {
              setIsInvoiceModalOpen(false)
              setSelectedTransaction(undefined)
            }}
            transaction={selectedTransaction}
          />
        )}
      </div>

      {/* 사이드바 */}
      <PageSidebar>
        <TransactionsSidebarContent 
          customers={customers}
          searchTerm={sidebarSearchTerm}
          onSearchChange={(term) => {
            console.log('🔍 사이드바 검색어 변경:', term)
            setSidebarSearchTerm(term)
            // 메인 검색어도 업데이트
            setAdvancedFilters(prev => ({ ...prev, searchQuery: term }))
          }}
          onCustomerClick={(customerId) => {
            console.log('🎯 거래처 클릭:', customerId)
            const customer = customers?.find(c => c.id === customerId)
            if (customer) {
              // 메인 페이지 검색어만 업데이트 (사이드바는 그대로)
              setAdvancedFilters(prev => ({ ...prev, searchQuery: customer.name, customerId: 0 }))
            }
          }}
          onAddTransactionWithCustomer={handleAddTransactionWithCustomer}
          onFilterChange={handleSidebarFilterChange}
        />
      </PageSidebar>
    </div>
  )
}
