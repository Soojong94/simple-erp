import { invoke } from '@tauri-apps/api/tauri'
import type { Customer, Product, TransactionWithItems, TaxInvoice, Company, CustomerProductPrice, PriceHistory } from '../types'
import { debounce } from './utils'
import { exportBackup, shouldBackupToday, isAutoBackupEnabled } from './backup'

// Tauri 환경 감지
const isTauri = () => {
  return typeof window !== 'undefined' && window.__TAURI_IPC__ !== undefined
}

// localStorage 키 상수
const STORAGE_KEYS = {
  CUSTOMERS: 'simple-erp-customers',
  PRODUCTS: 'simple-erp-products',
  TRANSACTIONS: 'simple-erp-transactions',
  CUSTOMER_PRODUCT_PRICES: 'simple-erp-customer-product-prices',
  COMPANY: 'simple-erp-company',
  NEXT_IDS: 'simple-erp-next-ids'
} as const

// localStorage 헬퍼 함수들
const getFromStorage = <T>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch {
    return defaultValue
  }
}

const setToStorage = <T>(key: string, value: T): void => {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error('localStorage 저장 실패:', error)
  }
}

// ID 자동 증가 관리
const getNextId = (entityType: string): number => {
  const nextIds = getFromStorage(STORAGE_KEYS.NEXT_IDS, {})
  const nextId = (nextIds[entityType] || 1)
  nextIds[entityType] = nextId + 1
  setToStorage(STORAGE_KEYS.NEXT_IDS, nextIds)
  return nextId
}

// 초기 데이터 설정 (최초 실행 시에만)
const initializeData = () => {
  // 회사 정보 초기화
  const existingCompany = getFromStorage<Company | null>(STORAGE_KEYS.COMPANY, null)
  if (!existingCompany) {
    const initialCompany: Company = {
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
    }
    setToStorage(STORAGE_KEYS.COMPANY, initialCompany)
  }

  // 다른 엔티티들은 빈 배열로 초기화
  const customers = getFromStorage<Customer[]>(STORAGE_KEYS.CUSTOMERS, [])
  const products = getFromStorage<Product[]>(STORAGE_KEYS.PRODUCTS, [])
  const transactions = getFromStorage<TransactionWithItems[]>(STORAGE_KEYS.TRANSACTIONS, [])
  const customerProductPrices = getFromStorage<CustomerProductPrice[]>(STORAGE_KEYS.CUSTOMER_PRODUCT_PRICES, [])

  if (customers.length === 0) setToStorage(STORAGE_KEYS.CUSTOMERS, [])
  if (products.length === 0) setToStorage(STORAGE_KEYS.PRODUCTS, [])
  if (transactions.length === 0) setToStorage(STORAGE_KEYS.TRANSACTIONS, [])
  if (customerProductPrices.length === 0) setToStorage(STORAGE_KEYS.CUSTOMER_PRODUCT_PRICES, [])
}

// 앱 시작 시 초기화
if (typeof window !== 'undefined') {
  initializeData()
}

// 지연을 시뮬레이션하는 함수
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// ==============================
// 자동 백업 시스템
// ==============================

/**
 * 데이터 변경 시 자동 백업 트리거 (디바운스 적용)
 */
const triggerAutoBackup = debounce(async () => {
  // 브라우저 환경에서만 실행 (타우리는 향후 분리 처리)
  if (isTauri()) return
  
  // 자동 백업이 비활성화되어 있으면 스킵
  if (!isAutoBackupEnabled()) return
  
  // 오늘 이미 백업이 되었다면 스킵
  if (!shouldBackupToday()) return
  
  try {
    await exportBackup(true) // 자동 백업 플래그
    console.log('💾 자동 백업 완료')
  } catch (error) {
    console.error('자동 백업 실패:', error)
  }
}, 2000) // 2초 디바운스

/**
 * 모든 CRUD 작업 후 호출할 백업 트리거
 */
export const backupTrigger = {
  /**
   * 데이터 변경 시 자동 백업 트리거
   */
  trigger: () => {
    triggerAutoBackup()
  }
}

