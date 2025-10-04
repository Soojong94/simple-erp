import { useState, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { customerAPI, transactionAPI } from '../lib/tauri'
import { getCurrentSession } from '../lib/auth/index'
import { useExpandableTable } from '../hooks/useExpandableTable'
import { usePagination } from '../hooks/usePagination'
import CustomerModal from '../components/modals/CustomerModal'
import CustomerExpandableRow from '../components/expandable/CustomerExpandableRow'
import SortDropdown from '../components/SortDropdown'
import Pagination from '../components/Pagination'
import { deleteAllCustomers } from '../lib/data-management'
import type { Customer } from '../types'

export default function Customers() {
  const queryClient = useQueryClient()
  const session = getCurrentSession()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | undefined>(undefined)
  const [filterType, setFilterType] = useState<'all' | 'customer' | 'supplier'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // 정렬 상태
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'type'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // 확장 테이블 관리
  const { toggleRow, isExpanded } = useExpandableTable()

  const { data: customers, isLoading, error } = useQuery({
    queryKey: ['customers', session?.company_id],
    queryFn: () => customerAPI.getAll()
  })

  // 🆕 거래 내역 조회 (미지급금 계산용)
  const { data: transactions } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => transactionAPI.getAll()
  })

  const deleteMutation = useMutation({
    mutationFn: customerAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      alert('거래처가 삭제되었습니다.')
    },
    onError: (error) => {
      console.error('Customer delete error:', error)
      alert('거래처 삭제 중 오류가 발생했습니다.')
    }
  })

  const handleAddCustomer = () => {
    setEditingCustomer(undefined)
    setIsModalOpen(true)
  }

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer)
    setIsModalOpen(true)
  }

  const handleDeleteCustomer = (id: number, name: string) => {
    if (confirm(`'${name}' 거래처를 정말 삭제하시겠습니까?`)) {
      deleteMutation.mutate(id)
    }
  }

  // 필터링된 거래처만 삭제
  const handleDeleteFilteredCustomers = async () => {
    if (!filteredCustomers || filteredCustomers.length === 0) {
      alert('삭제할 거래처가 없습니다.')
      return
    }

    const confirmation = window.confirm(
      `현재 필터링된 ${filteredCustomers.length}개의 거래처를 삭제하시겠습니까?\n\n` +
      '이 작업은 되돌릴 수 없습니다.'
    )

    if (!confirmation) return

    let deletedCount = 0
    let failedCount = 0

    for (const customer of filteredCustomers) {
      if (customer.id) {
        try {
          await customerAPI.delete(customer.id)
          deletedCount++
        } catch (error) {
          console.error(`거래처 ${customer.name} 삭제 실패:`, error)
          failedCount++
        }
      }
    }

    if (failedCount > 0) {
      alert(
        `⚠️ 일부 거래처 삭제 실패\n\n` +
        `성공: ${deletedCount}개\n` +
        `실패: ${failedCount}개`
      )
    } else {
      alert(`✅ ${deletedCount}개의 거래처가 삭제되었습니다.`)
    }

    queryClient.invalidateQueries({ queryKey: ['customers'] })
  }

  // 필터링된 고객 목록
  const filteredCustomers = useMemo(() => {
    if (!customers) return []
    
    return customers.filter(customer => {
      const matchesType = filterType === 'all' || customer.type === filterType
      const matchesSearch = !searchQuery || 
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (customer.business_number && customer.business_number.includes(searchQuery)) ||
        (customer.contact_person && customer.contact_person.toLowerCase().includes(searchQuery.toLowerCase()))
      return matchesType && matchesSearch
    })
  }, [customers, filterType, searchQuery])

  // 정렬된 거래처 목록
  const sortedCustomers = useMemo(() => {
    if (!filteredCustomers) return []
    
    return [...filteredCustomers].sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'date':
          comparison = new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
          break
        case 'type':
          comparison = a.type.localeCompare(b.type)
          break
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })
  }, [filteredCustomers, sortBy, sortOrder])

  // 페이지네이션 적용
  const pagination = usePagination(sortedCustomers, 50)
  const { paginatedItems: paginatedCustomers } = pagination

  // 필터 변경 시 페이지 초기화
  useEffect(() => {
    pagination.resetPage()
  }, [filterType, searchQuery, sortBy, sortOrder])

  // 🆕 미수금/미지급금 통계 계산
  const financialStats = useMemo(() => {
    if (!customers || !transactions) return { totalReceivable: 0, totalPayable: 0 }

    let totalReceivable = 0  // 총 미수금 (고객으로부터 받아야 할 돈)
    let totalPayable = 0     // 총 미지급금 (공급업체에 지급해야 할 돈)

    customers.forEach(customer => {
      const customerTransactions = transactions.filter(t => t.customer_id === customer.id)

      if (customer.type === 'customer') {
        // 고객: 미수금 계산
        let 미수금 = 0
        customerTransactions.forEach(t => {
          if (t.transaction_type === 'sales') {
            미수금 += t.total_amount
          } else if (t.transaction_type === 'payment_in') {
            미수금 -= t.total_amount
          }
        })
        totalReceivable += Math.max(0, 미수금)
      } else if (customer.type === 'supplier') {
        // 공급업체: 미지급금 계산
        let 미지급금 = 0
        customerTransactions.forEach(t => {
          if (t.transaction_type === 'purchase') {
            미지급금 += t.total_amount
          } else if (t.transaction_type === 'payment_out') {
            미지급금 -= t.total_amount
          }
        })
        totalPayable += Math.max(0, 미지급금)
      }
    })

    return { totalReceivable, totalPayable }
  }, [customers, transactions])

  if (error) {
    console.error('Customer API error:', error)
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">오류가 발생했습니다</div>
        <p className="text-gray-500">거래처 목록을 불러올 수 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="flex">
      {/* 메인 컨텐츠 영역 */}
      <div className="flex-1 pr-4">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900">거래처 관리</h1>
            <p className="mt-2 text-sm text-gray-700">
              고객 및 공급업체 정보를 관리합니다. 행을 클릭하면 상세 정보를 볼 수 있습니다.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <button
              type="button"
              onClick={handleAddCustomer}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              거래처 추가
            </button>
          </div>
        </div>

        {/* 필터 및 검색 */}
        <div className="mt-6 bg-gray-50 px-6 py-4 rounded-lg">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="거래처명, 사업자번호, 담당자로 검색..."
                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex-shrink-0">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as 'all' | 'customer' | 'supplier')}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">전체</option>
                <option value="customer">고객</option>
                <option value="supplier">공급업체</option>
              </select>
            </div>
            <SortDropdown
              options={[
                { value: 'name', label: '이름순', icon: '📝' },
                { value: 'date', label: '등록일순', icon: '📅' },
                { value: 'type', label: '유형별', icon: '🏷️' }
              ]}
              value={sortBy}
              onChange={(value) => setSortBy(value as 'name' | 'date' | 'type')}
              order={sortOrder}
              onOrderChange={setSortOrder}
            />
          </div>
        </div>

        {/* 필터링된 항목 삭제 버튼 */}
        {filteredCustomers.length > 0 && (
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={handleDeleteFilteredCustomers}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              🗑️ 필터링된 항목 삭제 ({filteredCustomers.length})
            </button>
          </div>
        )}

        {/* 통계 카드 */}
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-5">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                    <span className="text-blue-600 text-sm font-medium">👥</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      총 거래처
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {customers?.length || 0}개
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
                    <span className="text-green-600 text-sm font-medium">🛒</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      고객
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {customers?.filter(c => c.type === 'customer').length || 0}개
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
                    <span className="text-yellow-600 text-sm font-medium">🏭</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      공급업체
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {customers?.filter(c => c.type === 'supplier').length || 0}개
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
                  <div className="w-8 h-8 bg-amber-100 rounded-md flex items-center justify-center">
                    <span className="text-amber-600 text-sm font-medium">💰</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      총 미수금
                    </dt>
                    <dd className="text-lg font-medium text-amber-600">
                      {financialStats.totalReceivable.toLocaleString()}원
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
                    <span className="text-purple-600 text-sm font-medium">💸</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      총 미지급금
                    </dt>
                    <dd className="text-lg font-medium text-purple-600">
                      {financialStats.totalPayable.toLocaleString()}원
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
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
                        거래처명
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        사업자번호
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        담당자
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        전화번호
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        구분
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
                        <td colSpan={7} className="px-6 py-4 text-sm text-gray-500 text-center">
                          <div className="flex justify-center items-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                            <span className="ml-2">로딩 중...</span>
                          </div>
                        </td>
                      </tr>
                    ) : !paginatedCustomers || paginatedCustomers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 text-sm text-gray-500 text-center">
                          {customers?.length === 0 ? (
                            <div>
                              <p className="text-gray-900 font-medium">등록된 거래처가 없습니다.</p>
                              <p className="text-gray-500 text-xs mt-1">거래처 추가 버튼을 클릭하여 첫 거래처를 등록해보세요.</p>
                            </div>
                          ) : (
                            '검색 조건에 맞는 거래처가 없습니다.'
                          )}
                        </td>
                      </tr>
                    ) : (
                      paginatedCustomers.map((customer: Customer) => (
                        <CustomerExpandableRow
                          key={customer.id}
                          customer={customer}
                          isExpanded={isExpanded(customer.id!)}
                          onToggle={() => toggleRow(customer.id!)}
                          onEdit={() => handleEditCustomer(customer)}
                          onDelete={() => handleDeleteCustomer(customer.id!, customer.name)}
                        />
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              </div>
              </div>

        {/* 페이지네이션 */}
              <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          itemsPerPage={pagination.itemsPerPage}
          onPageChange={pagination.goToPage}
          onFirstPage={pagination.goToFirstPage}
          onLastPage={pagination.goToLastPage}
          onNextPage={pagination.goToNextPage}
          onPrevPage={pagination.goToPrevPage}
          hasNextPage={pagination.hasNextPage}
          hasPrevPage={pagination.hasPrevPage}
        />
      </div>

        {/* 거래처 추가/수정 모달 */}
        <CustomerModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          customer={editingCustomer}
        />
      </div>

      {/* 사이드바 - 빠른 거래처 목록 */}
      <div className="w-64 bg-gray-50 border-l border-gray-200 p-3">
        <div className="sticky top-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">📋 빠른 거래처 목록</h3>
          
          {customers && customers.length > 0 ? (
            <div className="space-y-2">
              {/* 가나다순 정렬된 거래처 목록 */}
              {[...customers]
                .sort((a, b) => a.name.localeCompare(b.name))
                .slice(0, 15) // 최대 15개만 표시
                .map(customer => (
                  <div 
                    key={customer.id}
                    className="bg-white rounded-lg p-2 shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => {
                      // 해당 거래처로 필터링
                      setFilterType(customer.type)
                      setSearchQuery(customer.name)
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1.5 flex-1 min-w-0">
                            <span className="text-base">
                              {customer.type === 'customer' ? '🛒' : '🏭'}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-1.5">
                                <p className="text-xs font-medium text-gray-900 truncate">
                                  {customer.name}
                                </p>
                                <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                  customer.type === 'customer' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {customer.type === 'customer' ? '고객' : '공급'}
                                </span>
                              </div>
                              {customer.phone && (
                                <p className="text-[10px] text-gray-500 truncate mt-0.5">
                                  {customer.phone}
                                </p>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditCustomer(customer)
                            }}
                            className="ml-1 p-1 text-blue-600 hover:bg-blue-50 rounded flex-shrink-0"
                            title="수정"
                          >
                            ✏️
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              }
              
              {customers.length > 15 && (
                <div className="text-center py-2">
                  <span className="text-xs text-gray-500">
                    +{customers.length - 15}개 더 있음
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📝</div>
              <p className="text-sm">등록된 거래처가 없습니다</p>
              <button
                onClick={handleAddCustomer}
                className="mt-2 text-xs text-blue-600 hover:text-blue-800"
              >
                첫 거래처 추가하기
              </button>
            </div>
          )}
          
          {/* 빠른 액션 버튼들 */}
          <div className="mt-4 pt-3 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setFilterType('customer')
                  setSearchQuery('')
                }}
                className="px-3 py-2 text-xs bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
              >
                🛒 고객만 보기
              </button>
              <button
                onClick={() => {
                  setFilterType('supplier')
                  setSearchQuery('')
                }}
                className="px-3 py-2 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
              >
                🏭 공급업체만
              </button>
            </div>
            
            <button
              onClick={() => {
                setFilterType('all')
                setSearchQuery('')
              }}
              className="mt-2 w-full px-3 py-2 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              🔄 전체 보기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
