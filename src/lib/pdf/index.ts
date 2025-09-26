import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { INVOICE_LAYOUT } from './pdfConfig'
import type { TransactionWithItems, Company, Customer } from '../../types'
import { formatCurrency } from '../utils'

// HTML 기반 PDF 생성 (한글 지원)
export async function generateInvoicePDF(
  transaction: TransactionWithItems,
  company: Company,
  customer: Customer | undefined,
  action: 'preview' | 'download' | 'print'
): Promise<jsPDF> {
  // 임시 HTML 엘리먼트 생성
  const container = document.createElement('div')
  container.style.position = 'absolute'
  container.style.left = '-9999px'
  container.style.width = '210mm'
  container.style.background = 'white'
  document.body.appendChild(container)

  // 상단부 HTML (파란색 - 공급자 보관용)
  const topSection = createInvoiceHTML(transaction, company, customer, 'supplier')
  container.innerHTML = topSection

  // HTML을 캔버스로 변환
  const topCanvas = await html2canvas(container, {
    scale: 2,
    useCORS: true,
    logging: false
  })

  // 하단부 HTML (빨간색 - 구매자 보관용)
  const bottomSection = createInvoiceHTML(transaction, company, customer, 'customer')
  container.innerHTML = bottomSection

  const bottomCanvas = await html2canvas(container, {
    scale: 2,
    useCORS: true,
    logging: false
  })

  // PDF 생성
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  // 상단부 이미지 추가 (파란색)
  const topImgData = topCanvas.toDataURL('image/png')
  doc.addImage(topImgData, 'PNG', 0, 0, 210, 148.5)

  // 절취선
  const cutLine = INVOICE_LAYOUT.cutLine
  doc.setLineDash([2, 2])
  doc.line(20, cutLine.y, 190, cutLine.y)
  doc.setLineDash([])
  doc.setFontSize(10)
  doc.text('절 취 선', 105, cutLine.y + 2, { align: 'center' })

  // 하단부 이미지 추가 (빨간색)
  const bottomImgData = bottomCanvas.toDataURL('image/png')
  doc.addImage(bottomImgData, 'PNG', 0, 148.5, 210, 148.5)

  // 임시 엘리먼트 제거
  document.body.removeChild(container)

  // 액션별 처리
  if (action === 'download') {
    const fileName = `거래명세서_${customer?.name || '거래처'}_${transaction.transaction_date}.pdf`
    doc.save(fileName)
  } else if (action === 'print') {
    doc.autoPrint()
    window.open(doc.output('bloburl'), '_blank')
  }

  return doc
}

