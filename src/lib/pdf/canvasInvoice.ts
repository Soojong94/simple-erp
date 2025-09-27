import jsPDF from 'jspdf'
import type { TransactionWithItems, Company, Customer } from '../../types'
import { formatCurrency } from '../utils'

/**
 * Canvas API로 직접 그려서 완벽한 제어
 * - 글자 간격 정확히 제어
 * - 높은 화질
 * - html2canvas 없이 순수 Canvas
 */

const MM_TO_PX = 3.78

interface LayoutConfig {
  pageWidth: number
  pageHeight: number
  padding: { top: number; side: number }
  title: { size: number; spacing: number }
  label: { size: number; marginTop: number; marginBottom: number }
  infoBox: { height: number; gap: number; padding: number; border: number }
  table: { headerHeight: number; rowHeight: number; border: number }
}

const LAYOUT: LayoutConfig = {
  pageWidth: 210 * MM_TO_PX,
  pageHeight: 148.5 * MM_TO_PX,
  padding: { top: 8 * MM_TO_PX, side: 10 * MM_TO_PX },
  title: { size: 22, spacing: 8 },
  label: { size: 11, marginTop: 3 * MM_TO_PX, marginBottom: 6 * MM_TO_PX },
  infoBox: { height: 100, gap: 4 * MM_TO_PX, padding: 4 * MM_TO_PX, border: 2 },
  table: { headerHeight: 40, rowHeight: 34, border: 2 }
}

// 텍스트 그리기 (압축된 폰트)
function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  weight: number = 400,
  align: 'left' | 'center' | 'right' = 'left',
  color: string = '#000'
) {
  ctx.save()
  
  // 폰트 압축 (transform으로 가로 80%로 축소)
  ctx.scale(0.85, 1)
  
  ctx.font = `${weight} ${size}px "Malgun Gothic", sans-serif`
  ctx.fillStyle = color
  ctx.textAlign = align
  ctx.textBaseline = 'top'
  
  // x 좌표도 스케일 보정
  const adjustedX = align === 'center' ? x / 0.85 : (align === 'right' ? x / 0.85 : x / 0.85)
  ctx.fillText(text, adjustedX, y)
  
  ctx.restore()
}

// 사각형 그리기
function drawRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  fill?: string,
  stroke?: string,
  lineWidth: number = 1
) {
  if (fill) {
    ctx.fillStyle = fill
    ctx.fillRect(x, y, w, h)
  }
  if (stroke) {
    ctx.strokeStyle = stroke
    ctx.lineWidth = lineWidth
    ctx.strokeRect(x, y, w, h)
  }
}

