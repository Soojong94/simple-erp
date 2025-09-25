import { collectBackupData } from '../../lib/backup'

export default function BackupStats() {
  const backupStats = collectBackupData()

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
