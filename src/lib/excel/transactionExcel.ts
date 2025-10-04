import { generateExcel, SheetData } from './excelGenerator'
import type { TransactionWithItems } from '../../types'

export interface TransactionExcelFilters {
  dateFrom: string
  dateTo: string
  customerId: string
  transactionType: 'all' | 'sales' | 'purchase' | 'payment_in' | 'payment_out'
  searchQuery?: string
}

/**
 * 거래 내역 Excel 생성
 */
export function generateTransactionExcel(
  transactions: TransactionWithItems[],
  filters: TransactionExcelFilters
): void {
  // 1. 통계 계산
  const salesTransactions = transactions.filter(t =>
    t.transaction_type === 'sales' || (t.transaction_type as string) === 'sale'
  )
  const purchaseTransactions = transactions.filter(t => t.transaction_type === 'purchase')
  const paymentInTransactions = transactions.filter(t =>
    t.transaction_type === 'payment_in' || (t.transaction_type as string) === 'payment'
  )
  const paymentOutTransactions = transactions.filter(t => t.transaction_type === 'payment_out')

  const totalSales = salesTransactions.reduce((sum, t) => sum + t.total_amount, 0)
  const totalPurchase = purchaseTransactions.reduce((sum, t) => sum + t.total_amount, 0)
  const totalPaymentIn = paymentInTransactions.reduce((sum, t) => sum + t.total_amount, 0)
  const totalPaymentOut = paymentOutTransactions.reduce((sum, t) => sum + t.total_amount, 0)
  const profit = totalSales - totalPurchase
  const totalTax = [...salesTransactions, ...purchaseTransactions].reduce((sum, t) => sum + t.tax_amount, 0)
  
  // 2. 시트 1: 통계 요약
  const summarySheet: SheetData = {
    name: '통계 요약',
    summaryRows: [
      {
        cells: [{ value: '거래 내역 통계 보고서', colSpan: 4 }],
        style: 'title'
      },
      {
        cells: [
          { value: `기간: ${filters.dateFrom || '전체'} ~ ${filters.dateTo || '전체'}`, colSpan: 4 }
        ]
      },
      {
        cells: [
          { value: `생성일: ${new Date().toISOString().split('T')[0]}`, colSpan: 4 }
        ]
      }
    ],
    data: [
      {
        구분: '💰 매출',
        건수: salesTransactions.length,
        금액: totalSales,
        부가세: salesTransactions.reduce((sum, t) => sum + t.tax_amount, 0)
      },
      {
        구분: '📦 매입',
        건수: purchaseTransactions.length,
        금액: totalPurchase,
        부가세: purchaseTransactions.reduce((sum, t) => sum + t.tax_amount, 0)
      },
      {
        구분: '💵 수금',
        건수: paymentInTransactions.length,
        금액: totalPaymentIn,
        부가세: '-'
      },
      {
        구분: '💸 지급',
        건수: paymentOutTransactions.length,
        금액: totalPaymentOut,
        부가세: '-'
      },
      {
        구분: '━━━━━',
        건수: '━━━━',
        금액: '━━━━━━━━━',
        부가세: '━━━━━━━━━'
      },
      {
        구분: '📈 순이익',
        건수: '-',
        금액: profit,
        부가세: '-'
      },
      {
        구분: '💵 총 부가세',
        건수: '-',
        금액: '-',
        부가세: totalTax
      }
    ],
    headers: ['구분', '건수', '금액', '부가세']
  }
  
  // 3. 시트 2: 거래 요약 (한 건당 한 줄)
  const summaryData = transactions
    .sort((a, b) => {
      // created_at 기준 오름차순 정렬 (오래된 것부터)
      const timeA = new Date(a.created_at || a.transaction_date).getTime()
      const timeB = new Date(b.created_at || b.transaction_date).getTime()
      return timeA - timeB
    })
    .map(t => ({
      거래번호: t.id,
      거래일: t.transaction_date,
      등록일시: t.created_at ? new Date(t.created_at).toLocaleString('ko-KR', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      }).replace(/\. /g, '-').replace('.', '') : '-',
      거래처: t.customer_name,
      구분: t.transaction_type === 'sales' || (t.transaction_type as string) === 'sale' ? '매출'
          : t.transaction_type === 'purchase' ? '매입'
          : t.transaction_type === 'payment_in' || (t.transaction_type as string) === 'payment' ? '수금'
          : t.transaction_type === 'payment_out' ? '지급'
          : `기타(${t.transaction_type})`,  // 디버깅용
      상품수: t.items?.length || 0,
      공급가액: t.total_amount - t.tax_amount,
      부가세: t.tax_amount,
      총금액: t.total_amount,
      메모: t.notes || '-'
    }))
  
  const transactionSummarySheet: SheetData = {
    name: '거래 요약',
    data: summaryData,
    headers: ['거래번호', '거래일', '등록일시', '거래처', '구분', '상품수', '공급가액', '부가세', '총금액', '메모']
  }
  
  // 4. 시트 3: 거래 상세 (상품별)
  const detailsData = transactions
    .sort((a, b) => {
      // created_at 기준 오름차순 정렬
      const timeA = new Date(a.created_at || a.transaction_date).getTime()
      const timeB = new Date(b.created_at || b.transaction_date).getTime()
      return timeA - timeB
    })
    .flatMap(t => 
      (t.items || []).map(item => ({
        거래번호: t.id,
        거래일: t.transaction_date,
        등록일시: t.created_at ? new Date(t.created_at).toLocaleString('ko-KR', { 
          year: 'numeric', 
          month: '2-digit', 
          day: '2-digit', 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        }).replace(/\. /g, '-').replace('.', '') : '-',
        거래처: t.customer_name,
        구분: t.transaction_type === 'sales' || (t.transaction_type as string) === 'sale' ? '매출'
            : t.transaction_type === 'purchase' ? '매입'
            : t.transaction_type === 'payment_in' || (t.transaction_type as string) === 'payment' ? '수금'
            : t.transaction_type === 'payment_out' ? '지급'
            : `기타(${t.transaction_type})`,  // 디버깅용
        상품: item.product_name,
        수량: item.quantity,
        단위: item.unit,
        단가: item.unit_price,
        금액: item.total_price,
        이력번호: item.traceability_number || '-',
        원산지: item.origin || '-',                  // ✅ 원산지 추가
        도축장: item.slaughterhouse || '-',          // ✅ 도축장 추가
        메모: item.notes || '-'
      }))
    )
  
  const detailsSheet: SheetData = {
    name: '거래 상세',
    data: detailsData,
    headers: ['거래번호', '거래일', '등록일시', '거래처', '구분', '상품', '수량', '단위', '단가', '금액', '이력번호', '원산지', '도축장', '메모']
  }
  
  // 5. 시트 4: 거래처별 집계
  const customerMap = new Map<string, { 
    name: string
    salesCount: number
    salesAmount: number
    purchaseCount: number
    purchaseAmount: number 
  }>()
  
  transactions.forEach(t => {
    const existing = customerMap.get(t.customer_name) || {
      name: t.customer_name,
      salesCount: 0,
      salesAmount: 0,
      purchaseCount: 0,
      purchaseAmount: 0
    }

    if (t.transaction_type === 'sales' || (t.transaction_type as string) === 'sale') {
      existing.salesCount++
      existing.salesAmount += t.total_amount
    } else if (t.transaction_type === 'purchase') {
      existing.purchaseCount++
      existing.purchaseAmount += t.total_amount
    }
    // payment_in, payment_out은 집계에서 제외

    customerMap.set(t.customer_name, existing)
  })
  
  const customerData = Array.from(customerMap.values()).map(c => ({
    거래처명: c.name,
    매출건수: c.salesCount,
    매출금액: c.salesAmount,
    매입건수: c.purchaseCount,
    매입금액: c.purchaseAmount,
    순이익: c.salesAmount - c.purchaseAmount
  }))
  
  const customerSheet: SheetData = {
    name: '거래처별 집계',
    data: customerData,
    headers: ['거래처명', '매출건수', '매출금액', '매입건수', '매입금액', '순이익']
  }
  
  // 6. 시트 5: 수금 내역 (payment_in 타입)
  const paymentInTxns = transactions.filter(t =>
    t.transaction_type === 'payment_in' || (t.transaction_type as string) === 'payment'
  )
  const paymentInData = paymentInTxns
    .sort((a, b) => {
      const timeA = new Date(a.created_at || a.transaction_date).getTime()
      const timeB = new Date(b.created_at || b.transaction_date).getTime()
      return timeA - timeB
    })
    .map(t => ({
      거래번호: t.id,
      입금일: t.transaction_date,
      등록일시: t.created_at ? new Date(t.created_at).toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).replace(/\. /g, '-').replace('.', '') : '-',
      거래처: t.customer_name,
      입금금액: t.total_amount,
      거래증표시여부: t.is_displayed_in_invoice ? '표시됨' : '미표시',
      표시거래번호: t.displayed_in_transaction_id || '-',
      메모: t.notes || '-'
    }))

  const paymentInSheet: SheetData = {
    name: '수금 내역',
    data: paymentInData,
    headers: ['거래번호', '입금일', '등록일시', '거래처', '입금금액', '거래증표시여부', '표시거래번호', '메모']
  }

  // 7. 시트 6: 지급 내역 (payment_out 타입)
  const paymentOutTxns = transactions.filter(t => t.transaction_type === 'payment_out')
  const paymentOutData = paymentOutTxns
    .sort((a, b) => {
      const timeA = new Date(a.created_at || a.transaction_date).getTime()
      const timeB = new Date(b.created_at || b.transaction_date).getTime()
      return timeA - timeB
    })
    .map(t => ({
      거래번호: t.id,
      지급일: t.transaction_date,
      등록일시: t.created_at ? new Date(t.created_at).toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).replace(/\. /g, '-').replace('.', '') : '-',
      거래처: t.customer_name,
      지급금액: t.total_amount,
      거래증표시여부: t.is_displayed_in_invoice ? '표시됨' : '미표시',
      표시거래번호: t.displayed_in_transaction_id || '-',
      메모: t.notes || '-'
    }))

  const paymentOutSheet: SheetData = {
    name: '지급 내역',
    data: paymentOutData,
    headers: ['거래번호', '지급일', '등록일시', '거래처', '지급금액', '거래증표시여부', '표시거래번호', '메모']
  }

  // 8. 시트 7: 거래처별 미수금 현황 (고객)
  const customersData: any[] = []

  // 거래처별로 미수금 계산
  const outstandingMap = new Map<string, {
    name: string
    totalSales: number      // 총 매출
    totalPayment: number    // 총 수금
    outstanding: number     // 미수금 = 매출 - 수금
  }>()
  
  transactions.forEach(t => {
    const existing = outstandingMap.get(t.customer_name) || {
      name: t.customer_name,
      totalSales: 0,
      totalPayment: 0,
      outstanding: 0
    }

    if (t.transaction_type === 'sales' || (t.transaction_type as string) === 'sale') {
      existing.totalSales += t.total_amount
    } else if (t.transaction_type === 'payment_in' || (t.transaction_type as string) === 'payment') {
      existing.totalPayment += t.total_amount
    }

    existing.outstanding = existing.totalSales - existing.totalPayment
    outstandingMap.set(t.customer_name, existing)
  })
  
  const outstandingData = Array.from(outstandingMap.values())
    .filter(c => c.totalSales > 0)  // 매출이 있는 것만
    .map(c => ({
      거래처명: c.name,
      총매출: c.totalSales,
      총수금: c.totalPayment,
      미수금: c.outstanding,
      수금률: c.totalSales > 0 ? `${((c.totalPayment / c.totalSales) * 100).toFixed(1)}%` : '0%'
    }))
    .sort((a, b) => b.미수금 - a.미수금)  // 미수금 높은 순
  
  const outstandingSheet: SheetData = {
    name: '미수금 현황',
    data: outstandingData,
    headers: ['거래처명', '총매출', '총수금', '미수금', '수금률']
  }

  // 9. 시트 8: 거래처별 미지급금 현황 (공급업체)
  const payableMap = new Map<string, {
    name: string
    totalPurchase: number    // 총 매입
    totalPaymentOut: number  // 총 지급
    payable: number          // 미지급금 = 매입 - 지급
  }>()

  transactions.forEach(t => {
    const existing = payableMap.get(t.customer_name) || {
      name: t.customer_name,
      totalPurchase: 0,
      totalPaymentOut: 0,
      payable: 0
    }

    if (t.transaction_type === 'purchase') {
      existing.totalPurchase += t.total_amount
    } else if (t.transaction_type === 'payment_out') {
      existing.totalPaymentOut += t.total_amount
    }

    existing.payable = existing.totalPurchase - existing.totalPaymentOut
    payableMap.set(t.customer_name, existing)
  })

  const payableData = Array.from(payableMap.values())
    .filter(c => c.totalPurchase > 0)  // 매입이 있는 것만
    .map(c => ({
      거래처명: c.name,
      총매입: c.totalPurchase,
      총지급: c.totalPaymentOut,
      미지급금: c.payable,
      지급률: c.totalPurchase > 0 ? `${((c.totalPaymentOut / c.totalPurchase) * 100).toFixed(1)}%` : '0%'
    }))
    .sort((a, b) => b.미지급금 - a.미지급금)  // 미지급금 높은 순

  const payableSheet: SheetData = {
    name: '미지급금 현황',
    data: payableData,
    headers: ['거래처명', '총매입', '총지급', '미지급금', '지급률']
  }

  // 10. 시트 9: 상품별 집계 (매입/매출 분리)
  const productMap = new Map<string, {
    name: string
    purchaseCount: number     // 매입 건수
    purchaseQty: number       // 매입 수량
    purchaseAmount: number    // 매입 금액
    salesCount: number        // 매출 건수
    salesQty: number          // 매출 수량
    salesAmount: number       // 매출 금액
  }>()
  
  transactions.forEach(t => {
    // 수금/지급 거래는 상품이 없으므로 제외
    if (t.transaction_type === 'payment_in' || t.transaction_type === 'payment_out' || (t.transaction_type as string) === 'payment') {
      return
    }

    const isPurchase = t.transaction_type === 'purchase'
    const isSales = t.transaction_type === 'sales' || (t.transaction_type as string) === 'sale'

    ;(t.items || []).forEach(item => {
      const existing = productMap.get(item.product_name) || {
        name: item.product_name,
        purchaseCount: 0,
        purchaseQty: 0,
        purchaseAmount: 0,
        salesCount: 0,
        salesQty: 0,
        salesAmount: 0
      }

      if (isPurchase) {
        existing.purchaseCount++
        existing.purchaseQty += item.quantity
        existing.purchaseAmount += item.total_price
      } else if (isSales) {
        existing.salesCount++
        existing.salesQty += item.quantity
        existing.salesAmount += item.total_price
      }

      productMap.set(item.product_name, existing)
    })
  })

  const productData = Array.from(productMap.values()).map(p => ({
    상품명: p.name,
    매입건수: p.purchaseCount,
    매입수량: p.purchaseQty > 0 ? `${p.purchaseQty.toFixed(1)}kg` : '-',
    매입금액: p.purchaseAmount,
    매출건수: p.salesCount,
    매출수량: p.salesQty > 0 ? `${p.salesQty.toFixed(1)}kg` : '-',
    매출금액: p.salesAmount,
    순이익: p.salesAmount - p.purchaseAmount
  }))

  const productSheet: SheetData = {
    name: '상품별 집계',
    data: productData,
    headers: ['상품명', '매입건수', '매입수량', '매입금액', '매출건수', '매출수량', '매출금액', '순이익']
  }
  
  // 6. 파일명 생성
  let filename = '거래내역'
  
  if (filters.dateFrom && filters.dateTo) {
    filename += `_${filters.dateFrom}_${filters.dateTo}`
  } else if (filters.dateFrom) {
    filename += `_${filters.dateFrom}부터`
  } else if (filters.dateTo) {
    filename += `_${filters.dateTo}까지`
  }
  
  const today = new Date().toISOString().split('T')[0]
  filename += `_${today}.xlsx`

  // 11. Excel 생성 (모든 시트 포함)
  generateExcel(
    [
      summarySheet,           // 1. 통계 요약
      transactionSummarySheet, // 2. 거래 요약
      detailsSheet,           // 3. 거래 상세
      customerSheet,          // 4. 거래처별 집계
      productSheet,           // 5. 상품별 집계 (매입/매출 분리)
      paymentInSheet,         // 6. 수금 내역
      paymentOutSheet,        // 7. 지급 내역
      outstandingSheet,       // 8. 미수금 현황
      payableSheet            // 9. 미지급금 현황
    ],
    filename
  )
}
