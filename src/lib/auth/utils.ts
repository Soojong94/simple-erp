// 🔐 보안 강화된 클라이언트 사이드 인증 시스템
// ⚠️ 참고: 실제 프로덕션에서는 서버 사이드 인증 권장

/**
 * 🆕 Web Crypto API를 사용한 안전한 비밀번호 해싱
 * - PBKDF2 알고리즘 사용 (100,000 iterations)
 * - Salt 포함 (레인보우 테이블 공격 방지)
 * - 출력 형식: salt:hash
 */
export async function hashPasswordSecure(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)

  // Salt 생성 (16 bytes)
  const salt = crypto.getRandomValues(new Uint8Array(16))

  // PBKDF2로 해싱
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    data,
    'PBKDF2',
    false,
    ['deriveBits']
  )

  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  )

  // Salt와 Hash를 Base64로 인코딩
  const saltBase64 = btoa(String.fromCharCode(...salt))
  const hashBase64 = btoa(String.fromCharCode(...new Uint8Array(hashBuffer)))

  return `${saltBase64}:${hashBase64}`
}

/**
 * 🆕 안전한 비밀번호 검증
 */
export async function verifyPasswordSecure(password: string, storedHash: string): Promise<boolean> {
  try {
    const [saltBase64, hashBase64] = storedHash.split(':')
    if (!saltBase64 || !hashBase64) return false

    const encoder = new TextEncoder()
    const data = encoder.encode(password)

    // Salt 디코딩
    const salt = Uint8Array.from(atob(saltBase64), c => c.charCodeAt(0))

    // 입력된 비밀번호를 같은 방식으로 해싱
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      data,
      'PBKDF2',
      false,
      ['deriveBits']
    )

    const hashBuffer = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      256
    )

    const computedHashBase64 = btoa(String.fromCharCode(...new Uint8Array(hashBuffer)))

    return computedHashBase64 === hashBase64
  } catch (error) {
    console.error('비밀번호 검증 오류:', error)
    return false
  }
}

/**
 * ⚠️ 하위 호환성을 위한 레거시 해시 함수
 * - 기존 사용자(admin, demo)를 위해 유지
 * - 새 사용자는 hashPasswordSecure() 사용
 */
export function hashPassword(password: string): string {
  let hash = 0
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(16)
}

/**
 * 🆕 통합 비밀번호 검증 (레거시 + 신규 지원)
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  // 신규 형식 (salt:hash)인지 확인
  if (hash.includes(':')) {
    return await verifyPasswordSecure(password, hash)
  } else {
    // 레거시 형식 (하위 호환성)
    return hashPassword(password) === hash
  }
}

/**
 * 🆕 안전한 세션 토큰 생성 (Web Crypto API)
 * - 암호학적으로 안전한 랜덤 생성
 * - 128-bit UUID v4 방식
 */
export function generateSessionToken(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)

  // UUID v4 형식으로 변환
  array[6] = (array[6] & 0x0f) | 0x40 // version 4
  array[8] = (array[8] & 0x3f) | 0x80 // variant

  const hex = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')

  return `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20)}`
}

/**
 * 세션 만료 시간 계산 (24시간)
 */
export function getSessionExpiry(): string {
  const expiry = new Date()
  expiry.setHours(expiry.getHours() + 24)
  return expiry.toISOString()
}

/**
 * 세션이 유효한지 확인
 */
export function isSessionValid(expiresAt: string): boolean {
  return new Date() < new Date(expiresAt)
}

/**
 * 브루트포스 방지: 로그인 시도 제한
 */
const LOGIN_ATTEMPTS_KEY = 'simple-erp-login-attempts'
const MAX_ATTEMPTS = 5
const LOCKOUT_TIME = 5 * 60 * 1000 // 5분

interface LoginAttempt {
  username: string
  attempts: number
  lastAttempt: number
  lockedUntil?: number
}

export function checkLoginAttempts(username: string): { allowed: boolean; remainingTime?: number } {
  const attempts = JSON.parse(localStorage.getItem(LOGIN_ATTEMPTS_KEY) || '[]') as LoginAttempt[]
  const userAttempt = attempts.find(a => a.username === username)
  
  if (!userAttempt) {
    return { allowed: true }
  }
  
  const now = Date.now()
  
  // 잠금 해제 확인
  if (userAttempt.lockedUntil && now > userAttempt.lockedUntil) {
    userAttempt.attempts = 0
    userAttempt.lockedUntil = undefined
    localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(attempts))
    return { allowed: true }
  }
  
  // 잠금 중인지 확인
  if (userAttempt.lockedUntil && now < userAttempt.lockedUntil) {
    const remainingTime = Math.ceil((userAttempt.lockedUntil - now) / 1000)
    return { allowed: false, remainingTime }
  }
  
  return { allowed: true }
}

export function recordLoginAttempt(username: string, success: boolean): void {
  const attempts = JSON.parse(localStorage.getItem(LOGIN_ATTEMPTS_KEY) || '[]') as LoginAttempt[]
  let userAttempt = attempts.find(a => a.username === username)
  
  if (!userAttempt) {
    userAttempt = { username, attempts: 0, lastAttempt: Date.now() }
    attempts.push(userAttempt)
  }
  
  if (success) {
    // 성공하면 시도 기록 초기화
    userAttempt.attempts = 0
    userAttempt.lockedUntil = undefined
  } else {
    // 실패하면 시도 횟수 증가
    userAttempt.attempts++
    userAttempt.lastAttempt = Date.now()
    
    // 최대 시도 횟수 초과하면 잠금
    if (userAttempt.attempts >= MAX_ATTEMPTS) {
      userAttempt.lockedUntil = Date.now() + LOCKOUT_TIME
    }
  }
  
  localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(attempts))
}
