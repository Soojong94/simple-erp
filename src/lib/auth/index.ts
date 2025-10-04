import type { User, UserSession, LoginCredentials, RegisterData, DeleteAccountResult } from '../../types'
import { hashPassword, verifyPassword, generateSessionToken, getSessionExpiry, isSessionValid, checkLoginAttempts, recordLoginAttempt } from './utils'

// localStorage 키
const STORAGE_KEYS = {
  USERS: 'simple-erp-users',
  SESSIONS: 'simple-erp-sessions', 
  CURRENT_SESSION: 'simple-erp-current-session',
  COMPANIES: 'simple-erp-companies'
} as const

// 헬퍼 함수
const getFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch {
    return defaultValue
  }
}

const setToStorage = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error('localStorage 저장 실패:', error)
  }
}

// ID 자동 증가
const getNextId = (entityType: string): number => {
  const nextIds = getFromStorage('simple-erp-next-ids', {})
  const nextId = (nextIds[entityType] || 1)
  nextIds[entityType] = nextId + 1
  setToStorage('simple-erp-next-ids', nextIds)
  return nextId
}

/**
 * 현재 세션 조회
 */
export function getCurrentSession(): UserSession | null {
  const sessionData = getFromStorage<UserSession | null>(STORAGE_KEYS.CURRENT_SESSION, null)
  
  if (!sessionData) return null
  
  // 세션 만료 확인
  if (!isSessionValid(sessionData.expires_at)) {
    logout()
    return null
  }
  
  return sessionData
}

/**
 * 로그인 상태 확인
 */
export function isLoggedIn(): boolean {
  return getCurrentSession() !== null
}

/**
 * 로그인
 */
export async function login(credentials: LoginCredentials): Promise<{
  success: boolean
  session?: UserSession
  error?: string
}> {
  const { username, password, remember_me } = credentials
  
  // 브루트포스 방지 체크
  const attemptCheck = checkLoginAttempts(username)
  if (!attemptCheck.allowed) {
    return {
      success: false,
      error: `너무 많은 로그인 시도로 인해 ${Math.ceil((attemptCheck.remainingTime || 0) / 60)}분간 잠금되었습니다.`
    }
  }
  
  // 사용자 조회
  const users = getFromStorage<User[]>(STORAGE_KEYS.USERS, [])
  const user = users.find(u => u.username === username && u.is_active)
  
  if (!user) {
    recordLoginAttempt(username, false)
    return {
      success: false,
      error: '사용자를 찾을 수 없거나 비활성화된 계정입니다.'
    }
  }
  
  // 비밀번호 확인
  if (!verifyPassword(password, user.password_hash)) {
    recordLoginAttempt(username, false)
    return {
      success: false,
      error: '비밀번호가 올바르지 않습니다.'
    }
  }
  
  // 로그인 성공
  recordLoginAttempt(username, true)
  
  // 세션 생성
  const session: UserSession = {
    user_id: user.id,
    username: user.username,
    display_name: user.display_name,
    company_id: user.company_id,
    role: user.role,
    login_time: new Date().toISOString(),
    expires_at: getSessionExpiry()
  }
  
  // 세션 저장
  setToStorage(STORAGE_KEYS.CURRENT_SESSION, session)
  
  // 로그인 시간 업데이트
  user.last_login = session.login_time
  const userIndex = users.findIndex(u => u.id === user.id)
  users[userIndex] = user
  setToStorage(STORAGE_KEYS.USERS, users)
  
  
  return {
    success: true,
    session
  }
}

/**
 * 회원가입
 */
