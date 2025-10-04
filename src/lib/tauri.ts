/**
 * Simple ERP - Main API Entry Point
 * 
 * 모듈화된 API 구조:
 * - customerAPI: 거래처 관리
 * - productAPI: 상품 관리
 * - transactionAPI: 거래 관리 (미수금 처리 포함)
 * - inventoryAPI: 재고 관리
 * - companyAPI: 회사 정보 관리
 * - 기타 API들...
 */

import { getCurrentSession } from './auth/index'
import type { Company, CustomerProductPrice, TaxInvoice, ProductInventory, StockMovement, StockLot, InventoryStats, TransactionWithItems } from '../types'
import { STORAGE_KEYS, getFromStorage, setToStorage, getNextId, delay, isTauri } from './api/helpers/storage'
import { backupTrigger } from './api/helpers/backup'
import { invoke } from '@tauri-apps/api/tauri'

// 모듈화된 API들 import
export { customerAPI } from './api/customerAPI'
export { productAPI } from './api/productAPI'
export { transactionAPI, setInventoryAPI } from './api/transactionAPI'

// 초기 데이터 설정 (회사별로 최초 실행 시에만)
const initializeCompanyData = () => {
  const session = getCurrentSession()
  if (!session) return

  // 회사 정보 초기화
  const existingCompany = getFromStorage<Company | null>(STORAGE_KEYS.COMPANY, null)
  if (!existingCompany) {
    // 전역 companies 배열에서 회사 이름 찾기
    const companies = getFromStorage<any[]>('simple-erp-companies', [])
    const companyInfo = companies.find(c => c.id === session.company_id)

    const initialCompany: Company = {
      id: session.company_id,
      name: companyInfo?.name || `회사 ${session.company_id}`,
      business_number: '111-22-33333',
      ceo_name: session.display_name,
      address: '서울시 중구 세종대로 110',
      phone: '02-1111-2222',
      email: 'info@company.co.kr',
      business_type: '축산물 유통업',
      tax_invoice_api_key: '',
      tax_invoice_cert_file: '',
      created_at: new Date().toISOString()
    }
    setToStorage(STORAGE_KEYS.COMPANY, initialCompany)
  }

  // 다른 엔티티들은 빈 배열로 초기화 (기존 데이터가 없을 때만)
  if (getFromStorage(STORAGE_KEYS.CUSTOMERS, []).length === 0) setToStorage(STORAGE_KEYS.CUSTOMERS, [])
  if (getFromStorage(STORAGE_KEYS.PRODUCTS, []).length === 0) setToStorage(STORAGE_KEYS.PRODUCTS, [])
  if (getFromStorage(STORAGE_KEYS.TRANSACTIONS, []).length === 0) setToStorage(STORAGE_KEYS.TRANSACTIONS, [])
  if (getFromStorage(STORAGE_KEYS.CUSTOMER_PRODUCT_PRICES, []).length === 0) setToStorage(STORAGE_KEYS.CUSTOMER_PRODUCT_PRICES, [])
}

// 회사별 데이터 초기화 함수 (외부에서 호출)
export const initializeCurrentCompanyData = () => {
  initializeCompanyData()
}

// 백업 트리거 export
export { backupTrigger }

