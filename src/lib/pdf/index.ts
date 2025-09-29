import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { INVOICE_LAYOUT } from './pdfConfig'
import type { TransactionWithItems, Company, Customer } from '../../types'
import { formatCurrency } from '../utils'
import { getCurrentSession } from '../auth'

/**
 * 최종 버전: Bold 강화 + 절취선
 * - 300mm 너비 렌더링 → 210mm PDF 축소
 * - transform 없음 (자연스러운 폰트)
 * - scale: 2 (빠른 생성)
 * - Bold 강화 (font-weight: 600-800)
 * - 절취선 추가
 */

// 회사별 도장 키 가져오기
const getStampStorageKey = () => {
  const session = getCurrentSession()
  if (!session) return 'simple-erp-stamp-image'
  return `simple-erp-c${session.company_id}-stamp-image`
}

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
  container.style.width = '300mm'
  container.style.background = 'white'
  document.body.appendChild(container)

  const topSection = createInvoiceHTML(transaction, company, customer, 'supplier')
  container.innerHTML = topSection
  await new Promise(resolve => setTimeout(resolve, 100))

  const topCanvas = await html2canvas(container, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    allowTaint: false,
    imageTimeout: 0,
    windowWidth: 1200,
    windowHeight: 1588
  })

  const bottomSection = createInvoiceHTML(transaction, company, customer, 'customer')
  container.innerHTML = bottomSection
  await new Promise(resolve => setTimeout(resolve, 100))

  const bottomCanvas = await html2canvas(container, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    allowTaint: false,
    imageTimeout: 0,
    windowWidth: 1200,
    windowHeight: 1588
  })

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true
  })

  const topImgData = topCanvas.toDataURL('image/png')
  doc.addImage(topImgData, 'PNG', 0, 0, 210, 148.5, undefined, 'FAST')

  // 절취선 그리기 (점선만)
  const cutLine = INVOICE_LAYOUT.cutLine
  doc.setLineDash([3, 3])
  doc.setDrawColor(100, 100, 100)
  doc.setLineWidth(0.5)
  doc.line(15, cutLine.y, 195, cutLine.y)
  doc.setLineDash([])

  const bottomImgData = bottomCanvas.toDataURL('image/png')
  doc.addImage(bottomImgData, 'PNG', 0, 148.5, 210, 148.5, undefined, 'FAST')

  document.body.removeChild(container)

  if (action === 'download') {
    const fileName = `거래명세서_${customer?.name || '거래처'}_${transaction.transaction_date}.pdf`
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
  const stampKey = getStampStorageKey()
  const stampImage = localStorage.getItem(stampKey) || ''
  
  const color = type === 'supplier' ? '#1e40af' : '#dc2626'
  const label = type === 'supplier' ? '공급자 보관용' : '구매자 보관용'

  return `
    <div id="invoice-container" style="
      padding: 8mm 45mm;
      font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif;
      font-size: 10.5pt;
      width: 300mm;
      box-sizing: border-box;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      transform: none;
      font-weight: 600;
    ">
      <div style="text-align: center; margin-bottom: 6mm;">
        <h1 style="
          font-size: 22pt; 
          margin: 0; 
          font-weight: 800; 
          color: ${color};
          letter-spacing: 10px;
        ">
          거 래 명 세 서
        </h1>
        <div style="
          font-size: 11pt; 
          color: ${color}; 
          font-weight: 700; 
          margin-top: 3mm;
          letter-spacing: 2px;
        ">
          [ ${label} ]
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; margin-bottom: 5mm; gap: 4mm;">
        <div style="flex: 1.4; border: 2px solid ${color}; padding: 4mm;">
          <div style="
            font-weight: 800; 
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
              <td style="padding: 5px 6px; width: 60px; font-weight: 800; font-size: 9.5pt;">상호</td>
              <td style="padding: 5px 6px; display: flex; align-items: center; justify-content: space-between;">
                <span style="font-size: 10.5pt; font-weight: 800;">${company.name}</span>
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
                    font-weight: 800; 
                    margin-left: 3mm;
                  ">
                    인
                  </div>
                `}
              </td>
            </tr>
            <tr>
              <td style="padding: 5px 6px; font-weight: 700; font-size: 9pt;">사업자</td>
              <td style="padding: 5px 6px; font-size: 9pt; font-weight: 600;">${company.business_number || ''}</td>
            </tr>
            <tr>
              <td style="padding: 5px 6px; font-weight: 700; font-size: 9pt;">대표자</td>
              <td style="padding: 5px 6px; font-size: 9pt; font-weight: 600;">${company.ceo_name || ''}</td>
            </tr>
            <tr>
              <td style="padding: 5px 6px; font-weight: 700; font-size: 9pt;">주소</td>
              <td style="padding: 5px 6px; font-size: 8.5pt; font-weight: 600;">${company.address || ''}</td>
            </tr>
            <tr>
              <td style="padding: 5px 6px; font-weight: 700; font-size: 9pt;">전화</td>
              <td style="padding: 5px 6px; font-size: 9pt; font-weight: 600;">${company.phone || ''}</td>
            </tr>
          </table>
        </div>

        <div style="flex: 1; border: 2px solid ${color}; padding: 4mm;">
          <div style="
            font-weight: 800; 
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
              <td style="padding: 5px 6px; width: 60px; font-weight: 800; font-size: 9.5pt;">상호</td>
              <td style="padding: 5px 6px; font-size: 10.5pt; font-weight: 800;">${customer?.name || '-'}</td>
            </tr>
            <tr>
              <td style="padding: 5px 6px; font-weight: 700; font-size: 9pt;">사업자</td>
              <td style="padding: 5px 6px; font-size: 9pt; font-weight: 600;">${customer?.business_number || '-'}</td>
            </tr>
            <tr>
              <td style="padding: 5px 6px; font-weight: 700; font-size: 9pt;">대표자</td>
              <td style="padding: 5px 6px; font-size: 9pt; font-weight: 600;">${customer?.contact_person || '-'}</td>
            </tr>
            <tr>
              <td style="padding: 5px 6px; font-weight: 700; font-size: 9pt;">주소</td>
              <td style="padding: 5px 6px; font-size: 8.5pt; font-weight: 600;">${customer?.address || '-'}</td>
            </tr>
            <tr>
              <td style="padding: 5px 6px; font-weight: 700; font-size: 9pt;">전화</td>
              <td style="padding: 5px 6px; font-size: 9pt; font-weight: 600;">${customer?.phone || '-'}</td>
            </tr>
          </table>
        </div>
      </div>

      <div style="
        margin-bottom: 5mm; 
        padding: 3mm 6mm; 
        background: #f5f7fa; 
        border: 2px solid ${color};
      ">
        <div style="font-size: 10pt; font-weight: 700;">
          <strong style="color: ${color};">거래일:</strong> ${transaction.transaction_date}
        </div>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 4mm;">
        <thead>
          <tr style="background: ${color}; color: white;">
            <th style="border: 2px solid ${color}; padding: 10px 6px; text-align: center; width: 25%; font-size: 10.5pt; font-weight: 800; letter-spacing: 2px;">품목</th>
            <th style="border: 2px solid ${color}; padding: 10px 6px; text-align: center; width: 25%; font-size: 10.5pt; font-weight: 800; letter-spacing: 2px;">이력번호</th>
            <th style="border: 2px solid ${color}; padding: 10px 6px; text-align: center; width: 15%; font-size: 10.5pt; font-weight: 800; letter-spacing: 2px;">수량</th>
            <th style="border: 2px solid ${color}; padding: 10px 6px; text-align: center; width: 17%; font-size: 10.5pt; font-weight: 800; letter-spacing: 2px;">단가</th>
            <th style="border: 2px solid ${color}; padding: 10px 6px; text-align: center; width: 18%; font-size: 10.5pt; font-weight: 800; letter-spacing: 2px;">금액</th>
          </tr>
        </thead>
        <tbody>
          ${transaction.items?.map(item => `
            <tr>
              <td style="border: 1px solid #ddd; padding: 9px 6px; text-align: center; font-size: 10pt; font-weight: 700;">${item.product_name}</td>
              <td style="border: 1px solid #ddd; padding: 9px 6px; text-align: center; font-size: 9pt; font-weight: 600;">${item.traceability_number || '-'}</td>
              <td style="border: 1px solid #ddd; padding: 9px 6px; text-align: center; font-size: 10pt; font-weight: 700;">${item.quantity}${item.unit}</td>
              <td style="border: 1px solid #ddd; padding: 9px 6px; text-align: right; font-size: 10pt; font-weight: 700;">${formatCurrency(item.unit_price)}</td>
              <td style="border: 1px solid #ddd; padding: 9px 6px; text-align: right; font-size: 10.5pt; font-weight: 800;">${formatCurrency(item.total_price)}</td>
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

      <div style="margin-bottom: 4mm;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="background: #f8f9fa;">
            <td style="border: 2px solid ${color}; padding: 7px 8px; text-align: center; width: 20%; font-weight: 800; font-size: 10pt; letter-spacing: 2px;">공급가액</td>
            <td style="border: 2px solid ${color}; padding: 7px 8px; text-align: right; width: 30%; font-size: 10pt; font-weight: 700;">${formatCurrency(supplyPrice)}</td>
            <td style="border: 2px solid ${color}; padding: 7px 8px; text-align: center; width: 20%; font-weight: 800; font-size: 10pt; letter-spacing: 2px;">부가세</td>
            <td style="border: 2px solid ${color}; padding: 7px 8px; text-align: right; width: 30%; font-size: 10pt; font-weight: 700;">${formatCurrency(transaction.tax_amount)}</td>
          </tr>
          <tr style="background: ${color}; color: white;">
            <td colspan="2" style="border: 2px solid ${color}; padding: 9px 8px; text-align: center; font-weight: 800; font-size: 12pt; letter-spacing: 4px;">합 계</td>
            <td colspan="2" style="border: 2px solid ${color}; padding: 9px 8px; text-align: right; font-weight: 800; font-size: 12pt;">${formatCurrency(transaction.total_amount)}</td>
          </tr>
        </table>
      </div>

      <div style="margin-bottom: 4mm; padding: 4mm; border: 2px solid #ddd; background: #fafafa; min-height: 12mm;">
        <div style="font-weight: 800; margin-bottom: 2mm; font-size: 10pt;">메모:</div>
        <div style="line-height: 1.4; white-space: pre-line; font-size: 9.5pt; font-weight: 600;">${transaction.notes || company.default_invoice_memo || '___________________________________________________________'}</div>
      </div>

      <div style="display: flex; justify-content: space-between; font-size: 10pt; padding: 3mm 4mm; border-top: 2px solid ${color}; font-weight: 700;">
        <div><strong style="color: ${color};">발행일:</strong> ${new Date().toISOString().split('T')[0]}</div>
        <div><strong style="color: ${color};">발행자:</strong> ${company.name} (인)</div>
      </div>
    </div>
  `
}
