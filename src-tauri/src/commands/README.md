# 📡 Tauri Commands (IPC)

Tauri IPC(Inter-Process Communication) 명령어를 정의합니다. 프론트엔드(TypeScript)에서 백엔드(Rust) 함수를 호출할 수 있게 합니다.

## 📂 파일 구조

```
commands/
├── mod.rs          # 명령어 모듈 export
├── customer.rs     # 거래처 명령어
├── product.rs      # 상품 명령어
├── transaction.rs  # 거래 명령어
└── company.rs      # 회사 명령어
```

## 🎯 역할

Commands 레이어는 다음을 담당합니다:

1. **IPC 인터페이스**: 프론트엔드와 백엔드 연결
2. **상태 관리**: 데이터베이스 풀 주입
3. **에러 변환**: Rust 에러를 String으로 변환
4. **서비스 호출**: 비즈니스 로직을 서비스 레이어에 위임

## 📋 명령어 목록

### mod.rs

모든 명령어를 re-export합니다.

```rust
pub mod company;
pub mod customer;
pub mod product;
pub mod transaction;

pub use company::*;
pub use customer::*;
pub use product::*;
pub use transaction::*;
```

---

### customer.rs

거래처 관련 명령어입니다.

#### 명령어 목록

```rust
#[tauri::command]
pub async fn get_customers(
    pool: State<'_, DbPool>,
    customer_type: Option<String>
) -> Result<Vec<Customer>, String>
```
- 거래처 목록 조회
- 타입 필터링 지원 (customer/supplier)

```rust
#[tauri::command]
pub async fn get_customer_by_id(
    pool: State<'_, DbPool>,
    id: i64
) -> Result<Customer, String>
```
- ID로 거래처 조회
- 없으면 에러 반환

```rust
#[tauri::command]
pub async fn create_customer(
    pool: State<'_, DbPool>,
    request: Customer
) -> Result<Customer, String>
```
- 새 거래처 생성
- 생성된 거래처 반환 (ID 포함)

```rust
#[tauri::command]
pub async fn update_customer(
    pool: State<'_, DbPool>,
    id: i64,
    request: Customer
) -> Result<Customer, String>
```
- 거래처 정보 수정
- 수정된 거래처 반환

```rust
#[tauri::command]
pub async fn delete_customer(
    pool: State<'_, DbPool>,
    id: i64
) -> Result<(), String>
```
- 거래처 삭제
- 성공 시 빈 결과 반환

---

### product.rs

상품 관련 명령어입니다.

#### 명령어 목록

```rust
#[tauri::command]
pub async fn get_products(
    pool: State<'_, DbPool>,
    active_only: Option<bool>
) -> Result<Vec<Product>, String>
```
- 상품 목록 조회
- 활성화 필터링 지원

```rust
#[tauri::command]
pub async fn get_product_by_id(
    pool: State<'_, DbPool>,
    id: i64
) -> Result<Product, String>
```
- ID로 상품 조회

```rust
#[tauri::command]
pub async fn create_product(
    pool: State<'_, DbPool>,
    request: Product
) -> Result<Product, String>
```
- 새 상품 생성
- 상품코드 중복 체크

```rust
#[tauri::command]
pub async fn update_product(
    pool: State<'_, DbPool>,
    id: i64,
    request: Product
) -> Result<Product, String>
```
- 상품 정보 수정

```rust
#[tauri::command]
pub async fn delete_product(
    pool: State<'_, DbPool>,
    id: i64
) -> Result<(), String>
```
- 상품 삭제

---

### transaction.rs

거래 관련 명령어입니다.

#### 명령어 목록

```rust
#[tauri::command]
pub async fn get_transactions(
    pool: State<'_, DbPool>,
    transaction_type: Option<String>,
    customer_id: Option<i64>,
    limit: Option<i64>,
    offset: Option<i64>
) -> Result<Vec<Transaction>, String>
```
- 거래 목록 조회
- 다중 필터링 지원
  - 거래 타입 (sales/purchase/payment)
  - 거래처 ID
  - 페이지네이션 (limit, offset)

```rust
#[tauri::command]
pub async fn get_transaction_by_id(
    pool: State<'_, DbPool>,
    id: i64
) -> Result<Transaction, String>
```
- ID로 거래 조회
- 거래 항목(items) 포함

```rust
#[tauri::command]
pub async fn create_transaction(
    pool: State<'_, DbPool>,
    request: Transaction
) -> Result<Transaction, String>
```
- 새 거래 생성
- 거래 항목 함께 생성
- 트랜잭션 처리

