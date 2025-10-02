# Excel Components

✅ **실제 사용 중** - Reports 페이지에서 활용

Excel 파일로 데이터를 내보내기 위한 컴포넌트 모음

## 📌 사용 위치

**Reports.tsx** 페이지에서 3개 컴포넌트 모두 사용
```typescript
import TransactionExcelExporter from '../components/excel/TransactionExcelExporter'
import CustomerExcelExporter from '../components/excel/CustomerExcelExporter'
import ProductExcelExporter from '../components/excel/ProductExcelExporter'
```

---

## 📋 파일 목록

### 1. TransactionExcelExporter.tsx

**역할**: 거래 내역을 Excel 파일로 내보내기

**주요 기능**

1. **세밀한 필터링**
   - 날짜 범위 (시작일 ~ 종료일)
   - 거래처별 선택
   - 거래 유형 (매출/매입/전체)
   - 검색어 (거래처명 또는 상품명)

2. **실시간 통계 표시**
   - 총 거래, 매출 거래, 매입 거래 수
   - 총 매출액, 총 매입액, 수익 (색상으로 구분)

3. **Excel 생성**
   - 5개 시트 구성
   - 이력번호 포함
   - 등록일시 포함

**Props**
```typescript
interface TransactionExcelExporterProps {
  transactions: TransactionWithItems[]   // 아이템 정보 포함된 거래 목록
}
```

**필터 옵션**
```typescript
interface FilterOptions {
  dateFrom: string                                   // 시작 날짜 (YYYY-MM-DD)
  dateTo: string                                     // 종료 날짜
  customerId: string                                 // 거래처 ID ('all' 또는 숫자)
  transactionType: 'all' | 'sales' | 'purchase'     // 거래 유형
  searchQuery: string                                // 검색어 (거래처/상품)
}
```

**필터링 로직**
```typescript
const filteredTransactions = useMemo(() => {
  return transactions.filter(transaction => {
    // 날짜 범위
    if (dateFrom && transaction.transaction_date < dateFrom) return false
    if (dateTo && transaction.transaction_date > dateTo) return false
    
    // 거래처
    if (customerId !== 'all' && transaction.customer_id !== parseInt(customerId)) return false
    
    // 거래 유형
    if (transactionType !== 'all' && transaction.transaction_type !== transactionType) return false
    
    // 검색어 (거래처명 또는 상품명)
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const customerMatch = transaction.customer_name.toLowerCase().includes(query)
      const productMatch = transaction.items?.some(item => 
        item.product_name.toLowerCase().includes(query)
      )
      if (!customerMatch && !productMatch) return false
    }
    
    return true
  })
}, [transactions, filters])
```

**통계 계산**
```typescript
const stats = {
  total: filteredTransactions.length,
  sales: filteredTransactions.filter(t => t.transaction_type === 'sales').length,
  purchases: filteredTransactions.filter(t => t.transaction_type === 'purchase').length,
  totalSales: salesTransactions의 total_amount 합계,
  totalPurchases: purchaseTransactions의 total_amount 합계,
  profit: totalSales - totalPurchases
}
```

**Excel 시트 구성** (lib/excel에서 생성)
1. **통계 요약**: 전체 데이터 통계
2. **거래 요약**: 거래당 1줄 (등록일시 순)
3. **거래 상세**: 상품별 상세 내역 (이력번호 + 등록일시)
4. **거래처별 집계**: 거래처별 매출/매입 합계
5. **상품별 집계**: 상품별 판매/구매 합계

---

### 2. CustomerExcelExporter.tsx

**역할**: 거래처 목록을 Excel 파일로 내보내기

**주요 기능**

1. **필터링**
   - 거래처 구분 (전체/고객/공급업체)
   - 활성 상태 (전체/활성/비활성)
   - 검색어 (거래처명, 사업자번호, 담당자)

2. **통계 표시**
   - 총 거래처, 고객, 공급업체, 활성 거래처 수

3. **Excel 생성**
   - 4개 시트 구성
   - 모든 거래처 정보 포함

**Props**
```typescript
interface CustomerExcelExporterProps {
  customers: Customer[]   // 전체 거래처 목록
}
```

