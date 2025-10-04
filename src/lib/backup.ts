import type { Customer, Product, TransactionWithItems, CustomerProductPrice, Company } from '../types'
import { getCurrentSession } from './auth/index'

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
// ✅ 회사 정보 포함: 백업 출처를 추적하기 위함
export interface BackupData {
  // 🆕 백업한 회사 정보
  companyInfo: {
    companyId: number           // 백업 생성 시 회사 ID
    companyName: string         // 회사명 (참고용)
    backupDate: string          // 백업 날짜
  }

  // 회사별 데이터 (ID 그대로 유지)
  customers: Customer[]
  products: Product[]
  transactions: TransactionWithItems[]
  customerProductPrices: CustomerProductPrice[]
  nextIds: Record<string, number>

  metadata: {
    backupDate: string
    version: string
    totalRecords: number
    appVersion: string
    sourceCompanyId: number     // 🆕 어느 회사에서 백업했는지
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

// 🔥 백업 설정은 전역 (회사 구분 없음)
const GLOBAL_BACKUP_KEYS = {
  LAST_BACKUP_DATE: 'simple-erp-last-backup-date',
  AUTO_BACKUP_ENABLED: 'simple-erp-auto-backup-enabled',
  BACKUP_SETTINGS: 'simple-erp-backup-settings'
} as const

// 💡 백업 로그 유틸리티
const BackupLogger = {
  info: (message: string, data?: any) => {
  },
  success: (message: string, data?: any) => {
  },
  warn: (message: string, data?: any) => {
    console.warn(`⚠️ [BACKUP] ${message}`, data !== undefined ? data : '')
  },
  error: (message: string, data?: any) => {
    console.error(`❌ [BACKUP] ${message}`, data !== undefined ? data : '')
  },
  debug: (step: string, data: any) => {
  },
  step: (step: number, message: string) => {
  }
}

// localStorage 키 상수 - 회사별 데이터용
const getStorageKeys = () => {
  BackupLogger.step(1, 'getStorageKeys() 호출됨')

  // ✅ localStorage에서 직접 세션 읽기
  let companyId: number | undefined

  try {
    const sessionData = localStorage.getItem('simple-erp-current-session')
    BackupLogger.debug('localStorage 세션 데이터', sessionData)

    if (sessionData) {
      const parsedSession = JSON.parse(sessionData)
      companyId = parsedSession?.company_id
      if (companyId) {
        BackupLogger.success(`localStorage에서 companyId 찾음: ${companyId}`)
      }
    }
  } catch (e) {
    BackupLogger.error('localStorage 읽기 실패', e)
  }

  // ✅ fallback: getCurrentSession() 시도
  if (!companyId) {
    BackupLogger.info('getCurrentSession() fallback 시도')
    const session = getCurrentSession()
    companyId = session?.company_id
    if (companyId) {
      BackupLogger.success(`getCurrentSession()에서 companyId 찾음: ${companyId}`)
    } else {
      BackupLogger.warn('getCurrentSession()에서도 companyId 없음')
    }
  }

  // 🔥 중요: 기본값 사용 (에러를 던지지 않음)
  const finalCompanyId = companyId || 1

  if (!companyId) {
    BackupLogger.warn(`companyId 없음 - 기본값(1) 사용`)
  }

  const keys = {
    CUSTOMERS: `simple-erp-c${finalCompanyId}-customers`,
    PRODUCTS: `simple-erp-c${finalCompanyId}-products`,
    TRANSACTIONS: `simple-erp-c${finalCompanyId}-transactions`,
    CUSTOMER_PRODUCT_PRICES: `simple-erp-c${finalCompanyId}-customer-product-prices`,
    COMPANY: `simple-erp-c${finalCompanyId}-company`,
    NEXT_IDS: `simple-erp-c${finalCompanyId}-next-ids`
  } as const

  BackupLogger.debug('생성된 스토리지 키', keys)

  return keys
}

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
  try {
    // 🔥 전역 키 사용 (companyId 불필요)
    return getFromStorage(GLOBAL_BACKUP_KEYS.BACKUP_SETTINGS, {
      enabled: true,
      backupPath: '' // 빈 값이면 미설정 상태
    })
  } catch (error) {
    console.error('백업 설정 읽기 실패:', error)
    return { enabled: true, backupPath: '' }
  }
}

export const setBackupSettings = (settings: BackupSettings): void => {
  try {
    // 🔥 전역 키 사용
    setToStorage(GLOBAL_BACKUP_KEYS.BACKUP_SETTINGS, settings)
  } catch (error) {
    console.error('백업 설정 저장 실패:', error)
  }
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
 * 모든 ERP 데이터를 수집하여 백업 데이터 객체 생성
 * ✅ 회사 정보 포함: 백업 출처를 추적
 */
export const collectBackupData = (): BackupData => {
  BackupLogger.step(2, '백업 데이터 수집 시작')

  try {
    const STORAGE_KEYS = getStorageKeys()
    const session = getCurrentSession()

    if (!session) {
      BackupLogger.error('세션이 없어서 백업 불가능')
      throw new Error('로그인 후 백업을 생성해주세요.')
    }

    BackupLogger.info(`회사 ${session.company_id} 데이터 백업 중`, {
      companyId: session.company_id,
      username: session.username,
      keys: STORAGE_KEYS
    })

    // 🆕 회사 정보 조회
    const company = getFromStorage<Company | null>(STORAGE_KEYS.COMPANY, null)
    BackupLogger.debug('회사 정보', company)

    const customers = getFromStorage<Customer[]>(STORAGE_KEYS.CUSTOMERS, [])
    const products = getFromStorage<Product[]>(STORAGE_KEYS.PRODUCTS, [])
    const transactions = getFromStorage<TransactionWithItems[]>(STORAGE_KEYS.TRANSACTIONS, [])
    const customerProductPrices = getFromStorage<CustomerProductPrice[]>(STORAGE_KEYS.CUSTOMER_PRODUCT_PRICES, [])
    const nextIds = getFromStorage<Record<string, number>>(STORAGE_KEYS.NEXT_IDS, {})

    const totalRecords = customers.length + products.length + transactions.length + customerProductPrices.length

    BackupLogger.success('데이터 수집 완료', {
      customers: customers.length,
      products: products.length,
      transactions: transactions.length,
      prices: customerProductPrices.length,
      totalRecords
    })

    const backupDate = new Date().toISOString()

    const backupData: BackupData = {
      // 🆕 백업 출처 정보
      companyInfo: {
        companyId: session.company_id,
        companyName: company?.name || `회사 ${session.company_id}`,
        backupDate
      },
      customers,
      products,
      transactions,
      customerProductPrices,
      nextIds,
      metadata: {
        backupDate,
        version: '1.0.0',
        totalRecords,
        appVersion: 'Simple ERP v1.0',
        sourceCompanyId: session.company_id  // 🆕
      }
    }

    BackupLogger.debug('최종 백업 데이터', {
      companyInfo: backupData.companyInfo,
      metadata: backupData.metadata,
      dataCounts: {
        customers: backupData.customers.length,
        products: backupData.products.length,
        transactions: backupData.transactions.length
      }
    })

    return backupData
  } catch (error) {
    BackupLogger.error('백업 데이터 수집 실패', error)
    throw error
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
      // 백업 날짜 업데이트 - 🔥 전역 키 사용
      const today = new Date().toISOString().split('T')[0]
      localStorage.setItem(GLOBAL_BACKUP_KEYS.LAST_BACKUP_DATE, today)
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
 * 백업 파일 유효성 검사
 * ✅ companyInfo 검증 추가
 */
export const validateBackupFile = (data: any): { isValid: boolean; error?: string } => {
  BackupLogger.step(3, '백업 파일 검증 시작')

  try {
    if (!data || typeof data !== 'object') {
      BackupLogger.error('유효하지 않은 데이터 타입', typeof data)
      return { isValid: false, error: '유효하지 않은 백업 파일 형식입니다.' }
    }

    BackupLogger.debug('검증할 데이터', {
      hasCompanyInfo: !!data.companyInfo,
      hasMetadata: !!data.metadata,
      fields: Object.keys(data)
    })

    // 🆕 companyInfo 검증 추가
    const requiredFields = ['companyInfo', 'customers', 'products', 'transactions', 'customerProductPrices', 'nextIds', 'metadata']
    for (const field of requiredFields) {
      if (!(field in data)) {
        BackupLogger.error(`필드 누락: ${field}`)
        return { isValid: false, error: `필수 필드가 누락되었습니다: ${field}` }
      }
    }

    // companyInfo 구조 검증
    if (!data.companyInfo || typeof data.companyInfo !== 'object') {
      BackupLogger.error('companyInfo가 객체가 아님', data.companyInfo)
      return { isValid: false, error: 'companyInfo가 유효하지 않습니다.' }
    }

    if (!data.companyInfo.companyId || !data.companyInfo.companyName) {
      BackupLogger.error('companyInfo 필수 필드 누락', data.companyInfo)
      return { isValid: false, error: 'companyInfo에 필수 정보가 누락되었습니다.' }
    }

    const arrayFields = ['customers', 'products', 'transactions', 'customerProductPrices']
    for (const field of arrayFields) {
      if (!Array.isArray(data[field])) {
        BackupLogger.error(`${field}가 배열이 아님`, typeof data[field])
        return { isValid: false, error: `${field}는 배열이어야 합니다.` }
      }
    }

    if (!data.metadata || typeof data.metadata !== 'object') {
      BackupLogger.error('메타데이터가 객체가 아님', data.metadata)
      return { isValid: false, error: '메타데이터가 유효하지 않습니다.' }
    }

    if (!data.metadata.backupDate || !data.metadata.version) {
      BackupLogger.error('메타데이터 필수 필드 누락', data.metadata)
      return { isValid: false, error: '메타데이터에 필수 정보가 누락되었습니다.' }
    }

    BackupLogger.success('백업 파일 검증 통과', {
      companyId: data.companyInfo.companyId,
      companyName: data.companyInfo.companyName,
      totalRecords: data.metadata.totalRecords
    })

    return { isValid: true }
  } catch (error) {
    BackupLogger.error('백업 파일 검증 중 예외 발생', error)
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
  BackupLogger.step(4, '스키마 마이그레이션 시작')

  BackupLogger.debug('마이그레이션 전 데이터', {
    customersCount: backupData.customers.length,
    productsCount: backupData.products.length,
    transactionsCount: backupData.transactions.length,
    companyInfo: backupData.companyInfo
  })

  const now = new Date().toISOString()
  
  // 거래처 마이그레이션
  const migratedCustomers = backupData.customers.map(customer => {
    const oldCustomer = customer as any  // 구버전 필드 접근을 위한 타입 단언
    return {
      ...customer,
      type: customer.type || 'customer',  // 기본값
      outstanding_balance: customer.outstanding_balance ?? 0,
      is_active: customer.is_active ?? true,  // 기본값
      created_at: customer.created_at ?? now,
      updated_at: customer.updated_at ?? customer.created_at ?? now,
      // 선택적 필드 보장
      business_number: customer.business_number ?? null,
      ceo_name: customer.ceo_name ?? null,
      contact_person: customer.contact_person ?? null,
      phone: customer.phone ?? null,
      email: customer.email ?? null,
      address: customer.address ?? null,
      business_type: customer.business_type ?? null,  // 🆕 업태
      business_item: customer.business_item ?? null   // 🆕 종목
    }
  })
  
  // 상품 마이그레이션
  const migratedProducts = backupData.products.map(product => ({
    ...product,
    is_active: product.is_active ?? true,  // 중요: 누락된 필드
    unit: product.unit || 'kg',  // 기본값
    created_at: product.created_at ?? now,
    updated_at: product.updated_at ?? product.created_at ?? now,
    // 선택적 필드 보장
    code: product.code ?? null,
    category: product.category ?? null,
    unit_price: product.unit_price ?? null,
    description: product.description ?? null
  }))
  
  // 거래 마이그레이션
  const migratedTransactions = backupData.transactions.map(transaction => {
    const oldTransaction = transaction as any  // 구버전 필드 접근을 위한 타입 단언
    return {
      ...transaction,
      transaction_type: transaction.transaction_type || 'sales',
      created_at: transaction.created_at ?? now,
      // 선택적 필드 보장
      reference_payment_id: transaction.reference_payment_id ?? null,
      is_displayed_in_invoice: transaction.is_displayed_in_invoice ?? false,
      displayed_in_transaction_id: transaction.displayed_in_transaction_id ?? null,
      notes: transaction.notes ?? null,
      // items 배열 보장 및 마이그레이션
      items: (transaction.items || []).map(item => ({
        ...item,
        unit: item.unit ?? 'kg'
      }))
    }
  })
  
  // CustomerProductPrice 마이그레이션
  const migratedCustomerProductPrices = (backupData.customerProductPrices || []).map(price => {
    const oldPrice = price as any  // 구버전 필드 접근을 위한 타입 단언
    return {
      ...price,
      last_updated: price.last_updated ?? oldPrice.created_at ?? now,
      is_active: price.is_active ?? true
    }
  })
  
  const migratedData = {
    ...backupData,
    customers: migratedCustomers,
    products: migratedProducts,
    transactions: migratedTransactions,
    customerProductPrices: migratedCustomerProductPrices
  }

  BackupLogger.success('마이그레이션 완료', {
    customers: migratedCustomers.length,
    products: migratedProducts.length,
    transactions: migratedTransactions.length,
    prices: migratedCustomerProductPrices.length
  })

  BackupLogger.debug('마이그레이션 후 샘플 데이터', {
    sampleCustomer: migratedCustomers[0],
    sampleProduct: migratedProducts[0],
    sampleTransaction: migratedTransactions[0]
  })

  return migratedData
}

/**
 * localStorage에 백업 데이터 복원
 * ✅ 현재 로그인한 회사의 데이터로 복원 (ID 그대로 덮어쓰기)
 */
export const restoreBackupData = (backupData: BackupData): void => {
  BackupLogger.step(5, '백업 데이터 복원 시작')

  try {
    // ✅ 현재 로그인한 회사의 스토리지 키 사용
    const STORAGE_KEYS = getStorageKeys()
    const session = getCurrentSession()

    if (!session) {
      BackupLogger.error('세션이 없어서 복원 불가능')
      throw new Error('로그인 후 복원해주세요.')
    }

    BackupLogger.info('복원 대상 회사 정보', {
      targetCompanyId: session.company_id,
      targetUsername: session.username,
      sourceCompanyId: backupData.companyInfo.companyId,
      sourceCompanyName: backupData.companyInfo.companyName,
      isSameCompany: session.company_id === backupData.companyInfo.companyId
    })

    BackupLogger.debug('복원할 데이터', {
      customers: backupData.customers.length,
      products: backupData.products.length,
      transactions: backupData.transactions.length,
      backupDate: backupData.companyInfo.backupDate
    })

    // 복원 전 현재 데이터 확인
    const beforeRestore = {
      customers: getFromStorage(STORAGE_KEYS.CUSTOMERS, []).length,
      products: getFromStorage(STORAGE_KEYS.PRODUCTS, []).length,
      transactions: getFromStorage(STORAGE_KEYS.TRANSACTIONS, []).length
    }
    BackupLogger.info('복원 전 현재 데이터', beforeRestore)

    // 스키마 마이그레이션 먼저 수행
    BackupLogger.step(6, '스키마 마이그레이션 실행')
    const migratedData = migrateBackupData(backupData)

    // ✅ 거래처, 상품, 거래 데이터 복원 (ID 그대로 덮어쓰기)
    BackupLogger.step(7, 'localStorage에 데이터 저장 중')

    setToStorage(STORAGE_KEYS.CUSTOMERS, migratedData.customers)
    BackupLogger.info(`CUSTOMERS 저장 완료: ${STORAGE_KEYS.CUSTOMERS}`, {
      count: migratedData.customers.length,
      sampleIds: migratedData.customers.slice(0, 3).map(c => c.id)
    })

    setToStorage(STORAGE_KEYS.PRODUCTS, migratedData.products)
    BackupLogger.info(`PRODUCTS 저장 완료: ${STORAGE_KEYS.PRODUCTS}`, {
      count: migratedData.products.length,
      sampleIds: migratedData.products.slice(0, 3).map(p => p.id)
    })

    setToStorage(STORAGE_KEYS.TRANSACTIONS, migratedData.transactions)
    BackupLogger.info(`TRANSACTIONS 저장 완료: ${STORAGE_KEYS.TRANSACTIONS}`, {
      count: migratedData.transactions.length,
      sampleIds: migratedData.transactions.slice(0, 3).map(t => t.id)
    })

    setToStorage(STORAGE_KEYS.CUSTOMER_PRODUCT_PRICES, migratedData.customerProductPrices)
    BackupLogger.info(`CUSTOMER_PRODUCT_PRICES 저장 완료`, {
      count: migratedData.customerProductPrices.length
    })

    setToStorage(STORAGE_KEYS.NEXT_IDS, migratedData.nextIds)
    BackupLogger.info(`NEXT_IDS 저장 완료`, migratedData.nextIds)

    // ❌ 회사 정보는 복원하지 않음 (현재 회사 정보 유지)
    BackupLogger.info('회사 정보는 유지 (복원하지 않음)')

    // 복원 후 확인
    const afterRestore = {
      customers: getFromStorage(STORAGE_KEYS.CUSTOMERS, []).length,
      products: getFromStorage(STORAGE_KEYS.PRODUCTS, []).length,
      transactions: getFromStorage(STORAGE_KEYS.TRANSACTIONS, []).length
    }
    BackupLogger.info('복원 후 현재 데이터', afterRestore)

    // 복원 전후 비교
    BackupLogger.debug('복원 전후 비교', {
      before: beforeRestore,
      after: afterRestore,
      diff: {
        customers: afterRestore.customers - beforeRestore.customers,
        products: afterRestore.products - beforeRestore.products,
        transactions: afterRestore.transactions - beforeRestore.transactions
      }
    })

    BackupLogger.success('백업 데이터 복원 완료', {
      customers: migratedData.customers.length,
      products: migratedData.products.length,
      transactions: migratedData.transactions.length,
      customerProductPrices: migratedData.customerProductPrices.length,
      backupDate: migratedData.metadata.backupDate,
      savedToCompany: session.company_id,
      savedToKeys: {
        customers: STORAGE_KEYS.CUSTOMERS,
        products: STORAGE_KEYS.PRODUCTS,
        transactions: STORAGE_KEYS.TRANSACTIONS
      }
    })
  } catch (error) {
    BackupLogger.error('데이터 복원 실패', error)
    throw new Error('데이터 복원 중 오류가 발생했습니다.')
  }
}

/**
 * 자동 백업 관련 함수들
 */
export const isAutoBackupEnabled = (): boolean => {
  try {
    // 🔥 전역 키 사용 (companyId 불필요)
    return getFromStorage(GLOBAL_BACKUP_KEYS.AUTO_BACKUP_ENABLED, true)
  } catch (error) {
    console.error('자동 백업 설정 읽기 실패:', error)
    return true  // 기본값 반환
  }
}

export const setAutoBackupEnabled = (enabled: boolean): void => {
  try {
    // 🔥 전역 키 사용
    setToStorage(GLOBAL_BACKUP_KEYS.AUTO_BACKUP_ENABLED, enabled)
  } catch (error) {
    console.error('자동 백업 설정 저장 실패:', error)
  }
}

export const getLastBackupDate = (): string | null => {
  try {
    // 🔥 전역 키 사용
    return localStorage.getItem(GLOBAL_BACKUP_KEYS.LAST_BACKUP_DATE)
  } catch (error) {
    console.error('마지막 백업 날짜 읽기 실패:', error)
    return null
  }
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
    
    
    // 3. ERP 데이터 삭제
    const STORAGE_KEYS = getStorageKeys()
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
    
    
    return { success: true }
  } catch (error) {
    console.error('❌ 데이터 삭제 실패:', error)
    return { 
      success: false, 
      error: '데이터 삭제 중 오류가 발생했습니다.' 
    }
  }
}
