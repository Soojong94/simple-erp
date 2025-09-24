import type { Customer, Product, TransactionWithItems, CustomerProductPrice, Company } from '../types'

// 백업 데이터 타입 정의
export interface BackupData {
  customers: Customer[]
  products: Product[]
  transactions: TransactionWithItems[]
  customerProductPrices: CustomerProductPrice[]
  company: Company | null
  nextIds: Record<string, number>
  metadata: {
    backupDate: string
    version: string
    totalRecords: number
    appVersion: string
  }
}

// localStorage 키 상수 (tauri.ts와 동일)
const STORAGE_KEYS = {
  CUSTOMERS: 'simple-erp-customers',
  PRODUCTS: 'simple-erp-products',
  TRANSACTIONS: 'simple-erp-transactions',
  CUSTOMER_PRODUCT_PRICES: 'simple-erp-customer-product-prices',
  COMPANY: 'simple-erp-company',
  NEXT_IDS: 'simple-erp-next-ids',
  LAST_BACKUP_DATE: 'simple-erp-last-backup-date',
  AUTO_BACKUP_ENABLED: 'simple-erp-auto-backup-enabled'
} as const

// localStorage 헬퍼
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

/**
 * 모든 ERP 데이터를 수집하여 백업 데이터 객체 생성
 */
export const collectBackupData = (): BackupData => {
  const customers = getFromStorage<Customer[]>(STORAGE_KEYS.CUSTOMERS, [])
  const products = getFromStorage<Product[]>(STORAGE_KEYS.PRODUCTS, [])
  const transactions = getFromStorage<TransactionWithItems[]>(STORAGE_KEYS.TRANSACTIONS, [])
  const customerProductPrices = getFromStorage<CustomerProductPrice[]>(STORAGE_KEYS.CUSTOMER_PRODUCT_PRICES, [])
  const company = getFromStorage<Company | null>(STORAGE_KEYS.COMPANY, null)
  const nextIds = getFromStorage<Record<string, number>>(STORAGE_KEYS.NEXT_IDS, {})

  const totalRecords = customers.length + products.length + transactions.length + customerProductPrices.length + (company ? 1 : 0)

  return {
    customers,
    products,
    transactions,
    customerProductPrices,
    company,
    nextIds,
    metadata: {
      backupDate: new Date().toISOString(),
      version: '1.0.0',
      totalRecords,
      appVersion: 'Simple ERP v1.0'
    }
  }
}

/**
 * 백업 파일명 생성 (YYYY-MM-DD 형식)
 */
export const generateBackupFileName = (): string => {
  const today = new Date().toISOString().split('T')[0]
  return `simple-erp-backup-${today}.json`
}

/**
 * 백업 데이터를 JSON 파일로 다운로드
 */
