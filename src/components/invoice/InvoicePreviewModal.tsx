import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { companyAPI, customerAPI } from '../../lib/tauri'
import { generateInvoicePDF } from '../../lib/pdf'
import type { TransactionWithItems } from '../../types'

interface InvoicePreviewModalProps {
  isOpen: boolean
  onClose: () => void
  transaction: TransactionWithItems
}

export default function InvoicePreviewModal({ isOpen, onClose, transaction }: InvoicePreviewModalProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const { data: company } = useQuery({
    queryKey: ['company'],
    queryFn: () => companyAPI.get()
  })

  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customerAPI.getAll()
  })

  const customer = customers?.find(c => c.id === transaction.customer_id)

  useEffect(() => {
    if (isOpen && company && customer) {
      handleGeneratePreview()
    }
    
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl)
      }
    }
  }, [isOpen, company, customer])

  const handleGeneratePreview = async () => {
    if (!company || !customer) return

    setIsGenerating(true)
    try {
      const pdf = await generateInvoicePDF(transaction, company, customer, 'preview')
      const blob = pdf.output('blob')
      const url = URL.createObjectURL(blob)
      setPdfUrl(url)
    } catch (error) {
      console.error('PDF 생성 실패:', error)
      alert('PDF 생성 중 오류가 발생했습니다.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = async () => {
    if (!company || !customer) return

    try {
      await generateInvoicePDF(transaction, company, customer, 'download')
      alert('PDF 파일이 다운로드되었습니다.')
    } catch (error) {
      console.error('PDF 다운로드 실패:', error)
      alert('PDF 다운로드 중 오류가 발생했습니다.')
    }
  }

  const handlePrint = async () => {
    if (!company || !customer) return

    try {
      await generateInvoicePDF(transaction, company, customer, 'print')
    } catch (error) {
      console.error('인쇄 실패:', error)
      alert('인쇄 중 오류가 발생했습니다.')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-8 mx-auto max-w-6xl bg-white rounded-lg shadow-xl mb-8">
        
        {/* 헤더 */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">📄 거래명세서 미리보기</h2>
            <p className="text-sm text-gray-500 mt-1">
              {customer?.name} | {transaction.transaction_date}
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* PDF 미리보기 */}
        <div className="p-6">
          {isGenerating ? (
            <div className="flex justify-center items-center h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500">PDF 생성 중...</p>
              </div>
            </div>
          ) : pdfUrl ? (
            <iframe
              src={pdfUrl}
              className="w-full h-[600px] border border-gray-300 rounded"
              title="거래명세서 미리보기"
            />
          ) : (
            <div className="flex justify-center items-center h-96">
              <p className="text-gray-500">PDF를 생성할 수 없습니다.</p>
            </div>
          )}
        </div>

        {/* 액션 버튼 */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            닫기
          </button>
          <button
            onClick={handleDownload}
            disabled={isGenerating}
            className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
          >
            📥 PDF 다운로드
          </button>
          <button
            onClick={handlePrint}
            disabled={isGenerating}
            className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            🖨️ 인쇄
          </button>
        </div>
      </div>
    </div>
  )
}
