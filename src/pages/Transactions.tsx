import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { transactionAPI, customerAPI, productAPI } from '../lib/tauri'
import { formatCurrency } from '../lib/utils'
import TransactionModal from '../components/modals/TransactionModal'
import PageSidebar from '../components/sidebar/PageSidebar'
import TransactionsSidebarContent from '../components/sidebar/TransactionsSidebarContent'
import type { TransactionWithItems } from '../types'

export default function Transactions() {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<TransactionWithItems | undefined>(undefined)
  
  // 기본 필터
  const [filterType, setFilterType] = useState<'all' | 'sales' | 'purchase'>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'confirmed' | 'cancelled'>('all')
  
  // 고급 검색 필터
  const [advancedFilters, setAdvancedFilters] = useState({
    dateFrom: '',
    dateTo: '',
    customerId: 0,
    searchQuery: '',
    minAmount: '',
    maxAmount: ''
  })
  
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
  const confirmMutation = useMutation({
    mutationFn: transactionAPI.confirm,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      alert('거래가 확정되었습니다.')
    }
  })

  const cancelMutation = useMutation({
    mutationFn: transactionAPI.cancel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      alert('거래가 취소되었습니다.')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: transactionAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      alert('거래가 삭제되었습니다.')
    }
  })

  // Event handlers
  const handleAddTransaction = () => {
    setEditingTransaction(undefined)
    setIsModalOpen(true)
  }

  const handleEditTransaction = (transaction: TransactionWithItems) => {
    setEditingTransaction(transaction)
    setIsModalOpen(true)
  }

  const handleConfirmTransaction = (id: number, customerName: string) => {
    if (confirm(`${customerName}과의 거래를 확정하시겠습니까?`)) {
      confirmMutation.mutate(id)
    }
  }

  const handleCancelTransaction = (id: number, customerName: string) => {
    if (confirm(`${customerName}과의 거래를 취소하시겠습니까?`)) {
      cancelMutation.mutate(id)
    }
  }

  const handleDeleteTransaction = (id: number, customerName: string) => {
    if (confirm(`${customerName}과의 거래를 삭제하시겠습니까?`)) {
      deleteMutation.mutate(id)
    }
  }

  // 사이드바 이벤트 핸들러들
  const handleCustomerClick = (customerId: number) => {
    setAdvancedFilters(prev => ({ ...prev, customerId }))
  }

  const handleProductClick = (productName: string) => {
    setAdvancedFilters(prev => ({ ...prev, searchQuery: productName }))
  }

  const handleQuickFilter = (filterType: 'today' | 'confirmed-sales' | 'confirmed-purchase' | 'draft') => {
    const today = new Date().toISOString().split('T')[0]
    
    switch (filterType) {
      case 'today':
        setAdvancedFilters(prev => ({
          ...prev,
          dateFrom: today,
          dateTo: today,
          customerId: 0,
          searchQuery: '',
          minAmount: '',
          maxAmount: ''
        }))
        setFilterType('all')
        setFilterStatus('all')
        break
      case 'confirmed-sales':
        setFilterType('sales')
        setFilterStatus('confirmed')
        setAdvancedFilters(prev => ({
          ...prev,
          dateFrom: '',
          dateTo: '',
          customerId: 0,
          searchQuery: '',
          minAmount: '',
          maxAmount: ''
        }))
        break
      case 'confirmed-purchase':
        setFilterType('purchase')
        setFilterStatus('confirmed')
        setAdvancedFilters(prev => ({
          ...prev,
          dateFrom: '',
          dateTo: '',
          customerId: 0,
          searchQuery: '',
          minAmount: '',
          maxAmount: ''
        }))
        break
      case 'draft':
        setFilterType('all')
        setFilterStatus('draft')
        setAdvancedFilters(prev => ({
          ...prev,
          dateFrom: '',
          dateTo: '',
          customerId: 0,
          searchQuery: '',
          minAmount: '',
          maxAmount: ''
        }))
        break
    }
  }

  const handleResetFilters = () => {
    setFilterType('all')
    setFilterStatus('all')
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
    const matchesStatus = filterStatus === 'all' || transaction.status === filterStatus
    const matchesDateFrom = !advancedFilters.dateFrom || transaction.transaction_date >= advancedFilters.dateFrom
    const matchesDateTo = !advancedFilters.dateTo || transaction.transaction_date <= advancedFilters.dateTo
    const matchesCustomer = advancedFilters.customerId === 0 || transaction.customer_id === advancedFilters.customerId
    const matchesSearch = !advancedFilters.searchQuery || 
      transaction.customer_name?.toLowerCase().includes(advancedFilters.searchQuery.toLowerCase()) ||
      transaction.notes?.toLowerCase().includes(advancedFilters.searchQuery.toLowerCase())
    const matchesMinAmount = !advancedFilters.minAmount || transaction.total_amount >= Number(advancedFilters.minAmount)
    const matchesMaxAmount = !advancedFilters.maxAmount || transaction.total_amount <= Number(advancedFilters.maxAmount)
    
    return matchesType && matchesStatus && matchesDateFrom && matchesDateTo && 
           matchesCustomer && matchesSearch && matchesMinAmount && matchesMaxAmount
  })

  // 통계 계산
  const stats = {
    total: transactions?.length || 0,
    sales: transactions?.filter(t => t.transaction_type === 'sales').length || 0,
    purchase: transactions?.filter(t => t.transaction_type === 'purchase').length || 0,
    confirmed: transactions?.filter(t => t.status === 'confirmed').length || 0,
    totalSalesAmount: transactions?.filter(t => t.transaction_type === 'sales' && t.status === 'confirmed')
      .reduce((sum, t) => sum + t.total_amount, 0) || 0,
    totalPurchaseAmount: transactions?.filter(t => t.transaction_type === 'purchase' && t.status === 'confirmed')
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
              매출 및 매입 거래 내역을 관리합니다.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <button
              type="button"
              onClick={handleAddTransaction}
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

        {/* 검색 및 필터 영역 */}
        <div className="mt-6 bg-gray-50 px-6 py-4 rounded-lg">
          {/* 기본 필터 행 */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={advancedFilters.searchQuery}
                onChange={(e) => setAdvancedFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                placeholder="거래처명, 메모로 검색..."
                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex-shrink-0">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as 'all' | 'sales' | 'purchase')}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">전체 거래</option>
                <option value="sales">매출</option>
                <option value="purchase">매입</option>
              </select>
            </div>
            <div className="flex-shrink-0">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as 'all' | 'draft' | 'confirmed' | 'cancelled')}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">전체 상태</option>
                <option value="draft">임시저장</option>
                <option value="confirmed">확정</option>
                <option value="cancelled">취소</option>
              </select>
            </div>
          </div>
        </div>

        {/* 거래 테이블 */}
        <div className="mt-8 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        거래일
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        거래처
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        구분
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        상품수
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        총액
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        세액
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        상태
                      </th>
                      <th className="relative px-6 py-3">
                        <span className="sr-only">액션</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {isLoading ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-4 text-sm text-gray-500 text-center">
                          <div className="flex justify-center items-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                            <span className="ml-2">로딩 중...</span>
                          </div>
                        </td>
                      </tr>
                    ) : !filteredTransactions || filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-4 text-sm text-gray-500 text-center">
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
                      filteredTransactions.map((transaction: TransactionWithItems) => (
                        <tr key={transaction.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(transaction.transaction_date).toLocaleDateString('ko-KR')}
                            {transaction.due_date && (
                              <div className="text-xs text-gray-500">
                                만료: {new Date(transaction.due_date).toLocaleDateString('ko-KR')}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {transaction.customer_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {transaction.customer_id}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              transaction.transaction_type === 'sales' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {transaction.transaction_type === 'sales' ? '매출' : '매입'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {transaction.items?.length || 0}개
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatCurrency(transaction.total_amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatCurrency(transaction.tax_amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              transaction.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                              transaction.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {transaction.status === 'confirmed' ? '확정' :
                               transaction.status === 'draft' ? '임시저장' : '취소'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex space-x-2">
                              <button 
                                onClick={() => handleEditTransaction(transaction)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                수정
                              </button>
                              {transaction.status === 'draft' && (
                                <button 
                                  onClick={() => handleConfirmTransaction(transaction.id!, transaction.customer_name)}
                                  disabled={confirmMutation.isPending}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  확정
                                </button>
                              )}
                              {transaction.status === 'confirmed' && (
                                <button 
                                  onClick={() => handleCancelTransaction(transaction.id!, transaction.customer_name)}
                                  disabled={cancelMutation.isPending}
                                  className="text-yellow-600 hover:text-yellow-900"
                                >
                                  취소
                                </button>
                              )}
                              <button 
                                onClick={() => handleDeleteTransaction(transaction.id!, transaction.customer_name)}
                                disabled={deleteMutation.isPending}
                                className="text-red-600 hover:text-red-900"
                              >
                                삭제
                              </button>
                            </div>
                          </td>
                        </tr>
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
          onClose={() => setIsModalOpen(false)}
          transaction={editingTransaction}
        />
      </div>

      {/* 사이드바 */}
      <PageSidebar>
        <TransactionsSidebarContent
          customers={customers}
          products={products}
          onCustomerClick={handleCustomerClick}
          onProductClick={handleProductClick}
          onQuickFilter={handleQuickFilter}
          onResetFilters={handleResetFilters}
        />
      </PageSidebar>
    </div>
  )
}