// 고객 관리 API
export const customerAPI = {
  getAll: async (customerType?: 'customer' | 'supplier') => {
    if (isTauri()) {
      return invoke<Customer[]>('get_customers', { customer_type: customerType })
    } else {
      await delay(300)
      const customers = getFromStorage<Customer[]>(STORAGE_KEYS.CUSTOMERS, [])
      return customerType 
        ? customers.filter(c => c.type === customerType)
        : customers
    }
  },
  
  getById: async (id: number) => {
    if (isTauri()) {
      return invoke<Customer>('get_customer_by_id', { id })
    } else {
      await delay(200)
      const customers = getFromStorage<Customer[]>(STORAGE_KEYS.CUSTOMERS, [])
      const customer = customers.find(c => c.id === id)
      if (!customer) throw new Error('Customer not found')
      return customer
    }
  },
  
  create: async (customerData: Omit<Customer, 'id' | 'created_at'>) => {
    if (isTauri()) {
      return invoke<Customer>('create_customer', { request: customerData })
    } else {
      await delay(500)
      const customers = getFromStorage<Customer[]>(STORAGE_KEYS.CUSTOMERS, [])
      const newCustomer: Customer = {
        ...customerData,
        id: getNextId('customer'),
        created_at: new Date().toISOString()
      }
      customers.push(newCustomer)
      setToStorage(STORAGE_KEYS.CUSTOMERS, customers)
      backupTrigger.trigger() // 자동 백업 트리거
      return newCustomer
    }
  },
  
  update: async (id: number, customerData: Partial<Omit<Customer, 'id' | 'created_at'>>) => {
    if (isTauri()) {
      return invoke<Customer>('update_customer', { id, request: customerData })
    } else {
      await delay(400)
      const customers = getFromStorage<Customer[]>(STORAGE_KEYS.CUSTOMERS, [])
      const index = customers.findIndex(c => c.id === id)
      if (index === -1) throw new Error('Customer not found')
      customers[index] = { ...customers[index], ...customerData }
      setToStorage(STORAGE_KEYS.CUSTOMERS, customers)
      backupTrigger.trigger() // 자동 백업 트리거
      return customers[index]
    }
  },
  
  delete: async (id: number) => {
    if (isTauri()) {
      return invoke<void>('delete_customer', { id })
    } else {
      await delay(300)
      const customers = getFromStorage<Customer[]>(STORAGE_KEYS.CUSTOMERS, [])
      const index = customers.findIndex(c => c.id === id)
      if (index === -1) throw new Error('Customer not found')
      customers.splice(index, 1)
      setToStorage(STORAGE_KEYS.CUSTOMERS, customers)
      backupTrigger.trigger() // 자동 백업 트리거
    }
  },
  
  search: async (query: string, customerType?: 'customer' | 'supplier') => {
    if (isTauri()) {
      return invoke<Customer[]>('search_customers', { query, customer_type: customerType })
    } else {
      await delay(200)
      const customers = getFromStorage<Customer[]>(STORAGE_KEYS.CUSTOMERS, [])
      const filtered = customers.filter(c => {
        const matchesType = !customerType || c.type === customerType
        const matchesQuery = c.name.toLowerCase().includes(query.toLowerCase()) ||
                            (c.business_number && c.business_number.includes(query)) ||
                            (c.contact_person && c.contact_person.toLowerCase().includes(query.toLowerCase()))
        return matchesType && matchesQuery
      })
      return filtered
    }
  }
}

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
      products.splice(index, 1)
      setToStorage(STORAGE_KEYS.PRODUCTS, products)
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

// 거래 관리 API
export const transactionAPI = {
  getAll: async (transactionType?: 'sales' | 'purchase', customerId?: number, limit?: number, offset?: number) => {
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
        items: transactionData.items || []
      }
      
      transactions.push(newTransaction)
      setToStorage(STORAGE_KEYS.TRANSACTIONS, transactions)
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
      transactions[index] = { ...transactions[index], ...transactionData }
      setToStorage(STORAGE_KEYS.TRANSACTIONS, transactions)
      backupTrigger.trigger() // 자동 백업 트리거
      return transactions[index]
    }
  },
  
  delete: async (id: number) => {
    if (isTauri()) {
      return invoke<void>('delete_transaction', { id })
    } else {
      await delay(400)
      const transactions = getFromStorage<TransactionWithItems[]>(STORAGE_KEYS.TRANSACTIONS, [])
      const index = transactions.findIndex(t => t.id === id)
      if (index === -1) throw new Error('Transaction not found')
      transactions.splice(index, 1)
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
        // 기존 가격 업데이트
        prices[index] = {
          ...prices[index],
          current_price_per_kg: price,
          last_updated: new Date().toISOString()
        }
        setToStorage(STORAGE_KEYS.CUSTOMER_PRODUCT_PRICES, prices)
        backupTrigger.trigger() // 자동 백업 트리거
        return prices[index]
      } else {
        // 새 가격 추가
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
        backupTrigger.trigger() // 자동 백업 트리거
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
      backupTrigger.trigger() // 자동 백업 트리거
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
      backupTrigger.trigger() // 자동 백업 트리거
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
      const transactions = getFromStorage<TransactionWithItems[]>(STORAGE_KEYS.TRANSACTIONS, [])
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
      const transactions = getFromStorage<TransactionWithItems[]>(STORAGE_KEYS.TRANSACTIONS, [])
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
