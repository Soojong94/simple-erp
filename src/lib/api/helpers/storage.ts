import { getCurrentSession } from '../../auth'

// 회사별 localStorage 키 생성
export const getCompanyStorageKey = (entity: string): string => {
  const session = getCurrentSession()
  if (!session) {
    return `simple-erp-${entity}`
  }
  return `simple-erp-c${session.company_id}-${entity}`
}

// localStorage 키 상수 - getter로 동적으로 회사별 분리
export const STORAGE_KEYS = {
  get CUSTOMERS() { return getCompanyStorageKey('customers') },
  get PRODUCTS() { return getCompanyStorageKey('products') },
  get TRANSACTIONS() { return getCompanyStorageKey('transactions') },
  get CUSTOMER_PRODUCT_PRICES() { return getCompanyStorageKey('customer-product-prices') },
  get COMPANY() { return getCompanyStorageKey('company') },
  get NEXT_IDS() { return getCompanyStorageKey('next-ids') },
  get PRODUCT_INVENTORY() { return getCompanyStorageKey('product-inventory') },
  get STOCK_MOVEMENTS() { return getCompanyStorageKey('stock-movements') },
  get STOCK_LOTS() { return getCompanyStorageKey('stock-lots') },
  get INVENTORY_SETTINGS() { return getCompanyStorageKey('inventory-settings') }
}

// localStorage 헬퍼 함수들
export const getFromStorage = <T>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch {
    return defaultValue
  }
}

export const setToStorage = <T>(key: string, value: T): void => {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error('localStorage 저장 실패:', error)
  }
}

// ID 자동 증가 관리
export const getNextId = (entityType: string): number => {
  const nextIds = getFromStorage(STORAGE_KEYS.NEXT_IDS, {})
  const nextId = (nextIds[entityType] || 1)
  nextIds[entityType] = nextId + 1
  setToStorage(STORAGE_KEYS.NEXT_IDS, nextIds)
  return nextId
}

// 지연을 시뮬레이션하는 함수
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Tauri 환경 감지
export const isTauri = () => {
  return typeof window !== 'undefined' && window.__TAURI_IPC__ !== undefined
}
