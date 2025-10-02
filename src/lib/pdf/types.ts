import type { TransactionWithItems, Customer, Company } from '../../types'

/**
 * 거래명세서 하단 입금/미수금 정보
 */
export interface InvoicePaymentInfo {
  입금액: number              // 이번 거래에 반영된 수금액
  미수금: number              // 거래 전 누적 미수금
  합계액: number              // 이번 거래 총액
  현잔액: number              // 입금 후 남은 미수금
  paymentDate?: string       // 수금 일자 (참조 payment 거래가 있을 경우)
}

/**
 * 거래명세서 생성에 필요한 전체 데이터
 */
export interface InvoiceData {
  transaction: TransactionWithItems
  customer: Customer
  company: Company
  paymentInfo: InvoicePaymentInfo
  accountInfo?: string       // 계좌 정보 (메모 또는 company.default_memo에서 추출)
}

/**
 * 거래명세서 템플릿 타입
 */
export type InvoiceTemplate = 'default' | 'v2'

/**
 * PDF 생성 액션 타입
 */
export type PDFAction = 'preview' | 'download' | 'print'
