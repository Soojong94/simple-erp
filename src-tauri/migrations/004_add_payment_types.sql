-- payment 타입을 payment_in/payment_out으로 명확하게 구분
-- payment_in: 수금 (매출 대금 회수)
-- payment_out: 지급 (매입 대금 지급)

-- 1. 백업 테이블 생성
CREATE TABLE transactions_backup AS SELECT * FROM transactions;

-- 2. 기존 테이블 삭제
DROP TABLE transactions;

-- 3. 새 테이블 생성 (payment_in, payment_out 타입 포함)
CREATE TABLE transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_number TEXT UNIQUE NOT NULL,
    customer_id INTEGER NOT NULL,
    transaction_type TEXT CHECK(transaction_type IN ('sale', 'purchase', 'payment_in', 'payment_out')) NOT NULL,
    transaction_date DATE NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    tax_amount DECIMAL(12,2) NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL,
    status TEXT CHECK(status IN ('pending', 'completed', 'cancelled')) DEFAULT 'pending',
    notes TEXT,
    reference_payment_id INTEGER,
    current_balance DECIMAL(12,2) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (reference_payment_id) REFERENCES transactions(id)
);

-- 4. 데이터 복원 (기존 'payment'는 'payment_in'으로 변환)
INSERT INTO transactions (
    id, transaction_number, customer_id, transaction_type, transaction_date,
    subtotal, tax_amount, total_amount, status, notes, reference_payment_id,
    current_balance, created_at, updated_at
)
SELECT
    id, transaction_number, customer_id,
    CASE
        WHEN transaction_type = 'payment' THEN 'payment_in'
        ELSE transaction_type
    END as transaction_type,
    transaction_date, subtotal, tax_amount, total_amount, status, notes,
    reference_payment_id, current_balance, created_at, updated_at
FROM transactions_backup;

-- 5. 백업 테이블 삭제
DROP TABLE transactions_backup;

-- 6. 인덱스 재생성
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_customer ON transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_reference_payment ON transactions(reference_payment_id);
CREATE INDEX IF NOT EXISTS idx_transactions_customer_date ON transactions(customer_id, transaction_date, id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(transaction_type);
