import { useState, useRef, useMemo } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { customerAPI } from '../../lib/tauri'
import { importCustomersFromCSV, exportCustomersToCSV, downloadCSV, generateCustomerCSVTemplate } from '../../lib/csv'
import type { Customer } from '../../types'

interface CustomerCSVManagerProps {
  customers: Customer[]
}

interface FilterOptions {
  type: 'all' | 'customer' | 'supplier'
  isActive: 'all' | 'active' | 'inactive'
  searchTerm: string
}

export default function CustomerCSVManager({ customers }: CustomerCSVManagerProps) {
  const [isImporting, setIsImporting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [importResults, setImportResults] = useState<{ success: number; errors: string[] } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  // 필터 상태
  const [filters, setFilters] = useState<FilterOptions>({
    type: 'all',
    isActive: 'all',
    searchTerm: ''
  })

  // 필터링된 거래처 데이터
  const filteredCustomers = useMemo(() => {
    return customers.filter(customer => {
      if (filters.type !== 'all' && customer.type !== filters.type) return false
      if (filters.isActive === 'active' && !customer.is_active) return false
      if (filters.isActive === 'inactive' && customer.is_active) return false
      
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase()
        const nameMatch = customer.name.toLowerCase().includes(searchLower)
        const businessNumberMatch = customer.business_number?.toLowerCase().includes(searchLower)
        const contactPersonMatch = customer.contact_person?.toLowerCase().includes(searchLower)
        
        if (!nameMatch && !businessNumberMatch && !contactPersonMatch) return false
      }
      
      return true
    })
  }, [customers, filters])

  // 통계 계산
  const stats = useMemo(() => {
    const customerType = filteredCustomers.filter(c => c.type === 'customer')
    const supplierType = filteredCustomers.filter(c => c.type === 'supplier')
    const active = filteredCustomers.filter(c => c.is_active)
    
    return {
      total: filteredCustomers.length,
      customers: customerType.length,
      suppliers: supplierType.length,
      active: active.length,
      inactive: filteredCustomers.length - active.length
    }
  }, [filteredCustomers])

  // 가져오기 Mutation
  const importMutation = useMutation({
    mutationFn: async (csvData: Customer[]) => {
      const results = await Promise.allSettled(
        csvData.map(customer => customerAPI.create(customer))
      )
      
      const success = results.filter(r => r.status === 'fulfilled').length
      const errors = results
        .filter(r => r.status === 'rejected')
        .map((r, index) => `${index + 1}번째 거래처: ${r.reason?.message || '알 수 없는 오류'}`)
      
      return { success, errors }
    },
    onSuccess: (results) => {
      setImportResults(results)
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
    onSettled: () => {
      setIsImporting(false)
    }
  })

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleResetFilters = () => {
    setFilters({ type: 'all', isActive: 'all', searchTerm: '' })
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    setImportResults(null)

    try {
      const csvContent = await file.text()
      const parsedData = await importCustomersFromCSV(csvContent)
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
    if (filteredCustomers.length === 0) {
      alert('내보낼 거래처 데이터가 없습니다')
      return
    }

    setIsExporting(true)

    try {
      const csvContent = exportCustomersToCSV(filteredCustomers)
      
      let filename = '거래처목록'
      if (filters.type !== 'all') {
        filename += `_${filters.type === 'customer' ? '고객' : '공급업체'}`
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
    const template = generateCustomerCSVTemplate()
    downloadCSV(template, '거래처_가져오기_템플릿.csv')
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 거래처 CSV 관리</h3>
      
      {/* 가져오기 섹션 */}
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
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
            <label className="block text-xs font-medium text-gray-700 mb-1">거래처 타입</label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value as any)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">전체</option>
              <option value="customer">고객</option>
              <option value="supplier">공급업체</option>
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
              placeholder="거래처명, 사업자번호, 담당자..."
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
            <div className="text-xs text-blue-800">총 거래처</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <div className="text-lg font-bold text-green-600">{stats.customers}</div>
            <div className="text-xs text-green-800">고객</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-3">
            <div className="text-lg font-bold text-purple-600">{stats.suppliers}</div>
            <div className="text-xs text-purple-800">공급업체</div>
          </div>
          <div className="bg-emerald-50 rounded-lg p-3">
            <div className="text-lg font-bold text-emerald-600">{stats.active}</div>
            <div className="text-xs text-emerald-800">활성</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-lg font-bold text-gray-600">{stats.inactive}</div>
            <div className="text-xs text-gray-800">비활성</div>
          </div>
        </div>
      </div>

      {/* 내보내기 섹션 */}
      <div className="pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {filteredCustomers.length > 0 ? (
              <><span className="font-medium">{filteredCustomers.length}개</span>의 거래처를 내보냅니다</>
            ) : (
              '조건에 맞는 거래처가 없습니다'
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
              '📤 CSV로 내보내기'
            )}
          </button>
        </div>
      </div>

      {/* 도움말 */}
      <div className="mt-6 p-3 bg-blue-50 rounded-md">
        <h5 className="text-sm font-medium text-blue-900 mb-2">💡 사용 방법</h5>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• 템플릿을 다운로드하여 거래처 정보를 입력하세요</li>
          <li>• 거래처구분은 '고객', '공급업체', 'customer', 'supplier' 중 입력 가능</li>
          <li>• 거래처명은 필수이며, 나머지는 선택사항입니다</li>
          <li>• 한글과 영어 컬럼명 모두 지원 (예: '거래처명' 또는 'name')</li>
          <li>• 필터로 원하는 조건의 거래처만 내보낼 수 있습니다</li>
        </ul>
      </div>
    </div>
  )
}
