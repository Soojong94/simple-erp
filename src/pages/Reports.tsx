import { useQuery } from '@tanstack/react-query'
import { transactionAPI, customerAPI, productAPI } from '../lib/tauri'
import TransactionExcelExporter from '../components/excel/TransactionExcelExporter'
import CustomerExcelExporter from '../components/excel/CustomerExcelExporter'
import ProductExcelExporter from '../components/excel/ProductExcelExporter'

export default function Reports() {
  // 거래 데이터 조회
  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => transactionAPI.getAll()
  })

  // 거래처 데이터 조회
  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customerAPI.getAll()
  })

  // 상품 데이터 조회
  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => productAPI.getAll()
  })

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">보고서 및 데이터 내보내기</h1>
          <p className="mt-2 text-sm text-gray-700">
            필터를 설정하여 필요한 데이터를 Excel 파일로 다운로드할 수 있습니다.
          </p>
        </div>
      </div>

      <div className="mt-8">
        {/* 거래 내역 Excel 다운로드 */}
        <TransactionExcelExporter transactions={transactions} />
      </div>

      <div className="mt-8">
        {/* 거래처 목록 Excel 다운로드 */}
        <CustomerExcelExporter customers={customers} />
      </div>

      <div className="mt-8">
        {/* 상품 목록 Excel 다운로드 */}
        <ProductExcelExporter products={products} />
      </div>

      {/* 안내 메시지 */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">📊 Excel 보고서 시스템</h3>
        <p className="text-sm text-blue-800">
          모든 Excel 다운로드 기능이 완성되었습니다. 필터를 설정하여 필요한 데이터만 선택적으로 내보낼 수 있습니다.
        </p>
      </div>
    </div>
  )
}
