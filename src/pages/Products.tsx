import { useState, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productAPI, transactionAPI } from '../lib/tauri'
import { formatCurrency } from '../lib/utils'
import { useExpandableTable } from '../hooks/useExpandableTable'
import { usePagination } from '../hooks/usePagination'
import ProductModal from '../components/modals/ProductModal'
import ProductExpandableRow from '../components/expandable/ProductExpandableRow'
import SortDropdown from '../components/SortDropdown'
import Pagination from '../components/Pagination'
import type { Product } from '../types'

export default function Products() {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined)
  
  // 기본 필터
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeOnly, setActiveOnly] = useState(true)
  
  // 정렬 상태
  const [sortBy, setSortBy] = useState<'name' | 'category' | 'price' | 'date'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // 확장 테이블 관리
  const { toggleRow, isExpanded } = useExpandableTable()

  const { data: products, isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: () => productAPI.getAll(false) // 모든 상품 (비활성 포함)
  })
  
  // 거래 내역 조회 (사용 빈도 계산용)
  const { data: transactions } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => transactionAPI.getAll()
  })

  const deleteMutation = useMutation({
    mutationFn: productAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      alert('상품이 삭제되었습니다.')
    },
    onError: (error) => {
      console.error('Product delete error:', error)
      alert('상품 삭제 중 오류가 발생했습니다.')
    }
  })

  const handleAddProduct = () => {
    setEditingProduct(undefined)
    setIsModalOpen(true)
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    setIsModalOpen(true)
  }

  const handleDeleteProduct = (id: number, name: string) => {
    if (confirm(`'${name}' 상품을 정말 삭제하시겠습니까?`)) {
      deleteMutation.mutate(id)
    }
  }

  // 카테고리 목록 추출
  const categories = Array.from(new Set(products?.map(p => p.category).filter(Boolean))) || []
  
  // 상품별 사용 빈도 계산
  const productUsageStats = useMemo(() => {
    if (!transactions || !products) return new Map()
    
    const usageMap = new Map<number, { count: number, lastUsed: string | null }>()
    
    // 모든 상품 초기화
    products.forEach(product => {
      if (product.id) {
        usageMap.set(product.id, { count: 0, lastUsed: null })
      }
    })
    
    // 거래 내역에서 사용 빈도 계산
    transactions.forEach(transaction => {
      transaction.items?.forEach(item => {
        if (item.product_id) {
          const current = usageMap.get(item.product_id) || { count: 0, lastUsed: null }
          usageMap.set(item.product_id, {
            count: current.count + 1,
            lastUsed: transaction.transaction_date > (current.lastUsed || '') 
              ? transaction.transaction_date 
              : current.lastUsed
          })
        }
      })
    })
    
    return usageMap
  }, [products, transactions])

  // 필터링된 상품 목록
  const filteredProducts = useMemo(() => {
    if (!products) return []
    
    return products?.filter(product => {
      const matchesCategory = filterCategory === 'all' || product.category === filterCategory
      const matchesSearch = !searchQuery || 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.code && product.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (product.category && product.category.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchesActive = !activeOnly || product.is_active
      
      return matchesCategory && matchesSearch && matchesActive
    }) || []
  }, [products, filterCategory, searchQuery, activeOnly])

  // 정렬된 상품 목록
  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'category':
          comparison = (a.category || '').localeCompare(b.category || '')
          break
        case 'price':
          comparison = (a.unit_price || 0) - (b.unit_price || 0)
          break
        case 'date':
          comparison = new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
          break
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })
  }, [filteredProducts, sortBy, sortOrder])

  // 페이지네이션 적용
  const pagination = usePagination(sortedProducts, 50)
  const { paginatedItems: paginatedProducts } = pagination

  // 필터 변경 시 페이지 초기화
  useEffect(() => {
    pagination.resetPage()
  }, [filterCategory, searchQuery, activeOnly, sortBy, sortOrder])

  if (error) {
    console.error('Products API error:', error)
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">오류가 발생했습니다</div>
        <p className="text-gray-500">상품 목록을 불러올 수 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="flex">
      {/* 메인 컨텐츠 영역 */}
      <div className="flex-1 pr-6">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900">상품 관리</h1>
            <p className="mt-2 text-sm text-gray-700">
              판매 및 구매하는 상품 정보를 관리합니다. 행을 클릭하면 상세 정보를 볼 수 있습니다.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <button
              type="button"
              onClick={handleAddProduct}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              상품 추가
            </button>
          </div>
        </div>

      {/* 검색 및 필터 영역 */}
      <div className="mt-6 bg-gray-50 px-6 py-4 rounded-lg">
        {/* 기본 검색 행 */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="상품명, 상품코드, 카테고리로 검색..."
              className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex-shrink-0">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">전체 카테고리</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          <div className="flex-shrink-0">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={activeOnly}
                onChange={(e) => setActiveOnly(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm">활성 상품만</span>
            </label>
          </div>
          <SortDropdown
            options={[
              { value: 'name', label: '이름순', icon: '📝' },
              { value: 'category', label: '카테고리별', icon: '🏷️' },
              { value: 'price', label: '가격순', icon: '💰' },
              { value: 'date', label: '등록일순', icon: '📅' }
            ]}
            value={sortBy}
            onChange={(value) => setSortBy(value as 'name' | 'category' | 'price' | 'date')}
            order={sortOrder}
            onOrderChange={setSortOrder}
          />
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                  <span className="text-blue-600 text-sm font-medium">📦</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    총 상품
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {products?.length || 0}개
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
                  <span className="text-green-600 text-sm font-medium">✅</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    활성 상품
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {products?.filter(p => p.is_active).length || 0}개
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
                  <span className="text-yellow-600 text-sm font-medium">🏷️</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    카테고리
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {categories.length}개
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
                  <span className="text-purple-600 text-sm font-medium">💰</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    평균 단가
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {products && products.length > 0 ? formatCurrency(
                      products.filter(p => p.unit_price).reduce((sum, p) => sum + (p.unit_price || 0), 0) / 
                      products.filter(p => p.unit_price).length
                    ) : '₩0'}
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
                      상품명
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      상품코드
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      카테고리
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      단위
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      참고단가
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      설명
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
                  ) : !paginatedProducts || paginatedProducts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-4 text-sm text-gray-500 text-center">
                        {products?.length === 0 ? (
                          <div>
                            <p className="text-gray-900 font-medium">등록된 상품이 없습니다.</p>
                            <p className="text-gray-500 text-xs mt-1">상품 추가 버튼을 클릭하여 첫 상품을 등록해보세요.</p>
                          </div>
                        ) : (
                          '검색 조건에 맞는 상품이 없습니다.'
                        )}
                      </td>
                    </tr>
                  ) : (
                    paginatedProducts.map((product: Product) => (
                      <ProductExpandableRow
                        key={product.id}
                        product={product}
                        isExpanded={isExpanded(product.id!)}
                        onToggle={() => toggleRow(product.id!)}
                        onEdit={() => handleEditProduct(product)}
                        onDelete={() => handleDeleteProduct(product.id!, product.name)}
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

        {/* 상품 추가/수정 모달 */}
        <ProductModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          product={editingProduct}
        />
      </div>

      {/* 사이드바 - 빠른 상품 목록 */}
      <div className="w-80 bg-gray-50 border-l border-gray-200 p-4">
        <div className="sticky top-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">📦 빠른 상품 목록</h3>
          
          {products && products.length > 0 ? (
            <div className="space-y-2">
              {/* 가나다순 정렬된 상품 목록 */}
              {[...products]
                .filter(p => p.is_active) // 활성 상품만
                .sort((a, b) => a.name.localeCompare(b.name))
                .slice(0, 12) // 최대 12개만 표시
                .map(product => {
                  const usage = productUsageStats.get(product.id || 0)
                  return (
                    <div 
                      key={product.id}
                      className="bg-white rounded-lg p-3 shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => {
                        // 해당 상품으로 필터링
                        setSearchQuery(product.name)
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">
                              {product.category === '돼지고기' ? '🐷' :
                               product.category === '소고기' ? '🐄' :
                               product.category === '닭고기' ? '🐔' :
                               product.category === '오리고기' ? '🦆' : '🍖'}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {product.name}
                              </p>
                              {product.code && (
                                <p className="text-xs text-gray-500 font-mono truncate">
                                  {product.code}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="mt-1 flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {product.category && (
                                <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  {product.category}
                                </span>
                              )}
                              {product.unit_price && (
                                <span className="text-xs font-medium text-green-600">
                                  {formatCurrency(product.unit_price)}/{product.unit}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {usage && usage.count > 0 && (
                            <div className="mt-1 flex items-center text-xs text-blue-600">
                              <span className="mr-1">📈</span>
                              <span>{usage.count}회 사용</span>
                              {usage.lastUsed && (
                                <span className="ml-1 text-gray-400">
                                  (최근: {new Date(usage.lastUsed).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })})
                                </span>
                              )}
                            </div>
                          )}
                          
                          <div className="mt-1 flex justify-end">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEditProduct(product)
                              }}
                              className="text-xs text-blue-600 hover:text-blue-800"
                            >
                              수정
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              }
              
              {products.filter(p => p.is_active).length > 12 && (
                <div className="text-center py-2">
                  <span className="text-xs text-gray-500">
                    +{products.filter(p => p.is_active).length - 12}개 더 있음
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📝</div>
              <p className="text-sm">등록된 상품이 없습니다</p>
              <button
                onClick={handleAddProduct}
                className="mt-2 text-xs text-blue-600 hover:text-blue-800"
              >
                첫 상품 추가하기
              </button>
            </div>
          )}
          
          {/* 빠른 액션 버튼들 */}
          <div className="mt-4 pt-3 border-t border-gray-200">
            <div className="grid grid-cols-1 gap-2">
              {categories.slice(0, 4).map(category => (
                <button
                  key={category}
                  onClick={() => {
                    setFilterCategory(category)
                    setSearchQuery('')
                  }}
                  className="px-3 py-2 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-left"
                >
                  {category === '돼지고기' ? '🐷' :
                   category === '소고기' ? '🐄' :
                   category === '닭고기' ? '🐔' :
                   category === '오리고기' ? '🦆' : '🍖'} {category}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => {
                setFilterCategory('all')
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
