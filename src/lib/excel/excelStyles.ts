// Excel 스타일 정의

export interface ExcelStyle {
  font?: {
    bold?: boolean
    size?: number
    color?: { rgb: string }
  }
  fill?: {
    fgColor: { rgb: string }
  }
  alignment?: {
    horizontal?: 'left' | 'center' | 'right'
    vertical?: 'top' | 'center' | 'bottom'
    wrapText?: boolean
  }
  border?: {
    top?: { style: string; color: { rgb: string } }
    bottom?: { style: string; color: { rgb: string } }
    left?: { style: string; color: { rgb: string } }
    right?: { style: string; color: { rgb: string } }
  }
  numFmt?: string
}

export const EXCEL_STYLES = {
  // 헤더 스타일 (파란색)
  header: {
    font: { bold: true, size: 11, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '1E40AF' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: {
      top: { style: 'thin', color: { rgb: '000000' } },
      bottom: { style: 'thin', color: { rgb: '000000' } },
      left: { style: 'thin', color: { rgb: '000000' } },
      right: { style: 'thin', color: { rgb: '000000' } }
    }
  } as ExcelStyle,

  // 제목 스타일
  title: {
    font: { bold: true, size: 16 },
    alignment: { horizontal: 'center', vertical: 'center' }
  } as ExcelStyle,

  // 소제목 스타일
  subtitle: {
    font: { bold: true, size: 12 },
    fill: { fgColor: { rgb: 'F3F4F6' } },
    alignment: { horizontal: 'left', vertical: 'center' }
  } as ExcelStyle,

  // 합계 스타일 (연한 파란색)
  total: {
    font: { bold: true, size: 11 },
    fill: { fgColor: { rgb: 'DBEAFE' } },
    alignment: { horizontal: 'right', vertical: 'center' }
  } as ExcelStyle,

  // 일반 텍스트 (중앙 정렬)
  textCenter: {
    alignment: { horizontal: 'center', vertical: 'center' }
  } as ExcelStyle,

  // 일반 텍스트 (오른쪽 정렬)
  textRight: {
    alignment: { horizontal: 'right', vertical: 'center' }
  } as ExcelStyle,

  // 일반 텍스트 (왼쪽 정렬)
  textLeft: {
    alignment: { horizontal: 'left', vertical: 'center' }
  } as ExcelStyle,

  // 통화 형식 (₩)
  currency: {
    numFmt: '₩#,##0',
    alignment: { horizontal: 'right', vertical: 'center' }
  } as ExcelStyle,

  // 날짜 형식
  date: {
    numFmt: 'yyyy-mm-dd',
    alignment: { horizontal: 'center', vertical: 'center' }
  } as ExcelStyle,

  // 숫자 형식 (소수점 1자리)
  number: {
    numFmt: '#,##0.0',
    alignment: { horizontal: 'right', vertical: 'center' }
  } as ExcelStyle
}

/**
 * 컬럼 너비 자동 계산
 */
export function calculateColumnWidths(data: any[], headers: string[]): number[] {
  const widths: number[] = headers.map(h => h.length + 2)
  
  data.forEach(row => {
    headers.forEach((header, index) => {
      const value = String(row[header] || '')
      const length = value.length + 2
      widths[index] = Math.max(widths[index], Math.min(length, 50)) // 최대 50
    })
  })
  
  return widths
}
