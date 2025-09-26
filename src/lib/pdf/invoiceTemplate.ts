import jsPDF from 'jspdf'
import { INVOICE_LAYOUT, PDF_COLORS, PDF_FONTS } from './pdfConfig'
import type { TransactionWithItems, Company, Customer } from '../../types'
import { formatCurrency } from '../utils'

export function renderInvoiceSection(
  doc: jsPDF,
  transaction: TransactionWithItems,
  company: Company,
  customer: Customer | undefined,
  startY: number
) {
  let y = startY

  // 1. 제목
  doc.setFontSize(INVOICE_LAYOUT.title.fontSize)
  doc.setFont(PDF_FONTS.bold)
  doc.text(
    INVOICE_LAYOUT.title.text, 
    105, 
    y + INVOICE_LAYOUT.title.y, 
    { align: 'center' }
  )
  y += 30

  // 2. 공급자 정보 박스 (좌측)
  const supplierBox = INVOICE_LAYOUT.infoBox.supplier
  doc.setFontSize(10)
  doc.setFont(PDF_FONTS.bold)
  doc.text('【공급자】', supplierBox.x, y)
  
  doc.setFont(PDF_FONTS.normal)
  doc.text(`상    호: ${company.name}`, supplierBox.x, y + 7)
  doc.text(`주    소: ${company.address}`, supplierBox.x, y + 14)
  doc.text(`사업자번호: ${company.business_number}`, supplierBox.x, y + 21)
  doc.text(`대 표 자: ${company.ceo_name}`, supplierBox.x, y + 28)
  doc.text(`전화번호: ${company.phone}`, supplierBox.x, y + 35)

  // 3. 도장 이미지 (중앙)
  const stampImage = localStorage.getItem('simple-erp-stamp-image')
  if (stampImage) {
    try {
      doc.addImage(
        stampImage,
        'PNG',
        INVOICE_LAYOUT.infoBox.stamp.x,
        y,
        INVOICE_LAYOUT.infoBox.stamp.width,
        INVOICE_LAYOUT.infoBox.stamp.height
      )
    } catch (e) {
      console.error('도장 이미지 로드 실패:', e)
      // 도장 없을 때 텍스트로 대체
      doc.setDrawColor(255, 0, 0)
      doc.circle(110, y + 15, 12, 'S')
      doc.setTextColor(255, 0, 0)
      doc.text('인', 110, y + 18, { align: 'center' })
      doc.setTextColor(0, 0, 0)
    }
  } else {
    // 도장 이미지가 없을 때 기본 텍스트 도장
    doc.setDrawColor(255, 0, 0)
    doc.circle(110, y + 15, 12, 'S')
    doc.setTextColor(255, 0, 0)
    doc.text('인', 110, y + 18, { align: 'center' })
    doc.setTextColor(0, 0, 0)
  }

  // 4. 구매자 정보 박스 (우측)
  const customerBox = INVOICE_LAYOUT.infoBox.customer
  doc.setFont(PDF_FONTS.bold)
  doc.text('【구매자】', customerBox.x, y)
  
  doc.setFont(PDF_FONTS.normal)
  if (customer) {
    doc.text(`상    호: ${customer.name}`, customerBox.x, y + 7)
    doc.text(`주    소: ${customer.address || '-'}`, customerBox.x, y + 14)
    doc.text(`사업자번호: ${customer.business_number || '-'}`, customerBox.x, y + 21)
    doc.text(`대 표 자: ${customer.contact_person || '-'}`, customerBox.x, y + 28)
    doc.text(`전화번호: ${customer.phone || '-'}`, customerBox.x, y + 35)
  }

  y += 50

  // 5. 거래 정보
  doc.setFontSize(12)
  doc.text(`거래일: ${transaction.transaction_date}`, 20, y)
  doc.text(`거래번호: #${transaction.id}`, 130, y)
  y += 10

  // 6. 상품 테이블
  const table = INVOICE_LAYOUT.table
  
  // 테이블 헤더
  doc.setFontSize(table.fontSize)
  doc.setFont(PDF_FONTS.bold)
  doc.rect(20, y, 170, table.rowHeight)  // 헤더 박스
  
  let x = 20
  table.headers.forEach((header, i) => {
    doc.text(header, x + 2, y + 5)
    x += table.columnWidths[i]
  })
  y += table.rowHeight

  // 테이블 본문
  doc.setFont(PDF_FONTS.normal)
  const items = transaction.items || []
  
  for (let i = 0; i < table.maxRows; i++) {
    // 테두리
    doc.rect(20, y, 170, table.rowHeight)
    
    if (i < items.length) {
      const item = items[i]
      let x = 20
      
      // 품목
      doc.text(item.product_name, x + 2, y + 5)
      x += table.columnWidths[0]
      
      // 이력번호
      doc.text(item.traceability_number || '-', x + 2, y + 5)
      x += table.columnWidths[1]
      
      // 수량
      doc.text(`${item.quantity}${item.unit}`, x + 2, y + 5)
      x += table.columnWidths[2]
      
      // 단가
      doc.text(formatCurrency(item.unit_price), x + table.columnWidths[3] - 2, y + 5, { align: 'right' })
      x += table.columnWidths[3]
      
      // 금액
      doc.text(formatCurrency(item.total_price), x + table.columnWidths[4] - 2, y + 5, { align: 'right' })
    }
    
    y += table.rowHeight
  }

  y += 5

  // 7. 합계 영역
  const summary = INVOICE_LAYOUT.summary
  const supplyPrice = transaction.total_amount - transaction.tax_amount
  
  doc.setFontSize(summary.fontSize)
  doc.text(`공급가액: ${formatCurrency(supplyPrice)}`, summary.x, y, { align: 'right' })
  y += summary.lineHeight
  doc.text(`부 가 세: ${formatCurrency(transaction.tax_amount)}`, summary.x, y, { align: 'right' })
  y += summary.lineHeight
  
  doc.line(summary.x - 50, y, summary.x, y)  // 구분선
  y += summary.lineHeight
  
  doc.setFontSize(summary.totalFontSize)
  doc.setFont(PDF_FONTS.bold)
  doc.text(`합    계: ${formatCurrency(transaction.total_amount)}`, summary.x, y, { align: 'right' })
  
  y += 10
  doc.setFont(PDF_FONTS.normal)

  // 8. 메모란
  doc.setFontSize(INVOICE_LAYOUT.memo.fontSize)
  if (transaction.notes && transaction.notes.trim()) {
    doc.text(`메모: ${transaction.notes}`, 20, y)
  } else {
    doc.text('메모: ' + '_'.repeat(70), 20, y)
  }
  y += INVOICE_LAYOUT.memo.lineHeight
  doc.text('     ' + '_'.repeat(70), 20, y)
  y += INVOICE_LAYOUT.memo.lineHeight
  doc.text('     ' + '_'.repeat(70), 20, y)
  y += INVOICE_LAYOUT.memo.lineHeight

  // 9. 발행 정보
  y += 5
  doc.setFontSize(INVOICE_LAYOUT.footer.fontSize)
  const today = new Date().toISOString().split('T')[0]
  doc.text(`발행일: ${today}`, 20, y)
  doc.text(`발행자: ${company.name} (인)`, 180, y, { align: 'right' })
}
