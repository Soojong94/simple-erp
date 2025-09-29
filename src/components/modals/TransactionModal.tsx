import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { transactionAPI, customerAPI, productAPI, inventoryAPI } from '../../lib/tauri'
import { getCustomerProductExclusions, excludeCustomerProduct, includeCustomerProduct } from '../../lib/utils'
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
    customer_id: 0,
    transaction_type: 'sales' as 'sales' | 'purchase' | 'payment',
    transaction_date: new Date().toISOString().split('T')[0],
    due_date: '',
    notes: ''
  })

  // 🆕 수금 금액 상태 (payment 타입일 때만 사용)
  const [paymentAmount, setPaymentAmount] = useState<number>(0)

  // formData.customer_id 변경 감지 (디버그용)
  useEffect(() => {
    console.log('📊 formData.customer_id 변경:', formData.customer_id)
  }, [formData.customer_id])

  const [items, setItems] = useState<TransactionItem[]>([])

  // VAT 포함/미포함 상태 (localStorage에서 불러오기)
  const [isVatIncluded, setIsVatIncluded] = useState(() => {
    const saved = localStorage.getItem('simple-erp-vat-included')
    return saved === 'true'
  })

  // VAT 상태 변경 시 localStorage에 저장
  useEffect(() => {
    localStorage.setItem('simple-erp-vat-included', String(isVatIncluded))
  }, [isVatIncluded])

  // transaction prop 변경 시 formData 업데이트
  useEffect(() => {
    if (transaction) {
      setFormData({
        customer_id: transaction.customer_id || 0,
        transaction_type: transaction.transaction_type || 'sales',
        transaction_date: transaction.transaction_date || new Date().toISOString().split('T')[0],
        due_date: transaction.due_date || '',
        notes: transaction.notes || ''
      })
      setItems(transaction.items || [])
    } else {
      resetForm()
    }
  }, [transaction])

  // preSelectedCustomerId 처리 (수정 모드가 아닐 때만)
  useEffect(() => {
    console.log('🎯 preSelectedCustomerId useEffect 실행:', {
      preSelectedCustomerId,
      isEditing,
      transaction: !!transaction
    })

    if (preSelectedCustomerId && preSelectedCustomerId > 0 && !isEditing) {
      console.log('✅ 거래처 자동 선택:', preSelectedCustomerId)
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

  // 🆕 최근 수금 내역 조회 (payment 타입 거래 중 미표시건)
  const { data: recentPayments } = useQuery({
    queryKey: ['recent-payments', formData.customer_id],
    queryFn: async () => {
      if (!formData.customer_id) return []
      const allTransactions = await transactionAPI.getAll()
      return allTransactions.filter(t =>
        t.transaction_type === 'payment' &&
        t.customer_id === formData.customer_id &&
        !t.is_displayed_in_invoice  // 아직 거래증에 표시 안 된 것만
      ).sort((a, b) =>
        new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
      )
    },
    enabled: formData.customer_id > 0 && formData.transaction_type === 'sales'
  })

  // 🆕 선택된 수금 거래 ID
  const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(null)

  // 거래 데이터 조회 (상품 정렬용)
  const { data: allTransactions } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => transactionAPI.getAll()
  })

  // 거래처별 상품 사용 통계 (최근 수량 + 단가 + 이력번호 포함) 🎉
  const productUsageStats = useMemo(() => {
    if (!formData.customer_id || !allTransactions) return new Map()

    const stats = new Map<number, { count: number, lastUsed: string, lastQuantity: number, lastUnitPrice: number, lastTraceability: string }>()

    // 해당 거래처의 거래만 필터링
    const customerTransactions = allTransactions.filter(
      t => t.customer_id === formData.customer_id
    )

    customerTransactions.forEach(transaction => {
      transaction.items?.forEach(item => {
        const current = stats.get(item.product_id) || { count: 0, lastUsed: '', lastQuantity: 1, lastUnitPrice: 0, lastTraceability: '' }

        // 최근 거래일이면 수량 + 단가 + 이력번호도 업데이트
        const isMoreRecent = transaction.transaction_date > current.lastUsed

        stats.set(item.product_id, {
          count: current.count + 1,
          lastUsed: isMoreRecent ? transaction.transaction_date : current.lastUsed,
          lastQuantity: isMoreRecent ? item.quantity : current.lastQuantity,
          lastUnitPrice: isMoreRecent ? item.unit_price : current.lastUnitPrice,  // 🎯 단가 추가!
          lastTraceability: isMoreRecent ? (item.traceability_number || '') : current.lastTraceability
        })
      })
    })

    return stats
  }, [formData.customer_id, allTransactions])

  // 정렬된 상품 목록
  const sortedProducts = useMemo(() => {
    if (!products) return []

    return [...products]
      .filter(p => p.is_active)
      .sort((a, b) => {
        // 거래처가 선택되었으면 사용 빈도순 정렬
        if (formData.customer_id && productUsageStats.size > 0) {
          const statsA = productUsageStats.get(a.id!) || { count: 0, lastUsed: '' }
          const statsB = productUsageStats.get(b.id!) || { count: 0, lastUsed: '' }

          // 1순위: 거래 빈도
          if (statsA.count !== statsB.count) {
            return statsB.count - statsA.count
          }

          // 2순위: 최근 거래일
          if (statsA.lastUsed && statsB.lastUsed) {
            return statsB.lastUsed.localeCompare(statsA.lastUsed)
          }
        }

        // 거래처 미선택 시 이름순
        return a.name.localeCompare(b.name)
      })
  }, [products, formData.customer_id, productUsageStats])

  // 🎉 자주 거래한 상품 목록 (거래 횟수 1회 이상 + 제외되지 않은 것만)
  const frequentProducts = useMemo(() => {
    if (!formData.customer_id || productUsageStats.size === 0) {
      return []
    }

    // 제외 목록 불러오기
    const exclusions = getCustomerProductExclusions(formData.customer_id)

    return sortedProducts.filter(p =>
      productUsageStats.has(p.id!) &&  // 거래 이력 있음
      !exclusions.includes(p.id!)       // 제외되지 않음
    )
  }, [sortedProducts, formData.customer_id, productUsageStats])

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      // 1. 거래 생성
      const newTransaction = await transactionAPI.create(data)

      // 2. 재고 처리
      if (newTransaction) {
        // 매입(구매) 거래
        if (data.transaction_type === 'purchase') {
          // 상품 별 입고 처리
          for (const item of data.items) {
            // 로트 번호 생성
            const today = new Date().toISOString().split('T')[0]
            const randomCode = Math.random().toString(36).substr(2, 4).toUpperCase()
            const lotNumber = `LOT-${today.replace(/-/g, '')}-${item.product_id}-${randomCode}`

            // 유통기한 계산 (카테고리별 기본값 적용)
            const product = products?.find(p => p.id === item.product_id)
            let expiryDays = 7 // 기본값

            if (product?.category === '돼지고기') expiryDays = 7
            else if (product?.category === '소고기') expiryDays = 10
            else if (product?.category === '닭고기' || product?.category === '오리고기') expiryDays = 5

            const expiryDate = new Date(data.transaction_date)
            expiryDate.setDate(expiryDate.getDate() + expiryDays)

            // 로트 생성
            await inventoryAPI.createLot({
              product_id: item.product_id,
              lot_number: lotNumber,
              initial_quantity: item.quantity,
              remaining_quantity: item.quantity,
              expiry_date: expiryDate.toISOString().split('T')[0],
              traceability_number: item.traceability_number,
              supplier_id: data.customer_id,
              supplier_name: customers?.find(c => c.id === data.customer_id)?.name,
              status: 'active'
            })

            // 입고 이동 추가
            await inventoryAPI.createMovement({
              product_id: item.product_id,
              movement_type: 'in',
              quantity: item.quantity,
              unit_price: item.unit_price,
              lot_number: lotNumber,
              expiry_date: expiryDate.toISOString().split('T')[0],
              traceability_number: item.traceability_number,
              transaction_id: newTransaction.id,
              reference_type: 'purchase',
              reference_id: newTransaction.id,
              notes: `매입 거래 ${newTransaction.id}`,
              product_name: item.product_name
            })
          }
        }

        // 매출(판매) 거래
        else if (data.transaction_type === 'sales') {
          // 상품 별 출고 처리 (FIFO 원칙)
          for (const item of data.items) {
            // 해당 상품의 활성 로트 조회
            const activeLots = await inventoryAPI.getActiveLots(item.product_id)

            // 출고할 총량
            let remainingQty = item.quantity

            for (const lot of activeLots) {
              if (remainingQty <= 0) break

              // 출고할 수량 (현재 로트의 남은 수량과 출고할 남은 수량 중 작은 값)
              const outQty = Math.min(remainingQty, lot.remaining_quantity)

              // 로트 업데이트
              await inventoryAPI.updateLot(lot.id!, {
                remaining_quantity: lot.remaining_quantity - outQty,
                status: lot.remaining_quantity - outQty <= 0 ? 'finished' : 'active'
              })

              // 출고 이동 추가
              await inventoryAPI.createMovement({
                product_id: item.product_id,
                movement_type: 'out',
                quantity: outQty,
                unit_price: item.unit_price,
                lot_number: lot.lot_number,
                expiry_date: lot.expiry_date,
                traceability_number: item.traceability_number || lot.traceability_number,
                transaction_id: newTransaction.id,
                reference_type: 'sales',
                reference_id: newTransaction.id,
                notes: `매출 거래 ${newTransaction.id}`,
                product_name: item.product_name
              })

              remainingQty -= outQty
            }

            if (remainingQty > 0) {
              console.warn(`경고: 재고가 부족합니다. 부족량: ${remainingQty}kg, 상품: ${item.product_name}`)
            }
          }
        }

        // 재고 통계 업데이트
        await inventoryAPI.getStats()
      }

      return newTransaction
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['customers'] })  // 🎯 추가!
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] })
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] })
      queryClient.invalidateQueries({ queryKey: ['stock-lots'] })
      handleClose()
      alert('거래가 추가되었습니다.')
    },
    onError: (error) => {
      console.error('거래 추가 오류:', error)
      alert('거래 추가 중 오류가 발생했습니다.')
    }
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      // 1. 거래 수정 (현재는 재고에 영향 없음 - 향후 구현)
      return await transactionAPI.update(id, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['customers'] })  // 🎯 추가!
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] })
      handleClose()
      alert('거래가 수정되었습니다.')
    },
    onError: (error) => {
      console.error('거래 수정 오류:', error)
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

        // 해당 거래처와 해당 상품의 최근 거래 정보 가져오기
        const stats = productUsageStats.get(value)

        // 🎯 1순위: 최근 거래 단가 (기존에 거래했던 금액)
        if (stats && stats.lastUnitPrice > 0) {
          console.log(`💰 최근 거래 단가 자동 로딩: ${product.name} = ${stats.lastUnitPrice}원`)
          updatedItems[index].unit_price = stats.lastUnitPrice
        }
        // 2순위: 상품 기본 가격
        else if (product.unit_price) {
          updatedItems[index].unit_price = product.unit_price
        }

        // 🎯 최근 거래 수량 자동 로딩
        if (stats && stats.lastQuantity > 0) {
          console.log(`📦 최근 거래 수량 자동 로딩: ${product.name} = ${stats.lastQuantity}${product.unit}`)
          updatedItems[index].quantity = stats.lastQuantity
        }

        // 🎯 최근 이력번호 자동 입력
        if (stats && stats.lastTraceability) {
          console.log(`🔢 최근 이력번호 자동 로딩: ${product.name} = ${stats.lastTraceability}`)
          updatedItems[index].traceability_number = stats.lastTraceability
        }

        // 총액 자동 계산
        updatedItems[index].total_price = updatedItems[index].quantity * updatedItems[index].unit_price
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

  // 🎯 상품 제외 핸들러
  const handleExcludeProduct = (productId: number) => {
    excludeCustomerProduct(formData.customer_id, productId)
    // frequentProducts 재계산을 위해 강제 리렌더링
    setItems([...items])
  }

  // 계산된 값들 (VAT 포함/미포함 고려)
  // payment 타입일 때는 수금 금액 사용
  const totalAmount = formData.transaction_type === 'payment'
    ? paymentAmount
    : items.reduce((sum, item) => sum + item.total_price, 0)

  // VAT 미포함 시: 공급가액 = totalAmount, 부가세 = totalAmount * 0.1
  // VAT 포함 시: 공급가액 = totalAmount / 1.1, 부가세 = totalAmount / 11
  const taxAmount = Math.round(isVatIncluded ? totalAmount / 11 : totalAmount * 0.1)
  const displayTotalAmount = isVatIncluded ? totalAmount : totalAmount + taxAmount

  // payment 타입일 때는 상품 필요 없음
  const isFormValid = formData.customer_id > 0 && (
    formData.transaction_type === 'payment'
      ? paymentAmount > 0
      : items.length > 0
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // 유효성 검사
    if (!isFormValid) {
      if (formData.transaction_type === 'payment') {
        alert('거래처와 수금 금액을 입력해주세요.')
      } else {
        alert('거래처와 상품을 모두 입력해주세요.')
      }
      return
    }

    // 상품별 유효성 검사 (payment 타입이 아닐 때만)
    if (formData.transaction_type !== 'payment') {
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
    }

    // 🎯 거래한 상품들을 제외 목록에서 제거 (다시 거래하면 복원)
    items.forEach(item => {
      if (item.product_id && formData.customer_id) {
        includeCustomerProduct(formData.customer_id, item.product_id)
      }
    })

    const submitData = {
      ...formData,
      total_amount: displayTotalAmount,  // VAT 포함/미포함에 따른 최종 금액
      tax_amount: taxAmount,
      items: items,
      reference_payment_id: selectedPaymentId  // 🆕 선택한 수금 거래 참조
    }

    // 데이터 확인용 로그
    console.log('=== 거래 데이터 확인 ===')
    console.log('VAT 포함 여부:', isVatIncluded)
    console.log('상품 금액:', totalAmount)
    console.log('부가세:', taxAmount)
    console.log('최종 총액:', displayTotalAmount)
    console.log('======================')

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
              paymentAmount={paymentAmount}
              onPaymentAmountChange={setPaymentAmount}
            />
          </div>

          {/* 거래 상품 섹션 - payment 타입일 때는 숨김 */}
          {formData.transaction_type !== 'payment' && (
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
                products={sortedProducts}
                customerId={formData.customer_id}
                frequentProducts={frequentProducts}  // 🎉 추가
                allTransactions={allTransactions}     // 🎉 추가
                onAddItem={handleAddItem}
                onUpdateItem={handleUpdateItem}
                onRemoveItem={handleRemoveItem}
                onExclude={handleExcludeProduct}      // 🎉 추가
              />
            </div>)}

          {/* 🆕 최근 수금 내역 - 맨 마지막으로 이동 */}
          {formData.transaction_type === 'sales' && recentPayments && recentPayments.length > 0 && (
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
              <div className="border-2 border-green-400 rounded-lg p-5 shadow-md">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mr-3">
                    <span className="text-2xl">💰</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-green-900">미처리 수금 내역</h4>
                    <p className="text-sm text-green-700">거래증에 표시할 입금 내역을 선택하세요 ({recentPayments.length}건)</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {recentPayments.map(payment => (
                    <label
                      key={payment.id}
                      className="flex items-center p-4 bg-white border-2 border-green-200 rounded-lg hover:border-green-400 hover:shadow-md cursor-pointer transition-all"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPaymentId === payment.id}
                        onChange={(e) => setSelectedPaymentId(e.target.checked ? payment.id! : null)}
                        className="h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded mr-4"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-gray-900 text-base">
                            📅 {new Date(payment.transaction_date).toLocaleDateString('ko-KR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                          <span className="text-2xl font-bold text-green-600">
                            +{payment.total_amount.toLocaleString()}원
                          </span>
                        </div>
                        <span className="text-xs text-gray-500 mt-1 inline-block">
                          거래 ID: #{payment.id}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>

                <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded-lg">
                  <p className="text-sm text-green-800 font-medium">
                    ✅ 선택한 수금 내역이 거래증에 함께 인쇄됩니다
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 거래 요약 및 액션 버튼 */}
          <div className="p-6 bg-gray-50 rounded-b-lg">
            {items.length > 0 && (
              <div className="mb-6">
                <TransactionSummary
                  totalAmount={totalAmount}
                  taxAmount={taxAmount}
                  itemsCount={items.length}
                  isVatIncluded={isVatIncluded}
                  onVatIncludedChange={setIsVatIncluded}
                  displayTotalAmount={displayTotalAmount}
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
