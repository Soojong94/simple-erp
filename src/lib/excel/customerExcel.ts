import { generateExcel, SheetData } from './excelGenerator'
import type { Customer } from '../../types'

export interface CustomerExcelFilters {
  customerType: 'all' | 'customer' | 'supplier'
  isActive: 'all' | 'true' | 'false'
  searchQuery?: string
}

/**
 * 거래처 목록 Excel 생성
 */
export function generateCustomerExcel(
  customers: Customer[],
  filters: CustomerExcelFilters
): void {
  // 1. 통계 계산
  const totalCustomers = customers.filter(c => c.type === 'customer').length
  const totalSuppliers = customers.filter(c => c.type === 'supplier').length
  const activeCount = customers.filter(c => c.is_active).length
  
  // 2. 시트 1: 요약
  const summarySheet: SheetData = {
    name: '거래처 요약',
    summaryRows: [
      {
        cells: [{ value: '거래처 목록 보고서', colSpan: 4 }],
        style: 'title'
      },
      {
        cells: [
          { value: `생성일: ${new Date().toISOString().split('T')[0]}`, colSpan: 4 }
        ]
      }
    ],
    data: [
      { 구분: '🏢 전체 거래처', 수량: customers.length, 고객수: totalCustomers, 공급업체수: totalSuppliers },
      { 구분: '✅ 활성', 수량: activeCount, 고객수: '-', 공급업체수: '-' },
      { 구분: '❌ 비활성', 수량: customers.length - activeCount, 고객수: '-', 공급업체수: '-' }
    ],
    headers: ['구분', '수량', '고객수', '공급업체수']
  }
  
  // 3. 시트 2: 전체 거래처
  const allSheet: SheetData = {
    name: '전체 거래처',
    data: customers.map(c => ({
      거래처명: c.name,
      사업자번호: c.business_number || '-',
      대표자: c.ceo_name || '-',
      거래처구분: c.type === 'customer' ? '고객' : '공급업체',
      업태: c.business_type || '-',
      종목: c.business_item || '-',
      전화: c.phone || '-',
      이메일: c.email || '-',
      주소: c.address || '-',
      담당자: c.contact_person || '-',
      미수금: c.outstanding_balance || 0,
      활성상태: c.is_active ? '활성' : '비활성',
      등록일: c.created_at ? new Date(c.created_at).toLocaleDateString('ko-KR') : '-',
      수정일: c.updated_at ? new Date(c.updated_at).toLocaleDateString('ko-KR') : '-'
    })),
    headers: ['거래처명', '사업자번호', '대표자', '거래처구분', '업태', '종목', '전화', '이메일', '주소', '담당자', '미수금', '활성상태', '등록일', '수정일']
  }
  
  // 4. 시트 3: 고객 목록
  const customerSheet: SheetData = {
    name: '고객 목록',
    data: customers
      .filter(c => c.type === 'customer')
      .map(c => ({
        거래처명: c.name,
        사업자번호: c.business_number || '-',
        대표자: c.ceo_name || '-',
        업태: c.business_type || '-',
        종목: c.business_item || '-',
        전화: c.phone || '-',
        이메일: c.email || '-',
        주소: c.address || '-',
        담당자: c.contact_person || '-',
        미수금: c.outstanding_balance || 0,
        활성상태: c.is_active ? '활성' : '비활성',
        등록일: c.created_at ? new Date(c.created_at).toLocaleDateString('ko-KR') : '-'
      })),
    headers: ['거래처명', '사업자번호', '대표자', '업태', '종목', '전화', '이메일', '주소', '담당자', '미수금', '활성상태', '등록일']
  }
  
  // 5. 시트 4: 공급업체 목록
  const supplierSheet: SheetData = {
    name: '공급업체 목록',
    data: customers
      .filter(c => c.type === 'supplier')
      .map(c => ({
        거래처명: c.name,
        사업자번호: c.business_number || '-',
        대표자: c.ceo_name || '-',
        업태: c.business_type || '-',
        종목: c.business_item || '-',
        전화: c.phone || '-',
        이메일: c.email || '-',
        주소: c.address || '-',
        담당자: c.contact_person || '-',
        활성상태: c.is_active ? '활성' : '비활성',
        등록일: c.created_at ? new Date(c.created_at).toLocaleDateString('ko-KR') : '-'
      })),
    headers: ['거래처명', '사업자번호', '대표자', '업태', '종목', '전화', '이메일', '주소', '담당자', '활성상태', '등록일']
  }
  
  // 6. 파일명 생성
  let filename = '거래처목록'
  
  if (filters.customerType !== 'all') {
    filename += `_${filters.customerType === 'customer' ? '고객' : '공급업체'}`
  }
  
  if (filters.isActive !== 'all') {
    filename += `_${filters.isActive === 'true' ? '활성' : '비활성'}`
  }
  
  const today = new Date().toISOString().split('T')[0]
  filename += `_${today}.xlsx`
  
  // 7. Excel 생성
  generateExcel(
    [summarySheet, allSheet, customerSheet, supplierSheet],
    filename
  )
}
