# Lib

핵심 라이브러리 및 유틸리티 함수 모음

## 폴더 구조

```
lib/
├── api/                 # API 모듈
│   ├── customerAPI.ts
│   ├── productAPI.ts
│   ├── transactionAPI.ts
│   └── helpers/
│       ├── storage.ts
│       ├── backup.ts
│       └── inventory-helpers.ts
├── csv/                 # CSV 처리
│   ├── import.ts
│   └── export.ts
├── excel/               # Excel 처리
│   └── generateReport.ts
├── pdf/                 # PDF 생성
│   ├── pdfConfig.ts
│   └── index.ts
├── auth.ts              # 인증 시스템
├── tauri.ts             # API 통합
├── utils.ts             # 유틸리티
└── cn.ts                # 클래스네임 병합
```

## 핵심 파일

### auth.ts
사용자 인증 및 세션 관리

**주요 함수**
```typescript
// 계정 관리
createAccount(username, password, companyData): Account
login(username, password): UserSession | null
logout(): void

// 세션 관리
getCurrentSession(): UserSession | null
updateSession(session): void
isAuthenticated(): boolean

// 회사 관리
getCompanyBySession(): Company | null
initializeCompanyData(companyId): void

// 데모 계정
ensureDemoAccounts(): void
```

**데이터 구조**
```typescript
interface Account {
  id: number
  username: string
  password_hash: string
  company_id: number
  created_at: string
}

interface UserSession {
  user_id: number
  username: string
  company_id: number
  company_name: string
  login_time: string
}
```

**사용 예시**
```typescript
import { login, logout, getCurrentSession } from '@/lib/auth'

// 로그인
const session = login('admin', '1234')
if (session) {
  console.log(`로그인 성공: ${session.company_name}`)
}

// 현재 세션 확인
const current = getCurrentSession()
if (current) {
  console.log(`현재 회사: ${current.company_name}`)
}

// 로그아웃
logout()
```

### tauri.ts
통합 API 인터페이스

**API 모듈**
```typescript
export const customerAPI = {
  getAll(): Promise<Customer[]>
  getById(id): Promise<Customer>
  create(data): Promise<Customer>
  update(id, data): Promise<Customer>
  delete(id): Promise<void>
  search(query): Promise<Customer[]>
}

export const productAPI = {
  getAll(): Promise<Product[]>
  getById(id): Promise<Product>
  create(data): Promise<Product>
  update(id, data): Promise<Product>
  delete(id): Promise<void>
  getByCategory(category): Promise<Product[]>
}

export const transactionAPI = {
  getAll(): Promise<TransactionWithItems[]>
  getById(id): Promise<TransactionWithItems>
  create(data): Promise<TransactionWithItems>
  update(id, data): Promise<TransactionWithItems>
  delete(id): Promise<void>
  confirm(id): Promise<void>
  cancel(id): Promise<void>
  getSummary(): Promise<TransactionSummary>
}

export const inventoryAPI = {
  getInventory(): Promise<ProductInventory[]>
  getByProductId(id): Promise<ProductInventory>
  createMovement(data): Promise<StockMovement>
  getMovementHistory(id?): Promise<StockMovement[]>
  createLot(data): Promise<StockLot>
  getActiveLots(id): Promise<StockLot[]>
  processExpiredLots(): Promise<number>
}
```

**환경 감지**
```typescript
export function isTauri(): boolean {
  return typeof window !== 'undefined' && 
         '__TAURI_IPC__' in window
}

// 브라우저: localStorage
// Tauri: SQLite
```

**자동 백업 시스템**
```typescript
// 모든 CRUD 작업 후 자동 실행
const triggerAutoBackup = debounce(async () => {
  if (!isTauri() && isAutoBackupEnabled()) {
    await exportBackup(true)
  }
}, 2000)
```

**회사별 데이터 분리**
```typescript
// STORAGE_KEYS가 동적으로 회사 ID 포함
STORAGE_KEYS.CUSTOMERS
// → 'simple-erp-c1-customers' (회사1)
// → 'simple-erp-c2-customers' (회사2)
```

### utils.ts
유틸리티 함수 모음

**날짜 처리**
```typescript
formatDate(date): string              // YYYY-MM-DD
formatDateTime(date): string          // YYYY-MM-DD HH:mm:ss
parseDate(dateString): Date
isToday(date): boolean
getDateRange(days): { start, end }
```

**금액 포맷팅**
```typescript
formatCurrency(amount): string        // 1,234,567원
parseCurrency(string): number
formatNumber(num, decimals?): string
```

**세금 계산**
```typescript
calculateTax(amount, rate): number
calculateSupplyPrice(total): number   // 총액 / 1.1
calculateTotalWithTax(supply): number
```

**유효성 검사**
```typescript
isValidEmail(email): boolean
isValidPhone(phone): boolean
isValidBusinessNumber(number): boolean
isValidTraceability(number): boolean
```

**제외 목록 관리**
```typescript
// 통계에서 특정 거래처 제외
addToExcludedCustomers(id): void
removeFromExcludedCustomers(id): void
getExcludedCustomers(): number[]
isCustomerExcluded(id): boolean
```

**디바운스**
```typescript
debounce(func, delay): Function
```

**문자열 처리**
```typescript
truncate(str, length): string
slugify(str): string
capitalize(str): string
```

