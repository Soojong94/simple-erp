// 🥩 ProductModal.tsx 수정 완료 버전
// 아래 코드를 복사해서 D:\simple-erp\src\components\modals\ProductModal.tsx에 덮어쓰기

import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { productAPI, inventoryAPI } from '../../lib/tauri'
import type { Product } from '../../types'

interface ProductModalProps {
  isOpen: boolean
  onClose: () => void
  product?: Product
}

export default function ProductModal({ isOpen, onClose, product }: ProductModalProps) {
  const queryClient = useQueryClient()
  const isEditing = !!product

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: '',
    unit: 'kg',
    unit_price: '',
    description: '',
    traceability_number: '',
    origin: '',  // 🆕 원산지
    slaughterhouse: '',  // 🆕 도축장
    is_active: true,
    use_inventory: false,
    safety_stock: 30,
    location: 'cold' as 'frozen' | 'cold' | 'room'
  })

  useEffect(() => {
    const loadProductData = async () => {
      if (product) {
        let inventorySettings = {
          use_inventory: product.use_inventory_management || false,
          safety_stock: 30,
          location: 'cold' as 'frozen' | 'cold' | 'room'
        }

        if (product.use_inventory_management) {
          try {
            const inventory = await inventoryAPI.getByProductId(product.id!)
            if (inventory && inventory.id) {
              inventorySettings.safety_stock = inventory.safety_stock || 30
              inventorySettings.location = inventory.location || 'cold'
            }
          } catch (error) {
          }
        }

        setFormData({
          name: product.name || '',
          code: product.code || '',
          category: product.category || '',
          unit: product.unit || 'kg',
          unit_price: product.unit_price ? String(product.unit_price) : '',
          description: product.description || '',
          traceability_number: product.traceability_number || '',
          origin: product.origin || '',  // 🆕
          slaughterhouse: product.slaughterhouse || '',  // 🆕
          is_active: product.is_active ?? true,
          ...inventorySettings
        })
      } else {
        resetForm()
      }
    }

    loadProductData()
  }, [product])

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const newProduct = await productAPI.create(data)

      if (data.use_inventory_management && newProduct.id) {
        await inventoryAPI.updateInventory({
          product_id: newProduct.id,
          current_stock: 0,
          safety_stock: data.safety_stock || 30,
          location: data.location || 'cold',
          last_updated: new Date().toISOString()
        })
      }

      return newProduct
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      onClose()
      resetForm()
      alert('상품이 추가되었습니다.')
    },
    onError: (error) => {
      console.error('Product creation error:', error)
      alert('상품 추가 중 오류가 발생했습니다.')
    }
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      const updatedProduct = await productAPI.update(id, data)

      if (data.use_inventory_management) {
        const existingInventory = await inventoryAPI.getByProductId(id).catch(() => null)
        await inventoryAPI.updateInventory({
          product_id: id,
          current_stock: existingInventory?.current_stock || 0,
          safety_stock: data.safety_stock || 30,
          location: data.location || 'cold',
          last_updated: new Date().toISOString()
        })
      }

      return updatedProduct
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      onClose()
      resetForm()
      alert('상품이 수정되었습니다.')
    },
    onError: (error) => {
      console.error('Product update error:', error)
      alert('상품 수정 중 오류가 발생했습니다.')
    }
  })

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      category: '',
      unit: 'kg',
      unit_price: '',
      description: '',
      traceability_number: '',
      origin: '',  // 🆕
      slaughterhouse: '',  // 🆕
      is_active: true,
      use_inventory: false,
      safety_stock: 30,
      location: 'cold'
    })
  }

  const generateProductCode = () => {
    const category = formData.category.toUpperCase().replace(/\s/g, '')
    const name = formData.name.toUpperCase().replace(/\s/g, '').slice(0, 3)
    const timestamp = Date.now().toString().slice(-3)
    const code = `${category.slice(0, 4)}${name}${timestamp}`
    setFormData(prev => ({ ...prev, code }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      alert('상품명을 입력해주세요.')
      return
    }

    if (!formData.category.trim()) {
      alert('카테고리를 입력해주세요.')
      return
    }

    const submitData = {
      name: formData.name,
      code: formData.code,
      category: formData.category,
      unit: formData.unit,
      unit_price: formData.unit_price ? Number(formData.unit_price) : undefined,
      description: formData.description,
      traceability_number: formData.traceability_number,
      origin: formData.origin,  // 🆕
      slaughterhouse: formData.slaughterhouse,  // 🆕
      use_inventory_management: formData.use_inventory,
      is_active: formData.is_active,
      safety_stock: formData.safety_stock,
      location: formData.location
    }

    if (isEditing && product) {
      updateMutation.mutate({ id: product.id!, data: submitData })
    } else {
      createMutation.mutate(submitData)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-3xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {isEditing ? '상품 수정' : '상품 추가'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 기본 정보 */}
          <div className="border-b pb-4">
            <h4 className="text-md font-medium text-gray-900 mb-4">📦 기본 정보</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">상품명 *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="예: 목살"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">상품코드</label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-l-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="PORK001"
                  />
                  <button
                    type="button"
                    onClick={generateProductCode}
                    className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-500 text-sm hover:bg-gray-100"
                  >
                    자동생성
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">카테고리 *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">카테고리 선택</option>
                  <option value="돼지고기">돼지고기</option>
                  <option value="소고기">소고기</option>
                  <option value="닭고기">닭고기</option>
                  <option value="오리고기">오리고기</option>
                  <option value="기타">기타</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">단위 *</label>
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                  <option value="개">개</option>
                  <option value="마리">마리</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  참고가격 ({formData.unit}당)
                  <span className="text-gray-500 text-xs ml-1">(선택사항)</span>
                </label>
                <input
                  type="number"
                  name="unit_price"
                  value={formData.unit_price}
                  onChange={handleChange}
                  min="0"
                  step="100"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="12000"
                />
                <p className="text-xs text-gray-500 mt-1">
                  실제 거래 시에는 거래처별로 다른 가격을 적용할 수 있습니다.
                </p>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">상품 설명</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={2}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="국내산 돼지 목살 (등급: 1+)"
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">
                기본 이력번호
                <span className="text-gray-500 text-xs ml-1">(선택사항)</span>
              </label>
              <input
                type="text"
                name="traceability_number"
                value={formData.traceability_number}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="250101-001-123"
              />
              <p className="text-xs text-gray-500 mt-1">
                거래나 재고 입고 시 자동으로 채워집니다. 수동 변경 가능합니다.
              </p>
            </div>

            {/* 🆕 축산물 정보 (선택사항) */}
            <div className="mt-4 border-t pt-4">
              <h5 className="text-sm font-medium text-gray-900 mb-3">
                🥩 축산물 정보 <span className="text-gray-500 font-normal">(선택사항)</span>
              </h5>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">원산지</label>
                  <input
                    type="text"
                    name="origin"
                    value={formData.origin}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="예: 국내산, 미국산, 호주산"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">도축장</label>
                  <input
                    type="text"
                    name="slaughterhouse"
                    value={formData.slaughterhouse}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="예: 충남축협 도축장"
                  />
                </div>
              </div>

              <p className="text-xs text-gray-500 mt-2">
                거래나 재고 입고 시 자동으로 채워집니다. 거래별로 수동 변경 가능합니다.
              </p>
            </div>
          </div>

          {/* 재고 관리 설정 */}
          <div className="border-b pb-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-md font-medium text-gray-900">📊 재고 관리 설정</h4>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="use_inventory"
                  checked={formData.use_inventory}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">재고 관리 사용</span>
              </label>
            </div>

            {formData.use_inventory ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
                <p className="text-sm text-blue-800">
                  💡 재고 관리를 활성화하면 입출고 내역이 자동으로 추적됩니다.
                </p>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      안전 재고 ({formData.unit})
                    </label>
                    <input
                      type="number"
                      name="safety_stock"
                      value={formData.safety_stock}
                      onChange={handleChange}
                      min="0"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="30"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      재고가 이 수량보다 적으면 알림이 표시됩니다.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">보관 위치</label>
                    <select
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="frozen">❄️ 냉동</option>
                      <option value="cold">🧊 냉장</option>
                      <option value="room">🌡️ 상온</option>
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-600">
                  재고 관리를 사용하지 않으면 수기로 재고를 관리할 수 있습니다.
                  <br />
                  체크박스를 선택하면 자동 재고 추적이 활성화됩니다.
                </p>
              </div>
            )}
          </div>

          {/* 활성 상태 */}
          <div className="flex items-center">
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">
              활성 상품 (거래 가능)
            </label>
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