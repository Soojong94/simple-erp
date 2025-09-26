import type { Customer } from '../../types'

interface TransactionBasicInfoProps {
  formData: {
    customer_id: number
    transaction_type: 'sales' | 'purchase'
    transaction_date: string
    due_date: string
    notes: string
  }
  customers?: Customer[]
  onFormChange: (field: string, value: any) => void
}

export default function TransactionBasicInfo({ formData, customers, onFormChange }: TransactionBasicInfoProps) {
  const selectedCustomer = customers?.find(c => c.id === formData.customer_id)

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
          {customers?.map(customer => (
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
