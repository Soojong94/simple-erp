# 백업 시스템 근본 문제 해결 완료

## 🎯 핵심 문제

### 당신이 지적한 정확한 문제점
> "백업을 해야하는 거는 회사 정보가 아니라 거래처, 상품, 거래관리 뿐이야. 그니까 결국 이 백업 데이터는 회사의 아이디는 포함하지 않는 데이터여야한다는 거지."

**이전 설계의 치명적 오류:**
```typescript
// ❌ 잘못된 설계
interface BackupData {
  company: Company | null        // 회사 정보까지 백업
  metadata: {
    companyId: number             // 백업한 회사 ID 기록
  }
}

// 복원 시
const STORAGE_KEYS = getStorageKeys()  // 현재 세션의 companyId 사용
// → simple-erp-c{현재회사ID}-customers에 저장
```

**문제 시나리오:**
1. 회사 1에서 백업 → `metadata.companyId = 1`
2. 회사 2로 로그인 → `simple-erp-c2-customers`에 저장
3. **결과: 회사 1 데이터가 회사 2로 들어감!** 😱

---

## ✅ 해결 방법

### 1. 백업 데이터 타입 수정
```typescript
// ✅ 올바른 설계: 회사 중립적 백업
export interface BackupData {
  customers: Customer[]                    // 거래처만
  products: Product[]                      // 상품만
  transactions: TransactionWithItems[]     // 거래만
  customerProductPrices: CustomerProductPrice[]
  nextIds: Record<string, number>
  metadata: {
    backupDate: string
    version: string
    totalRecords: number
    appVersion: string
    // ❌ companyId 제거
    // ❌ company 제거
  }
}
```

### 2. collectBackupData() 수정
```typescript
// ✅ 회사 정보 제외
export const collectBackupData = (): BackupData => {
  const customers = getFromStorage<Customer[]>(STORAGE_KEYS.CUSTOMERS, [])
  const products = getFromStorage<Product[]>(STORAGE_KEYS.PRODUCTS, [])
  const transactions = getFromStorage<TransactionWithItems[]>(STORAGE_KEYS.TRANSACTIONS, [])
  const customerProductPrices = getFromStorage<CustomerProductPrice[]>(STORAGE_KEYS.CUSTOMER_PRODUCT_PRICES, [])
  const nextIds = getFromStorage<Record<string, number>>(STORAGE_KEYS.NEXT_IDS, {})
  
  // ❌ company 제거
  // ❌ metadata.companyId 제거
  
  return {
    customers,
    products,
    transactions,
    customerProductPrices,
    nextIds,
    metadata: {
      backupDate: new Date().toISOString(),
      version: '1.0.0',
      totalRecords: customers.length + products.length + transactions.length + customerProductPrices.length,
      appVersion: 'Simple ERP v1.0'
    }
  }
}
```

### 3. restoreBackupData() 수정
```typescript
// ✅ 현재 로그인한 회사의 데이터로 복원
export const restoreBackupData = (backupData: BackupData): void => {
  // ✅ 현재 로그인한 회사의 스토리지 키 사용
  const STORAGE_KEYS = getStorageKeys()  // 현재 세션 기준
  const session = getCurrentSession()
  
  console.log('🔄 백업 데이터 복원 시작...', {
    targetCompanyId: session?.company_id,  // 현재 로그인한 회사
    backupRecords: {
      customers: backupData.customers.length,
      products: backupData.products.length,
      transactions: backupData.transactions.length
    }
  })
  
  // ✅ 거래처, 상품, 거래 데이터만 복원
  setToStorage(STORAGE_KEYS.CUSTOMERS, migratedData.customers)
  setToStorage(STORAGE_KEYS.PRODUCTS, migratedData.products)
  setToStorage(STORAGE_KEYS.TRANSACTIONS, migratedData.transactions)
  setToStorage(STORAGE_KEYS.CUSTOMER_PRODUCT_PRICES, migratedData.customerProductPrices)
  setToStorage(STORAGE_KEYS.NEXT_IDS, migratedData.nextIds)
  
  // ❌ 회사 정보는 복원하지 않음 (현재 회사 정보 유지)
}
```

