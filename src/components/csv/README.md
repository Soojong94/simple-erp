# CSV Components

⚠️ **주의: 이 폴더의 컴포넌트들은 현재 프로젝트에서 사용되지 않습니다.**

## 📌 현재 상태

이 컴포넌트들은 **구현되어 있지만 UI에서 연결되지 않은 레거시 코드**입니다.

### 실제 사용 중인 데이터 관리 방식

1. **백업/복원**: JSON 파일 (`/lib/backup.ts`)
   - Settings 페이지에서 사용
   - 전체 데이터를 하나의 JSON 파일로 내보내기/가져오기

2. **보고서**: Excel 파일 (`/lib/excel/`)
   - Reports 페이지에서 사용
   - 다양한 형식의 리포트 생성

3. **테스트 데이터**: 코드 생성 (`/lib/csv/testDataGenerator.ts`)
   - Settings > 테스트 데이터 탭에서 사용
   - 버튼 클릭으로 샘플 데이터 생성

---

## 📋 파일 목록 (미사용)

### 1. CustomerCSVManager.tsx
거래처 CSV 가져오기/내보내기 UI (미연결)

### 2. ProductCSVManager.tsx  
상품 CSV 가져오기/내보내기 UI (미연결)

### 3. TransactionCSVExporter.tsx
거래 내역 CSV 내보내기 UI (미연결)

---

## 🔧 구현된 기능 (lib/csv/index.ts)

CSV 처리 로직은 구현되어 있습니다:

```typescript
// 가져오기
importCustomersFromCSV(csvContent: string): Promise<Customer[]>
importProductsFromCSV(csvContent: string): Promise<Product[]>

// 내보내기  
exportCustomersToCSV(customers: Customer[]): string
exportProductsToCSV(products: Product[]): string
exportTransactionsToCSV(transactions: TransactionWithItems[]): string

// 템플릿
generateCustomerCSVTemplate(): string
generateProductCSVTemplate(): string

// 다운로드 (브라우저)
downloadCSV(content: string, filename: string): void
```

**특징**
- 한글/영어 컬럼명 모두 지원
- EUC-KR 인코딩 (Excel 호환)
- PapaParse 라이브러리 사용

---

## 💡 사용하려면?

만약 CSV 기능을 사용하고 싶다면:

### 1. Settings 페이지에 탭 추가
```typescript
// src/pages/Settings.tsx
import CustomerCSVManager from '../components/csv/CustomerCSVManager'

const tabs = [
  // ...
  { id: 'csv' as TabType, name: 'CSV 관리', icon: '📊' }
]

// 탭 컨텐츠
{activeTab === 'csv' && (
  <div className="space-y-6">
    <CustomerCSVManager customers={customers} />
    <ProductCSVManager products={products} />
    <TransactionCSVExporter transactions={transactions} />
  </div>
)}
```

### 2. 데이터 쿼리 추가
```typescript
const { data: customers } = useQuery({
  queryKey: ['customers'],
  queryFn: () => customerAPI.getAll()
})

const { data: products } = useQuery({
  queryKey: ['products'],
  queryFn: () => productAPI.getAll()
})

const { data: transactions } = useQuery({
  queryKey: ['transactions'],
  queryFn: () => transactionAPI.getAll()
})
```

---

## 🤔 왜 사용하지 않나요?

추측하건대:

1. **백업 기능이 더 강력함**
   - JSON은 모든 데이터를 한번에 백업
   - 관계형 데이터 보존 (거래-상품 연결 등)
   
2. **Excel이 더 실용적**
   - 보고서는 포맷팅이 중요
   - Excel이 한글 인코딩 문제 없음
   - 공식, 스타일 적용 가능

3. **CSV의 한계**
   - 단순 테이블만 가능
   - 관계형 데이터 표현 어려움
   - Excel 열 때 인코딩 문제

---

## 🗑️ 제거 고려사항

이 컴포넌트들을 삭제할지 고려해보세요:

**삭제해도 되는 경우**
- ✅ 앞으로도 CSV 기능을 쓸 계획이 없음
- ✅ 백업/Excel로 충분함
- ✅ 코드베이스를 간결하게 유지하고 싶음

**유지하는 경우**
- 🔄 나중에 데이터 마이그레이션에 사용할 수도
- 🔄 다른 시스템과 CSV로 연동할 가능성
- 🔄 사용자가 CSV를 요구할 수도

---

## 📝 개발자 노트

현재 이 폴더는:
- ✅ 코드는 완성되어 있음
- ✅ 단위 기능은 모두 동작함
- ❌ UI에 연결되지 않음
- ❌ 사용자에게 노출되지 않음

**결정이 필요합니다:**
1. 삭제하고 코드를 정리할 것인가?
2. UI에 연결해서 사용할 것인가?
3. 그냥 두고 필요시 사용할 것인가?
