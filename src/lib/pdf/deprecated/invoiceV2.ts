import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import type { InvoiceData, PDFAction } from './types'
import { formatCurrency } from '../utils'
import { getCurrentSession } from '../auth'
import { formatMonthDay, calculateTax } from './invoiceDataBuilder'

/**
 * 거래명세서 V2 템플릿
 * - 8컬럼 품목 테이블 (월일/품목/규격/수량/단가/공급가액/세액/비고)
 * - 하단 입금/미수금/합계액/현잔액 표시
 * - 계좌 정보 표시
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

/**
 * V2 템플릿으로 거래명세서 PDF 생성
 */
export async function generateInvoicePDFV2(
  invoiceData: InvoiceData,
  action: PDFAction
): Promise<jsPDF> {
  await ensureFontsLoaded()
  
  const container = document.createElement('div')
  container.style.position = 'absolute'
  container.style.left = '-9999px'
  container.style.width = '300mm'
  container.style.background = 'white'
  document.body.appendChild(container)

  // 상단 섹션 (공급자 보관용)
  const topSection = createInvoiceHTMLV2(invoiceData, 'supplier')
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

  // 하단 섹션 (구매자 보관용)
  const bottomSection = createInvoiceHTMLV2(invoiceData, 'customer')
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

  // 상단 추가
  const topImgData = topCanvas.toDataURL('image/png')
  doc.addImage(topImgData, 'PNG', 0, 0, 210, 148.5, undefined, 'FAST')

  // 절취선 그리기
  ;(doc as any).setLineDash([3, 3])
  doc.setDrawColor(100, 100, 100)
  doc.setLineWidth(0.5)
  doc.line(15, 148.5, 195, 148.5)
  ;(doc as any).setLineDash([])

  // 하단 추가
  const bottomImgData = bottomCanvas.toDataURL('image/png')
  doc.addImage(bottomImgData, 'PNG', 0, 148.5, 210, 148.5, undefined, 'FAST')

  document.body.removeChild(container)

  // 액션 처리
  if (action === 'download') {
    const fileName = `거래명세서_${invoiceData.customer.name || '거래처'}_${invoiceData.transaction.transaction_date}.pdf`
    doc.save(fileName)
  } else if (action === 'print') {
    doc.autoPrint()
    window.open(doc.output('bloburl'), '_blank')
  }

  return doc
}

/**
 * V2 HTML 템플릿 생성
 */
