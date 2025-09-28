import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { productAPI, inventoryAPI, transactionAPI } from '../lib/tauri'
import InventoryOverview from '../components/inventory/InventoryOverview'
import InventoryTable from '../components/inventory/InventoryTable'
import StockMovementModal from '../components/inventory/StockMovementModal'
import ExpiryAlertCard from '../components/inventory/ExpiryAlertCard'
import type { Product, ProductInventory } from '../types'

export default function Inventory() {
  const [selectedProduct, setSelectedProduct] = useState<(Product & ProductInventory) | null>(null)
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false)
  
  // 유통기한 지난 로트 자동 처리 (페이지 로드 시)
  const { data: expiredCount } = useQuery({
    queryKey: ['process-expired-lots'],
    queryFn: () => inventoryAPI.processExpiredLots(),
    refetchOnMount: true,
    refetchOnWindowFocus: false
  })

  // 재고 데이터 초기화 검색
  const { data: inventory = [] } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => inventoryAPI.getInventory(),
  })

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => transactionAPI.getAll()
  })

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => productAPI.getAll()
  })
  
  // 기존 거래에 대한 데이터가 없는 경우 초기화 처리
  useEffect(() => {
    const initializeInventory = async () => {
      // 초기화 검사: 재고 기록이 없고 거래는 있을 경우
      if (inventory.length === 0 && transactions.length > 0 && products.length > 0) {
        console.log('=== 재고 초기화 시작 ===')
        
        // 각 상품별 현재 재고 합계
        const stockByProduct = new Map<number, number>()
        
        // 전체 거래에서 재고 계산
        for (const transaction of transactions) {
          if (!transaction.items) continue
          
          for (const item of transaction.items) {
            if (!item.product_id) continue
            
            const currentStock = stockByProduct.get(item.product_id) || 0
            
            if (transaction.transaction_type === 'purchase') {
              // 매입은 입고 (+)
              stockByProduct.set(item.product_id, currentStock + item.quantity)
            } else if (transaction.transaction_type === 'sales') {
              // 매출은 출고 (-)
              stockByProduct.set(item.product_id, currentStock - item.quantity)
            }
          }
        }
        
        // 현재 계산된 재고로 ProductInventory 생성
        for (const [productId, stock] of stockByProduct.entries()) {
          // 0보다 작은 재고는 0으로 보정
          const adjustedStock = Math.max(0, stock)
          
          const product = products.find(p => p.id === productId)
          if (product) {
            await inventoryAPI.updateInventory({
              product_id: productId,
              current_stock: adjustedStock,
              safety_stock: 30, // 기본값
              last_updated: new Date().toISOString()
            })
          }
        }
        
        // 통계 갱신
        await inventoryAPI.getStats()
        console.log('=== 재고 초기화 완료 ===')
      }
    }
    
    initializeInventory()
  }, [inventory, transactions, products])
  
  const handleStockMovement = (product: Product & ProductInventory) => {
    setSelectedProduct(product)
    setIsMovementModalOpen(true)
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">재고 관리</h1>
        <p className="text-sm text-gray-500 mt-2 md:mt-0">
          현재 시간: {new Date().toLocaleString('ko-KR')}
        </p>
      </div>
      
      {/* 재고 통계 대시보드 */}
      <div className="mb-8">
        <InventoryOverview />
      </div>
      
      {/* 유통기한 알림 + 재고 현황 */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8">
        <div className="lg:col-span-1">
          <ExpiryAlertCard />
        </div>
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">재고 현황</h2>
            <InventoryTable onStockMovement={handleStockMovement} />
          </div>
        </div>
      </div>
      
      {/* 입출고 모달 */}
      <StockMovementModal
        isOpen={isMovementModalOpen}
        onClose={() => setIsMovementModalOpen(false)}
        product={selectedProduct}
      />
    </div>
  )
}