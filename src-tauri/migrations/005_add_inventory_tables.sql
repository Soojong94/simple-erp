-- 재고 현황 테이블 (단순 재고 관리)
CREATE TABLE IF NOT EXISTS product_inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL UNIQUE,
    current_stock DECIMAL(10,3) DEFAULT 0,
    safety_stock DECIMAL(10,3) DEFAULT 30,
    location TEXT CHECK(location IN ('frozen', 'cold', 'room')) DEFAULT 'cold',
    expiry_date DATE,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- 재고 이동 이력 테이블
CREATE TABLE IF NOT EXISTS stock_movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    movement_type TEXT CHECK(movement_type IN ('in', 'out', 'adjust', 'expired')) NOT NULL,
    quantity DECIMAL(10,3) NOT NULL,
    unit_price DECIMAL(10,2),
    lot_number TEXT,
    expiry_date DATE,
    traceability_number TEXT,
    origin TEXT,
    slaughterhouse TEXT,
    transaction_id INTEGER,
    reference_type TEXT CHECK(reference_type IN ('purchase', 'sales', 'manual', 'adjustment', 'cancellation')),
    reference_id INTEGER,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE SET NULL
);

-- 재고 로트 테이블 (향후 확장용, 현재 미사용)
CREATE TABLE IF NOT EXISTS stock_lots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    lot_number TEXT NOT NULL UNIQUE,
    initial_quantity DECIMAL(10,3) NOT NULL,
    remaining_quantity DECIMAL(10,3) NOT NULL,
    expiry_date DATE NOT NULL,
    traceability_number TEXT,
    origin TEXT,
    slaughterhouse TEXT,
    supplier_id INTEGER,
    status TEXT CHECK(status IN ('active', 'expired', 'finished', 'cancelled')) DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (supplier_id) REFERENCES customers(id) ON DELETE SET NULL
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_product_inventory_product ON product_inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_transaction ON stock_movements(transaction_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_date ON stock_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_stock_lots_product ON stock_lots(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_lots_status ON stock_lots(status);
CREATE INDEX IF NOT EXISTS idx_stock_lots_expiry ON stock_lots(expiry_date);
