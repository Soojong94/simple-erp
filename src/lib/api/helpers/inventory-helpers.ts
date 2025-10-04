import type { TransactionWithItems, StockLot, StockMovement } from '../../../types'
import { STORAGE_KEYS, getFromStorage, setToStorage } from './storage'

/**
 * 🔄 거래의 재고 영향을 취소하는 함수
 * (거래 삭제나 수정 시 기존 재고 영향을 되돌림)
 */
export const cancelTransactionInventoryEffect = async (transaction: TransactionWithItems) => {
  // 🎯 payment_in/payment_out 거래는 재고 영향이 없으므로 처리 안 함
  if (transaction.transaction_type === 'payment_in' || transaction.transaction_type === 'payment_out') {
    return
  }
  
  if (!transaction.items || transaction.items.length === 0) return
  
  
  // inventoryAPI import를 피하기 위해 직접 처리
  const createMovement = async (movementData: any) => {
    const movements = getFromStorage<StockMovement[]>(STORAGE_KEYS.STOCK_MOVEMENTS, [])
    const newMovement: StockMovement = {
      ...movementData,
      created_at: new Date().toISOString()
    }
    movements.push(newMovement)
    setToStorage(STORAGE_KEYS.STOCK_MOVEMENTS, movements)
  }
  
  for (const item of transaction.items) {
    if (!item.product_id) continue
    
    if (transaction.transaction_type === 'purchase') {
      // 매입 취소 → 입고 취소 (로트 삭제/비활성화)
      const lots = getFromStorage<StockLot[]>(STORAGE_KEYS.STOCK_LOTS, [])
      const relatedLots = lots.filter(lot => 
        lot.product_id === item.product_id &&
        (lot.lot_number?.includes(`-${transaction.id}-`) || 
         lot.lot_number?.includes(`${transaction.transaction_date}`)) &&
        lot.status === 'active'
      )
      
      for (const lot of relatedLots) {
        // 로트 취소 처리
        lot.status = 'cancelled'
        lot.remaining_quantity = 0
        
        // 취소 이동 기록
        await createMovement({
          product_id: item.product_id,
          movement_type: 'adjust',
          quantity: -lot.initial_quantity, // 음수로 차감
          lot_number: lot.lot_number,
          transaction_id: transaction.id,
          reference_type: 'cancellation',
          notes: `거래 삭제/수정으로 인한 입고 취소 (거래 #${transaction.id})`
        })
        
      }
      
      setToStorage(STORAGE_KEYS.STOCK_LOTS, lots)
      
    } else if (transaction.transaction_type === 'sales') {
      // 매출 취소 → 출고 취소 (재고 복원)
      const movements = getFromStorage<StockMovement[]>(STORAGE_KEYS.STOCK_MOVEMENTS, [])
      const relatedMovements = movements.filter(m => 
        m.transaction_id === transaction.id &&
        m.movement_type === 'out'
      )
      
      for (const movement of relatedMovements) {
        // 반대 이동 생성 (출고 취소)
        await createMovement({
          product_id: movement.product_id,
          movement_type: 'in',
          quantity: movement.quantity,
          lot_number: movement.lot_number,
          transaction_id: transaction.id,
          reference_type: 'cancellation',
          notes: `거래 삭제/수정으로 인한 출고 취소 (거래 #${transaction.id})`
        })
        
        // 관련 로트에 수량 복원
        if (movement.lot_number) {
          const lots = getFromStorage<StockLot[]>(STORAGE_KEYS.STOCK_LOTS, [])
          const lot = lots.find(l => l.lot_number === movement.lot_number)
          if (lot) {
            lot.remaining_quantity += movement.quantity
            if (lot.status === 'finished') {
              lot.status = 'active'
            }
            setToStorage(STORAGE_KEYS.STOCK_LOTS, lots)
          }
        }
        
      }
    }
  }
  
}
