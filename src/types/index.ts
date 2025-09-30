// ============= 사용자 관리 시스템 =============

export interface User {
  id: number
  username: string          // 로그인 ID
  display_name: string      // 표시명
  email?: string           // 이메일 (선택)
  password_hash: string    // 비밀번호 해시
  role: 'admin' | 'user'   // 권한
  company_id: number       // 소속 회사 ID
  is_active: boolean
  last_login?: string
  created_at: string
}

export interface UserSession {
  user_id: number
  username: string
  display_name: string
  company_id: number
  role: 'admin' | 'user'
  login_time: string
  expires_at?: string    // 🆕 추가
}

export interface LoginCredentials {
  username: string
  password: string
  remember_me?: boolean
}

export interface RegisterData {
  username: string
  password: string
  confirmPassword: string
  display_name: string
  company_name: string
  email?: string
}

export interface LoginResult {
  success: boolean
  session?: UserSession
  error?: string
}

export interface RegisterResult {
  success: boolean
  user?: User
  error?: string
}

// ============= 기존 타입들 =============

export interface Customer {
  id?: number
  name: string
  business_number?: string
  ceo_name?: string
  address?: string
  phone?: string
  email?: string
  type: 'customer' | 'supplier'  // customer_type → type 으로 통일
  contact_person?: string
  is_active: boolean
  outstanding_balance?: number  // 🆕 미수금 (누적)
  created_at?: string
  updated_at?: string  // 🆕 추가
}

export interface Product {
  id?: number
  name: string
  code?: string
  category?: string
  unit: string
  unit_price?: number  // 선택사항으로 변경 (거래처별로 다르니까)
  description?: string
  traceability_number?: string  // 🆕 기본 이력번호 추가
  origin?: string  // 🆕 원산지 (선택사항)
  slaughterhouse?: string  // 🆕 도축장 (선택사항)
  use_inventory_management?: boolean  // ✅ 재고 관리 사용 여부 추가
  is_active: boolean
  created_at?: string
  updated_at?: string  // 🆕 추가
}

export interface Transaction {
  id?: number
  customer_id: number
  customer_name?: string  // 조인 결과용
  transaction_type: 'sales' | 'purchase' | 'payment'  // 🆕 payment 추가
  transaction_date: string
  due_date?: string
  total_amount: number
  tax_amount: number
  notes?: string
  created_at?: string
  
  // 🆕 수금 거래 참조 관련
  reference_payment_id?: number  // 참조하는 수금 거래 ID
  is_displayed_in_invoice?: boolean  // 거래증에 표시되었는지
  displayed_in_transaction_id?: number  // 어느 거래에 표시되었는지
}

export interface TransactionItem {
  id?: number
  transaction_id: number
  product_id?: number
  product_name: string
  quantity: number  // kg 단위
  unit: string      // "kg"
  unit_price: number // kg당 가격
  total_price: number // quantity * unit_price
  traceability_number?: string  // 이력번호 - 새로 추가!
  origin?: string  // 🆕 원산지 (선택사항)
  slaughterhouse?: string  // 🆕 도축장 (선택사항)
  notes?: string
}

export interface TransactionWithItems {
  id?: number
  customer_id: number
  customer_name: string
  transaction_type: 'sales' | 'purchase' | 'payment'  // 🆕 payment 추가
  transaction_date: string
  due_date?: string
  total_amount: number
  tax_amount: number
  notes?: string
  status?: 'confirmed' | 'draft' | 'cancelled'  // 🆕 추가
  created_at?: string
  updated_at?: string  // 🆕 추가
  items: TransactionItem[]
  
  // 🆕 수금 거래 참조 관련
  reference_payment_id?: number  // 참조하는 수금 거래 ID
  is_displayed_in_invoice?: boolean  // 거래증에 표시되었는지 (payment 타입만)
  displayed_in_transaction_id?: number  // 어느 거래에 표시되었는지 (payment 타입만)
}

