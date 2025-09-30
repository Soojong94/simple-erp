import { invoke } from '@tauri-apps/api/tauri'
import type { Product, ProductInventory, StockMovement, StockLot } from '../../types'
import { STORAGE_KEYS, getFromStorage, setToStorage, getNextId, delay, isTauri } from './helpers/storage'
import { backupTrigger } from './helpers/backup'

// 상품 관리 API
export const productAPI = {
  getAll: async (activeOnly: boolean = true) => {
    if (isTauri()) {
      return invoke<Product[]>('get_products', { active_only: activeOnly })
    } else {
      await delay(300)
      const products = getFromStorage<Product[]>(STORAGE_KEYS.PRODUCTS, [])
      return activeOnly ? products.filter(p => p.is_active) : products
    }
  },
  
  getById: async (id: number) => {
    if (isTauri()) {
      return invoke<Product>('get_product_by_id', { id })
    } else {
      await delay(200)
      const products = getFromStorage<Product[]>(STORAGE_KEYS.PRODUCTS, [])
      const product = products.find(p => p.id === id)
      if (!product) throw new Error('Product not found')
      return product
    }
  },
  
  create: async (productData: Omit<Product, 'id' | 'created_at'>) => {
    if (isTauri()) {
      return invoke<Product>('create_product', { request: productData })
    } else {
      await delay(500)
      const products = getFromStorage<Product[]>(STORAGE_KEYS.PRODUCTS, [])
      const newProduct: Product = {
        ...productData,
        id: getNextId('product'),
        created_at: new Date().toISOString()
      }
      products.push(newProduct)
      setToStorage(STORAGE_KEYS.PRODUCTS, products)
      backupTrigger.trigger() // 자동 백업 트리거
      return newProduct
    }
  },
  
  update: async (id: number, productData: Partial<Omit<Product, 'id' | 'created_at'>>) => {
    if (isTauri()) {
      return invoke<Product>('update_product', { id, request: productData })
    } else {
      await delay(400)
      const products = getFromStorage<Product[]>(STORAGE_KEYS.PRODUCTS, [])
      const index = products.findIndex(p => p.id === id)
      if (index === -1) throw new Error('Product not found')
      products[index] = { ...products[index], ...productData }
      setToStorage(STORAGE_KEYS.PRODUCTS, products)
      backupTrigger.trigger() // 자동 백업 트리거
      return products[index]
    }
  },
  
  delete: async (id: number) => {
    if (isTauri()) {
      return invoke<void>('delete_product', { id })
    } else {
      await delay(300)
      const products = getFromStorage<Product[]>(STORAGE_KEYS.PRODUCTS, [])
      const index = products.findIndex(p => p.id === id)
      if (index === -1) throw new Error('Product not found')
      
      // 🔧 상품 삭제 시 관련 재고 데이터도 함께 삭제
      console.log(`🗑️ 상품 #${id} 삭제 중... 관련 재고 데이터도 정리합니다.`)
      
      // 1. 재고 현황 삭제
      const inventory = getFromStorage<ProductInventory[]>(STORAGE_KEYS.PRODUCT_INVENTORY, [])
      const filteredInventory = inventory.filter(inv => inv.product_id !== id)
      setToStorage(STORAGE_KEYS.PRODUCT_INVENTORY, filteredInventory)
      console.log(`  ✓ 재고 현황 데이터 삭제됨`)
      
      // 2. 재고 이동 이력 삭제
      const movements = getFromStorage<StockMovement[]>(STORAGE_KEYS.STOCK_MOVEMENTS, [])
      const filteredMovements = movements.filter(m => m.product_id !== id)
      setToStorage(STORAGE_KEYS.STOCK_MOVEMENTS, filteredMovements)
      console.log(`  ✓ 재고 이동 이력 삭제됨`)
      
      // 3. 로트 삭제
      const lots = getFromStorage<StockLot[]>(STORAGE_KEYS.STOCK_LOTS, [])
      const filteredLots = lots.filter(lot => lot.product_id !== id)
      setToStorage(STORAGE_KEYS.STOCK_LOTS, filteredLots)
      console.log(`  ✓ 로트 데이터 삭제됨`)
      
      // 4. 상품 삭제
      products.splice(index, 1)
      setToStorage(STORAGE_KEYS.PRODUCTS, products)
      console.log(`✅ 상품 #${id} 및 관련 재고 데이터 모두 삭제 완료`)
      
      backupTrigger.trigger() // 자동 백업 트리거
    }
  },
  
  search: async (query: string, activeOnly: boolean = true) => {
    if (isTauri()) {
      return invoke<Product[]>('search_products', { query, active_only: activeOnly })
    } else {
      await delay(200)
      const products = getFromStorage<Product[]>(STORAGE_KEYS.PRODUCTS, [])
      const filtered = products.filter(p => {
        const matchesActive = !activeOnly || p.is_active
        const matchesQuery = p.name.toLowerCase().includes(query.toLowerCase()) ||
                            (p.code && p.code.toLowerCase().includes(query.toLowerCase())) ||
                            (p.category && p.category.toLowerCase().includes(query.toLowerCase()))
        return matchesActive && matchesQuery
      })
      return filtered
    }
  },
  
  getByCategory: async (category: string, activeOnly: boolean = true) => {
    if (isTauri()) {
      return invoke<Product[]>('get_products_by_category', { category, active_only: activeOnly })
    } else {
      await delay(200)
      const products = getFromStorage<Product[]>(STORAGE_KEYS.PRODUCTS, [])
      return products.filter(p => {
        const matchesActive = !activeOnly || p.is_active
        const matchesCategory = p.category === category
        return matchesActive && matchesCategory
      })
    }
  }
}
