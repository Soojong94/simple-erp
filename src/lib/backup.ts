import type { Customer, Product, TransactionWithItems, CustomerProductPrice, Company } from '../types'

// Tauri API imports (런타임에서만 import)
let tauriFs: any = null
let tauriPath: any = null
let tauriDialog: any = null

// Tauri 모듈 동적 import
const loadTauriAPIs = async () => {
  try {
    if (typeof window !== 'undefined' && window.__TAURI_IPC__) {
      const [fs, path, dialog] = await Promise.all([
        import('@tauri-apps/api/fs'),
        import('@tauri-apps/api/path'),
        import('@tauri-apps/api/dialog')
      ])
      tauriFs = fs
      tauriPath = path
      tauriDialog = dialog
      return true
    }
  } catch (error) {
    console.warn('Tauri APIs not available:', error)
  }
  return false
}

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

// 백업 파일 정보 타입
export interface BackupFileInfo {
  name: string
  path: string
  size: number
  created: string
  totalRecords?: number
}

// 백업 설정 타입
export interface BackupSettings {
  enabled: boolean
  backupPath: string
}

// localStorage 키 상수 (기존과 동일)
const STORAGE_KEYS = {
  CUSTOMERS: 'simple-erp-customers',
  PRODUCTS: 'simple-erp-products', 
  TRANSACTIONS: 'simple-erp-transactions',
  CUSTOMER_PRODUCT_PRICES: 'simple-erp-customer-product-prices',
  COMPANY: 'simple-erp-company',
  NEXT_IDS: 'simple-erp-next-ids',
  LAST_BACKUP_DATE: 'simple-erp-last-backup-date',
  AUTO_BACKUP_ENABLED: 'simple-erp-auto-backup-enabled',
  BACKUP_SETTINGS: 'simple-erp-backup-settings' // 새 추가
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
 * 백업 설정 관리
 */
export const getBackupSettings = (): BackupSettings => {
  return getFromStorage(STORAGE_KEYS.BACKUP_SETTINGS, {
    enabled: true,
    backupPath: '' // 빈 값이면 미설정 상태
  })
}

export const setBackupSettings = (settings: BackupSettings): void => {
  setToStorage(STORAGE_KEYS.BACKUP_SETTINGS, settings)
}

/**
 * Tauri 환경 체크 및 모듈 로드
 */
export const isTauriEnvironment = (): boolean => {
  return typeof window !== 'undefined' && window.__TAURI_IPC__ !== undefined
}

/**
 * 백업 폴더 선택 대화상자
 */
export const selectBackupFolder = async (): Promise<string | null> => {
  if (!isTauriEnvironment()) {
    alert('폴더 선택은 데스크톱 앱에서만 지원됩니다.')
    return null
  }

  try {
    await loadTauriAPIs()
    if (!tauriDialog || !tauriPath) return null

    const selected = await tauriDialog.open({
      directory: true,
      multiple: false,
      defaultPath: await tauriPath.documentDir(),
      title: 'Simple ERP 백업 폴더 선택'
    })

    return selected as string | null
  } catch (error) {
    console.error('폴더 선택 실패:', error)
    return null
  }
}

/**
 * 모든 ERP 데이터를 수집하여 백업 데이터 객체 생성 (기존과 동일)
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
 * 백업 파일명 생성 (기존과 동일)
 */
export const generateBackupFileName = (): string => {
  const today = new Date().toISOString().split('T')[0]
  return `simple-erp-backup-${today}.json`
}

/**
 * Tauri 환경에서 로컬 폴더에 백업 파일 저장
 */
export const saveBackupToLocalFolder = async (data: BackupData, folderPath: string): Promise<boolean> => {
  try {
    await loadTauriAPIs()
    if (!tauriFs || !tauriPath) return false

    // 백업 폴더가 존재하는지 확인하고 없으면 생성
    const backupFolderExists = await tauriFs.exists(folderPath)
    if (!backupFolderExists) {
      await tauriFs.createDir(folderPath, { recursive: true })
    }

    // 백업 파일 경로 생성
    const fileName = generateBackupFileName()
    const filePath = await tauriPath.join(folderPath, fileName)

    // JSON 데이터를 파일로 저장
    const jsonString = JSON.stringify(data, null, 2)
    await tauriFs.writeTextFile(filePath, jsonString)

    console.log(`💾 로컬 백업 저장 완료: ${filePath}`)
    return true
  } catch (error) {
    console.error('로컬 백업 저장 실패:', error)
    return false
  }
}

/**
 * 브라우저에서 백업 파일 다운로드 (기존 로직)
 */
export const downloadBackupFile = (data: BackupData): boolean => {
  try {
    const jsonString = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = generateBackupFileName()
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    console.log('📥 브라우저 다운로드 완료')
    return true
  } catch (error) {
    console.error('브라우저 다운로드 실패:', error)
    return false
  }
}

/**
 * 통합 백업 함수 - 환경별 분기 처리
 */
export const exportBackup = async (isAutoBackup: boolean = false): Promise<boolean> => {
  try {
    const backupData = collectBackupData()
    let success = false

    if (isTauriEnvironment()) {
      // Tauri 환경: 설정된 로컬 폴더에 저장
      const settings = getBackupSettings()
      
      if (settings.backupPath) {
        success = await saveBackupToLocalFolder(backupData, settings.backupPath)
      } else {
        // 백업 폴더가 설정되지 않았으면 브라우저 다운로드로 fallback
        success = downloadBackupFile(backupData)
      }
    } else {
      // 브라우저 환경: 다운로드 폴더로 저장
      success = downloadBackupFile(backupData)
    }

    if (success) {
      // 백업 날짜 업데이트
      const today = new Date().toISOString().split('T')[0]
      localStorage.setItem(STORAGE_KEYS.LAST_BACKUP_DATE, today)

      console.log(`✅ 백업 완료: ${isAutoBackup ? '자동' : '수동'} 백업`, {
        environment: isTauriEnvironment() ? 'Tauri' : 'Browser',
        records: backupData.metadata.totalRecords,
        date: backupData.metadata.backupDate
      })
    }

    return success
  } catch (error) {
    console.error('백업 실패:', error)
    return false
  }
}

/**
 * 백업 폴더의 파일 목록 조회 (Tauri 전용)
 */
export const listBackupFiles = async (folderPath: string): Promise<BackupFileInfo[]> => {
  if (!isTauriEnvironment()) return []

  try {
    await loadTauriAPIs()
    if (!tauriFs || !tauriPath) return []

    // 폴더 존재 여부 확인
    const folderExists = await tauriFs.exists(folderPath)
    if (!folderExists) return []

    // 폴더 내 파일 목록 읽기
    const entries = await tauriFs.readDir(folderPath)
    const backupFiles: BackupFileInfo[] = []

    for (const entry of entries) {
      // JSON 파일이고 백업 파일명 패턴에 맞는지 체크
      if (entry.name && entry.name.endsWith('.json') && entry.name.includes('simple-erp-backup-')) {
        try {
          const filePath = await tauriPath.join(folderPath, entry.name)
          const metadata = await tauriFs.metadata(filePath)
          
          // 파일 내용에서 메타데이터 추출 (선택사항)
          let totalRecords: number | undefined
          try {
            const fileContent = await tauriFs.readTextFile(filePath)
            const backupData = JSON.parse(fileContent) as BackupData
            totalRecords = backupData.metadata.totalRecords
          } catch {
            // 파일 읽기 실패 시 무시
          }

          backupFiles.push({
            name: entry.name,
            path: filePath,
            size: metadata.size,
            created: new Date(metadata.createdAt * 1000).toISOString(),
            totalRecords
          })
        } catch (error) {
          console.warn(`백업 파일 정보 읽기 실패: ${entry.name}`, error)
        }
      }
    }

    // 생성일 기준 최신순 정렬
    return backupFiles.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())
  } catch (error) {
    console.error('백업 파일 목록 조회 실패:', error)
    return []
  }
}

