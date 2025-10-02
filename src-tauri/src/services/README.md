# 🔧 Tauri Services (Business Logic)

비즈니스 로직과 데이터베이스 쿼리를 담당하는 서비스 레이어입니다.

## 📂 파일 구조

```
services/
├── mod.rs          # 서비스 모듈 export
├── customer.rs     # 거래처 비즈니스 로직
├── product.rs      # 상품 비즈니스 로직
├── transaction.rs  # 거래 비즈니스 로직
└── company.rs      # 회사 비즈니스 로직
```

## 🎯 역할

Services 레이어는 다음을 담당합니다:

1. **데이터베이스 쿼리**: SQL 쿼리 실행
2. **비즈니스 로직**: 데이터 검증 및 변환
3. **트랜잭션 관리**: 복잡한 작업의 원자성 보장
4. **에러 처리**: 도메인 에러 생성

## 📋 서비스 목록

### mod.rs

모든 서비스를 re-export합니다.

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

거래처 비즈니스 로직을 담당합니다.

#### 주요 함수

##### 1. 전체 조회

```rust
pub async fn get_all(
    pool: &DbPool,
    customer_type: Option<String>
) -> Result<Vec<Customer>>
```

**처리**:
- 타입 필터링 (customer/supplier)
- 이름 순 정렬
- sqlx 쿼리 빌더 사용

**쿼리**:
```sql
SELECT * FROM customers 
WHERE type = ? 
ORDER BY name
```

##### 2. ID로 조회

```rust
pub async fn get_by_id(
    pool: &DbPool,
    id: i64
) -> Result<Customer>
```

**처리**:
- ID로 단건 조회
- 없으면 `AppError::NotFound`

##### 3. 생성

```rust
pub async fn create(
    pool: &DbPool,
    request: Customer
) -> Result<Customer>
```

**처리**:
1. INSERT 쿼리 실행
2. 생성된 ID 가져오기
3. 생성된 거래처 반환

**쿼리**:
```sql
INSERT INTO customers (name, type, business_number, ...)
VALUES (?, ?, ?, ...)
```

##### 4. 수정

```rust
pub async fn update(
    pool: &DbPool,
    id: i64,
    request: Customer
) -> Result<Customer>
```

**처리**:
1. 존재 여부 확인
2. UPDATE 쿼리 실행
3. 수정된 거래처 반환

##### 5. 삭제

```rust
pub async fn delete(
    pool: &DbPool,
    id: i64
) -> Result<()>
```

**처리**:
1. 존재 여부 확인
2. DELETE 쿼리 실행

**쿼리**:
```sql
DELETE FROM customers WHERE id = ?
```

---

### product.rs

상품 비즈니스 로직을 담당합니다.

#### 주요 함수

##### 1. 전체 조회

```rust
pub async fn get_all(
    pool: &DbPool,
    active_only: Option<bool>
) -> Result<Vec<Product>>
```

**처리**:
- 활성화 필터링
- 이름 순 정렬

**쿼리**:
```sql
SELECT * FROM products 
WHERE is_active = 1 
ORDER BY name
```

##### 2. 생성

```rust
pub async fn create(
    pool: &DbPool,
    request: Product
) -> Result<Product>
```

**처리**:
1. 상품코드 중복 체크
2. INSERT 쿼리 실행
3. 생성된 상품 반환

**유효성 검사**:
```rust
// 상품코드 중복 체크
let existing = sqlx::query_as::<_, Product>(
    "SELECT * FROM products WHERE code = ?"
)
.bind(&request.code)
.fetch_optional(pool)
.await?;

if existing.is_some() {
    return Err(AppError::InvalidInput(
        "이미 존재하는 상품코드입니다.".to_string()
    ));
}
```

##### 3. 수정 & 삭제

product 서비스도 customer와 유사한 패턴을 따릅니다.

---

### transaction.rs

거래 비즈니스 로직을 담당합니다. 가장 복잡한 서비스입니다.

#### 주요 함수

##### 1. 전체 조회

```rust
pub async fn get_all(
    pool: &DbPool,
    transaction_type: Option<String>,
    customer_id: Option<i64>,
    limit: Option<i64>,
    offset: Option<i64>
) -> Result<Vec<Transaction>>
```

**처리**:
1. transactions 테이블 조회
2. 각 거래의 items 조회 (별도 쿼리)
3. Transaction 구조체에 items 결합
4. 정렬 (날짜 내림차순)

**쿼리**:
```sql
-- 거래 목록
SELECT * FROM transactions
WHERE transaction_type = ? AND customer_id = ?
ORDER BY transaction_date DESC
LIMIT ? OFFSET ?

-- 각 거래의 항목들
SELECT * FROM transaction_items
WHERE transaction_id = ?
```

##### 2. ID로 조회

```rust
pub async fn get_by_id(
    pool: &DbPool,
    id: i64
) -> Result<Transaction>
```

**처리**:
1. transaction 조회
2. transaction_items 조회
3. 결합하여 반환

##### 3. 생성 (트랜잭션)

```rust
pub async fn create(
    pool: &DbPool,
    request: Transaction
) -> Result<Transaction>
```

**처리** (데이터베이스 트랜잭션):
1. 트랜잭션 시작
2. transaction INSERT
3. 각 item INSERT
4. 커밋
5. 생성된 거래 반환

**쿼리**:
```sql
BEGIN TRANSACTION;

INSERT INTO transactions (customer_id, transaction_type, ...)
VALUES (?, ?, ...);

INSERT INTO transaction_items (transaction_id, product_id, ...)
VALUES (?, ?, ...);

COMMIT;
```

