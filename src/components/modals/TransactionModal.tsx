import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { transactionAPI, customerAPI, productAPI, customerProductPriceAPI } from '../../lib/tauri'
import { formatCurrency } from '../../lib/utils'
import type { TransactionWithItems, Customer, Product, TransactionItem } from '../../types'

interface TransactionModalProps {
  isOpen: boolean
  onClose: () => void
  transaction?: TransactionWithItems // 수정 시 기존 데이터
}

export default function TransactionModal({ isOpen, onClose, transaction }: TransactionModalProps) {
  const queryClient = useQueryClient()
  const isEditing = !!transaction

  const [formData, setFormData] = useState({
    customer_id: transaction?.customer_id || 0,
    transaction_type: transaction?.transaction_type || 'sales' as 'sales' | 'purchase',
    transaction_date: transaction?.transaction_date || new Date().toISOString().split('T')[0],
    due_date: transaction?.due_date || '',
    notes: transaction?.notes || ''
  })

  const [items, setItems] = useState<TransactionItem[]>(transaction?.items || [])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  // 거래처 목록 조회
  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customerAPI.getAll()
  })

  // 상품 목록 조회
  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: () => productAPI.getAll()
  })

  // 선택된 거래처의 상품별 가격 조회
  const { data: customerPrices } = useQuery({
    queryKey: ['customerPrices', formData.customer_id],
    queryFn: () => customerProductPriceAPI.getByCustomer(formData.customer_id),
    enabled: formData.customer_id > 0
  })

  const createMutation = useMutation({
    mutationFn: transactionAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      onClose()
      resetForm()
      alert('거래가 추가되었습니다.')
    },
    onError: (error) => {
      console.error('Transaction creation error:', error)
      alert('거래 추가 중 오류가 발생했습니다.')
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => transactionAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      onClose()
      resetForm()
      alert('거래가 수정되었습니다.')
    },
    onError: (error) => {
      console.error('Transaction update error:', error)
      alert('거래 수정 중 오류가 발생했습니다.')
    }
  })

  const resetForm = () => {
    setFormData({
      customer_id: 0,
      transaction_type: 'sales',
      transaction_date: new Date().toISOString().split('T')[0],
      due_date: '',
      notes: ''
    })
    setItems([])
    setSelectedCustomer(null)
  }

  // 거래처 변경 시 선택된 거래처 정보 업데이트
  useEffect(() => {
    if (customers && formData.customer_id > 0) {
      const customer = customers.find(c => c.id === formData.customer_id)
      setSelectedCustomer(customer || null)
    } else {
      setSelectedCustomer(null)
    }
  }, [customers, formData.customer_id])

  // 새 거래 아이템 추가
  const addItem = () => {
    const newItem: TransactionItem = {
      id: Date.now(), // 임시 ID
      transaction_id: 0,
      product_id: 0,
      product_name: '',
      quantity: 1,
      unit: 'kg',
      unit_price: 0,
      total_price: 0,
      traceability_number: '',
      notes: ''
    }
    setItems([...items, newItem])
  }

  // 거래 아이템 업데이트
  const updateItem = (index: number, field: keyof TransactionItem, value: any) => {
    const updatedItems = [...items]
    updatedItems[index] = { ...updatedItems[index], [field]: value }
    
    // 상품이 변경된 경우 가격 자동 로딩
    if (field === 'product_id' && value > 0) {
      const product = products?.find(p => p.id === value)
      if (product) {
        updatedItems[index].product_name = product.name
        updatedItems[index].unit = product.unit
        
        // 거래처별 가격이 있으면 적용, 없으면 상품의 참고가격 적용
        const customerPrice = customerPrices?.find(cp => cp.product_id === value)
        if (customerPrice) {
          updatedItems[index].unit_price = customerPrice.current_price_per_kg
        } else if (product.unit_price) {
          updatedItems[index].unit_price = product.unit_price
        }
      }
    }
    
    // 수량이나 단가가 변경된 경우 총액 재계산
    if (field === 'quantity' || field === 'unit_price') {
      updatedItems[index].total_price = updatedItems[index].quantity * updatedItems[index].unit_price
    }
    
    setItems(updatedItems)
  }

  // 거래 아이템 삭제
  const removeItem = (index: number) => {
    const updatedItems = items.filter((_, i) => i !== index)
    setItems(updatedItems)
  }

  // 총액 계산
  const totalAmount = items.reduce((sum, item) => sum + item.total_price, 0)
  const taxAmount = Math.round(totalAmount * 0.1) // 부가세 10%

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.customer_id === 0) {
      alert('거래처를 선택해주세요.')
      return
    }

    if (items.length === 0) {
      alert('거래 상품을 추가해주세요.')
      return
    }

    // 모든 아이템이 올바르게 입력되었는지 확인
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (!item.product_id || item.quantity <= 0 || item.unit_price <= 0) {
        alert(`${i + 1}번째 상품의 정보를 완성해주세요.`)
        return
      }
      if (!item.traceability_number) {
        alert(`${i + 1}번째 상품의 이력번호를 입력해주세요.`)
        return
      }
    }

    const submitData = {
      ...formData,
      total_amount: totalAmount,
      tax_amount: taxAmount,
      items: items
    }

    if (isEditing && transaction) {
      updateMutation.mutate({ id: transaction.id!, data: submitData })
    } else {
      createMutation.mutate(submitData)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'customer_id' ? Number(value) : value
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-6xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {isEditing ? '거래 수정' : '거래 추가'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 거래 기본 정보 */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-md font-medium text-gray-900 mb-3">거래 정보</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
              {/* 거래처 */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  거래처 *
                </label>
                <select
                  name="customer_id"
                  value={formData.customer_id}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value={0}>거래처 선택</option>
                  {customers?.filter(c => c.type === (formData.transaction_type === 'sales' ? 'customer' : 'supplier')).map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 거래 유형 */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  거래 유형 *
                </label>
                <select
                  name="transaction_type"
                  value={formData.transaction_type}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="sales">매출 (판매)</option>
                  <option value="purchase">매입 (구매)</option>
                </select>
              </div>

              {/* 거래일 */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  거래일 *
                </label>
                <input
                  type="date"
                  name="transaction_date"
                  value={formData.transaction_date}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              {/* 결제예정일 */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  결제예정일
                </label>
                <input
                  type="date"
                  name="due_date"
                  value={formData.due_date}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            {/* 선택된 거래처 정보 표시 */}
            {selectedCustomer && (
              <div className="mt-3 p-3 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-800">
                  <span className="font-medium">{selectedCustomer.name}</span>
                  {selectedCustomer.contact_person && ` (${selectedCustomer.contact_person})`}
                  {selectedCustomer.phone && ` · ${selectedCustomer.phone}`}
                </p>
              </div>
            )}
          </div>

          {/* 거래 상품 목록 */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-md font-medium text-gray-900">거래 상품</h4>
              <button
                type="button"
                onClick={addItem}
                disabled={formData.customer_id === 0}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                상품 추가
              </button>
            </div>

            {formData.customer_id === 0 && (
              <p className="text-sm text-gray-500 mb-3">거래처를 먼저 선택해주세요.</p>
            )}

            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={item.id} className="border border-gray-200 rounded-md p-3 bg-white">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-12 items-end">
                    {/* 상품 선택 */}
                    <div className="sm:col-span-3">
                      <label className="block text-xs font-medium text-gray-700">상품</label>
                      <select
                        value={item.product_id || 0}
                        onChange={(e) => updateItem(index, 'product_id', Number(e.target.value))}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value={0}>상품 선택</option>
                        {products?.filter(p => p.is_active).map(product => (
                          <option key={product.id} value={product.id}>
                            {product.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 수량 */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-gray-700">수량({item.unit})</label>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    {/* 단가 */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-gray-700">단가(원/{item.unit})</label>
                      <input
                        type="number"
                        min="0"
                        value={item.unit_price}
                        onChange={(e) => updateItem(index, 'unit_price', Number(e.target.value))}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    {/* 이력번호 */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-gray-700">이력번호 *</label>
                      <input
                        type="text"
                        value={item.traceability_number}
                        onChange={(e) => updateItem(index, 'traceability_number', e.target.value)}
                        placeholder="240924-001-123"
                        className="mt-1 block w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    {/* 총액 */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-gray-700">총액</label>
                      <div className="mt-1 px-2 py-1 bg-gray-100 rounded-md text-sm font-medium text-gray-900">
                        {formatCurrency(item.total_price)}
                      </div>
                    </div>

                    {/* 삭제 버튼 */}
                    <div className="sm:col-span-1">
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="w-full px-2 py-1 text-red-600 hover:text-red-800 text-sm"
                      >
                        삭제
                      </button>
                    </div>
                  </div>

                  {/* 메모 */}
                  <div className="mt-2">
                    <input
                      type="text"
                      value={item.notes || ''}
                      onChange={(e) => updateItem(index, 'notes', e.target.value)}
                      placeholder="메모 (예: 특급, 1등급 등)"
                      className="block w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              ))}
            </div>

            {items.length === 0 && formData.customer_id > 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                상품 추가 버튼을 클릭해서 거래 상품을 추가해주세요.
              </p>
            )}
          </div>

          {/* 거래 요약 */}
          {items.length > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="text-md font-medium text-gray-900 mb-3">거래 요약</h4>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 text-sm">
                <div>
                  <span className="text-gray-600">공급가액:</span>
                  <span className="ml-2 font-medium">{formatCurrency(totalAmount)}</span>
                </div>
                <div>
                  <span className="text-gray-600">부가세:</span>
                  <span className="ml-2 font-medium">{formatCurrency(taxAmount)}</span>
                </div>
                <div className="text-lg">
                  <span className="text-gray-600">총 금액:</span>
                  <span className="ml-2 font-bold text-blue-600">{formatCurrency(totalAmount + taxAmount)}</span>
                </div>
              </div>
            </div>
          )}

          {/* 메모 */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              거래 메모
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={2}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="특이사항, 배송지 등"
            />
          </div>

          {/* 버튼 영역 */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {createMutation.isPending || updateMutation.isPending ? 
                (isEditing ? '수정 중...' : '추가 중...') : 
                (isEditing ? '수정' : '추가')
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
