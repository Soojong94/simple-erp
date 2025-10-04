# 🔌 API Layer

데이터 액세스를 위한 API 계층입니다. Tauri 환경과 브라우저 환경을 자동으로 감지하여 적절한 데이터 소스를 사용합니다.

## 📂 파일 구조

```
api/
├── customerAPI.ts           # 거래처 CRUD API
├── productAPI.ts            # 상품 CRUD API
├── transactionAPI.ts        # 거래 CRUD API
└── helpers/
    ├── storage.ts           # localStorage 헬퍼 함수
    ├── backup.ts            # 자동 백업 트리거
    └── inventory-helpers.ts # 재고 계산 헬퍼
```

## 🎯 주요 API

### customerAPI.ts

거래처(고객/공급업체) 관련 CRUD 작업을 제공합니다.

#### 메서드

```tsx
const customerAPI = {
  getAll: async (customerType?: 'customer' | 'supplier') => Customer[]
  getById: async (id: number) => Customer
  create: async (data: Omit<Customer, 'id' | 'created_at'>) => Customer
  update: async (id: number, data: Partial<Customer>) => Customer
  delete: async (id: number) => void
}
```

#### 특징
- 거래처 타입별 필터링 지원 (고객/공급업체)
- 생성/수정 시 자동 백업 트리거
- Tauri: SQLite 데이터베이스 사용
- 브라우저: localStorage 사용

---

### productAPI.ts

상품 관련 CRUD 작업 및 재고 관리를 제공합니다.

#### 메서드

```tsx
const productAPI = {
  // 기본 CRUD
  getAll: async (activeOnly?: boolean) => Product[]
  getById: async (id: number) => Product
  create: async (data: Omit<Product, 'id' | 'created_at'>) => Product
  update: async (id: number, data: Partial<Product>) => Product
  delete: async (id: number) => void
  
  // 재고 관리
  getInventory: async (productId: number) => ProductInventory
  getAllInventories: async () => ProductInventory[]
  addStockMovement: async (movement: Omit<StockMovement, 'id'>) => StockMovement
  getStockMovements: async (productId: number) => StockMovement[]
}
```

#### 특징
- 활성/비활성 상품 필터링
- 재고 이력 추적 (StockMovement)
- Lot 번호 관리 (선입선출 FIFO)
- 자동 백업 트리거

---

### transactionAPI.ts

거래(매출/매입/수금) 관련 CRUD 작업을 제공합니다.

#### 메서드

```tsx
const transactionAPI = {
  getAll: async (
    transactionType?: 'sales' | 'purchase' | 'payment',
    customerId?: number,
    limit?: number,
    offset?: number
  ) => TransactionWithItems[]
  
  getById: async (id: number) => TransactionWithItems
  create: async (data: Omit<TransactionWithItems, 'id' | 'created_at'>) => TransactionWithItems
  update: async (id: number, data: Partial<TransactionWithItems>) => TransactionWithItems
  delete: async (id: number) => void
  
  // 재고 효과 취소 (삭제 시)
  cancelInventoryEffect: async (transaction: TransactionWithItems) => void
}
```

#### 특징
- 거래 타입별 필터링 (매출/매입/수금)
- 거래처별 필터링
- 페이지네이션 지원 (limit, offset)
- 거래 항목(items) 포함
- **재고 자동 반영**: 
  - 매출: 재고 감소
  - 매입: 재고 증가
- 거래 삭제 시 재고 효과 자동 취소
- inventoryAPI와의 순환 참조 방지 (`setInventoryAPI` 사용)

## 🛠️ Helpers

### helpers/storage.ts

localStorage 기반 데이터 저장 및 관리 유틸리티입니다.

#### 주요 함수

```tsx
// localStorage 키 생성 (회사별 분리)
function getCompanyStorageKey(entity: string): string {
  // 현재 로그인한 회사의 ID를 기반으로 키 생성
  // 예: "simple-erp-c1-customers", "simple-erp-c2-products"
  return `simple-erp-c${session.company_id}-${entity}`
}

// 헬퍼 함수
function getFromStorage<T>(key: string, defaultValue: T): T
function setToStorage<T>(key: string, value: T): void
function getNextId(entity: 'customer' | 'product' | 'transaction'): number
function delay(ms: number): Promise<void>  // API 지연 시뮬레이션
function isTauri(): boolean  // 실행 환경 감지
```

