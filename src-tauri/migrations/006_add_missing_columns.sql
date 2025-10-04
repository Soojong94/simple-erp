-- 누락된 컬럼 추가

-- products 테이블에 is_active 컬럼 추가
ALTER TABLE products ADD COLUMN is_active BOOLEAN DEFAULT 1;

-- companies 테이블에 business_type, business_item 컬럼 추가
ALTER TABLE companies ADD COLUMN business_type TEXT;
ALTER TABLE companies ADD COLUMN business_item TEXT;
ALTER TABLE companies ADD COLUMN default_invoice_memo TEXT;

-- customers 테이블에 business_type, business_item, outstanding_balance 추가
ALTER TABLE customers ADD COLUMN business_type TEXT;
ALTER TABLE customers ADD COLUMN business_item TEXT;
ALTER TABLE customers ADD COLUMN outstanding_balance DECIMAL(12,2) DEFAULT 0;
ALTER TABLE customers ADD COLUMN is_active BOOLEAN DEFAULT 1;

-- products 테이블에 추가 컬럼
ALTER TABLE products ADD COLUMN traceability_number TEXT;
ALTER TABLE products ADD COLUMN origin TEXT;
ALTER TABLE products ADD COLUMN slaughterhouse TEXT;
ALTER TABLE products ADD COLUMN use_inventory_management BOOLEAN DEFAULT 0;

-- transaction_items 테이블에 추가 컬럼
ALTER TABLE transaction_items ADD COLUMN traceability_number TEXT;
ALTER TABLE transaction_items ADD COLUMN origin TEXT;
ALTER TABLE transaction_items ADD COLUMN slaughterhouse TEXT;
ALTER TABLE transaction_items ADD COLUMN notes TEXT;

-- transactions 테이블 컬럼명 수정 및 추가
-- 참고: SQLite는 컬럼 이름 변경을 직접 지원하지 않으므로,
-- 새 컬럼을 추가하고 데이터를 복사한 후 기존 컬럼을 제거하는 방식 사용

-- customer_type을 type으로 변경하기 위한 컬럼 추가
ALTER TABLE customers ADD COLUMN type TEXT CHECK(type IN ('customer', 'supplier')) DEFAULT 'customer';

-- 기존 customer_type 데이터를 type으로 복사
UPDATE customers SET type = CASE
    WHEN customer_type = 'both' THEN 'customer'
    ELSE customer_type
END;

-- customers 테이블에 contact_person 추가
ALTER TABLE customers ADD COLUMN contact_person TEXT;
