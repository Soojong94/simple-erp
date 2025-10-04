/**
 * 🔐 입력값 검증 및 XSS 방지 유틸리티
 * - 프로덕션 배포를 위한 보안 강화
 */

/**
 * HTML 엔티티 이스케이프 (XSS 방지)
 */
export function escapeHtml(unsafe: string): string {
  if (typeof unsafe !== 'string') return ''

  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * 숫자만 허용 (금액, 수량 등)
 */
export function sanitizeNumber(value: any): number {
  const num = parseFloat(value)
  return isNaN(num) ? 0 : num
}

/**
 * 양수만 허용
 */
export function sanitizePositiveNumber(value: any): number {
  const num = sanitizeNumber(value)
  return num < 0 ? 0 : num
}

/**
 * 문자열 길이 제한
 */
export function limitLength(str: string, maxLength: number): string {
  if (typeof str !== 'string') return ''
  return str.slice(0, maxLength)
}

/**
 * 이메일 형식 검증
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * 전화번호 형식 검증 (한국)
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^(\d{2,3})-?(\d{3,4})-?(\d{4})$/
  return phoneRegex.test(phone)
}

/**
 * 사업자등록번호 형식 검증
 */
export function isValidBusinessNumber(num: string): boolean {
  const businessRegex = /^\d{3}-?\d{2}-?\d{5}$/
  return businessRegex.test(num)
}

/**
 * SQL 인젝션 패턴 감지 (localStorage용 - 방어적 코딩)
 */
export function containsSqlInjection(str: string): boolean {
  const sqlPatterns = [
    /(\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b)/i,
    /(\bUNION\b|\bJOIN\b|\bWHERE\b)/i,
    /(--|\/\*|\*\/|;)/
  ]

  return sqlPatterns.some(pattern => pattern.test(str))
}

/**
 * 안전한 문자열 입력 (일반 텍스트)
 */
export function sanitizeText(text: string, maxLength: number = 500): string {
  if (typeof text !== 'string') return ''

  // SQL 인젝션 패턴 감지
  if (containsSqlInjection(text)) {
    console.warn('⚠️ SQL 인젝션 패턴 감지됨')
    return ''
  }

  // HTML 이스케이프 및 길이 제한
  return limitLength(escapeHtml(text.trim()), maxLength)
}

/**
 * 사용자명 검증 (영문, 숫자, 언더스코어만)
 */
export function isValidUsername(username: string): boolean {
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
  return usernameRegex.test(username)
}

/**
 * 비밀번호 강도 검증
 */
export interface PasswordStrength {
  isValid: boolean
  score: number // 0-4
  feedback: string[]
}

export function checkPasswordStrength(password: string): PasswordStrength {
  const feedback: string[] = []
  let score = 0

  if (password.length < 4) {
    return {
      isValid: false,
      score: 0,
      feedback: ['비밀번호는 최소 4자 이상이어야 합니다.']
    }
  }

  // 길이
  if (password.length >= 8) score++
  if (password.length >= 12) score++

  // 복잡도
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
    score++
  } else {
    feedback.push('대소문자를 모두 포함하면 더 안전합니다.')
  }

  if (/\d/.test(password)) {
    score++
  } else {
    feedback.push('숫자를 포함하면 더 안전합니다.')
  }

  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score++
  } else {
    feedback.push('특수문자를 포함하면 더 안전합니다.')
  }

  return {
    isValid: true,
    score: Math.min(score, 4),
    feedback
  }
}

/**
 * 날짜 형식 검증 (YYYY-MM-DD)
 */
export function isValidDate(dateStr: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(dateStr)) return false

  const date = new Date(dateStr)
  return date instanceof Date && !isNaN(date.getTime())
}

/**
 * 파일 확장자 검증 (이미지)
 */
export function isValidImageExtension(filename: string): boolean {
  const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'))
  return validExtensions.includes(ext)
}

/**
 * 파일 크기 검증
 */
export function isValidFileSize(bytes: number, maxMB: number = 5): boolean {
  const maxBytes = maxMB * 1024 * 1024
  return bytes <= maxBytes
}