```rust
#[tauri::command]
pub async fn update_transaction(
    pool: State<'_, DbPool>,
    id: i64,
    request: Transaction
) -> Result<Transaction, String>
```
- 거래 정보 수정
- 기존 항목 삭제 후 재생성

```rust
#[tauri::command]
pub async fn delete_transaction(
    pool: State<'_, DbPool>,
    id: i64
) -> Result<(), String>
```
- 거래 삭제
- CASCADE로 항목 자동 삭제

---

### company.rs

회사 정보 관련 명령어입니다.

#### 명령어 목록

```rust
#[tauri::command]
pub async fn get_company(
    pool: State<'_, DbPool>
) -> Result<Company, String>
```
- 회사 정보 조회
- 현재는 단일 회사만 지원

```rust
#[tauri::command]
pub async fn update_company(
    pool: State<'_, DbPool>,
    request: Company
) -> Result<Company, String>
```
- 회사 정보 수정

## 💡 사용 패턴

### 명령어 구조

모든 명령어는 다음 패턴을 따릅니다:

```rust
#[tauri::command]
pub async fn command_name(
    pool: State<'_, DbPool>,     // ① 상태 주입
    /* 파라미터들 */
) -> Result<ReturnType, String> { // ② 반환 타입
    service::function(&pool, /* ... */)  // ③ 서비스 호출
        .await
        .map_err(|e| e.to_string())      // ④ 에러 변환
}
```

#### ① 상태 주입
- `State<'_, DbPool>`: 데이터베이스 연결 풀
- Tauri가 자동으로 주입

#### ② 반환 타입
- `Result<T, String>`: 성공 또는 에러
- String 에러는 프론트엔드로 전달

#### ③ 서비스 호출
- 비즈니스 로직은 services 레이어에 위임
- commands는 단순 인터페이스 역할

#### ④ 에러 변환
- `map_err(|e| e.to_string())`: Rust 에러를 String으로
- 프론트엔드에서 에러 메시지 표시 가능

## 🔗 프론트엔드 연동

### TypeScript에서 호출

```tsx
import { invoke } from '@tauri-apps/api/tauri'

// 거래처 조회
const customers = await invoke<Customer[]>('get_customers', {
  customer_type: 'customer'
})

// 거래처 생성
const newCustomer = await invoke<Customer>('create_customer', {
  request: {
    name: '신규 거래처',
    type: 'customer',
    is_active: true
  }
})

// 에러 처리
try {
  await invoke('delete_customer', { id: 123 })
} catch (error) {
  console.error('삭제 실패:', error)
}
```

### 타입 안전성

TypeScript 타입과 Rust 구조체가 일치해야 합니다:

```typescript
// TypeScript
interface Customer {
  id?: number
  name: string
  type: 'customer' | 'supplier'
  // ...
}
```

```rust
// Rust
#[derive(Serialize, Deserialize)]
pub struct Customer {
    pub id: Option<i64>,
    pub name: String,
    pub r#type: String,
    // ...
}
```

## 🔧 main.rs에 등록

명령어는 main.rs에서 등록해야 합니다:

```rust
.invoke_handler(tauri::generate_handler![
    get_customers,
    create_customer,
    update_customer,
    delete_customer,
    // ... 모든 명령어
])
```

## 📋 명령어 네이밍 컨벤션

- **get_**: 조회 (단수/복수)
- **create_**: 생성
- **update_**: 수정
- **delete_**: 삭제
- **_by_id**: ID로 조회

예시:
- `get_customers` - 목록 조회
- `get_customer_by_id` - 단건 조회
- `create_customer` - 생성
- `update_customer` - 수정
- `delete_customer` - 삭제

## 🚀 성능 고려사항

### 비동기 처리
- 모든 명령어는 `async fn`
- 데이터베이스 I/O가 블로킹하지 않음
- Tokio 런타임 활용

### 연결 풀
- SQLite 연결 풀 사용
- 연결 재사용으로 성능 향상

### 에러 처리
- 명확한 에러 메시지
- 프론트엔드에서 사용자 친화적 표시 가능

## 📋 향후 개선 사항

- [ ] 입력 유효성 검증 추가
- [ ] 권한 체크 (인증/인가)
- [ ] 로깅 추가
- [ ] 페이지네이션 표준화
- [ ] 일괄 작업 명령어 (batch operations)
- [ ] 캐싱 레이어
- [ ] Rate Limiting
- [ ] 감사 로그
