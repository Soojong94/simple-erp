# 🦀 Tauri Backend (Rust)

Tauri 데스크톱 앱의 Rust 백엔드 코드입니다. SQLite 데이터베이스와 IPC 명령어를 관리합니다.

## 📂 파일 구조

```
src-tauri/
├── src/
│   ├── main.rs              # 앱 진입점 및 Tauri 설정
│   ├── database.rs          # SQLite 데이터베이스 초기화
│   ├── errors.rs            # 에러 타입 정의
│   ├── models.rs            # 데이터 모델 (Rust 구조체)
│   ├── commands/            # Tauri 명령어 (IPC)
│   │   ├── mod.rs           # 명령어 모듈 export
│   │   ├── customer.rs      # 거래처 명령어
│   │   ├── product.rs       # 상품 명령어
│   │   ├── transaction.rs   # 거래 명령어
│   │   └── company.rs       # 회사 명령어
│   └── services/            # 비즈니스 로직
│       ├── mod.rs           # 서비스 모듈 export
│       ├── customer.rs      # 거래처 서비스
│       ├── product.rs       # 상품 서비스
│       ├── transaction.rs   # 거래 서비스
│       └── company.rs       # 회사 서비스
├── migrations/
│   └── 001_initial.sql      # 초기 데이터베이스 스키마
├── icons/                   # 앱 아이콘
├── Cargo.toml               # Rust 의존성
├── tauri.conf.json          # Tauri 설정
└── build.rs                 # 빌드 스크립트
```

## 🎯 주요 파일

### main.rs

Tauri 앱의 진입점입니다.

#### 주요 코드

```rust
#[tokio::main]
async fn main() {
    tauri::Builder::default()
        .setup(|app| {
            // 데이터베이스 초기화
            let handle = app.handle();
            tauri::async_runtime::spawn(async move {
                match init_db(&handle).await {
                    Ok(pool) => {
                        handle.manage(pool);
                        println!("Database initialized!");
                    }
                    Err(e) => {
                        eprintln!("Failed to init DB: {}", e);
                        std::process::exit(1);
                    }
                }
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Customer commands
            get_customers,
            get_customer_by_id,
            create_customer,
            update_customer,
            delete_customer,
            // Product commands
            get_products,
            get_product_by_id,
            create_product,
            update_product,
            delete_product,
            // Transaction commands
            get_transactions,
            get_transaction_by_id,
            create_transaction,
            update_transaction,
            delete_transaction,
            // Company commands
            get_company,
            update_company
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

**특징**:
- Tokio 비동기 런타임
- 데이터베이스 풀 관리
- IPC 명령어 등록

---

### database.rs

SQLite 데이터베이스 초기화 및 마이그레이션을 담당합니다.

#### 주요 함수

```rust
pub async fn init_db(app_handle: &AppHandle) -> Result<DbPool>
```

**처리 과정**:
1. 앱 데이터 디렉토리 결정
   - 개발: 프로젝트 루트의 `data/` 폴더
   - 프로덕션: 시스템 데이터 디렉토리
2. `simple_erp.db` 파일 생성 (없으면)
3. SQLite 연결 풀 생성
4. 마이그레이션 실행
5. 연결 풀 반환

```rust
async fn run_migrations(pool: &DbPool) -> Result<()>
```

**처리**:
- `migrations/001_initial.sql` 파일 읽기
- SQL 문장 분리 (`;` 기준)
- 순차 실행

**특징**:
- 연결 풀 패턴 (성능 향상)
- 자동 마이그레이션
- 에러 핸들링

---

### errors.rs

커스텀 에러 타입을 정의합니다.

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

// Tauri 명령어에서 사용할 수 있도록 변환
impl From<AppError> for String {
    fn from(err: AppError) -> Self {
        err.to_string()
    }
}
```

**특징**:
- `thiserror` 크레이트 사용
- 명확한 에러 메시지
- Tauri IPC와 호환

---

### models.rs

데이터 모델 (Rust 구조체)를 정의합니다.

#### 주요 구조체

```rust
#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Customer {
    pub id: Option<i64>,
    pub name: String,
    pub r#type: String,  // "customer" 또는 "supplier"
    pub business_number: Option<String>,
    pub ceo_name: Option<String>,
    pub phone: Option<String>,
    pub address: Option<String>,
    pub email: Option<String>,
    pub contact_person: Option<String>,
    pub is_active: bool,
    pub notes: Option<String>,
    pub created_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Product {
    pub id: Option<i64>,
    pub name: String,
    pub code: String,
    pub category: String,
    pub unit_price: f64,
    pub unit: String,
    pub traceability_code: Option<String>,
    pub origin: Option<String>,
    pub slaughterhouse: Option<String>,
    pub is_active: bool,
    pub description: Option<String>,
    pub created_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Transaction {
    pub id: Option<i64>,
    pub customer_id: i64,
    pub transaction_type: String,
    pub transaction_date: String,
    pub total_amount: f64,
    pub is_paid: bool,
    pub payment_date: Option<String>,
    pub notes: Option<String>,
    pub created_at: Option<String>,
    pub items: Vec<TransactionItem>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct TransactionItem {
    pub id: Option<i64>,
    pub transaction_id: Option<i64>,
    pub product_id: i64,
    pub quantity: f64,
    pub unit_price: f64,
    pub amount: f64,
    pub lot_number: Option<String>,
}
```