// 섹션 그리기
function drawSection(
  ctx: CanvasRenderingContext2D,
  transaction: TransactionWithItems,
  company: Company,
  customer: Customer | undefined,
  type: 'supplier' | 'customer'
) {
  const color = type === 'supplier' ? '#1e40af' : '#dc2626'
  const label = type === 'supplier' ? '공급자 보관용' : '구매자 보관용'
  
  let y = LAYOUT.padding.top
  const contentWidth = LAYOUT.pageWidth - LAYOUT.padding.side * 2
  const centerX = LAYOUT.pageWidth / 2

  // 1. 제목
  drawText(ctx, '거 래 명 세 서', centerX, y, LAYOUT.title.size, 700, 'center', color)
  y += LAYOUT.title.size + LAYOUT.title.spacing

  // 2. 라벨
  drawText(ctx, `[ ${label} ]`, centerX, y, LAYOUT.label.size, 600, 'center', color)
  y += LAYOUT.label.size + LAYOUT.label.marginTop + LAYOUT.label.marginBottom

  // 3. 공급자/구매자 박스
  const boxY = y
  const supplierW = (contentWidth - LAYOUT.infoBox.gap) * 0.583
  const customerW = (contentWidth - LAYOUT.infoBox.gap) * 0.417
  const supplierX = LAYOUT.padding.side
  const customerX = supplierX + supplierW + LAYOUT.infoBox.gap

  // 공급자 박스
  drawRect(ctx, supplierX, boxY, supplierW, LAYOUT.infoBox.height, undefined, color, LAYOUT.infoBox.border)
  drawText(ctx, '【 공급자 】', supplierX + supplierW / 2, boxY + 10, 11, 700, 'center', color)
  
  let infoY = boxY + 35
  const rows = [
    ['상호', company.name, 700],
    ['사업자', company.business_number || '', 400],
    ['대표자', company.ceo_name || '', 400],
    ['주소', company.address || '', 400],
    ['전화', company.phone || '', 400]
  ]
  
  rows.forEach(([label, value, weight]) => {
    drawText(ctx, label, supplierX + 15, infoY, 9, 700)
    drawText(ctx, value, supplierX + 70, infoY, 9, weight as number)
    infoY += 18
  })

  // 구매자 박스
  drawRect(ctx, customerX, boxY, customerW, LAYOUT.infoBox.height, undefined, color, LAYOUT.infoBox.border)
  drawText(ctx, '【 구매자 】', customerX + customerW / 2, boxY + 10, 11, 700, 'center', color)
  
  infoY = boxY + 35
  const customerRows = [
    ['상호', customer?.name || '-', 700],
    ['사업자', customer?.business_number || '-', 400],
    ['대표자', customer?.contact_person || '-', 400],
    ['주소', customer?.address || '-', 400],
    ['전화', customer?.phone || '-', 400]
  ]
  
  customerRows.forEach(([label, value, weight]) => {
    drawText(ctx, label, customerX + 15, infoY, 9, 700)
    drawText(ctx, value, customerX + 70, infoY, 9, weight as number)
    infoY += 18
  })

  y += LAYOUT.infoBox.height + 5 * MM_TO_PX

  // 4. 거래 정보
  const infoBoxH = 30
  drawRect(ctx, LAYOUT.padding.side, y, contentWidth, infoBoxH, '#f5f7fa', color, 2)
  drawText(ctx, `거래일: ${transaction.transaction_date}`, LAYOUT.padding.side + 20, y + 9, 10, 600)
  drawText(ctx, `거래번호: #${transaction.id}`, LAYOUT.pageWidth - LAYOUT.padding.side - 20, y + 9, 10, 600, 'right')

  y += infoBoxH + 5 * MM_TO_PX

  // 5. 상품 테이블
  const tableX = LAYOUT.padding.side
  const tableW = contentWidth
  const cols = [0.25, 0.25, 0.15, 0.17, 0.18]
  const colWidths = cols.map(r => tableW * r)
  
  // 헤더
  let colX = tableX
  const headers = ['품목', '이력번호', '수량', '단가', '금액']
  headers.forEach((h, i) => {
    drawRect(ctx, colX, y, colWidths[i], LAYOUT.table.headerHeight, color, color, 2)
    drawText(ctx, h, colX + colWidths[i] / 2, y + 12, 10.5, 700, 'center', '#fff')
    colX += colWidths[i]
  })
  y += LAYOUT.table.headerHeight

  // 상품 행
  const items = transaction.items || []
  const maxRows = 7
  
  for (let i = 0; i < maxRows; i++) {
    const item = items[i]
    colX = tableX
    
    if (item) {
      drawRect(ctx, colX, y, colWidths[0], LAYOUT.table.rowHeight, '#fff', '#ddd', 1)
      drawText(ctx, item.product_name, colX + colWidths[0] / 2, y + 10, 10, 500, 'center')
      colX += colWidths[0]

      drawRect(ctx, colX, y, colWidths[1], LAYOUT.table.rowHeight, '#fff', '#ddd', 1)
      drawText(ctx, item.traceability_number || '-', colX + colWidths[1] / 2, y + 10, 9, 400, 'center')
      colX += colWidths[1]

      drawRect(ctx, colX, y, colWidths[2], LAYOUT.table.rowHeight, '#fff', '#ddd', 1)
      drawText(ctx, `${item.quantity}${item.unit}`, colX + colWidths[2] / 2, y + 10, 10, 500, 'center')
      colX += colWidths[2]

      drawRect(ctx, colX, y, colWidths[3], LAYOUT.table.rowHeight, '#fff', '#ddd', 1)
      drawText(ctx, formatCurrency(item.unit_price), colX + colWidths[3] - 10, y + 10, 10, 500, 'right')
      colX += colWidths[3]

      drawRect(ctx, colX, y, colWidths[4], LAYOUT.table.rowHeight, '#fff', '#ddd', 1)
      drawText(ctx, formatCurrency(item.total_price), colX + colWidths[4] - 10, y + 10, 10.5, 700, 'right')
    } else {
      cols.forEach((_, j) => {
        drawRect(ctx, colX, y, colWidths[j], LAYOUT.table.rowHeight, '#fff', '#ddd', 1)
        colX += colWidths[j]
      })
    }
    
    y += LAYOUT.table.rowHeight
  }

  y += 4 * MM_TO_PX

  // 6. 합계
  const supplyPrice = transaction.total_amount - transaction.tax_amount
  const summaryH = 30
  
  drawRect(ctx, tableX, y, tableW * 0.2, summaryH, '#f8f9fa', color, 2)
  drawText(ctx, '공급가액', tableX + tableW * 0.1, y + 9, 10, 700, 'center')
  
  drawRect(ctx, tableX + tableW * 0.2, y, tableW * 0.3, summaryH, '#f8f9fa', color, 2)
  drawText(ctx, formatCurrency(supplyPrice), tableX + tableW * 0.5 - 10, y + 9, 10, 600, 'right')
  
  drawRect(ctx, tableX + tableW * 0.5, y, tableW * 0.2, summaryH, '#f8f9fa', color, 2)
  drawText(ctx, '부가세', tableX + tableW * 0.6, y + 9, 10, 700, 'center')
  
  drawRect(ctx, tableX + tableW * 0.7, y, tableW * 0.3, summaryH, '#f8f9fa', color, 2)
  drawText(ctx, formatCurrency(transaction.tax_amount), tableX + tableW - 10, y + 9, 10, 600, 'right')
  
  y += summaryH

  const totalH = 35
  drawRect(ctx, tableX, y, tableW * 0.5, totalH, color, color, 2)
  drawText(ctx, '합 계', tableX + tableW * 0.25, y + 10, 12, 700, 'center', '#fff')
  
  drawRect(ctx, tableX + tableW * 0.5, y, tableW * 0.5, totalH, color, color, 2)
  drawText(ctx, formatCurrency(transaction.total_amount), tableX + tableW - 10, y + 10, 12, 700, 'right', '#fff')

  y += totalH + 4 * MM_TO_PX

  // 7. 메모
  const memoH = 40
  drawRect(ctx, tableX, y, tableW, memoH, '#fafafa', '#ddd', 2)
  drawText(ctx, '메모:', tableX + 10, y + 8, 10, 700)
  
  const memo = transaction.notes || company.default_invoice_memo || ''
  drawText(ctx, memo.substring(0, 50), tableX + 10, y + 25, 9.5, 400)

  y += memoH + 4 * MM_TO_PX

  // 8. 발행 정보
  ctx.strokeStyle = color
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(tableX, y)
  ctx.lineTo(tableX + tableW, y)
  ctx.stroke()

  y += 10
  drawText(ctx, `발행일: ${new Date().toISOString().split('T')[0]}`, tableX + 10, y, 10, 600)
  drawText(ctx, `발행자: ${company.name} (인)`, tableX + tableW - 10, y, 10, 600, 'right')
}

