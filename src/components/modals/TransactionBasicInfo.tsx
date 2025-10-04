import type { Customer, TransactionWithItems } from '../../types'

interface TransactionBasicInfoProps {
  formData: {
    customer_id: number
    transaction_type: 'sales' | 'purchase' | 'payment_in' | 'payment_out'
    transaction_date: string
    due_date: string
    notes: string
  }
  customers?: Customer[]
  transactions?: TransactionWithItems[]  // 🆕 거래 내역
  onFormChange: (field: string, value: any) => void
  paymentAmount?: number  // 🆕 수금 금액
  onPaymentAmountChange?: (amount: number) => void  // 🆕 수금 금액 변경 핸들러
}

export default function TransactionBasicInfo({
  formData,
  customers,
  transactions,
  onFormChange,
  paymentAmount,
  onPaymentAmountChange
}: TransactionBasicInfoProps) {
  const selectedCustomer = customers?.find(c => c.id === formData.customer_id)

  // 🆕 실시간 미지급금 계산
  const calculateOutstandingPayable = () => {
    if (!selectedCustomer || !transactions) return 0

    const customerTransactions = transactions.filter(t => t.customer_id === selectedCustomer.id)

    let 미지급금 = 0
    customerTransactions.forEach(t => {
      if (t.transaction_type === 'purchase') {
        미지급금 += t.total_amount
      } else if (t.transaction_type === 'payment_out') {
        미지급금 -= t.total_amount
      }
    })

    return Math.max(0, 미지급금)
  }

  const outstandingPayable = calculateOutstandingPayable()

  return (
    <div className="space-y-4">
      {/* 거래처 선택 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          거래처 *
        </label>
        <select
          value={formData.customer_id}
          onChange={(e) => onFormChange('customer_id', Number(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value={0}>거래처를 선택하세요</option>
          {customers?.filter(c => c.is_active).map(customer => (
            <option key={customer.id} value={customer.id}>
              {customer.type === 'customer' ? '🛒' : '🏭'} {customer.name}
            </option>
          ))}
        </select>
        {selectedCustomer && (
          <p className="mt-1 text-sm text-gray-600">
            {selectedCustomer.type === 'customer' ? '🛒' : '🏭'} {selectedCustomer.name}
            {selectedCustomer.business_number && ` | 사업자: ${selectedCustomer.business_number}`}
          </p>
        )}
      </div>

      {/* 거래 구분 / 거래일 / 만료일 (한 줄 배치) */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            거래 구분 *
          </label>
          <select
            value={formData.transaction_type}
            onChange={(e) => onFormChange('transaction_type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="sales">💰 매출</option>
            <option value="purchase">📦 매입</option>
            <option value="payment_in">💵 수금 처리</option>
            <option value="payment_out">💸 지급 처리</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            거래일 *
          </label>
          <input
            type="date"
            value={formData.transaction_date}
            onChange={(e) => onFormChange('transaction_date', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            만료일
          </label>
          <input
            type="date"
            value={formData.due_date}
            onChange={(e) => onFormChange('due_date', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* 🆕 수금 금액 (수금 처리 타입일 때만 표시) */}
      {formData.transaction_type === 'payment_in' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <label className="block text-sm font-medium text-green-800 mb-2">
            💵 수금 금액 *
          </label>
          <input
            type="number"
            value={paymentAmount}
            onChange={(e) => onPaymentAmountChange?.(Number(e.target.value))}
            min="0"
            step="1000"
            className="w-full px-3 py-2 border border-green-300 rounded-md text-right font-mono text-lg focus:outline-none focus:ring-green-500 focus:border-green-500"
            placeholder="입금받은 금액을 입력하세요"
          />
          {selectedCustomer && (
            <p className="mt-2 text-sm text-green-700">
              현재 미수금: {(selectedCustomer.outstanding_balance || 0).toLocaleString()}원
            </p>
          )}
        </div>
      )}

      {/* 🆕 지급 금액 (지급 처리 타입일 때만 표시) */}
      {formData.transaction_type === 'payment_out' && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <label className="block text-sm font-medium text-purple-800 mb-2">
            💸 지급 금액 *
          </label>
          <input
            type="number"
            value={paymentAmount}
            onChange={(e) => onPaymentAmountChange?.(Number(e.target.value))}
            min="0"
            step="1000"
            className="w-full px-3 py-2 border border-purple-300 rounded-md text-right font-mono text-lg focus:outline-none focus:ring-purple-500 focus:border-purple-500"
            placeholder="지급한 금액을 입력하세요"
          />
          {selectedCustomer && (
            <p className="mt-2 text-sm text-purple-700">
              현재 미지급금: {outstandingPayable.toLocaleString()}원
            </p>
          )}
        </div>
      )}

      {/* 메모 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          메모
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => onFormChange('notes', e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="거래에 대한 메모를 입력하세요..."
        />
      </div>
    </div>
  )
}
