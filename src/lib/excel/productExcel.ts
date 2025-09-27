import { generateExcel, SheetData } from './excelGenerator'
import type { Product } from '../../types'

export interface ProductExcelFilters {
  category: string
  isActive: 'all' | 'true' | 'false'
  searchQuery?: string
}

/**
 * 상품 목록 Excel 생성
 */
export function generateProductExcel(
  products: Product[],
  filters: ProductExcelFilters
): void {
  // 1. 카테고리별 통계
  const categories = ['돼지고기', '소고기', '닭고기', '오리고기']
  const categoryStats = categories.map(cat => ({
    category: cat,
    count: products.filter(p => p.category === cat).length
  }))
  
  const activeCount = products.filter(p => p.is_active).length
  const avgPrice = products
    .filter(p => p.unit_price)
    .reduce((sum, p) => sum + (p.unit_price || 0), 0) / 
    products.filter(p => p.unit_price).length || 0
  
  // 2. 시트 1: 요약
  const summarySheet: SheetData = {
    name: '상품 요약',
    summaryRows: [
      {
        cells: [{ value: '상품 목록 보고서', colSpan: 3 }],
        style: 'title'
      },
      {
        cells: [
          { value: `생성일: ${new Date().toISOString().split('T')[0]}`, colSpan: 3 }
        ]
      }
    ],
    data: [
      { 구분: '📦 전체 상품', 수량: products.length, 평균단가: Math.round(avgPrice) },
      { 구분: '✅ 활성 상품', 수량: activeCount, 평균단가: '-' },
      { 구분: '━━━━━', 수량: '━━━━', 평균단가: '━━━━━━━' },
      ...categoryStats.map(c => ({
        구분: `${getCategoryIcon(c.category)} ${c.category}`,
        수량: c.count,
        평균단가: '-'
      }))
    ],
    headers: ['구분', '수량', '평균단가']
  }
  
  // 3. 시트 2: 전체 상품
  const allSheet: SheetData = {
    name: '전체 상품',
    data: products.map(p => ({
      상품명: p.name,
      상품코드: p.code || '-',
      카테고리: p.category || '-',
      단위: p.unit,
      참고단가: p.unit_price || 0,
      설명: p.description || '-',
      활성상태: p.is_active ? '활성' : '비활성'
    })),
    headers: ['상품명', '상품코드', '카테고리', '단위', '참고단가', '설명', '활성상태']
  }
  
  // 4. 시트 3-6: 카테고리별
  const categorySheets = categories.map(cat => ({
    name: cat,
    data: products
      .filter(p => p.category === cat)
      .map(p => ({
        상품명: p.name,
        상품코드: p.code || '-',
        단위: p.unit,
        참고단가: p.unit_price || 0,
        설명: p.description || '-',
        활성상태: p.is_active ? '활성' : '비활성'
      })),
    headers: ['상품명', '상품코드', '단위', '참고단가', '설명', '활성상태']
  }))
  
  // 5. 파일명
  let filename = '상품목록'
  
  if (filters.category !== 'all') {
    filename += `_${filters.category}`
  }
  
  if (filters.isActive !== 'all') {
    filename += `_${filters.isActive === 'true' ? '활성' : '비활성'}`
  }
  
  const today = new Date().toISOString().split('T')[0]
  filename += `_${today}.xlsx`
  
  // 6. Excel 생성
  generateExcel(
    [summarySheet, allSheet, ...categorySheets],
    filename
  )
}

function getCategoryIcon(category: string): string {
  const icons: { [key: string]: string } = {
    '돼지고기': '🐷',
    '소고기': '🐄',
    '닭고기': '🐔',
    '오리고기': '🦆'
  }
  return icons[category] || '📦'
}
