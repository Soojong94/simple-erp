import { generateExcel, SheetData } from './excelGenerator'
import type { TransactionWithItems } from '../../types'

export interface TransactionExcelFilters {
  dateFrom: string
  dateTo: string
  customerId: string
  transactionType: 'all' | 'sales' | 'purchase'
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
  const salesTransactions = transactions.filter(t => t.transaction_type === 'sales')
  const purchaseTransactions = transactions.filter(t => t.transaction_type === 'purchase')
  
  const totalSales = salesTransactions.reduce((sum, t) => sum + t.total_amount, 0)
  const totalPurchase = purchaseTransactions.reduce((sum, t) => sum + t.total_amount, 0)
  const profit = totalSales - totalPurchase
  const totalTax = transactions.reduce((sum, t) => sum + t.tax_amount, 0)
  
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
      구분: t.transaction_type === 'sales' ? '매출' : '매입',
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
        구분: t.transaction_type === 'sales' ? '매출' : '매입',
        상품: item.product_name,
        수량: `${item.quantity}${item.unit}`,
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
    headers: ['거래번호', '거래일', '등록일시', '거래처', '구분', '상품', '수량', '단가', '금액', '이력번호', '원산지', '도축장', '메모']
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
    
    if (t.transaction_type === 'sales') {
      existing.salesCount++
      existing.salesAmount += t.total_amount
    } else {
      existing.purchaseCount++
      existing.purchaseAmount += t.total_amount
    }
    
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
  
  // 6. 시트 5: 수금 내역 (payment 타입)
  const paymentTransactions = transactions.filter(t => t.transaction_type === 'payment')
  const paymentData = paymentTransactions
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
  
  const paymentSheet: SheetData = {
    name: '수금 내역',
    data: paymentData,
    headers: ['거래번호', '입금일', '등록일시', '거래처', '입금금액', '거래증표시여부', '표시거래번호', '메모']
  }
  
  // 7. 시트 6: 거래처별 미수금 현황
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
    
    if (t.transaction_type === 'sales') {
      existing.totalSales += t.total_amount
    } else if (t.transaction_type === 'payment') {
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
  
  // 8. 시트 7: 상품별 집계
  const productMap = new Map<string, { 
    name: string
    count: number
    totalQty: number
    totalAmount: number
  }>()
  
  transactions.forEach(t => {
    (t.items || []).forEach(item => {
      const existing = productMap.get(item.product_name) || { 
        name: item.product_name, 
        count: 0, 
        totalQty: 0, 
        totalAmount: 0
      }
      
      existing.count++
      existing.totalQty += item.quantity
      existing.totalAmount += item.total_price
      
      productMap.set(item.product_name, existing)
    })
  })
  
  const productData = Array.from(productMap.values()).map(p => ({
    상품명: p.name,
    거래건수: p.count,
    판매량: `${p.totalQty.toFixed(1)}kg`,
    총매출: p.totalAmount,
    평균단가: Math.round(p.totalAmount / p.totalQty)
  }))
  
  const productSheet: SheetData = {
    name: '상품별 집계',
    data: productData,
    headers: ['상품명', '거래건수', '판매량', '총매출', '평균단가']
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
  
  // 9. Excel 생성 (수금 및 미수금 시트 추가)
  generateExcel(
    [summarySheet, transactionSummarySheet, detailsSheet, paymentSheet, outstandingSheet, customerSheet, productSheet],
    filename
  )
}
