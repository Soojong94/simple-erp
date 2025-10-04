import { invoke } from '@tauri-apps/api/tauri'
import type { TransactionWithItems, Customer } from '../../types'
import { STORAGE_KEYS, getFromStorage, setToStorage, getNextId, delay, isTauri } from './helpers/storage'
import { backupTrigger } from './helpers/backup'
import { cancelTransactionInventoryEffect } from './helpers/inventory-helpers'

// inventoryAPI는 순환 참조를 피하기 위해 동적 import 사용
let inventoryAPI: any = null
export const setInventoryAPI = (api: any) => {
  inventoryAPI = api
}

// 거래 관리 API
export const transactionAPI = {
  getAll: async (transactionType?: 'sales' | 'purchase' | 'payment', customerId?: number, limit?: number, offset?: number) => {
    if (isTauri()) {
      return invoke<TransactionWithItems[]>('get_transactions', { 
        transaction_type: transactionType, 
        customer_id: customerId,
        limit,
        offset 
      })
    } else {
      await delay(400)
      const transactions = getFromStorage<TransactionWithItems[]>(STORAGE_KEYS.TRANSACTIONS, [])
      let filtered = transactions
      if (transactionType) {
        filtered = filtered.filter(t => t.transaction_type === transactionType)
      }
      if (customerId) {
        filtered = filtered.filter(t => t.customer_id === customerId)
      }
      return filtered.sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime())
    }
  },
  
  getById: async (id: number) => {
    if (isTauri()) {
      return invoke<TransactionWithItems>('get_transaction_by_id', { id })
    } else {
      await delay(200)
      const transactions = getFromStorage<TransactionWithItems[]>(STORAGE_KEYS.TRANSACTIONS, [])
      const transaction = transactions.find(t => t.id === id)
      if (!transaction) throw new Error('Transaction not found')
      return transaction
    }
  },
  
  create: async (transactionData: any) => {
    if (isTauri()) {
      return invoke<TransactionWithItems>('create_transaction', { request: transactionData })
    } else {
      await delay(600)
      const transactions = getFromStorage<TransactionWithItems[]>(STORAGE_KEYS.TRANSACTIONS, [])
      const customers = getFromStorage<Customer[]>(STORAGE_KEYS.CUSTOMERS, [])
      const customer = customers.find(c => c.id === transactionData.customer_id)
      
      const newTransaction: TransactionWithItems = {
        id: getNextId('transaction'),
        customer_id: transactionData.customer_id,
        customer_name: customer?.name || 'Unknown Customer',
        transaction_type: transactionData.transaction_type,
        transaction_date: transactionData.transaction_date,
        due_date: transactionData.due_date,
        total_amount: transactionData.total_amount || 0,
        tax_amount: transactionData.tax_amount || 0,
        notes: transactionData.notes || '',
        created_at: new Date().toISOString(),
        items: transactionData.items || [],
        reference_payment_id: transactionData.reference_payment_id  // 🎯 수금 거래 참조 ID 저장
      }
      
      transactions.push(newTransaction)
      setToStorage(STORAGE_KEYS.TRANSACTIONS, transactions)
      
      // 🆕 선택한 수금 거래 업데이트
      if (transactionData.reference_payment_id) {
        const paymentIndex = transactions.findIndex(
          t => t.id === transactionData.reference_payment_id
        )
        
        if (paymentIndex >= 0) {
          transactions[paymentIndex].is_displayed_in_invoice = true
          transactions[paymentIndex].displayed_in_transaction_id = newTransaction.id
          setToStorage(STORAGE_KEYS.TRANSACTIONS, transactions)
          
        }
      }
      
      // 🆕 재고 자동 처리
      if (inventoryAPI) {
        await inventoryAPI.processTransactionInventory(newTransaction)
      }
      
      // 🆕 미수금 처리
      
      // 매출 거래: 미수금 증가
      if (transactionData.transaction_type === 'sales' && customer) {
        
        const customerIndex = customers.findIndex(c => c.id === transactionData.customer_id)
        
        if (customerIndex >= 0) {
          const currentBalance = Number(customers[customerIndex].outstanding_balance) || 0
          const newBalance = currentBalance + Number(newTransaction.total_amount)
          
          
          customers[customerIndex].outstanding_balance = newBalance
          setToStorage(STORAGE_KEYS.CUSTOMERS, customers)
          
        } else {
          console.error(`❌ 거래처를 찾을 수 없음: customer_id=${transactionData.customer_id}`)
        }
      }
      // 🆕 수금 처리: 미수금 감소
      else if (transactionData.transaction_type === 'payment' && customer) {
        
        const customerIndex = customers.findIndex(c => c.id === transactionData.customer_id)
        
        if (customerIndex >= 0) {
          const currentBalance = Number(customers[customerIndex].outstanding_balance) || 0
          const paymentAmount = Number(newTransaction.total_amount)
          const newBalance = Math.max(0, currentBalance - paymentAmount)  // 음수 방지
          
          
          customers[customerIndex].outstanding_balance = newBalance
          setToStorage(STORAGE_KEYS.CUSTOMERS, customers)
          
        } else {
          console.error(`❌ 거래처를 찾을 수 없음: customer_id=${transactionData.customer_id}`)
        }
      } else {
        if (transactionData.transaction_type !== 'sales' && transactionData.transaction_type !== 'payment') {
        }
        if (!customer) {
        }
      }
      
      backupTrigger.trigger() // 자동 백업 트리거
      return newTransaction
    }
  },
  
  update: async (id: number, transactionData: any) => {
    if (isTauri()) {
      return invoke<TransactionWithItems>('update_transaction', { id, request: transactionData })
    } else {
      await delay(500)
      const transactions = getFromStorage<TransactionWithItems[]>(STORAGE_KEYS.TRANSACTIONS, [])
      const index = transactions.findIndex(t => t.id === id)
      if (index === -1) throw new Error('Transaction not found')
      
      // 🆕 기존 거래 정보 저장
      const oldTransaction = { ...transactions[index] }
      
      // 🆕 기존 재고 영향 취소
      await cancelTransactionInventoryEffect(oldTransaction)
      
      // 🆕 미수금 조정 (매출 거래일 경우)
      const customers = getFromStorage<Customer[]>(STORAGE_KEYS.CUSTOMERS, [])
      if (oldTransaction.transaction_type === 'sales' && oldTransaction.customer_id) {
        const customerIndex = customers.findIndex(c => c.id === oldTransaction.customer_id)
        if (customerIndex >= 0) {
          const currentBalance = Number(customers[customerIndex].outstanding_balance) || 0
          const oldAmount = Number(oldTransaction.total_amount) || 0
          const newAmount = Number(transactionData.total_amount) || 0
          const amountDiff = newAmount - oldAmount

          // 차액만큼 미수금 조정
          customers[customerIndex].outstanding_balance = currentBalance + amountDiff
          setToStorage(STORAGE_KEYS.CUSTOMERS, customers)

        }
      }
      
      // 거래 수정
      const updatedTransaction = { ...transactions[index], ...transactionData }
      transactions[index] = updatedTransaction
      setToStorage(STORAGE_KEYS.TRANSACTIONS, transactions)
      
      // 🆕 새로운 재고 영향 적용
      if (inventoryAPI) {
        await inventoryAPI.processTransactionInventory(updatedTransaction)
      }
      
      backupTrigger.trigger() // 자동 백업 트리거
      return updatedTransaction
    }
  },
  
  delete: async (id: number) => {
    if (isTauri()) {
      return invoke<void>('delete_transaction', { id })
    } else {
      await delay(400)
      const transactions = getFromStorage<TransactionWithItems[]>(STORAGE_KEYS.TRANSACTIONS, [])
      const transactionIndex = transactions.findIndex(t => t.id === id)
      if (transactionIndex === -1) throw new Error('Transaction not found')
      
      // 삭제할 거래 정보 저장
      const transactionToDelete = transactions[transactionIndex]
      
      // 🆕 미수금 복원 처리 (재고 복원보다 먼저!)
      const customers = getFromStorage<Customer[]>(STORAGE_KEYS.CUSTOMERS, [])
      const customer = customers.find(c => c.id === transactionToDelete.customer_id)
      
      if (customer) {
        const customerIndex = customers.findIndex(c => c.id === transactionToDelete.customer_id)
        
        if (customerIndex >= 0) {
          const currentBalance = Number(customers[customerIndex].outstanding_balance) || 0
          
          // 매출 거래 삭제 → 미수금 감소 (복원)
          if (transactionToDelete.transaction_type === 'sales') {
            const newBalance = Math.max(0, currentBalance - Number(transactionToDelete.total_amount))
            customers[customerIndex].outstanding_balance = newBalance
            
          }
          
          // 수금 거래 삭제 → 미수금 증가 (복원)
          else if (transactionToDelete.transaction_type === 'payment') {
            const newBalance = currentBalance + Number(transactionToDelete.total_amount)
            customers[customerIndex].outstanding_balance = newBalance
            
          }
          
          setToStorage(STORAGE_KEYS.CUSTOMERS, customers)
        }
      }
      
      // 🆕 재고 복원 처리
      await cancelTransactionInventoryEffect(transactionToDelete)
      
      // 거래 삭제
      transactions.splice(transactionIndex, 1)
      setToStorage(STORAGE_KEYS.TRANSACTIONS, transactions)
      backupTrigger.trigger() // 자동 백업 트리거
      
    }
  },
  
  getSummary: async (startDate?: string, endDate?: string) => {
    if (isTauri()) {
      return invoke<any>('get_transaction_summary', { start_date: startDate, end_date: endDate })
    } else {
      await delay(300)
      const transactions = getFromStorage<TransactionWithItems[]>(STORAGE_KEYS.TRANSACTIONS, [])
      const salesTransactions = transactions.filter(t => t.transaction_type === 'sales')
      const purchaseTransactions = transactions.filter(t => t.transaction_type === 'purchase')
      
      return {
        total_sales: salesTransactions.reduce((sum, t) => sum + t.total_amount, 0),
        total_purchases: purchaseTransactions.reduce((sum, t) => sum + t.total_amount, 0),
        sales_count: salesTransactions.length,
        purchase_count: purchaseTransactions.length,
        profit: salesTransactions.reduce((sum, t) => sum + t.total_amount, 0) - purchaseTransactions.reduce((sum, t) => sum + t.total_amount, 0)
      }
    }
  }
}