export async function generateCanvasInvoicePDF(
  transaction: TransactionWithItems,
  company: Company,
  customer: Customer | undefined,
  action: 'preview' | 'download' | 'print' = 'preview'
): Promise<jsPDF> {
  console.log('🎨 Canvas 직접 그리기 PDF 생성')

  const canvas = document.createElement('canvas')
  canvas.width = LAYOUT.pageWidth
  canvas.height = LAYOUT.pageHeight * 2

  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // 상단부
  ctx.save()
  drawSection(ctx, transaction, company, customer, 'supplier')
  ctx.restore()

  // 절취선
  const cutY = LAYOUT.pageHeight
  ctx.setLineDash([8, 8])
  ctx.strokeStyle = '#999'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(LAYOUT.padding.side, cutY)
  ctx.lineTo(LAYOUT.pageWidth - LAYOUT.padding.side, cutY)
  ctx.stroke()
  ctx.setLineDash([])

  // 하단부
  ctx.save()
  ctx.translate(0, LAYOUT.pageHeight)
  drawSection(ctx, transaction, company, customer, 'customer')
  ctx.restore()

  const imgData = canvas.toDataURL('image/png')

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  doc.addImage(imgData, 'PNG', 0, 0, 210, 297)

  console.log('✅ Canvas PDF 생성 완료')

  if (action === 'download') {
    doc.save(`거래명세서_Canvas_${customer?.name}_${transaction.transaction_date}.pdf`)
  } else if (action === 'print') {
    doc.autoPrint()
    window.open(doc.output('bloburl'), '_blank')
  }

  return doc
}
