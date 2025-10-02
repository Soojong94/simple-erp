# 📊 Excel Library

엑셀 파일 생성 및 내보내기 기능을 제공합니다. 거래처, 상품, 거래 데이터를 전문적인 형식의 엑셀로 내보낼 수 있습니다.

## 📂 파일 구조

```
excel/
├── index.ts              # 엑셀 라이브러리 메인 export
├── excelGenerator.ts     # 엑셀 파일 생성 핵심 함수
├── excelStyles.ts        # 엑셀 스타일 정의
├── customerExcel.ts      # 거래처 엑셀 생성
├── productExcel.ts       # 상품 엑셀 생성
└── transactionExcel.ts   # 거래 엑셀 생성
```

## 🎯 주요 파일

### index.ts

엑셀 라이브러리의 모든 기능을 export합니다.

```tsx
// 엑셀 생성기
export { generateExcel } from './excelGenerator'
export type { SheetData, SummaryRow } from './excelGenerator'

// 스타일
export { EXCEL_STYLES, calculateColumnWidths } from './excelStyles'
export type { ExcelStyle } from './excelStyles'

// 거래처/상품/거래 엑셀
export { generateCustomerExcel } from './customerExcel'
export { generateProductExcel } from './productExcel'
export { generateTransactionExcel } from './transactionExcel'
```

---

### excelGenerator.ts

엑셀 파일 생성의 핵심 로직을 담당합니다.

#### 의존성

```tsx
import * as XLSX from 'xlsx'        // 엑셀 생성 라이브러리
import { saveAs } from 'file-saver' // 파일 다운로드
```

#### 주요 타입

```tsx
interface SheetData {
  name: string                    // 시트 이름
  data: any[]                     // 데이터 배열
  headers?: string[]              // 헤더 (선택)
  summaryRows?: SummaryRow[]      // 요약 행들
  columnWidths?: number[]         // 컬럼 너비
}

interface SummaryRow {
  cells: { 
    value: string | number
    colSpan?: number              // 병합할 셀 수
  }[]
  style?: 'title' | 'subtitle' | 'total'
}
```

#### 주요 함수

##### generateExcel()

```tsx
function generateExcel(
  sheets: SheetData[],
  fileName: string
): void
```

**처리 과정**:
1. 워크북 생성
2. 각 시트 생성 및 스타일 적용
3. 컬럼 너비 자동 조정
4. 테두리 추가
5. 파일로 저장 (.xlsx)

**특징**:
- 다중 시트 지원
- 자동 스타일링
- 요약 행 지원
- 한글 파일명 지원

---

### excelStyles.ts

엑셀 셀 스타일을 정의합니다.

#### 스타일 상수

```tsx
const EXCEL_STYLES = {
  header: {
    fill: { fgColor: { rgb: '4472C4' } },
    font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: { /* ... */ }
  },
  
  title: {
    font: { bold: true, sz: 14 },
    alignment: { horizontal: 'center' }
  },
  
  subtitle: {
    fill: { fgColor: { rgb: 'E7E6E6' } },
    font: { bold: true, sz: 11 }
  },
  
  total: {
    fill: { fgColor: { rgb: 'FFF2CC' } },
    font: { bold: true },
    border: { /* ... */ }
  },
  
  cell: {
    alignment: { horizontal: 'left', vertical: 'center' },
    border: { /* ... */ }
  }
}
```

#### 주요 함수

##### calculateColumnWidths()

```tsx
function calculateColumnWidths(data: any[][], headers: string[]): number[]
```

**처리**:
- 각 컬럼의 최대 문자 길이 계산
- 한글은 2배수로 계산 (더 정확한 너비)
- 최소 10자, 최대 50자 제한
- 여유 공간 추가 (+2)

---

### customerExcel.ts

거래처 데이터를 엑셀로 내보냅니다.

#### 주요 함수

```tsx
function generateCustomerExcel(
  customers: Customer[],
  filters?: CustomerExcelFilters
): void

interface CustomerExcelFilters {
  customerType?: 'all' | 'customer' | 'supplier'
  activeOnly?: boolean
  searchTerm?: string
}
```

**생성 컬럼**:
1. 거래처명
2. 구분 (고객/공급업체)
3. 사업자번호
4. 대표자
5. 전화번호
6. 주소
7. 이메일
8. 담당자
9. 활성화여부
10. 등록일

**요약 섹션**:
- 제목: "거래처 목록"
- 생성일시
- 총 거래처 수
- 고객/공급업체 수 통계

**특징**:
- 필터링 지원 (타입, 활성화, 검색)
- 한글 정렬
- 날짜 포맷팅 (YYYY-MM-DD HH:mm)