/**
 * 특정 백업 파일 삭제 (Tauri 전용)
 */
export const deleteBackupFile = async (filePath: string): Promise<boolean> => {
  if (!isTauriEnvironment()) return false

  try {
    await loadTauriAPIs()
    if (!tauriFs) return false

    await tauriFs.removeFile(filePath)
    console.log(`🗑️ 백업 파일 삭제 완료: ${filePath}`)
    return true
  } catch (error) {
    console.error('백업 파일 삭제 실패:', error)
    return false
  }
}

/**
 * 탐색기에서 백업 폴더 열기 (Tauri 전용)
 */
export const openBackupFolderInExplorer = async (folderPath: string): Promise<boolean> => {
  if (!isTauriEnvironment()) return false

  try {
    const { shell } = await import('@tauri-apps/api')
    await shell.open(folderPath)
    return true
  } catch (error) {
    console.error('폴더 열기 실패:', error)
    return false
  }
}

/**
 * 백업 파일 유효성 검사 (기존과 동일)
 */
export const validateBackupFile = (data: any): { isValid: boolean; error?: string } => {
  try {
    if (!data || typeof data !== 'object') {
      return { isValid: false, error: '유효하지 않은 백업 파일 형식입니다.' }
    }

    const requiredFields = ['customers', 'products', 'transactions', 'customerProductPrices', 'nextIds', 'metadata']
    for (const field of requiredFields) {
      if (!(field in data)) {
        return { isValid: false, error: `필수 필드가 누락되었습니다: ${field}` }
      }
    }

    const arrayFields = ['customers', 'products', 'transactions', 'customerProductPrices']
    for (const field of arrayFields) {
      if (!Array.isArray(data[field])) {
        return { isValid: false, error: `${field}는 배열이어야 합니다.` }
      }
    }

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
 * 백업 파일에서 데이터 복원 (기존과 동일)
 */
export const importBackup = async (file: File): Promise<{ success: boolean; error?: string; data?: BackupData }> => {
  return new Promise((resolve) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const jsonString = e.target?.result as string
        const data = JSON.parse(jsonString)

        const validation = validateBackupFile(data)
        if (!validation.isValid) {
          resolve({ success: false, error: validation.error })
          return
        }

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
 * 스키마 마이그레이션: 이전 버전 데이터를 현재 버전에 맞게 변환
 */
const migrateBackupData = (backupData: BackupData): BackupData => {
  console.log('🔄 스키마 마이그레이션 시작...')
  
  // 거래처 마이그레이션
  const migratedCustomers = backupData.customers.map(customer => ({
    ...customer,
    outstanding_balance: customer.outstanding_balance ?? 0,  // 누락된 필드 기본값
    updated_at: customer.updated_at ?? customer.created_at ?? new Date().toISOString()
  }))
  
  // 상품 마이그레이션
  const migratedProducts = backupData.products.map(product => ({
    ...product,
    updated_at: product.updated_at ?? product.created_at ?? new Date().toISOString()
  }))
  
  // 거래 마이그레이션
  const migratedTransactions = backupData.transactions.map(transaction => ({
    ...transaction,
    transaction_type: transaction.transaction_type || 'sales',  // 기본값
    reference_payment_id: transaction.reference_payment_id ?? undefined,
    is_displayed_in_invoice: transaction.is_displayed_in_invoice ?? false,
    displayed_in_transaction_id: transaction.displayed_in_transaction_id ?? undefined
  }))
  
  console.log('✅ 마이그레이션 완료')
  
  return {
    ...backupData,
    customers: migratedCustomers,
    products: migratedProducts,
    transactions: migratedTransactions
  }
}

/**
 * localStorage에 백업 데이터 복원 (마이그레이션 추가)
 */
export const restoreBackupData = (backupData: BackupData): void => {
  try {
    // 스키마 마이그레이션 먼저 수행
    const migratedData = migrateBackupData(backupData)
    
    setToStorage(STORAGE_KEYS.CUSTOMERS, migratedData.customers)
    setToStorage(STORAGE_KEYS.PRODUCTS, migratedData.products)
    setToStorage(STORAGE_KEYS.TRANSACTIONS, migratedData.transactions)
    setToStorage(STORAGE_KEYS.CUSTOMER_PRODUCT_PRICES, migratedData.customerProductPrices)
    setToStorage(STORAGE_KEYS.COMPANY, migratedData.company)
    setToStorage(STORAGE_KEYS.NEXT_IDS, migratedData.nextIds)

    console.log('✅ 백업 데이터 복원 완료:', {
      customers: migratedData.customers.length,
      products: migratedData.products.length,
      transactions: migratedData.transactions.length,
      customerProductPrices: migratedData.customerProductPrices.length,
      company: migratedData.company ? 1 : 0,
      backupDate: migratedData.metadata.backupDate
    })
  } catch (error) {
    console.error('데이터 복원 실패:', error)
    throw new Error('데이터 복원 중 오류가 발생했습니다.')
  }
}

/**
 * 자동 백업 관련 함수들 (기존과 동일)
 */
export const isAutoBackupEnabled = (): boolean => {
  return getFromStorage(STORAGE_KEYS.AUTO_BACKUP_ENABLED, true)
}

export const setAutoBackupEnabled = (enabled: boolean): void => {
  setToStorage(STORAGE_KEYS.AUTO_BACKUP_ENABLED, enabled)
}

export const getLastBackupDate = (): string | null => {
  return localStorage.getItem(STORAGE_KEYS.LAST_BACKUP_DATE)
}

export const shouldBackupToday = (): boolean => {
  if (!isAutoBackupEnabled()) return false
  
  const today = new Date().toISOString().split('T')[0]
  const lastBackupDate = getLastBackupDate()
  
  return lastBackupDate !== today
}

/**
 * 파일 크기를 읽기 쉬운 형태로 변환
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 전체 데이터 삭제 (초기화)
 * - 강제 백업 후 모든 ERP 데이터 삭제
 * - Company, Users, Session은 유지
 */
export const deleteAllData = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('💾 백업 파일 생성 중...')
    
    // 1. 강제 백업 먼저 수행
    const backupSuccess = await exportBackup(false)
    if (!backupSuccess) {
      return { 
        success: false, 
        error: '백업 생성에 실패했습니다. 안전을 위해 삭제를 중단합니다.' 
      }
    }
    
    // 2. 백업 완료 대기 (파일 저장 시간 확보)
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    console.log('🗑️ 전체 데이터 삭제 시작...')
    
    // 3. ERP 데이터 삭제
    localStorage.removeItem(STORAGE_KEYS.CUSTOMERS)
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS)
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS)
    localStorage.removeItem(STORAGE_KEYS.CUSTOMER_PRODUCT_PRICES)
    localStorage.removeItem(STORAGE_KEYS.NEXT_IDS)  // ID 카운터도 초기화
    
    // 4. 백업 관련 설정은 유지
    // STORAGE_KEYS.LAST_BACKUP_DATE - 유지
    // STORAGE_KEYS.AUTO_BACKUP_ENABLED - 유지
    // STORAGE_KEYS.BACKUP_SETTINGS - 유지
    
    // 5. 유지되는 데이터
    // - STORAGE_KEYS.COMPANY (회사 정보)
    // - 'simple-erp-users' (사용자 계정)
    // - 'simple-erp-current-session' (세션)
    
    console.log('✅ 전체 데이터 삭제 완료')
    
    return { success: true }
  } catch (error) {
    console.error('❌ 데이터 삭제 실패:', error)
    return { 
      success: false, 
      error: '데이터 삭제 중 오류가 발생했습니다.' 
    }
  }
}
