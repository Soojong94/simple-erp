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
  
  console.log(`✅ ${user.display_name} 로그인 성공 (회사 ID: ${user.company_id})`)
  
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
  
  console.log(`✅ 새 회사 '${company_name}' 및 관리자 '${display_name}' 생성 완료`)
  
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
  console.log('✅ 로그아웃 완료')
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
 * - 비밀번호 확인 후 계정 비활성화
 * - 마지막 사용자인 경우 탈퇴 불가
 */
export async function deleteAccount(password: string): Promise<{
  success: boolean
  error?: string
}> {
  const session = getCurrentSession()
  if (!session) {
    return { success: false, error: '로그인이 필요합니다.' }
  }
  
  // 1. 비밀번호 확인
  const users = getFromStorage<User[]>(STORAGE_KEYS.USERS, [])
  const user = users.find(u => u.id === session.user_id)
  
  if (!user) {
    return { success: false, error: '사용자를 찾을 수 없습니다.' }
  }
  
  if (!verifyPassword(password, user.password_hash)) {
    return { success: false, error: '비밀번호가 올바르지 않습니다.' }
  }
  
  // 2. 회사의 다른 활성 사용자 존재 여부 확인
  const companyUsers = users.filter(u => 
    u.company_id === session.company_id && u.is_active
  )
  
  if (companyUsers.length === 1) {
    // 마지막 사용자일 경우
    return { 
      success: false, 
      error: '회사의 마지막 계정입니다. 전체 데이터 삭제를 사용하세요.' 
    }
  }
  
  // 3. 사용자 비활성화 (삭제하지 않고 is_active = false)
  user.is_active = false
  const userIndex = users.findIndex(u => u.id === user.id)
  users[userIndex] = user
  setToStorage(STORAGE_KEYS.USERS, users)
  
  console.log(`🗑️ 계정 비활성화: ${user.display_name} (ID: ${user.id})`)
  
  // 4. 로그아웃
  logout()
  
  return { success: true }
}

/**
 * 데모 데이터 생성 (개발용)
 */
export function createDemoData(): void {
  const users = getFromStorage<User[]>(STORAGE_KEYS.USERS, [])
  
  if (users.length === 0) {
    // 데모 회사 생성
    const companies = [
      { id: 1, name: '고기유통 주식회사', created_at: new Date().toISOString(), created_by: 'admin' },
      { id: 2, name: '농협 축산물', created_at: new Date().toISOString(), created_by: 'demo' }
    ]
    setToStorage(STORAGE_KEYS.COMPANIES, companies)
    
    // 데모 사용자 생성
    const demoUsers: User[] = [
      {
        id: 1,
        username: 'admin',
        display_name: '관리자',
        email: 'admin@meat.co.kr',
        password_hash: hashPassword('1234'),
        role: 'admin',
        company_id: 1,
        is_active: true,
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        username: 'demo',
        display_name: '데모 사용자',
        email: 'demo@example.com',
        password_hash: hashPassword('1234'),
        role: 'admin',
        company_id: 2,
        is_active: true,
        created_at: new Date().toISOString()
      }
    ]
    
    setToStorage(STORAGE_KEYS.USERS, demoUsers)
    
    // ID 카운터 초기화
    setToStorage('simple-erp-next-ids', {
      user: 3,
      company: 3,
      customer: 1,
      product: 1,
      transaction: 1
    })
    
    console.log('✅ 데모 데이터 생성 완료')
    console.log('로그인 정보: admin/1234 또는 demo/1234')
  }
}