### cn.ts
TailwindCSS 클래스 병합

```typescript
import { cn } from '@/lib/cn'

// 조건부 클래스 적용
<div className={cn(
  "base-class",
  condition && "conditional-class",
  { "object-class": condition }
)} />
```

## API 모듈 상세

### api/customerAPI.ts
거래처 관리 API

**기능**
- CRUD 작업
- 검색 (이름, 사업자번호, 담당자)
- 타입별 필터링 (고객/공급업체)
- 유효성 검사
- 중복 체크

**특이사항**
- 사업자번호 중복 체크
- 삭제 시 거래 내역 확인
- 자동 백업 트리거

### api/productAPI.ts
상품 관리 API

**기능**
- CRUD 작업
- 카테고리별 조회
- 활성/비활성 필터
- 상품 코드 중복 체크

**카테고리**
- 돼지고기, 소고기, 닭고기, 오리고기
- 기타, 부산물, 가공품

### api/transactionAPI.ts
거래 관리 API

**기능**
- CRUD 작업
- 거래 확정/취소
- 타입별 조회 (매출/매입/수금)
- 통계 요약
- 재고 자동 연동

**거래 타입**
```typescript
type TransactionType = 'sales' | 'purchase' | 'payment'

// 매출: 재고 출고
// 매입: 재고 입고
// 수금: 미수금 감소
```

### api/helpers/storage.ts
localStorage 헬퍼

```typescript
// 데이터 저장/조회
saveToStorage(key, data): void
getFromStorage(key, defaultValue): any
removeFromStorage(key): void

// 배열 업데이트
updateArrayItem(key, id, data): void
addArrayItem(key, item): void
removeArrayItem(key, id): void
```

### api/helpers/backup.ts
백업 시스템 핵심 로직

```typescript
// 백업 파일 생성
exportBackup(isAuto?): Promise<void>

// 백업 복원
importBackup(file): Promise<void>
restoreBackupData(data): Promise<void>

// 파일 관리 (Tauri)
selectBackupFolder(): Promise<string>
listBackupFiles(): Promise<BackupFileInfo[]>
deleteBackupFile(filename): Promise<void>
```

### api/helpers/inventory-helpers.ts
재고 관리 헬퍼

```typescript
// 재고 업데이트
updateProductInventory(productId, quantity): void

// FIFO 출고
processFIFOOutput(productId, quantity): LotOutput[]

// 로트 관리
createNewLot(data): StockLot
expireOldLots(productId): void

// 통계
calculateInventoryStats(): InventoryStats
```

## CSV 처리

### csv/import.ts
CSV 파일 가져오기

**기능**
- 한글 인코딩 자동 감지
- 필드 매핑
- 유효성 검사
- 중복 데이터 처리

**사용 예시**
```typescript
import { importCustomersFromCsv } from '@/lib/csv/import'

const result = await importCustomersFromCsv(file)
console.log(`성공: ${result.success}, 실패: ${result.errors.length}`)
```

### csv/export.ts
CSV 파일 내보내기

**기능**
- EUC-KR 인코딩 (Excel 호환)
- 한글 헤더
- 데이터 포맷팅

**사용 예시**
```typescript
import { exportCustomersToCsv } from '@/lib/csv/export'

exportCustomersToCsv(customers)
// 다운로드: 거래처목록_YYYY-MM-DD.csv
```

## Excel 처리

### excel/generateReport.ts
Excel 보고서 생성

**생성되는 시트**
1. 대시보드 (요약 통계)
2. 거래처 목록
3. 상품 목록
4. 거래 내역
5. 매출 집계
6. 매입 집계
7. 미수금 현황
8. 재고 현황
9. 로트 추적
10. 재고 이동
11. 월별 매출
12. 거래처별 매출
13. 상품별 매출
14. 카테고리별 매출
15. 시스템 정보

**사용 예시**
```typescript
import { generateExcelReport } from '@/lib/excel/generateReport'

await generateExcelReport()
// 다운로드: ERP종합보고서_YYYY-MM-DD.xlsx
```

## PDF 생성

### pdf/index.ts
PDF 거래증 생성

**기능**
- A4 2단 분할 (공급자/구매자)
- 회사 도장 자동 삽입
- 이력번호 표시
- 미리보기/다운로드/인쇄

**사용 예시**
```typescript
import { generateInvoicePDF } from '@/lib/pdf'

const pdf = await generateInvoicePDF(
  transaction,
  company,
  customer,
  'download' // 또는 'preview', 'print'
)
```

## 환경 변수

```env
VITE_APP_NAME=고기유통 ERP
VITE_APP_VERSION=1.0.0
VITE_BACKUP_AUTO_ENABLED=true
```

## 에러 처리

```typescript
try {
  await customerAPI.create(data)
} catch (error) {
  if (error.code === 'DUPLICATE') {
    toast.error('이미 존재하는 거래처입니다')
  } else {
    toast.error('저장 실패')
    console.error(error)
  }
}
```

## 테스트

```typescript
// lib/__tests__/utils.test.ts
describe('formatCurrency', () => {
  it('금액을 올바르게 포맷팅', () => {
    expect(formatCurrency(1234567)).toBe('1,234,567원')
  })
})
```

## 관련 문서

- [컴포넌트 가이드](../components/README.md)
- [타입 정의](../types/README.md)
- [API 명세](../../API.md)
