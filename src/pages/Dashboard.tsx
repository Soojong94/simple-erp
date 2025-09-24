import { useQuery } from '@tanstack/react-query'
import { customerAPI, productAPI, transactionAPI } from '../lib/tauri'
import { formatCurrency } from '../lib/utils'

export default function Dashboard() {
  const { data: customers, isLoading: customersLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: customerAPI.getAll
  })

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['products'],
    queryFn: productAPI.getAll
  })

  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: transactionAPI.getAll
  })

  // 이번 달 매출 계산
  const thisMonthSales = transactions
    ?.filter(t => {
      if (!t.transaction.transaction_date) return false
      const transactionDate = new Date(t.transaction.transaction_date)
      const now = new Date()
      return transactionDate.getMonth() === now.getMonth() &&
             transactionDate.getFullYear() === now.getFullYear() &&
             t.transaction.transaction_type === 'sales' &&
             t.transaction.status === 'completed'
    })
    ?.reduce((sum, t) => sum + t.transaction.total_amount, 0) || 0

  return (
    <div>
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
                고객: {customers?.filter(c => c.customer_type === 'customer').length || 0}
              </span>
              <span className="text-gray-500 ml-2">
                공급업체: {customers?.filter(c => c.customer_type === 'supplier').length || 0}
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
                  <div key={transaction.transaction.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {transaction.customer.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {transaction.transaction.transaction_date} • {transaction.transaction.transaction_type === 'sales' ? '매출' : '매입'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(transaction.transaction.total_amount)}
                      </div>
                      <div className={`text-xs ${
                        transaction.transaction.status === 'completed' ? 'text-green-600' :
                        transaction.transaction.status === 'pending' ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {transaction.transaction.status === 'completed' ? '완료' :
                         transaction.transaction.status === 'pending' ? '대기' : '취소'}
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
  )
}
