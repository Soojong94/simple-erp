import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { customerAPI } from '../../lib/tauri'
import type { Customer } from '../../types'

interface CustomerModalProps {
  isOpen: boolean
  onClose: () => void
  customer?: Customer // 수정 시 기존 데이터
}

export default function CustomerModal({ isOpen, onClose, customer }: CustomerModalProps) {
  const queryClient = useQueryClient()
  const isEditing = !!customer

  const [formData, setFormData] = useState({
    name: '',
    business_number: '',
    type: 'customer' as 'customer' | 'supplier',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    is_active: true,
    outstanding_balance: 0  // 🆕 미수금
  })

  // customer prop 변경 시 formData 업데이트
  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        business_number: customer.business_number || '',
        type: customer.type || 'customer',
        contact_person: customer.contact_person || '',
        phone: customer.phone || '',
        email: customer.email || '',
        address: customer.address || '',
        is_active: customer.is_active ?? true,
        outstanding_balance: customer.outstanding_balance || 0  // 🆕
      })
    } else {
      resetForm()
    }
  }, [customer])

  const createMutation = useMutation({
    mutationFn: customerAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      onClose()
      resetForm()
      alert('거래처가 추가되었습니다.')
    },
    onError: (error) => {
      console.error('Customer creation error:', error)
      alert('거래처 추가 중 오류가 발생했습니다.')
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => customerAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      onClose()
      resetForm()
      alert('거래처가 수정되었습니다.')
    },
    onError: (error) => {
      console.error('Customer update error:', error)
      alert('거래처 수정 중 오류가 발생했습니다.')
    }
  })

  const resetForm = () => {
    setFormData({
      name: '',
      business_number: '',
      type: 'customer',
      contact_person: '',
      phone: '',
      email: '',
      address: '',
      is_active: true,
      outstanding_balance: 0  // 🆕
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      alert('거래처명을 입력해주세요.')
      return
    }

    if (isEditing && customer) {
      updateMutation.mutate({ id: customer.id!, data: formData })
    } else {
      createMutation.mutate(formData)
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
            {isEditing ? '거래처 수정' : '거래처 추가'}
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
            {/* 거래처명 */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                거래처명 *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="예: A마트 본점"
              />
            </div>

            {/* 사업자번호 */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                사업자번호
              </label>
              <input
                type="text"
                name="business_number"
                value={formData.business_number}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="000-00-00000"
              />
            </div>

            {/* 거래처 유형 */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                거래처 유형 *
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="customer">고객 (판매처)</option>
                <option value="supplier">공급업체 (구매처)</option>
              </select>
            </div>

            {/* 담당자 */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                담당자
              </label>
              <input
                type="text"
                name="contact_person"
                value={formData.contact_person}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="김사장"
              />
            </div>

            {/* 전화번호 */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                전화번호
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="02-0000-0000"
              />
            </div>

            {/* 이메일 */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                이메일
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="example@company.com"
              />
            </div>
          </div>

          {/* 주소 */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              주소
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows={2}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="서울시 강남구 테헤란로 123"
            />
          </div>

          {/* 🆕 미수금 관리 - 읽기 전용 */}
          {isEditing && formData.type === 'customer' && (
            <div className="border-t pt-4">
              <h4 className="text-md font-medium text-gray-900 mb-4">💰 미수금 정보</h4>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    현재 미수금
                  </label>
                  <div className="text-2xl font-bold text-blue-700">
                    {new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(formData.outstanding_balance)}
                  </div>
                </div>
                
                <div className="mt-3 space-y-1 bg-white rounded p-3 border border-blue-100">
                  <p className="text-xs text-gray-600">
                    💡 <strong>미수금 관리 방법:</strong>
                  </p>
                  <p className="text-xs text-gray-600 ml-4">
                    • <strong>수금 시:</strong> 거래 관리에서 "💵 수금 처리" 거래를 생성하세요
                  </p>
                  <p className="text-xs text-gray-600 ml-4">
                    • <strong>매출 시:</strong> 자동으로 미수금이 증가합니다
                  </p>
                  <p className="text-xs text-gray-600 ml-4">
                    • <strong>추적:</strong> 모든 입출금 내역이 거래 테이블에 기록됩니다
                  </p>
                </div>
              </div>
            </div>
          )}

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
              활성 거래처 (거래 가능)
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
