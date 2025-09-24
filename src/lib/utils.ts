// 유틸리티 함수들

// 숫자를 원화 형식으로 포맷
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
  }).format(amount)
}

// 숫자를 콤마가 포함된 문자열로 변환
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('ko-KR').format(num)
}

// 날짜를 YYYY-MM-DD 형식으로 포맷
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toISOString().split('T')[0]
}

// 날짜를 한국어 형식으로 포맷
export function formatDateKorean(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// 세금 계산 (10% VAT)
export function calculateTax(amount: number): number {
  return Math.round(amount * 0.1)
}

// 공급가액 + 세금 = 총액
export function calculateTotal(supplyAmount: number): {
  supplyAmount: number
  taxAmount: number
  totalAmount: number
} {
  const taxAmount = calculateTax(supplyAmount)
  return {
    supplyAmount,
    taxAmount,
    totalAmount: supplyAmount + taxAmount
  }
}

// 클래스명 조건부 결합
export function cn(...classes: (string | undefined | null | boolean)[]): string {
  return classes.filter(Boolean).join(' ')
}

// 사업자번호 형식 검증
export function validateBusinessNumber(businessNumber: string): boolean {
  const cleaned = businessNumber.replace(/[-\s]/g, '')
  if (cleaned.length !== 10) return false
  
  const digits = cleaned.split('').map(Number)
  const weights = [1, 3, 7, 1, 3, 7, 1, 3, 5]
  
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += digits[i] * weights[i]
  }
  
  sum += Math.floor((digits[8] * 5) / 10)
  const checkDigit = (10 - (sum % 10)) % 10
  
  return checkDigit === digits[9]
}

// 이메일 형식 검증
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// 파일 다운로드
export async function downloadFile(blob: Blob, filename: string): Promise<void> {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// 디바운스 함수 (자동 백업용)
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    
    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}