// 거래처별 상품 가격 API
export const customerProductPriceAPI = {
  getByCustomer: async (customerId: number) => {
    if (isTauri()) {
      return invoke<CustomerProductPrice[]>('get_customer_product_prices', { customer_id: customerId })
    } else {
      await delay(300)
      const prices = getFromStorage<CustomerProductPrice[]>(STORAGE_KEYS.CUSTOMER_PRODUCT_PRICES, [])
      return prices.filter(cpp => cpp.customer_id === customerId && cpp.is_active)
    }
  },
  
  getByCustomerAndProduct: async (customerId: number, productId: number) => {
    if (isTauri()) {
      return invoke<CustomerProductPrice>('get_customer_product_price', { customer_id: customerId, product_id: productId })
    } else {
      await delay(200)
      const prices = getFromStorage<CustomerProductPrice[]>(STORAGE_KEYS.CUSTOMER_PRODUCT_PRICES, [])
      const price = prices.find(cpp => cpp.customer_id === customerId && cpp.product_id === productId && cpp.is_active)
      if (!price) throw new Error('Price not found')
      return price
    }
  },
  
  setPrice: async (customerId: number, productId: number, price: number) => {
    if (isTauri()) {
      return invoke<CustomerProductPrice>('set_customer_product_price', { 
        customer_id: customerId, 
        product_id: productId, 
        price 
      })
    } else {
      await delay(400)
      const prices = getFromStorage<CustomerProductPrice[]>(STORAGE_KEYS.CUSTOMER_PRODUCT_PRICES, [])
      const index = prices.findIndex(cpp => cpp.customer_id === customerId && cpp.product_id === productId)
      
      if (index >= 0) {
        prices[index] = {
          ...prices[index],
          current_price_per_kg: price,
          last_updated: new Date().toISOString()
        }
        setToStorage(STORAGE_KEYS.CUSTOMER_PRODUCT_PRICES, prices)
        backupTrigger.trigger()
        return prices[index]
      } else {
        const newPrice: CustomerProductPrice = {
          id: getNextId('customerProductPrice'),
          customer_id: customerId,
          product_id: productId,
          current_price_per_kg: price,
          last_updated: new Date().toISOString(),
          is_active: true
        }
        prices.push(newPrice)
        setToStorage(STORAGE_KEYS.CUSTOMER_PRODUCT_PRICES, prices)
        backupTrigger.trigger()
        return newPrice
      }
    }
  }
}

// 세금계산서 API
export const invoiceAPI = {
  generate: async (transactionId: number) => {
    if (isTauri()) {
      return invoke<string>('generate_tax_invoice', { transactionId })
    } else {
      await delay(1000)
      return '/mock/invoice.pdf'
    }
  },
  
  getAll: async () => {
    if (isTauri()) {
      return invoke<TaxInvoice[]>('get_tax_invoices')
    } else {
      await delay(300)
      return []
    }
  }
}

// 회사 정보 API
export const companyAPI = {
  get: async () => {
    if (isTauri()) {
      return invoke<Company>('get_company')
    } else {
      await delay(200)
      return getFromStorage<Company>(STORAGE_KEYS.COMPANY, {
        id: 1,
        name: '고기유통 주식회사',
        business_number: '111-22-33333',
        ceo_name: '홍길동',
        address: '서울시 중구 세종대로 110',
        phone: '02-1111-2222',
        email: 'info@meatdist.co.kr',
        business_type: '축산물 유통업',
        tax_invoice_api_key: '',
        tax_invoice_cert_file: '',
        created_at: new Date().toISOString()
      })
    }
  },
  
  create: async (companyData: Omit<Company, 'id' | 'created_at'>) => {
    if (isTauri()) {
      return invoke<Company>('create_company', { request: companyData })
    } else {
      await delay(500)
      const newCompany = {
        ...companyData,
        id: 1,
        created_at: new Date().toISOString()
      }
      setToStorage(STORAGE_KEYS.COMPANY, newCompany)
      backupTrigger.trigger()
      return newCompany
    }
  },
  
  update: async (id: number, companyData: Partial<Omit<Company, 'id' | 'created_at'>>) => {
    if (isTauri()) {
      return invoke<Company>('update_company', { id, request: companyData })
    } else {
      await delay(400)
      const existingCompany = getFromStorage<Company>(STORAGE_KEYS.COMPANY, {} as Company)
      const updatedCompany = { ...existingCompany, ...companyData }
      setToStorage(STORAGE_KEYS.COMPANY, updatedCompany)
      backupTrigger.trigger()
      return updatedCompany
    }
  }
}

