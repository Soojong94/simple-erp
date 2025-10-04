-- 거래 테이블에 현잔액 컬럼 추가
ALTER TABLE transactions ADD COLUMN current_balance DECIMAL(12,2) DEFAULT 0;

-- 현잔액 계산을 위한 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_transactions_customer_date ON transactions(customer_id, transaction_date, id);

-- 기존 데이터의 현잔액 계산
-- 각 거래처별로 시간순으로 정렬하여 현잔액 계산
-- 이 작업은 애플리케이션 레벨에서 수행됩니다.
-- (SQLite의 윈도우 함수 제약으로 인해 복잡한 누적 계산은 코드에서 처리)
