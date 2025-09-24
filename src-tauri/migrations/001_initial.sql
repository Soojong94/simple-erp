-- 회사 정보 테이블
CREATE TABLE IF NOT EXISTS companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    business_number TEXT UNIQUE NOT NULL,
    representative TEXT NOT NULL,
    address TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 거래처 테이블 (고객/공급업체)
CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    business_number TEXT,
    representative TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    customer_type TEXT CHECK(customer_type IN ('customer', 'supplier', 'both')) DEFAULT 'customer',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 상품 테이블
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    category TEXT,
    unit TEXT DEFAULT '개',
    unit_price DECIMAL(10,2) DEFAULT 0,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 거래 테이블 (매출/매입)
CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_number TEXT UNIQUE NOT NULL,
    customer_id INTEGER NOT NULL,
    transaction_type TEXT CHECK(transaction_type IN ('sale', 'purchase')) NOT NULL,
    transaction_date DATE NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    tax_amount DECIMAL(12,2) NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL,
    status TEXT CHECK(status IN ('pending', 'completed', 'cancelled')) DEFAULT 'pending',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- 거래 품목 테이블
CREATE TABLE IF NOT EXISTS transaction_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity DECIMAL(10,3) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- 세금계산서 테이블
CREATE TABLE IF NOT EXISTS tax_invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id INTEGER NOT NULL,
    invoice_number TEXT UNIQUE NOT NULL,
    issue_date DATE NOT NULL,
    supply_amount DECIMAL(12,2) NOT NULL,
    tax_amount DECIMAL(12,2) NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL,
    status TEXT CHECK(status IN ('issued', 'sent', 'received')) DEFAULT 'issued',
    pdf_path TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id)
);

-- 초기 회사 정보 삽입
INSERT INTO companies (name, business_number, representative, address, phone, email)
SELECT '샘플 회사', '123-45-67890', '김대표', '서울시 강남구 테헤란로 123', '02-1234-5678', 'info@sample.com'
WHERE NOT EXISTS (SELECT 1 FROM companies WHERE business_number = '123-45-67890');


-- 샘플 거래처 데이터
INSERT INTO customers (name, business_number, representative, address, phone, email, customer_type)
SELECT 'ABC 상사', '111-11-11111', '이사장', '서울시 서초구 강남대로 456', '02-1111-1111', 'abc@company.com', 'customer'
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE business_number = '111-11-11111');

INSERT INTO customers (name, business_number, representative, address, phone, email, customer_type)
SELECT 'DEF 유통', '222-22-22222', '박대리', '부산시 해운대구 해운대로 789', '051-2222-2222', 'def@company.com', 'supplier'
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE business_number = '222-22-22222');

INSERT INTO customers (name, business_number, representative, address, phone, email, customer_type)
SELECT 'GHI 기업', '333-33-33333', '최부장', '대구시 중구 중앙대로 321', '053-3333-3333', 'ghi@company.com', 'both'
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE business_number = '333-33-33333');


-- 샘플 상품 데이터
INSERT INTO products (name, code, category, unit, unit_price, description)
SELECT '노트북', 'NB001', '전자제품', '대', 1200000.00, 'ASUS 비보북 15'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE code = 'NB001');

INSERT INTO products (name, code, category, unit, unit_price, description)
SELECT '마우스', 'MS001', '전자제품', '개', 25000.00, '무선 마우스'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE code = 'MS001');

INSERT INTO products (name, code, category, unit, unit_price, description)
SELECT '키보드', 'KB001', '전자제품', '개', 80000.00, '기계식 키보드'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE code = 'KB001');

INSERT INTO products (name, code, category, unit, unit_price, description)
SELECT '모니터', 'MN001', '전자제품', '대', 300000.00, '27인치 LED 모니터'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE code = 'MN001');

INSERT INTO products (name, code, category, unit, unit_price, description)
SELECT '프린터', 'PR001', '사무용품', '대', 150000.00, '레이저 프린터'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE code = 'PR001');


-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_customers_business_number ON customers(business_number);
CREATE INDEX IF NOT EXISTS idx_products_code ON products(code);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_customer ON transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_transaction_items_transaction ON transaction_items(transaction_id);
CREATE INDEX IF NOT EXISTS idx_tax_invoices_transaction ON tax_invoices(transaction_id);