// 통계/보고서 API
export const reportAPI = {
  getSalesSummary: async (startDate: string, endDate: string) => {
    if (isTauri()) {
      return invoke('get_sales_summary', { startDate, endDate })
    } else {
      await delay(400)
      const { transactionAPI } = await import('./api/transactionAPI')
      const transactions = await transactionAPI.getAll()
      const salesTransactions = transactions.filter(t => 
        t.transaction_type === 'sales' && 
        t.transaction_date >= startDate && 
        t.transaction_date <= endDate
      )
      
      return {
        total_amount: salesTransactions.reduce((sum, t) => sum + t.total_amount, 0),
        transaction_count: salesTransactions.length,
        average_amount: salesTransactions.length > 0 ? salesTransactions.reduce((sum, t) => sum + t.total_amount, 0) / salesTransactions.length : 0,
        top_customers: salesTransactions.reduce((acc, t) => {
          const existing = acc.find(c => c.name === t.customer_name)
          if (existing) {
            existing.amount += t.total_amount
          } else {
            acc.push({ name: t.customer_name, amount: t.total_amount })
          }
          return acc
        }, [] as { name: string; amount: number }[]).sort((a, b) => b.amount - a.amount).slice(0, 5)
      }
    }
  },
  
  getPurchaseSummary: async (startDate: string, endDate: string) => {
    if (isTauri()) {
      return invoke('get_purchase_summary', { startDate, endDate })
    } else {
      await delay(400)
      const { transactionAPI } = await import('./api/transactionAPI')
      const transactions = await transactionAPI.getAll()
      const purchaseTransactions = transactions.filter(t => 
        t.transaction_type === 'purchase' && 
        t.transaction_date >= startDate && 
        t.transaction_date <= endDate
      )
      
      return {
        total_amount: purchaseTransactions.reduce((sum, t) => sum + t.total_amount, 0),
        transaction_count: purchaseTransactions.length,
        average_amount: purchaseTransactions.length > 0 ? purchaseTransactions.reduce((sum, t) => sum + t.total_amount, 0) / purchaseTransactions.length : 0,
        top_suppliers: purchaseTransactions.reduce((acc, t) => {
          const existing = acc.find(c => c.name === t.customer_name)
          if (existing) {
            existing.amount += t.total_amount
          } else {
            acc.push({ name: t.customer_name, amount: t.total_amount })
          }
          return acc
        }, [] as { name: string; amount: number }[]).sort((a, b) => b.amount - a.amount).slice(0, 5)
      }
    }
  }
}

