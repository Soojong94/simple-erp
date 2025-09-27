import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { companyAPI } from '../../lib/tauri'
import { Company } from '../../types'

interface CompanyInfoSectionProps {
  company: Company | undefined
  isLoading: boolean
  onMessage: (message: string, type: 'success' | 'error' | 'info') => void
}

export default function CompanyInfoSection({ 
  company, 
  isLoading, 
  onMessage 
}: CompanyInfoSectionProps) {
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [stampImage, setStampImage] = useState<string>('')
  const [stampPreview, setStampPreview] = useState<string>('')
  const [formData, setFormData] = useState({
    name: '',
    business_number: '',
    ceo_name: '',
    address: '',
    phone: '',
    email: '',
    business_type: '',
    tax_invoice_api_key: '',
    tax_invoice_cert_file: '',
    default_invoice_memo: ''  // 🆕 기본 메모 추가
  })

  // 도장 이미지 불러오기
  useEffect(() => {
    const savedStamp = localStorage.getItem('simple-erp-stamp-image')
    if (savedStamp) {
      setStampImage(savedStamp)
      setStampPreview(savedStamp)
    }
  }, [])

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || '',
        business_number: company.business_number || '',
        ceo_name: company.ceo_name || '',
        address: company.address || '',
        phone: company.phone || '',
        email: company.email || '',
        business_type: company.business_type || '',
        tax_invoice_api_key: company.tax_invoice_api_key || '',
        tax_invoice_cert_file: company.tax_invoice_cert_file || '',
        default_invoice_memo: company.default_invoice_memo || ''  // 🆕 기본 메모 추가
      })
    }
  }, [company])

  const updateCompanyMutation = useMutation({
    mutationFn: (data: typeof formData) => {
      if (company?.id) {
        return companyAPI.update(company.id, data)
      } else {
        return companyAPI.create(data)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company'] })
      setIsEditing(false)
      onMessage('회사 정보가 저장되었습니다.', 'success')
    },
    onError: (error) => {
      console.error('Company update error:', error)
      onMessage('저장 중 오류가 발생했습니다.', 'error')
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateCompanyMutation.mutate(formData)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  // 도장 이미지 업로드 핸들러
  const handleStampUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 파일 크기 체크 (1MB 제한)
    if (file.size > 1024 * 1024) {
      onMessage('이미지 크기는 1MB 이하여야 합니다.', 'error')
      return
    }

    // 파일 형식 체크
    if (!file.type.startsWith('image/')) {
      onMessage('이미지 파일만 업로드 가능합니다.', 'error')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target?.result as string
      setStampImage(base64)
      setStampPreview(base64)
      
      // localStorage에 즉시 저장
      localStorage.setItem('simple-erp-stamp-image', base64)
      
      onMessage('도장 이미지가 저장되었습니다. 거래명세서에 자동으로 표시됩니다.', 'success')
    }
    reader.readAsDataURL(file)
  }

  // 도장 이미지 제거
  const handleStampRemove = () => {
    setStampImage('')
    setStampPreview('')
    localStorage.removeItem('simple-erp-stamp-image')
    
    onMessage('도장 이미지가 제거되었습니다.', 'success')
  }

  const handleCancel = () => {
    setIsEditing(false)
    if (company) {
      setFormData({
        name: company.name || '',
        business_number: company.business_number || '',
        ceo_name: company.ceo_name || '',
        address: company.address || '',
        phone: company.phone || '',
        email: company.email || '',
        business_type: company.business_type || '',
        tax_invoice_api_key: company.tax_invoice_api_key || '',
        tax_invoice_cert_file: company.tax_invoice_cert_file || '',
        default_invoice_memo: company.default_invoice_memo || ''  // 🆕 기본 메모 추가
      })
    }
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            🏢 회사 정보
          </h3>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              수정
            </button>
          )}
        </div>
        
        {isLoading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <div className="mt-2 text-sm text-gray-500">회사 정보 로딩 중...</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">회사명 *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                  className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${!isEditing ? 'bg-gray-50' : ''}`}
                  placeholder="회사명을 입력하세요"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">사업자등록번호 *</label>
                <input
                  type="text"
                  name="business_number"
                  value={formData.business_number}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                  className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${!isEditing ? 'bg-gray-50' : ''}`}
                  placeholder="000-00-00000"
                />
              </div>
              
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">사업장 주소</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${!isEditing ? 'bg-gray-50' : ''}`}
                  placeholder="사업장 주소를 입력하세요"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">대표자명</label>
                <input
                  type="text"
                  name="ceo_name"
                  value={formData.ceo_name}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${!isEditing ? 'bg-gray-50' : ''}`}
                  placeholder="대표자명을 입력하세요"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">전화번호</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${!isEditing ? 'bg-gray-50' : ''}`}
                  placeholder="02-0000-0000"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">이메일</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${!isEditing ? 'bg-gray-50' : ''}`}
                  placeholder="company@example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">업종</label>
                <input
                  type="text"
                  name="business_type"
                  value={formData.business_type}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${!isEditing ? 'bg-gray-50' : ''}`}
                  placeholder="제조업, 도소매업 등"
                />
              </div>
              
              {/* 🆕 거래명세서 기본 메모 */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  📝 거래명세서 기본 메모
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  거래명세서 출력 시 메모란에 기본으로 표시될 내용 (계좌번호, 처리 주의사항 등)
                </p>
                <textarea
                  name="default_invoice_memo"
                  value={formData.default_invoice_memo}
                  onChange={(e) => setFormData(prev => ({ ...prev, default_invoice_memo: e.target.value }))}
                  disabled={!isEditing}
                  rows={3}
                  className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${!isEditing ? 'bg-gray-50' : ''}`}
                  placeholder="예: 입금계좌: 국민은행 123-456-789012 (예금주: 고기유통주식회사)&#10;거래 문의: 02-1234-5678"
                />
              </div>
            </div>
            
            {isEditing && (
              <div className="mt-6 flex space-x-3">
                <button
                  type="submit"
                  disabled={updateCompanyMutation.isPending}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {updateCompanyMutation.isPending ? '저장 중...' : '저장'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  취소
                </button>
              </div>
            )}
          </form>
        )}

        {/* 🆕 도장 이미지 업로드 섹션 */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            📷 사업자 도장 이미지
          </h3>
          
          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="flex items-start space-x-6">
              {/* 미리보기 */}
              <div className="flex-shrink-0">
                {stampPreview ? (
                  <div className="relative">
                    <img 
                      src={stampPreview} 
                      alt="도장 미리보기" 
                      className="w-20 h-20 rounded-full object-cover border-2 border-gray-300"
                    />
                    <button
                      onClick={handleStampRemove}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                      title="도장 이미지 제거"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
                    <span className="text-3xl">📷</span>
                  </div>
                )}
              </div>

              {/* 업로드 영역 */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  도장 이미지 업로드
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  거래명세서 공급자 정보란에 표시될 도장 이미지를 업로드하세요.
                </p>
                <div className="flex items-center space-x-3">
                  <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg"
                      onChange={handleStampUpload}
                      className="hidden"
                    />
                    {stampPreview ? '이미지 변경' : '이미지 선택'}
                  </label>
                  {stampPreview && (
                    <button
                      onClick={handleStampRemove}
                      className="inline-flex items-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
                    >
                      제거
                    </button>
                  )}
                </div>
                <ul className="mt-3 text-xs text-gray-500 space-y-1">
                  <li>• 권장: PNG 형식 (투명 배경)</li>
                  <li>• 권장 크기: 200×200px 이상</li>
                  <li>• 최대 용량: 1MB</li>
                  <li>• 원형 또는 정사각형 도장 이미지</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
