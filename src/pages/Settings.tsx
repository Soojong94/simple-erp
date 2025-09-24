import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { companyAPI } from '../lib/tauri'
import { useState, useEffect } from 'react'

export default function Settings() {
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    business_number: '',
    ceo_name: '',
    address: '',
    phone: '',
    email: '',
    business_type: '',
    tax_invoice_api_key: '',
    tax_invoice_cert_file: ''
  })

  const { data: company, isLoading, error } = useQuery({
    queryKey: ['company'],
    queryFn: () => companyAPI.get()
  })

  // 회사 데이터가 로드되면 폼 데이터 업데이트
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
        tax_invoice_cert_file: company.tax_invoice_cert_file || ''
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
      alert('회사 정보가 저장되었습니다.')
    },
    onError: (error) => {
      console.error('Company update error:', error)
      alert('저장 중 오류가 발생했습니다.')
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

  if (error) {
    console.error('Settings API error:', error)
  }

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">설정</h1>
          <p className="mt-2 text-sm text-gray-700">
            시스템 설정 및 회사 정보를 관리합니다.
          </p>
        </div>
      </div>

      <div className="mt-8 space-y-8">
        {/* 회사 정보 */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                회사 정보
              </h3>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
                    <label className="block text-sm font-medium text-gray-700">
                      회사명 *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      disabled={!isEditing}
                      required
                      className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                        !isEditing ? 'bg-gray-50' : ''
                      }`}
                      placeholder="회사명을 입력하세요"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      사업자등록번호 *
                    </label>
                    <input
                      type="text"
                      name="business_number"
                      value={formData.business_number}
                      onChange={handleChange}
                      disabled={!isEditing}
                      required
                      className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                        !isEditing ? 'bg-gray-50' : ''
                      }`}
                      placeholder="000-00-00000"
                    />
                  </div>
                  
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                      사업장 주소
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                        !isEditing ? 'bg-gray-50' : ''
                      }`}
                      placeholder="사업장 주소를 입력하세요"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      대표자명
                    </label>
                    <input
                      type="text"
                      name="ceo_name"
                      value={formData.ceo_name}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                        !isEditing ? 'bg-gray-50' : ''
                      }`}
                      placeholder="대표자명을 입력하세요"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      전화번호
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                        !isEditing ? 'bg-gray-50' : ''
                      }`}
                      placeholder="02-0000-0000"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      이메일
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                        !isEditing ? 'bg-gray-50' : ''
                      }`}
                      placeholder="company@example.com"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      업종
                    </label>
                    <input
                      type="text"
                      name="business_type"
                      value={formData.business_type}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                        !isEditing ? 'bg-gray-50' : ''
                      }`}
                      placeholder="제조업, 도소매업 등"
                    />
                  </div>
                </div>
                
                {isEditing && (
                  <div className="mt-6 flex space-x-3">
                    <button
                      type="submit"
                      disabled={updateCompanyMutation.isPending}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {updateCompanyMutation.isPending ? '저장 중...' : '저장'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false)
                        // 폼 데이터를 원래 상태로 되돌림
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
                            tax_invoice_cert_file: company.tax_invoice_cert_file || ''
                          })
                        }
                      }}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      취소
                    </button>
                  </div>
                )}
              </form>
            )}
          </div>
        </div>

        {/* API 설정 */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              전자세금계산서 API 설정
            </h3>
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    개발 중인 기능입니다
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>전자세금계산서 API 연동 기능은 현재 개발 중입니다. 추후 업데이트를 통해 제공될 예정입니다.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  API 키
                </label>
                <input
                  type="password"
                  disabled
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-50 sm:text-sm"
                  placeholder="추후 지원 예정"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  인증서 파일
                </label>
                <input
                  type="file"
                  disabled
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-50 sm:text-sm"
                />
              </div>
            </div>
            
            <div className="mt-6 flex space-x-3">
              <button
                type="button"
                disabled
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gray-400 cursor-not-allowed"
              >
                저장 (준비 중)
              </button>
              <button
                type="button"
                disabled
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-400 bg-gray-50 cursor-not-allowed"
              >
                연결 테스트 (준비 중)
              </button>
            </div>
          </div>
        </div>

        {/* 시스템 정보 */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              시스템 정보
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-sm font-medium text-gray-500">버전</span>
                <span className="text-sm text-gray-900">v0.1.0</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-sm font-medium text-gray-500">데이터베이스</span>
                <span className="text-sm text-gray-900">SQLite (로컬)</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-sm font-medium text-gray-500">마지막 백업</span>
                <span className="text-sm text-gray-900">자동 백업 (매일)</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-sm font-medium text-gray-500">데이터 위치</span>
                <span className="text-sm text-gray-900 font-mono">./data/simple-erp.db</span>
              </div>
            </div>
            
            <div className="mt-6">
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                데이터 백업
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