// inventoryAPI - 재고 관리 API
export const inventoryAPI = {
  getInventory: async () => {
    if (isTauri()) {
      return invoke<ProductInventory[]>('get_inventory')
    } else {
      await delay(300)
      return getFromStorage<ProductInventory[]>(STORAGE_KEYS.PRODUCT_INVENTORY, [])
    }
  },

  getByProductId: async (productId: number) => {
    if (isTauri()) {
      return invoke<ProductInventory>('get_inventory_by_product', { product_id: productId })
    } else {
      await delay(200)
      const inventory = getFromStorage<ProductInventory[]>(STORAGE_KEYS.PRODUCT_INVENTORY, [])
      const item = inventory.find(inv => inv.product_id === productId)
      if (!item) throw new Error('Inventory not found')
      return item
    }
  },

  updateInventory: async (inventoryData: Partial<ProductInventory> & { product_id: number }) => {
    if (isTauri()) {
      return invoke<ProductInventory>('update_inventory', { data: inventoryData })
    } else {
      await delay(400)
      const inventory = getFromStorage<ProductInventory[]>(STORAGE_KEYS.PRODUCT_INVENTORY, [])
      const index = inventory.findIndex(inv => inv.product_id === inventoryData.product_id)
      
      if (index >= 0) {
        inventory[index] = {
          ...inventory[index],
          ...inventoryData,
          last_updated: new Date().toISOString()
        }
      } else {
        const newInventory: ProductInventory = {
          id: getNextId('inventory'),
          product_id: inventoryData.product_id,
          current_stock: inventoryData.current_stock || 0,
          safety_stock: inventoryData.safety_stock || 30,
          location: inventoryData.location || 'cold',
          last_updated: new Date().toISOString()
        }
        inventory.push(newInventory)
      }
      
      setToStorage(STORAGE_KEYS.PRODUCT_INVENTORY, inventory)
      backupTrigger.trigger()
      return inventory[index >= 0 ? index : inventory.length - 1]
    }
  },

  createMovement: async (movementData: Omit<StockMovement, 'id' | 'created_at'>) => {
    if (isTauri()) {
      return invoke<StockMovement>('create_stock_movement', { data: movementData })
    } else {
      await delay(300)
      const movements = getFromStorage<StockMovement[]>(STORAGE_KEYS.STOCK_MOVEMENTS, [])
      const newMovement: StockMovement = {
        ...movementData,
        id: getNextId('movement'),
        created_at: new Date().toISOString()
      }
      movements.push(newMovement)
      setToStorage(STORAGE_KEYS.STOCK_MOVEMENTS, movements)
      
      // 🎯 재고 현황 업데이트 (없으면 자동 생성)
      const inventory = getFromStorage<ProductInventory[]>(STORAGE_KEYS.PRODUCT_INVENTORY, [])
      let invIndex = inventory.findIndex(inv => inv.product_id === movementData.product_id)
      
      // 재고 항목이 없으면 새로 생성
      if (invIndex < 0) {
        const newInventory: ProductInventory = {
          id: getNextId('inventory'),
          product_id: movementData.product_id,
          current_stock: 0,
          safety_stock: 30,
          location: 'cold',
          last_updated: new Date().toISOString()
        }
        inventory.push(newInventory)
        invIndex = inventory.length - 1
      }
      
      // 재고 수량 업데이트
      if (movementData.movement_type === 'in') {
        inventory[invIndex].current_stock += movementData.quantity
      } else if (movementData.movement_type === 'out') {
        inventory[invIndex].current_stock -= movementData.quantity
      } else if (movementData.movement_type === 'adjust') {
        const oldStock = inventory[invIndex].current_stock
        inventory[invIndex].current_stock += movementData.quantity
      } else if (movementData.movement_type === 'expired') {
        inventory[invIndex].current_stock -= movementData.quantity
      }
      
      inventory[invIndex].last_updated = new Date().toISOString()
      setToStorage(STORAGE_KEYS.PRODUCT_INVENTORY, inventory)
      
      backupTrigger.trigger()
      return newMovement
    }
  },

  getMovementHistory: async (productId?: number) => {
    if (isTauri()) {
      return invoke<StockMovement[]>('get_stock_movements', { product_id: productId })
    } else {
      await delay(300)
      const movements = getFromStorage<StockMovement[]>(STORAGE_KEYS.STOCK_MOVEMENTS, [])
      return productId 
        ? movements.filter(m => m.product_id === productId).sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
        : movements.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
    }
  },

  createLot: async (lotData: Omit<StockLot, 'id' | 'created_at'>) => {
    if (isTauri()) {
      return invoke<StockLot>('create_lot', { data: lotData })
    } else {
      await delay(300)
      const lots = getFromStorage<StockLot[]>(STORAGE_KEYS.STOCK_LOTS, [])
      const newLot: StockLot = {
        ...lotData,
        id: getNextId('lot'),
        created_at: new Date().toISOString()
      }
      lots.push(newLot)
      setToStorage(STORAGE_KEYS.STOCK_LOTS, lots)
      backupTrigger.trigger()
      return newLot
    }
  },

  updateLot: async (id: number, lotData: Partial<StockLot>) => {
    if (isTauri()) {
      return invoke<StockLot>('update_lot', { id, data: lotData })
    } else {
      await delay(300)
      const lots = getFromStorage<StockLot[]>(STORAGE_KEYS.STOCK_LOTS, [])
      const index = lots.findIndex(lot => lot.id === id)
      if (index === -1) throw new Error('Lot not found')
      
      lots[index] = { ...lots[index], ...lotData }
      setToStorage(STORAGE_KEYS.STOCK_LOTS, lots)
      backupTrigger.trigger()
      return lots[index]
    }
  },

  getActiveLots: async (productId: number) => {
    if (isTauri()) {
      return invoke<StockLot[]>('get_active_lots', { product_id: productId })
    } else {
      await delay(200)
      const lots = getFromStorage<StockLot[]>(STORAGE_KEYS.STOCK_LOTS, [])
      return lots
        .filter(lot => lot.product_id === productId && lot.status === 'active' && lot.remaining_quantity > 0)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    }
  },

  getAllLots: async (productId?: number) => {
    if (isTauri()) {
      return invoke<StockLot[]>('get_all_lots', { product_id: productId })
    } else {
      await delay(300)
      const lots = getFromStorage<StockLot[]>(STORAGE_KEYS.STOCK_LOTS, [])
      return productId 
        ? lots.filter(lot => lot.product_id === productId)
        : lots
    }
  },

  getStats: async () => {
    if (isTauri()) {
      return invoke<InventoryStats>('get_inventory_stats')
    } else {
      await delay(300)
      const inventory = getFromStorage<ProductInventory[]>(STORAGE_KEYS.PRODUCT_INVENTORY, [])
      const lots = getFromStorage<StockLot[]>(STORAGE_KEYS.STOCK_LOTS, [])
      const { productAPI } = await import('./api/productAPI')
      const products = await productAPI.getAll()
      
      const activeInventory = inventory.filter(inv => 
        products.some(p => p.id === inv.product_id)
      )
      
      const today = new Date()
      const threeDaysLater = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000)
      
      return {
        totalProducts: activeInventory.length,
        totalStock: activeInventory.reduce((sum, inv) => sum + inv.current_stock, 0),
        lowStockCount: activeInventory.filter(inv => inv.current_stock < inv.safety_stock).length,
        expiringCount: lots.filter(lot => {
          const expiryDate = new Date(lot.expiry_date)
          return lot.status === 'active' && expiryDate <= threeDaysLater && expiryDate >= today
        }).length,
        totalValue: 0,
        expiredCount: lots.filter(lot => lot.status === 'expired').length
      }
    }
  },

  processExpiredLots: async () => {
    if (isTauri()) {
      return invoke<number>('process_expired_lots')
    } else {
      await delay(300)
      const lots = getFromStorage<StockLot[]>(STORAGE_KEYS.STOCK_LOTS, [])
      const today = new Date().toISOString().split('T')[0]
      let expiredCount = 0
      
      for (const lot of lots) {
        if (lot.status === 'active' && lot.expiry_date < today && lot.remaining_quantity > 0) {
          expiredCount++
          
          await inventoryAPI.createMovement({
            product_id: lot.product_id,
            movement_type: 'expired',
            quantity: lot.remaining_quantity,
            lot_number: lot.lot_number,
            expiry_date: lot.expiry_date,
            notes: `유통기한 만료로 인한 폐기 (LOT: ${lot.lot_number})`,
            reference_type: 'adjustment'
          })
          
          lot.remaining_quantity = 0
          lot.status = 'expired'
        }
      }
      
      setToStorage(STORAGE_KEYS.STOCK_LOTS, lots)
      backupTrigger.trigger()
      
      return expiredCount
    }
  },

  processTransactionInventory: async (transaction: TransactionWithItems) => {
    if (!transaction.items || transaction.items.length === 0) return
    
    
    for (const item of transaction.items) {
      if (!item.product_id) continue
      
      if (transaction.transaction_type === 'purchase') {
        await inventoryAPI.createMovement({
          product_id: item.product_id,
          movement_type: 'in',
          quantity: item.quantity,
          unit_price: item.unit_price,
          transaction_id: transaction.id,
          reference_type: 'purchase',
          reference_id: transaction.id,
          traceability_number: item.traceability_number,
          origin: item.origin,                    // ✅ 원산지 추가
          slaughterhouse: item.slaughterhouse,    // ✅ 도축장 추가
          notes: `매입 거래 자동 입고 - ${transaction.customer_name}`
        })
        
        const expiryDate = new Date(transaction.transaction_date)
        expiryDate.setDate(expiryDate.getDate() + 7)
        
        await inventoryAPI.createLot({
          product_id: item.product_id,
          lot_number: `LOT-${transaction.transaction_date}-${item.product_id}-${transaction.id}`,
          initial_quantity: item.quantity,
          remaining_quantity: item.quantity,
          expiry_date: expiryDate.toISOString().split('T')[0],
          traceability_number: item.traceability_number,
          supplier_id: transaction.customer_id,
          status: 'active'
        })
        
        
      } else if (transaction.transaction_type === 'sales') {
        const activeLots = await inventoryAPI.getActiveLots(item.product_id)
        let remainingQty = item.quantity
        
        for (const lot of activeLots) {
          if (remainingQty <= 0) break
          
          const deductQty = Math.min(remainingQty, lot.remaining_quantity)
          
          await inventoryAPI.updateLot(lot.id!, {
            remaining_quantity: lot.remaining_quantity - deductQty
          })
          
          await inventoryAPI.createMovement({
            product_id: item.product_id,
            movement_type: 'out',
            quantity: deductQty,
            lot_number: lot.lot_number,
            transaction_id: transaction.id,
            reference_type: 'sales',
            reference_id: transaction.id,
            origin: item.origin,                    // ✅ 원산지 추가
            slaughterhouse: item.slaughterhouse,    // ✅ 도축장 추가
            notes: `매출 거래 자동 출고 - ${transaction.customer_name} (LOT: ${lot.lot_number})`
          })
          
          remainingQty -= deductQty
        }
        
        if (remainingQty > 0) {
          console.warn(`⚠️ 재고 부족: ${item.product_name} - 요청: ${item.quantity}kg, 가용: ${item.quantity - remainingQty}kg`)
        }
      }
    }
    
  }
}

// transactionAPI에 inventoryAPI 연결
import { setInventoryAPI as setInv } from './api/transactionAPI'
setInv(inventoryAPI)
