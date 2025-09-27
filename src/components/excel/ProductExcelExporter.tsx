import { useState, useMemo } from 'react'
import { generateProductExcel } from '../../lib/excel/productExcel'
import { formatCurrency } from '../../lib/utils'
import type { Product } from '../../types'

interface ProductExcelExporterProps {
  products: Product[]
}

interface FilterOptions {
  category: string
  isActive: 'all' | 'true' | 'false'
  searchQuery: string
}

export default function ProductExcelExporter({ products }: ProductExcelExporterProps) {
  const [filters, setFilters] = useState<FilterOptions>({
    category: 'all',
    isActive: 'all',
    searchQuery: ''
  })

  const [isExporting, setIsExporting] = useState(false)

  // 필터링
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      if (filters.category !== 'all' && product.category !== filters.category)
        return false
      
      if (filters.isActive === 'true' && !product.is_active)
        return false
      
      if (filters.isActive === 'false' && product.is_active)
        return false
      
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase()
        return (
          product.name.toLowerCase().includes(query) ||
          product.code?.toLowerCase().includes(query)
        )
      }
      
      return true
    })
  }, [products, filters])

  // 통계
  const stats = useMemo(() => {
    const avgPrice = filteredProducts
      .filter(p => p.unit_price)
      .reduce((sum, p) => sum + (p.unit_price || 0), 0) / 
      filteredProducts.filter(p => p.unit_price).length || 0

    return {
      total: filteredProducts.length,
      active: filteredProducts.filter(p => p.is_active).length,
      byCategory: {
        돼지고기: filteredProducts.filter(p => p.category === '돼지고기').length,
        소고기: filteredProducts.filter(p => p.category === '소고기').length,
        닭고기: filteredProducts.filter(p => p.category === '닭고기').length,
        오리고기: filteredProducts.filter(p => p.category === '오리고기').length
      },
      avgPrice
    }
  }, [filteredProducts])

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleResetFilters = () => {
    setFilters({
      category: 'all',
      isActive: 'all',
      searchQuery: ''
    })
  }

  const handleExport = async () => {
    if (filteredProducts.length === 0) {
      alert('내보낼 상품 데이터가 없습니다')
      return
    }

    setIsExporting(true)
    
    try {
      generateProductExcel(filteredProducts, filters)
    } catch (error) {
      console.error('Excel 내보내기 오류:', error)
      alert('Excel 내보내기 중 오류가 발생했습니다.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">📦 상품 목록 Excel 다운로드</h3>
      
      {/* 필터 섹션 */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-3">🔍 필터 조건</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 카테고리 */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              카테고리
            </label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">전체</option>
              <option value="돼지고기">🐷 돼지고기</option>
              <option value="소고기">🐄 소고기</option>
              <option value="닭고기">🐔 닭고기</option>
              <option value="오리고기">🦆 오리고기</option>
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
              placeholder="상품명, 상품코드"
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
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="text-lg font-bold text-blue-600">{stats.total}</div>
            <div className="text-xs text-blue-800">총 상품</div>
          </div>
          <div className="bg-emerald-50 rounded-lg p-3">
            <div className="text-lg font-bold text-emerald-600">{stats.active}</div>
            <div className="text-xs text-emerald-800">활성</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-3">
            <div className="text-lg font-bold text-purple-600">{formatCurrency(stats.avgPrice)}</div>
            <div className="text-xs text-purple-800">평균 단가</div>
          </div>
        </div>

        {/* 카테고리별 통계 */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-pink-50 rounded-lg p-2">
            <div className="text-sm font-semibold text-pink-600">🐷 돼지고기</div>
            <div className="text-lg font-bold text-pink-800">{stats.byCategory.돼지고기}</div>
          </div>
          <div className="bg-red-50 rounded-lg p-2">
            <div className="text-sm font-semibold text-red-600">🐄 소고기</div>
            <div className="text-lg font-bold text-red-800">{stats.byCategory.소고기}</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-2">
            <div className="text-sm font-semibold text-yellow-600">🐔 닭고기</div>
            <div className="text-lg font-bold text-yellow-800">{stats.byCategory.닭고기}</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-2">
            <div className="text-sm font-semibold text-orange-600">🦆 오리고기</div>
            <div className="text-lg font-bold text-orange-800">{stats.byCategory.오리고기}</div>
          </div>
        </div>
      </div>

      {/* 내보내기 버튼 */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          {filteredProducts.length > 0 ? (
            <>
              <span className="font-medium">{filteredProducts.length}개</span>의 상품을 Excel로 내보냅니다
            </>
          ) : (
            '조건에 맞는 상품 데이터가 없습니다'
          )}
        </div>
        <button
          onClick={handleExport}
          disabled={filteredProducts.length === 0 || isExporting}
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
        <h5 className="text-sm font-medium text-blue-900 mb-2">💡 상품 Excel 기능</h5>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• 6개 시트: 상품 요약, 전체 상품, 돼지고기, 소고기, 닭고기, 오리고기</li>
          <li>• 카테고리, 활성 상태, 검색어로 필터링 가능</li>
          <li>• 상품코드, 단위, 참고단가 등 모든 정보 포함</li>
          <li>• 파일명에 필터 조건이 자동으로 반영됩니다</li>
        </ul>
      </div>
    </div>
  )
}
