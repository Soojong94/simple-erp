import { collectBackupData } from '../../lib/backup'

export default function BackupStats() {
  // 세션이 없으면 백업 데이터 수집 실패할 수 있으므로 try-catch로 안전하게 처리
  let backupStats
  try {
    backupStats = collectBackupData()
  } catch (error) {
    console.warn('⚠️ [BackupStats] 백업 통계 조회 실패 (세션 없음)', error)
    // 세션이 없으면 빈 데이터로 표시
    backupStats = {
      customers: [],
      products: [],
      transactions: [],
      customerProductPrices: [],
      nextIds: {},
      companyInfo: {
        companyId: 0,
        companyName: '로그인 필요',
        backupDate: new Date().toISOString()
      },
      metadata: {
        backupDate: new Date().toISOString(),
        version: '1.0.0',
        totalRecords: 0,
        appVersion: 'Simple ERP v1.0',
        sourceCompanyId: 0
      }
    }
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4 mb-6">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center">
        <div>
          <div className="text-2xl font-semibold text-blue-600">{backupStats.customers.length}</div>
          <div className="text-xs text-gray-500">거래처</div>
        </div>
        <div>
          <div className="text-2xl font-semibold text-green-600">{backupStats.products.length}</div>
          <div className="text-xs text-gray-500">상품</div>
        </div>
        <div>
          <div className="text-2xl font-semibold text-purple-600">{backupStats.transactions.length}</div>
          <div className="text-xs text-gray-500">거래</div>
        </div>
        <div>
          <div className="text-2xl font-semibold text-orange-600">{backupStats.customerProductPrices.length}</div>
          <div className="text-xs text-gray-500">가격</div>
        </div>
        <div>
          <div className="text-2xl font-semibold text-gray-600">{backupStats.metadata.totalRecords}</div>
          <div className="text-xs text-gray-500">총 레코드</div>
        </div>
      </div>
    </div>
  )
}
