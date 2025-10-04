import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import type { InvoiceData, PDFAction } from './types'
import { formatCurrency } from '../utils'
import { getCurrentSession } from '../auth'

/**
 * 거래명세서 V3 템플릿
 * - 분홍색 줄무늬 배경 (실제 고기 유통업체 양식 참고)
 * - 빨간색 테두리
 * - 7컬럼: No | 품목 | 규격 | 수량 | 단가 | 공급가액 | 기타
 * - 하단: 입금액 | 할인액 | 미수금 | 합계액 | 현진액
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
 * V3 템플릿 HTML 생성
 */
function createInvoiceHTMLV3(invoiceData: InvoiceData, copyType: 'supplier' | 'customer'): string {
  const { transaction, customer, company, paymentInfo, accountInfo } = invoiceData

  // 도장 이미지 가져오기 - company 객체에서 직접 ID 사용
  const companyId = company.id
  const stampKey = companyId ? `simple-erp-c${companyId}-stamp-image` : 'simple-erp-stamp-image'
  const stampImage = localStorage.getItem(stampKey) || ''

  // 입금액/지급액, 합계액, 미수금/미지급금, 현잔액
  const 입금액 = paymentInfo.입금액
  const 합계액 = paymentInfo.합계액
  const 미수금 = paymentInfo.미수금
  const 현잔액 = paymentInfo.현잔액

  // 🆕 매출/매입 구분
  const isSales = transaction.transaction_type === 'sales'
  const paymentLabel = isSales ? '입금액' : '지급액'
  const balanceLabel = isSales ? '미수금' : '미지급금'

  // 테이블 행 생성 (최대 14줄, 빈 줄 포함)
  const maxRows = 14
  const itemRows: string[] = []

  transaction.items.forEach((item, index) => {
    const 공급가액 = item.total_price
    const rowClass = index % 2 === 0 ? 'row-white' : (copyType === 'customer' ? 'row-blue' : 'row-pink')
    const borderColor = copyType === 'customer' ? '#2563eb' : '#dc2626'

    itemRows.push(`
      <tr class="${rowClass}">
        <td class="text-center" style="width: 20px; border: 0.5px solid #ddd; padding: 4px 2px; font-size: 7.5px; vertical-align: middle;">${index + 1}</td>
        <td style="width: 70px; border: 0.5px solid #ddd; padding: 4px 2px; font-size: 7.5px; vertical-align: middle;">${item.product_name}</td>
        <td class="text-center" style="width: 90px; border: 0.5px solid #ddd; padding: 4px 2px; font-size: 7.5px; vertical-align: middle;">${item.traceability_number || '-'}</td>
        <td class="text-center" style="width: 40px; border: 0.5px solid #ddd; padding: 4px 2px; font-size: 7.5px; vertical-align: middle;">${item.origin || '-'}</td>
        <td class="text-center" style="width: 75px; border: 0.5px solid #ddd; padding: 4px 2px; font-size: 7.5px; vertical-align: middle;">${item.slaughterhouse || '-'}</td>
        <td class="text-right" style="width: 35px; border: 0.5px solid #ddd; padding: 4px 2px; font-size: 7.5px; vertical-align: middle;">${item.quantity.toFixed(2)}</td>
        <td class="text-center" style="width: 25px; border: 0.5px solid #ddd; padding: 4px 2px; font-size: 7.5px; vertical-align: middle;">${item.unit}</td>
        <td class="text-right" style="width: 55px; border: 0.5px solid #ddd; padding: 4px 2px; font-size: 7.5px; vertical-align: middle;">${formatCurrency(item.unit_price)}</td>
        <td class="text-right" style="width: 65px; border: 0.5px solid #ddd; padding: 4px 2px; font-size: 7.5px; vertical-align: middle;">${formatCurrency(공급가액)}</td>
        <td style="width: 45px; border: 0.5px solid #ddd; padding: 4px 2px; font-size: 7.5px; vertical-align: middle;">${item.notes || ''}</td>
      </tr>
    `)
  })

  // 빈 줄 추가
  for (let i = transaction.items.length; i < maxRows; i++) {
    const rowClass = i % 2 === 0 ? 'row-white' : (copyType === 'customer' ? 'row-blue' : 'row-pink')
    const borderColor = copyType === 'customer' ? '#2563eb' : '#dc2626'
    itemRows.push(`
      <tr class="${rowClass}">
        <td style="border: 0.5px solid #ddd; padding: 4px 2px; vertical-align: middle;">&nbsp;</td>
        <td style="border: 0.5px solid #ddd; padding: 4px 2px; vertical-align: middle;"></td>
        <td style="border: 0.5px solid #ddd; padding: 4px 2px; vertical-align: middle;"></td>
        <td style="border: 0.5px solid #ddd; padding: 4px 2px; vertical-align: middle;"></td>
        <td style="border: 0.5px solid #ddd; padding: 4px 2px; vertical-align: middle;"></td>
        <td style="border: 0.5px solid #ddd; padding: 4px 2px; vertical-align: middle;"></td>
        <td style="border: 0.5px solid #ddd; padding: 4px 2px; vertical-align: middle;"></td>
        <td style="border: 0.5px solid #ddd; padding: 4px 2px; vertical-align: middle;"></td>
        <td style="border: 0.5px solid #ddd; padding: 4px 2px; vertical-align: middle;"></td>
        <td style="border: 0.5px solid #ddd; padding: 4px 2px; vertical-align: middle;"></td>
      </tr>
    `)
  }

  return `
    <div style="
      width: 210mm;
      height: 148mm;
      padding: 10mm;
      font-family: 'Malgun Gothic', sans-serif;
      background: white;
      box-sizing: border-box;
    ">
      <!-- 상단: 제목 및 공급자/납품처 정보 -->
      <div style="margin-bottom: 6px;">
        <!-- 제목 -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
          <div style="font-size: 10px; margin-left: 4px;">
            작성일: ${transaction.transaction_date}
          </div>
          <div style="
            border: 1px solid ${copyType === 'customer' ? '#2563eb' : '#dc2626'};
            padding: 3px 16px;
            background: white;
          ">
            <span style="font-size: 18px; font-weight: bold; color: #000;">거래명세서</span>
            <span style="font-size: 14px; ${copyType === 'supplier' ? 'color: #dc2626;' : 'color: #2563eb;'} margin-left: 8px;">
              (${copyType === 'supplier' ? '공급자 보관용' : '공급받는자 보관용'})
            </span>
          </div>
          <div style="width: 80px;"></div>
        </div>

        <!-- 공급자/납품처 정보 -->
        <div style="display: flex; margin-bottom: 6px;">
          <!-- 공급자 (왼쪽) -->
          <div style="display: flex; flex: 1; margin-right: 4px;">
            <div style="
              text-align: center;
              padding: 6px 2px;
              border: 1px solid ${copyType === 'customer' ? '#2563eb' : '#dc2626'};
              border-right: none;
              font-size: 10px;
              font-weight: bold;
              line-height: 1.4;
              background: ${copyType === 'customer' ? '#dbeafe' : '#fecaca'};
            ">공<br><br>급<br><br>자</div>
            <div style="
              flex: 1;
              border: 1px solid ${copyType === 'customer' ? '#2563eb' : '#dc2626'};
              padding: 6px;
            ">
              <table style="width: 100%; font-size: 9px; border-collapse: collapse;">
              <tr>
                <td style="width: 40px; font-weight: bold; border: 1px solid ${copyType === 'customer' ? '#2563eb' : '#dc2626'}; padding: 4px 2px;">상호</td>
                <td style="width: 100px; border: 1px solid ${copyType === 'customer' ? '#2563eb' : '#dc2626'}; padding: 4px 2px;">${company.name || ''}</td>
                <td style="width: 40px; font-weight: bold; border: 1px solid ${copyType === 'customer' ? '#2563eb' : '#dc2626'}; padding: 4px 2px;">성명</td>
                <td style="border: 1px solid ${copyType === 'customer' ? '#2563eb' : '#dc2626'}; padding: 4px 2px;">${company.ceo_name || ''}</td>
                <td rowspan="4" style="width: 60px; text-align: center; vertical-align: middle; border: 1px solid ${copyType === 'customer' ? '#2563eb' : '#dc2626'}; padding: 4px 2px;">
                  ${stampImage ? `<img src="${stampImage}" style="width: 45px; height: 45px;">` : '(인)'}
                </td>
              </tr>
              <tr>
                <td style="width: 55px; font-weight: bold; border: 1px solid ${copyType === 'customer' ? '#2563eb' : '#dc2626'}; padding: 4px 2px;">등록번호</td>
                <td colspan="3" style="border: 1px solid ${copyType === 'customer' ? '#2563eb' : '#dc2626'}; padding: 4px 2px;">${company.business_number || ''}</td>
              </tr>
              <tr>
                <td style="font-weight: bold; border: 1px solid ${copyType === 'customer' ? '#2563eb' : '#dc2626'}; padding: 4px 2px;">업태</td>
                <td style="border: 1px solid ${copyType === 'customer' ? '#2563eb' : '#dc2626'}; padding: 4px 2px;">${company.business_type || ''}</td>
                <td style="font-weight: bold; border: 1px solid ${copyType === 'customer' ? '#2563eb' : '#dc2626'}; padding: 4px 2px;">종목</td>
                <td style="border: 1px solid ${copyType === 'customer' ? '#2563eb' : '#dc2626'}; padding: 4px 2px;">${company.business_item || ''}</td>
              </tr>
              <tr>
                <td style="font-weight: bold; border: 1px solid ${copyType === 'customer' ? '#2563eb' : '#dc2626'}; padding: 4px 2px;">주소</td>
                <td colspan="3" style="border: 1px solid ${copyType === 'customer' ? '#2563eb' : '#dc2626'}; padding: 4px 2px;">${company.address || ''}</td>
              </tr>
              </table>
            </div>
          </div>

          <!-- 납품처 (오른쪽) -->
          <div style="display: flex; flex: 1; margin-left: 4px;">
            <div style="
              text-align: center;
              padding: 6px 2px;
              border: 1px solid ${copyType === 'customer' ? '#2563eb' : '#dc2626'};
              border-right: none;
              font-size: 10px;
              font-weight: bold;
              line-height: 1.4;
              background: ${copyType === 'customer' ? '#dbeafe' : '#fecaca'};
            ">공<br>급<br>받<br>는<br>자</div>
            <div style="
              flex: 1;
              border: 1px solid ${copyType === 'customer' ? '#2563eb' : '#dc2626'};
              padding: 6px;
            ">
              <table style="width: 100%; font-size: 9px; border-collapse: collapse;">
              <tr>
                <td style="width: 40px; font-weight: bold; border: 1px solid ${copyType === 'customer' ? '#2563eb' : '#dc2626'}; padding: 4px 2px;">상호</td>
                <td style="width: 100px; border: 1px solid ${copyType === 'customer' ? '#2563eb' : '#dc2626'}; padding: 4px 2px;">${customer.name || ''}</td>
                <td style="width: 40px; font-weight: bold; border: 1px solid ${copyType === 'customer' ? '#2563eb' : '#dc2626'}; padding: 4px 2px;">성명</td>
                <td style="border: 1px solid ${copyType === 'customer' ? '#2563eb' : '#dc2626'}; padding: 4px 2px;">${customer.ceo_name || ''}</td>
              </tr>
              <tr>
                <td style="width: 55px; font-weight: bold; border: 1px solid ${copyType === 'customer' ? '#2563eb' : '#dc2626'}; padding: 4px 2px;">등록번호</td>
                <td colspan="3" style="border: 1px solid ${copyType === 'customer' ? '#2563eb' : '#dc2626'}; padding: 4px 2px;">${customer.business_number || ''}</td>
              </tr>
              <tr>
                <td style="font-weight: bold; border: 1px solid ${copyType === 'customer' ? '#2563eb' : '#dc2626'}; padding: 4px 2px;">업태</td>
                <td style="border: 1px solid ${copyType === 'customer' ? '#2563eb' : '#dc2626'}; padding: 4px 2px;">${customer.business_type || ''}</td>
                <td style="font-weight: bold; border: 1px solid ${copyType === 'customer' ? '#2563eb' : '#dc2626'}; padding: 4px 2px;">종목</td>
                <td style="border: 1px solid ${copyType === 'customer' ? '#2563eb' : '#dc2626'}; padding: 4px 2px;">${customer.business_item || ''}</td>
              </tr>
              <tr>
                <td style="font-weight: bold; border: 1px solid ${copyType === 'customer' ? '#2563eb' : '#dc2626'}; padding: 4px 2px;">주소</td>
                <td colspan="3" style="border: 1px solid ${copyType === 'customer' ? '#2563eb' : '#dc2626'}; padding: 4px 2px;">${customer.address || ''}</td>
              </tr>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- 품목 테이블 -->
      <table style="
        width: 100%;
        border-collapse: collapse;
        border: 1px solid ${copyType === 'customer' ? '#2563eb' : '#dc2626'};
        font-size: 8px;
        line-height: 1.2;
        margin-bottom: 4px;
      ">
        <thead>
          <tr style="background: ${copyType === 'customer' ? '#dbeafe' : '#fecaca'}; font-weight: bold;">
            <th style="border: 0.5px solid #ddd; padding: 5px 2px; font-size: 7.5px; vertical-align: middle;">NO</th>
            <th style="border: 0.5px solid #ddd; padding: 5px 2px; font-size: 7.5px; vertical-align: middle;">품목</th>
            <th style="border: 0.5px solid #ddd; padding: 5px 2px; font-size: 7.5px; vertical-align: middle;">이력번호</th>
            <th style="border: 0.5px solid #ddd; padding: 5px 2px; font-size: 7.5px; vertical-align: middle;">원산지</th>
            <th style="border: 0.5px solid #ddd; padding: 5px 2px; font-size: 7.5px; vertical-align: middle;">도축장</th>
            <th style="border: 0.5px solid #ddd; padding: 5px 2px; font-size: 7.5px; vertical-align: middle;">수량</th>
            <th style="border: 0.5px solid #ddd; padding: 5px 2px; font-size: 7.5px; vertical-align: middle;">단위</th>
            <th style="border: 0.5px solid #ddd; padding: 5px 2px; font-size: 7.5px; vertical-align: middle;">단가</th>
            <th style="border: 0.5px solid #ddd; padding: 5px 2px; font-size: 7.5px; vertical-align: middle;">공급가액</th>
            <th style="border: 0.5px solid #ddd; padding: 5px 2px; font-size: 7.5px; vertical-align: middle;">기타</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows.join('')}
        </tbody>
      </table>

      <!-- 하단: 3단 레이아웃 (메모 | 입금액/미수금 | 합계액/현잔액) -->
      <div style="display: flex; margin-bottom: 4px;">
        <!-- 좌측: 메모 -->
        <div style="
          flex: 1;
          border: 1px solid ${copyType === 'customer' ? '#2563eb' : '#dc2626'};
          padding: 4px;
          margin-right: 4px;
          font-size: 9px;
          display: flex;
          align-items: center;
        ">
          <div>
            <span style="font-weight: bold;">메모:</span> ${company.default_invoice_memo || accountInfo || ''}
          </div>
        </div>

        <!-- 중앙: 입금액/미수금 (매출) 또는 지급액/미지급금 (매입) -->
        <div style="
          width: 140px;
          border: 1px solid ${copyType === 'customer' ? '#2563eb' : '#dc2626'};
          margin-right: 4px;
        ">
          <table style="width: 100%; font-size: 10px; border-collapse: collapse;">
            <tr style="background: ${copyType === 'customer' ? '#dbeafe' : '#fecaca'};">
              <td style="border: 1px solid ${copyType === 'customer' ? '#2563eb' : '#dc2626'}; padding: 4px; font-weight: bold; text-align: center; width: 50%;">${paymentLabel}</td>
              <td style="border: 1px solid ${copyType === 'customer' ? '#2563eb' : '#dc2626'}; padding: 4px; text-align: right; width: 50%;">${formatCurrency(입금액)}</td>
            </tr>
            <tr style="background: white;">
              <td style="border: 1px solid ${copyType === 'customer' ? '#2563eb' : '#dc2626'}; padding: 4px; font-weight: bold; text-align: center;">${balanceLabel}</td>
              <td style="border: 1px solid ${copyType === 'customer' ? '#2563eb' : '#dc2626'}; padding: 4px; text-align: right;">${formatCurrency(미수금)}</td>
            </tr>
          </table>
        </div>

        <!-- 우측: 합계액/현잔액 -->
        <div style="
          width: 140px;
          border: 1px solid ${copyType === 'customer' ? '#2563eb' : '#dc2626'};
          margin-left: 4px;
        ">
          <table style="width: 100%; font-size: 10px; border-collapse: collapse;">
            <tr style="background: ${copyType === 'customer' ? '#dbeafe' : '#fecaca'};">
              <td style="border: 1px solid ${copyType === 'customer' ? '#2563eb' : '#dc2626'}; padding: 4px; font-weight: bold; text-align: center; width: 50%;">합계액</td>
              <td style="border: 1px solid ${copyType === 'customer' ? '#2563eb' : '#dc2626'}; padding: 4px; text-align: right; width: 50%;">${formatCurrency(합계액)}</td>
            </tr>
            <tr style="background: white;">
              <td style="border: 1px solid ${copyType === 'customer' ? '#2563eb' : '#dc2626'}; padding: 4px; font-weight: bold; text-align: center; font-size: 11px;">현잔액</td>
              <td style="border: 1px solid ${copyType === 'customer' ? '#2563eb' : '#dc2626'}; padding: 4px; text-align: right; font-weight: bold; font-size: 12px;">${formatCurrency(현잔액)}</td>
            </tr>
          </table>
        </div>
      </div>


      <style>
        .row-white {
          background: white;
        }
        .row-pink {
          background: #fecaca;
        }
        .row-blue {
          background: #dbeafe;
        }
        .text-center {
          text-align: center;
        }
        .text-right {
          text-align: right;
          padding-right: 4px;
        }
      </style>
    </div>
  `
}

