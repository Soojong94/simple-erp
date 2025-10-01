import { useState } from 'react'

interface TestDataSectionProps {
  onGenerateCustomers: (count: number) => Promise<void>
  onGenerateProducts: (count: number) => Promise<void>
  onGenerateTransactions: (count: number) => Promise<void>
  onGenerateAll: () => Promise<void>
}

export default function TestDataSection({
  onGenerateCustomers,
  onGenerateProducts,
  onGenerateTransactions,
  onGenerateAll
}: TestDataSectionProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatingType, setGeneratingType] = useState<string>('')
  
  const [counts, setCounts] = useState({
    customers: 100,
    products: 150,
    transactions: 200
  })

  const handleGenerate = async (
    type: 'customers' | 'products' | 'transactions' | 'all',
    fn: () => Promise<void>
  ) => {
    if (isGenerating) return
    
    const confirmed = window.confirm(
      type === 'all' 
        ? '⚠️ 모든 테스트 데이터를 생성하시겠습니까?\n\n거래처 100개, 상품 150개, 거래 200개가 생성됩니다.\n이 작업은 몇 분 정도 소요될 수 있습니다.'
        : `⚠️ ${type === 'customers' ? '거래처' : type === 'products' ? '상품' : '거래'} 데이터를 생성하시겠습니까?\n\n${counts[type as keyof typeof counts]}개의 데이터가 생성됩니다.`
    )
    
    if (!confirmed) return
    
    setIsGenerating(true)
    setGeneratingType(type)
    
    try {
      await fn()
      alert(`✅ ${type === 'all' ? '모든 테스트 데이터' : type === 'customers' ? '거래처' : type === 'products' ? '상품' : '거래'} 생성이 완료되었습니다!`)
    } catch (error) {
      console.error('테스트 데이터 생성 오류:', error)
      alert('❌ 테스트 데이터 생성 중 오류가 발생했습니다.')
    } finally {
      setIsGenerating(false)
      setGeneratingType('')
    }
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="border-b border-gray-200 pb-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-900">🧪 개발자 도구</h3>
        <p className="mt-1 text-sm text-gray-600">
          테스트 및 데모를 위한 더미 데이터를 생성합니다
        </p>
      </div>

      {/* 경고 메시지 */}
      <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">주의사항</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <ul className="list-disc pl-5 space-y-1">
                <li>이 기능은 <strong>개발 및 테스트 목적</strong>으로만 사용하세요</li>
                <li>대량의 더미 데이터가 생성되며 실제 데이터와 혼합될 수 있습니다</li>
                <li>생성 전 <strong>백업을 권장</strong>합니다</li>
                <li>생성된 데이터는 수동으로 삭제해야 합니다</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* 개별 생성 버튼들 */}
      <div className="space-y-4">
        {/* 거래처 생성 */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex-1">
            <h4 className="text-sm font-medium text-gray-900">🏢 거래처 데이터</h4>
            <p className="mt-1 text-sm text-gray-600">고객과 공급업체를 균등하게 생성</p>
          </div>
          <div className="flex items-center space-x-3">
            <input
              type="number"
              min="1"
              max="500"
              value={counts.customers}
              onChange={(e) => setCounts({ ...counts, customers: parseInt(e.target.value) || 100 })}
              disabled={isGenerating}
              className="w-20 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
            <span className="text-sm text-gray-600">개</span>
            <button
              onClick={() => handleGenerate('customers', () => onGenerateCustomers(counts.customers))}
              disabled={isGenerating}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating && generatingType === 'customers' ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  생성 중...
                </div>
              ) : (
                '생성'
              )}
            </button>
          </div>
        </div>

        {/* 상품 생성 */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex-1">
            <h4 className="text-sm font-medium text-gray-900">📦 상품 데이터</h4>
            <p className="mt-1 text-sm text-gray-600">돼지고기, 소고기, 닭고기, 오리고기 카테고리별 생성</p>
          </div>
          <div className="flex items-center space-x-3">
            <input
              type="number"
              min="1"
              max="500"
              value={counts.products}
              onChange={(e) => setCounts({ ...counts, products: parseInt(e.target.value) || 150 })}
              disabled={isGenerating}
              className="w-20 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
            <span className="text-sm text-gray-600">개</span>
            <button
              onClick={() => handleGenerate('products', () => onGenerateProducts(counts.products))}
              disabled={isGenerating}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating && generatingType === 'products' ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  생성 중...
                </div>
              ) : (
                '생성'
              )}
            </button>
          </div>
        </div>

        {/* 거래 생성 */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex-1">
            <h4 className="text-sm font-medium text-gray-900">📊 거래 데이터</h4>
            <p className="mt-1 text-sm text-gray-600">최근 180일 내 랜덤 날짜로 매출/매입 생성</p>
            <p className="mt-1 text-xs text-yellow-600">⚠️ 거래처와 상품이 먼저 필요합니다</p>
          </div>
          <div className="flex items-center space-x-3">
            <input
              type="number"
              min="1"
              max="1000"
              value={counts.transactions}
              onChange={(e) => setCounts({ ...counts, transactions: parseInt(e.target.value) || 200 })}
              disabled={isGenerating}
              className="w-20 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
            <span className="text-sm text-gray-600">개</span>
            <button
              onClick={() => handleGenerate('transactions', () => onGenerateTransactions(counts.transactions))}
              disabled={isGenerating}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating && generatingType === 'transactions' ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  생성 중...
                </div>
              ) : (
                '생성'
              )}
            </button>
          </div>
        </div>

        {/* 전체 생성 버튼 */}
        <div className="pt-4 border-t border-gray-200">
          <button
            onClick={() => handleGenerate('all', onGenerateAll)}
            disabled={isGenerating}
            className="w-full px-6 py-3 text-base font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {isGenerating && generatingType === 'all' ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                모든 테스트 데이터 생성 중...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                모든 테스트 데이터 한번에 생성 (거래처 100 + 상품 150 + 거래 200)
              </div>
            )}
          </button>
        </div>
      </div>

      {/* 안내 정보 */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 mb-2">💡 생성되는 데이터</h4>
        <div className="text-xs text-blue-800 space-y-2">
          <div>
            <strong>거래처:</strong> 다양한 업체명, 사업자번호, 대표자, 연락처, 주소 등
          </div>
          <div>
            <strong>상품:</strong> 고기 카테고리별 상품명, 코드, 단가, 이력번호, 원산지, 도축장 등
          </div>
          <div>
            <strong>거래:</strong> 매출/매입 거래, 1-5개의 상품 포함, 최근 180일 내 랜덤 날짜
          </div>
          <div className="pt-2 border-t border-blue-300 mt-2">
            <strong>참고:</strong> 생성 시간은 데이터 수에 따라 수십 초에서 몇 분까지 소요될 수 있습니다
          </div>
        </div>
      </div>
    </div>
  )
}
