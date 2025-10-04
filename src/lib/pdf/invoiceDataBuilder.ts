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
 *
 * 로직:
 * 1. 현재 거래의 미수금 = 이전 거래의 현잔액
 * 2. 현재 거래의 입금액 = 선택한 수금 거래 금액 (reference_payment_id)
 * 3. 현재 거래의 현잔액 = 미수금 + 합계액 - 입금액
 */
async function calculatePaymentInfo(
  transaction: TransactionWithItems,
  customer: Customer
): Promise<InvoicePaymentInfo> {

  // 🎯 해당 거래처의 모든 거래를 시간순으로 조회
  const allTransactions = await transactionAPI.getAll()
  const customerTransactions = allTransactions
    .filter(t => t.customer_id === customer.id)
    .sort((a, b) => {
      // 날짜순 정렬, 같은 날이면 ID순
      const dateCompare = new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()
      if (dateCompare !== 0) return dateCompare
      return (a.id || 0) - (b.id || 0)
    })

  // 🎯 현재 거래의 미수금 = 이전 모든 거래의 누적 현잔액
  // 각 이전 거래의 (매출 - 입금)을 누적
  // ⚠️ 같은 수금이 여러 매출에 연결되어 있을 수 있으므로 Set으로 중복 방지
  let 미수금 = 0
  const 사용된_수금 = new Set<number>()

  console.log(`\n📊 [${transaction.id}번 거래] 미수금 계산 시작:`)

  for (const t of customerTransactions) {
    // 현재 거래에 도달하면 중단
    if (t.id === transaction.id) break

    // 매출 거래: 미수금 증가
    if (t.transaction_type === 'sales') {
      const 이전_미수금 = 미수금
      미수금 = 미수금 + t.total_amount

      // 이 매출에 연결된 입금액이 있고, 아직 사용 안 한 수금이면 차감
      if (t.reference_payment_id && !사용된_수금.has(t.reference_payment_id)) {
        const payment = customerTransactions.find(p => p.id === t.reference_payment_id)
        if (payment) {
          미수금 = 미수금 - payment.total_amount
          사용된_수금.add(t.reference_payment_id)
          console.log(`  거래 ${t.id}: ${이전_미수금} + 매출 ${t.total_amount} - 입금 ${payment.total_amount} = ${미수금}`)
        } else {
          console.log(`  거래 ${t.id}: ${이전_미수금} + 매출 ${t.total_amount} = ${미수금} (수금 못 찾음)`)
        }
      } else if (t.reference_payment_id && 사용된_수금.has(t.reference_payment_id)) {
        console.log(`  거래 ${t.id}: ${이전_미수금} + 매출 ${t.total_amount} = ${미수금} (수금 중복)`)
      } else {
        console.log(`  거래 ${t.id}: ${이전_미수금} + 매출 ${t.total_amount} = ${미수금}`)
      }
    }
  }

  console.log(`  → 현재 거래의 미수금: ${미수금}\n`)

  // 매출 거래인 경우
  if (transaction.transaction_type === 'sales') {
    // 1️⃣ 현재 거래의 입금액 = reference_payment_id가 있고, 이전 거래에서 사용 안 했으면
    let 입금액 = 0
    let paymentDate: string | undefined

    if (transaction.reference_payment_id) {
      // ✅ 이미 사용된 수금이면 입금액 0으로 처리
      if (사용된_수금.has(transaction.reference_payment_id)) {
        console.warn(`⚠️ 거래 ${transaction.id}의 수금 ${transaction.reference_payment_id}은 이미 다른 거래에서 사용됨`)
        입금액 = 0
      } else {
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
    }

    // 2️⃣ 계산
    const 합계액 = transaction.total_amount
    const 현잔액 = 미수금 + 합계액 - 입금액

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
