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
            거래 내역, 거래처 목록, 상품 목록을 Excel 파일로 내보낼 수 있습니다.
          </p>
        </div>
      </div>

      {/* 거래 내역 Excel 내보내기 */}
      <div className="mt-8">
        <TransactionExcelExporter transactions={transactions} />
      </div>

      {/* 거래처 목록 Excel 내보내기 */}
      <div className="mt-8">
        <CustomerExcelExporter customers={customers} />
      </div>

      {/* 상품 목록 Excel 내보내기 */}
      <div className="mt-8">
        <ProductExcelExporter products={products} />
      </div>
    </div>
  )
}