---

### productExcel.ts

상품 데이터를 엑셀로 내보냅니다.

#### 주요 함수

```tsx
function generateProductExcel(
  products: Product[],
  filters?: ProductExcelFilters
): void

interface ProductExcelFilters {
  category?: string
  activeOnly?: boolean
  searchTerm?: string
}
```

**생성 컬럼**:
1. 상품명
2. 상품코드
3. 카테고리
4. 단가 (원)
5. 단위
6. 이력번호
7. 원산지
8. 도축장
9. 활성화여부
10. 등록일

**요약 섹션**:
- 제목: "상품 목록"
- 생성일시
- 총 상품 수
- 카테고리별 통계
- 평균 단가

**특징**:
- 카테고리별 필터링
- 가격 천 단위 구분
- 카테고리별 집계

---

### transactionExcel.ts

거래 데이터를 엑셀로 내보냅니다.

#### 주요 함수

```tsx
function generateTransactionExcel(
  transactions: TransactionWithItems[],
  customers: Customer[],
  filters?: TransactionExcelFilters
): void

interface TransactionExcelFilters {
  transactionType?: 'all' | 'sales' | 'purchase' | 'payment'
  customerId?: number
  startDate?: string
  endDate?: string
  isPaid?: boolean
}
```

**생성 컬럼**:
1. 거래일
2. 거래구분 (매출/매입/수금)
3. 거래처명
4. 총액 (원)
5. 상품수량
6. 결제여부
7. 등록일
8. 메모

**요약 섹션**:
- 제목: "거래 내역"
- 생성일시
- 기간 (시작일~종료일)
- 총 거래 수
- 총 거래액
- 매출/매입 통계
- 결제 통계

**특징**:
- 기간별 필터링
- 거래처별 필터링
- 결제 상태 필터링
- 금액 합계 계산

**다중 시트**:
- `거래내역`: 거래 목록
- `거래상세`: 거래별 상품 항목 (선택사항)

## 💡 사용 예시

### 1. 거래처 엑셀 생성

```tsx
import { generateCustomerExcel } from './lib/excel'

// 모든 거래처
generateCustomerExcel(customers)

// 고객만 필터링
generateCustomerExcel(customers, {
  customerType: 'customer',
  activeOnly: true
})

// 검색어로 필터링
generateCustomerExcel(customers, {
  searchTerm: '삼성',
  activeOnly: true
})
```

### 2. 상품 엑셀 생성

```tsx
import { generateProductExcel } from './lib/excel'

// 모든 상품
generateProductExcel(products)

// 카테고리별 필터링
generateProductExcel(products, {
  category: '돼지고기',
  activeOnly: true
})
```

### 3. 거래 엑셀 생성

```tsx
import { generateTransactionExcel } from './lib/excel'

// 전체 거래
generateTransactionExcel(transactions, customers)

// 기간별 매출
generateTransactionExcel(transactions, customers, {
  transactionType: 'sales',
  startDate: '2024-01-01',
  endDate: '2024-12-31'
})

// 특정 거래처
generateTransactionExcel(transactions, customers, {
  customerId: 5,
  isPaid: false  // 미수금만
})
```

### 4. 커스텀 엑셀 생성

```tsx
import { generateExcel } from './lib/excel'

generateExcel([
  {
    name: '시트1',
    data: [
      { 이름: '홍길동', 나이: 30 },
      { 이름: '김철수', 나이: 25 }
    ],
    summaryRows: [
      {
        cells: [{ value: '직원 목록', colSpan: 2 }],
        style: 'title'
      }
    ]
  }
], '직원명단.xlsx')
```

## 🎨 스타일 특징

### 헤더
- 파란색 배경 (#4472C4)
- 흰색 볼드 텍스트
- 중앙 정렬
- 테두리

### 제목
- 볼드 14pt
- 중앙 정렬

### 소계/합계
- 노란색 배경 (#FFF2CC)
- 볼드 텍스트
- 테두리

### 일반 셀
- 왼쪽 정렬
- 얇은 테두리

## 📋 향후 개선 사항

- [ ] 차트 추가 기능
- [ ] 조건부 서식
- [ ] 피벗 테이블
- [ ] 수식 지원 (SUM, AVERAGE 등)
- [ ] 이미지 삽입
- [ ] 하이퍼링크
- [ ] 데이터 유효성 검사
- [ ] 페이지 설정 (인쇄 영역, 머리글/바닥글)
- [ ] 엑셀 템플릿 기능
- [ ] 다국어 지원
