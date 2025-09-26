import { formatCurrency } from '../../lib/utils'

interface TransactionSummaryProps {
  totalAmount: number
  taxAmount: number
  itemsCount: number
  isVatIncluded: boolean
  onVatIncludedChange: (included: boolean) => void
  displayTotalAmount: number
}

export default function TransactionSummary({ 
  totalAmount, 
  taxAmount, 
  itemsCount,
  isVatIncluded,
  onVatIncludedChange,
  displayTotalAmount
}: TransactionSummaryProps) {
  if (itemsCount === 0) {
    return null
  }

  return (
    <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-gray-900">💰 거래 요약</h4>
        
        {/* VAT 토글 */}
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={isVatIncluded}
            onChange={(e) => onVatIncludedChange(e.target.checked)}
            className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <span className="text-xs text-gray-700">
            {isVatIncluded ? '🔹 VAT 포함 금액' : '🔸 VAT 미포함 금액'}
          </span>
        </label>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>상품 수량</span>
          <span>{itemsCount}개 상품</span>
        </div>
        
        <div className="flex justify-between text-sm text-gray-600">
          <span>공급가액</span>
          <span>{formatCurrency(isVatIncluded ? totalAmount - taxAmount : totalAmount)}</span>
        </div>
        
        <div className="flex justify-between text-sm text-gray-600">
          <span>부가세 (10%)</span>
          <span>{formatCurrency(taxAmount)}</span>
        </div>
        
        <hr className="my-2 border-gray-300" />
        
        <div className="flex justify-between text-lg font-semibold text-gray-900">
          <span>총 금액</span>
          <span className="text-blue-600">{formatCurrency(displayTotalAmount)}</span>
        </div>
      </div>

      {/* 간단한 통계 */}
      <div className="mt-3 pt-3 border-t border-gray-300">
        <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
          <div>
            <span className="font-medium">평균 상품가</span>
            <div className="text-gray-900 font-medium">
              {formatCurrency(itemsCount > 0 ? totalAmount / itemsCount : 0)}
            </div>
          </div>
          <div>
            <span className="font-medium">세율</span>
            <div className="text-gray-900 font-medium">10%</div>
          </div>
        </div>
      </div>
    </div>
  )
}
