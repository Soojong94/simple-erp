import { useQuery } from '@tanstack/react-query'
import { transactionAPI, customerAPI, productAPI } from '../lib/tauri'
// Excel 컴포넌트 임시 비활성화 (패키지 문제)
// import TransactionExcelExporter from '../components/excel/TransactionExcelExporter'
// import CustomerExcelExporter from '../components/excel/CustomerExcelExporter'
// import ProductExcelExporter from '../components/excel/ProductExcelExporter'

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
            현재 재고 관리 시스템 테스트를 위해 Excel 기능을 임시 비활성화했습니다.
          </p>
        </div>
      </div>

      {/* 임시 비활성화된 Excel 컴포넌트들 */}
      {/* <TransactionExcelExporter transactions={transactions} /> */}
      {/* <CustomerExcelExporter customers={customers} /> */}
      {/* <ProductExcelExporter products={products} /> */}

      {/* 임시 안내 메시지 */}
      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-yellow-900 mb-2">⚠️ Excel 기능 임시 비활성화</h3>
        <p className="text-sm text-yellow-800">
          현재 거래 삭제/수정 시 재고 복원 시스템을 테스트하기 위해 Excel 관련 패키지를 임시로 비활성화했습니다.
          <br />재고 관리 시스템 테스트 완료 후 다시 활성화됩니다.
        </p>
      </div>

      {/* 테스트 안내 */}
      <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-green-900 mb-2">🧪 재고 관리 시스템 테스트</h3>
        <p className="text-sm text-green-800">
          1. 거래 관리 페이지에서 매입 거래 생성 → 재고 증가 확인<br />
          2. 매출 거래 생성 → 재고 감소 확인<br />
          3. 거래 삭제 → 재고 복원 확인<br />
          4. 거래 수정 → 재고 재계산 확인<br />
          5. 브라우저 콘솔(F12)에서 로그 메시지 확인
        </p>
      </div>
    </div>
  )
}