**필터 옵션**
```typescript
interface FilterOptions {
  customerType: 'all' | 'customer' | 'supplier'   // 거래처 구분
  isActive: 'all' | 'true' | 'false'              // 활성 상태
  searchQuery: string                              // 검색어
}
```

**필터링 로직**
```typescript
const filteredCustomers = useMemo(() => {
  return customers.filter(customer => {
    // 거래처 타입
    if (customerType !== 'all' && customer.type !== customerType) 
      return false
    
    // 활성 상태
    if (isActive === 'true' && !customer.is_active) return false
    if (isActive === 'false' && customer.is_active) return false
    
    // 검색어
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        customer.name.toLowerCase().includes(query) ||
        customer.business_number?.toLowerCase().includes(query) ||
        customer.contact_person?.toLowerCase().includes(query)
      )
    }
    
    return true
  })
}, [customers, filters])
```

**Excel 시트 구성**
1. **거래처 요약**: 전체 통계
2. **전체 거래처**: 모든 거래처 정보
3. **고객 목록**: 고객만 필터링
4. **공급업체 목록**: 공급업체만 필터링

---

### 3. ProductExcelExporter.tsx

**역할**: 상품 목록을 Excel 파일로 내보내기

**주요 기능**

1. **필터링**
   - 카테고리별 (전체/돼지고기/소고기/닭고기/오리고기)
   - 활성 상태 (전체/활성/비활성)
   - 검색어 (상품명, 상품코드)

2. **통계 표시**
   - 총 상품, 활성 상품, 평균 단가
   - 카테고리별 상품 수 (이모지 표시)

3. **Excel 생성**
   - 6개 시트 구성
   - 카테고리별 분류

**Props**
```typescript
interface ProductExcelExporterProps {
  products: Product[]   // 전체 상품 목록
}
```

**필터 옵션**
```typescript
interface FilterOptions {
  category: string                       // 카테고리 ('all' 또는 카테고리명)
  isActive: 'all' | 'true' | 'false'    // 활성 상태
  searchQuery: string                    // 검색어
}
```

**통계 계산**
```typescript
const stats = {
  total: filteredProducts.length,
  active: filteredProducts.filter(p => p.is_active).length,
  byCategory: {
    돼지고기: filteredProducts.filter(p => p.category === '돼지고기').length,
    소고기: filteredProducts.filter(p => p.category === '소고기').length,
    닭고기: filteredProducts.filter(p => p.category === '닭고기').length,
    오리고기: filteredProducts.filter(p => p.category === '오리고기').length
  },
  avgPrice: 평균 단가 계산
}
```

**Excel 시트 구성**
1. **상품 요약**: 전체 통계
2. **전체 상품**: 모든 상품 정보
3. **돼지고기**: 돼지고기만
4. **소고기**: 소고기만
5. **닭고기**: 닭고기만
6. **오리고기**: 오리고기만

---

## 🔄 공통 패턴

### 1. 컴포넌트 구조

```typescript
// 1. State 관리
const [filters, setFilters] = useState<FilterOptions>({...})
const [isExporting, setIsExporting] = useState(false)

// 2. 필터링 (useMemo로 최적화)
const filtered = useMemo(() => {
  return data.filter(item => {
    // 필터 조건 적용
  })
}, [data, filters])

// 3. 통계 계산 (useMemo로 최적화)
const stats = useMemo(() => {
  // 통계 계산
}, [filtered])

// 4. 핸들러
const handleFilterChange = (key, value) => { ... }
const handleResetFilters = () => { ... }
const handleExport = async () => {
  setIsExporting(true)
  try {
    generateXXXExcel(filtered, filters)
  } finally {
    setIsExporting(false)
  }
}
```

### 2. UI 레이아웃

```jsx
<div className="bg-white shadow rounded-lg p-6">
  <h3>제목</h3>
  
  {/* 필터 섹션 */}
  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
    <h4>🔍 필터 조건</h4>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* 필터 입력 필드들 */}
    </div>
    <button onClick={handleResetFilters}>필터 초기화</button>
  </div>
  
  {/* 통계 섹션 */}
  <div className="mb-6">
    <h4>📈 필터링된 데이터 통계</h4>
    <div className="grid">
      {/* 통계 카드들 */}
    </div>
  </div>
  
  {/* 내보내기 버튼 */}
  <div className="flex items-center justify-between">
    <div className="text-sm">N개의 데이터를 내보냅니다</div>
    <button onClick={handleExport} disabled={...}>
      📥 Excel 다운로드
    </button>
  </div>
  
  {/* 안내 정보 */}
  <div className="mt-6 p-3 bg-blue-50 rounded-md">
    <h5>💡 Excel 다운로드 기능</h5>
    <ul>...</ul>
  </div>
</div>
```

