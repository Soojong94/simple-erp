import { useState, useMemo, Fragment, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { inventoryAPI, productAPI } from '../../lib/tauri'
import { formatNumber, cn } from '../../lib/utils'
import { useExpandableTable } from '../../hooks/useExpandableTable'
import { usePagination } from '../../hooks/usePagination'
import Pagination from '../Pagination'
import type { ProductInventory, Product } from '../../types'

interface InventoryTableProps {
  onStockMovement: (product: Product & ProductInventory) => void
}

export default function InventoryTable({ onStockMovement }: InventoryTableProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'low' | 'normal'>('all')
  const { toggleRow, isExpanded } = useExpandableTable()

  // 재고 데이터 조회
  const { data: inventory = [], isLoading: isLoadingInventory } = useQuery<ProductInventory[]>({
    queryKey: ['inventory'],
    queryFn: () => inventoryAPI.getInventory()
  })

  // 상품 데이터 조회
  const { data: products = [], isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => productAPI.getAll(false)
  })

  // 재고 이동 이력 조회
  const { data: movements = [] } = useQuery({
    queryKey: ['stock-movements'],
    queryFn: () => inventoryAPI.getMovementHistory()
  })

  // 상품과 재고 데이터 병합
  const combinedData = useMemo(() => {
    return products.map(product => {
      const inv = inventory.find(i => i.product_id === product.id) || {
        product_id: product.id,
        current_stock: 0,
        safety_stock: 30,
        location: 'cold' as const,
        last_updated: new Date().toISOString()
      }
      return { ...product, ...inv }
    })
  }, [products, inventory])

  // 필터링
  const filteredData = useMemo(() => {
    let filtered = combinedData

    // 검색어 필터
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(query) ||
        item.code?.toLowerCase().includes(query) ||
        item.category?.toLowerCase().includes(query)
      )
    }

    // 재고 상태 필터
    if (filterType === 'low') {
      filtered = filtered.filter(item => item.current_stock < item.safety_stock)
    } else if (filterType === 'normal') {
      filtered = filtered.filter(item => item.current_stock >= item.safety_stock)
    }

      return filtered
  }, [combinedData, searchQuery, filterType])

  // 페이지네이션 적용
  const pagination = usePagination(filteredData, 50)
  const { paginatedItems: paginatedData } = pagination

  // 필터 변경 시 페이지 초기화
  useEffect(() => {
    pagination.resetPage()
  }, [searchQuery, filterType])

  const isLoading = isLoadingInventory || isLoadingProducts

  // 재고 상태 판단
  const getStockStatus = (current: number, safety: number) => {
    const ratio = current / safety
    if (ratio === 0) return { color: 'text-red-600', bg: 'bg-red-50', text: '품절', icon: '❌' }
    if (ratio < 0.5) return { color: 'text-red-600', bg: 'bg-red-50', text: '위험', icon: '⚠️' }
    if (ratio < 1) return { color: 'text-yellow-600', bg: 'bg-yellow-50', text: '부족', icon: '⚡' }
    return { color: 'text-green-600', bg: 'bg-green-50', text: '정상', icon: '✅' }
  }

  // 보관 위치 한글 변환
  const getLocationLabel = (location?: string) => {
    switch (location) {
      case 'frozen': return '❄️ 냉동'
      case 'cold': return '🧊 냉장'
      case 'room': return '🌡️ 상온'
      default: return '🧊 냉장'
    }
  }

  return (
    <div>
      {/* 필터 영역 */}
      <div className="mb-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="🔍 상품명, 코드, 카테고리 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          
          <div className="flex gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={cn(
                "px-4 py-2 rounded-lg transition-colors",
                filterType === 'all' 
                  ? "bg-blue-500 text-white" 
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
            >
              전체
            </button>
            <button
              onClick={() => setFilterType('low')}
              className={cn(
                "px-4 py-2 rounded-lg transition-colors",
                filterType === 'low' 
                  ? "bg-red-500 text-white" 
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
            >
              재고 부족
            </button>
            <button
              onClick={() => setFilterType('normal')}
              className={cn(
                "px-4 py-2 rounded-lg transition-colors",
                filterType === 'normal' 
                  ? "bg-green-500 text-white" 
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
            >
              정상 재고
            </button>
          </div>
        </div>
      </div>

      {/* 테이블 */}
      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                상품 정보
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                현재 재고
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                안전 재고
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                보관 위치
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                상태
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                작업
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                  </div>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  재고 데이터가 없습니다.
                </td>
              </tr>
            ) : (
              paginatedData.map((item) => {
                const status = getStockStatus(item.current_stock, item.safety_stock)
                const expanded = isExpanded(item.id!)
                const productMovements = movements.filter(m => m.product_id === item.id)

                return (
                  <Fragment key={item.id}>
                    <tr
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => toggleRow(item.id!)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="mr-2">{expanded ? '▼' : '▶'}</span>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {item.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {item.category} | 코드: {item.code || '-'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={cn("font-medium", status.color)}>
                          {formatNumber(item.current_stock)} {item.unit}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {formatNumber(item.safety_stock)} {item.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-sm">
                          {getLocationLabel(item.location)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={cn("px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full", status.bg, status.color)}>
                          {status.icon} {status.text}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onStockMovement(item)
                          }}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          📥📤 입출고
                        </button>
                      </td>
                    </tr>

                    {/* 확장 행 - 재고 이동 이력 */}
                    {expanded && (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 bg-gray-50">
                          <div className="space-y-4">
                            <h4 className="text-sm font-medium text-gray-900">최근 재고 이동 이력</h4>
                            {productMovements.length === 0 ? (
                              <p className="text-sm text-gray-500">이동 이력이 없습니다.</p>
                            ) : (
                              <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                  <thead className="bg-white">
                                    <tr>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">일시</th>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">구분</th>
                                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">수량</th>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">로트</th>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">이력번호</th>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">비고</th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white divide-y divide-gray-200">
                                    {productMovements.slice(0, 5).map((movement) => (
                                      <tr key={movement.id}>
                                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600">
                                          {new Date(movement.created_at).toLocaleDateString('ko-KR')}
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap text-xs">
                                          <span className={cn(
                                            "px-2 py-1 rounded-full",
                                            movement.movement_type === 'in' ? "bg-green-100 text-green-800" :
                                            movement.movement_type === 'out' ? "bg-red-100 text-red-800" :
                                            movement.movement_type === 'adjust' ? "bg-blue-100 text-blue-800" :
                                            "bg-gray-100 text-gray-800"
                                          )}>
                                            {movement.movement_type === 'in' ? '입고' :
                                             movement.movement_type === 'out' ? '출고' :
                                             movement.movement_type === 'adjust' ? '조정' : '폐기'}
                                          </span>
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap text-xs text-right font-medium">
                                          {movement.movement_type === 'out' ? '-' : '+'}{formatNumber(movement.quantity)} {item.unit}
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600">
                                          {movement.lot_number || '-'}
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600">
                                          {movement.traceability_number || '-'}
                                        </td>
                                        <td className="px-3 py-2 text-xs text-gray-600">
                                          {movement.notes || '-'}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })
            )}
          </tbody>
        </table>
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
  )
}