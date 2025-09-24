import { useQuery } from '@tanstack/react-query'
import { customerAPI, productAPI, transactionAPI } from '../lib/tauri'
import { formatCurrency } from '../lib/utils'

export default function Dashboard() {
  const { data: customers, isLoading: customersLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customerAPI.getAll()
  })

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => productAPI.getAll()
  })

  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => transactionAPI.getAll()
  })

  // 이번 달 매출 계산
  const thisMonthSales = transactions
    ?.filter(t => {
      if (!t.transaction_date) return false
      const transactionDate = new Date(t.transaction_date)
      const now = new Date()
      return transactionDate.getMonth() === now.getMonth() &&
             transactionDate.getFullYear() === now.getFullYear() &&
             t.transaction_type === 'sales' &&
             t.status === 'confirmed'
    })
    ?.reduce((sum, t) => sum + t.total_amount, 0) || 0

  return (
    <div className="flex">
      {/* 메인 컨텐츠 영역 */}
      <div className="flex-1 pr-6">
        <h1 className="text-2xl font-semibold text-gray-900">대시보드</h1>
        <p className="mt-2 text-sm text-gray-700">
          Simple ERP 시스템에 오신 것을 환영합니다.
        </p>
      
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* 거래처 통계 */}
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
                    {customersLoading ? (
                      <div className="animate-pulse bg-gray-200 h-6 w-8 rounded"></div>
                    ) : (
                      `${customers?.length || 0}개`
                    )}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <span className="text-blue-600 font-medium">
                고객: {customers?.filter(c => c.type === 'customer').length || 0}
              </span>
              <span className="text-gray-500 ml-2">
                공급업체: {customers?.filter(c => c.type === 'supplier').length || 0}
              </span>
            </div>
          </div>
        </div>

        {/* 상품 통계 */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                  <span className="text-green-600 text-sm font-medium">📦</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    등록된 상품
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {productsLoading ? (
                      <div className="animate-pulse bg-gray-200 h-6 w-8 rounded"></div>
                    ) : (
                      `${products?.length || 0}개`
                    )}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm text-gray-500">
              평균 단가: {products && products.length > 0 ? formatCurrency(
                products.reduce((sum, p) => sum + p.unit_price, 0) / products.length
              ) : '₩0'}
            </div>
          </div>
        </div>

        {/* 매출 통계 */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-md flex items-center justify-center">
                  <span className="text-yellow-600 text-sm font-medium">💰</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    이번 달 매출
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {transactionsLoading ? (
                      <div className="animate-pulse bg-gray-200 h-6 w-16 rounded"></div>
                    ) : (
                      formatCurrency(thisMonthSales)
                    )}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm text-gray-500">
              총 거래: {transactions?.length || 0}건
            </div>
          </div>
        </div>
      </div>

        {/* 최근 활동 */}
        <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">최근 거래</h2>
        <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-900">거래 내역</h3>
        </div>
        <div className="px-6 py-4">
        {transactionsLoading ? (
        <div className="text-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <div className="mt-2 text-sm text-gray-500">거래 내역 로딩 중...</div>
        </div>
        ) : !transactions || transactions.length === 0 ? (
        <div className="text-center py-4 text-sm text-gray-500">
        아직 거래 내역이 없습니다.
        </div>
        ) : (
        <div className="space-y-2">
        {transactions.slice(0, 5).map((transaction) => (
        <div key={transaction.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
        <div>
        <div className="text-sm font-medium text-gray-900">
        {transaction.customer_name}
        </div>
        <div className="text-xs text-gray-500">
        {transaction.transaction_date} • {transaction.transaction_type === 'sales' ? '매출' : '매입'}
        </div>
        </div>
        <div className="text-right">
        <div className="text-sm font-medium text-gray-900">
        {formatCurrency(transaction.total_amount)}
        </div>
        <div className={`text-xs ${
        transaction.status === 'confirmed' ? 'text-green-600' :
        transaction.status === 'draft' ? 'text-yellow-600' :
        'text-red-600'
        }`}>
        {transaction.status === 'confirmed' ? '확정' :
        transaction.status === 'draft' ? '임시저장' : '취소'}
        </div>
        </div>
        </div>
        ))}
        </div>
        )}
        </div>
        </div>
        </div>
      </div>

      {/* 사이드바 - 빠른 정보 */}
      <div className="w-80 bg-gray-50 border-l border-gray-200 p-4">
        <div className="sticky top-6 space-y-6">
          {/* 최근 거래처 */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">📋 최근 거래처</h3>
            {customersLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg p-3 shadow-sm border animate-pulse">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            ) : customers && customers.length > 0 ? (
              <div className="space-y-2">
                {customers
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .slice(0, 8)
                  .map(customer => (
                    <div 
                      key={customer.id}
                      className="bg-white rounded-lg p-3 shadow-sm border hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">
                          {customer.type === 'customer' ? '🛒' : '🏭'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {customer.name}
                          </p>
                          <div className="flex items-center justify-between mt-1">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                              customer.type === 'customer' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {customer.type === 'customer' ? '고객' : '공급업체'}
                            </span>
                            {customer.phone && (
                              <span className="text-xs text-gray-500">
                                {customer.phone.slice(-4)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                }
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <div className="text-3xl mb-2">📝</div>
                <p className="text-sm">등록된 거래처가 없습니다</p>
              </div>
            )}
          </div>

          {/* 인기 상품 */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">🔥 인기 상품</h3>
            {productsLoading ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg p-3 shadow-sm border animate-pulse">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : products && products.length > 0 ? (
              <div className="space-y-2">
                {products
                  .filter(p => p.is_active)
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .slice(0, 6)
                  .map(product => (
                    <div 
                      key={product.id}
                      className="bg-white rounded-lg p-3 shadow-sm border hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">
                          {product.category === '돼지고기' ? '🐷' :
                           product.category === '소고기' ? '🐄' :
                           product.category === '닭고기' ? '🐔' :
                           product.category === '오리고기' ? '🦆' : '🍖'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {product.name}
                          </p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {product.category}
                            </span>
                            {product.unit_price && (
                              <span className="text-xs text-green-600 font-medium">
                                {formatCurrency(product.unit_price)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                }
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <div className="text-3xl mb-2">📝</div>
                <p className="text-sm">등록된 상품이 없습니다</p>
              </div>
            )}
          </div>

          {/* 빠른 액션 */}
          <div className="pt-3 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">⚡ 빠른 액션</h4>
            <div className="grid grid-cols-1 gap-2">
              <a
                href="/customers"
                className="flex items-center px-3 py-2 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
              >
                <span className="mr-2">🛒</span>
                거래처 관리
              </a>
              
              <a
                href="/products"
                className="flex items-center px-3 py-2 text-xs bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
              >
                <span className="mr-2">📦</span>
                상품 관리
              </a>
              
              <a
                href="/transactions"
                className="flex items-center px-3 py-2 text-xs bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors"
              >
                <span className="mr-2">📊</span>
                거래 관리
              </a>
              
              <a
                href="/settings"
                className="flex items-center px-3 py-2 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                <span className="mr-2">⚙️</span>
                설정
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
