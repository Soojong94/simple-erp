import { useQuery } from '@tanstack/react-query'
import { inventoryAPI } from '../../lib/tauri'
import { formatNumber } from '../../lib/utils'
import type { StockLot } from '../../types'

export default function ExpiryAlertCard() {
  const { data: expiringLots = [], isLoading } = useQuery<StockLot[]>({
    queryKey: ['expiring-lots'],
    queryFn: () => inventoryAPI.getExpiringLots(3), // 3일 이내 유통기한 임박
    refetchInterval: 60000 // 1분마다 자동 새로고침
  })

  if (isLoading) {
    return (
      <div className="bg-yellow-50 rounded-lg p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-yellow-200 rounded w-1/3 mb-2"></div>
          <div className="h-3 bg-yellow-100 rounded w-full"></div>
        </div>
      </div>
    )
  }

  if (expiringLots.length === 0) {
    return (
      <div className="bg-green-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-green-800 mb-2">
          ✅ 유통기한 안전
        </h3>
        <p className="text-sm text-green-600">
          향후 3일 내 유통기한이 만료되는 상품이 없습니다.
        </p>
      </div>
    )
  }

  // D-day 계산
  const getDaysRemaining = (expiryDate: string) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const expiry = new Date(expiryDate)
    expiry.setHours(0, 0, 0, 0)
    const diffTime = expiry.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  return (
    <div className="bg-yellow-50 rounded-lg p-4">
      <h3 className="text-sm font-medium text-yellow-800 mb-3">
        ⏰ 유통기한 임박 알림
      </h3>
      
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {expiringLots.map((lot) => {
          const daysRemaining = getDaysRemaining(lot.expiry_date)
          const urgencyClass = daysRemaining <= 0 ? 'bg-red-100 text-red-800' :
                              daysRemaining === 1 ? 'bg-orange-100 text-orange-800' :
                              'bg-yellow-100 text-yellow-800'
          
          return (
            <div key={lot.id} className={`p-3 rounded-lg ${urgencyClass}`}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-medium text-sm">
                    {lot.product_name}
                  </p>
                  <p className="text-xs mt-1">
                    로트: {lot.lot_number}
                  </p>
                  <p className="text-xs">
                    수량: {formatNumber(lot.remaining_quantity)} kg
                  </p>
                  {lot.supplier_name && (
                    <p className="text-xs">
                      공급처: {lot.supplier_name}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">
                    {daysRemaining <= 0 ? '만료' : `D-${daysRemaining}`}
                  </p>
                  <p className="text-xs">
                    {new Date(lot.expiry_date).toLocaleDateString('ko-KR')}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      
      {expiringLots.length > 3 && (
        <p className="text-xs text-yellow-600 mt-2 text-center">
          총 {expiringLots.length}개 로트 유통기한 임박
        </p>
      )}
    </div>
  )
}