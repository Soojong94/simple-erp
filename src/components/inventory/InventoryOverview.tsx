import { useQuery } from '@tanstack/react-query'
import { inventoryAPI } from '../../lib/tauri'
import { formatCurrency, formatNumber } from '../../lib/utils'
import type { InventoryStats } from '../../types'

export default function InventoryOverview() {
  const { data: stats, isLoading } = useQuery<InventoryStats>({
    queryKey: ['inventory-stats'],
    queryFn: () => inventoryAPI.getStats(),
    refetchInterval: 30000 // 30초마다 자동 새로고침
  })

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-pulse bg-gray-200 rounded-lg p-5 h-24"></div>
        ))}
      </div>
    )
  }

  const cards = [
    {
      title: '총 재고량',
      value: `${formatNumber(stats?.totalStock || 0)} kg`,
      icon: '📦',
      color: 'bg-blue-50 text-blue-700'
    },
    {
      title: '재고 부족',
      value: `${stats?.lowStockCount || 0} 개`,
      icon: '⚠️',
      color: stats?.lowStockCount ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
    },
    {
      title: '유통기한 임박',
      value: `${stats?.expiringCount || 0} 개`,
      icon: '⏰',
      color: stats?.expiringCount ? 'bg-yellow-50 text-yellow-700' : 'bg-green-50 text-green-700'
    },
    {
      title: '만료된 로트',
      value: `${stats?.expiredCount || 0} 개`,
      icon: '❌',
      color: stats?.expiredCount ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-700'
    },
    {
      title: '관리 상품',
      value: `${stats?.totalProducts || 0} 개`,
      icon: '📊',
      color: 'bg-indigo-50 text-indigo-700'
    },
    {
      title: '재고 총액',
      value: formatCurrency(stats?.totalValue || 0),
      icon: '💰',
      color: 'bg-green-50 text-green-700'
    }
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
      {cards.map((card, index) => (
        <div
          key={index}
          className={`rounded-lg ${card.color} p-5 shadow-sm hover:shadow-md transition-shadow`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium opacity-75">{card.title}</p>
              <p className="mt-1 text-lg font-bold">{card.value}</p>
            </div>
            <span className="text-2xl">{card.icon}</span>
          </div>
        </div>
      ))}
    </div>
  )
}