// PDF 레이아웃 상수 정의
export const INVOICE_LAYOUT = {
  // 페이지 설정
  pageWidth: 210,  // A4 width (mm)
  pageHeight: 297, // A4 height (mm)
  
  // 여백
  margin: {
    left: 15,
    right: 15,
    top: 10,
    bottom: 10
  },
  
  // 제목
  title: {
    text: '거 래 명 세 서',
    fontSize: 24,
    y: 20
  },
  
  // 정보 박스
  infoBox: {
    supplier: {
      x: 20,
      y: 35,
      width: 70,
      height: 40
    },
    customer: {
      x: 120,
      y: 35,
      width: 70,
      height: 40
    },
    stamp: {
      x: 95,
      y: 40,
      width: 30,
      height: 30
    }
  },
  
  // 테이블
  table: {
    startY: 90,
    headers: ['품목', '이력번호', '수량', '단가', '금액'],
    columnWidths: [40, 45, 25, 35, 35],
    rowHeight: 7,
    maxRows: 10,
    fontSize: 10
  },
  
  // 합계
  summary: {
    x: 180,
    startY: 165,
    lineHeight: 7,
    fontSize: 12,
    totalFontSize: 14
  },
  
  // 메모
  memo: {
    startY: 185,
    lines: 3,
    lineHeight: 7,
    fontSize: 10
  },
  
  // 발행 정보
  footer: {
    y: 210,
    fontSize: 10
  },
  
  // 절취선
  cutLine: {
    y: 148.5,
    dashPattern: [2, 2],
    text: '절 취 선',
    fontSize: 10
  }
}

export const PDF_COLORS = {
  black: '#000000',
  gray: '#666666',
  lightGray: '#CCCCCC',
  red: '#FF0000'
}

export const PDF_FONTS = {
  normal: 'helvetica',
  bold: 'helvetica-bold'
}