export const exportBackup = async (isAutoBackup: boolean = false): Promise<boolean> => {
  try {
    const backupData = collectBackupData()
    const jsonString = JSON.stringify(backupData, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    // 파일 다운로드
    const a = document.createElement('a')
    a.href = url
    a.download = generateBackupFileName()
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    // 백업 날짜 업데이트
    const today = new Date().toISOString().split('T')[0]
    localStorage.setItem(STORAGE_KEYS.LAST_BACKUP_DATE, today)

    console.log(`백업 완료: ${isAutoBackup ? '자동' : '수동'} 백업`, {
      records: backupData.metadata.totalRecords,
      date: backupData.metadata.backupDate
    })

    return true
  } catch (error) {
    console.error('백업 실패:', error)
    return false
  }
}

/**
 * 백업 파일 유효성 검사
 */
export const validateBackupFile = (data: any): { isValid: boolean; error?: string } => {
  try {
    // 필수 필드 체크
    if (!data || typeof data !== 'object') {
      return { isValid: false, error: '유효하지 않은 백업 파일 형식입니다.' }
    }

    const requiredFields = ['customers', 'products', 'transactions', 'customerProductPrices', 'nextIds', 'metadata']
    for (const field of requiredFields) {
      if (!(field in data)) {
        return { isValid: false, error: `필수 필드가 누락되었습니다: ${field}` }
      }
    }

    // 배열 타입 체크
    const arrayFields = ['customers', 'products', 'transactions', 'customerProductPrices']
    for (const field of arrayFields) {
      if (!Array.isArray(data[field])) {
        return { isValid: false, error: `${field}는 배열이어야 합니다.` }
      }
    }

    // 메타데이터 체크
    if (!data.metadata || typeof data.metadata !== 'object') {
      return { isValid: false, error: '메타데이터가 유효하지 않습니다.' }
    }

    if (!data.metadata.backupDate || !data.metadata.version) {
      return { isValid: false, error: '메타데이터에 필수 정보가 누락되었습니다.' }
    }

    return { isValid: true }
  } catch (error) {
    return { isValid: false, error: '백업 파일 검증 중 오류가 발생했습니다.' }
  }
}

/**
 * 백업 파일에서 데이터 복원
 */
export const importBackup = async (file: File): Promise<{ success: boolean; error?: string; data?: BackupData }> => {
  return new Promise((resolve) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const jsonString = e.target?.result as string
        const data = JSON.parse(jsonString)

        // 유효성 검사
        const validation = validateBackupFile(data)
        if (!validation.isValid) {
          resolve({ success: false, error: validation.error })
          return
        }

        // 백업 데이터 타입 캐스팅
        const backupData = data as BackupData

        resolve({ success: true, data: backupData })
      } catch (error) {
        resolve({ success: false, error: 'JSON 파싱 오류: 파일이 손상되었거나 형식이 올바르지 않습니다.' })
      }
    }

    reader.onerror = () => {
      resolve({ success: false, error: '파일 읽기 오류가 발생했습니다.' })
    }

    reader.readAsText(file)
  })
}

/**
 * localStorage에 백업 데이터 복원
 */
export const restoreBackupData = (backupData: BackupData): void => {
  try {
    // 각 데이터 타입별로 localStorage에 저장
    setToStorage(STORAGE_KEYS.CUSTOMERS, backupData.customers)
    setToStorage(STORAGE_KEYS.PRODUCTS, backupData.products)
    setToStorage(STORAGE_KEYS.TRANSACTIONS, backupData.transactions)
    setToStorage(STORAGE_KEYS.CUSTOMER_PRODUCT_PRICES, backupData.customerProductPrices)
    setToStorage(STORAGE_KEYS.COMPANY, backupData.company)
    setToStorage(STORAGE_KEYS.NEXT_IDS, backupData.nextIds)

    console.log('백업 데이터 복원 완료:', {
      customers: backupData.customers.length,
      products: backupData.products.length,
      transactions: backupData.transactions.length,
      customerProductPrices: backupData.customerProductPrices.length,
      company: backupData.company ? 1 : 0,
      backupDate: backupData.metadata.backupDate
    })
  } catch (error) {
    console.error('데이터 복원 실패:', error)
    throw new Error('데이터 복원 중 오류가 발생했습니다.')
  }
}

/**
 * 자동 백업 활성화 상태 관리
 */
export const isAutoBackupEnabled = (): boolean => {
  return getFromStorage(STORAGE_KEYS.AUTO_BACKUP_ENABLED, true) // 기본값: 활성화
}

export const setAutoBackupEnabled = (enabled: boolean): void => {
  setToStorage(STORAGE_KEYS.AUTO_BACKUP_ENABLED, enabled)
}

/**
 * 마지막 백업 날짜 조회
 */
export const getLastBackupDate = (): string | null => {
  return localStorage.getItem(STORAGE_KEYS.LAST_BACKUP_DATE)
}

/**
 * 오늘 백업이 필요한지 체크
 */
export const shouldBackupToday = (): boolean => {
  if (!isAutoBackupEnabled()) return false
  
  const today = new Date().toISOString().split('T')[0]
  const lastBackupDate = getLastBackupDate()
  
  return lastBackupDate !== today
}

/**
 * 백업 메타데이터 추출 (파일 내용 없이)
 */
export const getBackupMetadata = async (file: File): Promise<{ 
  success: boolean
  metadata?: BackupData['metadata']
  error?: string 
}> => {
  try {
    const result = await importBackup(file)
    if (!result.success || !result.data) {
      return { success: false, error: result.error }
    }

    return { success: true, metadata: result.data.metadata }
  } catch (error) {
    return { success: false, error: '메타데이터 추출 실패' }
  }
}
