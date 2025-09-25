import { useState, useRef, useMemo } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { productAPI } from '../../lib/tauri'
import { importProductsFromCSV, exportProductsToCSV, downloadCSV, generateProductCSVTemplate } from '../../lib/csv'
import type { Product } from '../../types'

interface ProductCSVManagerProps {
  products: Product[]
}

interface FilterOptions {
  category: string
  isActive: 'all' | 'active' | 'inactive'
  searchTerm: string
}

export default function ProductCSVManager({ products }: ProductCSVManagerProps) {
  const [isImporting, setIsImporting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [importResults, setImportResults] = useState<{ success: number; errors: string[] } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  // 필터 상태
  const [filters, setFilters] = useState<FilterOptions>({
    category: 'all',
    isActive: 'all',
    searchTerm: ''
  })

  // 카테고리 목록 추출
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(products.map(p => p.category).filter(Boolean))]
    return uniqueCategories.sort()
  }, [products])

  // 필터링된 상품 데이터
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      if (filters.category !== 'all' && product.category !== filters.category) return false
      if (filters.isActive === 'active' && !product.is_active) return false
      if (filters.isActive === 'inactive' && product.is_active) return false
      
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase()
        const nameMatch = product.name.toLowerCase().includes(searchLower)
        const codeMatch = product.code?.toLowerCase().includes(searchLower)
        const descMatch = product.description?.toLowerCase().includes(searchLower)
        
        if (!nameMatch && !codeMatch && !descMatch) return false
      }
      
      return true
    })
  }, [products, filters])

  // 통계 계산
  const stats = useMemo(() => {
    const active = filteredProducts.filter(p => p.is_active)
    const withPrice = filteredProducts.filter(p => p.unit_price && p.unit_price > 0)
    const avgPrice = withPrice.length > 0 
      ? withPrice.reduce((sum, p) => sum + (p.unit_price || 0), 0) / withPrice.length 
      : 0
    
    return {
      total: filteredProducts.length,
      active: active.length,
      inactive: filteredProducts.length - active.length,
      withPrice: withPrice.length,
      avgPrice: Math.round(avgPrice)
    }
  }, [filteredProducts])

  // 가져오기 Mutation
  const importMutation = useMutation({
    mutationFn: async (csvData: Product[]) => {
      const results = await Promise.allSettled(
        csvData.map(product => productAPI.create(product))
      )
      
      const success = results.filter(r => r.status === 'fulfilled').length
      const errors = results
        .filter(r => r.status === 'rejected')
        .map((r, index) => `${index + 1}번째 상품: ${r.reason?.message || '알 수 없는 오류'}`)
      
      return { success, errors }
    },
    onSuccess: (results) => {
      setImportResults(results)
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
    onSettled: () => {
      setIsImporting(false)
    }
  })

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleResetFilters = () => {
    setFilters({ category: 'all', isActive: 'all', searchTerm: '' })
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    setImportResults(null)

    try {
      const csvContent = await file.text()
      const parsedData = await importProductsFromCSV(csvContent)
      importMutation.mutate(parsedData)
    } catch (error) {
      setImportResults({
        success: 0,
        errors: [error instanceof Error ? error.message : '파일 처리 중 오류가 발생했습니다']
      })
      setIsImporting(false)
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleExport = async () => {
    if (filteredProducts.length === 0) {
      alert('내보낼 상품 데이터가 없습니다')
      return
    }

    setIsExporting(true)

    try {
      const csvContent = exportProductsToCSV(filteredProducts)
      
      let filename = '상품목록'
      if (filters.category !== 'all') {
        filename += `_${filters.category}`
      }
      if (filters.isActive !== 'all') {
        filename += `_${filters.isActive === 'active' ? '활성' : '비활성'}`
      }
      if (filters.searchTerm) {
        filename += `_${filters.searchTerm}`
      }
      
      const today = new Date().toISOString().split('T')[0]
      filename += `_${today}.csv`
      
      downloadCSV(csvContent, filename)
    } catch (error) {
      console.error('CSV 내보내기 오류:', error)
      alert('CSV 내보내기 중 오류가 발생했습니다.')
    } finally {
      setIsExporting(false)
    }
  }

  const handleDownloadTemplate = () => {
    const template = generateProductCSVTemplate()
    downloadCSV(template, '상품_가져오기_템플릿.csv')
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">📦 상품 CSV 관리</h3>
      
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-900 mb-3">📥 가져오기</h4>
        <div className="flex items-center space-x-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
            disabled={isImporting}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isImporting ? '가져오는 중...' : 'CSV 파일 선택'}
          </button>
          <button
            onClick={handleDownloadTemplate}
            className="px-4 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            템플릿 다운로드
          </button>
        </div>
        
        {isImporting && (
          <div className="mt-3 flex items-center text-sm text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            데이터를 가져오고 있습니다...
          </div>
        )}

        {importResults && (
          <div className="mt-3 p-3 rounded-md bg-gray-50">
            <div className="text-sm">
              <span className="text-green-600 font-medium">성공: {importResults.success}개</span>
              {importResults.errors.length > 0 && (
                <>
                  <span className="text-red-600 font-medium ml-4">실패: {importResults.errors.length}개</span>
                  <div className="mt-2 space-y-1">
                    {importResults.errors.slice(0, 5).map((error, index) => (
                      <div key={index} className="text-xs text-red-600">• {error}</div>
                    ))}
                    {importResults.errors.length > 5 && (
                      <div className="text-xs text-gray-500">... 외 {importResults.errors.length - 5}개 오류</div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 필터 섹션 */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-3">🔍 내보내기 필터</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">카테고리</label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">전체</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === '돼지고기' ? '🐷 돼지고기' :
                   category === '소고기' ? '🐄 소고기' :
                   category === '닭고기' ? '🐔 닭고기' :
                   category === '오리고기' ? '🦆 오리고기' :
                   `🍖 ${category}`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">활성 상태</label>
            <select
              value={filters.isActive}
              onChange={(e) => handleFilterChange('isActive', e.target.value as any)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">전체</option>
              <option value="active">활성</option>
              <option value="inactive">비활성</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">검색어</label>
            <input
              type="text"
              placeholder="상품명, 상품코드, 설명..."
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

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
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="text-lg font-bold text-blue-600">{stats.total}</div>
            <div className="text-xs text-blue-800">총 상품</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <div className="text-lg font-bold text-green-600">{stats.active}</div>
            <div className="text-xs text-green-800">활성</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-lg font-bold text-gray-600">{stats.inactive}</div>
            <div className="text-xs text-gray-800">비활성</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-3">
            <div className="text-lg font-bold text-purple-600">{stats.withPrice}</div>
            <div className="text-xs text-purple-800">가격 설정</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-3">
            <div className="text-lg font-bold text-yellow-600">₩{stats.avgPrice.toLocaleString()}</div>
            <div className="text-xs text-yellow-800">평균 단가</div>
          </div>
        </div>
      </div>

      {/* 내보내기 섹션 */}
      <div className="pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {filteredProducts.length > 0 ? (
              <><span className="font-medium">{filteredProducts.length}개</span>의 상품을 내보냅니다</>
            ) : (
              '조건에 맞는 상품이 없습니다'
            )}
          </div>
          <button
            onClick={handleExport}
            disabled={filteredProducts.length === 0 || isExporting}
            className="px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                내보내는 중...
              </>
            ) : (
              '📤 CSV로 내보내기'
            )}
          </button>
        </div>
      </div>

      {/* 도움말 */}
      <div className="mt-6 p-3 bg-yellow-50 rounded-md">
        <h5 className="text-sm font-medium text-yellow-900 mb-2">💡 사용 방법</h5>
        <ul className="text-xs text-yellow-800 space-y-1">
          <li>• 템플릿을 다운로드하여 상품 정보를 입력하세요</li>
          <li>• 상품명과 단위는 필수 항목입니다</li>
          <li>• 카테고리는 '돼지고기', '소고기', '닭고기', '오리고기' 등 입력</li>
          <li>• 한글과 영어 컬럼명 모두 지원 (예: '상품명' 또는 'name')</li>
          <li>• 필터로 카테고리별, 상태별 상품만 선별하여 내보낼 수 있습니다</li>
        </ul>
      </div>
    </div>
  )
}
