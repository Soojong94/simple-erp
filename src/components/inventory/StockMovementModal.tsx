import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { inventoryAPI } from '../../lib/tauri'
import { formatNumber } from '../../lib/utils'
import type { Product, ProductInventory, StockMovement } from '../../types'

interface StockMovementModalProps {
  isOpen: boolean
  onClose: () => void
  product: (Product & ProductInventory) | null
}

export default function StockMovementModal({ isOpen, onClose, product }: StockMovementModalProps) {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'in' | 'out' | 'adjust'>('in')
  
  const [formData, setFormData] = useState<Partial<StockMovement>>({
    movement_type: 'in',
    quantity: 0,
    lot_number: '',
    expiry_date: '',
    traceability_number: '',
    notes: ''
  })

  const [expiryDays, setExpiryDays] = useState(7) // 유통기한 일수

  useEffect(() => {
    if (product) {
      setFormData(prev => ({
        ...prev,
        product_id: product.id,
        movement_type: activeTab
      }))

      // 입고 시 로트번호 자동 생성
      if (activeTab === 'in') {
        const today = new Date().toISOString().split('T')[0]
        const randomCode = Math.random().toString(36).substr(2, 4).toUpperCase()
        setFormData(prev => ({
          ...prev,
          lot_number: `LOT-${today}-${product.id}-${randomCode}`
        }))
      }
    }
  }, [product, activeTab])

  useEffect(() => {
    // 유통기한 자동 계산 (입고일로부터 N일 후)
    if (activeTab === 'in' && expiryDays > 0) {
      const expiryDate = new Date()
      expiryDate.setDate(expiryDate.getDate() + expiryDays)
      setFormData(prev => ({
        ...prev,
        expiry_date: expiryDate.toISOString().split('T')[0]
      }))
    }
  }, [expiryDays, activeTab])

  const mutation = useMutation({
    mutationFn: async (data: Partial<StockMovement>) => {
      if (data.movement_type === 'in') {
        // 입고 처리
        await inventoryAPI.createMovement(data as Omit<StockMovement, 'id' | 'created_at'>)
        
        // 로트 생성
        if (data.lot_number && data.expiry_date) {
          await inventoryAPI.createLot({
            product_id: data.product_id!,
            lot_number: data.lot_number,
            initial_quantity: data.quantity!,
            remaining_quantity: data.quantity!,
            expiry_date: data.expiry_date,
            traceability_number: data.traceability_number,
            status: 'active'
          })
        }
      } else if (data.movement_type === 'out') {
        // 출고 처리 (FIFO)
        const activeLots = await inventoryAPI.getActiveLots(data.product_id!)
        let remainingQty = data.quantity!
        
        // 🎯 현재 재고 확인
        const inventory = await inventoryAPI.getByProductId(data.product_id!)
        
        if (inventory.current_stock < data.quantity!) {
          throw new Error(`재고가 부족합니다. 현재 재고: ${inventory.current_stock}kg, 요청: ${data.quantity}kg`)
        }
        
        // 로트에서 차감 시도
        for (const lot of activeLots) {
          if (remainingQty <= 0) break
          
          const deductQty = Math.min(remainingQty, lot.remaining_quantity)
          
          // 로트에서 차감
          await inventoryAPI.updateLot(lot.id!, {
            remaining_quantity: lot.remaining_quantity - deductQty
          })
          
          // 재고 이동 기록
          await inventoryAPI.createMovement({
            ...data,
            quantity: deductQty,
            lot_number: lot.lot_number
          } as Omit<StockMovement, 'id' | 'created_at'>)
          
          remainingQty -= deductQty
        }
        
        // 🎯 로트가 부족하면 나머지를 일반 출고로 처리 (로트 없이)
        if (remainingQty > 0) {
          console.warn(`⚠️ 로트 부족 - 나머지 ${remainingQty}kg를 일반 출고로 처리합니다.`)
          
          await inventoryAPI.createMovement({
            ...data,
            quantity: remainingQty,
            lot_number: undefined,
            notes: `${data.notes || ''} (로트 불명 출고)`.trim()
          } as Omit<StockMovement, 'id' | 'created_at'>)
        }
      } else {
        // 재고 조정
        await inventoryAPI.createMovement(data as Omit<StockMovement, 'id' | 'created_at'>)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] })
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] })
      queryClient.invalidateQueries({ queryKey: ['stock-lots'] })
      alert('재고 이동이 완료되었습니다.')
      handleClose()
    },
    onError: (error) => {
      console.error('Stock movement error:', error)
      alert(error instanceof Error ? error.message : '재고 이동 중 오류가 발생했습니다.')
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!product) {
      alert('상품을 선택해주세요.')
      return
    }

    if (!formData.quantity || formData.quantity <= 0) {
      alert('수량을 입력해주세요.')
      return
    }

    if (activeTab === 'out' && formData.quantity > product.current_stock) {
      alert(`재고가 부족합니다. 현재 재고: ${product.current_stock}kg`)
      return
    }

    mutation.mutate(formData)
  }

  const handleClose = () => {
    setFormData({
      movement_type: 'in',
      quantity: 0,
      lot_number: '',
      expiry_date: '',
      traceability_number: '',
      notes: ''
    })
    setExpiryDays(7)
    onClose()
  }

  if (!isOpen || !product) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleClose} />
        
        <span className="hidden sm:inline-block sm:h-screen sm:align-middle">&#8203;</span>
        
        <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:align-middle">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="mb-6">
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  📦 재고 입출고 관리
                </h3>
                
                {/* 상품 정보 표시 */}
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">상품명</p>
                      <p className="font-medium">{product.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">현재 재고</p>
                      <p className="font-medium text-blue-600">{formatNumber(product.current_stock)} kg</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">안전 재고</p>
                      <p className="font-medium">{formatNumber(product.safety_stock)} kg</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">카테고리</p>
                      <p className="font-medium">{product.category}</p>
                    </div>
                  </div>
                </div>
                
                {/* 탭 선택 */}
                <div className="mt-6 border-b border-gray-200">
                  <nav className="-mb-px flex space-x-8">
                    <button
                      type="button"
                      onClick={() => setActiveTab('in')}
                      className={`border-b-2 py-2 px-1 text-sm font-medium ${
                        activeTab === 'in'
                          ? 'border-green-500 text-green-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      📥 입고
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('out')}
                      className={`border-b-2 py-2 px-1 text-sm font-medium ${
                        activeTab === 'out'
                          ? 'border-red-500 text-red-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      📤 출고
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('adjust')}
                      className={`border-b-2 py-2 px-1 text-sm font-medium ${
                        activeTab === 'adjust'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      🔧 재고조정
                    </button>
                  </nav>
                </div>
                
                {/* 입력 폼 */}
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-sm font-medium text-gray-700">
                      수량 (kg) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={formData.quantity}
                      onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      required
                    />
                  </div>
                  
                  {activeTab === 'in' && (
                    <>
                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-sm font-medium text-gray-700">
                          유통기한 (입고일로부터)
                        </label>
                        <div className="mt-1 flex items-center space-x-2">
                          <input
                            type="number"
                            min="1"
                            value={expiryDays}
                            onChange={(e) => setExpiryDays(parseInt(e.target.value) || 7)}
                            className="block w-20 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          />
                          <span className="text-sm text-gray-500">일 후</span>
                          <span className="text-sm text-gray-600">
                            ({formData.expiry_date})
                          </span>
                        </div>
                      </div>
                      
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700">
                          로트번호
                        </label>
                        <input
                          type="text"
                          value={formData.lot_number}
                          onChange={(e) => setFormData(prev => ({ ...prev, lot_number: e.target.value }))}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          placeholder="LOT-2025-01-01-XXXX"
                        />
                      </div>
                      
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700">
                          이력번호
                        </label>
                        <input
                          type="text"
                          value={formData.traceability_number}
                          onChange={(e) => setFormData(prev => ({ ...prev, traceability_number: e.target.value }))}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          placeholder="250101-001-123"
                        />
                      </div>
                    </>
                  )}
                  
                  {activeTab === 'adjust' && (
                    <div className="col-span-2 p-3 bg-yellow-50 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        ⚠️ 재고 조정은 실사 후 차이를 보정할 때 사용합니다.
                        입력한 수량이 최종 재고량이 됩니다.
                      </p>
                    </div>
                  )}
                  
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                      비고
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      rows={2}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder={activeTab === 'in' ? '입고 사유를 입력하세요' : 
                                  activeTab === 'out' ? '출고 사유를 입력하세요' :
                                  '조정 사유를 입력하세요'}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
              <button
                type="submit"
                disabled={mutation.isPending}
                className="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm disabled:bg-gray-400"
              >
                {mutation.isPending ? '처리 중...' : 
                 activeTab === 'in' ? '입고 처리' :
                 activeTab === 'out' ? '출고 처리' : '재고 조정'}
              </button>
              <button
                type="button"
                onClick={handleClose}
                disabled={mutation.isPending}
                className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                취소
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}