export interface TaxInvoice {
  id?: number
  transaction_id: number
  invoice_number: string
  issue_date: string
  supplier_name: string
  supplier_business_number: string
  customer_name: string
  customer_business_number: string
  total_amount: number
  tax_amount: number
  status: 'issued' | 'sent' | 'received'
  pdf_path?: string
  created_at?: string
}

export interface Company {
  id?: number
  name: string
  business_number?: string
  ceo_name?: string
  address?: string
  phone?: string
  email?: string
  business_type?: string
  tax_invoice_api_key?: string
  tax_invoice_cert_file?: string
  default_invoice_memo?: string  // 🆕 기본 메모 추가
  created_at?: string
}

// 거래처별 상품 가격 관리용 - 새로 추가!
export interface CustomerProductPrice {
  id?: number
  customer_id: number
  product_id: number
  current_price_per_kg: number
  last_updated: string
  is_active: boolean
}

// 가격 변경 이력 - 새로 추가!
export interface PriceHistory {
  id?: number
  customer_id: number
  product_id: number
  old_price: number
  new_price: number
  changed_date: string
  transaction_id?: number
  notes?: string
}

// 거래명세서 출력용 데이터
export interface DeliveryNote {
  transaction: TransactionWithItems
  customer: Customer
  company: Company
  print_date: string
}

// 🆕 거래명세서 템플릿 타입
export type InvoiceTemplate = 'default' | 'striped'

export interface InvoiceGenerateOptions {
  template: InvoiceTemplate
  showOutstandingBalance?: boolean  // 미수금 표시 여부
}

// 정렬 관련 타입 정의
export type SortOrder = 'asc' | 'desc'

export interface SortOption {
  value: string
  label: string
  icon?: string
}

export interface SortConfig {
  sortBy: string
  sortOrder: SortOrder
}

// ============= 재고 관리 시스템 타입 정의 =============

// 재고 현황
export interface ProductInventory {
  id?: number
  product_id: number
  product_name?: string          // 조인용
  current_stock: number           // 현재 재고 (kg)
  safety_stock: number            // 안전 재고 (kg)
  location?: 'frozen' | 'cold' | 'room'  // 냉동/냉장/상온
  last_updated: string
}

// 재고 이동 이력
export interface StockMovement {
  id?: number
  product_id: number
  product_name?: string
  movement_type: 'in' | 'out' | 'adjust' | 'expired'  // 입고/출고/조정/폐기
  quantity: number                // 수량 (kg)
  unit_price?: number             // 단가 (입고 시)
  lot_number?: string             // 로트번호
  expiry_date?: string            // 유통기한
  traceability_number?: string   // 이력번호
  origin?: string                 // 🆕 원산지 (선택사항)
  slaughterhouse?: string         // 🆕 도축장 (선택사항)
  transaction_id?: number         // 연결된 거래 ID
  reference_type?: 'purchase' | 'sales' | 'manual' | 'adjustment'
  reference_id?: number           // 참조 ID
  notes?: string
  created_at: string
  created_by?: string             // 작업자
}

// 재고 로트 관리
export interface StockLot {
  id?: number
  product_id: number
  product_name?: string
  lot_number: string              // LOT-20250926-001
  initial_quantity: number        // 초기 입고량
  remaining_quantity: number      // 남은 수량
  expiry_date: string            // 유통기한
  traceability_number?: string   // 이력번호
  origin?: string                 // 🆕 원산지 (선택사항)
  slaughterhouse?: string         // 🆕 도축장 (선택사항)
  supplier_id?: number           // 공급업체 ID
  supplier_name?: string         // 공급업체명
  status: 'active' | 'expired' | 'finished' | 'cancelled'  // 활성/만료/소진/취소
  created_at: string
}

// 재고 통계
export interface InventoryStats {
  totalProducts: number           // 총 상품 수
  totalStock: number              // 총 재고량 (kg)
  lowStockCount: number          // 재고 부족 상품 수
  expiringCount: number          // 유통기한 임박 상품 수 (3일 이내)
  totalValue: number             // 총 재고 금액
  expiredCount: number           // 만료된 로트 수
}
