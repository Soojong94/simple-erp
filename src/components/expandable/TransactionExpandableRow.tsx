import { formatCurrency } from '../../lib/utils'
import ExpandableRowCard, { CardSection, InfoItem } from './ExpandableRowCard'
import type { TransactionWithItems } from '../../types'

interface TransactionExpandableRowProps {
  transaction: TransactionWithItems
  displayNumber?: number  // 🎯 순번 추가
  isExpanded: boolean
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
  onPrint: () => void  // 🆕 거래증 출력 추가
}

export default function TransactionExpandableRow({ 
  transaction,
  displayNumber,  // 🎯 순번 받기
  isExpanded, 
  onToggle, 
  onEdit, 
  onDelete,
  onPrint  // 🆕 거래증 출력
}: TransactionExpandableRowProps) {
  
  const getTransactionTypeDisplay = (type: string) => {
    if (type === 'sales') return '💰 매출'
    if (type === 'purchase') return '📦 매입'
    if (type === 'payment') return '💵 수금'
    return '❓ 기타'
  }

  return (
    <>
      {/* 기본 테이블 행 */}
      <tr 
        className={`hover:opacity-90 cursor-pointer transition-all duration-150 ${
          transaction.transaction_type === 'sales' 
            ? 'bg-green-50'  // 🌿 매출: 연한 초록
            : transaction.transaction_type === 'purchase'
            ? 'bg-blue-50'   // 📦 매입: 연한 파란
            : 'bg-amber-50'  // 💵 수금: 연한 황금
        }`}
        onClick={onToggle}
      >
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
          <div className="flex items-center">
            <span className="mr-2 text-gray-400 transition-transform duration-200">
              {isExpanded ? '▼' : '▶'}
            </span>
            #{displayNumber || transaction.id}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {transaction.transaction_date}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            transaction.transaction_type === 'sales' 
              ? 'bg-green-100 text-green-800' 
              : transaction.transaction_type === 'purchase'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-amber-100 text-amber-800'
          }`}>
            {getTransactionTypeDisplay(transaction.transaction_type)}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {transaction.customer_name}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {transaction.items?.length || 0}개
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
          {formatCurrency(transaction.total_amount)}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={onPrint}
              className="text-blue-600 hover:text-blue-900 transition-colors font-medium"
            >
              📄 거래증
            </button>
            <button
              onClick={onEdit}
              className="text-indigo-600 hover:text-indigo-900 transition-colors"
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
                  {/* 거래 기본 정보 */}
                  <CardSection title="거래 정보" icon="📄">
                    <InfoItem label="거래번호" value={`#${transaction.id}`} />
                    <InfoItem label="거래일" value={transaction.transaction_date} />
                    <InfoItem 
                      label="거래 구분" 
                      value={getTransactionTypeDisplay(transaction.transaction_type)} 
                    />
                    <InfoItem label="거래처" value={transaction.customer_name} />
                    <InfoItem label="마감일" value={transaction.due_date || '-'} />
                    <InfoItem label="메모" value={transaction.notes || '-'} />
                    {transaction.created_at && (
                      <InfoItem 
                        label="생성일" 
                        value={new Date(transaction.created_at).toLocaleString('ko-KR')} 
                      />
                    )}
                  </CardSection>

                  {/* 거래 상품 목록 */}
                  <CardSection title="거래 상품" icon="📦">
                    {transaction.items && transaction.items.length > 0 ? (
                      <div className="space-y-3">
                        {transaction.items.map((item, index) => (
                          <div key={item.id || index} className="bg-white p-3 rounded border">
                            <div className="space-y-1 text-sm">
                              <div className="font-medium text-gray-900">
                                {item.product_name}
                              </div>
                              <div className="flex justify-between text-gray-600">
                                <span>수량:</span>
                                <span>{item.quantity}{item.unit}</span>
                              </div>
                              <div className="flex justify-between text-gray-600">
                                <span>단가:</span>
                                <span>{formatCurrency(item.unit_price)}</span>
                              </div>
                              <div className="flex justify-between font-medium">
                                <span>소계:</span>
                                <span>{formatCurrency(item.total_price)}</span>
                              </div>
                              {item.traceability_number && (
                                <div className="flex justify-between text-gray-500 text-xs">
                                  <span>이력번호:</span>
                                  <span>{item.traceability_number}</span>
                                </div>
                              )}
                              {item.origin && (
                                <div className="flex justify-between text-gray-500 text-xs">
                                  <span>🌍 원산지:</span>
                                  <span className="font-medium">{item.origin}</span>
                                </div>
                              )}
                              {item.slaughterhouse && (
                                <div className="flex justify-between text-gray-500 text-xs">
                                  <span>🏭 도축장:</span>
                                  <span className="font-medium">{item.slaughterhouse}</span>
                                </div>
                              )}
                              {item.notes && (
                                <div className="text-gray-500 text-xs">
                                  메모: {item.notes}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-500 text-sm text-center py-4">
                        거래 상품이 없습니다
                      </div>
                    )}
                  </CardSection>

                  {/* 금액 정보 */}
                  <CardSection title="금액 정보" icon="💰">
                    <InfoItem 
                      label="상품 금액" 
                      value={formatCurrency(transaction.total_amount - transaction.tax_amount)} 
                    />
                    <InfoItem 
                      label="부가세 (10%)" 
                      value={formatCurrency(transaction.tax_amount)} 
                      className="text-orange-600"
                    />
                    <div className="border-t pt-2 mt-2">
                      <InfoItem 
                        label="총 금액" 
                        value={formatCurrency(transaction.total_amount)} 
                        className="text-lg font-bold text-gray-900"
                      />
                    </div>
                    
                    {/* 상품별 통계 */}
                    {transaction.items && transaction.items.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <InfoItem 
                          label="총 상품 수" 
                          value={`${transaction.items.length}개`} 
                        />
                        <InfoItem 
                          label="총 수량" 
                          value={`${transaction.items.reduce((sum, item) => sum + item.quantity, 0)}${transaction.items[0]?.unit || ''}`} 
                        />
                        <InfoItem 
                          label="평균 단가" 
                          value={formatCurrency(
                            transaction.items.reduce((sum, item) => sum + item.unit_price, 0) / transaction.items.length
                          )} 
                        />
                      </div>
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