---

## 💡 사용 예시

### Reports 페이지에서 사용
```typescript
import { useQuery } from '@tanstack/react-query'
import { transactionAPI, customerAPI, productAPI } from '../lib/tauri'
import TransactionExcelExporter from '../components/excel/TransactionExcelExporter'
import CustomerExcelExporter from '../components/excel/CustomerExcelExporter'
import ProductExcelExporter from '../components/excel/ProductExcelExporter'

export default function Reports() {
  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => transactionAPI.getAll()
  })

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customerAPI.getAll()
  })

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => productAPI.getAll()
  })

  return (
    <div className="space-y-8">
      <TransactionExcelExporter transactions={transactions} />
      <CustomerExcelExporter customers={customers} />
      <ProductExcelExporter products={products} />
    </div>
  )
}
```

---

## 🔧 의존성

### 외부 라이브러리
```typescript
import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
```

### 내부 모듈
```typescript
// Excel 생성 함수
import { generateTransactionExcel } from '../../lib/excel'
import { generateCustomerExcel } from '../../lib/excel/customerExcel'
import { generateProductExcel } from '../../lib/excel/productExcel'

// API
import { transactionAPI, customerAPI, productAPI } from '../../lib/tauri'

// 유틸리티
import { formatCurrency } from '../../lib/utils'

// 타입
import type { TransactionWithItems, Customer, Product } from '../../types'
```

---

## 📊 Excel 생성 로직 (lib/excel)

실제 Excel 파일 생성은 `lib/excel/` 폴더에서 담당:
- `lib/excel/index.ts` - 거래 Excel
- `lib/excel/customerExcel.ts` - 거래처 Excel
- `lib/excel/productExcel.ts` - 상품 Excel

**주요 기능**
- ExcelJS 라이브러리 사용
- 한글 인코딩 완벽 지원
- 통화 형식 (₩), 날짜 형식 자동 적용
- 컬럼 너비 자동 조정
- 헤더 스타일링
- 다중 시트 생성

---

## 🎯 주요 특징

### 1. 실시간 필터링
- useMemo로 성능 최적화
- 필터 변경 시 즉시 반영
- 통계도 실시간 업데이트

### 2. 사용자 친화적 UI
- 색상으로 구분된 통계 카드
- 명확한 필터 레이블
- 비활성 상태 시각적 표시
- 로딩 중 스피너

### 3. 스마트 파일명
- 필터 조건 자동 반영
- 날짜 포함
- 예: `거래내역_2024-01-01_2024-12-31_신선마트_매출_2024-10-02.xlsx`

### 4. 데이터 무결성
- 빈 데이터 검증
- 내보내기 전 확인
- 에러 처리

---

## ⚠️ 주의사항

1. **대용량 데이터**
   - 수천 건 이상 시 시간 소요
   - 브라우저가 느려질 수 있음
   - 필터링으로 데이터 양 줄이기 권장

2. **메모리 사용**
   - Excel 생성 시 메모리 사용
   - 완료 후 자동 정리됨

3. **브라우저 호환성**
   - 모던 브라우저에서 정상 동작
   - IE는 미지원

4. **파일 저장**
   - 브라우저 다운로드 폴더에 저장
   - Tauri 환경에서는 별도 처리 가능

---

## 📝 개선 아이디어

1. **진행률 표시**
   - 대용량 데이터 내보내기 시 진행률 표시

2. **템플릿 선택**
   - 다양한 Excel 템플릿 제공
   - 사용자 정의 컬럼 선택

3. **스케줄링**
   - 정기적 자동 내보내기
   - 이메일 발송

4. **클라우드 저장**
   - Google Drive 직접 업로드
   - Dropbox 연동

5. **다양한 형식**
   - PDF 내보내기
   - CSV 내보내기 옵션

6. **데이터 검증**
   - 내보내기 전 데이터 유효성 검사
   - 누락된 정보 안내
