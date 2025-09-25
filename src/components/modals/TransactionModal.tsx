import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { transactionAPI, customerAPI, productAPI } from '../../lib/tauri'
import TransactionBasicInfo from './TransactionBasicInfo'
import TransactionItemsList from './TransactionItemsList'
import TransactionSummary from './TransactionSummary'
import type { TransactionWithItems, TransactionItem } from '../../types'

interface TransactionModalProps {
  isOpen: boolean
  onClose: () => void
  transaction?: TransactionWithItems
  preSelectedCustomerId?: number
}

export default function TransactionModal({ 
  isOpen, 
  onClose, 
  transaction, 
  preSelectedCustomerId 
}: TransactionModalProps) {
  const queryClient = useQueryClient()
  const isEditing = !!transaction

  // 폼 데이터 상태
  const [formData, setFormData] = useState({
    customer_id: transaction?.customer_id || 0,
    transaction_type: transaction?.transaction_type || 'sales' as 'sales' | 'purchase',
    transaction_date: transaction?.transaction_date || new Date().toISOString().split('T')[0],
    due_date: transaction?.due_date || '',
    notes: transaction?.notes || ''
  })

  const [items, setItems] = useState<TransactionItem[]>(transaction?.items || [])

  // preSelectedCustomerId 처리
  useEffect(() => {
    if (preSelectedCustomerId && preSelectedCustomerId > 0 && !isEditing) {
      setFormData(prev => ({
        ...prev,
        customer_id: preSelectedCustomerId
      }))
    }
  }, [preSelectedCustomerId, isEditing])

  // 데이터 조회
  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customerAPI.getAll()
  })

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: () => productAPI.getAll()
  })

  // Mutations
  const createMutation = useMutation({
    mutationFn: transactionAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      handleClose()
      alert('거래가 추가되었습니다.')
    },
    onError: () => {
      alert('거래 추가 중 오류가 발생했습니다.')
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => transactionAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      handleClose()
      alert('거래가 수정되었습니다.')
    },
    onError: () => {
      alert('거래 수정 중 오류가 발생했습니다.')
    }
  })

  // 이벤트 핸들러들
  const handleClose = () => {
    resetForm()
    onClose()
  }

  const resetForm = () => {
    setFormData({
      customer_id: 0,
      transaction_type: 'sales',
      transaction_date: new Date().toISOString().split('T')[0],
      due_date: '',
      notes: ''
    })
    setItems([])
  }

  const handleFormChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleAddItem = () => {
    const newItem: TransactionItem = {
      id: Date.now(),
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

  const handleUpdateItem = (index: number, field: keyof TransactionItem, value: any) => {
    const updatedItems = [...items]
    updatedItems[index] = { ...updatedItems[index], [field]: value }
    
    // 상품 선택 시 자동 정보 로딩
    if (field === 'product_id' && value > 0) {
      const product = products?.find(p => p.id === value)
      if (product) {
        updatedItems[index].product_name = product.name
        updatedItems[index].unit = product.unit
        if (product.unit_price) {
          updatedItems[index].unit_price = product.unit_price
        }
      }
    }
    
    // 수량/단가 변경 시 총액 재계산
    if (field === 'quantity' || field === 'unit_price') {
      updatedItems[index].total_price = updatedItems[index].quantity * updatedItems[index].unit_price
    }
    
    setItems(updatedItems)
  }

  const handleRemoveItem = (index: number) => {
    const updatedItems = items.filter((_, i) => i !== index)
    setItems(updatedItems)
  }

  // 계산된 값들
  const totalAmount = items.reduce((sum, item) => sum + item.total_price, 0)
  const taxAmount = Math.round(totalAmount * 0.1)
  const isFormValid = formData.customer_id > 0 && items.length > 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // 유효성 검사
    if (!isFormValid) {
      alert('거래처와 상품을 모두 입력해주세요.')
      return
    }

    // 상품별 유효성 검사
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (!item.product_id || item.quantity <= 0 || item.unit_price <= 0) {
        alert(`${i + 1}번째 상품의 정보를 완성해주세요.`)
        return
      }
      if (!item.traceability_number.trim()) {
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

  if (!isOpen) return null

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 mx-auto max-w-4xl bg-white rounded-lg shadow-xl mb-8">
        
        {/* 헤더 */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-white rounded-t-lg">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {isEditing ? '거래 수정' : '새 거래 추가'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {isEditing ? '거래 정보를 수정합니다' : '새로운 거래를 등록합니다'}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none"
            disabled={isSubmitting}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* 거래 기본 정보 */}
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">기본 정보</h3>
            <TransactionBasicInfo
              formData={formData}
              customers={customers}
              onFormChange={handleFormChange}
            />
          </div>

          {/* 거래 상품 섹션 */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">거래 상품</h3>
              <button
                type="button"
                onClick={handleAddItem}
                disabled={formData.customer_id === 0 || isSubmitting}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                + 상품 추가
              </button>
            </div>

            <TransactionItemsList
              items={items}
              products={products}
              customerId={formData.customer_id}
              onAddItem={handleAddItem}
              onUpdateItem={handleUpdateItem}
              onRemoveItem={handleRemoveItem}
            />
          </div>

          {/* 거래 요약 및 액션 버튼 */}
          <div className="p-6 bg-gray-50 rounded-b-lg">
            {items.length > 0 && (
              <div className="mb-6">
                <TransactionSummary
                  totalAmount={totalAmount}
                  taxAmount={taxAmount}
                  itemsCount={items.length}
                />
              </div>
            )}

            {/* 액션 버튼 */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                취소
              </button>
              
              <button
                type="submit"
                disabled={!isFormValid || isSubmitting}
                className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></div>
                    {isEditing ? '수정 중...' : '추가 중...'}
                  </>
                ) : (
                  <>
                    {isEditing ? '✏️ 거래 수정' : '✅ 거래 추가'}
                  </>
                )}
              </button>
            </div>

            {/* 도움말 */}
            {!isFormValid && (
              <div className="mt-3 text-sm text-gray-500 text-center">
                💡 거래처를 선택하고 상품을 추가한 후 저장할 수 있습니다
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
