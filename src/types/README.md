# Types

TypeScript 타입 정의 모음

## 파일 구조

```
types/
└── index.ts    # 모든 타입 정의
```

## 주요 타입

### 거래처 (Customer)

```typescript
export interface Customer {
  id?: number
  type: 'customer' | 'supplier'
  name: string
  business_number?: string
  representative?: string
  phone?: string
  email?: string
  address?: string
  contact_person?: string
  is_active: boolean
  created_at?: string
  updated_at?: string
}
```

**필드 설명**
- `type`: 고객 또는 공급업체
- `name`: 거래처명 (필수)
- `business_number`: 사업자등록번호
- `representative`: 대표자명
- `is_active`: 활성/비활성 상태

### 상품 (Product)

```typescript
export interface Product {
  id?: number
  code?: string
  name: string
  category?: string
  unit: string
  reference_price?: number
  description?: string
  is_active: boolean
  created_at?: string
  updated_at?: string
}
```

**카테고리**
- 돼지고기
- 소고기
- 닭고기
- 오리고기
- 기타
- 부산물
- 가공품

**단위**
- kg (기본)
- g
- 개
- 마리

### 거래 (Transaction)

```typescript
export interface Transaction {
  id?: number
  transaction_number?: string
  transaction_type: 'sales' | 'purchase' | 'payment'
  customer_id: number
  customer_name?: string
  transaction_date: string
  total_amount: number
  tax_amount?: number
  status: 'pending' | 'confirmed' | 'cancelled'
  notes?: string
  created_at?: string
  updated_at?: string
}
```

**거래 유형**
- `sales`: 매출 (재고 출고)
- `purchase`: 매입 (재고 입고)
- `payment`: 수금 (미수금 감소)

**상태**
- `pending`: 대기중
- `confirmed`: 확정
- `cancelled`: 취소

### 거래 상세 (TransactionItem)

```typescript
export interface TransactionItem {
  id?: number
  transaction_id?: number
  product_id: number
  product_name?: string
  quantity: number
  unit: string
  unit_price: number
  total_price: number
  traceability_number?: string
  notes?: string
}
```

**필드 설명**
- `traceability_number`: 이력번호 (고기 추적용)
- `quantity`: 수량
- `unit_price`: 단가
- `total_price`: 총액 (quantity × unit_price)

### 거래 전체 정보 (TransactionWithItems)

```typescript
export interface TransactionWithItems extends Transaction {
  items?: TransactionItem[]
}
```

거래 헤더 + 상세 아이템 포함

### 회사 정보 (Company)

```typescript
export interface Company {
  id?: number
  name: string
  business_number?: string
  representative?: string
  business_type?: string
  business_item?: string
  address?: string
  phone?: string
  email?: string
  stamp_path?: string
  default_invoice_memo?: string
  created_at?: string
  updated_at?: string
}
```

**필드 설명**
- `stamp_path`: 회사 도장 이미지 경로
- `default_invoice_memo`: 거래증 기본 메모

### 재고 관리

#### ProductInventory

```typescript
export interface ProductInventory {
  id?: number
  product_id: number
  product_name?: string
  current_stock: number
  safety_stock: number
  location?: string
  last_updated?: string
}
```

#### StockMovement

```typescript
export interface StockMovement {
  id?: number
  product_id: number
  product_name?: string
  movement_type: 'in' | 'out' | 'adjust' | 'dispose'
  quantity: number
  unit: string
  lot_number?: string
  transaction_id?: number
  reference_type?: 'transaction' | 'manual' | 'adjustment'
  notes?: string
  created_at?: string
}
```

**이동 유형**
- `in`: 입고
- `out`: 출고
- `adjust`: 조정
- `dispose`: 폐기

#### StockLot

```typescript
export interface StockLot {
  id?: number
  product_id: number
  lot_number: string
  quantity: number
  unit: string
  purchase_price?: number
  expiry_date?: string
  received_date: string
  transaction_id?: number
  status: 'active' | 'depleted' | 'expired'
}
```

**로트 상태**
- `active`: 활성
- `depleted`: 소진
- `expired`: 만료

### 인증 시스템

#### Account

```typescript
export interface Account {
  id: number
  username: string
  password_hash: string
  company_id: number
  created_at: string
}
```

#### UserSession

```typescript
export interface UserSession {
  user_id: number
  username: string
  company_id: number
  company_name: string
  login_time: string
}
```

#### CompanyData

```typescript
export interface CompanyData {
  name: string
  representative: string
  business_number?: string
  phone?: string
  email?: string
  address?: string
}
```

### 통계 및 집계

#### TransactionSummary

```typescript
export interface TransactionSummary {
  total_sales: number
  total_purchases: number
  total_payments: number
  net_revenue: number
  pending_count: number
  confirmed_count: number
}
```

#### InventoryStats

```typescript
export interface InventoryStats {
  total_products: number
  total_stock_value: number
  low_stock_count: number
  out_of_stock_count: number
  expiring_soon_count: number
}
```

### 백업 시스템

#### BackupData

