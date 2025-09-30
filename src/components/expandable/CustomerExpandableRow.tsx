import { useQuery } from '@tanstack/react-query'
import { transactionAPI } from '../../lib/tauri'
import { formatCurrency } from '../../lib/utils'
import ExpandableRowCard, { CardSection, InfoItem } from './ExpandableRowCard'
import type { Customer } from '../../types'

interface CustomerExpandableRowProps {
  customer: Customer
  isExpanded: boolean
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
}

export default function CustomerExpandableRow({ 
  customer, 
  isExpanded, 
  onToggle, 
  onEdit, 
  onDelete 
}: CustomerExpandableRowProps) {
  // 확장된 경우에만 거래 데이터 조회
  const { data: transactions } = useQuery({
    queryKey: ['transactions', customer.id],
    queryFn: () => transactionAPI.getAll(),
    enabled: isExpanded && !!customer.id
  })

  // 해당 거래처의 거래만 필터링
  const customerTransactions = transactions?.filter(t => t.customer_id === customer.id) || []
  const recentTransactions = customerTransactions.slice(0, 5)

  // 통계 계산
  const totalSales = customerTransactions
    .filter(t => t.transaction_type === 'sales')
    .reduce((sum, t) => sum + t.total_amount, 0)
  
  const totalPurchase = customerTransactions
    .filter(t => t.transaction_type === 'purchase')  
    .reduce((sum, t) => sum + t.total_amount, 0)

  const totalTransactions = customerTransactions.length

  return (
    <>
      {/* 기본 테이블 행 */}
      <tr 
        className="hover:bg-gray-50 cursor-pointer transition-colors duration-150"
        onClick={onToggle}
      >
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
          <div className="flex items-center">
            <span className="mr-2 text-gray-400 transition-transform duration-200">
              {isExpanded ? '▼' : '▶'}
            </span>
            {customer.name}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {customer.business_number || '-'}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {customer.contact_person || '-'}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {customer.phone || '-'}
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            customer.type === 'customer' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-blue-100 text-blue-800'
          }`}>
            {customer.type === 'customer' ? '🛒 고객' : '🏭 공급업체'}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            customer.is_active 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {customer.is_active ? '✅ 활성' : '❌ 비활성'}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={onEdit}
              className="text-blue-600 hover:text-blue-900 transition-colors"
            >
              ✏️ 수정
            </button>
            <button
              onClick={() => onDelete()}
              className="text-red-600 hover:text-red-900 transition-colors"
            >
              🗑️ 삭제
            </button>
          </div>
        </td>
      </tr>

      {/* 확장된 상세 정보 */}
      {isExpanded && (
        <tr>
          <td colSpan={7} className="px-0 py-0">
            <div className="transition-all duration-300 ease-in-out">
              <ExpandableRowCard>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* 상세 정보 */}
                  <CardSection title="상세 정보" icon="🏢">
                    <InfoItem label="거래처명" value={customer.name} />
                    <InfoItem label="사업자번호" value={customer.business_number || '-'} />
                    <InfoItem label="대표자" value={customer.contact_person || '-'} />
                    <InfoItem label="전화번호" value={customer.phone || '-'} />
                    <InfoItem label="이메일" value={customer.email || '-'} />
                    <InfoItem label="주소" value={customer.address || '-'} />
                    <InfoItem 
                      label="거래처 구분" 
                      value={customer.type === 'customer' ? '🛒 고객' : '🏭 공급업체'} 
                    />
                    <InfoItem 
                      label="상태" 
                      value={customer.is_active ? '✅ 활성' : '❌ 비활성'} 
                    />
                  </CardSection>

                  {/* 최근 거래 내역 */}
                  <CardSection title="최근 거래" icon="📊">
                    {recentTransactions.length > 0 ? (
                      <div className="space-y-2">
                        {recentTransactions.map((transaction, index) => (
                          <div key={transaction.id || index} className="bg-white p-3 rounded border">
                            <div className="flex justify-between items-start text-sm">
                              <div>
                                <div className="font-medium">
                                  {transaction.transaction_type === 'sales' ? '💰 매출' : '📦 매입'}
                                </div>
                                <div className="text-gray-500 text-xs">
                                  {transaction.transaction_date}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-medium">
                                  {formatCurrency(transaction.total_amount)}
                                </div>
                                <div className="text-gray-500 text-xs">
                                  {transaction.items?.length || 0}개 상품
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-500 text-sm text-center py-4">
                        거래 내역이 없습니다
                      </div>
                    )}
                  </CardSection>

                  {/* 거래 통계 */}
                  <CardSection title="거래 통계" icon="📈">
                    {/* 🆕 미수금 섹션 (고객일 때만) */}
                    {customer.type === 'customer' && (
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border-2 border-blue-300 mb-4">
                        <div className="text-sm text-gray-600 mb-1">💰 현재 미수금</div>
                        <div className="text-3xl font-bold text-blue-700">
                          {formatCurrency(customer.outstanding_balance || 0)}
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                          {(customer.outstanding_balance || 0) > 0 
                            ? '⚠️ 수금이 필요합니다' 
                            : '✅ 미수금이 없습니다'}
                        </div>
                      </div>
                    )}
                    
                    <InfoItem 
                      label="총 거래 건수" 
                      value={`${totalTransactions}건`} 
                    />
                    <InfoItem 
                      label="총 매출" 
                      value={formatCurrency(totalSales)} 
                      className="text-green-600" 
                    />
                    <InfoItem 
                      label="총 매입" 
                      value={formatCurrency(totalPurchase)} 
                      className="text-blue-600" 
                    />
                    <InfoItem 
                      label="순 거래액" 
                      value={formatCurrency(totalSales - totalPurchase)} 
                      className={totalSales - totalPurchase >= 0 ? "text-green-600" : "text-red-600"} 
                    />
                    {totalTransactions > 0 && (
                      <InfoItem 
                        label="평균 거래액" 
                        value={formatCurrency((totalSales + totalPurchase) / totalTransactions)} 
                      />
                    )}
                  </CardSection>
                </div>
              </ExpandableRowCard>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}