**에러 처리**:
- 중간에 실패 시 자동 롤백
- 원자성 보장

##### 4. 수정 (트랜잭션)

```rust
pub async fn update(
    pool: &DbPool,
    id: i64,
    request: Transaction
) -> Result<Transaction>
```

**처리** (데이터베이스 트랜잭션):
1. 트랜잭션 시작
2. transaction UPDATE
3. 기존 items 모두 DELETE
4. 새 items INSERT
5. 커밋

**쿼리**:
```sql
BEGIN TRANSACTION;

UPDATE transactions
SET customer_id = ?, transaction_type = ?, ...
WHERE id = ?;

DELETE FROM transaction_items WHERE transaction_id = ?;

INSERT INTO transaction_items (transaction_id, product_id, ...)
VALUES (?, ?, ...);

COMMIT;
```

##### 5. 삭제

```rust
pub async fn delete(
    pool: &DbPool,
    id: i64
) -> Result<()>
```

**처리**:
- CASCADE 설정으로 items 자동 삭제
- 단순 DELETE 쿼리

---

### company.rs

회사 정보 비즈니스 로직을 담당합니다.

#### 주요 함수

##### 1. 조회

```rust
pub async fn get(pool: &DbPool) -> Result<Company>
```

**처리**:
- 첫 번째 회사 정보 조회
- 없으면 기본값 생성

##### 2. 수정

```rust
pub async fn update(
    pool: &DbPool,
    request: Company
) -> Result<Company>
```

**처리**:
- 회사 정보 UPDATE
- 수정된 정보 반환

## 💡 서비스 패턴

### 기본 구조

```rust
pub async fn function_name(
    pool: &DbPool,
    /* 파라미터들 */
) -> Result<ReturnType> {
    // 1. 유효성 검증 (선택사항)
    
    // 2. 데이터베이스 쿼리
    let result = sqlx::query_as::<_, Model>("SQL")
        .bind(param1)
        .bind(param2)
        .fetch_one(pool)  // or fetch_all, fetch_optional
        .await
        .map_err(AppError::from)?;
    
    // 3. 후처리 (선택사항)
    
    // 4. 반환
    Ok(result)
}
```

### sqlx 쿼리 메서드

```rust
// 단건 조회 (없으면 에러)
.fetch_one(pool)

// 단건 조회 (없으면 None)
.fetch_optional(pool)

// 전체 조회
.fetch_all(pool)

// 실행만 (INSERT, UPDATE, DELETE)
.execute(pool)
```

### 트랜잭션 패턴

```rust
pub async fn complex_operation(
    pool: &DbPool,
    /* ... */
) -> Result<()> {
    let mut tx = pool.begin().await?;
    
    // 여러 쿼리 실행
    sqlx::query("INSERT ...").execute(&mut tx).await?;
    sqlx::query("UPDATE ...").execute(&mut tx).await?;
    
    // 성공 시 커밋
    tx.commit().await?;
    
    Ok(())
}
```

## 🔒 에러 처리

### AppError 타입

```rust
#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("Database error: {0}")]
    DatabaseError(#[from] sqlx::Error),
    
    #[error("Not found: {0}")]
    NotFound(String),
    
    #[error("Invalid input: {0}")]
    InvalidInput(String),
}
```

### 사용 예시

```rust
// NotFound 에러
if customer.is_none() {
    return Err(AppError::NotFound("거래처를 찾을 수 없습니다.".to_string()));
}

// InvalidInput 에러
if code.is_empty() {
    return Err(AppError::InvalidInput("상품코드는 필수입니다.".to_string()));
}

// sqlx 에러 자동 변환
let result = sqlx::query(...)
    .fetch_one(pool)
    .await
    .map_err(AppError::from)?;
```

## 🧪 테스트

### 유닛 테스트 예시

```rust
#[cfg(test)]
mod tests {
    use super::*;
    
    #[tokio::test]
    async fn test_create_customer() {
        let pool = create_test_pool().await;
        
        let customer = Customer {
            name: "테스트".to_string(),
            type: "customer".to_string(),
            ..Default::default()
        };
        
        let result = create(&pool, customer).await;
        
        assert!(result.is_ok());
        assert_eq!(result.unwrap().name, "테스트");
    }
}
```

## 📊 성능 최적화

### 인덱스 활용

```sql
-- 자주 조회하는 컬럼에 인덱스
CREATE INDEX idx_customers_type ON customers(type);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
```

### N+1 문제 방지

```rust
// ❌ N+1 문제 (각 거래마다 items 쿼리)
for transaction in transactions {
    let items = get_items(transaction.id).await?;
}

// ✅ 일괄 조회
let all_items = get_all_items().await?;
let grouped = group_by_transaction_id(all_items);
```

### 연결 풀 크기

```rust
// tauri.conf.json 또는 코드에서 설정
SqlitePool::connect_with(
    SqliteConnectOptions::new()
        .max_connections(5)
)
```

## 📋 향후 개선 사항

- [ ] 재고 관리 서비스 추가
- [ ] 캐싱 레이어 (Redis 등)
- [ ] 배치 작업 최적화
- [ ] 더 복잡한 쿼리 최적화
- [ ] 테스트 커버리지 확대
- [ ] 로깅 추가
- [ ] 성능 모니터링
- [ ] 데이터 검증 강화
- [ ] 비즈니스 규칙 추가
