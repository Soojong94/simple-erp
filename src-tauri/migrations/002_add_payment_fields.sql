-- 거래 테이블에 수금 관련 필드 추가
ALTER TABLE transactions ADD COLUMN reference_payment_id INTEGER;

-- 거래처 테이블에 미수금 필드 추가
ALTER TABLE customers ADD COLUMN outstanding_balance DECIMAL(12,2) DEFAULT 0;

-- payment 타입 추가를 위해 CHECK 제약 조건 변경
-- SQLite는 ALTER TABLE로 CHECK 제약 조건을 직접 수정할 수 없으므로
-- 새 테이블 생성 후 데이터 복사 방식 사용

-- 1. 백업 테이블 생성
CREATE TABLE transactions_backup AS SELECT * FROM transactions;

-- 2. 기존 테이블 삭제
DROP TABLE transactions;

-- 3. 새 테이블 생성 (payment 타입 포함)
CREATE TABLE transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_number TEXT UNIQUE NOT NULL,
    customer_id INTEGER NOT NULL,
    transaction_type TEXT CHECK(transaction_type IN ('sale', 'purchase', 'payment')) NOT NULL,
    transaction_date DATE NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    tax_amount DECIMAL(12,2) NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL,
    status TEXT CHECK(status IN ('pending', 'completed', 'cancelled')) DEFAULT 'pending',
    notes TEXT,
    reference_payment_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (reference_payment_id) REFERENCES transactions(id)
);

-- 4. 데이터 복원
INSERT INTO transactions (
    id, transaction_number, customer_id, transaction_type, transaction_date,
    subtotal, tax_amount, total_amount, status, notes, created_at, updated_at
)
SELECT 
    id, transaction_number, customer_id, transaction_type, transaction_date,
    subtotal, tax_amount, total_amount, status, notes, created_at, updated_at
FROM transactions_backup;

-- 5. 백업 테이블 삭제
DROP TABLE transactions_backup;

-- 6. 인덱스 재생성
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_customer ON transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_reference_payment ON transactions(reference_payment_id);
