# 🛠️ API Helpers

API 계층에서 사용하는 공통 유틸리티 및 헬퍼 함수입니다.

## 📂 파일 구조

```
helpers/
├── storage.ts              # localStorage 관리 유틸리티
├── backup.ts               # 자동 백업 트리거
└── inventory-helpers.ts    # 재고 처리 헬퍼
```

## 🎯 주요 파일

### storage.ts

localStorage 기반 데이터 저장 및 관리를 위한 핵심 유틸리티입니다.

#### 주요 함수

##### 1. 회사별 데이터 격리

```tsx
function getCompanyStorageKey(entity: string): string
```

**특징**:
- 로그인한 회사 ID를 기반으로 독립된 스토리지 키 생성
- 패턴: `simple-erp-c${company_id}-${entity}`
- 예: `simple-erp-c1-customers`, `simple-erp-c2-products`
- 로그인 안 된 경우: `simple-erp-${entity}`

##### 2. 스토리지 키 상수

```tsx
const STORAGE_KEYS = {
  get CUSTOMERS(): string           // 거래처
  get PRODUCTS(): string            // 상품
  get TRANSACTIONS(): string        // 거래
  get CUSTOMER_PRODUCT_PRICES(): string  // 거래처별 가격
  get COMPANY(): string             // 회사 정보
  get NEXT_IDS(): string            // ID 시퀀스
  get PRODUCT_INVENTORY(): string   // 재고 정보
  get STOCK_MOVEMENTS(): string     // 재고 이동 이력
  get STOCK_LOTS(): string          // 재고 로트
  get INVENTORY_SETTINGS(): string  // 재고 설정
}
```

**특징**:
- Getter 패턴으로 동적 키 생성
- 현재 로그인된 회사에 따라 자동 변경
- 타입 안전성 보장

##### 3. 데이터 읽기/쓰기

```tsx
function getFromStorage<T>(key: string, defaultValue: T): T
function setToStorage<T>(key: string, value: T): void
```

**특징**:
- 제네릭 타입 지원
- JSON 파싱 에러 자동 처리
- SSR 환경 체크 (window undefined)
- 기본값 제공

##### 4. ID 자동 증가

```tsx
function getNextId(entityType: string): number
```

**특징**:
- 엔티티별 순차적 ID 생성
- 회사별 독립된 ID 시퀀스
- localStorage에 카운터 저장

##### 5. API 지연 시뮬레이션

```tsx
function delay(ms: number): Promise<void>
```

**특징**:
- 브라우저 환경에서 실제 API 느낌 제공
- UX 향상 (로딩 상태 테스트)
- 개발 환경에서만 사용

##### 6. 환경 감지

```tsx
function isTauri(): boolean
```

**특징**:
- Tauri 데스크톱 앱 감지
- `window.__TAURI_IPC__` 존재 여부 체크
- API 분기 처리에 활용

---

### backup.ts

데이터 변경 시 자동 백업을 트리거하는 유틸리티입니다.

#### 주요 함수

```tsx
const backupTrigger = {
  afterCreate: () => void    // 데이터 생성 후
  afterUpdate: () => void    // 데이터 수정 후
  afterDelete: () => void    // 데이터 삭제 후
}
```

#### 동작 방식

1. **디바운스 적용** (2초)
   - 연속된 변경 시 중복 백업 방지
   - 마지막 변경 후 2초 후에 백업 실행

2. **조건부 실행**
   - 브라우저 환경에서만 동작 (Tauri는 향후 분리)
   - 자동 백업이 활성화된 경우에만 실행
   - 하루에 한 번만 백업 (`shouldBackupToday()` 체크)

3. **자동 백업 플래그**
   - `exportBackup(true)` 호출 시 자동 백업 표시
   - 백업 파일명에 타임스탬프 포함

#### 의존성

```tsx
import { debounce } from '../../utils'
import { exportBackup, shouldBackupToday, isAutoBackupEnabled } from '../../backup'
```

---

### inventory-helpers.ts

거래 삭제/수정 시 재고 효과를 취소하는 헬퍼입니다.

#### 주요 함수

```tsx
async function cancelTransactionInventoryEffect(
  transaction: TransactionWithItems
): Promise<void>
```

#### 처리 로직

##### 1. 수금 거래는 스킵
```tsx
if (transaction.transaction_type === 'payment') {
  // 재고 영향 없음
  return
}
```

##### 2. 매입 거래 취소
- **Lot 비활성화**
  - `status: 'cancelled'`
  - `remaining_quantity: 0`
- **취소 이동 기록**
  - `movement_type: 'adjust'`
  - `quantity: -initial_quantity` (음수)
  - `reference_type: 'cancellation'`

##### 3. 매출 거래 취소
- **재고 복원**
  - 출고 수량만큼 입고 처리
  - `movement_type: 'in'`
- **Lot 수량 복원**
  - `remaining_quantity += quantity`
  - 완료된 Lot은 다시 활성화
  - `status: 'finished' → 'active'`

#### 특징
- 순환 참조 방지: inventoryAPI를 직접 import하지 않고 storage 직접 조작
- 거래 ID 기반으로 관련 Lot 및 이동 내역 추적
- 상세한 콘솔 로깅

## 💡 사용 예시

### 1. 회사별 데이터 저장/읽기

```tsx
import { STORAGE_KEYS, getFromStorage, setToStorage } from './helpers/storage'

// 현재 로그인한 회사의 거래처 조회
const customers = getFromStorage<Customer[]>(STORAGE_KEYS.CUSTOMERS, [])

// 새 거래처 추가
customers.push(newCustomer)
setToStorage(STORAGE_KEYS.CUSTOMERS, customers)
```

### 2. ID 자동 생성

```tsx
import { getNextId } from './helpers/storage'

const newCustomer: Customer = {
  id: getNextId('customer'),  // 1, 2, 3, ...
  name: '신규 거래처',
  // ...
}
```

### 3. 자동 백업 트리거

```tsx
import { backupTrigger } from './helpers/backup'

// 거래처 생성 후
await createCustomer(data)
backupTrigger.afterCreate()

// 상품 수정 후
await updateProduct(id, data)
backupTrigger.afterUpdate()

// 거래 삭제 후
await deleteTransaction(id)
backupTrigger.afterDelete()
```

### 4. 거래 취소 시 재고 복원

```tsx
import { cancelTransactionInventoryEffect } from './helpers/inventory-helpers'

async function deleteTransaction(id: number) {
  const transaction = await transactionAPI.getById(id)
  
  // 재고 영향 취소
  await cancelTransactionInventoryEffect(transaction)
  
  // 거래 삭제
  await transactionAPI.delete(id)
}
```

## 🔧 설계 패턴

### 1. 회사별 데이터 격리
- 멀티 테넌시 지원
- 회사 ID 기반 네임스페이스
- 독립된 데이터 공간

### 2. 타입 안전성
- 제네릭 타입 활용
- TypeScript 타입 추론
- 런타임 에러 방지

### 3. 환경 추상화
- Tauri/브라우저 자동 감지
- 일관된 인터페이스
- 조건부 로직 캡슐화

### 4. 부작용 관리
- 디바운스로 성능 최적화
- 조건부 실행으로 불필요한 작업 방지
- 명시적인 트리거 함수

## 📋 향후 개선 사항

- [ ] IndexedDB 마이그레이션 (대용량 데이터)
- [ ] 스토리지 할당량 모니터링
- [ ] 백업 실패 시 재시도 로직
- [ ] 재고 취소 시 트랜잭션 지원
- [ ] 에러 처리 표준화
- [ ] 스토리지 암호화
- [ ] 압축 저장 (큰 데이터)
