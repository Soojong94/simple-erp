import type { User, UserSession, LoginCredentials, RegisterData, LoginResult, RegisterResult } from '../types'

// 스토리지 키들
const STORAGE_KEYS = {
  USERS: 'simple-erp-users',
  SESSIONS: 'simple-erp-sessions',
  COMPANIES: 'simple-erp-companies'
}

// 유틸리티 함수들
const getFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch {
    return defaultValue
  }
}

const setToStorage = <T>(key: string, value: T): void => {
  localStorage.setItem(key, JSON.stringify(value))
}

// 간단한 해시 함수 (실제 환경에서는 bcrypt 등 사용)
const hashPassword = (password: string): string => {
  // 간단한 해시 (실제로는 crypto-js 등 사용해야 함)
  let hash = 0
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // 32비트 정수로 변환
  }
  return hash.toString()
}

// 세션 관리
export const getCurrentSession = (): UserSession | null => {
  const sessions = getFromStorage<UserSession[]>(STORAGE_KEYS.SESSIONS, [])
  return sessions.find(session => session.user_id) || null
}

export const createSession = (user: User): UserSession => {
  const session: UserSession = {
    user_id: user.id!,
    username: user.username,
    display_name: user.display_name,
    company_id: user.company_id,
    role: user.role,
    login_time: new Date().toISOString()
  }
  
  // 기존 세션 제거 후 새 세션 생성
  setToStorage(STORAGE_KEYS.SESSIONS, [session])
  return session
}

// 로그인
export const login = async (credentials: LoginCredentials): Promise<LoginResult> => {
  const users = getFromStorage<User[]>(STORAGE_KEYS.USERS, [])
  
  const user = users.find(u => 
    u.username === credentials.username && 
    u.password_hash === hashPassword(credentials.password) &&
    u.is_active
  )
  
  if (!user) {
    return {
      success: false,
      error: '사용자명 또는 비밀번호가 올바르지 않습니다.'
    }
  }
  
  // 세션 생성
  const session = createSession(user)
  
  // 회사별 데이터 초기화
  initializeCurrentCompanyData()
  
  return {
    success: true,
    session
  }
}

// 회원가입
export const register = async (data: RegisterData): Promise<RegisterResult> => {
  const users = getFromStorage<User[]>(STORAGE_KEYS.USERS, [])
  const companies = getFromStorage(STORAGE_KEYS.COMPANIES, [])
  
  // 사용자명 중복 체크
  if (users.some(u => u.username === data.username)) {
    return {
      success: false,
      error: '이미 사용 중인 사용자명입니다.'
    }
  }
  
  // 새 회사 ID 생성
  const newCompanyId = Math.max(...companies.map((c: any) => c.id || 0), 0) + 1
  
  // 회사 생성
  const newCompany = {
    id: newCompanyId,
    name: data.company_name,
    created_at: new Date().toISOString()
  }
  companies.push(newCompany)
  setToStorage(STORAGE_KEYS.COMPANIES, companies)
  
  // 사용자 생성
  const newUser: User = {
    id: Math.max(...users.map(u => u.id || 0), 0) + 1,
    username: data.username,
    password_hash: hashPassword(data.password),
    display_name: data.display_name,
    email: data.email,
    role: 'admin', // 회사 생성자는 관리자
    company_id: newCompanyId,
    is_active: true,
    created_at: new Date().toISOString()
  }
  
  users.push(newUser)
  setToStorage(STORAGE_KEYS.USERS, users)
  
  return {
    success: true,
    user: newUser
  }
}

// 로그아웃
export const logout = (): void => {
  setToStorage(STORAGE_KEYS.SESSIONS, [])
}

// 로그인 상태 확인
export const isLoggedIn = (): boolean => {
  const session = getCurrentSession()
  return !!session
}

// 회사별 데이터 초기화
export const initializeCurrentCompanyData = (): void => {
  const session = getCurrentSession()
  if (!session) return

  // 현재 회사 데이터 확인
  const companyKey = `simple-erp-c${session.company_id}`
  const existingData = localStorage.getItem(`${companyKey}-customers`)
  
  if (!existingData) {
    console.log(`💡 회사 ${session.company_id} 데이터 초기화`)
    
    // 빈 데이터 구조 생성
    const emptyData = {
      customers: [],
      products: [],
      transactions: [],
      'customer-product-prices': [],
      'product-inventory': [],
      'stock-movements': [],
      'stock-lots': [],
      'next-ids': {
        customers: 1,
        products: 1,
        transactions: 1
      }
    }
    
    // 회사별 데이터 저장
    Object.entries(emptyData).forEach(([key, value]) => {
      localStorage.setItem(`${companyKey}-${key}`, JSON.stringify(value))
    })
    
    // 회사 정보도 생성
    const companies = getFromStorage('simple-erp-companies', [])
    const existingCompany = companies.find((c: any) => c.id === session.company_id)
    if (!existingCompany) {
      companies.push({
        id: session.company_id,
        name: `회사 ${session.company_id}`,
        created_at: new Date().toISOString()
      })
      localStorage.setItem('simple-erp-companies', JSON.stringify(companies))
    }
  }
}

// 데모 데이터 생성 (로그인 시 호출)
export const createDemoData = (): void => {
  // 기본 사용자가 없으면 생성
  const users = getFromStorage(STORAGE_KEYS.USERS, [])
  
  if (users.length === 0) {
    console.log('💡 데모 계정 생성')
    
    const demoUsers = [
      {
        id: 1,
        username: 'admin',
        password_hash: hashPassword('1234'),
        display_name: '관리자',
        email: 'admin@company.com',
        role: 'admin' as const,
        company_id: 1,
        is_active: true,
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        username: 'demo',
        password_hash: hashPassword('1234'),
        display_name: '데모 사용자',
        email: 'demo@company2.com',
        role: 'admin' as const,
        company_id: 2,
        is_active: true,
        created_at: new Date().toISOString()
      }
    ]
    
    setToStorage(STORAGE_KEYS.USERS, demoUsers)
    
    // 회사 정보도 생성
    const companies = [
      {
        id: 1,
        name: '고기유통 주식회사',
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        name: '프리미엄 미트',
        created_at: new Date().toISOString()
      }
    ]
    
    setToStorage('simple-erp-companies', companies)
  }
}