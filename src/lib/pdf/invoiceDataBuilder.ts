import type { TransactionWithItems, Customer, Company } from '../../types'
import type { InvoiceData, InvoicePaymentInfo } from './types'
import { transactionAPI } from '../tauri'

/**
 * 거래명세서 출력을 위한 데이터 준비
 * - 수금 정보 조회
 * - 입금/미수금 계산
 * - 계좌 정보 추출
 */
export async function prepareInvoiceData(
  transaction: TransactionWithItems,
  company: Company,
  customer: Customer
): Promise<InvoiceData> {
  
  const paymentInfo = await calculatePaymentInfo(transaction, customer)
  const accountInfo = extractAccountInfo(transaction.notes, company.default_invoice_memo)
  
  return {
    transaction,
    customer,
    company,
    paymentInfo,
    accountInfo
  }
}

/**
 * 입금/미수금 정보 계산
 */
async function calculatePaymentInfo(
  transaction: TransactionWithItems,
  customer: Customer
): Promise<InvoicePaymentInfo> {
  
  // 매출 거래인 경우에만 입금/미수금 계산
  if (transaction.transaction_type === 'sales') {
    
    // 1️⃣ 수금 정보 조회
    let 입금액 = 0
    let paymentDate: string | undefined
    
    if (transaction.reference_payment_id) {
      try {
        const payment = await transactionAPI.getById(transaction.reference_payment_id)
        if (payment) {
          입금액 = payment.total_amount
          paymentDate = payment.transaction_date
        }
      } catch (error) {
        console.error('수금 정보 조회 실패:', error)
      }
    }
    
    // 2️⃣ 계산
    const 미수금 = customer.outstanding_balance || 0  // 거래 전 누적 미수금
    const 합계액 = transaction.total_amount           // 이번 거래 총액
    const 현잔액 = 미수금 - 입금액 + 합계액             // 입금 후 남은 미수금
    
    return {
      입금액,
      미수금,
      합계액,
      현잔액,
      paymentDate
    }
  }
  
  // 매입 거래는 입금/미수금 표시 안 함
  return {
    입금액: 0,
    미수금: 0,
    합계액: transaction.total_amount,
    현잔액: 0
  }
}

/**
 * 메모에서 계좌 정보 추출
 * 예: "계좌: 301-9500-6464-21(김영주) / 광주은행130-121-005724(김영주)"
 */
function extractAccountInfo(
  transactionNotes?: string,
  companyMemo?: string
): string {
  const text = transactionNotes || companyMemo || ''
  
  if (!text) return ''
  
  // "계좌:" 또는 "계좌번호:" 패턴 찾기
  const accountPattern = /계좌[번호]*\s*[:：]\s*([^\n]+)/i
  const match = text.match(accountPattern)
  
  if (match) {
    return match[1].trim()
  }
  
  // 계좌 패턴이 없으면 전체 메모 반환 (첫 줄만)
  const firstLine = text.split('\n')[0]
  return firstLine.length > 100 ? firstLine.substring(0, 100) + '...' : firstLine
}

/**
 * 월/일 형식으로 변환
 * "2025-09-28" -> "09/28"
 */
export function formatMonthDay(dateString: string): string {
  try {
    const date = new Date(dateString)
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${month}/${day}`
  } catch {
    return ''
  }
}

/**
 * 세액 계산 (공급가액의 10%)
 */
export function calculateTax(supplyAmount: number): number {
  return Math.round(supplyAmount * 0.1)
}
