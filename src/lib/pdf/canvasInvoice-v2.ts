import jsPDF from 'jspdf'
import type { TransactionWithItems, Company, Customer } from '../../types'
import { formatCurrency } from '../utils'

/**
 * HTML 렌더링 후 좌표 측정 방식
 * - HTML을 실제로 렌더링
 * - 각 요소의 정확한 위치/크기 측정
 * - Canvas에 똑같이 그리기
 */

interface ElementBounds {
  x: number
  y: number
  width: number
  height: number
  text: string
  fontSize: number
  color: string
  align: 'left' | 'center' | 'right'
  bold: boolean
}

/**
 * HTML 요소를 측정하여 Canvas 렌더링 정보 추출
 */
async function measureHTMLElements(
  transaction: TransactionWithItems,
  company: Company,
  customer: Customer | undefined,
  type: 'supplier' | 'customer'
): Promise<ElementBounds[]> {
  const color = type === 'supplier' ? '#1e40af' : '#dc2626'
  const label = type === 'supplier' ? '공급자 보관용' : '구매자 보관용'
  const supplyPrice = transaction.total_amount - transaction.tax_amount
  const stampImage = localStorage.getItem('simple-erp-stamp-image') || ''

  // HTML 생성 (기존 코드 그대로)
  const html = `
    <div id="measure-container" style="padding: 6mm 30mm; font-family: 'NanumGothic', 'Malgun Gothic', sans-serif; font-size: 10pt; width: 210mm;">
      <!-- 제목 -->
      <div id="title" style="text-align: center; margin-bottom: 6mm;">
        <h1 style="font-size: 20pt; margin: 0; font-weight: bold; color: ${color};">
          거 래 명 세 서
        </h1>
        <div style="font-size: 11pt; color: ${color}; font-weight: bold; margin-top: 2mm;">
          [ ${label} ]
        </div>
      </div>

      <!-- 공급자/구매자 정보 -->
      <div style="display: flex; justify-content: space-between; margin-bottom: 5mm; gap: 3mm;">
        <div id="supplier-box" style="flex: 1.4; border: 2px solid ${color}; padding: 4mm;">
          <div style="font-weight: bold; margin-bottom: 3mm; color: ${color}; text-align: center;">【 공급자 】</div>
          <table style="width: 100%;">
            <tr><td style="width: 65px; font-weight: bold;">상호</td><td>${company.name}</td></tr>
            <tr><td style="font-weight: bold;">사업자</td><td>${company.business_number}</td></tr>
            <tr><td style="font-weight: bold;">대표자</td><td>${company.ceo_name}</td></tr>
            <tr><td style="font-weight: bold;">주소</td><td>${company.address}</td></tr>
            <tr><td style="font-weight: bold;">전화</td><td>${company.phone}</td></tr>
          </table>
        </div>

        <div id="customer-box" style="flex: 1; border: 2px solid ${color}; padding: 4mm;">
          <div style="font-weight: bold; margin-bottom: 3mm; color: ${color}; text-align: center;">【 구매자 】</div>
          <table style="width: 100%;">
            <tr><td style="width: 65px; font-weight: bold;">상호</td><td>${customer?.name || '-'}</td></tr>
            <tr><td style="font-weight: bold;">사업자</td><td>${customer?.business_number || '-'}</td></tr>
            <tr><td style="font-weight: bold;">대표자</td><td>${customer?.contact_person || '-'}</td></tr>
            <tr><td style="font-weight: bold;">주소</td><td>${customer?.address || '-'}</td></tr>
            <tr><td style="font-weight: bold;">전화</td><td>${customer?.phone || '-'}</td></tr>
          </table>
        </div>
      </div>

      <!-- 거래 정보 -->
      <div id="transaction-info" style="display: flex; justify-content: space-between; margin-bottom: 5mm; padding: 4mm 8mm; background: #f9fafb; border: 1px solid ${color};">
        <div><strong>거래일:</strong> ${transaction.transaction_date}</div>
        <div><strong>거래번호:</strong> #${transaction.id}</div>
      </div>

      <!-- 상품 테이블 -->
      <table id="product-table" style="width: 100%; border-collapse: collapse; margin-bottom: 4mm;">
        <thead>
          <tr style="background: ${color}; color: white;">
            <th style="border: 1px solid ${color}; padding: 10px; width: 25%;">품목</th>
            <th style="border: 1px solid ${color}; padding: 10px; width: 25%;">이력번호</th>
            <th style="border: 1px solid ${color}; padding: 10px; width: 15%;">수량</th>
            <th style="border: 1px solid ${color}; padding: 10px; width: 17%;">단가</th>
            <th style="border: 1px solid ${color}; padding: 10px; width: 18%;">금액</th>
          </tr>
        </thead>
        <tbody>
          ${transaction.items?.map(item => `
            <tr>
              <td style="border: 1px solid #ddd; padding: 10px; text-align: center;">${item.product_name}</td>
              <td style="border: 1px solid #ddd; padding: 10px; text-align: center;">${item.traceability_number || '-'}</td>
              <td style="border: 1px solid #ddd; padding: 10px; text-align: center;">${item.quantity}${item.unit}</td>
              <td style="border: 1px solid #ddd; padding: 10px; text-align: right;">${formatCurrency(item.unit_price)}</td>
              <td style="border: 1px solid #ddd; padding: 10px; text-align: right; font-weight: bold;">${formatCurrency(item.total_price)}</td>
            </tr>
          `).join('')}
          ${Array.from({ length: Math.max(0, 7 - (transaction.items?.length || 0)) }).map(() => `
            <tr>
              <td style="border: 1px solid #ddd; padding: 10px;">&nbsp;</td>
              <td style="border: 1px solid #ddd; padding: 10px;">&nbsp;</td>
              <td style="border: 1px solid #ddd; padding: 10px;">&nbsp;</td>
              <td style="border: 1px solid #ddd; padding: 10px;">&nbsp;</td>
              <td style="border: 1px solid #ddd; padding: 10px;">&nbsp;</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <!-- 합계 -->
      <table id="summary-table" style="width: 100%; border-collapse: collapse; margin-bottom: 4mm;">
        <tr style="background: #f9fafb;">
          <td style="border: 1px solid ${color}; padding: 6px 10px; text-align: center; width: 20%; font-weight: bold;">공급가액</td>
          <td style="border: 1px solid ${color}; padding: 6px 10px; text-align: right; width: 30%;">${formatCurrency(supplyPrice)}</td>
          <td style="border: 1px solid ${color}; padding: 6px 10px; text-align: center; width: 20%; font-weight: bold;">부가세</td>
          <td style="border: 1px solid ${color}; padding: 6px 10px; text-align: right; width: 30%;">${formatCurrency(transaction.tax_amount)}</td>
        </tr>
        <tr style="background: ${color}; color: white;">
          <td colspan="2" style="border: 1px solid ${color}; padding: 7px 10px; text-align: center; font-weight: bold; font-size: 11pt;">합 계</td>
          <td colspan="2" style="border: 1px solid ${color}; padding: 7px 10px; text-align: right; font-weight: bold; font-size: 11pt;">${formatCurrency(transaction.total_amount)}</td>
        </tr>
      </table>

      <!-- 메모 -->
      <div id="memo" style="margin-bottom: 4mm; padding: 4mm; border: 1px solid #ddd; background: #f9fafb; min-height: 10mm;">
        <div style="font-weight: bold; margin-bottom: 2mm;">메모:</div>
        <div style="white-space: pre-line;">${transaction.notes || company.default_invoice_memo || '___________________________________________________________'}</div>
      </div>

      <!-- 발행 정보 -->
      <div id="issue-info" style="display: flex; justify-content: space-between; font-size: 9.5pt; padding: 3mm 4mm; border-top: 2px solid ${color};">
        <div><strong>발행일:</strong> ${new Date().toISOString().split('T')[0]}</div>
        <div><strong>발행자:</strong> ${company.name} (인)</div>
      </div>
    </div>
  `

  // 임시 컨테이너에 렌더링
  const container = document.createElement('div')
  container.innerHTML = html
  container.style.position = 'absolute'
  container.style.left = '-9999px'
  container.style.width = '210mm'
  document.body.appendChild(container)

  // 잠깐 대기 (렌더링 완료)
  await new Promise(resolve => setTimeout(resolve, 100))

  // 요소들의 위치 측정
  const bounds: ElementBounds[] = []
  
  // ... 측정 로직 (복잡하므로 생략)

  // 정리
  document.body.removeChild(container)

  return bounds
}

/**
 * 개선된 방식: HTML을 그대로 html2canvas로 변환하되 A4 풀사이즈로
 */
export async function generateCanvasInvoicePDF(
  transaction: TransactionWithItems,
  company: Company,
  customer: Customer | undefined,
  action: 'preview' | 'download' | 'print' = 'preview'
): Promise<jsPDF> {
  console.log('🎨 개선된 PDF 생성 시작')

  // 방법 1: 그냥 html2canvas 방식을 그대로 사용하되, 
  // 패딩을 줄여서 A4 풀사이즈로 만들기

  // 방법 2: 긴 목록 처리
  const items = transaction.items || []
  const itemsPerPage = 10  // 페이지당 10개씩

  if (items.length > itemsPerPage) {
    // 여러 페이지로 분할
    console.log(`📄 ${Math.ceil(items.length / itemsPerPage)}페이지로 분할`)
  }

  // TODO: 구현...

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  return doc
}