```typescript
export interface BackupData {
  customers: Customer[]
  products: Product[]
  transactions: TransactionWithItems[]
  customerProductPrices: CustomerProductPrice[]
  company: Company | null
  nextIds: Record<string, number>
  inventory?: ProductInventory[]
  stockMovements?: StockMovement[]
  stockLots?: StockLot[]
  metadata: {
    backupDate: string
    totalRecords: number
    appVersion: string
  }
}
```

#### BackupSettings

```typescript
export interface BackupSettings {
  enabled: boolean
  backupPath?: string
}
```

#### BackupFileInfo

```typescript
export interface BackupFileInfo {
  name: string
  path: string
  size: number
  created: string
  totalRecords?: number
}
```

### 필터 및 정렬

#### TransactionFilters

```typescript
export interface TransactionFilters {
  dateFrom?: string
  dateTo?: string
  customerId?: number
  transactionType?: 'all' | 'sales' | 'purchase' | 'payment'
  status?: 'all' | 'pending' | 'confirmed' | 'cancelled'
  searchQuery?: string
}
```

#### SortConfig

```typescript
export interface SortConfig {
  key: string
  direction: 'asc' | 'desc'
}
```

## 타입 가드

### 타입 체크 함수

```typescript
export function isCustomer(obj: any): obj is Customer {
  return obj && typeof obj.name === 'string' && 
         ('type' in obj && (obj.type === 'customer' || obj.type === 'supplier'))
}

export function isProduct(obj: any): obj is Product {
  return obj && typeof obj.name === 'string' && typeof obj.unit === 'string'
}

export function isTransaction(obj: any): obj is Transaction {
  return obj && typeof obj.customer_id === 'number' &&
         typeof obj.transaction_type === 'string' &&
         typeof obj.total_amount === 'number'
}
```

## 유틸리티 타입

### Partial Types

```typescript
// 생성용 (id 없음)
export type CustomerInput = Omit<Customer, 'id' | 'created_at' | 'updated_at'>
export type ProductInput = Omit<Product, 'id' | 'created_at' | 'updated_at'>
export type TransactionInput = Omit<Transaction, 'id' | 'transaction_number' | 'created_at' | 'updated_at'>

// 수정용 (모든 필드 선택적)
export type CustomerUpdate = Partial<CustomerInput>
export type ProductUpdate = Partial<ProductInput>
export type TransactionUpdate = Partial<TransactionInput>
```

### 조회 옵션

```typescript
export interface QueryOptions {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  filters?: Record<string, any>
}
```

## 상수 타입

### Enum 대체

```typescript
export const TransactionType = {
  SALES: 'sales',
  PURCHASE: 'purchase',
  PAYMENT: 'payment'
} as const

export type TransactionType = typeof TransactionType[keyof typeof TransactionType]

export const TransactionStatus = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled'
} as const

export type TransactionStatus = typeof TransactionStatus[keyof typeof TransactionStatus]
```

## 사용 예시

### API 응답 타입

```typescript
import { Customer, Product, TransactionWithItems } from '@/types'

// API 함수
async function getCustomers(): Promise<Customer[]> {
  const data = await fetch('/api/customers')
  return data.json()
}

async function createProduct(input: ProductInput): Promise<Product> {
  const response = await fetch('/api/products', {
    method: 'POST',
    body: JSON.stringify(input)
  })
  return response.json()
}
```

### 컴포넌트 Props

```typescript
import { Customer, Transaction } from '@/types'

interface CustomerCardProps {
  customer: Customer
  onEdit: (customer: Customer) => void
  onDelete: (id: number) => void
}

interface TransactionListProps {
  transactions: TransactionWithItems[]
  filters: TransactionFilters
  onFilterChange: (filters: TransactionFilters) => void
}
```

### State 타입

```typescript
import { useState } from 'react'
import { Customer, TransactionFilters } from '@/types'

function CustomerPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [filters, setFilters] = useState<TransactionFilters>({
    transactionType: 'all',
    status: 'all'
  })
}
```

## 타입 확장

### 기존 타입 확장

```typescript
// 추가 필드 포함
interface CustomerWithStats extends Customer {
  totalSales: number
  totalPurchases: number
  transactionCount: number
}

// 특정 필드 필수화
interface RequiredCustomer extends Required<Pick<Customer, 'name' | 'phone'>> {
  // name과 phone은 필수
}
```

## 타입 체크 팁

### 런타임 검증

```typescript
function validateCustomer(data: any): data is Customer {
  return (
    typeof data.name === 'string' &&
    (data.type === 'customer' || data.type === 'supplier') &&
    typeof data.is_active === 'boolean'
  )
}

// 사용
if (validateCustomer(data)) {
  // data는 Customer 타입으로 추론됨
  console.log(data.name)
}
```

### 유니온 타입 좁히기

```typescript
function processTransaction(tx: Transaction) {
  if (tx.transaction_type === 'sales') {
    // 매출 처리
  } else if (tx.transaction_type === 'purchase') {
    // 매입 처리
  } else {
    // 수금 처리
  }
}
```

## 관련 문서

- [API 문서](../lib/README.md)
- [컴포넌트 가이드](../components/README.md)
- [페이지 가이드](../pages/README.md)
