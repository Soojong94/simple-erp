import { useQuery } from '@tanstack/react-query'
import { customerAPI, productAPI, transactionAPI, inventoryAPI } from '../lib/tauri'
import { formatCurrency } from '../lib/utils'
import { useChartData } from '../hooks/useChartData'
import { Link } from 'react-router-dom'

// 차트 컴포넌트들
import MonthlySalesChart from '../components/charts/MonthlySalesChart'
import CustomerSalesPieChart from '../components/charts/CustomerSalesPieChart'
import ExpiryAlertCard from '../components/inventory/ExpiryAlertCard'

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

  // 재고 통계 조회
  const { data: inventoryStats, isLoading: inventoryLoading } = useQuery({
    queryKey: ['inventory-stats'],
    queryFn: () => inventoryAPI.getStats(),
    refetchInterval: 60000 // 1분마다 자동 새로고침
  })

  // 차트 데이터 생성
  const { monthlyData, customerSalesData, thisMonthSales } = useChartData({
    transactions,
    products
  })

  return (
    <div className="flex">
      {/* 메인 컨텐츠 영역 */}
      <div className="flex-1 pr-6">
        <h1 className="text-2xl font-semibold text-gray-900">대시보드</h1>
        <p className="mt-2 text-sm text-gray-700">
          Simple ERP 시스템에 오신 것을 환영합니다.
        </p>
      
        {/* KPI 카드들 */}
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
                  products.filter(p => p.unit_price).reduce((sum, p) => sum + (p.unit_price || 0), 0) / products.filter(p => p.unit_price).length || 0
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

          {/* 🆕 재고 통계 */}
          <Link 
            to="/inventory"
            className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
                    <span className="text-purple-600 text-sm font-medium">📦</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      총 재고량
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {inventoryLoading ? (
                        <div className="animate-pulse bg-gray-200 h-6 w-16 rounded"></div>
                      ) : (
                        `${inventoryStats?.totalStock.toFixed(1) || 0} kg`
                      )}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm flex items-center justify-between">
                <span className={inventoryStats && inventoryStats.lowStockCount > 0 ? 'text-red-600 font-medium' : 'text-gray-500'}>
                  재고 부족: {inventoryStats?.lowStockCount || 0}개
                </span>
                <span className={inventoryStats && inventoryStats.expiringCount > 0 ? 'text-yellow-600 font-medium' : 'text-gray-500'}>
                  임박: {inventoryStats?.expiringCount || 0}개
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* 차트 섹션 */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MonthlySalesChart data={monthlyData} isLoading={transactionsLoading} />
          <CustomerSalesPieChart data={customerSalesData} isLoading={transactionsLoading} />
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
                        <div className="text-xs text-gray-500">
                          {transaction.items?.length || 0}개 상품
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

      {/* 사이드바 */}
      <div className="w-80 bg-gray-50 border-l border-gray-200 p-4">
        <div className="sticky top-6 space-y-6">
          {/* 🆕 재고 알림 */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">⚠️ 재고 알림</h3>
            <ExpiryAlertCard />
          </div>

          {/* 재고 부족 상품 */}
          {inventoryStats && inventoryStats.lowStockCount > 0 && (
            <div>
              <Link 
                to="/inventory"
                className="block p-4 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-red-800">
                      재고 부족 경고
                    </div>
                    <div className="text-xs text-red-600 mt-1">
                      {inventoryStats.lowStockCount}개 상품이 안전 재고 이하입니다
                    </div>
                  </div>
                  <div className="text-2xl">⚠️</div>
                </div>
              </Link>
            </div>
          )}

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
                  .slice(0, 6)
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

          {/* 빠른 액션 */}
          <div className="pt-3 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">⚡ 빠른 액션</h4>
            <div className="grid grid-cols-1 gap-2">
              <Link
                to="/inventory"
                className="flex items-center px-3 py-2 text-xs bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors"
              >
                <span className="mr-2">📦</span>
                재고 관리
              </Link>
              
              <Link
                to="/customers"
                className="flex items-center px-3 py-2 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
              >
                <span className="mr-2">🛒</span>
                거래처 관리
              </Link>
              
              <Link
                to="/products"
                className="flex items-center px-3 py-2 text-xs bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
              >
                <span className="mr-2">📦</span>
                상품 관리
              </Link>
              
              <Link
                to="/transactions"
                className="flex items-center px-3 py-2 text-xs bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200 transition-colors"
              >
                <span className="mr-2">📊</span>
                거래 관리
              </Link>
              
              <Link
                to="/settings"
                className="flex items-center px-3 py-2 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                <span className="mr-2">⚙️</span>
                설정
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