export async function register(data: RegisterData): Promise<{
  success: boolean
  user?: User
  error?: string
}> {
  const { username, password, display_name, company_name, email } = data
  
  // 입력 검증
  if (!username || username.length < 3) {
    return { success: false, error: '사용자명은 3자 이상이어야 합니다.' }
  }
  
  if (!password || password.length < 4) {
    return { success: false, error: '비밀번호는 4자 이상이어야 합니다.' }
  }
  
  if (!display_name || !company_name) {
    return { success: false, error: '표시명과 회사명은 필수입니다.' }
  }
  
  // 중복 확인
  const users = getFromStorage<User[]>(STORAGE_KEYS.USERS, [])
  if (users.some(u => u.username === username)) {
    return { success: false, error: '이미 존재하는 사용자명입니다.' }
  }
  
  // 회사 생성
  const companies = getFromStorage(STORAGE_KEYS.COMPANIES, [])
  const newCompany = {
    id: getNextId('company'),
    name: company_name,
    created_at: new Date().toISOString(),
    created_by: username
  }
  companies.push(newCompany)
  setToStorage(STORAGE_KEYS.COMPANIES, companies)
  
  // 사용자 생성
  const newUser: User = {
    id: getNextId('user'),
    username,
    display_name,
    email,
    password_hash: hashPassword(password),
    role: 'admin', // 첫 번째 사용자는 관리자
    company_id: newCompany.id,
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

/**
 * 로그아웃
 */
export function logout(): void {
  localStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION)
}

/**
 * 회사별 localStorage 키 생성
 */
export function getCompanyStorageKey(entity: string): string {
  const session = getCurrentSession()
  if (!session) {
    throw new Error('로그인이 필요합니다.')
  }
  return `simple-erp-c${session.company_id}-${entity}`
}

/**
 * 사용자 목록 조회 (관리자만)
 */
export function getCompanyUsers(): User[] {
  const session = getCurrentSession()
  if (!session) return []
  
  const users = getFromStorage<User[]>(STORAGE_KEYS.USERS, [])
  return users.filter(u => u.company_id === session.company_id)
}

/**
 * 관리자 권한 확인
 */
export function isAdmin(): boolean {
  const session = getCurrentSession()
  return session?.role === 'admin'
}

/**
 * 회원 탈퇴
 * - admin과 demo 계정은 삭제 불가
 * - 탈퇴 시 해당 회사의 모든 데이터도 함께 삭제 (자동 백업)
 */
export async function deleteAccount(password: string): Promise<{
  success: boolean
  error?: string
}> {
  const session = getCurrentSession()
  
  if (!session) {
    console.error('❌ 세션이 없음!')
    return { success: false, error: '로그인이 필요합니다.' }
  }
  
  // 1. 사용자 조회
  const users = getFromStorage<User[]>(STORAGE_KEYS.USERS, [])
  const user = users.find(u => u.id === session.user_id)
  
  if (!user) {
    return { success: false, error: '사용자를 찾을 수 없습니다.' }
  }
  
  // 2. admin과 demo 계정 보호
  if (user.username === 'admin' || user.username === 'demo') {
    return { 
      success: false, 
      error: 'admin과 demo 계정은 삭제할 수 없습니다.' 
    }
  }
  
  // 3. 비밀번호 확인
  if (!verifyPassword(password, user.password_hash)) {
    return { success: false, error: '비밀번호가 올바르지 않습니다.' }
  }
  
  
  // 4. 탈퇴 전 자동 백업
  try {
    const { exportBackup } = await import('../backup')
    await exportBackup(false)
  } catch (backupError) {
    console.warn('⚠️ 백업 실패 (계속 진행):', backupError)
  }
  
  // 5. 회사 데이터 삭제 (회사별 localStorage 키)
  const companyId = user.company_id
  const dataKeys = [
    `simple-erp-c${companyId}-customers`,
    `simple-erp-c${companyId}-products`,
    `simple-erp-c${companyId}-transactions`,
    `simple-erp-c${companyId}-customer-product-prices`,
    `simple-erp-c${companyId}-company`,
    `simple-erp-c${companyId}-next-ids`
  ]
  
  dataKeys.forEach(key => {
    localStorage.removeItem(key)
  })
  
  
  // 5. 전역 companies 배열에서 회사 제거
  try {
    const companies = getFromStorage<any[]>('simple-erp-companies', [])
    const updatedCompanies = companies.filter(c => c.id !== companyId)
    setToStorage('simple-erp-companies', updatedCompanies)
  } catch (e) {
    console.warn('전역 companies 제거 실패:', e)
  }
  
  // 6. 사용자 삭제
  const updatedUsers = users.filter(u => u.id !== user.id)
  setToStorage(STORAGE_KEYS.USERS, updatedUsers)
  
  
  // 7. 로그아웃
  logout()
  
  return { success: true }
}

/**
 * 데모 데이터 생성 (개발용)
 */
export function createDemoData(): void {
  const users = getFromStorage<User[]>(STORAGE_KEYS.USERS, [])

  // admin과 demo 계정이 없으면 복구
  const hasAdmin = users.some(u => u.username === 'admin')
  const hasDemo = users.some(u => u.username === 'demo')

  if (!hasAdmin || !hasDemo) {

    const companies = getFromStorage<any[]>(STORAGE_KEYS.COMPANIES, [])

    // 회사 1, 2가 없으면 생성
    if (!companies.some(c => c.id === 1)) {
      companies.push({ id: 1, name: '고기유통 주식회사', created_at: new Date().toISOString(), created_by: 'admin' })
    }
    if (!companies.some(c => c.id === 2)) {
      companies.push({ id: 2, name: '농협 축산물', created_at: new Date().toISOString(), created_by: 'demo' })
    }
    setToStorage(STORAGE_KEYS.COMPANIES, companies)

    // admin 계정 복구
    if (!hasAdmin) {
      users.push({
        id: 1,  // 고정 ID
        username: 'admin',
        display_name: '관리자',
        email: 'admin@meat.co.kr',
        password_hash: hashPassword('1234'),
        role: 'admin',
        company_id: 1,
        is_active: true,
        created_at: new Date().toISOString()
      })
    }

    // demo 계정 복구
    if (!hasDemo) {
      users.push({
        id: 2,  // 고정 ID
        username: 'demo',
        display_name: '데모 사용자',
        email: 'demo@example.com',
        password_hash: hashPassword('1234'),
        role: 'admin',
        company_id: 2,
        is_active: true,
        created_at: new Date().toISOString()
      })
    }

    setToStorage(STORAGE_KEYS.USERS, users)

    // user ID와 company ID 카운터를 3부터 시작하도록 설정
    const nextIds = getFromStorage('simple-erp-next-ids', {})
    if (!nextIds['user'] || nextIds['user'] < 3) {
      nextIds['user'] = 3
    }
    if (!nextIds['company'] || nextIds['company'] < 3) {
      nextIds['company'] = 3
    }
    setToStorage('simple-erp-next-ids', nextIds)

  }
}


