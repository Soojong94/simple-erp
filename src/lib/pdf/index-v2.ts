import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { INVOICE_LAYOUT } from './pdfConfig'
import type { TransactionWithItems, Company, Customer } from '../../types'
import { formatCurrency } from '../utils'

/**
 * 테스트 버전 2: scaleX 0.90
 */
async function ensureFontsLoaded(): Promise<void> {
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready
  }
  return new Promise(resolve => setTimeout(resolve, 200))
}

export async function generateInvoicePDF(
  transaction: TransactionWithItems,
  company: Company,
  customer: Customer | undefined,
  action: 'preview' | 'download' | 'print'
): Promise<jsPDF> {
  await ensureFontsLoaded()
  
  const container = document.createElement('div')
  container.style.position = 'absolute'
  container.style.left = '-9999px'
  container.style.width = '210mm'
  container.style.background = 'white'
  document.body.appendChild(container)

  const topSection = createInvoiceHTML(transaction, company, customer, 'supplier')
  container.innerHTML = topSection
  await new Promise(resolve => setTimeout(resolve, 100))

  const topCanvas = await html2canvas(container, {
    scale: 4,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    allowTaint: false,
    imageTimeout: 0,
    windowWidth: 794,
    windowHeight: 1123
  })

  const bottomSection = createInvoiceHTML(transaction, company, customer, 'customer')
  container.innerHTML = bottomSection
  await new Promise(resolve => setTimeout(resolve, 100))

  const bottomCanvas = await html2canvas(container, {
    scale: 4,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    allowTaint: false,
    imageTimeout: 0,
    windowWidth: 794,
    windowHeight: 1123
  })

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true
  })

  const topImgData = topCanvas.toDataURL('image/png')
  doc.addImage(topImgData, 'PNG', 0, 0, 210, 148.5, undefined, 'FAST')

  const cutLine = INVOICE_LAYOUT.cutLine
  doc.setLineDash([2, 2])
  doc.setDrawColor(150, 150, 150)
  doc.line(20, cutLine.y, 190, cutLine.y)
  doc.setLineDash([])

  const bottomImgData = bottomCanvas.toDataURL('image/png')
  doc.addImage(bottomImgData, 'PNG', 0, 148.5, 210, 148.5, undefined, 'FAST')

  document.body.removeChild(container)

  if (action === 'download') {
    const fileName = `거래명세서_v2_${customer?.name || '거래처'}_${transaction.transaction_date}.pdf`
    doc.save(fileName)
  } else if (action === 'print') {
    doc.autoPrint()
    window.open(doc.output('bloburl'), '_blank')
  }

  return doc
}

