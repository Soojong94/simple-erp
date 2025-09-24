import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { productAPI } from '../../lib/tauri'
import type { Product } from '../../types'

interface ProductModalProps {
  isOpen: boolean
  onClose: () => void
  product?: Product // 수정 시 기존 데이터
}

export default function ProductModal({ isOpen, onClose, product }: ProductModalProps) {
  const queryClient = useQueryClient()
  const isEditing = !!product

  const [formData, setFormData] = useState({
    name: product?.name || '',
    code: product?.code || '',
    category: product?.category || '',
    unit: product?.unit || 'kg',
    unit_price: product?.unit_price || '',
    description: product?.description || '',
    is_active: product?.is_active ?? true
  })

  const createMutation = useMutation({
    mutationFn: productAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
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
    mutationFn: ({ id, data }: { id: number, data: any }) => productAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
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
      is_active: true
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

    // 가격이 있으면 숫자로 변환, 없으면 undefined
    const submitData = {
      ...formData,
      unit_price: formData.unit_price ? Number(formData.unit_price) : undefined
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
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {isEditing ? '상품 수정' : '상품 추가'}
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* 상품명 */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                상품명 *
              </label>
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

            {/* 상품코드 */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                상품코드
              </label>
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

            {/* 카테고리 */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                카테고리 *
              </label>
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

            {/* 단위 */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                단위 *
              </label>
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

            {/* 참고가격 */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                참고가격 ({formData.unit}당)
                <span className="text-gray-500 text-xs ml-1">(선택사항 - 거래처별로 다를 수 있음)</span>
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

          {/* 설명 */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              상품 설명
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="국내산 돼지 목살 (등급: 1+)"
            />
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