### 4. validateBackupFile() 수정
```typescript
// ✅ 필수 필드에서 company 제거
const requiredFields = [
  'customers', 
  'products', 
  'transactions', 
  'customerProductPrices', 
  'nextIds', 
  'metadata'
]
// ❌ 'company' 제거
```

---

## 📊 Before vs After

| 항목 | Before (잘못됨) | After (올바름) |
|------|----------------|---------------|
| **백업 대상** | 회사 정보 포함 | 거래처, 상품, 거래만 |
| **metadata.companyId** | 백업한 회사 ID | 없음 (제거) |
| **복원 대상** | 백업 파일의 companyId | 현재 로그인한 회사 |
| **회사 간 이동** | 불가능 (ID 고정) | 가능 (회사 중립적) |
| **데이터 안전성** | 낮음 (잘못된 회사에 복원 가능) | 높음 (현재 회사로만 복원) |

---

## 🎯 이제 가능한 시나리오

### ✅ 시나리오 1: 같은 회사에서 백업/복원
```
1. 회사 1로 로그인
2. 데이터 백업 → 거래처 20개, 상품 24개, 거래 31개
3. 데이터 삭제 (실수)
4. 백업 파일 복원 → 회사 1로 복원 ✅
```

### ✅ 시나리오 2: 다른 회사로 데이터 이동
```
1. 회사 1로 로그인
2. 데이터 백업 → 거래처 20개, 상품 24개, 거래 31개
3. 회사 2로 로그인
4. 백업 파일 복원 → 회사 2로 복원 ✅
   (회사 2의 데이터로 덮어씀)
```

### ✅ 시나리오 3: 새 회사 생성 후 데이터 복원
```
1. 회사 1에서 백업
2. 새 회사 3 생성
3. 회사 3으로 로그인
4. 회사 1의 백업 파일 복원 → 회사 3에 데이터 생성 ✅
```

---

## 🔒 데이터 안전성

### 복원 과정
```typescript
// 1. 파일 선택
const file = event.target.files[0]

// 2. 파일 검증
const result = await importBackup(file)
if (!result.success) {
  alert(result.error)
  return
}

// 3. 현재 로그인한 회사로 복원
restoreBackupData(result.data)
// → simple-erp-c{현재회사ID}-customers에 저장
// → simple-erp-c{현재회사ID}-products에 저장
// → simple-erp-c{현재회사ID}-transactions에 저장

// 4. 캐시 초기화 및 새로고침
queryClient.clear()
setTimeout(() => window.location.reload(), 1000)
```

---

## 📁 수정된 파일

### D:\simple-erp\src\lib\backup.ts
1. `BackupData` 인터페이스 수정
2. `collectBackupData()` 함수 수정
3. `restoreBackupData()` 함수 수정
4. `validateBackupFile()` 함수 수정

---

## 🧪 테스트 방법

### 1. 백업 생성 테스트
```javascript
// 브라우저 콘솔
const backupData = collectBackupData()
console.log('백업 데이터:', backupData)
console.log('company 필드:', backupData.company)  // undefined여야 함
console.log('companyId:', backupData.metadata.companyId)  // undefined여야 함
```

### 2. 복원 테스트
```javascript
// 1. 현재 세션 확인
const session = JSON.parse(localStorage.getItem('simple-erp-current-session'))
console.log('현재 로그인 회사:', session.company_id)

// 2. 백업 파일 업로드 → UI에서 진행

// 3. 복원 후 데이터 확인
const customers = JSON.parse(localStorage.getItem(`simple-erp-c${session.company_id}-customers`))
console.log('복원된 거래처:', customers.length)
```

---

## 🎉 결론

**문제:** 백업 데이터에 회사 정보가 포함되어 복원 시 회사 간 데이터 혼선 발생

**해결:** 
1. ✅ 백업 데이터를 회사 중립적으로 변경 (거래처, 상품, 거래만)
2. ✅ 복원 시 현재 로그인한 회사의 데이터로 저장
3. ✅ 회사 정보는 복원하지 않음 (현재 회사 정보 유지)

**결과:** 
- 어떤 회사든 백업 파일을 복원 가능
- 현재 로그인한 회사의 데이터만 변경됨
- 데이터 안전성 향상
