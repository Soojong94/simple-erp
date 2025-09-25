import { useQuery } from '@tanstack/react-query'
import { transactionAPI } from '../../lib/tauri'
import { formatCurrency } from '../../lib/utils'
import ExpandableRowCard, { CardSection, InfoItem } from './ExpandableRowCard'
import type { Product } from '../../types'

interface ProductExpandableRowProps {
  product: Product
  isExpanded: boolean
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
}

export default function ProductExpandableRow({ 
  product, 
  isExpanded, 
  onToggle, 
  onEdit, 
  onDelete 
}: ProductExpandableRowProps) {
  // 확장된 경우에만 거래 데이터 조회
  const { data: transactions } = useQuery({
    queryKey: ['transactions', product.id],
    queryFn: () => transactionAPI.getAll(),
    enabled: isExpanded && !!product.id
  })

  // 해당 상품이 포함된 거래들 찾기
  const productTransactions = transactions?.filter(transaction => 
    transaction.items?.some(item => item.product_id === product.id)
  ) || []

  // 해당 상품의 거래 아이템들만 추출
  const productItems = transactions?.flatMap(transaction => 
    transaction.items?.filter(item => item.product_id === product.id)
      .map(item => ({ ...item, transaction })) || []
  ) || []

  const recentItems = productItems.slice(0, 5)

  // 통계 계산
  const totalQuantity = productItems.reduce((sum, item) => sum + item.quantity, 0)
  const totalSales = productItems
    .filter(item => item.transaction?.transaction_type === 'sales')
    .reduce((sum, item) => sum + item.total_price, 0)
  
  const totalPurchase = productItems
    .filter(item => item.transaction?.transaction_type === 'purchase')
    .reduce((sum, item) => sum + item.total_price, 0)

  // 가격 통계
  const prices = productItems.map(item => item.unit_price)
  const avgPrice = prices.length > 0 ? prices.reduce((sum, price) => sum + price, 0) / prices.length : 0
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0

  const getCategoryEmoji = (category: string | undefined) => {
    switch (category) {
      case '돼지고기': return '🐷'
      case '소고기': return '🐄' 
      case '닭고기': return '🐔'
      case '오리고기': return '🦆'
      default: return '📦'
    }
  }

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
            {product.name}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {product.code || '-'}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          <span className="flex items-center">
            {getCategoryEmoji(product.category)} {product.category || '-'}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {product.unit}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {product.unit_price ? formatCurrency(product.unit_price) : '-'}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {product.description || '-'}
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            product.is_active 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {product.is_active ? '✅ 활성' : '❌ 비활성'}
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
          <td colSpan={8} className="px-0 py-0">
            <div className="transition-all duration-300 ease-in-out">
              <ExpandableRowCard>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* 상품 정보 */}
                  <CardSection title="상품 정보" icon="📦">
                    <InfoItem label="상품명" value={product.name} />
                    <InfoItem label="상품코드" value={product.code || '-'} />
                    <InfoItem 
                      label="카테고리" 
                      value={`${getCategoryEmoji(product.category)} ${product.category || '-'}`} 
                    />
                    <InfoItem label="단위" value={product.unit} />
                    <InfoItem 
                      label="참고 단가" 
                      value={product.unit_price ? formatCurrency(product.unit_price) : '-'} 
                    />
                    <InfoItem label="설명" value={product.description || '-'} />
                    <InfoItem 
                      label="상태" 
                      value={product.is_active ? '✅ 활성' : '❌ 비활성'} 
                    />
                  </CardSection>

                  {/* 최근 거래 내역 */}
                  <CardSection title="최근 거래" icon="📊">
                    {recentItems.length > 0 ? (
                      <div className="space-y-2">
                        {recentItems.map((item, index) => (
                          <div key={index} className="bg-white p-3 rounded border">
                            <div className="flex justify-between items-start text-sm">
                              <div>
                                <div className="font-medium">
                                  {item.transaction?.customer_name || '알 수 없음'}
                                </div>
                                <div className="text-gray-500 text-xs">
                                  {item.transaction?.transaction_date} • 
                                  {item.transaction?.transaction_type === 'sales' ? ' 💰 매출' : ' 📦 매입'}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-medium">
                                  {item.quantity}{item.unit} × {formatCurrency(item.unit_price)}
                                </div>
                                <div className="text-gray-600 text-xs">
                                  = {formatCurrency(item.total_price)}
                                </div>
                                {item.traceability_number && (
                                  <div className="text-gray-400 text-xs">
                                    이력: {item.traceability_number}
                                  </div>
                                )}
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

                  {/* 판매 통계 */}
                  <CardSection title="판매 통계" icon="📈">
                    <InfoItem 
                      label="총 거래량" 
                      value={`${totalQuantity}${product.unit}`} 
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
                      label="순 수익" 
                      value={formatCurrency(totalSales - totalPurchase)} 
                      className={totalSales - totalPurchase >= 0 ? "text-green-600" : "text-red-600"} 
                    />
                    {prices.length > 0 && (
                      <>
                        <InfoItem 
                          label="평균 단가" 
                          value={formatCurrency(avgPrice)} 
                        />
                        <InfoItem 
                          label="최고 단가" 
                          value={formatCurrency(maxPrice)} 
                          className="text-red-600" 
                        />
                        <InfoItem 
                          label="최저 단가" 
                          value={formatCurrency(minPrice)} 
                          className="text-blue-600" 
                        />
                      </>
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
