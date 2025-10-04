import { getCurrentSession } from '../../auth'

// 회사별 localStorage 키 생성
export const getCompanyStorageKey = (entity: string): string => {
  const session = getCurrentSession()
  let companyId = session?.company_id
  
  // 세션이 없을 경우 localStorage에서 직접 세션 읽기
  if (!companyId) {
    try {
      const sessionData = localStorage.getItem('simple-erp-current-session')
      if (sessionData) {
        const parsedSession = JSON.parse(sessionData)
        companyId = parsedSession?.company_id
      }
    } catch (e) {
      console.error('❌ localStorage에서 세션 읽기 실패:', e)
    }
  }
  
  // companyId가 없으면 에러 (기본값 사용 안 함)
  if (!companyId) {
    throw new Error('⚠️ 회사 ID를 확인할 수 없습니다. 다시 로그인해주세요.')
  }
  
  return `simple-erp-c${companyId}-${entity}`
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