**특징**:
- serde JSON 직렬화/역직렬화
- sqlx ORM 매핑
- TypeScript 타입과 일치

---

### commands/

Tauri IPC 명령어를 정의합니다. 프론트엔드에서 `invoke()` 함수로 호출됩니다.

#### 구조

각 명령어는 다음 패턴을 따릅니다:

```rust
#[tauri::command]
pub async fn get_customers(
    pool: State<'_, DbPool>,
    customer_type: Option<String>
) -> Result<Vec<Customer>, String> {
    customer_service::get_all(&pool, customer_type)
        .await
        .map_err(|e| e.to_string())
}
```

**특징**:
- `#[tauri::command]` 매크로로 자동 등록
- 상태 관리 (데이터베이스 풀)
- 에러를 String으로 변환 (프론트엔드로 전달)

---

### services/

비즈니스 로직을 담당합니다. 데이터베이스 쿼리 및 데이터 처리를 수행합니다.

#### 구조

```rust
pub async fn get_all(
    pool: &DbPool,
    customer_type: Option<String>
) -> Result<Vec<Customer>> {
    let query = if let Some(ctype) = customer_type {
        sqlx::query_as::<_, Customer>(
            "SELECT * FROM customers WHERE type = ? ORDER BY name"
        )
        .bind(ctype)
    } else {
        sqlx::query_as::<_, Customer>(
            "SELECT * FROM customers ORDER BY name"
        )
    };
    
    query.fetch_all(pool).await.map_err(AppError::from)
}
```

**특징**:
- sqlx 쿼리 빌더
- 타입 안전한 쿼리
- 에러 변환

---

### migrations/001_initial.sql

초기 데이터베이스 스키마를 정의합니다.

#### 주요 테이블

**customers** (거래처)
```sql
CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('customer', 'supplier')),
    business_number TEXT,
    ceo_name TEXT,
    phone TEXT,
    address TEXT,
    email TEXT,
    contact_person TEXT,
    is_active BOOLEAN NOT NULL DEFAULT 1,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**products** (상품)
```sql
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    unit_price REAL NOT NULL,
    unit TEXT NOT NULL DEFAULT 'kg',
    traceability_code TEXT,
    origin TEXT,
    slaughterhouse TEXT,
    is_active BOOLEAN NOT NULL DEFAULT 1,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**transactions** (거래)
```sql
CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    transaction_type TEXT NOT NULL CHECK(transaction_type IN ('sales', 'purchase', 'payment')),
    transaction_date DATE NOT NULL,
    total_amount REAL NOT NULL,
    is_paid BOOLEAN NOT NULL DEFAULT 0,
    payment_date DATE,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);
```

**transaction_items** (거래 항목)
```sql
CREATE TABLE IF NOT EXISTS transaction_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity REAL NOT NULL,
    unit_price REAL NOT NULL,
    amount REAL NOT NULL,
    lot_number TEXT,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);
```

**특징**:
- 외래 키 제약 조건
- CHECK 제약 조건
- 자동 타임스탬프
- CASCADE DELETE

## 💡 사용 예시

### 프론트엔드에서 명령어 호출

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
    phone: '010-1234-5678',
    is_active: true
  }
})

// 거래처 삭제
await invoke('delete_customer', { id: 123 })
```

## 🔧 개발 환경 설정

### 의존성

```toml
[dependencies]
tauri = { version = "1.5", features = ["shell-open"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
sqlx = { version = "0.7", features = ["runtime-tokio-rustls", "sqlite"] }
tokio = { version = "1", features = ["full"] }
anyhow = "1.0"
thiserror = "1.0"
```

### 빌드

```bash
# 개발 모드
cd src-tauri
cargo tauri dev

# 프로덕션 빌드
cargo tauri build
```

## 📋 향후 개선 사항

- [ ] 재고 관리 Rust 구현
- [ ] 트랜잭션 지원
- [ ] 백업/복원 Rust 구현
- [ ] 데이터 검증 강화
- [ ] 인덱스 최적화
- [ ] 쿼리 성능 최적화
- [ ] 로깅 시스템
- [ ] 에러 처리 개선
- [ ] 유닛 테스트
- [ ] 통합 테스트