function createInvoiceHTMLV2(
  invoiceData: InvoiceData,
  type: 'supplier' | 'customer'
): string {
  const { transaction, company, customer, paymentInfo, accountInfo } = invoiceData
  
  const stampKey = getStampStorageKey()
  const stampImage = localStorage.getItem(stampKey) || ''
  
  const color = type === 'supplier' ? '#dc2626' : '#dc2626'  // 빨간색 통일
  const label = type === 'supplier' ? '공급자 보관용' : '보관용'

  // 공급가액 계산 (품목별 합계)
  const supplyAmount = transaction.total_amount - transaction.tax_amount

  return `
    <div id="invoice-container" style="
      padding: 8mm 45mm;
      font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif;
      font-size: 10pt;
      width: 300mm;
      box-sizing: border-box;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      transform: none;
      font-weight: 600;
    ">
      <!-- 상단: 작성일 + 제목 + 보관용 표시 -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6mm;">
        <div style="font-size: 10pt; font-weight: 700;">
          작성일: ${transaction.transaction_date}
        </div>
        
        <div style="flex: 1; text-align: center;">
          <div style="
            display: inline-block;
            border: 3px solid ${color};
            padding: 8px 40px;
            font-size: 22pt;
            font-weight: 800;
            color: ${color};
            letter-spacing: 8px;
          ">
            거래명세서
          </div>
        </div>
        
        <div style="text-align: right; font-size: 10pt; font-weight: 700;">
          <div>${label}</div>
          <div style="margin-top: 10mm;">담당자:</div>
        </div>
      </div>

      <!-- 공급자 / 공급받는자 정보 -->
      <div style="display: flex; justify-content: space-between; margin-bottom: 5mm; gap: 4mm;">
        <!-- 공급자 -->
        <div style="flex: 1; border: 2px solid #000; padding: 3mm;">
          <div style="
            font-weight: 800;
            margin-bottom: 2mm;
            text-align: center;
            font-size: 10pt;
            padding: 2px 0;
            border: 1px solid #000;
          ">
            공급자
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 9pt;">
            <tr>
              <td style="padding: 3px 4px; width: 80px; font-weight: 700;">동록번호</td>
              <td style="padding: 3px 4px; font-weight: 600;">${company.business_number || ''}</td>
            </tr>
            <tr>
              <td style="padding: 3px 4px; font-weight: 700; display: flex; align-items: flex-start;">
                <div>상 호</div>
                ${stampImage ? '' : `
                  <div style="
                    width: 14mm;
                    height: 14mm;
                    border: 2px solid ${color};
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: ${color};
                    font-size: 10pt;
                    font-weight: 800;
                    margin-left: auto;
                  ">
                    인
                  </div>
                `}
              </td>
              <td style="padding: 3px 4px; position: relative;">
                <span style="font-size: 11pt; font-weight: 800;">${company.name}</span>
                ${stampImage ? `
                  <img src="${stampImage}" style="
                    position: absolute;
                    right: 4px;
                    top: -4px;
                    width: 16mm;
                    height: 16mm;
                  " />
                ` : ''}
              </td>
            </tr>
            <tr>
              <td style="padding: 3px 4px; font-weight: 700;">주 소</td>
              <td style="padding: 3px 4px; font-size: 8.5pt; font-weight: 600;">${company.address || ''}</td>
            </tr>
            <tr>
              <td style="padding: 3px 4px; font-weight: 700;">사업자</td>
              <td style="padding: 3px 4px; font-weight: 600;">${company.ceo_name || ''}</td>
            </tr>
          </table>
        </div>

        <!-- 공급받는자 -->
        <div style="flex: 1; border: 2px solid #000; padding: 3mm;">
          <div style="
            font-weight: 800;
            margin-bottom: 2mm;
            text-align: center;
            font-size: 10pt;
            padding: 2px 0;
            border: 1px solid #000;
          ">
            공급받는자
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 9pt;">
            <tr>
              <td style="padding: 3px 4px; width: 80px; font-weight: 700;">동록번호</td>
              <td style="padding: 3px 4px; font-weight: 600;">${customer?.business_number || ''}</td>
            </tr>
            <tr>
              <td style="padding: 3px 4px; font-weight: 700;">상 호</td>
              <td style="padding: 3px 4px; font-size: 11pt; font-weight: 800;">${customer?.name || '-'}</td>
            </tr>
            <tr>
              <td style="padding: 3px 4px; font-weight: 700;">주 소</td>
              <td style="padding: 3px 4px; font-size: 8.5pt; font-weight: 600;">${customer?.address || '-'}</td>
            </tr>
            <tr>
              <td style="padding: 3px 4px; font-weight: 700;">사업자</td>
              <td style="padding: 3px 4px; font-weight: 600;">${customer?.ceo_name || '-'}</td>
            </tr>
          </table>
        </div>
      </div>

      <!-- 품목 테이블 (8컬럼) -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 3mm;">
        <thead>
          <tr style="background: #f0f0f0; border: 2px solid #000;">
            <th style="border: 1px solid #666; padding: 6px 4px; text-align: center; width: 8%; font-size: 9pt; font-weight: 800;">월일</th>
            <th style="border: 1px solid #666; padding: 6px 4px; text-align: center; width: 20%; font-size: 9pt; font-weight: 800;">품목</th>
            <th style="border: 1px solid #666; padding: 6px 4px; text-align: center; width: 15%; font-size: 9pt; font-weight: 800;">규격</th>
            <th style="border: 1px solid #666; padding: 6px 4px; text-align: center; width: 10%; font-size: 9pt; font-weight: 800;">수량</th>
            <th style="border: 1px solid #666; padding: 6px 4px; text-align: center; width: 12%; font-size: 9pt; font-weight: 800;">단가</th>
            <th style="border: 1px solid #666; padding: 6px 4px; text-align: center; width: 14%; font-size: 9pt; font-weight: 800;">공급가액</th>
            <th style="border: 1px solid #666; padding: 6px 4px; text-align: center; width: 11%; font-size: 9pt; font-weight: 800;">세액</th>
            <th style="border: 1px solid #666; padding: 6px 4px; text-align: center; width: 10%; font-size: 9pt; font-weight: 800;">비고</th>
          </tr>
        </thead>
        <tbody>
          ${transaction.items?.map(item => {
            const itemSupplyAmount = item.total_price
            const itemTaxAmount = calculateTax(itemSupplyAmount)
            
            // 규격: 원산지 + 도축장 + 이력번호
            const specs = [
              item.origin,
              item.slaughterhouse,
              item.traceability_number
            ].filter(Boolean).join(' ')
            
            return `
              <tr>
                <td style="border: 1px solid #ddd; padding: 5px 4px; text-align: center; font-size: 8.5pt; font-weight: 600;">${formatMonthDay(transaction.transaction_date)}</td>
                <td style="border: 1px solid #ddd; padding: 5px 4px; text-align: center; font-size: 9.5pt; font-weight: 700;">${item.product_name}</td>
                <td style="border: 1px solid #ddd; padding: 5px 4px; text-align: center; font-size: 8pt; font-weight: 600;">${specs || '-'}</td>
                <td style="border: 1px solid #ddd; padding: 5px 4px; text-align: center; font-size: 9pt; font-weight: 700;">${item.quantity}</td>
                <td style="border: 1px solid #ddd; padding: 5px 4px; text-align: right; font-size: 9pt; font-weight: 700;">${formatCurrency(item.unit_price)}</td>
                <td style="border: 1px solid #ddd; padding: 5px 4px; text-align: right; font-size: 9.5pt; font-weight: 800;">${formatCurrency(itemSupplyAmount)}</td>
                <td style="border: 1px solid #ddd; padding: 5px 4px; text-align: right; font-size: 9pt; font-weight: 700;">${formatCurrency(itemTaxAmount)}</td>
                <td style="border: 1px solid #ddd; padding: 5px 4px; text-align: center; font-size: 8.5pt; font-weight: 600;"></td>
              </tr>
            `
          }).join('') || ''}
          ${Array.from({ length: Math.max(0, 5 - (transaction.items?.length || 0)) }).map(() => `
            <tr>
              <td style="border: 1px solid #ddd; padding: 5px 4px; height: 28px;">&nbsp;</td>
              <td style="border: 1px solid #ddd; padding: 5px 4px;">&nbsp;</td>
              <td style="border: 1px solid #ddd; padding: 5px 4px;">&nbsp;</td>
              <td style="border: 1px solid #ddd; padding: 5px 4px;">&nbsp;</td>
              <td style="border: 1px solid #ddd; padding: 5px 4px;">&nbsp;</td>
              <td style="border: 1px solid #ddd; padding: 5px 4px;">&nbsp;</td>
              <td style="border: 1px solid #ddd; padding: 5px 4px;">&nbsp;</td>
              <td style="border: 1px solid #ddd; padding: 5px 4px;">&nbsp;</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <!-- 계좌 정보 -->
      ${accountInfo ? `
        <div style="
          margin-bottom: 3mm;
          padding: 4px 6px;
          border: 1px solid #ddd;
          background: #fafafa;
          font-size: 8.5pt;
          font-weight: 600;
          text-align: center;
        ">
          ${accountInfo}
        </div>
      ` : ''}

      <!-- 하단 합계 영역 -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 3mm;">
        <tr style="border: 2px solid #000;">
          <td style="border: 1px solid #666; padding: 6px 8px; text-align: center; width: 20%; font-weight: 800; font-size: 9.5pt; background: #f0f0f0;">입금액</td>
          <td style="border: 1px solid #666; padding: 6px 8px; text-align: center; width: 20%; font-weight: 800; font-size: 9.5pt; background: #f0f0f0;">미수금</td>
          <td style="border: 1px solid #666; padding: 6px 8px; text-align: center; width: 20%; font-weight: 800; font-size: 9.5pt; background: #f0f0f0;">합계액</td>
          <td style="border: 1px solid #666; padding: 6px 8px; text-align: center; width: 20%; font-weight: 800; font-size: 9.5pt; background: #f0f0f0;">현잔액</td>
          <td style="border: 1px solid #666; padding: 6px 8px; text-align: center; width: 20%; font-weight: 800; font-size: 9.5pt; background: #f0f0f0;">확인란</td>
        </tr>
        <tr style="border: 2px solid #000;">
          <td style="border: 1px solid #666; padding: 6px 8px; text-align: right; font-size: 10pt; font-weight: 700;">${formatCurrency(paymentInfo.입금액)}</td>
          <td style="border: 1px solid #666; padding: 6px 8px; text-align: right; font-size: 10pt; font-weight: 700;">${formatCurrency(paymentInfo.미수금)}</td>
          <td style="border: 1px solid #666; padding: 6px 8px; text-align: right; font-size: 10pt; font-weight: 800;">${formatCurrency(paymentInfo.합계액)}</td>
          <td style="border: 1px solid #666; padding: 6px 8px; text-align: right; font-size: 10pt; font-weight: 700;">${formatCurrency(paymentInfo.현잔액)}</td>
          <td style="border: 1px solid #666; padding: 6px 8px; text-align: center; font-size: 9pt; font-weight: 700;">(인) 1/1</td>
        </tr>
      </table>

      <!-- 메모 -->
      ${transaction.notes && !accountInfo?.includes(transaction.notes) ? `
        <div style="
          padding: 4mm;
          border: 1px solid #ddd;
          background: #fafafa;
          min-height: 10mm;
          font-size: 9pt;
          font-weight: 600;
          line-height: 1.4;
        ">
          <div style="font-weight: 800; margin-bottom: 2mm;">메모:</div>
          <div style="white-space: pre-line;">${transaction.notes}</div>
        </div>
      ` : ''}
    </div>
  `
}