**중요**: 모든 데이터는 회사별로 완전히 분리되어 저장됩니다:
- 회사 1: `simple-erp-c1-customers`, `simple-erp-c1-products`, ...
- 회사 2: `simple-erp-c2-customers`, `simple-erp-c2-products`, ...
- 회사 N: `simple-erp-cN-customers`, `simple-erp-cN-products`, ...

#### 특징
- 타입 안전한 get/set
- 자동 ID 생성 (순차적)
- 브라우저 환경에서 API 지연 시뮬레이션 (UX 향상)

---

### helpers/backup.ts

데이터 변경 시 자동 백업을 트리거합니다.

#### 주요 함수

```tsx
const backupTrigger = {
  afterCreate: () => void      // 생성 후
  afterUpdate: () => void      // 수정 후
  afterDelete: () => void      // 삭제 후
}
```

#### 특징
- **디바운스 적용** (2초): 연속된 변경 방지
- 브라우저 환경에서만 동작 (Tauri는 향후 분리 예정)
- 자동 백업 활성화 시에만 동작
- 하루 한 번만 백업 (shouldBackupToday 체크)

---

### helpers/inventory-helpers.ts

거래와 재고의 연동을 위한 헬퍼 함수입니다.

#### 주요 함수

```tsx
// 거래 삭제 시 재고 효과 취소
async function cancelTransactionInventoryEffect(
  transaction: TransactionWithItems,
  inventoryAPI: any
): Promise<void>
```

#### 특징
- 매출 거래 취소: 재고 복원 (+)
- 매입 거래 취소: 재고 차감 (-)
- Lot별 재고 추적
- 거래 항목별 개별 처리

## 💡 사용 예시

### 거래처 조회 및 생성

```tsx
import { customerAPI } from './lib/api/customerAPI'

// 모든 고객 조회
const customers = await customerAPI.getAll('customer')

// 새 거래처 생성
const newCustomer = await customerAPI.create({
  name: '신규 거래처',
  type: 'customer',
  business_number: '123-45-67890',
  phone: '010-1234-5678',
  is_active: true
})
```

### 거래 생성 (재고 자동 반영)

```tsx
import { transactionAPI } from './lib/api/transactionAPI'

// 매출 거래 생성 (재고 자동 감소)
const transaction = await transactionAPI.create({
  customer_id: 1,
  transaction_type: 'sales',
  transaction_date: new Date().toISOString(),
  total_amount: 100000,
  items: [
    {
      product_id: 10,
      quantity: 5,
      unit_price: 20000,
      amount: 100000,
      lot_number: 'LOT001'
    }
  ]
})
```

### 재고 조회

```tsx
import { productAPI } from './lib/api/productAPI'

// 특정 상품의 재고 조회
const inventory = await productAPI.getInventory(productId)

console.log(inventory.current_stock)  // 현재 재고
console.log(inventory.lots)           // Lot별 재고
```

## 🔄 환경 자동 감지

모든 API는 실행 환경을 자동으로 감지합니다:

```tsx
if (isTauri()) {
  // Tauri Desktop: Rust 백엔드 (SQLite)
  return invoke<Customer[]>('get_customers')
} else {
  // Web Browser: localStorage
  return getFromStorage<Customer[]>(STORAGE_KEYS.CUSTOMERS, [])
}
```

## 🎯 설계 패턴

1. **환경 추상화**: Tauri/브라우저 환경 차이 숨김
2. **일관된 인터페이스**: 동일한 API로 양쪽 환경 지원
3. **자동 백업**: CRUD 작업 시 자동 백업 트리거
4. **재고 동기화**: 거래와 재고 자동 연동
5. **타입 안전성**: TypeScript 타입 활용

## 📋 향후 개선 사항

- [ ] API 에러 처리 표준화
- [ ] 낙관적 업데이트 (Optimistic Update)
- [ ] 캐싱 레이어 추가
- [ ] 일괄 작업 API (Batch Operations)
- [ ] 트랜잭션 지원
- [ ] API 응답 로깅
- [ ] Retry 로직
- [ ] 오프라인 모드 지원