// 여백이 충분한 HTML 템플릿 생성
function createInvoiceHTML(
  transaction: TransactionWithItems,
  company: Company,
  customer: Customer | undefined,
  type: 'supplier' | 'customer'
): string {
  const supplyPrice = transaction.total_amount - transaction.tax_amount
  const stampImage = localStorage.getItem('simple-erp-stamp-image') || ''
  
  // 색상 설정
  const color = type === 'supplier' ? '#1e40af' : '#dc2626' // 파란색 / 빨간색
  const label = type === 'supplier' ? '공급자 보관용' : '구매자 보관용'

  return `
    <div style="padding: 8mm; font-family: '맑은 고딕', 'Malgun Gothic', sans-serif; font-size: 10pt;">
      <!-- 제목 + 보관용 라벨 -->
      <div style="text-align: center; margin-bottom: 8mm;">
        <h1 style="font-size: 22pt; margin: 0; font-weight: bold; color: ${color};">
          거 래 명 세 서
        </h1>
        <div style="font-size: 11pt; color: ${color}; font-weight: bold; margin-top: 3mm;">
          [ ${label} ]
        </div>
      </div>

      <!-- 공급자/구매자 정보 -->
      <div style="display: flex; justify-content: space-between; margin-bottom: 6mm; gap: 5mm;">
        <!-- 공급자 -->
        <div style="flex: 1; border: 2px solid ${color}; padding: 5mm;">
          <div style="font-weight: bold; margin-bottom: 3mm; color: ${color}; text-align: center; font-size: 11pt;">
            【 공급자 】
          </div>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 3px 6px; width: 65px; text-align: center; font-weight: bold; vertical-align: middle;">상호</td>
              <td style="padding: 3px 6px; display: flex; align-items: center; justify-content: space-between; vertical-align: middle;">
                <span style="line-height: 1.6;">${company.name}</span>
                ${stampImage ? `
                  <img src="${stampImage}" style="width: 20mm; height: 20mm; margin-left: 5mm;" />
                ` : `
                  <div style="width: 18mm; height: 18mm; border: 2px solid ${color}; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: ${color}; font-size: 12pt; font-weight: bold; margin-left: 5mm;">
                    인
                  </div>
                `}
              </td>
            </tr>
            <tr>
              <td style="padding: 3px 6px; text-align: center; font-weight: bold; vertical-align: middle;">사업자</td>
              <td style="padding: 3px 6px; vertical-align: middle; line-height: 1.6;">${company.business_number}</td>
            </tr>
            <tr>
              <td style="padding: 3px 6px; text-align: center; font-weight: bold; vertical-align: middle;">대표자</td>
              <td style="padding: 3px 6px; vertical-align: middle; line-height: 1.6;">${company.ceo_name}</td>
            </tr>
            <tr>
              <td style="padding: 3px 6px; text-align: center; font-weight: bold; vertical-align: middle;">주소</td>
              <td style="padding: 3px 6px; vertical-align: middle; line-height: 1.6;">${company.address}</td>
            </tr>
            <tr>
              <td style="padding: 3px 6px; text-align: center; font-weight: bold; vertical-align: middle;">전화</td>
              <td style="padding: 3px 6px; vertical-align: middle; line-height: 1.6;">${company.phone}</td>
            </tr>
          </table>
        </div>

        <!-- 구매자 -->
        <div style="flex: 1; border: 2px solid ${color}; padding: 5mm;">
          <div style="font-weight: bold; margin-bottom: 3mm; color: ${color}; text-align: center; font-size: 11pt;">
            【 구매자 】
          </div>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 3px 6px; width: 65px; text-align: center; font-weight: bold; vertical-align: middle;">상호</td>
              <td style="padding: 3px 6px; vertical-align: middle; line-height: 1.6;">${customer?.name || '-'}</td>
            </tr>
            <tr>
              <td style="padding: 3px 6px; text-align: center; font-weight: bold; vertical-align: middle;">사업자</td>
              <td style="padding: 3px 6px; vertical-align: middle; line-height: 1.6;">${customer?.business_number || '-'}</td>
            </tr>
            <tr>
              <td style="padding: 3px 6px; text-align: center; font-weight: bold; vertical-align: middle;">대표자</td>
              <td style="padding: 3px 6px; vertical-align: middle; line-height: 1.6;">${customer?.contact_person || '-'}</td>
            </tr>
            <tr>
              <td style="padding: 3px 6px; text-align: center; font-weight: bold; vertical-align: middle;">주소</td>
              <td style="padding: 3px 6px; vertical-align: middle; line-height: 1.6;">${customer?.address || '-'}</td>
            </tr>
            <tr>
              <td style="padding: 3px 6px; text-align: center; font-weight: bold; vertical-align: middle;">전화</td>
              <td style="padding: 3px 6px; vertical-align: middle; line-height: 1.6;">${customer?.phone || '-'}</td>
            </tr>
          </table>
        </div>
      </div>

      <!-- 거래 정보 -->
      <div style="display: flex; justify-content: space-between; margin-bottom: 5mm; padding: 4mm 8mm; background: #f9fafb; border: 1px solid ${color}; border-radius: 4px;">
        <div style="line-height: 1.6;"><strong>거래일:</strong> ${transaction.transaction_date}</div>
        <div style="line-height: 1.6;"><strong>거래번호:</strong> #${transaction.id}</div>
      </div>

      <!-- 상품 테이블 (여백 충분) -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 5mm; font-size: 9pt;">
        <thead>
          <tr style="background: ${color}; color: white;">
            <th style="border: 1px solid ${color}; padding: 6px 8px; text-align: center; vertical-align: middle;">품목</th>
            <th style="border: 1px solid ${color}; padding: 6px 8px; text-align: center; vertical-align: middle;">이력번호</th>
            <th style="border: 1px solid ${color}; padding: 6px 8px; text-align: center; vertical-align: middle;">수량</th>
            <th style="border: 1px solid ${color}; padding: 6px 8px; text-align: center; vertical-align: middle;">단가</th>
            <th style="border: 1px solid ${color}; padding: 6px 8px; text-align: center; vertical-align: middle;">금액</th>
          </tr>
        </thead>
        <tbody>
          ${transaction.items?.map(item => `
            <tr>
              <td style="border: 1px solid #ddd; padding: 6px 8px; text-align: center; vertical-align: middle; line-height: 1.5;">${item.product_name}</td>
              <td style="border: 1px solid #ddd; padding: 6px 8px; text-align: center; vertical-align: middle; line-height: 1.5;">${item.traceability_number || '-'}</td>
              <td style="border: 1px solid #ddd; padding: 6px 8px; text-align: center; vertical-align: middle; line-height: 1.5;">${item.quantity}${item.unit}</td>
              <td style="border: 1px solid #ddd; padding: 6px 8px; text-align: right; vertical-align: middle; line-height: 1.5;">${formatCurrency(item.unit_price)}</td>
              <td style="border: 1px solid #ddd; padding: 6px 8px; text-align: right; font-weight: bold; vertical-align: middle; line-height: 1.5;">${formatCurrency(item.total_price)}</td>
            </tr>
          `).join('') || ''}
          ${Array.from({ length: Math.max(0, 7 - (transaction.items?.length || 0)) }).map(() => `
            <tr>
              <td style="border: 1px solid #ddd; padding: 6px 8px; height: 22px; vertical-align: middle;">&nbsp;</td>
              <td style="border: 1px solid #ddd; padding: 6px 8px; vertical-align: middle;">&nbsp;</td>
              <td style="border: 1px solid #ddd; padding: 6px 8px; vertical-align: middle;">&nbsp;</td>
              <td style="border: 1px solid #ddd; padding: 6px 8px; vertical-align: middle;">&nbsp;</td>
              <td style="border: 1px solid #ddd; padding: 6px 8px; vertical-align: middle;">&nbsp;</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <!-- 합계 (테이블 형식 + 여백) -->
      <div style="margin-bottom: 5mm;">
        <table style="width: 100%; border-collapse: collapse; font-size: 10pt;">
          <tr style="background: #f9fafb;">
            <td style="border: 1px solid ${color}; padding: 6px 10px; text-align: center; width: 20%; font-weight: bold; vertical-align: middle;">공급가액</td>
            <td style="border: 1px solid ${color}; padding: 6px 10px; text-align: right; width: 30%; vertical-align: middle;">${formatCurrency(supplyPrice)}</td>
            <td style="border: 1px solid ${color}; padding: 6px 10px; text-align: center; width: 20%; font-weight: bold; vertical-align: middle;">부가세</td>
            <td style="border: 1px solid ${color}; padding: 6px 10px; text-align: right; width: 30%; vertical-align: middle;">${formatCurrency(transaction.tax_amount)}</td>
          </tr>
          <tr style="background: ${color}; color: white;">
            <td colspan="2" style="border: 1px solid ${color}; padding: 8px 10px; text-align: center; font-weight: bold; font-size: 12pt; vertical-align: middle;">합 계</td>
            <td colspan="2" style="border: 1px solid ${color}; padding: 8px 10px; text-align: right; font-weight: bold; font-size: 12pt; vertical-align: middle;">${formatCurrency(transaction.total_amount)}</td>
          </tr>
        </table>
      </div>

      <!-- 메모 -->
      <div style="margin-bottom: 5mm; padding: 5mm; border: 1px solid #ddd; background: #f9fafb; font-size: 9pt; min-height: 12mm; border-radius: 4px;">
        <div style="font-weight: bold; margin-bottom: 2mm; line-height: 1.6;">메모:</div>
        <div style="line-height: 1.6; white-space: pre-line;">${transaction.notes || company.default_invoice_memo || '___________________________________________________________'}</div>
      </div>

      <!-- 발행 정보 -->
      <div style="display: flex; justify-content: space-between; font-size: 9pt; padding: 4mm 6mm; border-top: 2px solid ${color}; line-height: 1.6;">
        <div><strong>발행일:</strong> ${new Date().toISOString().split('T')[0]}</div>
        <div><strong>발행자:</strong> ${company.name} (인)</div>
      </div>
    </div>
  `
}