function createInvoiceHTML(
  transaction: TransactionWithItems,
  company: Company,
  customer: Customer | undefined,
  type: 'supplier' | 'customer'
): string {
  const supplyPrice = transaction.total_amount - transaction.tax_amount
  const stampImage = localStorage.getItem('simple-erp-stamp-image') || ''
  
  const color = type === 'supplier' ? '#1e40af' : '#dc2626'
  const label = type === 'supplier' ? '공급자 보관용' : '구매자 보관용'

  return `
    <div id="invoice-container" style="
      padding: 8mm 10mm;
      font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif;
      font-size: 10.5pt;
      width: 210mm;
      box-sizing: border-box;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      transform: scaleX(0.90);
      transform-origin: left top;
    ">
      <!-- 제목 -->
      <div style="text-align: center; margin-bottom: 6mm;">
        <h1 style="
          font-size: 22pt; 
          margin: 0; 
          font-weight: 700; 
          color: ${color};
          letter-spacing: 10px;
        ">
          거 래 명 세 서
        </h1>
        <div style="
          font-size: 11pt; 
          color: ${color}; 
          font-weight: 600; 
          margin-top: 3mm;
          letter-spacing: 2px;
        ">
          [ ${label} ]
        </div>
      </div>

      <!-- 공급자/구매자 정보 -->
      <div style="display: flex; justify-content: space-between; margin-bottom: 5mm; gap: 4mm;">
        <!-- 공급자 -->
        <div style="flex: 1.4; border: 2px solid ${color}; padding: 4mm;">
          <div style="
            font-weight: 700; 
            margin-bottom: 3mm; 
            color: ${color}; 
            text-align: center; 
            font-size: 11pt;
            letter-spacing: 3px;
          ">
            【 공급자 】
          </div>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 5px 6px; width: 60px; font-weight: 700; font-size: 9.5pt;">상호</td>
              <td style="padding: 5px 6px; display: flex; align-items: center; justify-content: space-between;">
                <span style="font-size: 10.5pt; font-weight: 700;">${company.name}</span>
                ${stampImage ? `
                  <img src="${stampImage}" style="width: 18mm; height: 18mm; margin-left: 3mm;" />
                ` : `
                  <div style="
                    width: 16mm; 
                    height: 16mm; 
                    border: 2px solid ${color}; 
                    border-radius: 50%; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    color: ${color}; 
                    font-size: 12pt; 
                    font-weight: 700; 
                    margin-left: 3mm;
                  ">
                    인
                  </div>
                `}
              </td>
            </tr>
            <tr>
              <td style="padding: 5px 6px; font-weight: 700; font-size: 9pt;">사업자</td>
              <td style="padding: 5px 6px; font-size: 9pt; font-weight: 400;">${company.business_number || ''}</td>
            </tr>
            <tr>
              <td style="padding: 5px 6px; font-weight: 700; font-size: 9pt;">대표자</td>
              <td style="padding: 5px 6px; font-size: 9pt; font-weight: 400;">${company.ceo_name || ''}</td>
            </tr>
            <tr>
              <td style="padding: 5px 6px; font-weight: 700; font-size: 9pt;">주소</td>
              <td style="padding: 5px 6px; font-size: 8.5pt; font-weight: 400;">${company.address || ''}</td>
            </tr>
            <tr>
              <td style="padding: 5px 6px; font-weight: 700; font-size: 9pt;">전화</td>
              <td style="padding: 5px 6px; font-size: 9pt; font-weight: 400;">${company.phone || ''}</td>
            </tr>
          </table>
        </div>

        <!-- 구매자 -->
        <div style="flex: 1; border: 2px solid ${color}; padding: 4mm;">
          <div style="
            font-weight: 700; 
            margin-bottom: 3mm; 
            color: ${color}; 
            text-align: center; 
            font-size: 11pt;
            letter-spacing: 3px;
          ">
            【 구매자 】
          </div>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 5px 6px; width: 60px; font-weight: 700; font-size: 9.5pt;">상호</td>
              <td style="padding: 5px 6px; font-size: 10.5pt; font-weight: 700;">${customer?.name || '-'}</td>
            </tr>
            <tr>
              <td style="padding: 5px 6px; font-weight: 700; font-size: 9pt;">사업자</td>
              <td style="padding: 5px 6px; font-size: 9pt; font-weight: 400;">${customer?.business_number || '-'}</td>
            </tr>
            <tr>
              <td style="padding: 5px 6px; font-weight: 700; font-size: 9pt;">대표자</td>
              <td style="padding: 5px 6px; font-size: 9pt; font-weight: 400;">${customer?.contact_person || '-'}</td>
            </tr>
            <tr>
              <td style="padding: 5px 6px; font-weight: 700; font-size: 9pt;">주소</td>
              <td style="padding: 5px 6px; font-size: 8.5pt; font-weight: 400;">${customer?.address || '-'}</td>
            </tr>
            <tr>
              <td style="padding: 5px 6px; font-weight: 700; font-size: 9pt;">전화</td>
              <td style="padding: 5px 6px; font-size: 9pt; font-weight: 400;">${customer?.phone || '-'}</td>
            </tr>
          </table>
        </div>
      </div>

      <!-- 거래 정보 -->
      <div style="
        display: flex; 
        justify-content: space-between; 
        margin-bottom: 5mm; 
        padding: 3mm 6mm; 
        background: #f5f7fa; 
        border: 2px solid ${color};
      ">
        <div style="font-size: 10pt; font-weight: 600;">
          <strong style="color: ${color};">거래일:</strong> ${transaction.transaction_date}
        </div>
        <div style="font-size: 10pt; font-weight: 600;">
          <strong style="color: ${color};">거래번호:</strong> #${transaction.id}
        </div>
      </div>

      <!-- 상품 테이블 -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 4mm;">
        <thead>
          <tr style="background: ${color}; color: white;">
            <th style="border: 2px solid ${color}; padding: 10px 6px; text-align: center; width: 25%; font-size: 10.5pt; font-weight: 700; letter-spacing: 2px;">품목</th>
            <th style="border: 2px solid ${color}; padding: 10px 6px; text-align: center; width: 25%; font-size: 10.5pt; font-weight: 700; letter-spacing: 2px;">이력번호</th>
            <th style="border: 2px solid ${color}; padding: 10px 6px; text-align: center; width: 15%; font-size: 10.5pt; font-weight: 700; letter-spacing: 2px;">수량</th>
            <th style="border: 2px solid ${color}; padding: 10px 6px; text-align: center; width: 17%; font-size: 10.5pt; font-weight: 700; letter-spacing: 2px;">단가</th>
            <th style="border: 2px solid ${color}; padding: 10px 6px; text-align: center; width: 18%; font-size: 10.5pt; font-weight: 700; letter-spacing: 2px;">금액</th>
          </tr>
        </thead>
        <tbody>
          ${transaction.items?.map(item => `
            <tr>
              <td style="border: 1px solid #ddd; padding: 9px 6px; text-align: center; font-size: 10pt; font-weight: 500;">${item.product_name}</td>
              <td style="border: 1px solid #ddd; padding: 9px 6px; text-align: center; font-size: 9pt; font-weight: 400;">${item.traceability_number || '-'}</td>
              <td style="border: 1px solid #ddd; padding: 9px 6px; text-align: center; font-size: 10pt; font-weight: 500;">${item.quantity}${item.unit}</td>
              <td style="border: 1px solid #ddd; padding: 9px 6px; text-align: right; font-size: 10pt; font-weight: 500;">${formatCurrency(item.unit_price)}</td>
              <td style="border: 1px solid #ddd; padding: 9px 6px; text-align: right; font-size: 10.5pt; font-weight: 700;">${formatCurrency(item.total_price)}</td>
            </tr>
          `).join('') || ''}
          ${Array.from({ length: Math.max(0, 7 - (transaction.items?.length || 0)) }).map(() => `
            <tr>
              <td style="border: 1px solid #ddd; padding: 9px 6px; height: 34px;">&nbsp;</td>
              <td style="border: 1px solid #ddd; padding: 9px 6px;">&nbsp;</td>
              <td style="border: 1px solid #ddd; padding: 9px 6px;">&nbsp;</td>
              <td style="border: 1px solid #ddd; padding: 9px 6px;">&nbsp;</td>
              <td style="border: 1px solid #ddd; padding: 9px 6px;">&nbsp;</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <!-- 합계 -->
      <div style="margin-bottom: 4mm;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="background: #f8f9fa;">
            <td style="border: 2px solid ${color}; padding: 7px 8px; text-align: center; width: 20%; font-weight: 700; font-size: 10pt; letter-spacing: 2px;">공급가액</td>
            <td style="border: 2px solid ${color}; padding: 7px 8px; text-align: right; width: 30%; font-size: 10pt; font-weight: 600;">${formatCurrency(supplyPrice)}</td>
            <td style="border: 2px solid ${color}; padding: 7px 8px; text-align: center; width: 20%; font-weight: 700; font-size: 10pt; letter-spacing: 2px;">부가세</td>
            <td style="border: 2px solid ${color}; padding: 7px 8px; text-align: right; width: 30%; font-size: 10pt; font-weight: 600;">${formatCurrency(transaction.tax_amount)}</td>
          </tr>
          <tr style="background: ${color}; color: white;">
            <td colspan="2" style="border: 2px solid ${color}; padding: 9px 8px; text-align: center; font-weight: 700; font-size: 12pt; letter-spacing: 4px;">합 계</td>
            <td colspan="2" style="border: 2px solid ${color}; padding: 9px 8px; text-align: right; font-weight: 700; font-size: 12pt;">${formatCurrency(transaction.total_amount)}</td>
          </tr>
        </table>
      </div>

      <!-- 메모 -->
      <div style="margin-bottom: 4mm; padding: 4mm; border: 2px solid #ddd; background: #fafafa; min-height: 12mm;">
        <div style="font-weight: 700; margin-bottom: 2mm; font-size: 10pt;">메모:</div>
        <div style="line-height: 1.4; white-space: pre-line; font-size: 9.5pt; font-weight: 400;">${transaction.notes || company.default_invoice_memo || '___________________________________________________________'}</div>
      </div>

      <!-- 발행 정보 -->
      <div style="display: flex; justify-content: space-between; font-size: 10pt; padding: 3mm 4mm; border-top: 2px solid ${color}; font-weight: 600;">
        <div><strong style="color: ${color};">발행일:</strong> ${new Date().toISOString().split('T')[0]}</div>
        <div><strong style="color: ${color};">발행자:</strong> ${company.name} (인)</div>
      </div>
    </div>
  `
}
