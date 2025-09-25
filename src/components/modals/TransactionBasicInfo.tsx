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
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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
          <div className="mt-2 p-3 bg-blue-50 rounded-md border border-blue-200">
            <div className="flex items-center space-x-2">
              <span className="text-lg">
                {selectedCustomer.type === 'customer' ? '🛒' : '🏭'}
              </span>
              <div>
                <p className="font-medium text-blue-900">{selectedCustomer.name}</p>
                <p className="text-sm text-blue-700">
                  {selectedCustomer.business_number && `사업자: ${selectedCustomer.business_number}`}
                  {selectedCustomer.contact_person && ` • 담당자: ${selectedCustomer.contact_person}`}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

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

      <div className="sm:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          메모
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => onFormChange('notes', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="거래에 대한 메모를 입력하세요..."
        />
      </div>
    </div>
  )
}
