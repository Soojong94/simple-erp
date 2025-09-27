import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import { EXCEL_STYLES, calculateColumnWidths } from './excelStyles'

export interface SheetData {
  name: string                    // 시트 이름
  data: any[]                     // 데이터 배열
  headers?: string[]              // 헤더 (선택사항)
  summaryRows?: SummaryRow[]      // 요약 행들
  columnWidths?: number[]         // 컬럼 너비
}

export interface SummaryRow {
  cells: { value: string | number; colSpan?: number }[]
  style?: 'title' | 'subtitle' | 'total'
}

/**
 * Excel 파일 생성 메인 함수
 */
export function generateExcel(
  sheets: SheetData[],
  fileName: string
): void {
  const workbook = XLSX.utils.book_new()
  
  sheets.forEach(sheetData => {
    const worksheet = createWorksheet(sheetData)
    
    // ✅ 테두리 추가 (워크시트 생성 후)
    applyBordersToWorksheet(worksheet)
    
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetData.name)
  })
  
  // Excel 파일 생성 및 다운로드
  const excelBuffer = XLSX.write(workbook, { 
    bookType: 'xlsx', 
    type: 'array',
    cellStyles: true 
  })
  
  const blob = new Blob([excelBuffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  })
  
  saveAs(blob, fileName)
}

/**
 * 워크시트 생성
 */
function createWorksheet(sheetData: SheetData): XLSX.WorkSheet {
  let currentRow = 0
  const ws: XLSX.WorkSheet = {}
  const range = { s: { c: 0, r: 0 }, e: { c: 0, r: 0 } }
  
  // 1. 요약 행 추가 (있으면)
  if (sheetData.summaryRows && sheetData.summaryRows.length > 0) {
    sheetData.summaryRows.forEach(summaryRow => {
      summaryRow.cells.forEach((cell, colIndex) => {
        const cellRef = XLSX.utils.encode_cell({ c: colIndex, r: currentRow })
        ws[cellRef] = { 
          v: cell.value, 
          t: typeof cell.value === 'number' ? 'n' : 's',
          s: EXCEL_STYLES[summaryRow.style || 'subtitle']
        }
        
        // 병합 처리
        if (cell.colSpan && cell.colSpan > 1) {
          if (!ws['!merges']) ws['!merges'] = []
          ws['!merges'].push({
            s: { c: colIndex, r: currentRow },
            e: { c: colIndex + cell.colSpan - 1, r: currentRow }
          })
        }
      })
      currentRow++
    })
    
    currentRow++ // 빈 행 추가
  }
  
  // 2. 데이터 추가
  if (sheetData.data && sheetData.data.length > 0) {
    const headers = sheetData.headers || Object.keys(sheetData.data[0])
    
    // 헤더 추가
    headers.forEach((header, colIndex) => {
      const cellRef = XLSX.utils.encode_cell({ c: colIndex, r: currentRow })
      ws[cellRef] = { 
        v: header, 
        t: 's',
        s: EXCEL_STYLES.header
      }
      range.e.c = Math.max(range.e.c, colIndex)
    })
    currentRow++
    
    // 데이터 행 추가
    sheetData.data.forEach(row => {
      headers.forEach((header, colIndex) => {
        const cellRef = XLSX.utils.encode_cell({ c: colIndex, r: currentRow })
        const value = row[header]
        
        // 타입 감지 및 스타일 적용
        if (typeof value === 'number') {
          // 숫자 (₩ 통화 형식)
          ws[cellRef] = { v: value, t: 'n', s: EXCEL_STYLES.currency }
        } else if (header.includes('날짜') || header.includes('일자')) {
          // 날짜
          ws[cellRef] = { v: value, t: 's', s: EXCEL_STYLES.date }
        } else if (header.includes('금액') || header.includes('단가') || header.includes('가격')) {
          // 금액
          const numValue = typeof value === 'string' ? parseFloat(value.replace(/[^\d.-]/g, '')) : value
          ws[cellRef] = { 
            v: numValue || 0, 
            t: 'n', 
            s: EXCEL_STYLES.currency 
          }
        } else {
          // 일반 텍스트
          ws[cellRef] = { 
            v: value || '', 
            t: 's',
            s: header.includes('거래처') || header.includes('상품') || header.includes('구분')
              ? EXCEL_STYLES.textLeft
              : EXCEL_STYLES.textCenter
          }
        }
      })
      currentRow++
      range.e.r = currentRow - 1
    })
  }
  
  ws['!ref'] = XLSX.utils.encode_range(range)
  
  // 3. 컬럼 너비 설정
  if (sheetData.columnWidths) {
    ws['!cols'] = sheetData.columnWidths.map(w => ({ wch: w }))
  } else if (sheetData.data && sheetData.data.length > 0) {
    const headers = sheetData.headers || Object.keys(sheetData.data[0])
    const widths = calculateColumnWidths(sheetData.data, headers)
    ws['!cols'] = widths.map(w => ({ wch: w }))
  }
  
  return ws
}

/**
 * 워크시트 전체에 테두리 적용
 */
function applyBordersToWorksheet(ws: XLSX.WorkSheet): void {
  if (!ws['!ref']) return
  
  const range = XLSX.utils.decode_range(ws['!ref'])
  
  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellRef = XLSX.utils.encode_cell({ r: R, c: C })
      
      if (ws[cellRef]) {
        // 기존 스타일 유지하면서 테두리만 추가
        if (!ws[cellRef].s) ws[cellRef].s = {}
        
        ws[cellRef].s.border = {
          top: { style: 'thin', color: { rgb: 'D1D5DB' } },
          bottom: { style: 'thin', color: { rgb: 'D1D5DB' } },
          left: { style: 'thin', color: { rgb: 'D1D5DB' } },
          right: { style: 'thin', color: { rgb: 'D1D5DB' } }
        }
      }
    }
  }
}
