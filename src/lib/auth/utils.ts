// 간단한 클라이언트 사이드 인증 시스템
// 실제 프로덕션에서는 서버 사이드 인증 필요

/**
 * 간단한 해시 함수 (실제로는 bcrypt 등 사용해야 함)
 */
export function hashPassword(password: string): string {
  // 실제로는 crypto.subtle.digest나 bcrypt 사용
  let hash = 0
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // 32비트 정수로 변환
  }
  return Math.abs(hash).toString(16)
}

/**
 * 비밀번호 검증
 */
export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash
}

/**
 * 세션 토큰 생성
 */
export function generateSessionToken(): string {
  return Math.random().toString(36).substr(2) + Date.now().toString(36)
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
