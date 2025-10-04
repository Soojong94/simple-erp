import type { TransactionWithItems, StockMovement, ProductInventory } from '../../../types'
import { STORAGE_KEYS, getFromStorage, setToStorage, getNextId } from './storage'

/**
 * 🔄 거래의 재고 영향을 취소하는 함수 (단순화 버전)
 * (거래 삭제나 수정 시 기존 재고 영향을 되돌림)
 */
export const cancelTransactionInventoryEffect = async (transaction: TransactionWithItems) => {
  // 🎯 payment_in/payment_out 거래는 재고 영향이 없으므로 처리 안 함
  if (transaction.transaction_type === 'payment_in' || transaction.transaction_type === 'payment_out') {
    return
  }

  if (!transaction.items || transaction.items.length === 0) return

  for (const item of transaction.items) {
    if (!item.product_id) continue

    // 🆕 단순화: STOCK_MOVEMENTS만 추가하고, PRODUCT_INVENTORY는 createMovement가 자동 처리
    const movements = getFromStorage<StockMovement[]>(STORAGE_KEYS.STOCK_MOVEMENTS, [])
    const inventory = getFromStorage<ProductInventory[]>(STORAGE_KEYS.PRODUCT_INVENTORY, [])

    if (transaction.transaction_type === 'purchase') {
      // 매입 취소 → 입고 취소 (재고 감소)
      const invIndex = inventory.findIndex(inv => inv.product_id === item.product_id)

      if (invIndex >= 0) {
        inventory[invIndex].current_stock -= item.quantity
        inventory[invIndex].last_updated = new Date().toISOString()
        setToStorage(STORAGE_KEYS.PRODUCT_INVENTORY, inventory)
      }

      // 취소 이동 기록
      const newMovement: StockMovement = {
        id: getNextId('movement'),
        product_id: item.product_id,
        movement_type: 'adjust',
        quantity: -item.quantity, // 음수로 차감
        transaction_id: transaction.id,
        reference_type: 'cancellation',
        notes: `거래 삭제/수정으로 인한 입고 취소 (거래 #${transaction.id})`,
        created_at: new Date().toISOString()
      }
      movements.push(newMovement)
      setToStorage(STORAGE_KEYS.STOCK_MOVEMENTS, movements)

    } else if (transaction.transaction_type === 'sales') {
      // 매출 취소 → 출고 취소 (재고 증가)
      const invIndex = inventory.findIndex(inv => inv.product_id === item.product_id)

      if (invIndex >= 0) {
        inventory[invIndex].current_stock += item.quantity
        inventory[invIndex].last_updated = new Date().toISOString()
        setToStorage(STORAGE_KEYS.PRODUCT_INVENTORY, inventory)
      }

      // 취소 이동 기록
      const newMovement: StockMovement = {
        id: getNextId('movement'),
        product_id: item.product_id,
        movement_type: 'adjust',
        quantity: item.quantity, // 양수로 복원
        transaction_id: transaction.id,
        reference_type: 'cancellation',
        notes: `거래 삭제/수정으로 인한 출고 취소 (거래 #${transaction.id})`,
        created_at: new Date().toISOString()
      }
      movements.push(newMovement)
      setToStorage(STORAGE_KEYS.STOCK_MOVEMENTS, movements)
    }
  }
}