/**
 * V3 템플릿으로 거래명세서 PDF 생성
 */
export async function generateInvoicePDFV3(
  invoiceData: InvoiceData,
  action: PDFAction
): Promise<jsPDF> {
  await ensureFontsLoaded()

  const container = document.createElement('div')
  container.style.position = 'absolute'
  container.style.left = '-9999px'
  container.style.width = '210mm'
  container.style.background = 'white'
  document.body.appendChild(container)

  // 상단 섹션 (공급자 보관용)
  const topSection = createInvoiceHTMLV3(invoiceData, 'supplier')
  container.innerHTML = topSection
  await new Promise(resolve => setTimeout(resolve, 100))

  const topCanvas = await html2canvas(container, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    allowTaint: false,
    imageTimeout: 0
  })

  // 하단 섹션 (구매자 보관용)
  const bottomSection = createInvoiceHTMLV3(invoiceData, 'customer')
  container.innerHTML = bottomSection
  await new Promise(resolve => setTimeout(resolve, 100))

  const bottomCanvas = await html2canvas(container, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    allowTaint: false,
    imageTimeout: 0
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
    const fileName = `거래명세서_${invoiceData.customer.name}_${invoiceData.transaction.transaction_date}.pdf`
    doc.save(fileName)
  } else if (action === 'print') {
    doc.autoPrint()
    window.open(doc.output('bloburl'), '_blank')
  }

  return doc
}
